'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, MessageSquare, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
import {
  verifyEmail,
  resendEmailVerification,
  sendPhoneVerification,
  verifyPhone,
} from '@/services/AuthService';

type Mode = 'email' | 'sms';

export default function VerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') ?? '';

  const [mode, setMode] = useState<Mode>('email');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Masked phone stored in sessionStorage by RegisterForm
  const maskedPhone =
    typeof window !== 'undefined' ? sessionStorage.getItem('verifyPhone') : null;

  // ── Countdown ──────────────────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    clearInterval(timerRef.current ?? undefined);
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCountdown();
    return () => clearInterval(timerRef.current ?? undefined);
  }, [startCountdown]);

  // ── OTP input handlers ─────────────────────────────────────────────────────
  const handleDigit = (idx: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    setError(null);
    if (d && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        setDigits(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = [...'      '.split('').map(() => '')];
    text.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const code = digits.join('');

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (code.length < 6) {
      setError('Ingresa el código completo de 6 dígitos');
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      if (mode === 'email') {
        await verifyEmail(email, code);
      } else {
        await verifyPhone(email, code);
      }
      setVerified(true);
      sessionStorage.removeItem('verifyPhone');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Código incorrecto. Intenta de nuevo.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      await resendEmailVerification(email);
      startCountdown();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al reenviar. Intenta más tarde.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSwitchToSMS = async () => {
    if (isSending) return;
    setIsSending(true);
    setError(null);
    try {
      await sendPhoneVerification(email);
      setMode('sms');
      setDigits(['', '', '', '', '', '']);
      startCountdown();
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al enviar SMS. Intenta más tarde.');
    } finally {
      setIsSending(false);
    }
  };

  // ── Verified screen ────────────────────────────────────────────────────────
  if (verified) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
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
          ¡Cuenta verificada!
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280' }}>
          Redirigiendo al inicio de sesión…
        </p>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{
          width: 56, height: 56,
          borderRadius: '50%',
          background: mode === 'email'
            ? 'linear-gradient(135deg, #0b1440, #03548C)'
            : 'linear-gradient(135deg, #03548C, #00a4ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
          transition: 'background 0.4s',
        }}>
          {mode === 'email'
            ? <Mail style={{ width: 26, height: 26, color: '#FFD700' }} />
            : <MessageSquare style={{ width: 26, height: 26, color: '#FFD700' }} />
          }
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0b1440', marginBottom: 6 }}>
          {mode === 'email' ? 'Verifica tu correo' : 'Verifica tu teléfono'}
        </h1>

        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>
          {mode === 'email' ? (
            <>Enviamos un código de 6 dígitos a <strong style={{ color: '#0b1440' }}>{email}</strong></>
          ) : (
            <>
              Enviamos un código de 6 dígitos por SMS
              {maskedPhone && <> al <strong style={{ color: '#0b1440' }}>{maskedPhone}</strong></>}
            </>
          )}
        </p>
      </div>

      {/* OTP Inputs */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: '1.5rem' }}>
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
              width: 46,
              height: 56,
              textAlign: 'center',
              fontSize: 22,
              fontWeight: 700,
              color: '#0b1440',
              border: `2px solid ${d ? '#03548C' : '#e5e7eb'}`,
              borderRadius: 12,
              outline: 'none',
              background: d ? '#f0f7ff' : '#fff',
              transition: 'border-color 0.15s, background 0.15s',
              caretColor: 'transparent',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#00a4ff')}
            onBlur={(e) => (e.target.style.borderColor = d ? '#03548C' : '#e5e7eb')}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: '1rem',
          fontSize: 13,
          color: '#dc2626',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {/* Verify button */}
      <button
        onClick={handleVerify}
        disabled={isVerifying || code.length < 6}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 12,
          border: 'none',
          background: code.length === 6
            ? 'linear-gradient(135deg, #00a4ff, #0089d6)'
            : '#e5e7eb',
          color: code.length === 6 ? '#fff' : '#9ca3af',
          fontSize: 15,
          fontWeight: 700,
          cursor: code.length === 6 ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'background 0.2s, color 0.2s',
          marginBottom: '1.25rem',
        }}
      >
        {isVerifying ? (
          <RefreshCw style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
        ) : (
          <>
            Verificar cuenta
            <ArrowRight style={{ width: 18, height: 18 }} />
          </>
        )}
      </button>

      {/* Resend */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <button
          onClick={handleResend}
          disabled={countdown > 0 || isSending}
          style={{
            background: 'none',
            border: 'none',
            cursor: countdown > 0 ? 'default' : 'pointer',
            fontSize: 13,
            color: countdown > 0 ? '#9ca3af' : '#03548C',
            fontWeight: 500,
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          {isSending && <RefreshCw style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
          {countdown > 0
            ? `Reenviar código en ${countdown}s`
            : 'Reenviar código'}
        </button>
      </div>

      {/* Switch to SMS — only shown in email mode */}
      {mode === 'email' && (
        <div style={{ textAlign: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>
            ¿No te llegó el correo?
          </p>
          <button
            onClick={handleSwitchToSMS}
            disabled={isSending}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: '#03548C',
              fontWeight: 600,
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MessageSquare style={{ width: 14, height: 14, color: '#03548C' }} />
            <ArrowRight style={{ width: 13, height: 13 }} />
            Recibir código por SMS
          </button>
        </div>
      )}

      {/* Back to email — only shown in SMS mode */}
      {mode === 'sms' && (
        <div style={{ textAlign: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6' }}>
          <button
            onClick={() => { setMode('email'); setDigits(['', '', '', '', '', '']); setError(null); }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: '#6b7280',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Mail style={{ width: 14, height: 14, color: '#03548C' }} />
            <span style={{ color: '#03548C', fontWeight: 600 }}>Verificar por correo en su lugar</span>
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
