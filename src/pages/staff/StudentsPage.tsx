import { useEffect, useState, type FormEvent } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { api, ApiError } from '../../api/client';
import { Button, Card, Checkbox, ErrorNotice, Field, Input, PageHeader, Select } from '../../components/ui';
import { SHIFT_LABELS, type Shift, type StudentListItem } from '../../types/domain';
import { useCatalogs } from '../../utils/useCatalogs';

interface FormState {
  id: number | null;
  idDocumentType: string;
  dni: string;
  name: string;
  programId: string;
  shift: Shift;
  isActive: boolean;
}

const emptyForm: FormState = {
  id: null,
  idDocumentType: '',
  dni: '',
  name: '',
  programId: '',
  shift: 'Day',
  isActive: true,
};

const PAGE_SIZE = 50;

export function StudentsPage() {
  const catalogs = useCatalogs();
  const [students, setStudents] = useState<StudentListItem[]>([]);
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

  // A new search starts over at the first page.
  useEffect(() => setPage(0), [debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.students
      .list(debouncedSearch || undefined, false, PAGE_SIZE, page * PAGE_SIZE)
      .then((res) => {
        // A slower earlier request must not overwrite a newer one's results.
        if (cancelled) return;
        setStudents(res.items);
        setTotal(res.total);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, page, reloadKey]);

  const load = () => setReloadKey((k) => k + 1);

  function startCreate() {
    setForm(emptyForm);
    setError(null);
  }

  function startEdit(s: StudentListItem) {
    setForm({
      id: s.id,
      idDocumentType: s.idDocumentType,
      dni: s.dni,
      name: s.name,
      programId: String(s.programId),
      shift: s.shift ?? 'Day',
      isActive: s.isActive,
    });
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      if (form.id === null) {
        await api.students.create({
          idDocumentType: form.idDocumentType,
          dni: form.dni,
          name: form.name,
          programId: Number(form.programId),
          shift: form.shift,
        });
      } else {
        await api.students.update(form.id, {
          idDocumentType: form.idDocumentType,
          dni: form.dni,
          name: form.name,
          programId: Number(form.programId),
          shift: form.shift,
          isActive: form.isActive,
        });
      }
      setForm(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el alumno.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Alumnos"
        count={loading ? undefined : total}
        actions={<Button onClick={startCreate}>AGREGAR ALUMNO</Button>}
      />

      <Input
        placeholder="Buscar"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-xs"
      />

      {form && (
        <Card className="mb-4 p-6">
          <h2 className="mb-4 text-base font-semibold text-navy-900">
            {form.id === null ? 'Nuevo alumno' : 'Editar alumno'}
          </h2>
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
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
            <Field label="Nombres completos">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
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
                <th className="px-3 py-2 font-medium">Documento</th>
                <th className="px-3 py-2 font-medium">Nombres</th>
                <th className="px-3 py-2 font-medium">Programa</th>
                <th className="px-3 py-2 font-medium">Turno</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-navy-100/40">
                  <td className="px-3 py-2">
                    {s.idDocumentType} {s.dni}
                  </td>
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2">{s.programCode}</td>
                  <td className="px-3 py-2">
                    {s.shift ? SHIFT_LABELS[s.shift] : <span className="text-ink-soft">Sin turno</span>}
                  </td>
                  <td className="px-3 py-2">{s.isActive ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => startEdit(s)} className="text-md font-medium text-navy-700 hover:underline">
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
