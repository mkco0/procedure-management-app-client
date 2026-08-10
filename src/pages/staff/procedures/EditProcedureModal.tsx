import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from '../../../api/client';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/ui';
import type { ProcedureDetail } from '../../../types/domain';
import type { Catalogs } from '../../../utils/useCatalogs';
import { ProcedureEditForm } from './ProcedureEditForm';

/** Actualizar: just the editable fields — viewing and advancing status live in Ver más. */
export function EditProcedureModal({
  procedureId,
  open,
  catalogs,
  onClose,
  onSaved,
}: {
  procedureId: number | null;
  open: boolean;
  catalogs: Catalogs;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [procedure, setProcedure] = useState<ProcedureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

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
      setDirty(false);
      setConfirmDiscard(false);
    }
  }, [open]);

  function requestClose() {
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  }

  const onDirtyChange = useCallback((d: boolean) => setDirty(d), []);
  const onSavingChange = useCallback((s: boolean) => setSaving(s), []);

  let overlay: ReactNode = null;
  if (confirmDiscard) {
    overlay = (
      <div>
        <p className="text-base font-semibold text-navy-900">Descartar cambios</p>
        <p className="mt-1 text-sm text-ink-soft">Hay cambios sin guardar. Si sale ahora se perderán.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDiscard(false)}>
            Seguir editando
          </Button>
          <Button variant="danger" onClick={onClose}>
            Descartar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Modal
      open={open}
      onClose={requestClose}
      title="Actualizar trámite"
      maxWidth="max-w-2xl"
      overlay={overlay}
      footer={
        procedure ? (
          <Button type="submit" form="procedure-edit-form" disabled={!dirty || saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        ) : undefined
      }
    >
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
        <ProcedureEditForm
          procedure={procedure}
          catalogs={catalogs}
          onDirtyChange={onDirtyChange}
          onSavingChange={onSavingChange}
          onSaved={() => {
            onSaved();
            onClose();
          }}
        />
      )}
    </Modal>
  );
}
