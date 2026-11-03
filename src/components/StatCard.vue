<script setup lang="ts">
/**
 * Tarjeta de métrica: título, valor y detalle opcional.
 *
 * Componente presentacional puro: no recibe datos crudos, no formatea nada y
 * no conoce el dominio. El formateo vive en `App.vue` / `src/utils/formato.ts`.
 */
const props = defineProps<{
  /** Etiqueta corta de la métrica, en versalitas. */
  titulo: string
  /** Cifra ya formateada. El componente no formatea nada. */
  valor: string
  /** Detalle opcional. Si viene vacío, no se renderiza. */
  subtitulo?: string
}>()
</script>

<template>
  <article class="rounded-2xl border border-line bg-surface-muted p-6">
    <p class="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">
      {{ props.titulo }}
    </p>
    <p class="mt-3 font-serif text-4xl leading-none font-semibold break-words tabular-nums">
      {{ props.valor }}
    </p>
    <p v-if="props.subtitulo" class="mt-3 text-sm leading-relaxed text-ink-muted">
      {{ props.subtitulo }}
    </p>
  </article>
</template>
