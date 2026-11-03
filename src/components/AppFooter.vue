<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { formatearFecha } from '../utils/formato'

/**
 * Datos de la fuente mostrados en el footer.
 *
 * Son constantes estáticas y no campos del dataset a propósito: el footer tiene
 * que poder mostrarse antes de que termine la petición al dataset, y también en
 * el estado de error.
 */
const FUENTE = {
  origen: 'INDEC',
  origenUrl: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31',
  recolector: 'Hacé Cuentas',
  recolectorUrl: 'https://hacecuentas.com',
  datasetUrl:
    'https://hacecuentas.com/datasets/inflacion-argentina-historica-mensual.json',
  licencia: 'CC-BY-4.0',
  licenciaUrl: 'https://creativecommons.org/licenses/by/4.0/',
}

const fechaDeHoy = ref('')

onMounted(() => {
  fechaDeHoy.value = formatearFecha(new Date())
})
</script>

<template>
  <footer class="border-t border-line bg-surface-muted">
    <div class="mx-auto grid max-w-3xl gap-8 px-6 py-10 sm:grid-cols-3">
      <div>
        <h2 class="text-xs font-semibold uppercase tracking-widest text-ink-muted">
          Fecha de hoy
        </h2>
        <p class="mt-2 font-serif text-lg tabular-nums">{{ fechaDeHoy || '—' }}</p>
      </div>

      <div>
        <h2 class="text-xs font-semibold uppercase tracking-widest text-ink-muted">
          Fuente
        </h2>
        <p class="mt-2 text-sm">
          Datos de
          <a
            class="text-accent underline underline-offset-4 hover:no-underline"
            :href="FUENTE.origenUrl"
            target="_blank"
            rel="noopener noreferrer"
            >{{ FUENTE.origen }}</a
          >,
          recolectados por
          <a
            class="text-accent underline underline-offset-4 hover:no-underline"
            :href="FUENTE.recolectorUrl"
            target="_blank"
            rel="noopener noreferrer"
            >{{ FUENTE.recolector }}</a
          >.
        </p>
        <p class="mt-1 text-sm">
          <a
            class="text-accent underline underline-offset-4 hover:no-underline"
            :href="FUENTE.datasetUrl"
            target="_blank"
            rel="noopener noreferrer"
            >Dataset original</a
          >
        </p>
      </div>

      <div>
        <h2 class="text-xs font-semibold uppercase tracking-widest text-ink-muted">
          Licencia
        </h2>
        <p class="mt-2 text-sm">
          <a
            class="text-accent underline underline-offset-4 hover:no-underline"
            :href="FUENTE.licenciaUrl"
            target="_blank"
            rel="noopener noreferrer"
            >{{ FUENTE.licencia }}</a
          >
        </p>
      </div>
    </div>
  </footer>
</template>
