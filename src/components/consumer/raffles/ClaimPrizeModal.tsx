"use client";

import React, { useState, useEffect, useRef } from "react";
import { claimPrize, sendClaimEmailOtp, sendClaimPhoneOtp } from "@/services/raffleService";
import { ClaimPreferenceDeliveryMethod, PrizeWonResponseDTO } from "@/types/raffles/raffleWinner.types";

type Step = "method" | "email-contact" | "email-otp" | "sms-contact" | "sms-otp" | "success";

interface Props {
  prize: PrizeWonResponseDTO;
  registeredEmail: string;
  registeredPhone: string;
  onClose: () => void;
  onClaimed: (prizeId: number) => void;
}

const OTP_SECONDS = 600; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 60; // 1 minute

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ClaimPrizeModal({ prize, registeredEmail, registeredPhone, onClose, onClaimed }: Props) {
  const [step, setStep] = useState<Step>("method");
  const [useCustomEmail, setUseCustomEmail] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [useCustomPhone, setUseCustomPhone] = useState(false);
  const [customPhone, setCustomPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimedMethod, setClaimedMethod] = useState<ClaimPreferenceDeliveryMethod | null>(null);

  // ── Countdown timer ──
  const [timeLeft, setTimeLeft] = useState(OTP_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Resend cooldown ──
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(OTP_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const startResendCooldown = () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (step === "sms-otp" || step === "email-otp") {
      startTimer();
      startResendCooldown();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  /* ─── helpers ─── */

  const clearError = () => setError(null);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPhone = (phone: string) =>
    /^\+?[0-9\s\-]{7,15}$/.test(phone.trim());

  /* ─── STEP: choose method ─── */

  const handleChooseEmail = () => { clearError(); setStep("email-contact"); };
  const handleChooseSms = () => { clearError(); setStep("sms-contact"); };

  /* ─── STEP: email contact → submit ─── */

  const handleSubmitRegisteredEmail = async () => {
    clearError();
    setLoading(true);
    try {
      await claimPrize({
        prizeId: prize.prizeId,
        deliveryMethod: ClaimPreferenceDeliveryMethod.EMAIL,
      });
      setClaimedMethod(ClaimPreferenceDeliveryMethod.EMAIL);
      onClaimed(prize.prizeId);
      setStep("success");
    } catch {
      setError("Ocurrió un error al procesar tu solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    clearError();
    if (!isValidEmail(customEmail)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    setLoading(true);
    try {
      await sendClaimEmailOtp(customEmail.trim());
      setOtpSent(true);
      setStep("email-otp");
    } catch {
      setError("No pudimos enviar el código. Verifica el correo e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── STEP: sms contact → send OTP or submit ─── */

  const handleSendOtp = async () => {
    clearError();
    if (!isValidPhone(customPhone)) {
      setError("Ingresa un número de teléfono válido (ej: +57 300 1234567).");
      return;
    }
    setLoading(true);
    try {
      await sendClaimPhoneOtp(customPhone.trim());
      setOtpSent(true);
      setStep("sms-otp");
    } catch {
      setError("No pudimos enviar el código. Verifica el número e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRegisteredPhone = async () => {
    clearError();
    setLoading(true);
    try {
      await claimPrize({
        prizeId: prize.prizeId,
        deliveryMethod: ClaimPreferenceDeliveryMethod.SMS,
      });
      setClaimedMethod(ClaimPreferenceDeliveryMethod.SMS);
      onClaimed(prize.prizeId);
      setStep("success");
    } catch {
      setError("Ocurrió un error al procesar tu solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── STEP: OTP verify → submit ─── */

  const handleVerifyOtp = async () => {
    clearError();
    if (otpCode.trim().length < 4) {
      setError("Ingresa el código de verificación completo.");
      return;
    }
    setLoading(true);
    try {
      await claimPrize({
        prizeId: prize.prizeId,
        deliveryMethod: ClaimPreferenceDeliveryMethod.SMS,
        newPhoneNumber: customPhone.trim(),
        smsOtpCode: otpCode.trim(),
      });
      setClaimedMethod(ClaimPreferenceDeliveryMethod.SMS);
      onClaimed(prize.prizeId);
      setStep("success");
    } catch {
      setError("Código incorrecto o expirado. Vuelve a intentarlo.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    clearError();
    setOtpCode("");
    setLoading(true);
    try {
      await sendClaimPhoneOtp(customPhone.trim());
      startTimer();
      startResendCooldown();
    } catch {
      setError("No pudimos reenviar el código. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── STEP: email OTP verify → submit ─── */

  const handleVerifyEmailOtp = async () => {
    clearError();
    if (otpCode.trim().length < 4) {
      setError("Ingresa el código de verificación completo.");
      return;
    }
    setLoading(true);
    try {
      await claimPrize({
        prizeId: prize.prizeId,
        deliveryMethod: ClaimPreferenceDeliveryMethod.EMAIL,
        newEmail: customEmail.trim(),
        emailOtpCode: otpCode.trim(),
      });
      setClaimedMethod(ClaimPreferenceDeliveryMethod.EMAIL);
      onClaimed(prize.prizeId);
      setStep("success");
    } catch {
      setError("Código incorrecto o expirado. Vuelve a intentarlo.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (resendCooldown > 0) return;
    clearError();
    setOtpCode("");
    setLoading(true);
    try {
      await sendClaimEmailOtp(customEmail.trim());
      startTimer();
      startResendCooldown();
    } catch {
      setError("No pudimos reenviar el código. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── UI ─── */

  const isExpired = step === "sms-otp" && timeLeft === 0;
  const isEmailExpired = step === "email-otp" && timeLeft === 0;
  const isUrgent = timeLeft <= 60 && timeLeft > 0;
  const isWarning = timeLeft > 60 && timeLeft <= 120;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={step === "success" ? onClose : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {step !== "method" && step !== "success" && (
              <button
                onClick={() => {
                  clearError();
                  if (step === "sms-otp") { setStep("sms-contact"); setOtpCode(""); setOtpSent(false); }
                  else if (step === "email-otp") { setStep("email-contact"); setOtpCode(""); setOtpSent(false); }
                  else setStep("method");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors mr-1"
                aria-label="Volver"
              >
                ←
              </button>
            )}
            <span className="text-lg font-bold text-gray-800">
              {step === "method" && "Reclamar premio"}
              {step === "email-contact" && "Recibir por correo"}
              {step === "email-otp" && "Verificar correo"}
              {step === "sms-contact" && "Recibir por SMS"}
              {step === "sms-otp" && "Verificar número"}
              {step === "success" && "¡Listo!"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">

          {/* ── STEP: method ── */}
          {step === "method" && (
            <div className="space-y-5">
              <div className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <img
                  src={prize.imageUrl}
                  alt={prize.title}
                  className="w-14 h-14 object-cover rounded-lg shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{prize.title}</p>
                  <p className="text-sm text-gray-500">{prize.brand}</p>
                  <p className="text-sm font-bold text-green-600">${prize.value.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  ¿Cómo deseas recibir el código y las instrucciones de reclamo?
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Te enviaremos el código de reclamo junto con las instrucciones detalladas
                  por el canal que elijas.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleChooseEmail}
                    className="flex flex-col items-center gap-2 p-5 border-2 border-gray-200 rounded-2xl hover:border-[#03548C] hover:bg-[#03548C]/5 transition-all group"
                  >
                    <span className="text-3xl">📧</span>
                    <span className="font-semibold text-sm text-gray-700 group-hover:text-[#03548C]">
                      Correo electrónico
                    </span>
                    <span className="text-xs text-gray-400 text-center">
                      Recibe el código en tu email
                    </span>
                  </button>

                  <button
                    onClick={handleChooseSms}
                    className="flex flex-col items-center gap-2 p-5 border-2 border-gray-200 rounded-2xl hover:border-[#03548C] hover:bg-[#03548C]/5 transition-all group"
                  >
                    <span className="text-3xl">📱</span>
                    <span className="font-semibold text-sm text-gray-700 group-hover:text-[#03548C]">
                      Mensaje de texto
                    </span>
                    <span className="text-xs text-gray-400 text-center">
                      Recibe el código por SMS
                    </span>
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                <span className="text-amber-500 text-sm shrink-0">⚠️</span>
                <p className="text-xs text-amber-700">
                  Solo puedes reclamar este premio una vez. Asegúrate de elegir el canal
                  correcto antes de continuar.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP: email contact ── */}
          {step === "email-contact" && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600">
                Selecciona a qué correo electrónico enviamos el código y las instrucciones
                para reclamar tu premio.
              </p>

              <button
                onClick={() => { setUseCustomEmail(false); clearError(); }}
                className={`w-full flex items-start gap-3 p-4 border-2 rounded-xl transition-all text-left ${
                  !useCustomEmail
                    ? "border-[#03548C] bg-[#03548C]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  !useCustomEmail ? "border-[#03548C]" : "border-gray-400"
                }`}>
                  {!useCustomEmail && <div className="w-2 h-2 rounded-full bg-[#03548C]" />}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">Usar mi correo registrado</p>
                  <p className="text-sm text-[#03548C] font-mono mt-0.5">{registeredEmail}</p>
                  <p className="text-xs text-gray-500 mt-1">El correo con el que creaste tu cuenta</p>
                </div>
              </button>

              <button
                onClick={() => { setUseCustomEmail(true); clearError(); }}
                className={`w-full flex items-start gap-3 p-4 border-2 rounded-xl transition-all text-left ${
                  useCustomEmail
                    ? "border-[#03548C] bg-[#03548C]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  useCustomEmail ? "border-[#03548C]" : "border-gray-400"
                }`}>
                  {useCustomEmail && <div className="w-2 h-2 rounded-full bg-[#03548C]" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">Usar otro correo electrónico</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ingresa una dirección diferente</p>
                </div>
              </button>

              {useCustomEmail && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Nuevo correo electrónico
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => { setCustomEmail(e.target.value); clearError(); }}
                    placeholder="ejemplo@correo.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C] focus:border-transparent"
                    autoFocus
                  />
                </div>
              )}

              <div className="bg-[#03548C]/5 border border-[#03548C]/20 rounded-xl p-3 flex gap-2">
                <span className="text-sm shrink-0">ℹ️</span>
                <p className="text-xs text-[#03548C]">
                  El código de reclamo y las instrucciones completas serán enviados a este
                  correo. Revisa también tu carpeta de spam si no lo encuentras.
                </p>
              </div>

              {error && <ErrorBox message={error} />}

              <button
                onClick={useCustomEmail ? handleSendEmailOtp : handleSubmitRegisteredEmail}
                disabled={loading}
                className="w-full bg-[#03548C] hover:bg-[#0b1440] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading
                  ? "Procesando..."
                  : useCustomEmail
                    ? "Enviar código de verificación →"
                    : "Enviar"}
              </button>
            </div>
          )}

          {/* ── STEP: email otp ── */}
          {step === "email-otp" && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <span className="text-4xl">📩</span>
                <p className="mt-3 text-sm text-gray-700">
                  Ingresa el código de 6 dígitos que enviamos al correo
                </p>
                <p className="font-semibold text-gray-900 mt-1">{customEmail}</p>
              </div>

              {/* Countdown timer */}
              <div className={`flex items-center justify-center gap-3 py-3 px-4 rounded-xl border ${
                isEmailExpired
                  ? "bg-red-50 border-red-300"
                  : isUrgent
                    ? "bg-red-50 border-red-200"
                    : isWarning
                      ? "bg-amber-50 border-amber-200"
                      : "bg-[#03548C]/5 border-[#03548C]/20"
              }`}>
                <span className="text-lg">⏱️</span>
                <span className={`text-2xl font-bold font-mono tabular-nums ${
                  isEmailExpired || isUrgent ? "text-red-600" : isWarning ? "text-amber-600" : "text-[#03548C]"
                }`}>
                  {formatCountdown(timeLeft)}
                </span>
                <span className={`text-xs font-semibold ${
                  isEmailExpired || isUrgent ? "text-red-500" : isWarning ? "text-amber-600" : "text-[#03548C]/70"
                }`}>
                  {isEmailExpired ? "código expirado" : "tiempo restante"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 text-center">
                  Código de verificación
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={otpCode}
                  onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "")); clearError(); }}
                  placeholder="_ _ _ _ _ _"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-xl font-mono text-center tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#03548C] focus:border-transparent"
                  autoFocus
                  disabled={isEmailExpired}
                />
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">¿No recibiste el código?</p>
                <button
                  onClick={handleResendEmailOtp}
                  disabled={loading || resendCooldown > 0}
                  className="text-sm text-[#03548C] hover:text-[#0b1440] font-semibold underline disabled:opacity-50 disabled:no-underline"
                >
                  {resendCooldown > 0 ? `Reenviar código (${resendCooldown}s)` : "Reenviar código"}
                </button>
              </div>

              {error && <ErrorBox message={error} />}

              <button
                onClick={handleVerifyEmailOtp}
                disabled={loading || otpCode.length < 4 || isEmailExpired}
                className="w-full bg-[#03548C] hover:bg-[#0b1440] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? "Verificando..." : "Verificar y reclamar premio →"}
              </button>
            </div>
          )}

          {/* ── STEP: sms contact ── */}
          {step === "sms-contact" && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600">
                Selecciona a qué número de teléfono enviamos el código de reclamo por
                mensaje de texto (SMS).
              </p>

              <button
                onClick={() => { setUseCustomPhone(false); clearError(); }}
                className={`w-full flex items-start gap-3 p-4 border-2 rounded-xl transition-all text-left ${
                  !useCustomPhone
                    ? "border-[#03548C] bg-[#03548C]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  !useCustomPhone ? "border-[#03548C]" : "border-gray-400"
                }`}>
                  {!useCustomPhone && <div className="w-2 h-2 rounded-full bg-[#03548C]" />}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">Usar mi número de teléfono registrado</p>
                  <p className="font-semibold text-sm text-[#03548C] mt-0.5">{registeredPhone}</p>
                  <p className="text-xs text-gray-500 mt-1">No requiere verificación</p>
                </div>
              </button>

              <button
                onClick={() => { setUseCustomPhone(true); clearError(); }}
                className={`w-full flex items-start gap-3 p-4 border-2 rounded-xl transition-all text-left ${
                  useCustomPhone
                    ? "border-[#03548C] bg-[#03548C]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  useCustomPhone ? "border-[#03548C]" : "border-gray-400"
                }`}>
                  {useCustomPhone && <div className="w-2 h-2 rounded-full bg-[#03548C]" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">Usar otro número de teléfono</p>
                  <p className="text-xs text-gray-500 mt-0.5">Requiere verificación con código SMS</p>
                </div>
              </button>

              {useCustomPhone && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Nuevo número de teléfono
                  </label>
                  <input
                    type="tel"
                    value={customPhone}
                    onChange={(e) => { setCustomPhone(e.target.value); clearError(); }}
                    placeholder="+57 300 1234567"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#03548C] focus:border-transparent"
                    autoFocus
                  />
                </div>
              )}

              <div className="bg-[#03548C]/5 border border-[#03548C]/20 rounded-xl p-3 flex gap-2">
                <span className="text-sm shrink-0">ℹ️</span>
                <p className="text-xs text-[#03548C]">
                  {useCustomPhone
                    ? "Te enviaremos un código de verificación al número ingresado. Deberás confirmarlo antes de reclamar el premio."
                    : "El código de reclamo llegará por SMS a tu número registrado. Sin verificación adicional."}
                </p>
              </div>

              {error && <ErrorBox message={error} />}

              <button
                onClick={useCustomPhone ? handleSendOtp : handleSubmitRegisteredPhone}
                disabled={loading}
                className="w-full bg-[#03548C] hover:bg-[#0b1440] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading
                  ? "Procesando..."
                  : useCustomPhone
                    ? "Enviar código de verificación →"
                    : "Recibir instrucciones por SMS →"}
              </button>
            </div>
          )}

          {/* ── STEP: sms otp ── */}
          {step === "sms-otp" && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <span className="text-4xl">📲</span>
                <p className="mt-3 text-sm text-gray-700">
                  Ingresa el código de 6 dígitos que enviamos al número
                </p>
                <p className="font-semibold text-gray-900 mt-1">{customPhone}</p>
              </div>

              {/* Countdown timer */}
              <div className={`flex items-center justify-center gap-3 py-3 px-4 rounded-xl border ${
                isExpired
                  ? "bg-red-50 border-red-300"
                  : isUrgent
                    ? "bg-red-50 border-red-200"
                    : isWarning
                      ? "bg-amber-50 border-amber-200"
                      : "bg-[#03548C]/5 border-[#03548C]/20"
              }`}>
                <span className="text-lg">⏱️</span>
                <span className={`text-2xl font-bold font-mono tabular-nums ${
                  isExpired || isUrgent ? "text-red-600" : isWarning ? "text-amber-600" : "text-[#03548C]"
                }`}>
                  {formatCountdown(timeLeft)}
                </span>
                <span className={`text-xs font-semibold ${
                  isExpired || isUrgent ? "text-red-500" : isWarning ? "text-amber-600" : "text-[#03548C]/70"
                }`}>
                  {isExpired ? "código expirado" : "tiempo restante"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 text-center">
                  Código de verificación
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={otpCode}
                  onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "")); clearError(); }}
                  placeholder="_ _ _ _ _ _"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-xl font-mono text-center tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#03548C] focus:border-transparent"
                  autoFocus
                  disabled={isExpired}
                />
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">¿No recibiste el código?</p>
                <button
                  onClick={handleResendOtp}
                  disabled={loading || resendCooldown > 0}
                  className="text-sm text-[#03548C] hover:text-[#0b1440] font-semibold underline disabled:opacity-50 disabled:no-underline"
                >
                  {resendCooldown > 0 ? `Reenviar código (${resendCooldown}s)` : "Reenviar código"}
                </button>
              </div>

              {error && <ErrorBox message={error} />}

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otpCode.length < 4 || isExpired}
                className="w-full bg-[#03548C] hover:bg-[#0b1440] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? "Verificando..." : "Verificar y reclamar premio →"}
              </button>
            </div>
          )}

          {/* ── STEP: success ── */}
          {step === "success" && (
            <div className="text-center py-4 space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-4xl">✅</span>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900">¡Premio reclamado!</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Hemos enviado el código y las instrucciones a tu{" "}
                  {claimedMethod === ClaimPreferenceDeliveryMethod.EMAIL
                    ? "correo electrónico"
                    : "número de teléfono"}
                  . Sigue los pasos indicados para completar el proceso.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Premio</p>
                <p className="font-semibold text-gray-800">{prize.title}</p>
                <p className="text-xs text-gray-500">
                  Si tienes dudas, contáctanos con tu número de boleto ganador:{" "}
                  <span className="font-mono font-semibold text-gray-700">#{prize.ticketWinnerNumber}</span>
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-[#0b1440] hover:bg-[#03548C] text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Entendido
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
      <span className="text-red-500 text-sm shrink-0">❌</span>
      <p className="text-xs text-red-700">{message}</p>
    </div>
  );
}
