import { WORKFLOW_STEPS, areaLabel, isDetoured, stepIndex, type Area, type Estado } from '../types/domain';

/**
 * Signature element: an institutional "circuit" stepper styled like a chain
 * of office stamps a physical expediente folder collects as it moves
 * between Mesa de Partes → ... → Completado. Observado/Rechazado are
 * called out separately since they're off the happy path.
 *
 * The "Entrega" step stands for three parallel offices: it renders as a
 * single stamp and, once reached (estado ParaEntrega), takes the label of
 * the office the expediente is actually being handed over at.
 */
export function StatusStepper({
  area,
  estado,
  programName,
}: {
  area: Area;
  estado: Estado;
  programName?: string | null;
}) {
  const currentIndex = stepIndex(area, estado);
  const detoured = isDetoured(estado);

  return (
    <div className="w-full">
      <ol className="flex xs:flex-row flex-col items-center">
        {WORKFLOW_STEPS.map((step, i) => {
          const done = !detoured && i < currentIndex;
          const active = !detoured && i === currentIndex;
          // The Secretaría Académica step covers the derivation áreas too, and
          // the Entrega step covers all three hand-over offices; while either
          // is the current step, show the specific área rather than the
          // generic group label.
          const grouped = step.areas.length !== 1;
          const label = active && grouped ? areaLabel(area, programName) : step.label;
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

      {detoured && (
        <div
          className="mt-4 flex items-center gap-2 rounded-sm border px-3 py-2 text-sm font-medium"
          style={{
            borderColor: estado === 'Rechazado' ? 'var(--color-estado-rechazado)' : 'var(--color-estado-observado)',
            color: estado === 'Rechazado' ? 'var(--color-estado-rechazado)' : 'var(--color-estado-observado)',
          }}
        >
          {estado === 'Observado'
            ? `Observado en ${areaLabel(area, programName)} — retomará ahí una vez resuelto.`
            : `Fuera del circuito regular: rechazado en ${areaLabel(area, programName)}`}
        </div>
      )}
    </div>
  );
}
