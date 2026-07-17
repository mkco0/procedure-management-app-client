import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../api/client';
import { Button, Card, ErrorNotice, Field, Input } from '../../components/ui';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <Card className="w-full max-w-sm p-8">
        <p className="text-xs font-medium uppercase tracking-wider text-gold-700 mb-2">PERSONAL AUTORIZADO</p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-navy-900">
          Ingreso al sistema
        </h1>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <Field label="DNI">
            <Input
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              maxLength={8}
              inputMode="numeric"
              placeholder="Introduce tu DNI"
              required
            />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Introduce tu contraseña"
              required
            />
          </Field>
          <ErrorNotice message={error} />
          <Button type="submit" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
