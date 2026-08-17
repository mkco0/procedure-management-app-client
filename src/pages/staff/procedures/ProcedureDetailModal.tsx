import { useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from '../../../api/client';
import { HistorialList } from '../../../components/HistorialList';
import { Modal } from '../../../components/Modal';
import { AreaBadge, Button, Card, CopyButton, EstadoBadge } from '../../../components/ui';
import { APPLICANT_TYPE_LABELS, describeStatus, type ProcedureDetail } from '../../../types/domain';
import { formatDateTime, toTitleCase } from '../../../utils/format';
import { AdvanceStatusForm } from './AdvanceStatusForm';

/** Ver más: everything about the trámite except its editable fields — those live in Actualizar. */
export function ProcedureDetailModal({
  procedureId,
  open,
  onClose,
  onChanged,
}: {
  procedureId: number | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [procedure, setProcedure] = useState<ProcedureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!open || procedureId === null) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    api.procedures
      .get(procedureId)
      .then((data) => {
        if (!cancelled) setProcedure(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : 'No se pudo cargar el trámite.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, procedureId, reloadKey]);

  useEffect(() => {
    if (!open) {
      setProcedure(null);
      setLoading(true);
      setLoadError(null);
    }
  }, [open]);

  const procedureTypeLabel =
    procedure && procedure.procedureTypeName === 'Otro'
      ? (procedure.procedureTypeOther ?? 'Otro')
      : procedure && toTitleCase(procedure.procedureTypeName);

  return (
    <Modal open={open} onClose={onClose} title="Detalle del trámite" maxWidth="max-w-4xl">
      {loadError ? (
        <div>
          <p className="text-sm text-[color:var(--color-status-rechazado)]">{loadError}</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
              Reintentar
            </Button>
          </div>
        </div>
      ) : loading || !procedure ? (
        <p className="text-sm text-ink-soft">Cargando…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <Card className="p-6">
                <h3 className="mb-3 text-base font-semibold text-navy-900">Datos del trámite</h3>
                <dl className="flex flex-col gap-2 text-sm">
                  <Row label="Correlativo" value={procedure.correlativeNumber} />
                  <Row label="Expediente" value={procedure.fileNumber} valueClassName="text-navy-800">
                    <CopyButton text={procedure.fileNumber} />
                  </Row>
                  <Row label="Tipo de trámite" value={procedureTypeLabel} />
                  <Row label="Registrado el" value={formatDateTime(procedure.registeredAt)} />
                  <Row
                    label="Área"
                    value={
                      <AreaBadge
                        area={describeStatus(procedure.status, procedure.resumeStage).area}
                        programName={procedure.programName}
                      />
                    }
                  />
                  <Row
                    label="Estado"
                    value={<EstadoBadge estado={describeStatus(procedure.status, procedure.resumeStage).estado} />}
                  />
                  <Row label="Documento de identidad" value={procedure.applicantDni}>
                    <CopyButton text={procedure.applicantDni} />
                  </Row>
                  <Row label="Tipo de solicitante" value={APPLICANT_TYPE_LABELS[procedure.applicantType]} />
                  <Row label="Solicitante" value={toTitleCase(procedure.applicantName)} />
                  {procedure.programName && <Row label="Programa" value={procedure.programName} />}
                  {procedure.shift && <Row label="Turno" value={procedure.shift === 'Day' ? 'Diurno' : 'Nocturno'} />}
                  <Row
                    label="Documento presentado"
                    value={procedure.documentType + (procedure.documentNumber ? ` (${procedure.documentNumber})` : '')}
                  />
                  <Row label="Responsable" value={procedure.personInChargeName ?? 'Sin asignar'} />
                  {procedure.comment && <Row label="Comentario" value={procedure.comment} />}
                </dl>
              </Card>

              {procedure.allowedNextStatuses.length > 0 && (
                <Card className="p-6">
                  <h3 className="mb-4 text-base font-semibold text-navy-900">Avanzar trámite</h3>
                  <AdvanceStatusForm
                    procedure={procedure}
                    onAdvanced={(updated) => {
                      setProcedure(updated);
                      onChanged();
                    }}
                  />
                </Card>
              )}
            </div>

            <Card className="flex min-h-0 flex-col p-6">
              <h3 className="mb-4 shrink-0 text-base font-semibold text-navy-900">Historial</h3>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <HistorialList history={procedure.history} programName={procedure.programName} />
              </div>
            </Card>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Row({
  label,
  value,
  valueClassName = 'text-ink',
  children,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line pb-2">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className={`flex items-center text-right ${valueClassName}`}>
        {value}
        {children}
      </dd>
    </div>
  );
}
