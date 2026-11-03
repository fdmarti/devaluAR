import { http } from './http'
import type { DatasetInflacion } from '../types/inflacion'

/**
 * Descarga la serie histórica de inflación.
 * Rechaza con un `Error` en español si el payload no tiene la forma esperada.
 */
export async function obtenerSerieInflacion(): Promise<DatasetInflacion> {
  try {
    const { data } = await http.get<DatasetInflacion>('/api/inflacion')

    if (!data) {
      throw new Error(
        'El dataset de inflación tiene un formato inválido: se esperaba un objeto con `rowCount` igual a la cantidad de filas y cada fila con `fecha` (YYYY-MM-DD) e `inflacion_mensual_pct` numérico.',
      )
    }
    return data

  } catch (error) {
    const detalle = error instanceof Error ? error.message : 'causa desconocida'
    throw new Error(`No se pudo cargar el dataset de inflación: ${detalle}`)
  }
}
