<script setup lang="ts">
import { useTheme } from '../composables/useTheme'
import Sun from './Icons/Sun.vue'
import Moon from './Icons/Moon.vue'

const { theme, toggle } = useTheme()
</script>

<template>
  <header class="flex items-center justify-between px-6 py-4">
    <span class="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
      devaluar
    </span>
    <button type="button"
      class="rounded-lg border border-line p-2 text-ink transition hover:bg-surface-muted hover:cursor-pointer"
      :aria-label="theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'" @click="toggle">
      <Sun v-if="theme === 'light'" />
      <Moon v-else />
    </button>
  </header>
</template>