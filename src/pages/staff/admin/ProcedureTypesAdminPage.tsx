import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../../api/client';
import { Button, Card, Checkbox, ErrorNotice, Field, Input, PageHeader } from '../../../components/ui';
import type { ProcedureTypeListItem } from '../../../types/domain';
import { formatCurrency } from '../../../utils/format';

interface FormState {
  id: number | null;
  name: string;
  cost: string;
  isActive: boolean;
}

const emptyForm: FormState = { id: null, name: '', cost: '', isActive: true };

export function ProcedureTypesAdminPage() {
  const [items, setItems] = useState<ProcedureTypeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.procedureTypes.list().then(setItems).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    const cost = form.cost.trim() ? Number(form.cost) : null;
    try {
      if (form.id === null) {
        await api.procedureTypes.create({ name: form.name, cost });
      } else {
        await api.procedureTypes.update(form.id, { name: form.name, cost, isActive: form.isActive });
      }
      setForm(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el tipo de trámite.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administración"
        title="Tipos de trámite"
        actions={<Button onClick={() => setForm(emptyForm)}>AGREGAR TIPO DE TRÁMITE</Button>}
      />

      {form && (
        <Card className="mb-4 p-6">
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <Field label="Nombre">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="Costo (S/, opcional)">
              <Input value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} inputMode="decimal" />
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
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Costo</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="hover:bg-navy-100/40">
                  <td className="px-3 py-2">{t.name}</td>
                  <td className="px-3 py-2 font-mono">{formatCurrency(t.cost)}</td>
                  <td className="px-3 py-2">{t.isActive ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => {
                        setForm({ id: t.id, name: t.name, cost: t.cost !== null ? String(t.cost) : '', isActive: t.isActive });
                        setError(null);
                      }}
                      className="text-md font-medium text-navy-700 hover:underline"
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
