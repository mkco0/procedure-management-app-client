import { useEffect, useState, type FormEvent } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { api, ApiError } from '../../api/client';
import { Button, Card, Checkbox, ErrorNotice, Field, Input, PageHeader, Select } from '../../components/ui';
import {
  APPLICANT_TYPE_LABELS,
  APPLICANT_TYPES,
  SHIFT_LABELS,
  type ApplicantListItem,
  type ApplicantType,
  type Shift,
} from '../../types/domain';
import { useCatalogs } from '../../utils/useCatalogs';

interface FormState {
  id: number | null;
  type: ApplicantType;
  idDocumentType: string;
  dni: string;
  name: string;
  programId: string;
  shift: Shift;
  isActive: boolean;
}

function emptyForm(type: ApplicantType): FormState {
  return {
    id: null,
    type,
    idDocumentType: '',
    dni: '',
    name: '',
    programId: '',
    shift: 'Day',
    isActive: true,
  };
}

const PAGE_SIZE = 50;

export function ApplicantsPage() {
  const catalogs = useCatalogs();
  const [typeFilter, setTypeFilter] = useState<ApplicantType | ''>('Alumno');
  const [applicants, setApplicants] = useState<ApplicantListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Bumped to force a refetch after a save, without duplicating the effect body.
  const [reloadKey, setReloadKey] = useState(0);

  // Typing shouldn't fire one request per keystroke; wait for a pause first.
  const [debouncedSearch] = useDebounceValue(search, 300);

  // A new search or type filter starts over at the first page.
  useEffect(() => setPage(0), [debouncedSearch, typeFilter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.applicants
      .list(typeFilter || undefined, debouncedSearch || undefined, false, PAGE_SIZE, page * PAGE_SIZE)
      .then((res) => {
        // A slower earlier request must not overwrite a newer one's results.
        if (cancelled) return;
        setApplicants(res.items);
        setTotal(res.total);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [typeFilter, debouncedSearch, page, reloadKey]);

  const load = () => setReloadKey((k) => k + 1);

  function startCreate() {
    setForm(emptyForm(typeFilter || 'Alumno'));
    setError(null);
  }

  function startEdit(a: ApplicantListItem) {
    setForm({
      id: a.id,
      type: a.type,
      idDocumentType: a.idDocumentType,
      dni: a.dni,
      name: a.name,
      programId: a.programId !== null ? String(a.programId) : '',
      shift: a.shift ?? 'Day',
      isActive: a.isActive,
    });
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    const isAlumno = form.type === 'Alumno';
    try {
      if (form.id === null) {
        await api.applicants.create({
          type: form.type,
          idDocumentType: form.idDocumentType,
          dni: form.dni,
          name: form.name,
          programId: isAlumno ? Number(form.programId) : null,
          shift: isAlumno ? form.shift : null,
        });
      } else {
        await api.applicants.update(form.id, {
          idDocumentType: form.idDocumentType,
          dni: form.dni,
          name: form.name,
          programId: isAlumno ? Number(form.programId) : null,
          shift: isAlumno ? form.shift : null,
          isActive: form.isActive,
        });
      }
      setForm(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el solicitante.');
    } finally {
      setSaving(false);
    }
  }

  const isAlumnoForm = form?.type === 'Alumno';
  const nameLabel = form?.type === 'Empresa' ? 'Razón social' : 'Nombres completos';

  return (
    <div>
      <PageHeader
        title="Solicitantes"
        count={loading ? undefined : total}
        actions={<Button onClick={startCreate}>AGREGAR SOLICITANTE</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ApplicantType | '')}
          className="max-w-xs"
        >
          <option value="">Todos los tipos</option>
          {APPLICANT_TYPES.map((t) => (
            <option key={t} value={t}>
              {APPLICANT_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
        <Input
          placeholder="Buscar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {form && (
        <Card className="mb-4 p-6">
          <h2 className="mb-4 text-base font-semibold text-navy-900">
            {form.id === null ? 'Nuevo solicitante' : 'Editar solicitante'}
          </h2>
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <Field label="Tipo de solicitante">
              {form.id === null ? (
                <Select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as ApplicantType })}
                  required
                >
                  {APPLICANT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {APPLICANT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              ) : (
                <p className="px-3 py-2 text-sm text-ink-soft">{APPLICANT_TYPE_LABELS[form.type]}</p>
              )}
            </Field>
            <Field label="Tipo de documento">
              <Select
                value={form.idDocumentType}
                onChange={(e) => setForm({ ...form, idDocumentType: e.target.value })}
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
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                required
              />
            </Field>
            <Field label={nameLabel}>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            {isAlumnoForm && (
              <>
                <Field label="Programa">
                  <Select value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })} required>
                    <option value="">Seleccione…</option>
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
            {form.id !== null && (
              <div className="flex items-end">
                <Checkbox
                  label="Activo"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
              </div>
            )}
            {error && (
              <div className="col-span-2">
                <ErrorNotice message={error} />
              </div>
            )}
            <div className="col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto">
        {loading ? (
          <p className="p-6 text-sm text-ink-soft">Cargando…</p>
        ) : (
          <table className="sheet-table w-full text-left text-sm">
            <thead>
              <tr className="bg-navy-100 text-xs uppercase tracking-wide text-navy-900">
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Documento</th>
                <th className="px-3 py-2 font-medium">Nombres / Razón social</th>
                <th className="px-3 py-2 font-medium">Programa</th>
                <th className="px-3 py-2 font-medium">Turno</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((a) => (
                <tr key={a.id} className="hover:bg-navy-100/40">
                  <td className="px-3 py-2">{APPLICANT_TYPE_LABELS[a.type]}</td>
                  <td className="px-3 py-2">
                    {a.idDocumentType} {a.dni}
                  </td>
                  <td className="px-3 py-2">{a.name}</td>
                  <td className="px-3 py-2">{a.programCode ?? <span className="text-ink-soft">—</span>}</td>
                  <td className="px-3 py-2">
                    {a.shift ? SHIFT_LABELS[a.shift] : <span className="text-ink-soft">—</span>}
                  </td>
                  <td className="px-3 py-2">{a.isActive ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => startEdit(a)} className="text-md font-medium text-navy-700 hover:underline">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {!loading && total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-ink-soft">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button
              variant="secondary"
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
