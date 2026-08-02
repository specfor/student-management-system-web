<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { sendGetRequest, sendJsonPatchRequest } from '@/utils/requests';
import { useAlertsStore } from '@/stores/alerts';

const alertStore = useAlertsStore();

const isLoading = ref(true);
const isSaving = ref(false);

const earlyMinutes = ref(30);
const lateMinutes = ref(30);
const paymentWeek = ref(2);

async function fetchSettings() {
    isLoading.value = true;
    const response = await sendGetRequest('/settings');
    if (response.status === 'success') {
        const settings = response.data.settings;
        for (const setting of settings) {
            if (setting.key === 'attendance_early_minutes') {
                earlyMinutes.value = JSON.parse(setting.value);
            } else if (setting.key === 'attendance_late_minutes') {
                lateMinutes.value = JSON.parse(setting.value);
            } else if (setting.key === 'payment_deadline_week') {
                paymentWeek.value = JSON.parse(setting.value);
            }
        }
    } else {
        alertStore.insertAlert('Error', 'Failed to fetch settings', 'error');
    }
    isLoading.value = false;
}

async function saveSettings() {
    isSaving.value = true;
    const payload = {
        fields: [
            { key: 'attendance_early_minutes', value: earlyMinutes.value },
            { key: 'attendance_late_minutes', value: lateMinutes.value },
            { key: 'payment_deadline_week', value: paymentWeek.value }
        ]
    };
    
    const response = await sendJsonPatchRequest('/settings', payload);
    if (response.status === 'success') {
        alertStore.insertAlert('Success', 'System policies updated successfully.', 'success');
    } else {
        alertStore.insertAlert('Error', 'Failed to update system policies.', 'error');
    }
    isSaving.value = false;
}

onMounted(() => {
    fetchSettings();
});
</script>

<template>
    <div class="container">
        <div class="px-8 mt-4 overflow-y-auto w-full h-[calc(100vh-60px)] pb-20">
            <div class="flex justify-between w-full h-fit">
                <h1 class="text-2xl font-semibold mb-4 text-gray-800">System Policies</h1>
            </div>
            <p class="text-gray-600 text-sm mb-6 max-w-4xl">
                Configure system-wide policies including attendance marking rules and payment deadlines.
            </p>

            <div v-if="isLoading" class="flex justify-center items-center py-20">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>

            <div v-else class="max-w-2xl bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                
                <div class="space-y-4">
                    <h2 class="text-lg font-medium text-gray-900 border-b pb-2">Attendance Rules</h2>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Early Attendance Limit (Minutes)</label>
                        <p class="text-xs text-gray-500 mb-2">How many minutes before the class starts can a student mark their attendance?</p>
                        <input type="number" v-model="earlyMinutes" min="0" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Late Attendance Limit (Minutes)</label>
                        <p class="text-xs text-gray-500 mb-2">How many minutes after the class starts is automatic attendance marking permitted?</p>
                        <input type="number" v-model="lateMinutes" min="0" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                </div>

                <div class="space-y-4 pt-4 border-t">
                    <h2 class="text-lg font-medium text-gray-900 border-b pb-2">Payment Rules</h2>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Payment Deadline (Week)</label>
                        <p class="text-xs text-gray-500 mb-2">By which week of the month must all students complete their payments? (1-5)</p>
                        <input type="number" v-model="paymentWeek" min="1" max="5" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                </div>
                
                <div class="pt-4 flex justify-end">
                    <button @click="saveSettings" :disabled="isSaving" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md shadow-sm transition-colors duration-150 disabled:opacity-50">
                        <span v-if="isSaving">Saving...</span>
                        <span v-else>Save Policies</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
