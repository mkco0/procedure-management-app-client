import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { STATUS_LABELS, type ProcedureStatus } from '../types/domain';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700 cursor-pointer';
  const variants: Record<string, string> = {
    primary: 'bg-navy-800 text-white hover:bg-navy-700',
    secondary: 'bg-white text-navy-800 border border-line hover:bg-navy-100',
    ghost: 'text-navy-800 hover:bg-navy-100',
    danger: 'bg-white text-[color:var(--color-status-rechazado)] border border-line hover:bg-red-50',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy-700 focus:ring-1 focus:ring-navy-700 ${props.className ?? ''}`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy-700 focus:ring-1 focus:ring-navy-700 ${props.className ?? ''}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy-700 focus:ring-1 focus:ring-navy-700 ${props.className ?? ''}`}
    />
  );
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Drop-in for long <Select> lists — type to filter, still stores the option value. */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccione…',
  required,
  disabled,
  className = '',
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const selected = options.find((o) => o.value === value);
  const filtered = open
    ? options.filter((o) => normalizeSearch(o.label).includes(normalizeSearch(query)))
    : options;

  useEffect(() => {
    inputRef.current?.setCustomValidity(required && !value ? 'Seleccione una opción.' : '');
  }, [required, value]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  function pick(next: string) {
    onChange(next);
    setOpen(false);
    setQuery('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open && e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = filtered[active];
      if (hit) pick(hit.value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setQuery('');
    }
  }

  const display = open ? query : (selected?.label ?? '');

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled}
        placeholder={placeholder}
        value={display}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange('');
        }}
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onKeyDown={onKeyDown}
        className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy-700 focus:ring-1 focus:ring-navy-700"
        autoComplete="off"
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-sm border border-line bg-surface py-1 shadow-sm"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-soft">Sin resultados</li>
          ) : (
            filtered.map((o, i) => (
              <li key={o.value} role="option" aria-selected={o.value === value}>
                <button
                  type="button"
                  className={`block w-full px-3 py-2 text-left text-sm ${
                    i === active ? 'bg-navy-100 text-navy-900' : 'text-ink hover:bg-navy-100'
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(o.value)}
                >
                  {o.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export function Checkbox(props: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input type="checkbox" {...rest} className="h-4 w-4 rounded-sm border-line text-navy-800 focus:ring-navy-700" />
      {label}
    </label>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-sm border border-line bg-surface shadow-sm ${className}`}>{children}</div>;
}

export function PageHeader({ eyebrow, title, actions }: { eyebrow?: string; title: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
      <div>
        {eyebrow && <p className="text-xs font-medium uppercase tracking-wider text-gold-700 mb-2">{eyebrow}</p>}
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-navy-900">{title}</h1>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

const STATUS_COLOR_VAR: Record<ProcedureStatus, string> = {
  MesaDePartes: 'var(--color-status-partes)',
  SecretariaAcademica: 'var(--color-status-academica)',
  DireccionGeneral: 'var(--color-status-direccion)',
  SecretariaEntrega: 'var(--color-status-entrega)',
  Completado: 'var(--color-status-completado)',
  Observado: 'var(--color-status-observado)',
  Rechazado: 'var(--color-status-rechazado)',
};

export function StatusBadge({ status }: { status: ProcedureStatus }) {
  const color = STATUS_COLOR_VAR[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ borderColor: color, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ErrorNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-sm border border-[color:var(--color-status-rechazado)]/40 bg-red-50 px-3 py-2 text-sm text-[color:var(--color-status-rechazado)]">
      {message}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-sm border border-dashed border-line px-6 py-12 text-center">
      <p className="font-[family-name:var(--font-display)] text-lg text-navy-900">{title}</p>
      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
    </div>
  );
}
