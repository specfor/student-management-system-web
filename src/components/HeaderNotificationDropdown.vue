<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { sendGetRequest, sendJsonPostRequest } from '@/utils/requests';
import { echo } from '@/echo';

const notifications = ref<any[]>([]);
const unreadCount = ref(0);
const emit = defineEmits(['update-count']);

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
            
            <div v-for="(notification, index) in notifications" :key="index" 
                class="px-4 py-3 border-b hover:bg-gray-50 transition-colors">
                <div class="flex items-start">
                    <div class="flex-shrink-0 mt-1">
                        <!-- Icon based on type -->
                        <div class="w-2 h-2 bg-blue-500 rounded-full mt-1.5" v-if="!notification.read_at"></div>
                    </div>
                    <div class="ml-3 w-full">
                        <p class="text-sm font-semibold text-gray-900">{{ notification.data?.title }}</p>
                        <p class="text-sm text-gray-600 mt-1">{{ notification.data?.message }}</p>
                        <p class="text-xs text-gray-400 mt-1">{{ notification.created_at ? formatTime(notification.created_at) : 'Just now' }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
