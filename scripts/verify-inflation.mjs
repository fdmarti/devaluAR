#!/usr/bin/env node
/**
 * Valida el JSON vendorizado en `public/data/inflation.data.json` y muestra las
 * cifras de control.
 *
 * Uso: pnpm data:verify
 */
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ARCHIVO = resolve(RAIZ, 'public/data/inflation.data.json')

function esObjeto(valor) {
  return typeof valor === 'object' && valor !== null
}

function clave(fecha) {
  return fecha.slice(0, 7)
}

function siguienteClave(claveActual) {
  const [anio, mes] = claveActual.split('-').map(Number)
  const total = anio * 12 + (mes - 1) + 1
  const nuevoAnio = Math.floor(total / 12)
  const nuevoMes = (total % 12) + 1
  return `${String(nuevoAnio).padStart(4, '0')}-${String(nuevoMes).padStart(2, '0')}`
}

async function main() {
  const contenido = await readFile(ARCHIVO, 'utf8')
  const payload = JSON.parse(contenido)

  if (!esObjeto(payload)) throw new Error('El payload no es un objeto.')
  if (!Array.isArray(payload.data)) throw new Error('Falta el array `data`.')
  if (typeof payload.rowCount !== 'number') throw new Error('Falta `rowCount` numérico.')
  if (payload.rowCount !== payload.data.length) {
    throw new Error(
      `\`rowCount\` (${payload.rowCount}) no coincide con la cantidad de filas (${payload.data.length}).`,
    )
  }

  const faltantes = []
  for (let i = 1; i < payload.data.length; i += 1) {
    const esperada = siguienteClave(clave(payload.data[i - 1].fecha))
    const actual = clave(payload.data[i].fecha)
    if (actual !== esperada) {
      faltantes.push(`${esperada} (encontrado ${actual})`)
    }
  }

  const primera = payload.data[0].fecha
  const ultima = payload.data[payload.data.length - 1].fecha

  console.log(`filas: ${payload.data.length}, rango: ${primera} → ${ultima}`)
  console.log(`rowCount === data.length: ${payload.rowCount === payload.data.length}`)
  console.log(`bytes: ${Buffer.byteLength(contenido, 'utf8')}`)

  if (faltantes.length > 0) {
    console.error(`Meses faltantes (${faltantes.length}): ${faltantes.slice(0, 10).join(', ')}`)
    process.exitCode = 1
    return
  }

  // Cifras de control: factor acumulado desde el primer mes.
  let factor = 1
  for (const fila of payload.data) {
    factor *= 1 + fila.inflacion_mensual_pct / 100
  }
  const ultimo = payload.data[payload.data.length - 1]
  let factorInteranual = 1
  for (const fila of payload.data.slice(-12)) {
    factorInteranual *= 1 + fila.inflacion_mensual_pct / 100
  }

  console.log(`factor acumulado desde ${clave(primera)}: ${factor.toExponential(4)}`)
  console.log(`variación mensual final (${clave(ultima)}): ${ultimo.inflacion_mensual_pct} %`)
  console.log(`variación interanual final: ${((factorInteranual - 1) * 100).toFixed(1)} %`)
  console.log('OK: sin meses faltantes.')
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
