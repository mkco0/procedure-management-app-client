import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { api } from '../api/client';
import type { StudentListItem } from '../types/domain';

const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 20;

/** Free-text input for applicantName that offers matching students as you type. */
export function StudentSearchInput({
  value,
  onChange,
  onSelect,
  required,
  disabled,
  className = '',
}: {
  value: string;
  onChange: (name: string) => void;
  onSelect: (student: StudentListItem) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  // Only re-search while the operator is actively typing — not when `value` changes
  // because a lookup/selection just autofilled it (that would immediately re-query
  // for the name we ourselves just set, and can reopen the list on next focus).
  const typingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedValue] = useDebounceValue(value, 250);

  useEffect(() => {
    const term = debouncedValue.trim();
    if (!typingRef.current || term.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api.students
      .list(term, false, RESULT_LIMIT)
      .then((found) => {
        if (cancelled) return;
        setResults(found);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setResults([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedValue]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [results]);

  function pick(student: StudentListItem) {
    typingRef.current = false;
    onSelect(student);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open && e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const hit = results[active];
      if (hit) {
        e.preventDefault();
        pick(hit);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  }

  const showList = open && value.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => {
          typingRef.current = true;
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy-700 focus:ring-1 focus:ring-navy-700"
        autoComplete="off"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-sm border border-line bg-surface py-1 shadow-sm"
        >
          {loading ? (
            <li className="px-3 py-2 text-sm text-ink-soft">Buscando…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-soft">Sin resultados — se creará un alumno nuevo.</li>
          ) : (
            results.map((s, i) => (
              <li key={s.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  className={`block w-full px-3 py-2 text-left text-sm ${
                    i === active ? 'bg-navy-100 text-navy-900' : 'text-ink hover:bg-navy-100'
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(s)}
                >
                  {s.name} · {s.dni} · {s.programCode}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
