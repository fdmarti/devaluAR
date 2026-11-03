import type { Tarjeta } from "../types/tarjeta"
import { formatearPorcentaje } from "./formato"
import { diferenciaDeVariacion, tendenciaDeVariacion } from "./inflacion"

/**
 * Dirección y diferencia de una variación frente al mes anterior.
 *
 * La flecha describe cómo **cambió** la variación, no si es positiva: si la
 * variación mensual subió de 1,7 % a 1,9 %, la diferencia es `+0,2` y la
 * flecha es roja hacia arriba. Sin diferencia calculable no hay flecha.
 */
export function variacionConDiferencia(
    valorActual: number,
    valorAnterior: number | undefined,
): Pick<Tarjeta, 'tendencia' | 'tendenciaDescripcion' | 'diferencia'> {
    if (valorAnterior === undefined) return {}
    const diferencia = diferenciaDeVariacion(valorActual, valorAnterior)
    if (diferencia === null) return {}
    const tendencia = tendenciaDeVariacion(diferencia)
    if (!tendencia) return {}
    return {
        tendencia,
        tendenciaDescripcion: `${tendencia} respecto al mes anterior`,
        diferencia: formatearPorcentaje(diferencia),
    }
}