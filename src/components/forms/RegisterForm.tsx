"use client";

import { useState, useEffect } from "react";
import { registerUser } from "@/services/UserService";
import toast from "react-hot-toast";

// Interfaces del JSON
interface Municipality {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
  municipalities: Municipality[];
}

interface FormData {
  // Datos básicos
  nombre: string;
  apellidos: string;
  correo: string;
  telefono: string;
  contrasena: string;
  confirmarContrasena: string;

  // Datos de ubicación
  departamento: string;
  municipio: string;
  direccion: string;

  // Intereses
  intereses: string[];

  [key: string]: string | string[];
}

// Categorías de interés
const INTEREST_CATEGORIES = [
  "Música", "Tecnología", "Moda", "Deportes", "Finanzas", "Entretenimiento",
  "Cocina", "Viajes", "Salud", "Educación", "Arte", "Gaming", "Automóviles",
  "Inmobiliaria", "Belleza", "Mascotas", "Jardinería", "Fotografía", "Cine",
  "Literatura", "Fitness", "Negocios", "Ciencia", "Historia", "Idiomas"
];

export default function RegisterForm() {
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    apellidos: "",
    correo: "",
    telefono: "",
    contrasena: "",
    confirmarContrasena: "",
    departamento: "",
    municipio: "",
    direccion: "",
    intereses: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Estados para departamentos y municipios
  const [departments, setDepartments] = useState<Department[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);

  // Cargar JSON local de departamentos y municipios
  useEffect(() => {
  const loadDepartments = async () => {
    try {
      const response = await fetch("/data/colombia.min.json");
      const data = await response.json();

      // Adaptamos el formato al que espera el componente
      const mappedData = data.map((dept: any) => ({
        id: dept.id,
        name: dept.departamento, // en tu JSON la clave es "departamento"
        municipalities: dept.ciudades.map((city: string, index: number) => ({
          id: index, // asignamos un id incremental
          name: city // el nombre de la ciudad
        }))
      }));

      setDepartments(mappedData);
    } catch (error) {
      console.error("Error al cargar los departamentos:", error);
    }
  };

  loadDepartments();
}, []);


  // Cargar municipios al cambiar departamento
  useEffect(() => {
    if (formData.departamento) {
      setLoadingMunicipalities(true);
      setTimeout(() => {
        const dept = departments.find((d) => d.name === formData.departamento);
        if (dept) {
          setMunicipalities(dept.municipalities);
        } else {
          setMunicipalities([]);
          toast.error(`No se encontraron municipios para ${formData.departamento}`);
        }
        setLoadingMunicipalities(false);
      }, 400); // pequeño delay para UX
    } else {
      setMunicipalities([]);
    }
  }, [formData.departamento, departments]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === "departamento" && { municipio: "" }) // reset municipio
    }));

    if (name === "departamento") {
      setMunicipalities([]);
    }
  };

  const handleInterestChange = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      intereses: prev.intereses.includes(interest)
        ? prev.intereses.filter(i => i !== interest)
        : [...prev.intereses, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.nombre.trim() || !formData.apellidos.trim() || !formData.correo.trim() ||
      !formData.contrasena.trim() || !formData.confirmarContrasena.trim()) {
      toast.error("Los campos básicos son obligatorios");
      return;
    }

    if (formData.contrasena !== formData.confirmarContrasena) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (!formData.departamento || !formData.municipio) {
      toast.error("Selecciona tu ubicación");
      return;
    }

    if (formData.intereses.length < 3) {
      toast.error("Selecciona al menos 3 categorías de interés");
      return;
    }

    setIsLoading(true);
    try {
      const mappedData = {
        name: formData.nombre,
        lastNames: formData.apellidos,
        email: formData.correo,
        phoneNumber: formData.telefono,
        password: formData.contrasena,
        department: formData.departamento,
        municipality: formData.municipio,
        address: formData.direccion,
        interests: formData.intereses
      };

      const response = await registerUser(mappedData);
      console.log("user registered", response);
      toast.success("Registro exitoso");

      // Reset form
      setFormData({
        nombre: "", apellidos: "", correo: "", telefono: "", contrasena: "",
        confirmarContrasena: "", departamento: "", municipio: "", direccion: "", intereses: []
      });
      setMunicipalities([]);
      setCurrentStep(1);

    } catch (error) {
      console.error("Error registering user:", error);
      toast.error("Hubo un error al registrar. Inténtalo nuevamente");
    } finally {
      setIsLoading(false);
    }
  };

  const basicFields = [
    { label: "Nombre", name: "nombre", placeholder: "Ingresa tu nombre" },
    { label: "Apellidos", name: "apellidos", placeholder: "Ingresa tus apellidos" },
    { label: "Correo electrónico", name: "correo", type: "email", placeholder: "ejemplo@correo.com" },
    { label: "Número de teléfono", name: "telefono", type: "tel", placeholder: "Ej: +57 300 123 4567" },
    { label: "Contraseña", name: "contrasena", type: "password", placeholder: "Mínimo 8 caracteres" },
    { label: "Confirmar contraseña", name: "confirmarContrasena", type: "password", placeholder: "Repite tu contraseña" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ---- Progress indicator ---- */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                ${currentStep >= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-2 ${currentStep > step ? "bg-blue-600" : "bg-gray-200"}`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <span className="text-sm text-gray-600">
            {currentStep === 1 && "Información básica"}
            {currentStep === 2 && "Ubicación"}
            {currentStep === 3 && "Intereses"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ---- Step 1 ---- */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Información básica</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {basicFields.map(({ label, name, type = "text", placeholder }) => (
                <div key={name} className={name === "correo" || name === "telefono" ? "sm:col-span-2" : ""}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor={name}>
                    {label}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type={type}
                    name={name}
                    id={name}
                    value={formData[name] as string}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                             transition-all duration-200 ease-in-out hover:border-gray-400
                             text-gray-900 placeholder-gray-500 bg-white text-sm"
                    required
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- Step 2 ---- */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ubicación</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Departamento <span className="text-red-500">*</span>
                </label>
                <select
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                           transition-all duration-200 text-gray-900 bg-white text-sm"
                  required
                >
                  <option value="">Selecciona tu departamento</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Municipio <span className="text-red-500">*</span>
                </label>
                <select
                  name="municipio"
                  value={formData.municipio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                           transition-all duration-200 text-gray-900 bg-white text-sm"
                  required
                  disabled={!formData.departamento || loadingMunicipalities}
                >
                  <option value="">
                    {!formData.departamento
                      ? "Primero selecciona el departamento"
                      : loadingMunicipalities
                        ? "Cargando municipios..."
                        : "Selecciona tu municipio"}
                  </option>
                  {municipalities.map((mun) => (
                    <option key={mun.id} value={mun.name}>{mun.name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Dirección adicional
                </label>
                <textarea
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Barrio, calle, número, etc. (opcional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                           transition-all duration-200 text-gray-900 placeholder-gray-500 bg-white text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* ---- Step 3 ---- */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Intereses</h2>
              <p className="text-sm text-gray-600 mb-4">
                Selecciona al menos 3 categorías que te interesan. Esto nos ayudará a mostrarte anuncios relevantes.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {INTEREST_CATEGORIES.map((category) => (
                <div key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`interest-${category}`}
                    checked={formData.intereses.includes(category)}
                    onChange={() => handleInterestChange(category)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded 
                             focus:ring-blue-500 focus:ring-2"
                  />
                  <label
                    htmlFor={`interest-${category}`}
                    className="ml-2 text-sm text-gray-700 cursor-pointer"
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-600">
              Seleccionados: {formData.intereses.length}
              {formData.intereses.length < 3 && (
                <span className="text-red-500 ml-2">(Mínimo 3 requeridos)</span>
              )}
            </div>
          </div>
        )}

        {/* ---- Navigation ---- */}
        <div className="flex justify-between pt-6">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg
                       hover:bg-gray-50 transition-colors duration-200"
            >
              Anterior
            </button>
          )}

          <div className="ml-auto">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold 
                         py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || formData.intereses.length < 3}
                className="bg-gradient-to-r from-blue-600 to-blue-700 
                         hover:from-blue-700 hover:to-blue-800
                         disabled:from-gray-400 disabled:to-gray-500
                         text-white font-semibold py-2.5 px-6 rounded-lg
                         transition-all duration-200 ease-in-out
                         transform hover:scale-[1.02] active:scale-[0.98]
                         disabled:cursor-not-allowed disabled:transform-none
                         shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    Crear cuenta
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ---- Terms ---- */}
        {currentStep === 3 && (
          <div className="text-center text-xs sm:text-sm text-gray-600 pt-4 border-t">
            Al registrarte, aceptas nuestros{" "}
            <a href="/terminos" className="text-blue-600 hover:text-blue-700 underline">
              términos y condiciones
            </a>{" "}
            y{" "}
            <a href="/privacidad" className="text-blue-600 hover:text-blue-700 underline">
              política de privacidad
            </a>
          </div>
        )}
      </form>
    </div>
  );
}
