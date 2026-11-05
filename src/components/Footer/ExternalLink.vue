<template>
    <a class="text-accent underline underline-offset-4 hover:no-underline" :href="url" target="_blank"
        rel="noopener noreferrer">{{ origin }}</a>
</template>

<script lang="ts" setup>
interface Props {
    url: string
    origin: string
}

defineProps<Props>()
</script>
