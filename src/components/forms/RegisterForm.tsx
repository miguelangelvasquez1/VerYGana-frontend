"use client";

import React, { useEffect, useState } from "react";
import { registerUser } from "@/services/UserService";
import toast from "react-hot-toast";

type Role = "CONSUMIDOR" | "VENDEDOR" | "ANUNCIANTE";

interface Municipality {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
  municipalities: Municipality[];
}

const CATEGORIES = [
  "Música", "Tecnología", "Moda", "Deportes", "Finanzas", "Entretenimiento",
  "Cocina", "Viajes", "Salud", "Educación", "Arte", "Gaming", "Automóviles",
  "Inmobiliaria", "Belleza", "Mascotas", "Jardinería", "Fotografía", "Cine",
  "Literatura", "Fitness", "Negocios", "Ciencia", "Historia", "Idiomas"
];

export default function RegisterForm() {
  const [role, setRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);

  // 🟢 Cargar departamentos desde el JSON local
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch("/data/colombia.min.json");
        const data = await response.json();

        const mappedData = data.map((dept: any) => ({
          id: dept.id,
          name: dept.departamento,
          municipalities: dept.ciudades.map((city: string, index: number) => ({
            id: index,
            name: city,
          })),
        }));

        setDepartments(mappedData);
      } catch (error) {
        console.error("Error cargando departamentos:", error);
        toast.error("Error al cargar departamentos");
      }
    };
    loadDepartments();
  }, []);

  // 🟢 Cargar municipios al seleccionar departamento
  useEffect(() => {
    if (formData.department) {
      setLoadingMunicipalities(true);
      const dept = departments.find((d) => d.name === formData.department);
      if (dept) {
        setMunicipalities(dept.municipalities);
      } else {
        setMunicipalities([]);
      }
      setLoadingMunicipalities(false);
    }
  }, [formData.department, departments]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
      ...(name === "department" && { municipio: "" }),
    }));
  };

  const handleCheckboxChange = (category: string) => {
    setFormData((prev: any) => ({
      ...prev,
      categories: prev.categories?.includes(category)
        ? prev.categories.filter((c: string) => c !== category)
        : [...(prev.categories || []), category],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { ...formData, role };

    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    try {
      const response = await registerUser(payload);
      console.log("Usuario registrado:", response);
      toast.success("¡Registro exitoso!");
      setFormData({});
      setRole(null);
    } catch (error) {
      console.error(error);
      toast.error("Error en el registro");
    }
  };

  // 🟣 PANTALLA 1 — Selección de rol
  if (!role) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-8 bg-white rounded-2xl shadow-lg text-center">
        <h2 className="text-3xl font-bold mb-4">Crear cuenta</h2>
        <p className="text-gray-600 mb-6">Selecciona tu tipo de usuario para comenzar</p>

        <div className="grid gap-4">
          <button
            onClick={() => setRole("CONSUMIDOR")}
            className="p-3 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition"
          >
            🛍️ Soy Consumidor
          </button>
          <button
            onClick={() => setRole("VENDEDOR")}
            className="p-3 border-2 border-green-500 rounded-lg hover:bg-green-50 transition"
          >
            🏪 Soy Vendedor
          </button>
          <button
            onClick={() => setRole("ANUNCIANTE")}
            className="p-3 border-2 border-purple-500 rounded-lg hover:bg-purple-50 transition"
          >
            📢 Soy Anunciante
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-blue-600 font-semibold hover:underline">
            Inicia sesión aquí
          </a>
        </p>
      </div>
    );
  }

  // 🟢 PANTALLA 2 — Formulario por rol
   return (
    <div className="max-w-2xl w-full mx-auto my-8 sm:my-12 px-4 sm:px-8 py-8 bg-white rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-2 text-center">Crear cuenta</h2>
      <p className="text-center text-gray-600 mb-6">Completa la información para registrarte</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 🔹 CONSUMIDOR */}
        {role === "CONSUMIDOR" && (
          <>
            <div className="space-y-4">
              {/* Nombre y Apellidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  name="name"
                  placeholder="Nombre"
                  onChange={handleChange}
                  className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
                <input
                  name="lastNames"
                  placeholder="Apellidos"
                  onChange={handleChange}
                  className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
              </div>

              {/* Email */}
              <input
                type="email"
                name="email"
                placeholder="Correo electrónico"
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                required
              />

              {/* Teléfono */}
              <input
                name="phoneNumber"
                placeholder="Teléfono"
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                required
              />

              {/* Contraseñas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="password"
                  name="password"
                  placeholder="Contraseña"
                  onChange={handleChange}
                  className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirmar contraseña"
                  onChange={handleChange}
                  className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
              </div>

              {/* Ubicación */}
              <div>
                <label className="block font-semibold text-gray-700 mb-2">Departamento</label>
                <select
                  name="department"
                  onChange={handleChange}
                  value={formData.department || ""}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                >
                  <option value="">Selecciona tu departamento</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-2">Municipio</label>
                <select
                  name="municipio"
                  onChange={handleChange}
                  value={formData.municipio || ""}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition disabled:opacity-50"
                  required
                  disabled={!formData.department || loadingMunicipalities}
                >
                  <option value="">
                    {!formData.department
                      ? "Selecciona primero el departamento"
                      : loadingMunicipalities
                        ? "Cargando municipios..."
                        : "Selecciona tu municipio"}
                  </option>
                  {municipalities.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dirección */}
              <input
                name="address"
                placeholder="Dirección"
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                required
              />

              {/* Intereses */}
              <div>
                <h3 className="font-semibold text-lg text-gray-700 mb-3">Intereses</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 p-4 bg-gray-100 border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-200 p-2 rounded transition">
                      <input
                        type="checkbox"
                        checked={formData.categories?.includes(cat) || false}
                        onChange={() => handleCheckboxChange(cat)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 🔹 VENDEDOR */}
        {role === "VENDEDOR" && (
          <div className="space-y-4">
            <input
              name="shopName"
              placeholder="Nombre del negocio"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              required
            />
            <input
              name="nit"
              placeholder="NIT"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              required
            />
            <input
              name="phoneNumber"
              placeholder="Teléfono"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="password"
                name="password"
                placeholder="Contraseña"
                onChange={handleChange}
                className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                required
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirmar contraseña"
                onChange={handleChange}
                className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                required
              />
            </div>

            <input
              name="principalAddress"
              placeholder="Dirección principal"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              required
            />
          </div>
        )}

        {/* 🔹 ANUNCIANTE */}
        {role === "ANUNCIANTE" && (
          <div className="space-y-4">
            <input
              name="name"
              placeholder="Nombre o empresa"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              required
            />
            <input
              name="phoneNumber"
              placeholder="Teléfono"
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="password"
                name="password"
                placeholder="Contraseña"
                onChange={handleChange}
                className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                required
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirmar contraseña"
                onChange={handleChange}
                className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                required
              />
            </div>
          </div>
        )}

        {/* 🔘 BOTONES */}
        <div className="space-y-3 pt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white w-full py-3 rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md"
          >
            Registrarse
          </button>

          <button
            type="button"
            onClick={() => setRole(null)}
            className="text-gray-500 text-sm hover:text-gray-700 hover:underline w-full transition"
          >
            ← Volver a selección de rol
          </button>
        </div>
      </form>
    </div>
  );
}



