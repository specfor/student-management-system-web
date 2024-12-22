<script setup lang="ts">
import { PrinterIcon } from '@heroicons/vue/24/outline';
import BillPrintQueue from './rightMenu/BillPrintQueue.vue';
import { ref } from 'vue';

const showPanel = ref(true)
</script>

<template>
    <div class="fixed right-0 top-0 h-screen">
        <div class="h-full border-l-2 border-gray-400 bg-gray-300 pt-16" :class="showPanel ? 'w-[500px]' : 'w-0'">
            <div v-show="showPanel">
                <BillPrintQueue />
            </div>
        </div>

        <div class="relative h-screen">
            <div class="absolute bottom-24 -left-14 text-white h-screen">
                <PrinterIcon class="w-14 h-14 p-1 bg-gray-800 border-2 rounded-l-lg cursor-pointer hover:bg-black"
                    @click="showPanel = !showPanel" />
            </div>
        </div>
    </div>
</template>