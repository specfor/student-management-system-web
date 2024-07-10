<script setup lang="ts">

let { text, css } = defineProps<{
    text: string
    css: string
}>()
</script>

<template>
    <div class="rounded-xl w-fit px-2 text-md cursor-default" :class="css">
        <p>{{ text }}</p>
    </div>
</template>