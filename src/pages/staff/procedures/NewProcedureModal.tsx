import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '../../../api/client';
import { Modal } from '../../../components/Modal';
import { Button, Card, ErrorNotice, Field, Input, SearchableSelect, Select, Textarea } from '../../../components/ui';
import { ApplicantSearchInput } from '../../../components/ApplicantSearchInput';
import { ResponsableSelect } from '../../../components/ResponsableSelect';
import {
  APPLICANT_TYPE_LABELS,
  APPLICANT_TYPES,
  FIELD_LIMITS,
  PROCEDURE_TYPE_OTHER_NAME,
  SHIFT_LABELS,
  type ApplicantListItem,
  type ApplicantType,
  type Shift,
} from '../../../types/domain';
import { formatCurrency, todayLimaISODate } from '../../../utils/format';
import type { Catalogs } from '../../../utils/useCatalogs';

const DRAFT_KEY = 'tramite_draft';

interface Draft {
  fileNumber: string;
  registeredAt: string;
  documentType: string;
  documentNumber: string;
  procedureTypeId: string;
  procedureTypeOther: string;
  applicantType: ApplicantType;
  applicantName: string;
  programId: string;
  shift: Shift;
  personInChargeId: string;
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
    applicantType: 'Alumno',
    applicantName: '',
    programId: '',
    shift: 'Day',
    personInChargeId: '',
    idDocumentType: '',
    idDocumentNumber: '',
    comment: '',
  };
}

export function NewProcedureModal({
  open,
  catalogs,
  onClose,
  onCreated,
}: {
  open: boolean;
  catalogs: Catalogs;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? { ...emptyDraft(), ...JSON.parse(raw) } : emptyDraft();
  });
  const [applicantStatus, setApplicantStatus] = useState<'idle' | 'checking' | 'found' | 'new'>('idle');
  const [foundApplicant, setFoundApplicant] = useState<ApplicantListItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function clearForm() {
    sessionStorage.removeItem(DRAFT_KEY);
    setDraft(emptyDraft());
    setApplicantStatus('idle');
    setFoundApplicant(null);
    setError(null);
  }

  const isAlumno = draft.applicantType === 'Alumno';
  const nameLabel = draft.applicantType === 'Empresa' ? 'Razón social' : 'Nombres completos';
  const selectedPresented = catalogs.presentedDocumentTypes.find((d) => d.code === draft.documentType);
  const selectedProcedureType = catalogs.procedureTypes.find((t) => String(t.id) === draft.procedureTypeId);
  const isOtherProcedureType = selectedProcedureType?.name === PROCEDURE_TYPE_OTHER_NAME;

  function onApplicantTypeChange(type: ApplicantType) {
    setDraft((d) => ({
      ...d,
      applicantType: type,
      applicantName: '',
      idDocumentType: '',
      idDocumentNumber: '',
      programId: '',
    }));
    setApplicantStatus('idle');
    setFoundApplicant(null);
  }

  async function checkApplicant() {
    const value = draft.idDocumentNumber.trim();
    if (!value || !draft.idDocumentType) return;
    setApplicantStatus('checking');
    try {
      const found = await api.applicants.lookup(draft.applicantType, value);
      setFoundApplicant(found);
      if (found) {
        setApplicantStatus('found');
        setDraft((d) => ({
          ...d,
          applicantName: found.name,
          programId: found.programId !== null ? String(found.programId) : '',
          shift: found.shift ?? d.shift,
        }));
      } else {
        setApplicantStatus('new');
      }
    } catch {
      setApplicantStatus('idle');
    }
  }

  function pickApplicant(a: ApplicantListItem) {
    setFoundApplicant(a);
    setApplicantStatus('found');
    setDraft((d) => ({
      ...d,
      applicantName: a.name,
      idDocumentType: a.idDocumentType,
      idDocumentNumber: a.dni,
      programId: a.programId !== null ? String(a.programId) : '',
      shift: a.shift ?? d.shift,
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.procedures.create({
        fileNumber: draft.fileNumber,
        registeredAt: draft.registeredAt || null,
        documentType: draft.documentType,
        documentNumber: draft.documentNumber || null,
        procedureTypeId: Number(draft.procedureTypeId),
        procedureTypeOther: isOtherProcedureType ? draft.procedureTypeOther : null,
        applicantType: draft.applicantType,
        applicantName: draft.applicantName,
        programId: isAlumno ? Number(draft.programId) : null,
        shift: isAlumno ? draft.shift : null,
        personInChargeId: draft.personInChargeId ? Number(draft.personInChargeId) : null,
        idDocumentType: draft.idDocumentType,
        idDocumentNumber: draft.idDocumentNumber,
        comment: draft.comment || null,
      });
      clearForm();
      onClose();
      toast('Trámite registrado correctamente.');
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar el trámite.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Agregar trámite" maxWidth="max-w-2xl">
      <form onSubmit={onSubmit}>
          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold text-navy-900">Expediente</h2>
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
            <h2 className="mb-4 text-base font-semibold text-navy-900">Identidad del solicitante</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo de solicitante">
                <Select
                  value={draft.applicantType}
                  onChange={(e) => onApplicantTypeChange(e.target.value as ApplicantType)}
                  required
                >
                  {APPLICANT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {APPLICANT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tipo de documento">
                <Select value={draft.idDocumentType} onChange={(e) => set('idDocumentType', e.target.value)} required>
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
                  onBlur={checkApplicant}
                  maxLength={FIELD_LIMITS.studentDocNumberMax}
                  required
                />
              </Field>
            </div>
            {applicantStatus === 'checking' && <p className="mt-2 text-xs text-ink-soft">Buscando…</p>}
            {applicantStatus === 'found' && (
              <p className="mt-2 text-xs font-medium text-[color:var(--color-estado-completado)]">
                {APPLICANT_TYPE_LABELS[draft.applicantType]} encontrado — datos completados automáticamente.
              </p>
            )}
            {applicantStatus === 'found' && foundApplicant && isAlumno && !foundApplicant.shift && (
              <p className="mt-2 text-xs text-gold-700">
                Este alumno no tiene un turno registrado — verifique que el turno seleccionado sea correcto.
              </p>
            )}
            {applicantStatus === 'new' && (
              <p className="mt-2 text-xs text-gold-700">
                No existe un {APPLICANT_TYPE_LABELS[draft.applicantType].toLowerCase()} con ese documento — se creará al guardar.
              </p>
            )}
          </Card>

          <Card className="mt-4 p-6">
            <h2 className="mb-4 text-base font-semibold text-navy-900">Datos del solicitante</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label={nameLabel}>
                <ApplicantSearchInput
                  type={draft.applicantType}
                  value={draft.applicantName}
                  onChange={(name) => set('applicantName', name)}
                  onSelect={pickApplicant}
                  required
                />
              </Field>
              {isAlumno && (
                <>
                  <Field label="Programa">
                    <SearchableSelect
                      value={draft.programId}
                      onChange={(v) => set('programId', v)}
                      required
                      options={catalogs.programs.flatMap((p) => [
                        { value: String(p.id), label: `${p.code} — ${p.name}` },
                        ...p.oldNames.map((oldName) => ({
                          value: String(p.id),
                          label: `${p.code} — ${oldName} (nombre anterior)`,
                        })),
                      ])}
                    />
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
                </>
              )}
            </div>
          </Card>

          <Card className="mt-4 p-6">
            <h2 className="mb-4 text-base font-semibold text-navy-900">Trámite</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo de trámite">
                <SearchableSelect
                  value={draft.procedureTypeId}
                  onChange={(v) => set('procedureTypeId', v)}
                  required
                  options={catalogs.procedureTypes.map((t) => ({
                    value: String(t.id),
                    label: t.cost ? `${t.name} (${formatCurrency(t.cost)})` : t.name,
                  }))}
                />
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
              <ResponsableSelect
                orgUnits={catalogs.orgUnits}
                staff={catalogs.staff}
                value={draft.personInChargeId}
                onChange={(personInChargeId) => set('personInChargeId', personInChargeId)}
                hint="Personal a cargo del seguimiento (opcional)"
              />
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
    </Modal>
  );
}
