<script setup lang="ts">
import { ChevronUpIcon } from '@heroicons/vue/24/outline';
import { ref } from 'vue';

let expanded = ref(false);
</script>

<template>
    <div :class="{ 'bg-slate-900': expanded }">
        <div class="flex items-center justify-between cursor-pointer  hover:bg-blue-700" @click="expanded = !expanded">
            <slot name="header">
            </slot>
            <ChevronUpIcon class="w-6 h-6 stroke-2 mr-2 text-white" v-show="expanded" />
        </div>

        <div v-show="expanded" class="text-sm">
            <slot></slot>
        </div>
    </div>
</template>