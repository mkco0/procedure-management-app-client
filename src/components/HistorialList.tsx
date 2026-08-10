import { AreaBadge, EstadoBadge } from './ui';
import { describeStatus, type ProcedureStatus } from '../types/domain';
import { formatDateTime } from '../utils/format';

interface HistorialEntry {
  status: ProcedureStatus;
  comment: string | null;
  changedAt: string;
  changedByName?: string;
}

/**
 * Plain chronological log of what actually happened to a trámite — oldest
 * first, numbered so the order is legible at a glance. Replaces the old
 * stepper/rail visuals, which implied a fixed sequence of stages even though
 * a trámite can be derived to any of several áreas rather than one set path.
 */
export function HistorialList({ history, programName }: { history: HistorialEntry[]; programName?: string | null }) {
  return (
    <ol className="flex flex-col">
      {history.map((h, i) => {
        const { area, estado } = describeStatus(h.status);
        return (
          <li key={i} className={`flex gap-3 ${i > 0 ? 'mt-3 border-t border-line pt-3' : ''}`}>
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[11px] font-semibold text-navy-700">
              {i + 1}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <AreaBadge area={area} programName={programName} />
                <EstadoBadge estado={estado} />
                {h.status !== 'MesaDePartes' && (
                  <span className="text-sm text-ink-soft">{formatDateTime(h.changedAt)}</span>
                )}
                {h.changedByName && <span className="text-sm text-ink-soft">· {h.changedByName}</span>}
              </div>
              {h.comment && <p className="mt-1 text-sm text-ink-soft">{h.comment}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
