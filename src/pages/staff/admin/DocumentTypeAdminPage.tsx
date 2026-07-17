import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../../../api/client';
import { Button, Card, Checkbox, ErrorNotice, Field, Input, PageHeader, Select } from '../../../components/ui';

interface CatalogItem {
  id: number;
  code: string;
  name: string;
  numberMode: string;
  isActive: boolean;
  sortOrder: number;
}

interface FormState {
  id: number | null;
  code: string;
  name: string;
  numberMode: string;
  sortOrder: string;
  isActive: boolean;
}

export function DocumentTypeAdminPage({
  title,
  eyebrow,
  numberModeOptions,
  list,
  create,
  update,
}: {
  title: string;
  eyebrow: string;
  numberModeOptions: { value: string; label: string }[];
  list: () => Promise<CatalogItem[]>;
  create: (data: { code: string; name: string; numberMode: string; sortOrder: number }) => Promise<CatalogItem>;
  update: (id: number, data: { name: string; numberMode: string; isActive: boolean; sortOrder: number }) => Promise<CatalogItem>;
}) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    list().then(setItems).finally(() => setLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startCreate() {
    setForm({ id: null, code: '', name: '', numberMode: numberModeOptions[0].value, sortOrder: '0', isActive: true });
    setError(null);
  }

  function startEdit(item: CatalogItem) {
    setForm({
      id: item.id,
      code: item.code,
      name: item.name,
      numberMode: item.numberMode,
      sortOrder: String(item.sortOrder),
      isActive: item.isActive,
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
        await create({ code: form.code, name: form.name, numberMode: form.numberMode, sortOrder: Number(form.sortOrder) || 0 });
      } else {
        await update(form.id, {
          name: form.name,
          numberMode: form.numberMode,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder) || 0,
        });
      }
      setForm(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  const modeLabel = (value: string) => numberModeOptions.find((o) => o.value === value)?.label ?? value;

  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} actions={<Button onClick={startCreate}>AGREGAR TIPO DE DOCUMENTO</Button>} />

      {form && (
        <Card className="mb-4 p-6">
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <Field label="Código">
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={form.id !== null} required />
            </Field>
            <Field label="Nombre">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="Modo de numeración">
              <Select value={form.numberMode} onChange={(e) => setForm({ ...form, numberMode: e.target.value })}>
                {numberModeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Orden">
              <Input value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} inputMode="numeric" />
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
                <th className="px-3 py-2 font-medium">Modo</th>
                <th className="px-3 py-2 font-medium">Orden</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-navy-100/40">
                  <td className="px-3 py-2 font-mono">{item.code}</td>
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2">{modeLabel(item.numberMode)}</td>
                  <td className="px-3 py-2 font-mono">{item.sortOrder}</td>
                  <td className="px-3 py-2">{item.isActive ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => startEdit(item)} className="text-md font-medium text-navy-700 hover:underline">
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
