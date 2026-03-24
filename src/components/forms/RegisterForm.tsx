"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { registerConsumer } from "@/services/ConsumerService";
import { registerCommercial } from "@/services/AdvertiserService";
import { Category } from "@/types/Category.types";
import { useCategories } from "@/hooks/useCategories";

type Role = "BENEFICIARIO" | "COMERCIANTE";

interface Municipality {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
  municipalities: Municipality[];
}


export default function RegisterForm() {
  const [role, setRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { categories, loading, error, refetch } = useCategories();

  // const CategoryService cs;
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
      ...(name === "department" && { municipality: "" }),
    }));
  };

   // 🔄 CAMBIO IMPORTANTE: Ahora maneja objetos Category completos
  const handleCheckboxChange = (category: Category) => {
    setFormData((prev: any) => {
      const currentCategories = prev.categories || [];
      
      // Verificar si la categoría ya está seleccionada (comparar por ID)
      const isSelected = currentCategories.some((cat: Category) => cat.id === category.id);
      
      if (isSelected) {
        // Remover la categoría
        return {
          ...prev,
          categories: currentCategories.filter((cat: Category) => cat.id !== category.id)
        };
      } else {
        // Agregar la categoría
        return {
          ...prev,
          categories: [...currentCategories, category]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de contraseñas
    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    // Prevenir envíos múltiples
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let response;

      // 🔹 Registro según el rol seleccionado
      switch (role) {
        case "BENEFICIARIO":
          response = await registerConsumer({
            email: formData.email,
            password: formData.password,
            phoneNumber: formData.phoneNumber,
            name: formData.name,
            lastNames: formData.lastNames,
            department: formData.department,
            municipality: formData.municipality,
            categories: formData.categories || []
          });
          break;

        case "COMERCIANTE":
          response = await registerCommercial({
            email: formData.email,
            password: formData.password,
            phoneNumber: formData.phoneNumber,
            name: formData.name,
            nit: formData.nit
          });
          break;

        default:
          throw new Error("Rol no válido");
      }

      console.log("✅ Usuario registrado exitosamente:", response);
      toast.success("¡Registro exitoso! Ahora puedes iniciar sesión");
      
      // Limpiar formulario y volver a la selección de rol
      setFormData({});
      setRole(null);
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
      window.location.href = '/login';
      }, 2000);

    } catch (error: any) {
      console.error("❌ Error en el registro:", error);
      
      // Manejo de errores más detallado
      let errorMessage = "Error en el registro. Por favor, intenta de nuevo.";
      
      if (error.response) {
        // El servidor respondió con un código de error
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || "Datos inválidos. Verifica la información.";
        } else if (error.response.status === 409) {
          errorMessage = "Este correo electrónico ya está registrado.";
        } else if (error.response.status === 500) {
          errorMessage = "Error del servidor. Intenta más tarde.";
        } else {
          errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        errorMessage = "No se pudo conectar con el servidor. Verifica tu conexión.";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
            onClick={() => setRole("BENEFICIARIO")}
            className="p-3 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition cursor-pointer"
          >
            🛍 Soy Beneficiario
          </button>
          <button
            onClick={() => setRole("COMERCIANTE")}
            className="p-3 border-2 border-purple-500 rounded-lg hover:bg-purple-50 transition cursor-pointer"
          >
            📢 Soy Comerciante
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
        {/* 🔹 BENEFICIARIO */}
        {role === "BENEFICIARIO" && (
          <>
            <div className="space-y-4">
              {/* Nombre y Apellidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  name="name"
                  placeholder="Nombre"
                  onChange={handleChange}
                  value={formData.name || ""}
                  className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
                <input
                  name="lastNames"
                  placeholder="Apellidos"
                  onChange={handleChange}
                  value={formData.lastNames || ""}
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
                value={formData.email || ""}
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                required
              />

              {/* Teléfono */}
              <input
                name="phoneNumber"
                placeholder="Teléfono"
                onChange={handleChange}
                value={formData.phoneNumber || ""}
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
                  value={formData.password || ""}
                  className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  required
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirmar contraseña"
                  onChange={handleChange}
                  value={formData.confirmPassword || ""}
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
                  name="municipality"
                  onChange={handleChange}
                  value={formData.municipality || ""}
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

              {/* Intereses */}
              <div>
                <h3 className="font-semibold text-lg text-gray-700 mb-3">
                  Intereses {loadingCategories && <span className="text-sm text-gray-500">(Cargando...)</span>}
                </h3>
                
                {loadingCategories ? (
                  <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg text-center">
                    <p className="text-gray-500">Cargando categorías...</p>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg text-center">
                    <p className="text-red-500">No se pudieron cargar las categorías. Intenta recargar la página.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 p-4 bg-gray-100 border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                    {categories.map((cat) => (
                      <label 
                        key={cat.id} 
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-200 p-2 rounded transition"
                      >
                        <input
                          type="checkbox"
                          checked={formData.categories?.some((c: Category) => c.id === cat.id) || false}
                          onChange={() => handleCheckboxChange(cat)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 🔹 COMERCIANTE */}
        {role === "COMERCIANTE" && (
          <div className="space-y-4">
            <input
              name="name"
              placeholder="Nombre o empresa"
              onChange={handleChange}
              value={formData.name || ""}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              required
            />
            <input
              name="nit"
              placeholder="NIT"
              onChange={handleChange}
              value={formData.nit || ""}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              onChange={handleChange}
              value={formData.email || ""}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              required
            />
            <input
              name="phoneNumber"
              placeholder="Teléfono"
              onChange={handleChange}
              value={formData.phoneNumber || ""}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="password"
                name="password"
                placeholder="Contraseña"
                onChange={handleChange}
                value={formData.password || ""}
                className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                required
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirmar contraseña"
                onChange={handleChange}
                value={formData.confirmPassword || ""}
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
            disabled={isSubmitting}
            className={`bg-blue-600 text-white w-full py-3 rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Registrando...' : 'Registrarse'}
          </button>

          <button
            type="button"
            onClick={() => setRole(null)}
            disabled={isSubmitting}
            className="text-gray-500 text-sm hover:text-gray-700 hover:underline w-full transition"
          >
            ← Volver a selección de rol
          </button>
        </div>
      </form>
    </div>
  );
}