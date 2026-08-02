<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { sendGetRequest, sendJsonPostRequest } from '@/utils/requests';
import { echo } from '@/echo';
import { ChevronDownIcon } from '@heroicons/vue/24/solid';

const notifications = ref<any[]>([]);
const unreadCount = ref(0);
const emit = defineEmits(['update-count']);

const expandedGroups = ref<Set<string>>(new Set());

function toggleGroup(id: string) {
    if (expandedGroups.value.has(id)) {
        expandedGroups.value.delete(id);
    } else {
        expandedGroups.value.add(id);
    }
}

const groupedNotifications = computed(() => {
    const groups = new Map();
    
    const sorted = [...notifications.value].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    for (const notif of sorted) {
        const key = notif.data?.message || 'unknown';
        
        if (!groups.has(key)) {
            groups.set(key, {
                id: notif.id,
                title: notif.data?.title,
                message: notif.data?.message,
                latest_time: notif.created_at,
                is_unread: !notif.read_at,
                count: 1,
                history: []
            });
        } else {
            const group = groups.get(key);
            group.count++;
            group.history.push(notif.created_at);
            if (!notif.read_at) {
                group.is_unread = true;
            }
        }
    }
    
    return Array.from(groups.values()).sort((a, b) => new Date(b.latest_time).getTime() - new Date(a.latest_time).getTime());
});

async function fetchNotifications() {
    const resp = await sendGetRequest('/notifications');
    if (resp.status === 'success') {
        notifications.value = resp.data.notifications;
        unreadCount.value = notifications.value.length;
        emit('update-count', unreadCount.value);
    }
}

async function markAllAsRead() {
    const resp = await sendJsonPostRequest('/notifications/mark-read', {});
    if (resp.status === 'success') {
        notifications.value = [];
        unreadCount.value = 0;
        emit('update-count', 0);
    }
}

onMounted(() => {
    fetchNotifications();

    // Listen to real-time events on the 'system' channel
    echo.channel('system').listen('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated', (e: any) => {
        // Normalize to match the database notification structure
        const normalizedNotification = {
            id: e.id,
            type: e.type,
            data: {
                title: e.title,
                message: e.message,
                type: e.type,
                scan_log_id: e.scan_log_id
            },
            read_at: null,
            created_at: new Date().toISOString()
        };
        notifications.value.unshift(normalizedNotification);
        unreadCount.value = notifications.value.length;
        emit('update-count', unreadCount.value);
    });
});

onUnmounted(() => {
    echo.channel('system').stopListening('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated');
});

const formatTime = (datetime: string) => {
    if (!datetime) return '';
    const date = new Date(datetime);
    return date.toLocaleString();
};
</script>

<template>
    <div class="bg-white rounded-md shadow-lg py-2 border w-[350px] max-h-[400px] flex flex-col mt-2 mr-4">
        <div class="px-4 py-2 border-b flex justify-between items-center bg-gray-50">
            <h3 class="font-bold text-gray-700">Notifications</h3>
            <button @click="markAllAsRead" class="text-sm text-blue-600 hover:text-blue-800 font-medium">Mark all as read</button>
        </div>
        
        <div class="overflow-y-auto flex-1">
            <div v-if="notifications.length === 0" class="p-4 text-center text-gray-500">
                No unread notifications
            </div>
            
            <div v-for="group in groupedNotifications" :key="group.id" 
                class="px-4 py-3 border-b hover:bg-gray-50 transition-colors">
                <div class="flex items-start justify-between">
                    <div class="flex items-start">
                        <div class="flex-shrink-0 mt-1">
                            <div class="w-2 h-2 bg-blue-500 rounded-full mt-1.5" v-if="group.is_unread"></div>
                        </div>
                        <div class="ml-3 w-full">
                            <p class="text-sm font-semibold text-gray-900">{{ group.title }}</p>
                            <p class="text-sm text-gray-600 mt-1">{{ group.message }}</p>
                            <p class="text-xs text-gray-400 mt-1">
                                {{ group.latest_time ? formatTime(group.latest_time) : 'Just now' }}
                            </p>
                        </div>
                    </div>
                    <button v-if="group.count > 1" 
                            @click="toggleGroup(group.id)"
                            class="bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] px-2 py-1 rounded-full font-bold ml-2 transition-colors cursor-pointer flex items-center gap-1 shrink-0">
                        {{ group.count }}x
                        <ChevronDownIcon class="w-3 h-3 transition-transform duration-200" :class="{'rotate-180': expandedGroups.has(group.id)}" />
                    </button>
                </div>
                
                <div v-if="expandedGroups.has(group.id) && group.count > 1" class="mt-3 ml-5 border-t border-gray-200 pt-2">
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Previous Occurrences</p>
                    <div class="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        <div v-for="(time, idx) in group.history" :key="idx" class="flex justify-between items-center text-xs bg-gray-50/80 p-1.5 rounded border border-gray-100">
                            <span class="text-gray-500">Attempt {{ group.count - idx - 1 }}</span>
                            <span class="text-gray-400 whitespace-nowrap">{{ formatTime(time) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
