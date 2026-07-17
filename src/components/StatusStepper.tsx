import { STATUS_LABELS, STATUS_ORDER, type ProcedureStatus } from '../types/domain';

/**
 * Signature element: an institutional "circuit" stepper styled like a chain
 * of office stamps a physical expediente folder collects as it moves
 * between Mesa de Partes → ... → Completado. Observado/Rechazado are
 * called out separately since they're off the happy path.
 */
export function StatusStepper({ status }: { status: ProcedureStatus }) {
  const currentIndex = STATUS_ORDER.indexOf(status);
  const isDetoured = status === 'Observado' || status === 'Rechazado';

  return (
    <div className="w-full">
      <ol className="flex items-center">
        {STATUS_ORDER.map((step, i) => {
          const done = !isDetoured && i < currentIndex;
          const active = !isDetoured && i === currentIndex;
          return (
            <li key={step} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-[family-name:var(--font-display)] text-sm font-semibold ${
                    done
                      ? 'border-navy-800 bg-navy-800 text-white'
                      : active
                        ? 'border-navy-800 bg-white text-navy-800'
                        : 'border-line bg-white text-ink-soft'
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`max-w-20 text-center text-[11px] leading-tight ${
                    active ? 'font-semibold text-navy-900' : 'text-ink-soft'
                  }`}
                >
                  {STATUS_LABELS[step]}
                </span>
              </div>
              {i < STATUS_ORDER.length - 1 && (
                <div className={`mx-1 mb-5 h-0.5 flex-1 ${done ? 'bg-navy-800' : 'bg-line'}`} />
              )}
            </li>
          );
        })}
      </ol>

      {isDetoured && (
        <div
          className="mt-4 flex items-center gap-2 rounded-sm border px-3 py-2 text-sm font-medium"
          style={{
            borderColor: status === 'Rechazado' ? 'var(--color-status-rechazado)' : 'var(--color-status-observado)',
            color: status === 'Rechazado' ? 'var(--color-status-rechazado)' : 'var(--color-status-observado)',
          }}
        >
          Fuera del circuito regular: {STATUS_LABELS[status]}
        </div>
      )}
    </div>
  );
}
