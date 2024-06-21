<script setup lang="ts">
import { defineProps } from 'vue';
import { PlusCircleIcon } from '@heroicons/vue/24/solid';

const { text, onClick } = defineProps(['text', 'onClick'])
</script>
<template>
    <button class="font-semibold text-xl text-white disabled:cursor-not-allowed disabled:hover:bg-slate-500 disabled:bg-slate-500
         bg-blue-600 hover:bg-blue-800 py-1 px-6 rounded-lg flex items-center " @click="onClick">
        <PlusCircleIcon class="h-8 mr-3" /> {{ text }}
    </button>
</template>