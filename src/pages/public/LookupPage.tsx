import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import { Button, Card, ErrorNotice, Field, Input } from '../../components/ui';

export function LookupPage() {
  const navigate = useNavigate();
  const [fileNumber, setFileNumber] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Store the credentials, not the result — TramiteStatusPage re-fetches
      // on every mount (including a browser refresh) so the status shown is
      // never a stale snapshot from the moment of this search.
      await api.public.lookup(fileNumber.trim(), accessCode.trim());
      sessionStorage.setItem('tramite_lookup_credentials', JSON.stringify({ fileNumber: fileNumber.trim(), accessCode: accessCode.trim() }));
      navigate('/tramite');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo consultar el trámite.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-md font-medium uppercase tracking-wider text-gold-700">Consulta pública</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-navy-900">
        Seguimiento de trámites
      </h1>
      <p className="mt-2 max-w-lg text-md text-ink-soft">
        Ingrese el número de expediente y su documento de identidad para ver el estado actual de su trámite.
      </p>

      <Card className="mt-8 max-w-md p-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="N° de expediente">
            <Input
              value={fileNumber}
              onChange={(e) => setFileNumber(e.target.value)}
              required
            />
          </Field>
          <Field label="Documento de identidad">
            <Input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
            />
          </Field>
          <ErrorNotice message={error} />
          <Button type="submit" disabled={loading}>
            {loading ? 'Consultando…' : 'Consultar estado'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
