import type {
  DatasetInflacion,
  MesInflacion,
  ResumenAnio,
  ResumenMes,
  Tendencia,
} from '../types/inflacion'

/** Deriva la clave 'YYYY-MM' de una fecha 'YYYY-MM-DD'. */
export function claveDesdeFecha(fecha: string): string {
  return fecha.slice(0, 7)
}

/**
 * Normaliza el dataset crudo a una serie mensual ordenada, calculando el
 * factor acumulado desde el primer mes (inclusive).
 *
 * Si alguna variación mensual es `<= -100` el factor acumulado no es válido
 * (se anula o se invierte el nivel de precios) y se marca como `NaN` en lugar
 * de propagar un factor sin sentido.
 */
export function normalizarSerie(dataset: DatasetInflacion): MesInflacion[] {
  const filas = [...dataset.data].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0))

  let factor = 1
  return filas.map((fila) => {
    const clave = claveDesdeFecha(fila.fecha)
    const variacionMensual = fila.inflacion_mensual_pct
    if (variacionMensual <= -100) {
      factor = Number.NaN
    } else if (!Number.isNaN(factor)) {
      factor *= 1 + variacionMensual / 100
    }
    return {
      clave,
      anio: Number(clave.slice(0, 4)),
      mes: Number(clave.slice(5, 7)),
      variacionMensual,
      factorAcumulado: factor,
    }
  })
}

/** Devuelve el último mes de la serie, si hay alguno. */
export function ultimoMes(meses: MesInflacion[]): MesInflacion | undefined {
  return meses.length > 0 ? meses[meses.length - 1] : undefined
}

/**
 * Calcula los derivados de un mes concreto: variación interanual, factor
 * acumulado y equivalencia de un peso histórico en valor actual.
 *
 * Devuelve `null` si la clave no existe en la serie.
 */
export function calcularResumen(meses: MesInflacion[], clave: string): ResumenMes | null {
  const indice = meses.findIndex((mes) => mes.clave === clave)
  if (indice === -1) return null

  const mes = meses[indice]
  const ultimo = ultimoMes(meses)
  const factorUltimo = ultimo?.factorAcumulado ?? Number.NaN

  // Interanual: producto de los 12 meses que terminan en este mes.
  let variacionInteranual = Number.NaN
  if (indice >= 11) {
    let factor = 1
    for (let i = indice - 11; i <= indice; i += 1) {
      factor *= 1 + meses[i].variacionMensual / 100
    }
    variacionInteranual = (factor - 1) * 100
  }

  const factorAcumulado = mes.factorAcumulado
  const variacionAcumuladaDesdeInicio = (factorAcumulado - 1) * 100
  const pesoActualPorPesoHistorico = factorUltimo / factorAcumulado

  return {
    clave: mes.clave,
    variacionMensual: mes.variacionMensual,
    variacionInteranual,
    factorAcumulado,
    variacionAcumuladaDesdeInicio,
    pesoActualPorPesoHistorico,
  }
}

/**
 * Dirección de una variación: 'sube' si es positiva, 'baja' si es negativa.
 *
 * Devuelve `null` cuando no hay dirección que dibujar: variación de 0 exacto
 * (ni sube ni baja) o valor no finito.
 */
export function tendenciaDeVariacion(valor: number): Tendencia | null {
  if (!Number.isFinite(valor) || valor === 0) return null
  return valor > 0 ? 'sube' : 'baja'
}

/**
 * Diferencia en puntos porcentuales entre una variación y la del período
 * anterior: `valorActual − valorAnterior`.
 *
 * Devuelve `null` si alguno de los dos valores no es finito (no hay
 * comparación posible). Una diferencia de `0` es válida: la dirección la
 * decide `tendenciaDeVariacion`.
 */
export function diferenciaDeVariacion(
  valorActual: number,
  valorAnterior: number,
): number | null {
  if (!Number.isFinite(valorActual) || !Number.isFinite(valorAnterior)) return null
  return valorActual - valorAnterior
}

/**
 * Calcula los derivados de un año calendario. Puede estar incompleto (1943
 * arranca en marzo y 2026 termina en septiembre).
 */
export function calcularResumenAnual(meses: MesInflacion[], anio: number): ResumenAnio {
  const delAnio = meses.filter((mes) => mes.anio === anio)

  let factor = 1
  let suma = 0
  for (const mes of delAnio) {
    factor *= 1 + mes.variacionMensual / 100
    suma += mes.variacionMensual
  }

  return {
    anio,
    variacionAnual: (factor - 1) * 100,
    mesesIncluidos: delAnio.length,
    completo: delAnio.length === 12,
    variacionMensualPromedio: delAnio.length > 0 ? suma / delAnio.length : Number.NaN,
  }
}
