import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useDepartments, useMunicipalities } from "@/hooks/useLocation";
import type {
  AnnualIncomeRange,
  LegalIdentificationRequest,
  LegalRepDocType,
  PersonType,
} from "@/services/commercial/OnboardingService";
import { BoolToggle, FieldWrapper, FieldErrors, inputCls, StepButton } from "../onboarding.shared";

export type LegalIdentificationForm = Partial<LegalIdentificationRequest>;

interface Municipality {
  code: string;
  name: string;
}

interface Props {
  form: LegalIdentificationForm;
  errors: FieldErrors;
  submitting: boolean;
  onChange: <K extends keyof LegalIdentificationForm>(field: K, value: LegalIdentificationForm[K]) => void;
  onNext: () => void;
}

export function LegalIdentificationStep({ form, errors, submitting, onChange, onNext }: Props) {
  const [departmentCode, setDepartmentCode] = useState("");
  const { departments = [], isLoading: loadingDepartments } = useDepartments();
  const { municipalities, loading: loadingMunicipalities } = useMunicipalities(departmentCode || null);

  const isJuridica = form.personType === "JURIDICA";

  const handleMunicipalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = municipalities.find((m: Municipality) => m.code === code);
    onChange("municipalityCode", code || undefined);
    void selected;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Identificación legal</h3>
        <p className="text-sm text-gray-500">
          Cuéntanos si operas como persona natural o jurídica y quién es tu representante legal.
        </p>
      </div>

      <FieldWrapper label="Tipo de persona" required error={errors["personType"]}>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: "NATURAL", label: "Persona Natural" },
            { value: "JURIDICA", label: "Persona Jurídica" },
          ] as { value: PersonType; label: string }[]).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange("personType", opt.value)}
              className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition
                ${
                  form.personType === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FieldWrapper>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper
          label="Razón social o nombre de la empresa"
          required={isJuridica}
          error={errors["companyName"]}
          hint={!isJuridica ? "Opcional — si no la indicas, usamos el nombre completo del representante legal" : undefined}
        >
          <input
            value={form.companyName || ""}
            onChange={(e) => onChange("companyName", e.target.value)}
            placeholder="Nombre de la empresa"
            maxLength={100}
            className={inputCls(!!errors["companyName"])}
          />
        </FieldWrapper>
        <FieldWrapper
          label="NIT"
          required
          error={errors["nit"]}
        >
          <input
            value={form.nit || ""}
            onChange={(e) => onChange("nit", e.target.value)}
            placeholder="900.000.000-0"
            maxLength={10}
            className={inputCls(!!errors["nit"])}
          />
        </FieldWrapper>
        <FieldWrapper label="Matrícula mercantil" error={errors["mercantileRegistration"]} hint="Opcional">
          <input
            value={form.mercantileRegistration || ""}
            onChange={(e) => onChange("mercantileRegistration", e.target.value)}
            placeholder="Opcional"
            maxLength={20}
            className={inputCls(!!errors["mercantileRegistration"])}
          />
        </FieldWrapper>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper label="Nombres del representante legal" required error={errors["legalRepFirstName"]}>
          <input
            value={form.legalRepFirstName || ""}
            onChange={(e) => onChange("legalRepFirstName", e.target.value)}
            placeholder="Nombres"
            maxLength={50}
            className={inputCls(!!errors["legalRepFirstName"])}
          />
        </FieldWrapper>
        <FieldWrapper label="Apellidos del representante legal" required error={errors["legalRepLastName"]}>
          <input
            value={form.legalRepLastName || ""}
            onChange={(e) => onChange("legalRepLastName", e.target.value)}
            placeholder="Apellidos"
            maxLength={50}
            className={inputCls(!!errors["legalRepLastName"])}
          />
        </FieldWrapper>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper label="Tipo de documento" required error={errors["legalRepDocType"]}>
          <select
            value={form.legalRepDocType || ""}
            onChange={(e) => onChange("legalRepDocType", e.target.value as LegalRepDocType)}
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
            value={form.legalRepDocNumber || ""}
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
      {form.legalRepPepDeclaration === true && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Al declarar que el representante legal es PEP, tu cuenta pasará a 
            revisión exhaustiva por parte del equipo de cumplimiento.
          </p>
        </div>
      )}

      <FieldWrapper label="Rango de ingresos anuales del negocio" error={errors["annualIncomeRange"]} hint="Opcional">
        <select
          value={form.annualIncomeRange || ""}
          onChange={(e) => onChange("annualIncomeRange", (e.target.value || undefined) as AnnualIncomeRange | undefined)}
          className={inputCls(!!errors["annualIncomeRange"])}
        >
          <option value="">Selecciona (opcional)</option>
          <option value="LESS_THAN_500_SMMLV">Menos de 500 SMMLV</option>
          <option value="FROM_500_TO_5000_SMMLV">500 a 5.000 SMMLV</option>
          <option value="FROM_5000_TO_50000_SMMLV">5.000 a 50.000 SMMLV</option>
          <option value="MORE_THAN_50000_SMMLV">Más de 50.000 SMMLV</option>
        </select>
      </FieldWrapper>

      <FieldWrapper label="Descripción de la actividad económica" required error={errors["economicActivityDescription"]}>
        <textarea
          value={form.economicActivityDescription || ""}
          onChange={(e) => onChange("economicActivityDescription", e.target.value)}
          placeholder="Ej. Venta al por menor de productos electrónicos"
          rows={3}
          maxLength={500}
          className={inputCls(!!errors["economicActivityDescription"])}
        />
      </FieldWrapper>

      <FieldWrapper label="Código CIIU" error={errors["ciiuCode"]} hint="Opcional">
        <input
          value={form.ciiuCode || ""}
          onChange={(e) => onChange("ciiuCode", e.target.value)}
          placeholder="Ej. 4711"
          maxLength={10}
          className={inputCls(!!errors["ciiuCode"])}
        />
      </FieldWrapper>

      <FieldWrapper label="Dirección" required error={errors["address"]}>
        <input
          value={form.address || ""}
          onChange={(e) => onChange("address", e.target.value)}
          placeholder="Ej. Calle 10 # 20-30"
          maxLength={100}
          className={inputCls(!!errors["address"])}
        />
      </FieldWrapper>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper label="Departamento" hint="Opcional, para ubicar el municipio">
          <select
            value={departmentCode}
            onChange={(e) => {
              setDepartmentCode(e.target.value);
              onChange("municipalityCode", undefined);
            }}
            disabled={loadingDepartments}
            className={inputCls(false)}
          >
            <option value="">
              {loadingDepartments ? "Cargando departamentos..." : "Selecciona tu departamento"}
            </option>
            {departments.map((d: { code: string; name: string }) => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </select>
        </FieldWrapper>

        <FieldWrapper label="Municipio" error={errors["municipalityCode"]} hint="Opcional">
          <select
            value={form.municipalityCode || ""}
            onChange={handleMunicipalityChange}
            disabled={!departmentCode || loadingMunicipalities}
            className={inputCls(!!errors["municipalityCode"])}
          >
            <option value="">
              {!departmentCode
                ? "Selecciona primero el departamento"
                : loadingMunicipalities
                ? "Cargando municipios..."
                : "Selecciona tu municipio"}
            </option>
            {municipalities?.map((m: Municipality) => (
              <option key={m.code} value={m.code}>{m.name}</option>
            ))}
          </select>
        </FieldWrapper>
      </div>

      <StepButton submitting={submitting} onClick={onNext} />
    </div>
  );
}
