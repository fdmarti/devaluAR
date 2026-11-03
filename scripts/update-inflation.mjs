#!/usr/bin/env node
/**
 * Descarga el dataset de inflación de hacecuentas.com, valida su forma y lo
 * escribe en `public/data/inflation.data.json`.
 *
 * Uso: pnpm data:update
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const URL_DATASET =
  'https://hacecuentas.com/datasets/inflacion-argentina-historica-mensual.json'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DESTINO = resolve(RAIZ, 'public/data/inflation.data.json')

const RE_CLAVE = /^\d{4}-\d{2}-\d{2}$/

function esObjeto(valor) {
  return typeof valor === 'object' && valor !== null
}

/** Misma validación que el type guard del cliente. */
function validarDataset(payload) {
  if (!esObjeto(payload)) {
    throw new Error('El payload no es un objeto.')
  }
  if (typeof payload.rowCount !== 'number') {
    throw new Error('Falta `rowCount` numérico en el payload.')
  }
  if (!Array.isArray(payload.data)) {
    throw new Error('Falta el array `data` en el payload.')
  }
  if (payload.data.length === 0) {
    throw new Error('El array `data` está vacío.')
  }
  if (payload.rowCount !== payload.data.length) {
    throw new Error(
      `\`rowCount\` (${payload.rowCount}) no coincide con la cantidad de filas (${payload.data.length}).`,
    )
  }
  for (const [indice, fila] of payload.data.entries()) {
    if (!esObjeto(fila)) {
      throw new Error(`La fila ${indice} no es un objeto.`)
    }
    if (typeof fila.fecha !== 'string' || !RE_CLAVE.test(fila.fecha)) {
      throw new Error(`La fila ${indice} tiene un \`fecha\` inválido: ${String(fila.fecha)}.`)
    }
    if (typeof fila.inflacion_mensual_pct !== 'number' || !Number.isFinite(fila.inflacion_mensual_pct)) {
      throw new Error(
        `La fila ${indice} tiene un \`inflacion_mensual_pct\` inválido: ${String(fila.inflacion_mensual_pct)}.`,
      )
    }
  }
  return payload
}

async function main() {
  const respuesta = await fetch(URL_DATASET, {
    headers: { Accept: 'application/json', 'User-Agent': 'devaluar-data-script' },
  })
  if (!respuesta.ok) {
    throw new Error(`La descarga falló con HTTP ${respuesta.status} ${respuesta.statusText}.`)
  }

  const payload = validarDataset(await respuesta.json())

  await mkdir(dirname(DESTINO), { recursive: true })
  const contenido = `${JSON.stringify(payload, null, 2)}\n`
  await writeFile(DESTINO, contenido, 'utf8')

  const primera = payload.data[0].fecha
  const ultima = payload.data[payload.data.length - 1].fecha
  const bytes = Buffer.byteLength(contenido, 'utf8')
  console.log(`filas: ${payload.data.length}, rango: ${primera} → ${ultima}, bytes: ${bytes}`)
  console.log(`escrito en ${DESTINO}`)
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
