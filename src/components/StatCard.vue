<script setup lang="ts">
/**
 * Metric card: title, value and optional detail.
 *
 * Purely presentational component: it receives no raw data, formats nothing
 * and does not know the domain. The formatting lives in `App.vue` /
 * `src/utils/format.ts`.
 */
import TrendArrow from './TrendArrow.vue'
import type { Trend } from '../types/inflation'

const props = defineProps<{
  /** Short metric label, shown in small caps. */
  title: string
  /** Already formatted figure. The component formats nothing. */
  value: string
  /** Optional detail. Rendered only when not empty. */
  subtitle?: string
  /** Direction of the change. When missing, no arrow is drawn. */
  trend?: Trend
  /** Screen-reader text explaining what the change is compared against. */
  trendDescription?: string
  /** Difference against the previous month, already formatted (`+0,2 %`). */
  difference?: string
}>()
</script>

<template>
  <article class="rounded-2xl border border-line bg-surface-muted p-6">
    <p class="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
      {{ props.title }}
    </p>
    <p
      class="mt-3 flex items-baseline gap-2 font-serif text-4xl leading-none font-semibold break-words tabular-nums"
    >
      <span>{{ props.value }}</span>
      <TrendArrow
        v-if="props.trend"
        :trend="props.trend"
        :description="props.trendDescription"
        :difference="props.difference"
      />
    </p>
    <p v-if="props.subtitle" class="mt-3 text-sm leading-relaxed text-ink-muted">
      {{ props.subtitle }}
    </p>
  </article>
</template>
