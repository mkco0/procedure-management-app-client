import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../../api/client';
import { Button, Card, ErrorNotice, Field, Input, PageHeader } from '../../components/ui';
import { FIELD_LIMITS } from '../../types/domain';

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < FIELD_LIMITS.passwordMin) {
      setError(`La nueva contraseña debe tener al menos ${FIELD_LIMITS.passwordMin} caracteres.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }

    setSaving(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Mi cuenta" title="Cambiar contraseña" />

      <Card className="max-w-md p-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Contraseña actual">
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="Nueva contraseña">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={FIELD_LIMITS.passwordMin}
              required
            />
          </Field>
          <Field label="Confirmar nueva contraseña">
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={FIELD_LIMITS.passwordMin}
              required
            />
          </Field>

          {error && <ErrorNotice message={error} />}
          {success && (
            <p className="text-sm font-medium text-[color:var(--color-status-completado)]">
              Contraseña actualizada correctamente.
            </p>
          )}

          <div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
