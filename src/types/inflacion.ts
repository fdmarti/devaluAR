/** Fila cruda tal como viene del dataset de hacecuentas.com. */
export interface FilaInflacion {
  fecha: string // 'YYYY-MM-DD', último día del mes
  inflacion_mensual_pct: number
}

/** Envoltorio del dataset completo. */
export interface DatasetInflacion {
  name: string
  description: string
  license: string
  licenseName: string
  creator: string
  creatorUrl: string
  source: string
  sourceUrl: string
  generatedAt: string
  fields: string[]
  rowCount: number
  data: FilaInflacion[]
}

/** Un mes normalizado, con la clave 'YYYY-MM' para ordenar y comparar. */
export interface MesInflacion {
  clave: string // 'YYYY-MM'
  anio: number
  mes: number // 1-12
  variacionMensual: number // % mensual
  /** Factor acumulado desde el primer mes del dataset, inclusive. 1 = sin cambios. */
  factorAcumulado: number
}

/** Cálculos derivados de un mes concreto. */
export interface ResumenMes {
  clave: string
  variacionMensual: number
  /** Variación acumulada de los 12 meses que terminan en este mes, en %. */
  variacionInteranual: number
  /** Factor acumulado desde el primer mes del dataset hasta este mes. */
  factorAcumulado: number
  /** Variación acumulada en % desde el primer mes del dataset hasta este mes. */
  variacionAcumuladaDesdeInicio: number
  /** Cuánto vale hoy un peso de este mes. */
  pesoActualPorPesoHistorico: number
}

/** Cálculos de un año calendario. Puede estar incompleto. */
export interface ResumenAnio {
  anio: number
  /** Variación compuesta de los meses disponibles del año, en %. */
  variacionAnual: number
  mesesIncluidos: number
  /** false si al año le faltan meses (1943 y 2026 lo están). */
  completo: boolean
  variacionMensualPromedio: number
}

/** Dirección de una variación: 'sube' (aumentó) o 'baja' (disminuyó). */
export type Tendencia = 'sube' | 'baja'
