<script setup lang="ts">

let { text, css } = defineProps<{
    text: string
    css: string
}>()
</script>

<template>
    <div class="rounded-md w-fit px-2 text-md cursor-default" :class="css">
        <p class="uppercase">{{ text }}</p>
    </div>
</template>