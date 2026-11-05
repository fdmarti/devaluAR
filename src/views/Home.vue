<template>
  <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-16">
    <header class="mb-14 border-b border-line pb-10">
      <h1 class="mt-4 text-center font-serif text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
        Inflación histórica del peso argentino
      </h1>
      <p class="mt-5  text-base leading-relaxed text-ink-muted text-center">
        Serie mensual de IPC ({{ dateRange }}), calculada sobre el dataset de
        hacecuentas.com (fuente INDEC).
      </p>
    </header>

    <!-- Loading -->
    <Loading v-if="isLoading" />

    <!-- Error -->
    <div v-else-if="isError" class="rounded-2xl border border-line bg-surface-muted p-8" role="alert">
      <h2 class="font-serif text-2xl font-semibold tracking-tight">
        No se pudo cargar la información
      </h2>
      <p class="mt-3 text-sm text-ink-muted">{{ errorMessage }}</p>
      <button type="button"
        class="mt-6 rounded-lg border border-accent px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent hover:text-surface"
        @click="loadSeriesData">
        Reintentar
      </button>
    </div>

    <!-- Ready -->
    <div v-else class="space-y-16">
      <!-- Hero figure -->
      <section>
        <p class="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-accent">
          {{ heroFigure.title }}
        </p>
        <p class="mt-4 font-serif text-5xl leading-none font-semibold wrap-break-word tabular-nums sm:text-6xl">
          {{ heroFigure.value }}
        </p>
        <p class="mt-3 text-sm text-ink-muted">{{ heroFigure.subtitle }}.</p>
        <p class="mt-3 text-xs text-ink-muted">( Es decir: $ {{ heroFigureFull }} )</p>
      </section>

      <!-- Metrics -->
      <section class="grid gap-4 md:grid-cols-3">
        <StatCard v-for="card in cards" :key="card.title" :title="card.title" :value="card.value"
          :subtitle="card.subtitle" :trend="card.trend" :trend-description="card.trendDescription"
          :difference="card.difference" />
      </section>

      <!-- Control figures -->
      <section>
        <h2 class="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
          Cifras de control
        </h2>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <StatCard v-for="metadataItem in metadata" :key="metadataItem.title" :title="metadataItem.title"
            :value="metadataItem.value" :subtitle="metadataItem.subtitle" />
        </div>

        <p class="mt-6 text-sm leading-relaxed text-ink-muted">
          Fuente:
          <ExternalLink :url="SOURCE.originUrl" :origin="SOURCE.origin" />,
          recolectado por
          <ExternalLink :url="SOURCE.collectorUrl" :origin="SOURCE.collector" />.
        </p>
      </section>
    </div>
  </main>

</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchInflationSeries } from '../api/inflation'
import {
  computeMonthSummary,
  computeYearSummary,
  latestMonth,
  normalizeSeries,
} from '../utils/inflation'
import {
  formatInteger,
  formatLargeNumber,
  formatMonthYear,
  formatPercentage,
  formatYearMonthFromIso,
} from '../utils/format'
import { SOURCE } from '../constants/source'
import { ExternalLink, StatCard, Loading } from '../components'
import type { InflationDataset, MonthSummary } from '../types/inflation'
import type { StatCardData } from '../types/card'
import { variationWithDifference } from '../utils/diff'


const isLoading = ref<boolean>(true)
const errorMessage = ref('')
const isError = computed(() => errorMessage.value.trim().length > 0)
const dataset = ref<InflationDataset | null>(null)

const months = computed(() => (dataset.value ? normalizeSeries(dataset.value) : []))
const latest = computed(() => latestMonth(months.value))
const summary = computed<MonthSummary | null>(() =>
  latest.value ? computeMonthSummary(months.value, latest.value.key) : null,
)
/** Summary of the month before the last one, to compare the changes. */
const previousSummary = computed<MonthSummary | null>(() => {
  const previousMonth = months.value.length > 1 ? months.value[months.value.length - 2] : undefined
  return previousMonth ? computeMonthSummary(months.value, previousMonth.key) : null
})
const initialSummary = computed<MonthSummary | null>(() =>
  months.value.length > 0 ? computeMonthSummary(months.value, months.value[0].key) : null,
)
const initialYearSummary = computed(() =>
  months.value.length > 0 ? computeYearSummary(months.value, months.value[0].year) : null,
)

const dateRange = computed(() => {
  const first = months.value[0]
  if (!first || !latest.value) return '—'
  return `${formatMonthYear(first.key)} → ${formatMonthYear(latest.value.key)}`
})

/** Hero figure: how much one peso of 1943 is worth today. */
const heroFigure = computed(() => {
  const firstMonth = months.value[0]
  return {
    title: 'Un peso de 1943 vale hoy',
    value: formatLargeNumber(
      initialSummary.value?.currentValueOfHistoricalPeso ?? Number.NaN,
    ),
    subtitle: firstMonth
      ? `desde ${formatMonthYear(firstMonth.key)}, en pesos actuales`
      : '',
  }
})

const heroFigureFull = computed(() => {
  const value = initialSummary.value?.currentValueOfHistoricalPeso
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(value as number)
})

/** Row of the three comparable metrics. */
const cards = computed<StatCardData[]>(() => {
  if (!summary.value || !latest.value || !dataset.value) return []
  const firstMonth = months.value[0]
  const previous = previousSummary.value

  const monthly = variationWithDifference(
    summary.value.monthlyChange,
    previous?.monthlyChange,
  )
  const yearOverYear = variationWithDifference(
    summary.value.yearOverYearChange,
    previous?.yearOverYearChange,
  )

  return [
    {
      title: 'Meses en la serie',
      value: formatInteger(months.value.length),
      subtitle: `${formatMonthYear(firstMonth.key)} → ${formatMonthYear(latest.value.key)}`,
    },
    {
      title: 'Variación mensual',
      value: formatPercentage(summary.value.monthlyChange),
      subtitle: `último mes: ${formatMonthYear(latest.value.key)}`,
      ...monthly,
    },
    {
      title: 'Variación interanual',
      value: formatPercentage(summary.value.yearOverYearChange),
      subtitle: '12 meses hasta ' + formatMonthYear(latest.value.key),
      ...yearOverYear,
    },
  ]
})

/** Dataset metadata: first year and generation date. */
const metadata = computed(() => {
  const firstYear = initialYearSummary.value
  return [
    {
      title: 'Año inicial',
      value: firstYear ? String(firstYear.year) : '—',
      subtitle: firstYear
        ? `${firstYear.complete ? 'completo' : 'incompleto'} · ${firstYear.includedMonths} meses`
        : '',
    },
    {
      title: 'Dataset generado',
      value: dataset.value ? formatYearMonthFromIso(dataset.value.generatedAt) : '—',
      subtitle: '',
    },
  ]
})

const loadSeriesData = async () => {
  try {
    isLoading.value = true
    dataset.value = await fetchInflationSeries()
  } catch (error) {
    errorMessage.value = error as string
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadSeriesData()
})
</script>