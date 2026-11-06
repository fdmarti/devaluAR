<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { Sun, Moon } from '../../Icons'

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
    <RouterLink to="/" class="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
      devaluar
    </RouterLink>
    <nav class="flex items-center gap-4">
      <!-- <RouterLink to="/" exact-active-class="underline underline-offset-4"
        class="text-sm text-ink-muted hover:text-ink">Home</RouterLink>
      <RouterLink to="/historial-precios" active-class="underline underline-offset-4"
        class="text-sm text-ink-muted hover:text-ink">Historial de precios</RouterLink> -->
    </nav>
    <button type="button"
      class="rounded-lg border border-line p-2 text-ink transition hover:bg-surface-muted hover:cursor-pointer"
      :aria-label="isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'" @click="toggleTheme">
      <Sun v-if="!isDark" />
      <Moon v-else />
    </button>
  </header>
</template>