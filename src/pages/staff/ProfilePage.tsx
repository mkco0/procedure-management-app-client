import { KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Card, PageHeader } from '../../components/ui';
import { ROLE_LABELS } from '../../types/domain';

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader eyebrow="Mi cuenta" title="Perfil" />

      <Card className="max-w-md p-6">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs text-ink-soft">Nombre</p>
            <p className="text-sm font-medium text-ink">{user?.name}</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">Rol</p>
            <p className="text-sm font-medium text-ink">{user ? ROLE_LABELS[user.role] : ''}</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft">DNI</p>
            <p className="text-sm font-medium text-ink">{user?.dni}</p>
          </div>
        </div>

        <Link
          to="/app/cambiar-contrasena"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-navy-700 hover:underline"
        >
          <KeyRound size={16} />
          Cambiar contraseña
        </Link>
      </Card>
    </div>
  );
}
