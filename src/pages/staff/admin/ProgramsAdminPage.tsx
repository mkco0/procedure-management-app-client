import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../../api/client';
import { Button, Card, Checkbox, ErrorNotice, Field, Input, PageHeader } from '../../../components/ui';
import type { ProgramListItem } from '../../../types/domain';

interface FormState {
  id: number | null;
  code: string;
  name: string;
  isActive: boolean;
}

const emptyForm: FormState = { id: null, code: '', name: '', isActive: true };

export function ProgramsAdminPage() {
  const [items, setItems] = useState<ProgramListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.programs.list().then(setItems).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      if (form.id === null) {
        await api.programs.create({ code: form.code, name: form.name });
      } else {
        await api.programs.update(form.id, { name: form.name, isActive: form.isActive });
      }
      setForm(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el programa.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Administración" title="Programas" actions={<Button onClick={() => setForm(emptyForm)}>Nuevo programa</Button>} />

      {form && (
        <Card className="mb-4 p-6">
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <Field label="Código">
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={form.id !== null} required />
            </Field>
            <Field label="Nombre">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            {form.id !== null && (
              <div className="flex items-end">
                <Checkbox label="Activo" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
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
                <th className="px-3 py-2 font-medium">Código</th>
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-navy-100/40">
                  <td className="px-3 py-2 font-mono">{p.code}</td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">{p.isActive ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => {
                        setForm({ id: p.id, code: p.code, name: p.name, isActive: p.isActive });
                        setError(null);
                      }}
                      className="text-xs font-medium text-navy-700 hover:underline"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
