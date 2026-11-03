<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { obtenerSerieInflacion } from './api/inflacion'
import { calcularResumen, calcularResumenAnual, normalizarSerie, ultimoMes } from './utils/inflacion'
import { formatearNumeroGrande, formatearPorcentaje } from './utils/formato'
import type { DatasetInflacion, ResumenMes } from './types/inflacion'

type Estado = 'cargando' | 'error' | 'listo'

const estado = ref<Estado>('cargando')
const mensajeError = ref('')
const dataset = ref<DatasetInflacion | null>(null)

const meses = computed(() => (dataset.value ? normalizarSerie(dataset.value) : []))
const ultimo = computed(() => ultimoMes(meses.value))
const resumen = computed<ResumenMes | null>(() =>
  ultimo.value ? calcularResumen(meses.value, ultimo.value.clave) : null,
)
const resumenInicial = computed<ResumenMes | null>(() =>
  meses.value.length > 0 ? calcularResumen(meses.value, meses.value[0].clave) : null,
)
const resumenAnioInicial = computed(() =>
  meses.value.length > 0 ? calcularResumenAnual(meses.value, meses.value[0].anio) : null,
)

const tarjetas = computed(() => {
  if (!resumen.value || !ultimo.value || !dataset.value) return []
  const primerMes = meses.value[0]
  return [
    {
      etiqueta: 'Meses en la serie',
      valor: String(meses.value.length),
      detalle: `${primerMes.clave} → ${ultimo.value.clave}`,
    },
    {
      etiqueta: 'Variación mensual',
      valor: formatearPorcentaje(resumen.value.variacionMensual),
      detalle: `último mes: ${ultimo.value.clave}`,
    },
    {
      etiqueta: 'Variación interanual',
      valor: formatearPorcentaje(resumen.value.variacionInteranual),
      detalle: '12 meses hasta ' + ultimo.value.clave,
    },
    {
      etiqueta: 'Factor acumulado',
      valor: formatearNumeroGrande(resumen.value.factorAcumulado),
      detalle: `desde ${primerMes.clave}`,
    },
    {
      etiqueta: 'Un peso de 1943 vale hoy',
      valor: formatearNumeroGrande(resumenInicial.value?.pesoActualPorPesoHistorico ?? Number.NaN),
      detalle: `desde ${primerMes.clave}, en pesos actuales`,
    },
  ]
})

async function cargar() {
  estado.value = 'cargando'
  mensajeError.value = ''
  try {
    dataset.value = await obtenerSerieInflacion()
    estado.value = 'listo'
  } catch (error) {
    dataset.value = null
    mensajeError.value = error instanceof Error ? error.message : 'Error desconocido.'
    estado.value = 'error'
  }
}

onMounted(cargar)
</script>

<template>
  <div class="min-h-screen bg-surface text-ink font-sans">
    <main class="mx-auto max-w-3xl px-6 py-16">
      <header class="mb-10">
        <p class="text-sm font-medium uppercase tracking-widest text-brand-600">devaluar</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Inflación histórica del peso argentino
        </h1>
        <p class="mt-3 text-ink-muted">
          Serie mensual de IPC (1943-03 → 2026-09), calculada sobre el dataset de hacecuentas.com
          (fuente INDEC).
        </p>
      </header>

      <!-- Carga -->
      <div
        v-if="estado === 'cargando'"
        class="flex items-center gap-3 rounded-xl border border-line bg-surface-muted p-6 text-ink-muted"
        role="status"
      >
        <span
          class="size-5 animate-spin rounded-full border-2 border-line border-t-brand-600"
          aria-hidden="true"
        />
        <span>Cargando la serie de inflación…</span>
      </div>

      <!-- Error -->
      <div
        v-else-if="estado === 'error'"
        class="rounded-xl border border-red-300 bg-red-50 p-6 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        role="alert"
      >
        <h2 class="font-semibold">No se pudo cargar la información</h2>
        <p class="mt-2 text-sm">{{ mensajeError }}</p>
        <button
          type="button"
          class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          @click="cargar"
        >
          Reintentar
        </button>
      </div>

      <!-- Listo -->
      <div v-else class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <article
            v-for="tarjeta in tarjetas"
            :key="tarjeta.etiqueta"
            class="rounded-xl border border-line bg-surface p-5"
          >
            <p class="text-sm text-ink-muted">{{ tarjeta.etiqueta }}</p>
            <p class="mt-2 break-words text-2xl font-semibold tabular-nums">
              {{ tarjeta.valor }}
            </p>
            <p class="mt-1 text-xs text-ink-muted">{{ tarjeta.detalle }}</p>
          </article>
        </div>

        <section class="rounded-xl border border-line bg-surface-muted p-5 text-sm">
          <h2 class="font-semibold">Cifras de control</h2>
          <dl class="mt-3 grid gap-2 sm:grid-cols-2">
            <div class="flex justify-between gap-4">
              <dt class="text-ink-muted">Año inicial</dt>
              <dd class="tabular-nums">
                {{ resumenAnioInicial?.anio ?? '—' }} ·
                {{ resumenAnioInicial?.completo ? 'completo' : 'incompleto' }} ·
                {{ resumenAnioInicial?.mesesIncluidos ?? '—' }} meses
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-ink-muted">Dataset generado</dt>
              <dd>{{ dataset?.generatedAt ?? '—' }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-ink-muted">Licencia</dt>
              <dd>{{ dataset?.licenseName ?? '—' }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-ink-muted">Fuente</dt>
              <dd>{{ dataset?.source ?? '—' }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  </div>
</template>
