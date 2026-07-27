import { STATUS_LABELS, WORKFLOW_STEPS, type ProcedureStatus } from '../types/domain';

/**
 * Signature element: an institutional "circuit" stepper styled like a chain
 * of office stamps a physical expediente folder collects as it moves
 * between Mesa de Partes → ... → Completado. Observado/Rechazado are
 * called out separately since they're off the happy path.
 *
 * The "Entrega" step stands for three parallel offices (see WORKFLOW_STEPS):
 * it renders as a single stamp and, once reached, takes the label of the
 * office the expediente is actually being handed over at.
 */
export function StatusStepper({ status }: { status: ProcedureStatus }) {
  const currentIndex = WORKFLOW_STEPS.findIndex((step) => step.statuses.includes(status));
  const isDetoured = status === 'Observado' || status === 'Rechazado';

  return (
    <div className="w-full">
      <ol className="flex xs:flex-row flex-col items-center">
        {WORKFLOW_STEPS.map((step, i) => {
          const done = !isDetoured && i < currentIndex;
          const active = !isDetoured && i === currentIndex;
          // A grouped step names the specific office only while it's the
          // current one; otherwise it keeps its generic label.
          const label = active && step.statuses.length > 1 ? STATUS_LABELS[status] : step.label;
          return (
            <li key={step.label} className="flex flex-1 items-center last:flex-none">
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
                  {label}
                </span>
              </div>
              {i < WORKFLOW_STEPS.length - 1 && (
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
