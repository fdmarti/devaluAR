<script setup lang="ts">
/**
 * Tarjeta de métrica: título, valor y detalle opcional.
 *
 * Componente presentacional puro: no recibe datos crudos, no formatea nada y
 * no conoce el dominio. El formateo vive en `App.vue` / `src/utils/formato.ts`.
 */
import TrendArrow from './TrendArrow.vue'
import type { Tendencia } from '../types/inflacion'

const props = defineProps<{
  /** Etiqueta corta de la métrica, en versalitas. */
  titulo: string
  /** Cifra ya formateada. El componente no formatea nada. */
  valor: string
  /** Detalle opcional. Si viene vacío, no se renderiza. */
  subtitulo?: string
  /** Dirección de la variación. Si no viene, no se dibuja flecha. */
  tendencia?: Tendencia
  /** Texto para lectores de pantalla que explica contra qué compara. */
  tendenciaDescripcion?: string
  /** Diferencia respecto del mes anterior, ya formateada (`+0,2 %`). */
  diferencia?: string
}>()
</script>

<template>
  <article class="rounded-2xl border border-line bg-surface-muted p-6">
    <p class="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
      {{ props.titulo }}
    </p>
    <p
      class="mt-3 flex items-baseline gap-2 font-serif text-4xl leading-none font-semibold break-words tabular-nums"
    >
      <span>{{ props.valor }}</span>
      <TrendArrow
        v-if="props.tendencia"
        :tendencia="props.tendencia"
        :descripcion="props.tendenciaDescripcion"
        :diferencia="props.diferencia"
      />
    </p>
    <p v-if="props.subtitulo" class="mt-3 text-sm leading-relaxed text-ink-muted">
      {{ props.subtitulo }}
    </p>
  </article>
</template>
