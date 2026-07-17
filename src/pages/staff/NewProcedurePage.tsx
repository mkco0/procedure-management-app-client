import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import { Button, Card, ErrorNotice, Field, Input, PageHeader, Select, Textarea } from '../../components/ui';
import { FIELD_LIMITS, PROCEDURE_TYPE_OTHER_NAME, SHIFT_LABELS, type Shift } from '../../types/domain';
import { formatCurrency, todayLimaISODate } from '../../utils/format';
import { useCatalogs } from '../../utils/useCatalogs';

const DRAFT_KEY = 'tramite_draft';

interface Draft {
  fileNumber: string;
  registeredAt: string;
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

function emptyDraft(): Draft {
  return {
    fileNumber: '',
    registeredAt: todayLimaISODate(),
    documentType: '',
    documentNumber: '',
    procedureTypeId: '',
    procedureTypeOther: '',
    applicantName: '',
    programId: '',
    shift: 'Day',
    idDocumentType: '',
    idDocumentNumber: '',
    comment: '',
  };
}

export function NewProcedurePage() {
  const catalogs = useCatalogs();

  const [draft, setDraft] = useState<Draft>(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? { ...emptyDraft(), ...JSON.parse(raw) } : emptyDraft();
  });
  const [studentStatus, setStudentStatus] = useState<'idle' | 'checking' | 'found' | 'new'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ fileNumber: string; correlative: string; accessCode: string } | null>(null);

  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function clearForm() {
    sessionStorage.removeItem(DRAFT_KEY);
    setDraft(emptyDraft());
    setStudentStatus('idle');
    setError(null);
  }

  const selectedPresented = catalogs.presentedDocumentTypes.find((d) => d.code === draft.documentType);
  const selectedProcedureType = catalogs.procedureTypes.find((t) => String(t.id) === draft.procedureTypeId);
  const isOtherProcedureType = selectedProcedureType?.name === PROCEDURE_TYPE_OTHER_NAME;

  async function checkStudent() {
    const value = draft.idDocumentNumber.trim();
    if (!value || !draft.idDocumentType) return;
    setStudentStatus('checking');
    try {
      const found = await api.students.lookup(value);
      if (found) {
        setStudentStatus('found');
        setDraft((d) => ({
          ...d,
          applicantName: found.name,
          programId: String(found.programId),
          shift: found.shift,
        }));
      } else {
        setStudentStatus('new');
      }
    } catch {
      setStudentStatus('idle');
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.procedures.create({
        fileNumber: draft.fileNumber,
        registeredAt: draft.registeredAt || null,
        documentType: draft.documentType,
        documentNumber: draft.documentNumber || null,
        procedureTypeId: Number(draft.procedureTypeId),
        procedureTypeOther: isOtherProcedureType ? draft.procedureTypeOther : null,
        applicantName: draft.applicantName,
        programId: Number(draft.programId),
        shift: draft.shift,
        idDocumentType: draft.idDocumentType,
        idDocumentNumber: draft.idDocumentNumber,
        comment: draft.comment || null,
      });
      sessionStorage.removeItem(DRAFT_KEY);
      setSuccess({
        fileNumber: res.procedure.fileNumber,
        correlative: `${res.procedure.correlativeNumber}-${res.procedure.correlativeYear}`,
        accessCode: res.accessCode,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar el trámite.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div>
        <PageHeader eyebrow="Operación" title="Trámite registrado" />
        <Card className="max-w-lg p-6">
          <p className="text-sm text-ink-soft">El trámite se registró correctamente.</p>
          <dl className="mt-4 flex flex-col gap-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">Correlativo</dt>
              <dd className="font-mono text-lg text-navy-900">{success.correlative}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">N° de expediente</dt>
              <dd className="font-mono text-lg text-navy-900">{success.fileNumber}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-soft">Código de acceso (entregar al alumno)</dt>
              <dd className="flex items-center gap-2">
                <span className="font-mono text-lg text-navy-900">{success.accessCode}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(success.accessCode)}
                  className="text-xs font-medium text-navy-700 hover:underline"
                >
                  Copiar
                </button>
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex gap-2">
            <Button
              onClick={() => {
                clearForm();
                setSuccess(null);
              }}
            >
              Registrar otro trámite
            </Button>
            <Link to="/app/tramites">
              <Button variant="secondary">Ver planilla</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operación"
        title="Agregar trámite"
      />

      <form onSubmit={onSubmit} className="max-w-2xl">
        <Card className="p-6">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold text-navy-900">
            Expediente
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="N° de expediente" hint="Asignado por Mesa de Partes">
              <Input
                value={draft.fileNumber}
                onChange={(e) => set('fileNumber', e.target.value)}
                maxLength={FIELD_LIMITS.fileNumberMax}
                required
              />
            </Field>
            <Field label="Fecha de registro">
              <Input
                type="date"
                value={draft.registeredAt}
                onChange={(e) => set('registeredAt', e.target.value)}
                max={todayLimaISODate()}
                required
              />
            </Field>
          </div>
        </Card>

        <Card className="mt-4 p-6">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold text-navy-900">
            Identidad del solicitante
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo de documento">
              <Select
                value={draft.idDocumentType}
                onChange={(e) => set('idDocumentType', e.target.value)}
                required
              >
                <option value="">Seleccione…</option>
                {catalogs.identityDocumentTypes.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="N° de documento">
              <Input
                value={draft.idDocumentNumber}
                onChange={(e) => set('idDocumentNumber', e.target.value)}
                onBlur={checkStudent}
                maxLength={FIELD_LIMITS.studentDocNumberMax}
                required
              />
            </Field>
          </div>
          {studentStatus === 'checking' && <p className="mt-2 text-xs text-ink-soft">Buscando alumno…</p>}
          {studentStatus === 'found' && (
            <p className="mt-2 text-xs font-medium text-[color:var(--color-status-completado)]">
              Alumno encontrado — datos completados automáticamente.
            </p>
          )}
          {studentStatus === 'new' && (
            <p className="mt-2 text-xs text-gold-700">No existe un alumno con ese documento — se creará al guardar.</p>
          )}
        </Card>

        <Card className="mt-4 p-6">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold text-navy-900">
            Datos del solicitante
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombres completos">
              <Input value={draft.applicantName} onChange={(e) => set('applicantName', e.target.value)} required />
            </Field>
            <Field label="Programa">
              <Select value={draft.programId} onChange={(e) => set('programId', e.target.value)} required>
                <option value="">Seleccione…</option>
                {catalogs.programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Turno">
              <Select value={draft.shift} onChange={(e) => set('shift', e.target.value as Shift)} required>
                {Object.entries(SHIFT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        <Card className="mt-4 p-6">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold text-navy-900">
            Trámite
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo de trámite">
              <Select value={draft.procedureTypeId} onChange={(e) => set('procedureTypeId', e.target.value)} required>
                <option value="">Seleccione…</option>
                {catalogs.procedureTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.cost ? ` (${formatCurrency(t.cost)})` : ''}
                  </option>
                ))}
              </Select>
            </Field>
            {isOtherProcedureType && (
              <Field label="Especifique el trámite">
                <Input
                  value={draft.procedureTypeOther}
                  onChange={(e) => set('procedureTypeOther', e.target.value)}
                  maxLength={FIELD_LIMITS.procedureTypeOtherMax}
                  required
                />
              </Field>
            )}
            <Field label="Documento presentado">
              <Select value={draft.documentType} onChange={(e) => set('documentType', e.target.value)} required>
                <option value="">Seleccione…</option>
                {catalogs.presentedDocumentTypes.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            {selectedPresented && selectedPresented.numberMode !== 'None' && (
              <Field label={selectedPresented.numberMode === 'Identifier' ? 'N°/Identificador' : 'Descripción'}>
                <Input
                  value={draft.documentNumber}
                  onChange={(e) => set('documentNumber', e.target.value)}
                  maxLength={
                    selectedPresented.numberMode === 'Identifier'
                      ? FIELD_LIMITS.presentedIdentifierMax
                      : FIELD_LIMITS.presentedDescriptionMax
                  }
                  required
                />
              </Field>
            )}
          </div>
          <div className="mt-4">
            <Field label="(OPCIONAL) - OBSERVACIONES">
              <Textarea
                value={draft.comment}
                onChange={(e) => set('comment', e.target.value)}
                maxLength={FIELD_LIMITS.commentMax}
                rows={3}
              />
            </Field>
          </div>
        </Card>

        {error && (
          <div className="mt-4">
            <ErrorNotice message={error} />
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <Button type="button" variant="secondary" onClick={clearForm}>
            LIMPIAR
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando…' : 'AGREGAR TRÁMITE'}
          </Button>
        </div>
      </form>
    </div>
  );
}
