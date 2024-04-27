<script setup>
import { defineProps } from 'vue';
import { PlusCircleIcon } from '@heroicons/vue/24/solid';

const { text, onClick } = defineProps(['text', 'onClick'])
</script>
<template>
    <button class="font-semibold text-xl text-white" @click="onClick">
        <div class="bg-blue-400 hover:bg-blue-600 py-1 px-6 rounded-lg flex items-center">
            <PlusCircleIcon class="h-8 mr-3" /> {{ text }}
        </div>
    </button>
</template>