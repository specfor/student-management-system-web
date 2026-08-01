<script setup lang="ts">
import { PrinterIcon, XCircleIcon, Bars3BottomRightIcon } from '@heroicons/vue/24/outline';
import AttendanceScanQueue from './rightMenu/AttendanceScanQueue.vue';
import BillPrintQueue from './rightMenu/BillPrintQueue.vue';
import { ref } from 'vue';

const activePanel = ref<'print' | 'scan' | null>(null)
</script>

<template>
    <div class="fixed right-0 top-0">
        <div class="h-screen border-l-2 border-gray-400 bg-gray-300 pt-16 relative transition-all duration-300"
            :class="activePanel !== null ? 'w-[500px]' : 'w-0'">
            <div v-show="activePanel === 'print'" class="h-full">
                <BillPrintQueue />
            </div>
            <div v-show="activePanel === 'scan'" class="h-full overflow-hidden">
                <AttendanceScanQueue />
            </div>
            <div class="absolute flex flex-col top-0 -left-14 justify-end text-white h-full pb-10 gap-2">
                <Bars3BottomRightIcon class="w-14 h-14 p-1 bg-gray-800 border-2 rounded-l-lg cursor-pointer hover:bg-black"
                    @click="activePanel = 'scan'" v-show="activePanel !== 'scan'" title="Scan Queue" />
                    
                <PrinterIcon class="w-14 h-14 p-1 bg-gray-800 border-2 rounded-l-lg cursor-pointer hover:bg-black"
                    @click="activePanel = 'print'" v-show="activePanel !== 'print'" title="Print Queue" />
                    
                <XCircleIcon class="w-14 h-14 p-1 bg-gray-800 border-2 rounded-l-lg cursor-pointer hover:bg-red-600"
                    v-show="activePanel !== null" @click="activePanel = null" title="Close Panel" />
            </div>
        </div>

    </div>
</template>