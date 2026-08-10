import { useEffect, useState } from 'react';
import { api, ApiError } from '../../../api/client';
import { Modal } from '../../../components/Modal';
import { Button, ErrorNotice } from '../../../components/ui';
import type { ProcedureListItem } from '../../../types/domain';

export function DeleteProcedureDialog({
  item,
  onClose,
  onDeleted,
}: {
  item: ProcedureListItem | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) setError(null);
  }, [item]);

  async function confirm() {
    if (!item) return;
    setDeleting(true);
    setError(null);
    try {
      await api.procedures.remove(item.id);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar el trámite.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal open={item !== null} onClose={onClose} title="Eliminar trámite" maxWidth="max-w-sm">
      <p className="text-sm text-ink-soft">
        ¿Eliminar el trámite {item?.fileNumber}? Esta acción no se puede deshacer.
      </p>
      {error && (
        <div className="mt-3">
          <ErrorNotice message={error} />
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={confirm} disabled={deleting}>
          {deleting ? 'Eliminando…' : 'Eliminar'}
        </Button>
      </div>
    </Modal>
  );
}
