<script setup lang="ts">
/**
 * Flecha de tendencia de una variación: hacia arriba si sube, hacia abajo si
 * baja, acompañada de la diferencia respecto del período anterior.
 *
 * Componente presentacional puro: no formatea nada y no conoce el dominio,
 * solo dibuja la dirección y el número que le pasan.
 */
import { computed } from 'vue'
import type { Tendencia } from '../types/inflacion'

const props = defineProps<{
  /** Dirección a dibujar. Determina el color: 'sube' → rojo, 'baja' → verde. */
  tendencia: Tendencia
  /** Texto accesible. Si falta, se usa 'sube' o 'baja'. */
  descripcion?: string
  /** Diferencia ya formateada que se dibuja junto a la flecha (`+0,2 %`). */
  diferencia?: string
}>()

const color = computed(() => (props.tendencia === 'sube' ? 'text-alza' : 'text-baja'))

const textoAccesible = computed(() => props.descripcion ?? props.tendencia)
</script>

<template>
  <span class="inline-flex shrink-0 items-baseline gap-1" :class="color">
    <svg
      class="h-[0.6em] w-[0.6em]"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path v-if="props.tendencia === 'sube'" d="M12 2 L22 22 H2 Z" />
      <path v-else d="M12 22 L2 2 H22 Z" />
    </svg>
    <span v-if="props.diferencia" class="text-[0.5em] leading-none font-semibold">
      {{ props.diferencia }}
    </span>
    <span class="sr-only">{{ textoAccesible }}</span>
  </span>
</template>
