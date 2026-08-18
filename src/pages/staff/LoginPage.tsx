import { useId, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, IdCard, ListOrdered, LoaderCircle, Lock, Search, ShieldCheck, FileText } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../api/client';
import { Button, Card, ErrorNotice } from '../../components/ui';
import { isStaffHost } from '../../utils/host';

/**
 * Login-local field: the shared <Field> wraps its children in a <label>, which
 * makes any control inside it (the password reveal toggle) double as a label
 * click. These fields wire htmlFor/id explicitly instead, and leave room for
 * the leading icon and the trailing toggle.
 */
function LoginField({
  id,
  label,
  icon,
  children,
  trailing,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-soft">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-ink-soft">
          {icon}
        </span>
        {children}
        {trailing && <span className="absolute inset-y-0 right-0 flex w-10 items-center justify-center">{trailing}</span>}
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-sm border border-line bg-surface py-2 pl-9 text-sm text-ink outline-none transition-colors focus:border-navy-700 focus:ring-1 focus:ring-navy-700 aria-[invalid=true]:border-[color:var(--color-status-rechazado)]/60';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const dniId = useId();
  const passwordId = useId();
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/app/tramites" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(dni.trim(), password);
      navigate('/app/tramites');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  // Any edit clears the previous rejection: keeping it on screen while the
  // user retypes reads as if the new attempt had already failed too.
  function onDniChange(value: string) {
    setDni(value.replace(/\D/g, '').slice(0, 8));
    if (error) setError(null);
  }

  function onPasswordChange(value: string) {
    setPassword(value);
    if (error) setError(null);
  }

  function trackCapsLock(e: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(e.getModifierState?.('CapsLock') ?? false);
  }

  const canSubmit = dni.length > 0 && password.length > 0 && !loading;

  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Institutional panel — full height beside the form on desktop, a
          compact banner above it on narrow screens. */}
      <aside className="relative overflow-hidden bg-navy-900 px-6 py-8 text-white lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            background:
              'radial-gradient(90% 70% at 15% 0%, rgba(51,106,163,0.45) 0%, transparent 60%), radial-gradient(70% 60% at 100% 100%, rgba(184,134,46,0.22) 0%, transparent 60%)',
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-white/15 bg-white/10">
              <ShieldCheck size={20} className="text-gold-100" />
            </span>
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight">
                IESTP Carlos Cueto Fernandini
              </p>
              <p className="text-xs text-navy-100/70">Plataforma de Trámites</p>
            </div>
          </div>

          <div className="mt-10 hidden max-w-md lg:block">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-snug">
              Gestión de expedientes de la institución
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-navy-100/80">
              Registre trámites, siga su recorrido entre áreas y controle la entrega desde un solo lugar.
            </p>

            <ul className="mt-8 flex flex-col gap-4 text-sm text-navy-100/85">
              <li className="flex items-start gap-3">
                <FileText size={16} className="mt-0.5 shrink-0 text-gold-600" />
                Registro de expedientes con correlativo automático
              </li>
              <li className="flex items-start gap-3">
                <Search size={16} className="mt-0.5 shrink-0 text-gold-600" />
                Seguimiento por área y estado, con historial completo
              </li>
              <li className="flex items-start gap-3">
                <ListOrdered size={16} className="mt-0.5 shrink-0 text-gold-600" />
                Reportes y correlativos listos para exportar
              </li>
            </ul>
          </div>
        </div>

        <p className="relative mt-10 hidden text-xs text-navy-100/50 lg:block">
          Instituto de Educación Superior Tecnológico Público Carlos Cueto Fernandini
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-10 lg:py-14">
        <Card className="w-full max-w-sm p-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gold-700">Personal autorizado</p>
          <h1 className="text-2xl font-semibold text-navy-900">Ingreso al sistema</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Use su DNI y la contraseña asignada por el administrador.
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <LoginField id={dniId} label="DNI" icon={<IdCard size={16} />}>
              <input
                id={dniId}
                value={dni}
                onChange={(e) => onDniChange(e.target.value)}
                inputMode="numeric"
                autoComplete="username"
                autoFocus
                aria-invalid={!!error}
                placeholder="00000000"
                required
                className={`${inputClass} pr-3 font-[family-name:var(--font-mono)] tracking-[0.12em]`}
              />
            </LoginField>

            <div>
              <LoginField
                id={passwordId}
                label="Contraseña"
                icon={<Lock size={16} />}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                    className="flex h-7 w-7 items-center justify-center rounded-sm text-ink-soft transition-colors hover:bg-navy-100 hover:text-navy-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy-700"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              >
                <input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  onKeyUp={trackCapsLock}
                  onKeyDown={trackCapsLock}
                  onBlur={() => setCapsLock(false)}
                  autoComplete="current-password"
                  aria-invalid={!!error}
                  placeholder="••••••••"
                  required
                  className={`${inputClass} pr-10`}
                />
              </LoginField>
              {capsLock && (
                <p className="mt-1 text-xs text-[color:var(--color-estado-observado)]">
                  Bloq Mayús está activado.
                </p>
              )}
            </div>

            <div aria-live="polite">
              <ErrorNotice message={error} />
            </div>

            <Button type="submit" disabled={!canSubmit} aria-busy={loading} className="w-full">
              {loading && <LoaderCircle size={16} className="animate-spin" />}
              {loading ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>

          <p className="mt-6 border-t border-line pt-4 text-xs text-ink-soft">
            ¿Olvidó su contraseña? Solicite el restablecimiento al administrador del sistema.
          </p>

          {!isStaffHost() && (
            <Link
              to="/"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-navy-700 hover:text-navy-900 hover:underline"
            >
              Consultar el estado de un trámite
            </Link>
          )}
        </Card>
      </main>
    </div>
  );
}
