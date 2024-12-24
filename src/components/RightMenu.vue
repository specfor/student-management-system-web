<script setup lang="ts">
import { PrinterIcon, XCircleIcon } from '@heroicons/vue/24/outline';
import BillPrintQueue from './rightMenu/BillPrintQueue.vue';
import { ref } from 'vue';

const showPanel = ref(false)
</script>

<template>
    <div class="fixed right-0 top-0">
        <div class="h-screen border-l-2 border-gray-400 bg-gray-300 pt-16 relative"
            :class="showPanel ? 'w-[500px]' : 'w-0'">
            <div v-show="showPanel" class="h-full">
                <BillPrintQueue />
            </div>
            <div class="absolute flex flex-col top-0 -left-14 justify-end text-white h-full pb-10">
                <PrinterIcon class="w-14 h-14 p-1 bg-gray-800 border-2 rounded-l-lg cursor-pointer hover:bg-black"
                    @click="showPanel = true" />
                <XCircleIcon class="w-14 h-14 p-1 bg-gray-800 border-2 rounded-l-lg cursor-pointer hover:bg-red-600"
                    v-show="showPanel" @click="showPanel = false" />
            </div>
        </div>

    </div>
</template>