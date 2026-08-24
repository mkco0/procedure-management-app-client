import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../../api/client';
import { CopyButton, ErrorNotice, Field, Input, SearchableSelect, Select, Textarea } from '../../../components/ui';
import { ResponsableSelect } from '../../../components/ResponsableSelect';
import { APPLICANT_TYPE_LABELS, PROCEDURE_TYPE_OTHER_NAME, SHIFT_LABELS, type ProcedureDetail, type Shift } from '../../../types/domain';
import type { Catalogs } from '../../../utils/useCatalogs';

interface EditForm {
  documentType: string;
  documentNumber: string;
  procedureTypeId: string;
  procedureTypeOther: string;
  applicantName: string;
  programId: string;
  shift: Shift;
  personInChargeId: string;
  idDocumentType: string;
  idDocumentNumber: string;
  comment: string;
}

function toEditForm(p: ProcedureDetail): EditForm {
  return {
    documentType: p.documentType,
    documentNumber: p.documentNumber ?? '',
    procedureTypeId: String(p.procedureTypeId),
    procedureTypeOther: p.procedureTypeOther ?? '',
    applicantName: p.applicantName,
    programId: p.programId !== null ? String(p.programId) : '',
    shift: p.shift ?? 'Day',
    personInChargeId: p.personInChargeId ? String(p.personInChargeId) : '',
    // Blank on purpose: these are "reassign identity" overrides, not the
    // trámite's current identity document.
    idDocumentType: '',
    idDocumentNumber: '',
    comment: p.comment ?? '',
  };
}

/**
 * Always-editable — there's no separate "view" vs "edit" mode. The submit
 * button lives in the hosting modal's footer (via the `form` id below), so
 * saving stays reachable without scrolling back up through Avanzar/Recorrido.
 */
export function ProcedureEditForm({
  procedure,
  catalogs,
  onDirtyChange,
  onSavingChange,
  onSaved,
}: {
  procedure: ProcedureDetail;
  catalogs: Catalogs;
  onDirtyChange: (dirty: boolean) => void;
  onSavingChange: (saving: boolean) => void;
  onSaved: (updated: ProcedureDetail) => void;
}) {
  const [initial, setInitial] = useState<EditForm>(() => toEditForm(procedure));
  const [form, setForm] = useState<EditForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onDirtyChange(JSON.stringify(form) !== JSON.stringify(initial));
  }, [form, initial, onDirtyChange]);

  useEffect(() => {
    onSavingChange(saving);
  }, [saving, onSavingChange]);

  const selectedPresented = catalogs.presentedDocumentTypes.find((d) => d.code === form.documentType);
  const selectedType = catalogs.procedureTypes.find((t) => String(t.id) === form.procedureTypeId);
  const isOtherType = selectedType?.name === PROCEDURE_TYPE_OTHER_NAME;
  const isAlumno = procedure.applicantType === 'Alumno';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api.procedures.update(procedure.id, {
        documentType: form.documentType,
        documentNumber: form.documentNumber || null,
        procedureTypeId: Number(form.procedureTypeId),
        procedureTypeOther: isOtherType ? form.procedureTypeOther : null,
        applicantName: form.applicantName,
        programId: isAlumno ? Number(form.programId) : null,
        shift: isAlumno ? form.shift : null,
        personInChargeId: form.personInChargeId ? Number(form.personInChargeId) : null,
        idDocumentType: form.idDocumentType || null,
        idDocumentNumber: form.idDocumentNumber || null,
        comment: form.comment || null,
      });
      // The just-saved values become the new baseline, so an unrelated later
      // edit doesn't get compared against the pre-save original.
      setInitial(form);
      onSaved(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form id="procedure-edit-form" onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
      <Field label="Tipo de solicitante">
        <p className="px-3 py-2 text-sm text-ink-soft">{APPLICANT_TYPE_LABELS[procedure.applicantType]}</p>
      </Field>
      <Field label={procedure.applicantType === 'Empresa' ? 'Razón social' : 'Nombres completos'}>
        <Input value={form.applicantName} onChange={(e) => setForm({ ...form, applicantName: e.target.value })} required />
      </Field>
      {isAlumno && (
        <>
          <Field label="Programa">
            <Select value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })} required>
              {catalogs.programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Turno">
            <Select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value as Shift })}>
              {Object.entries(SHIFT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </>
      )}
      <Field label="Tipo de trámite">
        <SearchableSelect
          value={form.procedureTypeId}
          onChange={(v) => setForm({ ...form, procedureTypeId: v })}
          required
          options={catalogs.procedureTypes.map((t) => ({ value: String(t.id), label: t.name }))}
        />
      </Field>
      {isOtherType && (
        <Field label="Especifique el trámite">
          <Input
            value={form.procedureTypeOther}
            onChange={(e) => setForm({ ...form, procedureTypeOther: e.target.value })}
            required
          />
        </Field>
      )}
      <Field label="Documento presentado">
        <Select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })} required>
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
            value={form.documentNumber}
            onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
            required
          />
        </Field>
      )}
      <ResponsableSelect
        orgUnits={catalogs.orgUnits}
        staff={catalogs.staff}
        value={form.personInChargeId}
        onChange={(personInChargeId) => setForm({ ...form, personInChargeId })}
        hint="Personal a cargo del seguimiento."
      />

      <div className="col-span-2 flex items-center gap-1 text-sm text-ink-soft">
        Documento de identidad actual: <span className="font-medium text-ink">{procedure.applicantDni}</span>
        <CopyButton text={procedure.applicantDni} />
      </div>
      <Field label="Reasignar identidad (opcional)" hint="Solo si necesita corregir el DNI del solicitante.">
        <div className="flex gap-2">
          <Select
            value={form.idDocumentType}
            onChange={(e) => setForm({ ...form, idDocumentType: e.target.value })}
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
            value={form.idDocumentNumber}
            onChange={(e) => setForm({ ...form, idDocumentNumber: e.target.value })}
            placeholder="N° de documento"
          />
        </div>
      </Field>

      <div className="col-span-2">
        <Field label="Observaciones">
          <Textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={2} />
        </Field>
      </div>

      {error && (
        <div className="col-span-2">
          <ErrorNotice message={error} />
        </div>
      )}
    </form>
  );
}
