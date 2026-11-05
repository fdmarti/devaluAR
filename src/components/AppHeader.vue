<script setup lang="ts">
import { useDark } from '@vueuse/core'
import Sun from './Icons/Sun.vue'
import Moon from './Icons/Moon.vue'

const isDark = useDark({
  valueDark: 'dark',
  valueLight: 'light',
})

function toggleTheme() {
  isDark.value = !isDark.value
}
</script>

<template>
  <header class="flex items-center justify-between px-6 py-4">
    <span class="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
      devaluar
    </span>
    <button type="button"
      class="rounded-lg border border-line p-2 text-ink transition hover:bg-surface-muted hover:cursor-pointer"
      :aria-label="isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'" @click="toggleTheme">
      <Sun v-if="!isDark" />
      <Moon v-else />
    </button>
  </header>
</template>