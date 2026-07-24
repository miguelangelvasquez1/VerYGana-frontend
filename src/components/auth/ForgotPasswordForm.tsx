'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, RefreshCw, ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';
import { forgotPassword, resetPassword } from '@/services/AuthService';

type Step = 'email' | 'reset' | 'success';

// Which errors require the user to request a new code before retrying
const RESEND_REQUIRED_MSGS = [
  'El código ha expirado',
  'Este código ya fue utilizado',
  'Se agotaron los intentos',
];
// Which errors force back to step 1
const RESTART_MSGS = [
  'No se ha solicitado un código',
];
// Rate-limit error
const RATE_LIMIT_MSG = 'Has solicitado demasiados códigos';

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // ── Step 2 state ──────────────────────────────────────────────────────────
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [needsResend, setNeedsResend] = useState(false);   // code expired/used/exhausted
  const [rateLimited, setRateLimited] = useState(false);   // too many requests
  const [highlightResend, setHighlightResend] = useState(false);
  const [codeAccepted, setCodeAccepted] = useState(false); // user clicked "Continuar"

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Countdown ──────────────────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    clearInterval(timerRef.current ?? undefined);
    setCountdown(60);
    setHighlightResend(false);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current ?? undefined), []);

  // ── OTP helpers ────────────────────────────────────────────────────────────
  const handleDigit = (idx: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    setCodeError(null);
    setNeedsResend(false);
    setCodeAccepted(false);
    if (d && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = ''; setDigits(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = Array(6).fill('');
    text.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const code = digits.join('');

  // ── Step 1: send email ─────────────────────────────────────────────────────
  const handleSendEmail = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) { setEmailError('Ingresa tu correo electrónico'); return; }
    setIsSendingEmail(true);
    setEmailError(null);
    try {
      await forgotPassword(email.trim());
      setStep('reset');
      startCountdown();
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      // Only 400 if email is empty (already validated), treat other errors as success
      setStep('reset');
      startCountdown();
    } finally {
      setIsSendingEmail(false);
    }
  };

  // ── Step 2: resend code ────────────────────────────────────────────────────
  const handleResend = async () => {
    if ((countdown > 0 && !needsResend) || isResending || rateLimited) return;
    setIsResending(true);
    setResendError(null);
    setCodeError(null);
    try {
      await forgotPassword(email.trim());
      setNeedsResend(false);
      setDigits(['', '', '', '', '', '']);
      startCountdown();
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? '';
      if (msg.includes(RATE_LIMIT_MSG) || msg.includes('demasiados')) {
        setRateLimited(true);
        setResendError('Has solicitado demasiados códigos. Intenta de nuevo en una hora.');
      } else {
        setResendError(msg || 'Error al reenviar. Intenta más tarde.');
      }
    } finally {
      setIsResending(false);
    }
  };

  // ── Step 2: reset password ─────────────────────────────────────────────────
  const handleReset = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCodeError(null);
    setPasswordError(null);

    if (code.length < 6) { setCodeError('Ingresa el código completo de 6 dígitos'); return; }
    if (newPassword.length < 6) { setPasswordError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Las contraseñas no coinciden'); return; }
    if (needsResend) { setCodeError('Debes solicitar un nuevo código antes de continuar'); return; }

    setIsResetting(true);
    try {
      await resetPassword(email.trim(), code, newPassword);
      setStep('success');
      setTimeout(() => { window.location.href = '/login'; }, 3000);
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? '';

      if (RESTART_MSGS.some((m) => msg.includes(m))) {
        setStep('email');
        setEmailError('No hay un código activo para este correo. Vuelve a solicitarlo.');
        return;
      }

      if (RESEND_REQUIRED_MSGS.some((m) => msg.includes(m))) {
        setCodeError(msg);
        setNeedsResend(true);
        setHighlightResend(true);
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      // Password validation error from backend
      if (err?.response?.status === 400 && msg.toLowerCase().includes('contraseña')) {
        setPasswordError(msg);
        return;
      }

      // Generic code error
      setCodeError(msg || 'Código incorrecto. Intenta de nuevo.');
      setCodeAccepted(false);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsResetting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
        <div style={{
          width: 72, height: 72,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00a4ff, #0089d6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
        }}>
          <CheckCircle style={{ width: 36, height: 36, color: '#fff' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0b1440', marginBottom: 8 }}>
          ¡Contraseña actualizada!
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>
          Contraseña actualizada correctamente. Ya puedes iniciar sesión.
          <br />Redirigiendo…
        </p>
        <a
          href="/login"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #00a4ff, #0089d6)',
            color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14,
            textDecoration: 'none',
          }}
        >
          Ir al inicio de sesión <ArrowRight style={{ width: 16, height: 16 }} />
        </a>
      </div>
    );
  }

  // ── Reset step (code + new password) ──────────────────────────────────────
  if (step === 'reset') {
    const codeReady = code.length === 6 && !needsResend && !codeError;
    const canResend = !rateLimited && (countdown === 0 || needsResend) && !isResending;
    const canSubmit = codeAccepted && newPassword.length >= 6 && newPassword === confirmPassword;

    return (
      <form onSubmit={handleReset} noValidate autoComplete="off">
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => setStep('email')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: '#6b7280', padding: 0, marginBottom: 16,
            }}
          >
            <ArrowLeft style={{ width: 15, height: 15 }} />
            Cambiar correo
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0b1440', marginBottom: 6 }}>
            {codeAccepted ? 'Crea una nueva contraseña' : 'Ingresa el código'}
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
            {codeAccepted
              ? 'Elige una contraseña segura para tu cuenta.'
              : <>Enviamos un código de 6 dígitos a{' '}<strong style={{ color: '#0b1440' }}>{email}</strong></>
            }
          </p>
        </div>

        {/* OTP */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
            Código de 6 dígitos
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                style={{
                  width: 44, height: 52,
                  textAlign: 'center',
                  fontSize: 20, fontWeight: 700,
                  color: codeError ? '#dc2626' : '#0b1440',
                  border: `2px solid ${codeError ? '#fca5a5' : d ? '#03548C' : '#e5e7eb'}`,
                  borderRadius: 10,
                  outline: 'none',
                  background: codeError ? '#fef2f2' : d ? '#f0f7ff' : '#fff',
                  transition: 'border-color 0.15s, background 0.15s',
                  caretColor: 'transparent',
                }}
                onFocus={(e) => {
                  if (!codeError) e.target.style.borderColor = '#00a4ff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = codeError ? '#fca5a5' : d ? '#03548C' : '#e5e7eb';
                }}
              />
            ))}
          </div>
          {codeError && (
            <p style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', marginTop: 4 }}>
              {codeError}
            </p>
          )}
        </div>

        {/* Resend */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {rateLimited ? (
            <p style={{ fontSize: 12, color: '#dc2626' }}>
              {resendError}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              style={{
                background: highlightResend && canResend ? '#eff6ff' : 'none',
                border: highlightResend && canResend ? '1px solid #bfdbfe' : 'none',
                borderRadius: 8,
                padding: highlightResend && canResend ? '6px 14px' : '4px 0',
                cursor: canResend ? 'pointer' : 'default',
                fontSize: 13,
                color: canResend ? '#03548C' : '#9ca3af',
                fontWeight: canResend ? 600 : 400,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                transition: 'all 0.2s',
              }}
            >
              {isResending && <RefreshCw style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
              {countdown > 0 && !needsResend
                ? `Reenviar código en ${countdown}s`
                : needsResend
                  ? 'Solicitar nuevo código'
                  : 'Reenviar código'}
            </button>
          )}
          {resendError && !rateLimited && (
            <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{resendError}</p>
          )}
        </div>

        {/* Continuar — visible cuando el código está completo y aún no fue aceptado */}
        {codeReady && !codeAccepted && (
          <button
            type="button"
            onClick={() => { setCodeAccepted(true); setNewPassword(''); setConfirmPassword(''); }}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #00a4ff, #0089d6)',
              color: '#fff',
              fontSize: 15, fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: '1rem',
            }}
          >
            Continuar
            <ArrowRight style={{ width: 18, height: 18 }} />
          </button>
        )}

        {/* Password section — revealed only after user clicks Continuar */}
        {codeAccepted && (
          <>
            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: '1.25rem',
            }}>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                Ahora elige tu nueva contraseña
              </span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            {/* Señuelo: absorbe el autofill del browser para que no caiga en los campos reales */}
            <input
              type="password"
              autoComplete="current-password"
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
            />

            {/* New password */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Nueva contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 16, height: 16, color: '#9ca3af',
                }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '12px 44px 12px 38px',
                    border: `1.5px solid ${passwordError ? '#fca5a5' : '#e5e7eb'}`,
                    borderRadius: 10, fontSize: 14, outline: 'none',
                    background: passwordError ? '#fef2f2' : '#fff',
                  }}
                  onFocus={(e) => { if (!passwordError) e.target.style.borderColor = '#00a4ff'; }}
                  onBlur={(e) => { e.target.style.borderColor = passwordError ? '#fca5a5' : '#e5e7eb'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: '#9ca3af',
                  }}
                >
                  {showPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Confirmar contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 16, height: 16, color: '#9ca3af',
                }} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                  placeholder="Repite tu nueva contraseña"
                  autoComplete="new-password"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '12px 44px 12px 38px',
                    border: `1.5px solid ${passwordError ? '#fca5a5' : '#e5e7eb'}`,
                    borderRadius: 10, fontSize: 14, outline: 'none',
                    background: passwordError ? '#fef2f2' : '#fff',
                  }}
                  onFocus={(e) => { if (!passwordError) e.target.style.borderColor = '#00a4ff'; }}
                  onBlur={(e) => { e.target.style.borderColor = passwordError ? '#fca5a5' : '#e5e7eb'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: '#9ca3af',
                  }}
                >
                  {showConfirm ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
              {passwordError && (
                <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{passwordError}</p>
              )}
              {confirmPassword && newPassword !== confirmPassword && !passwordError && (
                <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit || isResetting}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: canSubmit
                  ? 'linear-gradient(135deg, #00a4ff, #0089d6)'
                  : '#e5e7eb',
                color: canSubmit ? '#fff' : '#9ca3af',
                fontSize: 15, fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s',
              }}
            >
              {isResetting
                ? <RefreshCw style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
                : 'Confirmar nueva contraseña'
              }
            </button>
          </>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    );
  }

  // ── Email step ─────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSendEmail} noValidate>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0b1440', marginBottom: 6 }}>
          ¿Olvidaste tu contraseña?
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>
          Ingresa tu correo y te enviaremos un código para restablecerla.
        </p>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          Correo electrónico
        </label>
        <div style={{ position: 'relative' }}>
          <Mail style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            width: 16, height: 16, color: '#9ca3af',
          }} />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
            placeholder="tu@correo.com"
            autoComplete="email"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '12px 12px 12px 38px',
              border: `1.5px solid ${emailError ? '#fca5a5' : '#e5e7eb'}`,
              borderRadius: 10, fontSize: 14, outline: 'none',
              background: emailError ? '#fef2f2' : '#fff',
            }}
            onFocus={(e) => { if (!emailError) e.target.style.borderColor = '#00a4ff'; }}
            onBlur={(e) => { e.target.style.borderColor = emailError ? '#fca5a5' : '#e5e7eb'; }}
          />
        </div>
        {emailError && (
          <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{emailError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSendingEmail}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 12,
          border: 'none',
          background: 'linear-gradient(135deg, #00a4ff, #0089d6)',
          color: '#fff',
          fontSize: 15, fontWeight: 700,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginBottom: '1.25rem',
          opacity: isSendingEmail ? 0.8 : 1,
        }}
      >
        {isSendingEmail
          ? <RefreshCw style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
          : 'Enviar código de recuperación'
        }
      </button>

      <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
        <a href="/login" style={{ color: '#03548C', fontWeight: 600, textDecoration: 'none' }}>
          ← Volver al inicio de sesión
        </a>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
