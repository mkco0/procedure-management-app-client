import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../../api/client';
import { Button, Card, Checkbox, ErrorNotice, Field, Input, PageHeader, Select } from '../../../components/ui';
import { ROLE_LABELS, type UserListItem, type UserRole } from '../../../types/domain';

interface FormState {
  id: number | null;
  name: string;
  dni: string;
  password: string;
  role: UserRole;
  isActive: boolean;
}

const emptyForm: FormState = { id: null, name: '', dni: '', password: '', role: 'Secretary', isActive: true };

export function UsersAdminPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.users.list().then(setUsers).finally(() => setLoading(false));
  }

  useEffect(load, []);

  function startEdit(u: UserListItem) {
    setForm({ id: u.id, name: u.name, dni: u.dni, password: '', role: u.role, isActive: u.isActive });
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      if (form.id === null) {
        await api.users.create({ name: form.name, dni: form.dni, password: form.password, role: form.role });
      } else {
        await api.users.update(form.id, {
          name: form.name,
          dni: form.dni,
          role: form.role,
          isActive: form.isActive,
          password: form.password || null,
        });
      }
      setForm(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el usuario.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Administración" title="Usuarios" actions={<Button onClick={() => setForm(emptyForm)}>AGREGAR USUARIO</Button>} />

      {form && (
        <Card className="mb-4 p-6">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-base font-semibold text-navy-900">
            {form.id === null ? 'Nuevo usuario' : 'Editar usuario'}
          </h2>
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <Field label="Nombre completo">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="DNI">
              <Input
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                maxLength={8}
                required
              />
            </Field>
            <Field label={form.id === null ? 'Contraseña' : 'Nueva contraseña (opcional)'}>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={form.id === null}
              />
            </Field>
            <Field label="Rol">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
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
                <th className="px-3 py-2 font-medium">DNI</th>
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Rol</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-navy-100/40">
                  <td className="px-3 py-2 font-mono">{u.dni}</td>
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{ROLE_LABELS[u.role]}</td>
                  <td className="px-3 py-2">{u.isActive ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => startEdit(u)} className="text-md font-medium text-navy-700 hover:underline">
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
