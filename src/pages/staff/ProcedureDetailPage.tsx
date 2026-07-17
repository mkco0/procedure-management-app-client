import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import { StatusStepper } from '../../components/StatusStepper';
import { Button, Card, ErrorNotice, Field, Input, PageHeader, Select, Textarea } from '../../components/ui';
import { PROCEDURE_TYPE_OTHER_NAME, SHIFT_LABELS, STATUS_LABELS, type ProcedureDetail, type ProcedureStatus, type Shift } from '../../types/domain';
import { formatDateTime } from '../../utils/format';
import { useCatalogs } from '../../utils/useCatalogs';

interface EditForm {
  documentType: string;
  documentNumber: string;
  procedureTypeId: string;
  procedureTypeOther: string;
  applicantName: string;
  programId: string;
  shift: Shift;
  idDocumentType: string;
  idDocumentNumber: string;
  comment: string;
}

export function ProcedureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const catalogs = useCatalogs();
  const [procedure, setProcedure] = useState<ProcedureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nextStatus, setNextStatus] = useState<ProcedureStatus | ''>('');
  const [statusComment, setStatusComment] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.procedures.get(Number(id));
      setProcedure(data);
      setNextStatus('');
      setStatusComment('');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function startEdit() {
    if (!procedure) return;
    setEditForm({
      documentType: procedure.documentType,
      documentNumber: procedure.documentNumber ?? '',
      procedureTypeId: String(procedure.procedureTypeId),
      procedureTypeOther: procedure.procedureTypeOther ?? '',
      applicantName: procedure.applicantName,
      programId: String(procedure.programId),
      shift: procedure.shift,
      idDocumentType: '',
      idDocumentNumber: '',
      comment: procedure.comment ?? '',
    });
    setEditError(null);
    setEditing(true);
  }

  async function submitEdit(e: FormEvent) {
    e.preventDefault();
    if (!procedure || !editForm) return;
    setSavingEdit(true);
    setEditError(null);
    const selectedType = catalogs.procedureTypes.find((t) => String(t.id) === editForm.procedureTypeId);
    const isOther = selectedType?.name === PROCEDURE_TYPE_OTHER_NAME;
    try {
      const updated = await api.procedures.update(procedure.id, {
        documentType: editForm.documentType,
        documentNumber: editForm.documentNumber || null,
        procedureTypeId: Number(editForm.procedureTypeId),
        procedureTypeOther: isOther ? editForm.procedureTypeOther : null,
        applicantName: editForm.applicantName,
        programId: Number(editForm.programId),
        shift: editForm.shift,
        idDocumentType: editForm.idDocumentType || null,
        idDocumentNumber: editForm.idDocumentNumber || null,
        comment: editForm.comment || null,
      });
      setProcedure(updated);
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'No se pudo guardar los cambios.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function submitStatusChange() {
    if (!procedure || !nextStatus) return;
    setError(null);
    setChangingStatus(true);
    try {
      const updated = await api.procedures.changeStatus(procedure.id, nextStatus, statusComment || undefined);
      setProcedure(updated);
      setNextStatus('');
      setStatusComment('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el estado.');
    } finally {
      setChangingStatus(false);
    }
  }

  async function onDelete() {
    if (!procedure) return;
    if (!window.confirm(`¿Eliminar el trámite ${procedure.fileNumber}? Esta acción no se puede deshacer.`)) return;
    await api.procedures.remove(procedure.id);
    navigate('/app/tramites');
  }

  if (loading) return <p className="text-sm text-ink-soft">Cargando…</p>;
  if (!procedure) return <p className="text-sm text-ink-soft">Trámite no encontrado.</p>;

  const requiresComment = nextStatus === 'Observado';
  const editSelectedPresented = catalogs.presentedDocumentTypes.find((d) => d.code === editForm?.documentType);
  const editSelectedType = catalogs.procedureTypes.find((t) => String(t.id) === editForm?.procedureTypeId);
  const editIsOtherType = editSelectedType?.name === PROCEDURE_TYPE_OTHER_NAME;

  return (
    <div>
      <PageHeader
        eyebrow={`Expediente ${procedure.fileNumber}`}
        title={procedure.procedureTypeName === 'Otro' ? procedure.procedureTypeOther ?? 'Otro' : procedure.procedureTypeName}
        actions={
          <>
            {!editing && <Button onClick={startEdit}>Editar</Button>}
            <Button variant="danger" onClick={onDelete}>
              Eliminar
            </Button>
          </>
        }
      />

      <Card className="p-6">
        <StatusStepper status={procedure.status} />
      </Card>

      {editing && editForm && (
        <Card className="mt-4 p-6">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold text-navy-900">
            Editar trámite
          </h2>
          <form onSubmit={submitEdit} className="grid grid-cols-2 gap-4">
            <Field label="Nombres completos">
              <Input
                value={editForm.applicantName}
                onChange={(e) => setEditForm({ ...editForm, applicantName: e.target.value })}
                required
              />
            </Field>
            <Field label="Programa">
              <Select
                value={editForm.programId}
                onChange={(e) => setEditForm({ ...editForm, programId: e.target.value })}
                required
              >
                {catalogs.programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Turno">
              <Select
                value={editForm.shift}
                onChange={(e) => setEditForm({ ...editForm, shift: e.target.value as Shift })}
              >
                {Object.entries(SHIFT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tipo de trámite">
              <Select
                value={editForm.procedureTypeId}
                onChange={(e) => setEditForm({ ...editForm, procedureTypeId: e.target.value })}
                required
              >
                {catalogs.procedureTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            {editIsOtherType && (
              <Field label="Especifique el trámite">
                <Input
                  value={editForm.procedureTypeOther}
                  onChange={(e) => setEditForm({ ...editForm, procedureTypeOther: e.target.value })}
                  required
                />
              </Field>
            )}
            <Field label="Documento presentado">
              <Select
                value={editForm.documentType}
                onChange={(e) => setEditForm({ ...editForm, documentType: e.target.value })}
                required
              >
                {catalogs.presentedDocumentTypes.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            {editSelectedPresented && editSelectedPresented.numberMode !== 'None' && (
              <Field label={editSelectedPresented.numberMode === 'Identifier' ? 'N°/Identificador' : 'Descripción'}>
                <Input
                  value={editForm.documentNumber}
                  onChange={(e) => setEditForm({ ...editForm, documentNumber: e.target.value })}
                  required
                />
              </Field>
            )}
            <Field label="Reasignar identidad (opcional)" hint="Solo si necesita corregir el DNI del solicitante.">
              <div className="flex gap-2">
                <Select
                  value={editForm.idDocumentType}
                  onChange={(e) => setEditForm({ ...editForm, idDocumentType: e.target.value })}
                  className="max-w-32"
                >
                  <option value="">—</option>
                  {catalogs.identityDocumentTypes.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </Select>
                <Input
                  value={editForm.idDocumentNumber}
                  onChange={(e) => setEditForm({ ...editForm, idDocumentNumber: e.target.value })}
                  placeholder="N° de documento"
                />
              </div>
            </Field>
            <div className="col-span-2">
              <Field label="Observaciones">
                <Textarea
                  value={editForm.comment}
                  onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                  rows={2}
                />
              </Field>
            </div>
            {editError && (
              <div className="col-span-2">
                <ErrorNotice message={editError} />
              </div>
            )}
            <div className="col-span-2 flex gap-2">
              <Button type="submit" disabled={savingEdit}>
                {savingEdit ? 'Guardando…' : 'Guardar cambios'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!editing && procedure.allowedNextStatuses.length > 0 && (
        <Card className="mt-4 p-6">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold text-navy-900">
            Avanzar trámite
          </h2>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Nuevo estado">
              <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as ProcedureStatus | '')}>
                <option value="">Seleccione…</option>
                {procedure.allowedNextStatuses.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Button onClick={submitStatusChange} disabled={!nextStatus || changingStatus}>
              {changingStatus ? 'Actualizando…' : 'Confirmar cambio'}
            </Button>
          </div>
          {nextStatus && (
            <div className="mt-3 max-w-md">
              <Field label={requiresComment ? 'Observación (obligatoria)' : 'Comentario (opcional)'}>
                <Textarea
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  rows={2}
                  required={requiresComment}
                />
              </Field>
            </div>
          )}
          {error && (
            <div className="mt-3">
              <ErrorNotice message={error} />
            </div>
          )}
        </Card>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold text-navy-900">
            Datos del trámite
          </h2>
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Solicitante" value={procedure.applicantName} />
            <Row label="Programa" value={procedure.programCode} />
            <Row label="Turno" value={procedure.shift === 'Day' ? 'Diurno' : 'Nocturno'} />
            <Row
              label="Documento presentado"
              value={procedure.documentType + (procedure.documentNumber ? ` (${procedure.documentNumber})` : '')}
            />
            <Row label="Registrado el" value={formatDateTime(procedure.registeredAt)} />
            {procedure.comment && <Row label="Comentario" value={procedure.comment} />}
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-semibold text-navy-900">
            Historial
          </h2>
          <ol className="flex flex-col gap-3">
            {procedure.history.map((h, i) => (
              <li key={i} className="border-l-2 border-line pl-3">
                <p className="text-sm font-medium text-ink">
                  {STATUS_LABELS[h.status]} · {h.changedByName}
                </p>
                {h.status === 'MesaDePartes' ? (
                  <p className="text-xs text-ink-soft">Hora no registrada</p>
                ) : (
                  <p className="text-xs text-ink-soft">{formatDateTime(h.changedAt)}</p>
                )}
                {h.comment && <p className="mt-0.5 text-sm text-ink-soft">{h.comment}</p>}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line pb-2">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
