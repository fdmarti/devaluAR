<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { formatDate } from '../utils/format'
import { SOURCE } from '../constants/source'

const today = ref('')

onMounted(() => {
  today.value = formatDate(new Date())
})
</script>

<template>
  <footer class="border-t border-line">
    <div
      class="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="font-serif text-lg tabular-nums">{{ today || '—' }}</p>
      <p class="text-sm">
        <a
          class="text-accent underline underline-offset-4 hover:no-underline"
          :href="SOURCE.licenseUrl"
          target="_blank"
          rel="noopener noreferrer"
          >{{ SOURCE.license }}</a
        >
      </p>
    </div>
  </footer>
</template>
