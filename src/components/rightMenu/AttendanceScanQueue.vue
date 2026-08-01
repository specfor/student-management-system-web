<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { sendGetRequest } from '@/utils/requests';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/solid';
import { echo } from '@/echo';

const scanLogs = ref<any[]>([]);
const isLoading = ref(true);

function fetchScanLogs() {
    isLoading.value = true;
    sendGetRequest('/scan-logs').then((resp: any) => {
        if (resp.status === 'success') {
            scanLogs.value = resp.data.scan_logs;
        }
    }).finally(() => {
        isLoading.value = false;
    });
}

onMounted(() => {
    fetchScanLogs();
    
    // Listen to real-time events on the 'system' channel
    echo.channel('system').listen('ScanLogCreated', (e: any) => {
        // Prepend the new scan log
        scanLogs.value.unshift(e.scanLog);
        // Keep it to max 50
        if (scanLogs.value.length > 50) {
            scanLogs.value.pop();
        }
    });
});

onUnmounted(() => {
    echo.channel('system').stopListening('ScanLogCreated');
});

const formatTime = (datetime: string) => {
    if (!datetime) return '';
    const date = new Date(datetime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
</script>

<template>
    <div class="h-full flex flex-col bg-gray-50 text-gray-800">
        <div class="p-4 bg-gray-200 border-b border-gray-300">
            <h1 class="font-semibold text-xl text-center">Recent Attendance Scans</h1>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <div v-if="isLoading" class="text-center text-gray-500 py-10">
                Loading recent scans...
            </div>
            
            <div v-else-if="scanLogs.length === 0" class="text-center text-gray-500 py-10">
                No recent scans found.
            </div>
            
            <div v-else v-for="log in scanLogs" :key="log.id" 
                 class="bg-white p-4 rounded-lg shadow-sm border-l-4"
                 :class="log.status === 'success' ? 'border-green-500' : 'border-red-500'">
                 
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <CheckCircleIcon v-if="log.status === 'success'" class="w-5 h-5 text-green-500" />
                        <XCircleIcon v-else class="w-5 h-5 text-red-500" />
                        <span class="font-bold text-lg">
                            {{ log.student ? log.student.name : 'Unknown Student' }}
                        </span>
                    </div>
                    <span class="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                        {{ formatTime(log.scanned_at) }}
                    </span>
                </div>
                
                <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-sm mb-2" v-if="log.student">
                    <div class="text-gray-600">ID: <span class="font-semibold text-gray-800">{{ log.student.custom_id }}</span></div>
                    <div class="text-gray-600">Grade: <span class="font-semibold text-gray-800">{{ log.student.grade?.name }}</span></div>
                </div>
                
                <div class="mt-2 text-sm">
                    <p v-if="log.status === 'success'" class="text-green-700 bg-green-50 p-2 rounded">
                        <span class="font-bold block text-xs uppercase mb-1">Marked For:</span>
                        {{ log.course?.print_name || log.course?.name || 'Class' }}
                    </p>
                    <p v-else class="text-red-700 bg-red-50 p-2 rounded">
                        <span class="font-bold block text-xs uppercase mb-1">Failed:</span>
                        {{ log.message }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
