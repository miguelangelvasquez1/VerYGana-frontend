"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  UserRound,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  ProfileService,
  CommercialProfileEditRequestDTO,
} from "@/services/commercial/ProfileService";
import type { LegalRepDocType } from "@/services/commercial/OnboardingService";
import {
  FieldWrapper,
  inputCls,
  BoolToggle,
  FieldErrors,
  extractApiError,
} from "@/components/commercial/onboarding/onboarding.shared";
import { WizardConfirmModal } from "@/components/commercial/balance/balance.shared";

type ProfileForm = {
  email: string;
  phoneNumber: string;
  address: string;
  legalRepFirstName: string;
  legalRepLastName: string;
  legalRepDocType: LegalRepDocType | "";
  legalRepDocNumber: string;
  legalRepPepDeclaration: boolean;
  whatsappAvailable: boolean;
  whatsappNumber: string;
};

const EMPTY_FORM: ProfileForm = {
  email: "",
  phoneNumber: "",
  address: "",
  legalRepFirstName: "",
  legalRepLastName: "",
  legalRepDocType: "",
  legalRepDocNumber: "",
  legalRepPepDeclaration: false,
  whatsappAvailable: false,
  whatsappNumber: "",
};

// Clave (no corresponde a un campo real) bajo la que `resolveFieldErrors`
// deja el error de regla de negocio del representante legal, para mostrarlo
// como banner dentro de la sección en vez de junto a un input.
const LEGAL_REP_SECTION_ERROR = "legalRepSection";

interface ReadOnlyIdentity {
  companyName: string;
  nit: string;
  mercantileRegistration: string | null;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-700 mt-1">{value}</p>
    </div>
  );
}

/**
 * El backend solo envía `details` (mapa campo→mensaje) para errores 400 de
 * validación. Los 409 de duplicado (email/teléfono ya usados) llegan con un
 * `message` en texto libre, así que inferimos a qué campo pertenece buscando
 * palabras clave para poder mostrarlo junto al input correcto. Igual con el
 * 400 sin `details` por contrato en revisión/pendiente de firma: no es de un
 * campo sino de la sección, y se guarda bajo `LEGAL_REP_SECTION_ERROR`.
 */
function resolveFieldErrors(err: unknown): { message: string; fieldErrors: FieldErrors } {
  const { message, details } = extractApiError(err);
  if (details && Object.keys(details).length > 0) {
    return { message, fieldErrors: details };
  }

  const status = (err as { response?: { status?: number } })?.response?.status;
  if (status === 400 && message.toLowerCase().includes("representante legal")) {
    return { message, fieldErrors: { [LEGAL_REP_SECTION_ERROR]: message } };
  }
  if (status === 409) {
    const lower = message.toLowerCase();
    if (lower.includes("correo") || lower.includes("email")) {
      return { message, fieldErrors: { email: message } };
    }
    if (lower.includes("teléfono") || lower.includes("telefono") || lower.includes("celular")) {
      return { message, fieldErrors: { phoneNumber: message } };
    }
  }

  return { message, fieldErrors: {} };
}

export default function EditCommercialProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [identity, setIdentity] = useState<ReadOnlyIdentity | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  // Lo cargado del GET, para detectar si el representante legal cambió.
  const [initialForm, setInitialForm] = useState<ProfileForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showLegalRepConfirm, setShowLegalRepConfirm] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await ProfileService.getProfile();
        setIdentity({
          companyName: data.companyName,
          nit: data.nit,
          mercantileRegistration: data.mercantileRegistration,
        });
        const loaded: ProfileForm = {
          email: data.email,
          phoneNumber: data.phoneNumber,
          address: data.address || "",
          legalRepFirstName: data.legalRepFirstName || "",
          legalRepLastName: data.legalRepLastName || "",
          legalRepDocType: data.legalRepDocType ?? "",
          legalRepDocNumber: data.legalRepDocNumber ?? "",
          legalRepPepDeclaration: Boolean(data.legalRepPepDeclaration),
          whatsappAvailable: data.whatsappAvailable,
          whatsappNumber: data.whatsappNumber || "",
        };
        setForm(loaded);
        setInitialForm(loaded);
      } catch (error) {
        console.error("Error cargando perfil comercial:", error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const onChange = <K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleWhatsappToggle = (value: boolean) => {
    setForm((prev) => ({
      ...prev,
      whatsappAvailable: value,
      whatsappNumber: value ? prev.whatsappNumber : "",
    }));
  };

  // Nombres, apellidos y número de documento se comparan sin espacios
  // sobrantes, porque así se envían. Cambiar solo la declaración PEP no
  // cuenta como cambiar de representante.
  const legalRepChanged =
    form.legalRepFirstName.trim() !== initialForm.legalRepFirstName.trim() ||
    form.legalRepLastName.trim() !== initialForm.legalRepLastName.trim() ||
    form.legalRepDocType !== initialForm.legalRepDocType ||
    form.legalRepDocNumber.trim() !== initialForm.legalRepDocNumber.trim();

  const validate = (): FieldErrors => {
    const found: FieldErrors = {};
    if (!form.legalRepFirstName.trim()) {
      found["legalRepFirstName"] = "Ingresa los nombres del representante legal";
    }
    if (!form.legalRepLastName.trim()) {
      found["legalRepLastName"] = "Ingresa los apellidos del representante legal";
    }
    if (!form.legalRepDocType) {
      found["legalRepDocType"] = "Selecciona el tipo de documento";
    }
    if (!form.legalRepDocNumber.trim()) {
      found["legalRepDocNumber"] = "Ingresa el número de documento";
    }
    return found;
  };

  const saveProfile = async () => {
    // Ya validado en handleSubmit; el guard es para el tipo.
    if (!form.legalRepDocType) return;

    setErrors({});
    setSaving(true);

    const payload: CommercialProfileEditRequestDTO = {
      email: form.email,
      phoneNumber: form.phoneNumber,
      address: form.address,
      legalRepFirstName: form.legalRepFirstName.trim(),
      legalRepLastName: form.legalRepLastName.trim(),
      legalRepDocType: form.legalRepDocType,
      legalRepDocNumber: form.legalRepDocNumber.trim(),
      legalRepPepDeclaration: form.legalRepPepDeclaration,
      whatsappAvailable: form.whatsappAvailable,
      whatsappNumber: form.whatsappAvailable ? form.whatsappNumber : null,
    };

    try {
      await ProfileService.updateProfile(payload);
      toast.success("Perfil actualizado correctamente");
      router.push("/commercial/profile");
    } catch (error) {
      // El form no se toca: el usuario conserva lo que escribió.
      console.error("Error actualizando perfil comercial:", error);
      const { message, fieldErrors } = resolveFieldErrors(error);
      setErrors(fieldErrors);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    if (legalRepChanged) {
      setShowLegalRepConfirm(true);
      return;
    }
    void saveProfile();
  };

  // Solo tiene sentido mientras el representante siga distinto al cargado:
  // si el usuario lo revierte para poder guardar lo demás, el aviso sobra.
  const legalRepSectionError = legalRepChanged ? errors[LEGAL_REP_SECTION_ERROR] : undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-9 h-9 border-4 border-[#03548C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError || !identity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle className="w-14 h-14 text-gray-300" />
        <p className="text-lg font-semibold text-gray-600">No se pudo cargar el perfil</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-14">
      <Link
        href="/commercial/profile"
        className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a mi perfil
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Editar mi perfil</h1>
        <p className="text-sm text-gray-500 mt-1">
          Actualiza tus datos de contacto, dirección, representante legal y disponibilidad de WhatsApp.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sección: Identidad de la empresa (solo lectura) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Identidad de la empresa
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField label="Razón social" value={identity.companyName} />
            <ReadOnlyField label="NIT" value={identity.nit} />
            {identity.mercantileRegistration && (
              <ReadOnlyField label="Matrícula mercantil" value={identity.mercantileRegistration} />
            )}
          </div>
          <p className="text-xs text-gray-400">
            Para corregir el NIT o la matrícula mercantil, contacta a soporte.
          </p>
        </div>

        {/* Sección: Contacto */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Información de contacto
          </h2>
          <FieldWrapper label="Email" required error={errors["email"]}>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                className={`${inputCls(!!errors["email"])} pl-10`}
              />
            </div>
          </FieldWrapper>
          <FieldWrapper label="Número de teléfono" required error={errors["phoneNumber"]}>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                value={form.phoneNumber}
                onChange={(e) => onChange("phoneNumber", e.target.value)}
                placeholder="3001234567"
                maxLength={15}
                className={`${inputCls(!!errors["phoneNumber"])} pl-10`}
              />
            </div>
          </FieldWrapper>
          <FieldWrapper label="Dirección" required error={errors["address"]}>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                value={form.address}
                onChange={(e) => onChange("address", e.target.value)}
                maxLength={300}
                className={`${inputCls(!!errors["address"])} pl-10`}
              />
            </div>
          </FieldWrapper>
        </div>

        {/* Sección: Representante legal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Representante legal
            </h2>
            <p className="text-xs text-gray-400">
              Aquí puedes corregir los datos del representante legal o reemplazarlo por otra persona.
            </p>
          </div>
          {legalRepSectionError && (
            <div
              role="alert"
              className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{legalRepSectionError}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Nombres" required error={errors["legalRepFirstName"]}>
              <div className="relative">
                <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  value={form.legalRepFirstName}
                  onChange={(e) => onChange("legalRepFirstName", e.target.value)}
                  maxLength={100}
                  className={`${inputCls(!!errors["legalRepFirstName"])} pl-10`}
                />
              </div>
            </FieldWrapper>
            <FieldWrapper label="Apellidos" required error={errors["legalRepLastName"]}>
              <div className="relative">
                <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  value={form.legalRepLastName}
                  onChange={(e) => onChange("legalRepLastName", e.target.value)}
                  maxLength={100}
                  className={`${inputCls(!!errors["legalRepLastName"])} pl-10`}
                />
              </div>
            </FieldWrapper>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Tipo de documento" required error={errors["legalRepDocType"]}>
              <select
                value={form.legalRepDocType}
                onChange={(e) => onChange("legalRepDocType", e.target.value as LegalRepDocType | "")}
                className={inputCls(!!errors["legalRepDocType"])}
              >
                <option value="">Selecciona</option>
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="PP">PP</option>
              </select>
            </FieldWrapper>
            <FieldWrapper label="Número de documento" required error={errors["legalRepDocNumber"]}>
              <input
                value={form.legalRepDocNumber}
                onChange={(e) => onChange("legalRepDocNumber", e.target.value)}
                placeholder="1234567890"
                maxLength={20}
                className={inputCls(!!errors["legalRepDocNumber"])}
              />
            </FieldWrapper>
          </div>
          <FieldWrapper
            label="¿El representante legal es una Persona Expuesta Políticamente (PEP)?"
            required
            error={errors["legalRepPepDeclaration"]}
          >
            <BoolToggle
              value={form.legalRepPepDeclaration}
              onChange={(v) => onChange("legalRepPepDeclaration", v)}
              error={errors["legalRepPepDeclaration"]}
            />
          </FieldWrapper>
          {legalRepChanged && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Estás cambiando el representante legal. Este cambio queda registrado en tu cuenta.
              </p>
            </div>
          )}
        </div>

        {/* Sección: WhatsApp */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">WhatsApp</h2>
          <FieldWrapper label="¿Tienes WhatsApp disponible?" error={errors["whatsappAvailable"]}>
            <BoolToggle value={form.whatsappAvailable} onChange={handleWhatsappToggle} error={errors["whatsappAvailable"]} />
          </FieldWrapper>
          {!form.whatsappAvailable && (
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800">
                Aún no tienes WhatsApp configurado. Actívalo para que tus clientes puedan escribirte
                directamente — las cuentas con WhatsApp disponible generan más confianza y ventas.
              </p>
            </div>
          )}
          {form.whatsappAvailable && (
            <FieldWrapper label="Número de WhatsApp" required error={errors["whatsappNumber"]}>
              <input
                value={form.whatsappNumber}
                onChange={(e) => onChange("whatsappNumber", e.target.value)}
                placeholder="3001234567"
                maxLength={15}
                className={inputCls(!!errors["whatsappNumber"])}
              />
            </FieldWrapper>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/commercial/profile"
            className="flex-1 flex justify-center items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-5 py-3 rounded-xl font-semibold transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex justify-center items-center gap-2 bg-[#03548C] hover:bg-[#0b1440] disabled:bg-gray-400 text-white px-5 py-3 rounded-xl font-semibold transition text-sm cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>

      <WizardConfirmModal
        isOpen={showLegalRepConfirm}
        title="Cambiar el representante legal"
        description={`Vas a registrar a ${form.legalRepFirstName.trim()} ${form.legalRepLastName.trim()} (${form.legalRepDocType} ${form.legalRepDocNumber.trim()}) como representante legal de tu cuenta. Este cambio queda registrado. ¿Deseas continuar?`}
        confirmLabel="Sí, cambiar y guardar"
        cancelLabel="Volver a revisar"
        tone="warning"
        onConfirm={saveProfile}
        onClose={() => setShowLegalRepConfirm(false)}
      />
    </div>
  );
}
