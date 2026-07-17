import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import { StatusStepper } from '../../components/StatusStepper';
import { Button, Card, EmptyState, ErrorNotice, StatusBadge } from '../../components/ui';
import type { PublicProcedureResult } from '../../types/domain';
import { formatDateTime } from '../../utils/format';

const CREDENTIALS_KEY = 'tramite_lookup_credentials';

export function TramiteStatusPage() {
  const [result, setResult] = useState<PublicProcedureResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(CREDENTIALS_KEY);
    if (!raw) {
      setLoading(false);
      return;
    }
    const { fileNumber, accessCode } = JSON.parse(raw);

    // Always re-fetch on mount — this runs on the initial navigation from
    // the lookup form AND on a plain browser refresh, so the status shown
    // here is never a frozen snapshot from whenever the search happened.
    api.public
      .lookup(fileNumber, accessCode)
      .then(setResult)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el estado del trámite.');
        sessionStorage.removeItem(CREDENTIALS_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-ink-soft">Consultando estado actual…</p>;
  }

  if (error) {
    return (
      <div>
        <ErrorNotice message={error} />
        <div className="mt-4 text-center">
          <Link to="/">
            <Button variant="secondary">Volver a consultar</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div>
        <EmptyState
          title="No hay una consulta activa"
          description="Vuelva a la página de inicio para buscar su trámite con el N° de expediente y su documento de identidad."
        />
        <div className="mt-4 text-center">
          <Link to="/">
            <Button variant="secondary">Ir a la consulta</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-md font-medium uppercase tracking-wider text-gold-700">Expediente {result.fileNumber}</p>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-navy-900">
        {result.procedureTypeName}
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Nombres: {result.applicantName} <br/>
        Carrera: {result.programCode} <br/>
        Registrado en: {formatDateTime(result.registeredAt)}
      </p>

      <Card className="mt-6 p-6">
        <StatusStepper status={result.status} />
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold text-navy-900">
          Historial
        </h2>
        <ol className="flex flex-col gap-3">
          {result.history.map((h, i) => (
            <li key={i} className="border-l-2 border-line pl-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={h.status} />
                {h.status !== 'MesaDePartes' && (
                  <p className="text-sm font-medium text-ink">{formatDateTime(h.changedAt)}</p>
                )}
              </div>
              {h.comment && <p className="mt-1 text-sm text-ink-soft">{h.comment}</p>}
            </li>
          ))}
        </ol>
      </Card>

      <div className="mt-6 flex gap-2 no-print">
        <Button variant="ghost" onClick={() => window.location.reload()}>
          ↻ Actualizar estado
        </Button>
        <Link to="/">
          <Button variant="ghost">← Nueva consulta</Button>
        </Link>
      </div>
    </div>
  );
}
