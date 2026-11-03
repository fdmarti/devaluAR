<script setup lang="ts">
/**
 * Trend arrow for a change: up when it rose, down when it fell, accompanied by
 * the difference against the previous period.
 *
 * Purely presentational component: it formats nothing and does not know the
 * domain, it only draws the direction and the number it is given.
 */
import { computed } from 'vue'
import { formatTrendLabel } from '../utils/format'
import type { Trend } from '../types/inflation'

const props = defineProps<{
  /** Direction to draw. It sets the color: 'up' → red, 'down' → green. */
  trend: Trend
  /** Accessible text. Falls back to the Spanish label of the direction. */
  description?: string
  /** Already formatted difference drawn next to the arrow (`+0,2 %`). */
  difference?: string
}>()

const color = computed(() => (props.trend === 'up' ? 'text-rise' : 'text-fall'))

const accessibleText = computed(() => props.description ?? formatTrendLabel(props.trend))
</script>

<template>
  <span class="inline-flex shrink-0 items-baseline gap-1" :class="color">
    <svg
      class="h-[0.6em] w-[0.6em]"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path v-if="props.trend === 'up'" d="M12 2 L22 22 H2 Z" />
      <path v-else d="M12 22 L2 2 H22 Z" />
    </svg>
    <span v-if="props.difference" class="text-[0.5em] leading-none font-semibold">
      {{ props.difference }}
    </span>
    <span class="sr-only">{{ accessibleText }}</span>
  </span>
</template>
