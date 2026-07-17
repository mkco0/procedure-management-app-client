import { type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS } from '../types/domain';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-sm px-3 py-2 text-sm transition-colors ${
    isActive ? 'bg-navy-800 text-white' : 'text-ink hover:bg-navy-100'
  }`;

function NavSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-soft underline">{title}</p>
      <nav className="flex flex-col gap-0.5">{children}</nav>
    </div>
  );
}

export function StaffLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="no-print flex w-64 shrink-0 flex-col border-r border-line bg-surface px-3 py-5">
        <div className="mb-6 px-3">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight text-navy-900">
            IESTP Carlos Cueto Fernandini
          </p>
          <p className="text-xs text-ink-soft">Plataforma de Trámites</p>
        </div>

        <NavSection title="Operación">
          <NavLink to="/app/tramites" className={navLinkClass} end>
            VER TRÁMITES
          </NavLink>
          <NavLink to="/app/tramites/nuevo" className={navLinkClass}>
            AGREGAR TRÁMITE
          </NavLink>
          <NavLink to="/app/alumnos" className={navLinkClass}>
            ALUMNOS
          </NavLink>
          <NavLink to="/app/correlativos" className={navLinkClass}>
            CORRELATIVOS
          </NavLink>
        </NavSection>

        {user?.role === 'Admin' && (
          <NavSection title="Administración">
            <NavLink to="/app/admin/usuarios" className={navLinkClass}>
              USUARIOS
            </NavLink>
            <NavLink to="/app/admin/tipos" className={navLinkClass}>
              TIPOS DE TRÁMITE
            </NavLink>
            <NavLink to="/app/admin/programas" className={navLinkClass}>
              PROGRAMAS
            </NavLink>
            <NavLink to="/app/admin/doc-presentados" className={navLinkClass}>
              DOCU. PRESENTADOS
            </NavLink>
            <NavLink to="/app/admin/doc-identidad" className={navLinkClass}>
              DOCU. IDENTIDAD
            </NavLink>
          </NavSection>
        )}

        <div className="mt-auto border-t border-line pt-3 px-3">
          <p className="text-sm text-ink-soft mb-2">{user?.name}</p>
          <p className="text-sm text-ink-soft">ROL: {user ? ROLE_LABELS[user.role] : ''}</p>
          <p className="text-sm text-ink-soft">DNI: {user?.dni}</p>
          <button onClick={logout} className="mt-2 text-xs font-medium text-red-500 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="print-full-width flex-1 overflow-x-hidden px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
