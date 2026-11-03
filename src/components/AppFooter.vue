<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { formatearFecha } from '../utils/formato'
import { FUENTE } from '../constants/fuente'

const fechaDeHoy = ref('')

onMounted(() => {
  fechaDeHoy.value = formatearFecha(new Date())
})
</script>

<template>
  <footer class="border-t border-line">
    <div
      class="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="font-serif text-lg tabular-nums">{{ fechaDeHoy || '—' }}</p>
      <p class="text-sm">
        <a
          class="text-accent underline underline-offset-4 hover:no-underline"
          :href="FUENTE.licenciaUrl"
          target="_blank"
          rel="noopener noreferrer"
          >{{ FUENTE.licencia }}</a
        >
      </p>
    </div>
  </footer>
</template>
