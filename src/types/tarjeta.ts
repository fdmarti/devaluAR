import type { Tendencia } from "./inflacion"

/** Tarjeta de métrica del home: texto ya formateado y dirección opcional. */
export interface Tarjeta {
    titulo: string
    valor: string
    subtitulo: string
    /** Dirección de la variación, si aplica. */
    tendencia?: Tendencia
    /** Texto accesible que explica contra qué compara la variación. */
    tendenciaDescripcion?: string
    /** Diferencia respecto del mes anterior, ya formateada. */
    diferencia?: string
}