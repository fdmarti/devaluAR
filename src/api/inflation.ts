import { http } from './http'
import type { InflationDataset } from '../types/inflation'

/**
 * Downloads the historical inflation series.
 * Rejects with an `Error` in Spanish if the payload does not have the expected shape.
 */
export async function fetchInflationSeries(): Promise<InflationDataset> {
  try {
    const { data } = await http.get<InflationDataset>('/api/inflacion')

    if (!data) {
      throw new Error(
        'El dataset de inflación tiene un formato inválido: se esperaba un objeto con `rowCount` igual a la cantidad de filas y cada fila con `fecha` (YYYY-MM-DD) e `inflacion_mensual_pct` numérico.',
      )
    }
    return data

  } catch (error) {
    const detail = error instanceof Error ? error.message : 'causa desconocida'
    throw new Error(`No se pudo cargar el dataset de inflación: ${detail}`)
  }
}
