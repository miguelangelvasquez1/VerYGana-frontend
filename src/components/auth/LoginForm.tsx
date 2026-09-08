'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

import {
  authService,
  AccountPendingReviewError,
  AccountLockedError,
  EmailVerificationPendingError,
  KycReviewPendingError,
  PasswordSetupRequiredError,
} from '@/lib/auth/authService';

import { getCommercialInitialDataWithToken } from '@/services/commercialService';
import { getRoleHomePath } from '@/lib/auth/roleRedirect';

import LoadingSpinner from '@/components/LoadingSpinner';

import {
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

import { signIn } from 'next-auth/react';

const validateIdentifier = (value: string): string | null => {
  const identifier = value.trim();

  if (!identifier) {
    return 'Ingresa tu correo electrónico o número de teléfono.';
  }

  const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (emailRegex.test(identifier)) {
    return null;
  }

  const colombianPhoneRegex =
      /^3\d{9}$/;

  if (colombianPhoneRegex.test(identifier)) {
    return null;
  }

  return 'Ingresa un correo electrónico válido o un número de teléfono válido.';
};

const LoginForm = () => {
  const router = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [isLoading, setIsLoading] =
      useState(false);

  const [error, setError] =
      useState<string | null>(null);

  const [identifierError, setIdentifierError] =
      useState<string | null>(null);

  const [showPassword, setShowPassword] =
      useState(false);

  const errorRef =
      useRef<HTMLDivElement>(null);

  const identifierId =
      useId();

  const passwordId =
      useId();

  const errorId =
      useId();

  const [formData, setFormData] =
      useState({
        identifier: '',
        password: '',
      });

  useEffect(() => {
    if (
        error &&
        errorRef.current
    ) {
      errorRef.current.focus();
    }
  }, [error]);

  const handleSubmit = async (
      e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (isLoading) return;

    setError(null);
    setIdentifierError(null);
    setIsLoading(true);

    const identifier =
        formData.identifier.trim();

    const password =
        formData.password;

    try {
      if (
          !identifier ||
          !password
      ) {
        setError(
            'Por favor completa todos los campos.'
        );

        setIsLoading(false);
        return;
      }

      const validationError =
          validateIdentifier(identifier);

      if (validationError) {
        setIdentifierError(
            validationError
        );

        setIsLoading(false);
        return;
      }

      if (!executeRecaptcha) {
        throw new Error(
            'No fue posible cargar la verificación de seguridad. Recarga la página e inténtalo nuevamente.'
        );
      }

      const recaptchaToken =
          await executeRecaptcha('login');

      const loginResponse =
          await authService.login(
              identifier,
              password,
              recaptchaToken
          );

      const result =
          await signIn(
              'credentials-sync',
              {
                redirect: false,
                accessToken:
                loginResponse.accessToken,
                identifier,
              }
          );

      if (result?.error) {
        throw new Error(
            result.error
        );
      }

      const role =
          loginResponse.role;

      if (
          role === 'ROLE_COMMERCIAL'
      ) {
        try {
          const initialData =
              await getCommercialInitialDataWithToken(
                  loginResponse.accessToken
              );

          if (
              initialData.onboardingStatus ===
              'COMPLETED'
          ) {
            router.push(
                '/commercial'
            );
          } else {
            router.push(
                '/commercial-onboarding'
            );
          }
        } catch {
          router.push(
              '/commercial'
          );
        }

        return;
      }

      const homePath =
          getRoleHomePath(role);

      if (homePath) {
        router.push(
            homePath
        );
      } else {
        setError(
            'No se pudo determinar el acceso de tu cuenta.'
        );

        setIsLoading(false);
      }

    } catch (err: unknown) {

      if (
          err instanceof
          AccountLockedError
      ) {
        router.push(
            `/unlock-account?identifier=${encodeURIComponent(
                err.identifier
            )}`
        );

        return;
      }

      if (
          err instanceof
          EmailVerificationPendingError
      ) {
        router.push(
            `/verify?email=${encodeURIComponent(
                identifier
            )}`
        );

        return;
      }

      if (
          err instanceof
          KycReviewPendingError
      ) {
        setError(
            err.message
        );

      } else if (
          err instanceof
          PasswordSetupRequiredError
      ) {
        setError(
            err.message
        );

      } else if (
          err instanceof
          AccountPendingReviewError
      ) {
        setError(
            'Tu cuenta está en revisión por el equipo de cumplimiento. ' +
            'Te notificaremos cuando sea aprobada.'
        );

      } else if (
          err instanceof Error &&
          err.message
              ?.toLowerCase()
              .includes('invalid credentials')
      ) {
        setError(
            'Correo/teléfono o contraseña incorrectos.'
        );

        setFormData(
            (current) => ({
              ...current,
              password: '',
            })
        );

      } else {
        setError(
            err instanceof Error
                ? err.message
                : 'No fue posible iniciar sesión. Inténtalo nuevamente.'
        );
      }

      setIsLoading(false);
    }
  };

  return (
      <div className="w-full">

        <section
            aria-labelledby="login-title"
            className="
          w-full
          rounded-2xl
          border
          border-gray-200
          bg-white
          px-7
          py-10
          shadow-xl
          shadow-gray-200/50
          sm:px-10
          sm:py-11
          lg:px-12
          lg:py-12
        "
        >

          <header className="mb-9">

            <h1
                id="login-title"
                className="
              text-[1.65rem]
              sm:text-3xl
              font-extrabold
              tracking-tight
              text-[#0b1440]
            "
            >
              Inicia sesión
            </h1>

            <p
                id="login-description"
                className="
              mt-2.5
              max-w-lg
              text-sm
              leading-6
              text-gray-600
            "
            >
              Accede a tu cuenta y continúa disfrutando
              de tus recompensas.
            </p>

          </header>

          {error && (
              <div
                  id={errorId}
                  ref={errorRef}
                  role="alert"
                  aria-live="assertive"
                  tabIndex={-1}
                  className="
              mb-7
              flex
              items-start
              gap-3
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3.5
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-red-500/40
            "
              >

                <AlertCircle
                    aria-hidden="true"
                    className="
                mt-0.5
                h-5
                w-5
                shrink-0
                text-red-600
              "
                />

                <p
                    className="
                text-sm
                leading-6
                text-red-800
              "
                >
                  {error}
                </p>

              </div>
          )}

          <form
              onSubmit={handleSubmit}
              autoComplete="on"
              aria-describedby="login-description"
              className="space-y-7"
          >

            <div>

              <label
                  htmlFor={identifierId}
                  className="
                mb-2
                block
                text-sm
                font-semibold
                text-gray-800
              "
              >
                Correo electrónico o teléfono

                <span
                    aria-hidden="true"
                    className="
                  ml-1
                  text-red-600
                "
                >
                *
              </span>

                <span className="sr-only">
                Campo obligatorio
              </span>

              </label>

              <input
                  id={identifierId}
                  name="identifier"
                  type="text"
                  inputMode="text"
                  value={
                    formData.identifier
                  }
                  onChange={(e) => {

                    setFormData(
                        (current) => ({
                          ...current,
                          identifier:
                          e.target.value,
                        })
                    );

                    if (identifierError) {
                      setIdentifierError(null);
                    }

                    if (error) {
                      setError(null);
                    }

                  }}
                  onBlur={() => {

                    if (
                        formData.identifier.trim()
                    ) {
                      setIdentifierError(
                          validateIdentifier(
                              formData.identifier
                          )
                      );
                    }

                  }}
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Correo o número de teléfono"
                  aria-invalid={
                    Boolean(identifierError)
                  }
                  aria-describedby={
                    identifierError
                        ? `${identifierId}-error`
                        : undefined
                  }
                  disabled={isLoading}
                  className={`
                w-full
                h-12
                rounded-lg
                border
                bg-white
                px-4
                text-sm
                text-gray-900
                shadow-sm
                placeholder:text-gray-400
                transition-all
                duration-200
                focus:outline-none
                focus-visible:ring-2
                disabled:cursor-not-allowed
                disabled:bg-gray-100
                disabled:text-gray-500

                ${
                      identifierError
                          ? `
                      border-red-400
                      focus:border-red-500
                      focus:ring-red-500/30
                    `
                          : `
                      border-gray-300
                      hover:border-gray-400
                      focus:border-[#03548C]
                      focus:ring-[#03548C]/30
                    `
                  }
              `}
              />

              {identifierError && (
                  <p
                      id={`${identifierId}-error`}
                      role="alert"
                      className="
                  mt-2
                  flex
                  items-start
                  gap-2
                  text-sm
                  leading-6
                  text-red-700
                "
                  >

                    <AlertCircle
                        aria-hidden="true"
                        className="
                    mt-1
                    h-4
                    w-4
                    shrink-0
                  "
                    />

                    <span>
                  {identifierError}
                </span>

                  </p>
              )}

            </div>

            <div>

              <div
                  className="
                mb-2
                flex
                flex-wrap
                items-center
                justify-between
                gap-x-4
                gap-y-1
              "
              >

                <label
                    htmlFor={passwordId}
                    className="
                  text-sm
                  font-semibold
                  text-gray-800
                "
                >
                  Contraseña

                  <span
                      aria-hidden="true"
                      className="
                    ml-1
                    text-red-600
                  "
                  >
                  *
                </span>

                  <span className="sr-only">
                  Campo obligatorio
                </span>

                </label>

                <Link
                    href="/forgot-password"
                    className="
                  shrink-0
                  rounded-sm
                  text-sm
                  font-medium
                  text-[#03548C]
                  transition-colors
                  hover:text-[#0b1440]
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#03548C]/40
                "
                >
                  ¿Olvidaste tu contraseña?
                </Link>

              </div>

              <div className="relative">

                <input
                    id={passwordId}
                    name="password"
                    type={
                      showPassword
                          ? 'text'
                          : 'password'
                    }
                    value={
                      formData.password
                    }
                    onChange={(e) => {

                      setFormData(
                          (current) => ({
                            ...current,
                            password:
                            e.target.value,
                          })
                      );

                      if (error) {
                        setError(null);
                      }

                    }}
                    required
                    autoComplete="current-password"
                    placeholder="Ingresa tu contraseña"
                    disabled={isLoading}
                    className="
                  w-full
                  h-12
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-4
                  pr-14
                  text-sm
                  text-gray-900
                  shadow-sm
                  placeholder:text-gray-400
                  transition-all
                  duration-200
                  hover:border-gray-400
                  focus:border-[#03548C]
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#03548C]/30
                  focus-visible:ring-2
                  focus-visible:ring-[#03548C]/40
                  disabled:cursor-not-allowed
                  disabled:bg-gray-100
                  disabled:text-gray-500
                "
                />

                <button
                    type="button"
                    onClick={() =>
                        setShowPassword(
                            (current) =>
                                !current
                        )
                    }
                    disabled={isLoading}
                    aria-label={
                      showPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                    }
                    aria-pressed={
                      showPassword
                    }
                    className="
                  absolute
                  right-1
                  top-1/2
                  flex
                  h-10
                  w-10
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-lg
                  text-gray-500
                  transition-colors
                  hover:bg-gray-100
                  hover:text-gray-700
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#03548C]/40
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
                >
                  {showPassword ? (
                      <EyeOff
                          aria-hidden="true"
                          className="h-5 w-5"
                      />
                  ) : (
                      <Eye
                          aria-hidden="true"
                          className="h-5 w-5"
                      />
                  )}
                </button>

              </div>

            </div>

            <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                className="
              flex
              w-full
              h-12
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-gradient-to-r
              from-[#D4A72C]
              via-[#FFD21F]
              to-[#D4A72C]
              px-6
              text-sm
              sm:text-base
              font-bold
              text-[#0b1440]
              shadow-md
              shadow-yellow-200/50
              transition-all
              duration-200
              hover:brightness-105
              hover:shadow-lg
              hover:shadow-yellow-200/60
              active:brightness-95
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#0b1440]
              focus-visible:ring-offset-2
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
            >

              {isLoading ? (
                  <>
                    <LoadingSpinner
                        label="Procesando..."
                    />

                    <span className="sr-only">
                  Iniciando sesión, espera un momento.
                </span>
                  </>
              ) : (
                  <span>
                Iniciar sesión
              </span>
              )}

            </button>

          </form>

          <div
              className="
            mt-6
            border-t
            border-gray-100
            pt-5
            text-center
            text-sm
          "
          >

          <span className="text-gray-500">
            ¿No tienes una cuenta?
          </span>

            <Link
                href="/register"
                className="
              ml-1.5
              rounded-sm
              font-semibold
              text-[#03548C]
              decoration-1
              underline-offset-4
              transition-colors
              hover:text-[#0b1440]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#03548C]/40
            "
            >
              Regístrate
            </Link>

          </div>

        </section>

      </div>
  );
};

export default LoginForm;
