import { Link, Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-navy-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
            IESTP Carlos Cueto Fernandini
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-3xl px-6 py-8 text-center text-xs text-ink-soft">
        Instituto de Educación Superior Tecnológico Público Carlos Cueto Fernandini
      </footer>
    </div>
  );
}
