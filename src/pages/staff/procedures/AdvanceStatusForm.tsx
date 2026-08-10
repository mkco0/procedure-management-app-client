import { useState } from 'react';
import { api, ApiError } from '../../../api/client';
import { Button, ErrorNotice, Field, Select, Textarea } from '../../../components/ui';
import { AREA_STATUSES, areaLabel, type ProcedureDetail, type ProcedureStatus } from '../../../types/domain';

type Phase = '' | 'EnTramite' | 'EnEntrega' | 'Completado' | 'Observado' | 'Rechazado';

const TERMINAL_PHASES: Phase[] = ['Completado', 'Observado', 'Rechazado'];

/** Splits a status into its área (if any) and phase, so the two selects can start pre-filled from it. */
function decompose(status: ProcedureStatus): { area: ProcedureStatus | ''; phase: Phase } {
  if (status === 'Completado' || status === 'Observado' || status === 'Rechazado') {
    return { area: '', phase: status };
  }
  const entry = AREA_STATUSES.find((a) => a.enTramite === status || a.enEntrega === status);
  if (!entry) return { area: '', phase: '' };
  return { area: entry.enTramite, phase: entry.enTramite === status ? 'EnTramite' : 'EnEntrega' };
}

/** Self-contained — its own "Confirmar cambio" button, since advancing is independent of the edit form's save. */
export function AdvanceStatusForm({
  procedure,
  onAdvanced,
}: {
  procedure: ProcedureDetail;
  onAdvanced: (updated: ProcedureDetail) => void;
}) {
  // An observado trámite defaults to resuming the área it was raised from —
  // the server lists it first in allowedNextStatuses.
  const initial =
    procedure.status === 'Observado' && procedure.allowedNextStatuses.length > 0
      ? decompose(procedure.allowedNextStatuses[0])
      : { area: '' as const, phase: '' as Phase };
  const [selectedArea, setSelectedArea] = useState<ProcedureStatus | ''>(initial.area);
  const [selectedPhase, setSelectedPhase] = useState<Phase>(initial.phase);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Área and estado are independent choices — Completado/Observado/Rechazado
  // aren't tied to any área, so área is ignored (and disabled) once one of
  // those is picked. Otherwise the target área defaults to wherever the
  // trámite already is, so picking only a phase (e.g. Entrega) moves it
  // there without having to re-pick the current área.
  const currentAreaEntry = AREA_STATUSES.find((a) => a.enTramite === procedure.status || a.enEntrega === procedure.status);
  const effectiveAreaEntry = selectedArea
    ? AREA_STATUSES.find((a) => a.enTramite === selectedArea)
    : currentAreaEntry;

  let target: ProcedureStatus | null = null;
  if (selectedPhase === 'Completado' || selectedPhase === 'Observado' || selectedPhase === 'Rechazado') {
    target = selectedPhase;
  } else if (effectiveAreaEntry) {
    target = selectedPhase === 'EnEntrega' ? effectiveAreaEntry.enEntrega : effectiveAreaEntry.enTramite;
  }
  if (target === procedure.status) target = null;

  const areaDisabled = TERMINAL_PHASES.includes(selectedPhase);
  const requiresComment = selectedPhase === 'Observado';

  async function submit() {
    if (!target) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await api.procedures.changeStatus(procedure.id, target, comment || undefined);
      const next =
        updated.status === 'Observado' && updated.allowedNextStatuses.length > 0
          ? decompose(updated.allowedNextStatuses[0])
          : { area: '' as const, phase: '' as Phase };
      setSelectedArea(next.area);
      setSelectedPhase(next.phase);
      setComment('');
      onAdvanced(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el estado.');
    } finally {
      setSubmitting(false);
    }
  }

  if (procedure.allowedNextStatuses.length === 0) {
    return <p className="text-sm text-ink-soft">Este trámite no tiene pasos disponibles para avanzar.</p>;
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        <Field label="Área" hint={areaDisabled ? 'No aplica para el estado seleccionado.' : undefined}>
          <Select
            value={selectedArea}
            disabled={areaDisabled}
            onChange={(e) => setSelectedArea(e.target.value as ProcedureStatus | '')}
          >
            <option value="">Mantener área actual</option>
            {AREA_STATUSES.map(({ area, enTramite }) => (
              <option key={area} value={enTramite}>
                {areaLabel(area, procedure.programName)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estado">
          <Select value={selectedPhase} onChange={(e) => setSelectedPhase(e.target.value as Phase)}>
            <option value="">Seleccione…</option>
            <option value="EnTramite">En trámite</option>
            <option value="EnEntrega">Entrega</option>
            <option value="Completado">Completado</option>
            <option value="Observado">Observado</option>
            <option value="Rechazado">Rechazado</option>
          </Select>
        </Field>
      </div>

      {target && (
        <div className="mt-4">
          <Field label={requiresComment ? 'Observación (obligatoria)' : 'Comentario (opcional)'}>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} required={requiresComment} />
          </Field>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <ErrorNotice message={error} />
        </div>
      )}

      <div className="mt-5">
        <Button onClick={submit} disabled={!target || submitting || (requiresComment && !comment.trim())}>
          {submitting ? 'Actualizando…' : 'Confirmar cambio'}
        </Button>
      </div>
    </div>
  );
}
