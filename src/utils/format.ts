import { format, isValid, parse, parseISO } from 'date-fns'
import type { Trend } from '../types/inflation'

const LOCALE = 'es-AR'

/**
 * Formats a percentage with an explicit sign: `+1,9 %`.
 * Non-finite values return `—`.
 */
export function formatPercentage(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '—'
  const formatter = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: 'always',
  })
  return `${formatter.format(value)} %`
}

/**
 * Formats an integer with the es-AR thousands separator: `1003` → `1.003`.
 * Non-finite values return `—`.
 */
export function formatInteger(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(value)
}

/**
 * Formats a very large number in a readable way.
 *
 * Below 1e15 it uses compact notation (`4,08 B`). From 1e15 it falls back to
 * scientific notation with a readable exponent (`4,08 × 10¹⁶`), because the
 * compact notation of `Intl` does not handle that range.
 */
export function formatLargeNumber(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const absolute = Math.abs(value)
  if (absolute === 0) return '0'

  if (absolute >= 1e15) {
    return scientificNotation(value)
  }

  const compact = new Intl.NumberFormat(LOCALE, {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)
  return compact
}

/**
 * Converts the internal `YYYY-MM` key into `MM/yyyy` for display.
 * Returns `—` if the key does not have the expected format.
 *
 * The key is parsed with `parse(key, 'yyyy-MM', ...)`, not with
 * `new Date(key)`: `new Date` interprets the string as UTC and in negative
 * time zones it shifts by a day. `parse` uses the local zone and returns the
 * first day of the month.
 */
export function formatMonthYear(key: string): string {
  const date = parse(key, 'yyyy-MM', new Date())
  if (!isValid(date)) return '—'
  return format(date, 'MM/yyyy')
}

/** Formats a date as `dd/MM/yyyy` in the local time zone. */
export function formatDate(date: Date): string {
  if (!isValid(date)) return '—'
  return format(date, 'dd/MM/yyyy')
}

/**
 * Converts an ISO timestamp into `MM/yyyy`.
 * Returns `—` if it does not parse.
 */
export function formatYearMonthFromIso(iso: string): string {
  const date = parseISO(iso)
  if (!isValid(date)) return '—'
  return format(date, 'MM/yyyy')
}

/** Spanish labels for each trend direction. Used for screen-reader text. */
export const TREND_LABELS: Record<Trend, string> = {
  up: 'sube',
  down: 'baja',
}

/** 'sube' | 'baja'. */
export function formatTrendLabel(trend: Trend): string {
  return TREND_LABELS[trend]
}

/** 'sube respecto al mes anterior'. */
export function formatTrendDescription(trend: Trend, comparison: string): string {
  return `${formatTrendLabel(trend)} ${comparison}`
}

const SUPERSCRIPT_CHARS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
}

function toSuperscript(text: string): string {
  return [...text].map((character) => SUPERSCRIPT_CHARS[character] ?? character).join('')
}

/** `4.0788e+16` → `4,08 × 10¹⁶` */
function scientificNotation(value: number): string {
  const [mantissa, exponent] = value.toExponential(2).split('e')
  const exponentNumber = Number(exponent)
  const sign = exponentNumber < 0 ? '⁻' : ''
  const digits = String(Math.abs(exponentNumber))

  const parts = mantissa.split('.')
  const integer = Number(parts[0]).toLocaleString(LOCALE)
  const decimal = parts[1] ? `,${parts[1]}` : ''

  return `${integer}${decimal} × 10${sign}${toSuperscript(digits)}`
}
