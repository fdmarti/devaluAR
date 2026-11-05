<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { formatDate } from '../../../utils/format'
import { SOURCE } from '../../../constants/source'
import { ExternalLink } from '../../Footer'

const today = ref('')

onMounted(() => {
  today.value = formatDate(new Date())
})
</script>

<template>
  <footer class="border-t border-line">
    <div class="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
      <p class="font-serif text-lg tabular-nums">{{ today || '—' }}</p>
      <p class="text-sm">
        <ExternalLink :url="SOURCE.licenseUrl" :origin="SOURCE.license" />
      </p>
    </div>
  </footer>
</template>
