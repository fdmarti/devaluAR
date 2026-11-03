import { format, isValid, parse, parseISO } from 'date-fns'

const LOCALE = 'es-AR'

/**
 * Formatea un porcentaje con signo explícito: `+1,9 %`.
 * Los valores no finitos devuelven `—`.
 */
export function formatearPorcentaje(valor: number, decimales = 1): string {
  if (!Number.isFinite(valor)) return '—'
  const formato = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
    signDisplay: 'always',
  })
  return `${formato.format(valor)} %`
}

/**
 * Formatea un número muy grande de forma legible.
 *
 * Por debajo de 1e15 usa notación compacta (`4,08 B`). A partir de 1e15 cae a
 * notación científica con exponente legible (`4,08 × 10¹⁶`), porque el compacto
 * de `Intl` no maneja ese rango.
 */
export function formatearNumeroGrande(valor: number): string {
  if (!Number.isFinite(valor)) return '—'
  const absoluto = Math.abs(valor)
  if (absoluto === 0) return '0'

  if (absoluto >= 1e15) {
    return notacionCientifica(valor)
  }

  const compacto = new Intl.NumberFormat(LOCALE, {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(valor)
  return compacto
}

/**
 * Convierte la clave interna `YYYY-MM` en `MM/yyyy` para mostrar.
 * Devuelve `—` si la clave no tiene el formato esperado.
 *
 * La clave se parsea con `parse(clave, 'yyyy-MM', ...)`, no con `new Date(clave)`:
 * `new Date` interpreta la cadena como UTC y en zonas horarias negativas se corre
 * un día. `parse` usa la zona local y devuelve el día 1 del mes.
 */
export function formatearMesAnio(clave: string): string {
  const fecha = parse(clave, 'yyyy-MM', new Date())
  if (!isValid(fecha)) return '—'
  return format(fecha, 'MM/yyyy')
}

/** Formatea una fecha como `dd/MM/yyyy` en zona horaria local. */
export function formatearFecha(fecha: Date): string {
  if (!isValid(fecha)) return '—'
  return format(fecha, 'dd/MM/yyyy')
}

/**
 * Convierte un timestamp ISO en `MM/yyyy`.
 * Devuelve `—` si no parsea.
 */
export function formatearAnioMesDesdeIso(iso: string): string {
  const fecha = parseISO(iso)
  if (!isValid(fecha)) return '—'
  return format(fecha, 'MM/yyyy')
}

const SUPERINDICES: Record<string, string> = {
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

function superindice(texto: string): string {
  return [...texto].map((caracter) => SUPERINDICES[caracter] ?? caracter).join('')
}

/** `4.0788e+16` → `4,08 × 10¹⁶` */
function notacionCientifica(valor: number): string {
  const [mantisa, exponente] = valor.toExponential(2).split('e')
  const exponenteNumero = Number(exponente)
  const signo = exponenteNumero < 0 ? '⁻' : ''
  const digitos = String(Math.abs(exponenteNumero))

  const partes = mantisa.split('.')
  const entero = Number(partes[0]).toLocaleString(LOCALE)
  const decimal = partes[1] ? `,${partes[1]}` : ''

  return `${entero}${decimal} × 10${signo}${superindice(digitos)}`
}
