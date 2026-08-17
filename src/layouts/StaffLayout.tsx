import { type ReactNode, useEffect, useLayoutEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  FileText,
  UsersRound,
  ListOrdered,
  Tags,
  GraduationCap,
  FileCheck,
  IdCard,
  ChevronRight,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const SIDEBAR_COLLAPSED_KEY = 'tramites_sidebar_collapsed';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200 ease-out ${
    isActive
      ? 'bg-white/10 text-white font-medium'
      : 'text-navy-100/80 hover:translate-x-0.5 hover:bg-white/5 hover:text-white'
  }`;

function NavSection({ children }: { children: ReactNode }) {
  return <nav className="flex flex-col gap-0.5">{children}</nav>;
}

function NavIndicator({ container }: { container: HTMLDivElement | null }) {
  const location = useLocation();
  const [rect, setRect] = useState<{ top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    if (!container) return;

    function measure() {
      const active = container!.querySelector<HTMLElement>('a[aria-current="page"]');
      setRect(active ? { top: active.offsetTop, height: active.offsetHeight } : null);
    }

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);
    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(container, { attributes: true, subtree: true, attributeFilter: ['aria-current', 'class'] });
    document.fonts?.ready.then(measure);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname, container]);

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-0 w-[3px] rounded-full bg-gold-600 shadow-[0_0_8px_rgba(184,134,46,0.65)] transition-all duration-300 ease-out"
      style={{
        top: rect ? rect.top + rect.height * 0.2 : 0,
        height: rect ? rect.height * 0.6 : 0,
        opacity: rect ? 1 : 0,
      }}
    />
  );
}

export function StaffLayout() {
  const { user, logout } = useAuth();
  const [navContainer, setNavContainer] = useState<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');

  // Continuous cascade delay across every nav link regardless of which
  // NavSection it's in — CSS nth-child alone resets per <nav>, which made
  // the Admin section restart its own stagger instead of continuing the one.
  let staggerIndex = 0;
  function staggerStyle() {
    const delay = collapsed ? 0 : 180 + staggerIndex * 30;
    staggerIndex += 1;
    return { transitionDelay: `${delay}ms` };
  }

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  // Ctrl/Cmd+B toggles the sidebar — the same shortcut VSCode, Slack, and Notion use.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside
        className={`no-print sticky top-0 h-screen shrink-0 overflow-hidden border-navy-950 bg-navy-900 transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          collapsed ? 'w-0 border-r-0' : 'w-64 border-r'
        }`}
      >
        <div
          className={`flex h-full w-64 flex-col overflow-y-auto px-3 py-5 font-[family-name:var(--font-sidebar)] transition-transform ease-out ${
            collapsed ? '-translate-x-2 duration-150' : 'translate-x-0 duration-300'
          }`}
        >
          <div
            className={`mb-6 px-3 text-center transition-opacity ease-out ${
              collapsed ? 'opacity-0 duration-150' : 'opacity-100 delay-150 duration-300'
            }`}
          >
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight text-white">
              IESTP Carlos Cueto Fernandini
            </p>
            <p className="text-xs text-navy-100/70">Plataforma de Trámites</p>
          </div>

          <div ref={setNavContainer} className="nav-stagger relative" data-open={!collapsed}>
            <NavIndicator container={navContainer} />

            <NavSection>
              <NavLink to="/app/tramites" className={navLinkClass} style={staggerStyle()}>
                <FileText size={16} />
                Trámites
              </NavLink>
              <NavLink to="/app/solicitantes" className={navLinkClass} style={staggerStyle()}>
                <UsersRound size={16} />
                Solicitantes
              </NavLink>
              <NavLink to="/app/correlativos" className={navLinkClass} style={staggerStyle()}>
                <ListOrdered size={16} />
                Correlativos
              </NavLink>
            </NavSection>

            {user?.role === 'Admin' && (
              <NavSection>
                <NavLink to="/app/admin/usuarios" className={navLinkClass} style={staggerStyle()}>
                  <UsersRound size={16} />
                  Usuarios
                </NavLink>
                <NavLink to="/app/admin/tipos" className={navLinkClass} style={staggerStyle()}>
                  <Tags size={16} />
                  Tipos de trámite
                </NavLink>
                <NavLink to="/app/admin/programas" className={navLinkClass} style={staggerStyle()}>
                  <GraduationCap size={16} />
                  Programas
                </NavLink>
                <NavLink to="/app/admin/doc-presentados" className={navLinkClass} style={staggerStyle()}>
                  <FileCheck size={16} />
                  Docu. presentados
                </NavLink>
                <NavLink to="/app/admin/doc-identidad" className={navLinkClass} style={staggerStyle()}>
                  <IdCard size={16} />
                  Docu. identidad
                </NavLink>
              </NavSection>
            )}
          </div>

          <div
            className={`mt-auto flex items-center gap-1 border-t border-navy-800 px-3 pt-3 transition-opacity ease-out ${
              collapsed ? 'opacity-0 duration-150' : 'opacity-100 delay-300 duration-300'
            }`}
          >
            <NavLink
              to="/app/perfil"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-white/5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                <User size={16} />
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{user?.name}</span>
              <ChevronRight size={16} className="shrink-0 text-navy-100/60" />
            </NavLink>
            <button
              onClick={logout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="print-full-width flex-1 overflow-x-hidden px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
