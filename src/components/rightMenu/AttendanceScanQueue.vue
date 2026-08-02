<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import { sendGetRequest } from '@/utils/requests';
import { CheckCircleIcon, XCircleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { echo } from '@/echo';
import { useAlertsStore } from '@/stores/alerts';

const alertStore = useAlertsStore();
const scanLogs = ref<any[]>([]);
const isLoading = ref(true);
const filterStatus = ref<'success' | 'failed'>('success');
const filterDate = ref(new Date().toISOString().split('T')[0]);
const successCount = ref(0);
const errorCount = ref(0);
const nextPageUrl = ref<string | null>(null);
const isLoadingMore = ref(false);

const expandedGroups = reactive(new Set<string|number>());

function toggleGroup(groupId: string|number) {
    if (expandedGroups.has(groupId)) {
        expandedGroups.delete(groupId);
    } else {
        expandedGroups.add(groupId);
    }
}

const groupedScanLogs = computed(() => {
    const groups = new Map();
    
    const sorted = [...scanLogs.value].sort((a, b) => new Date(b.scanned_at || b.created_at).getTime() - new Date(a.scanned_at || a.created_at).getTime());
    
    for (const log of sorted) {
        const key = `${log.student_id}|${log.course_id}|${log.status}|${log.message}`;
        
        if (!groups.has(key)) {
            groups.set(key, { 
                ...log, 
                count: 1, 
                grouped_logs: [log] 
            });
        } else {
            const currentGroup = groups.get(key);
            currentGroup.count++;
            currentGroup.grouped_logs.push(log);
        }
    }
    
    return Array.from(groups.values()).sort((a, b) => new Date(b.scanned_at || b.created_at).getTime() - new Date(a.scanned_at || a.created_at).getTime());
});

function fetchScanLogs(loadMore = false) {
    if (loadMore) {
        if (!nextPageUrl.value) return;
        isLoadingMore.value = true;
    } else {
        isLoading.value = true;
        scanLogs.value = [];
    }

    let url = loadMore ? nextPageUrl.value : `/scan-logs?status=${filterStatus.value}&date=${filterDate.value}`;
    
    if (loadMore && url) {
        url += `&status=${filterStatus.value}&date=${filterDate.value}`;
    }

    sendGetRequest(url as string, {}, {}, !loadMore).then((resp: any) => {
        if (resp.status === 'success') {
            if (loadMore) {
                scanLogs.value.push(...resp.data.scan_logs.data);
            } else {
                scanLogs.value = resp.data.scan_logs.data;
            }
            nextPageUrl.value = resp.data.scan_logs.next_page_url;
            successCount.value = resp.data.success_count;
            errorCount.value = resp.data.error_count;
        }
    }).finally(() => {
        isLoading.value = false;
        isLoadingMore.value = false;
    });
}

function setFilter(status: 'success' | 'failed') {
    filterStatus.value = status;
    fetchScanLogs();
}

onMounted(() => {
    fetchScanLogs();
    
    // Listen to real-time events on the 'system' channel
    echo.channel('system').listen('ScanLogCreated', (e: any) => {
        // Extract YYYY-MM-DD from scanned_at
        const logDate = e.scanLog.scanned_at ? e.scanLog.scanned_at.split('T')[0] : '';
        
        // If the new log matches the current filter, prepend it
        if (e.scanLog.status === filterStatus.value && logDate === filterDate.value) {
            scanLogs.value.unshift(e.scanLog);
            if (scanLogs.value.length > 100 && !nextPageUrl.value) {
                scanLogs.value.pop();
            }
        }

        // Notify admin via toast
        if (e.scanLog.status === 'failed') {
            alertStore.insertAlert('Attendance Error', e.scanLog.message + (e.scanLog.student ? ` (${e.scanLog.student.name})` : ''), 'error');
        }
        
        // Update counts
        if (logDate === filterDate.value) {
            if (e.scanLog.status === 'success') {
                successCount.value++;
            } else {
                errorCount.value++;
            }
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
            <div class="flex justify-between items-center mb-4">
                <h1 class="font-semibold text-xl">Recent Scans</h1>
                <input 
                    type="date" 
                    v-model="filterDate" 
                    @change="fetchScanLogs()"
                    class="bg-white border border-gray-300 text-gray-700 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>
            
            <div class="flex bg-gray-300 p-1 rounded-lg">
                <button 
                    @click="setFilter('success')"
                    :class="filterStatus === 'success' ? 'bg-white shadow' : 'hover:bg-gray-200'"
                    class="flex-1 py-1.5 text-sm font-medium rounded-md transition-all">
                    Success ({{ successCount }})
                </button>
                <button 
                    @click="setFilter('failed')"
                    :class="filterStatus === 'failed' ? 'bg-white shadow' : 'hover:bg-gray-200'"
                    class="flex-1 py-1.5 text-sm font-medium rounded-md transition-all">
                    Failed ({{ errorCount }})
                </button>
            </div>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
            <div v-if="isLoading" class="text-center text-gray-500 py-10">
                Loading recent scans...
            </div>
            
            <div v-else-if="scanLogs.length === 0" class="text-center text-gray-500 py-10">
                No recent scans found.
            </div>
            
            <template v-else>
                <div v-for="log in groupedScanLogs" :key="log.id" 
                     class="bg-white p-4 rounded-lg shadow-sm border-l-4"
                     :class="log.status === 'success' ? 'border-green-500' : 'border-red-500'">
                     
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                            <CheckCircleIcon v-if="log.status === 'success'" class="w-5 h-5 text-green-500" />
                            <XCircleIcon v-else class="w-5 h-5 text-red-500" />
                            
                            <router-link 
                                v-if="log.student"
                                :to="`/students/${log.student.id}/view`" 
                                class="font-bold text-lg text-blue-600 hover:text-blue-800 hover:underline">
                                {{ log.student.name }}
                            </router-link>
                            <span v-else class="font-bold text-lg">Unknown Student</span>

                            <button v-if="log.count > 1" 
                                    @click="toggleGroup(log.id)"
                                    class="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-2 py-0.5 rounded-full font-bold ml-1 transition-colors cursor-pointer flex items-center gap-1">
                                {{ log.count }}x
                                <svg class="w-3 h-3 transition-transform duration-200" :class="{'rotate-180': expandedGroups.has(log.id)}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>
                        </div>
                        
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                                {{ formatTime(log.scanned_at) }}
                            </span>
                            
                            <router-link 
                                v-if="log.student"
                                :to="`/mark-attendance?student_id=${log.student.id}`"
                                title="Mark Attendance"
                                class="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
                                <ArrowTopRightOnSquareIcon class="w-5 h-5" />
                            </router-link>
                        </div>
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

                    <div v-if="expandedGroups.has(log.id) && log.count > 1" class="mt-3 border-t border-gray-200 pt-2">
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Previous Attempts in Group</p>
                        <div class="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            <div v-for="subLog in log.grouped_logs.slice(1)" :key="subLog.id" class="flex flex-col text-xs bg-gray-50/80 p-1.5 rounded border border-gray-100">
                                <div class="flex justify-between items-start">
                                    <span class="text-gray-600 mr-2 break-words" :class="log.status === 'success' ? 'text-green-600' : 'text-red-600'">{{ subLog.message || (subLog.course?.print_name || 'Class') }}</span>
                                    <span class="text-gray-400 whitespace-nowrap">{{ formatTime(subLog.scanned_at) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div v-if="nextPageUrl" class="flex justify-center pt-2 pb-6">
                    <button 
                        @click="fetchScanLogs(true)" 
                        :disabled="isLoadingMore"
                        class="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded font-medium transition-colors text-sm disabled:opacity-50">
                        {{ isLoadingMore ? 'Loading...' : 'Load More' }}
                    </button>
                </div>
            </template>
        </div>
    </div>
</template>
