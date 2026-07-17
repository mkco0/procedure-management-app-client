import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
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
