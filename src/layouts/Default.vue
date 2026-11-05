<template>
  <div class="flex min-h-screen flex-col bg-surface text-ink">
    <AppHeader />
    <Transition name="fade" mode="out-in">
      <RouterView />
    </Transition>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { AppFooter, AppHeader } from '../components'
</script>
