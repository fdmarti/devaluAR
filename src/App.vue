<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { obtenerSerieInflacion } from './api/inflacion'
import { calcularResumen, calcularResumenAnual, normalizarSerie, ultimoMes } from './utils/inflacion'
import {
  formatearAnioMesDesdeIso,
  formatearEntero,
  formatearMesAnio,
  formatearNumeroGrande,
  formatearPorcentaje,
} from './utils/formato'
import { FUENTE } from './constants/fuente'
import AppFooter from './components/AppFooter.vue'
import StatCard from './components/StatCard.vue'
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

const rango = computed(() => {
  const primero = meses.value[0]
  if (!primero || !ultimo.value) return '—'
  return `${formatearMesAnio(primero.clave)} → ${formatearMesAnio(ultimo.value.clave)}`
})

/** Cifra protagonista del hero: cuánto vale hoy un peso de 1943. */
const cifraHero = computed(() => {
  const primerMes = meses.value[0]
  return {
    titulo: 'Un peso de 1943 vale hoy',
    valor: formatearNumeroGrande(
      resumenInicial.value?.pesoActualPorPesoHistorico ?? Number.NaN,
    ),
    subtitulo: primerMes
      ? `desde ${formatearMesAnio(primerMes.clave)}, en pesos actuales`
      : '',
  }
})

/** Fila de las tres métricas comparables. */
const tarjetas = computed(() => {
  if (!resumen.value || !ultimo.value || !dataset.value) return []
  const primerMes = meses.value[0]
  return [
    {
      titulo: 'Meses en la serie',
      valor: formatearEntero(meses.value.length),
      subtitulo: `${formatearMesAnio(primerMes.clave)} → ${formatearMesAnio(ultimo.value.clave)}`,
    },
    {
      titulo: 'Variación mensual',
      valor: formatearPorcentaje(resumen.value.variacionMensual),
      subtitulo: `último mes: ${formatearMesAnio(ultimo.value.clave)}`,
    },
    {
      titulo: 'Variación interanual',
      valor: formatearPorcentaje(resumen.value.variacionInteranual),
      subtitulo: '12 meses hasta ' + formatearMesAnio(ultimo.value.clave),
    },
  ]
})

/** Metadatos del dataset: año inicial y fecha de generación. */
const metadatos = computed(() => {
  const anioInicial = resumenAnioInicial.value
  return [
    {
      titulo: 'Año inicial',
      valor: anioInicial ? String(anioInicial.anio) : '—',
      subtitulo: anioInicial
        ? `${anioInicial.completo ? 'completo' : 'incompleto'} · ${anioInicial.mesesIncluidos} meses`
        : '',
    },
    {
      titulo: 'Dataset generado',
      valor: dataset.value ? formatearAnioMesDesdeIso(dataset.value.generatedAt) : '—',
      subtitulo: '',
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
  <div class="flex min-h-screen flex-col bg-surface text-ink">
    <main class="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <header class="mb-14 border-b border-line pb-10">
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
          devaluar
        </p>
        <h1
          class="mt-4 font-serif text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl"
        >
          Inflación histórica del peso argentino
        </h1>
        <p class="mt-5 max-w-2xl text-base leading-relaxed text-ink-muted">
          Serie mensual de IPC ({{ rango }}), calculada sobre el dataset de
          hacecuentas.com (fuente INDEC).
        </p>
      </header>

      <!-- Carga -->
      <div
        v-if="estado === 'cargando'"
        class="flex items-center gap-3 rounded-2xl border border-line bg-surface-muted p-8 text-ink-muted"
        role="status"
      >
        <span
          class="size-5 animate-spin rounded-full border-2 border-line border-t-accent"
          aria-hidden="true"
        />
        <span>Cargando la serie de inflación…</span>
      </div>

      <!-- Error -->
      <div
        v-else-if="estado === 'error'"
        class="rounded-2xl border border-line bg-surface-muted p-8"
        role="alert"
      >
        <h2 class="font-serif text-2xl font-semibold tracking-tight">
          No se pudo cargar la información
        </h2>
        <p class="mt-3 text-sm text-ink-muted">{{ mensajeError }}</p>
        <button
          type="button"
          class="mt-6 rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent hover:text-surface"
          @click="cargar"
        >
          Reintentar
        </button>
      </div>

      <!-- Listo -->
      <div v-else class="space-y-16">
        <!-- Cifra protagonista -->
        <section>
          <p
            class="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-accent"
          >
            {{ cifraHero.titulo }}
          </p>
          <p
            class="mt-4 font-serif text-5xl leading-none font-semibold break-words tabular-nums sm:text-6xl"
          >
            {{ cifraHero.valor }}
          </p>
          <p class="mt-3 text-sm text-ink-muted">{{ cifraHero.subtitulo }}</p>
        </section>

        <!-- Métricas -->
        <section class="grid gap-4 md:grid-cols-3">
          <StatCard
            v-for="tarjeta in tarjetas"
            :key="tarjeta.titulo"
            :titulo="tarjeta.titulo"
            :valor="tarjeta.valor"
            :subtitulo="tarjeta.subtitulo"
          />
        </section>

        <!-- Cifras de control -->
        <section>
          <h2 class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
            Cifras de control
          </h2>
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <StatCard
              v-for="metadato in metadatos"
              :key="metadato.titulo"
              :titulo="metadato.titulo"
              :valor="metadato.valor"
              :subtitulo="metadato.subtitulo"
            />
          </div>

          <p class="mt-6 text-sm leading-relaxed text-ink-muted">
            Fuente:
            <a
              class="text-accent underline underline-offset-4 hover:no-underline"
              :href="FUENTE.origenUrl"
              target="_blank"
              rel="noopener noreferrer"
              >{{ FUENTE.origen }}</a
            >,
            recolectado por
            <a
              class="text-accent underline underline-offset-4 hover:no-underline"
              :href="FUENTE.recolectorUrl"
              target="_blank"
              rel="noopener noreferrer"
              >{{ FUENTE.recolector }}</a
            >
            ·
            <a
              class="text-accent underline underline-offset-4 hover:no-underline"
              :href="FUENTE.datasetUrl"
              target="_blank"
              rel="noopener noreferrer"
              >dataset original</a
            >
          </p>
        </section>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
