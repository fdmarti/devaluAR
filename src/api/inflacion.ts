import { http } from './http'
import type { DatasetInflacion, FilaInflacion } from '../types/inflacion'

const RUTA_DATASET = '/data/inflation.data.json'

const RE_CLAVE = /^\d{4}-\d{2}-\d{2}$/

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null
}

function esFilaInflacion(valor: unknown): valor is FilaInflacion {
  if (!esObjeto(valor)) return false
  if (typeof valor.fecha !== 'string' || !RE_CLAVE.test(valor.fecha)) return false
  return typeof valor.inflacion_mensual_pct === 'number' && Number.isFinite(valor.inflacion_mensual_pct)
}

/**
 * Type guard del dataset completo. Devuelve el dataset normalizado (con los
 * campos de metadatos opcionalmente completados) o `null` si la forma no
 * corresponde.
 */
export function esDatasetInflacion(valor: unknown): DatasetInflacion | null {
  if (!esObjeto(valor)) return null
  if (typeof valor.rowCount !== 'number') return null
  if (!Array.isArray(valor.data)) return null
  if (valor.data.length === 0) return null
  if (valor.rowCount !== valor.data.length) return null
  if (!valor.data.every(esFilaInflacion)) return null

  return {
    name: typeof valor.name === 'string' ? valor.name : '',
    description: typeof valor.description === 'string' ? valor.description : '',
    license: typeof valor.license === 'string' ? valor.license : '',
    licenseName: typeof valor.licenseName === 'string' ? valor.licenseName : '',
    creator: typeof valor.creator === 'string' ? valor.creator : '',
    creatorUrl: typeof valor.creatorUrl === 'string' ? valor.creatorUrl : '',
    source: typeof valor.source === 'string' ? valor.source : '',
    sourceUrl: typeof valor.sourceUrl === 'string' ? valor.sourceUrl : '',
    generatedAt: typeof valor.generatedAt === 'string' ? valor.generatedAt : '',
    fields: Array.isArray(valor.fields) ? valor.fields.map((f) => String(f)) : [],
    rowCount: valor.rowCount,
    data: valor.data,
  }
}

/**
 * Descarga la serie histórica de inflación.
 * Rechaza con un `Error` en español si el payload no tiene la forma esperada.
 */
export async function obtenerSerieInflacion(): Promise<DatasetInflacion> {
  let crudo: unknown
  try {
    const respuesta = await http.get<unknown>(RUTA_DATASET)
    crudo = respuesta.data
  } catch (error) {
    const detalle = error instanceof Error ? error.message : 'causa desconocida'
    throw new Error(`No se pudo cargar el dataset de inflación: ${detalle}`)
  }

  const dataset = esDatasetInflacion(crudo)
  if (!dataset) {
    throw new Error(
      'El dataset de inflación tiene un formato inválido: se esperaba un objeto con `rowCount` igual a la cantidad de filas y cada fila con `fecha` (YYYY-MM-DD) e `inflacion_mensual_pct` numérico.',
    )
  }
  return dataset
}
