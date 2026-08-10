// Peru does not observe daylight saving time (fixed UTC-05:00 year-round).
// The backend now sends naive Lima wall-clock timestamps (no "Z"/offset
// suffix) rather than UTC, so we must NOT let the browser interpret them
// using its own local timezone — a viewer outside Peru would see the wrong
// time. We explicitly anchor every timestamp to America/Lima instead.

function parseLimaDate(value: string): Date {
  // If a value ever does carry an explicit zone (e.g. "Z" or "+00:00"),
  // trust it as-is. Otherwise treat the naive string as Peru local time.
  const hasExplicitZone = /Z$|[+-]\d{2}:\d{2}$/.test(value);
  return new Date(hasExplicitZone ? value : `${value}-05:00`);
}

const LIMA_TZ = 'America/Lima';

export function formatDate(value: string | Date): string {
  const d = typeof value === 'string' ? parseLimaDate(value) : value;
  return d.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: LIMA_TZ });
}

/**
 * Formats a plain `yyyy-mm-dd` date (the raw value from `<input type="date">`)
 * as `dd/mm/yyyy`. Pure string reordering — no Date object, no timezone,
 * since a date-only value has no time-of-day to misinterpret.
 */
export function formatIsoDate(value: string): string {
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

export function formatDateTime(value: string | Date): string {
  const d = typeof value === 'string' ? parseLimaDate(value) : value;
  return d.toLocaleString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: LIMA_TZ,
  });
}

/**
 * Display-only title case — the underlying data (names, catalog labels)
 * is stored in ALL CAPS, which this does not change; it only reformats
 * how it renders here.
 */
export function toTitleCase(value: string): string {
  return value.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (c) => c.toUpperCase());
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `S/ ${value.toFixed(2)}`;
}

/** Today's date in Lima, as "YYYY-MM-DD" — for default filters and <input type="date">. */
export function todayLimaISODate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LIMA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}
