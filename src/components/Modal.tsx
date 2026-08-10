import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  overlay,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Pinned below the scroll area — for action buttons that must stay reachable. */
  footer?: ReactNode;
  /**
   * Covers this modal's own panel — for confirmations that must interrupt it
   * without a second portal, which would fight this one's focus trap and
   * Escape handler.
   */
  overlay?: ReactNode;
  maxWidth?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Callers routinely pass an inline onClose (e.g. a local `handleClose` that
  // closes over other state), so it's a new function reference on every one
  // of their re-renders — typing in a field inside the modal included. Read
  // it from a ref instead of the dependency array below, so the effect (and
  // its focus trap / scroll lock) only runs when the modal actually opens or
  // closes, not on every keystroke.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/40" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-sm bg-surface shadow-lg outline-none`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-navy-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 text-ink-soft hover:bg-canvas hover:text-ink"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="shrink-0 border-t border-line px-5 py-3">{footer}</div>}
        {overlay && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-navy-950/30 p-6">
            <div className="w-full max-w-sm rounded-sm border border-line bg-surface p-5 shadow-lg">{overlay}</div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
