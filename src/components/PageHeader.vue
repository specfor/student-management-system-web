<script setup lang="ts">
import { useSystemInfoStore } from '@/stores/systemInfo';
import { UserCircleIcon } from '@heroicons/vue/24/solid'
import { ref } from 'vue'; ``
import HeaderProfileIconDropdown from './HeaderProfileIconDropdown.vue'
import { storeToRefs } from 'pinia';
import { checkClientSoftwareStatus } from '@/apiConnections/client-software';
import { sendMarkAttendanceRfid } from '@/apiConnections/attendance';
import { useAlertsStore } from '@/stores/alerts';
import { onMounted, onUnmounted } from 'vue';
import { echo } from '@/echo';

const systemInfoStore = useSystemInfoStore()
let { sysInfo } = storeToRefs(systemInfoStore)
const showProfileDropdown = ref(false)

const fingerprintConnected = ref(false)

let fingerprintTimeout: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
    // Initial status check
    checkClientSoftwareStatus().then(resp => {
        if (resp.status == 'success') {
            fingerprintConnected.value = resp.data.fingerprint == "connected";
        }
    });

    // Listen for real-time status updates from the C# client via Pusher
    echo.channel("general-ui").listen("ClientSoftwareStatusUpdated", (e: any) => {
        fingerprintConnected.value = e.statusData.fingerprint == "connected";
        
        // Reset the timeout. The C# client pings every 30 seconds.
        // If we don't receive an update in 35 seconds, assume disconnected.
        if (fingerprintTimeout) clearTimeout(fingerprintTimeout);
        fingerprintTimeout = setTimeout(() => {
            fingerprintConnected.value = false;
        }, 35000);
});
});

onUnmounted(() => {
    if (fingerprintTimeout) clearTimeout(fingerprintTimeout);
})

function openClientUI() {
    window.open("/client-general-ui", "_blank", "toolbar=no,location=no,directories=no,status=no,menubar=no,resizable=yes,width=" + (screen.width) + ",height=" + (screen.height) + ",top=0,left=0");
}

const alertStore = useAlertsStore()
</script>

<template>
    <div class="bg-blue-900 fixed top-0 w-full z-[5]">
        <div class="flex py-2 px-8 items-center justify-between">
            <div class="flex gap-4 items-center">
                <img src="/logo.png" alt="company logo" class="h-10">
                <h4 class="font-semibold text-xl text-white">{{ sysInfo['company-name'] }}</h4>
            </div>
            <div class="flex">
                <div class="flex justify-end font-semibold items-center mr-10">
                    <button class="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-600 mr-10"
                        @click="openClientUI">Open Client UI</button>
                    <h5 class="mr-4 text-slate-200">Fingerprint Sensor</h5>
                    <h6 v-show="fingerprintConnected" class="bg-green-200 text-green-700 py-1 px-5">Connected</h6>
                    <h6 v-show="!fingerprintConnected" class="bg-red-200 text-red-700 py-1 px-5">Disconnected</h6>
                </div>
                <Popper>
                    <UserCircleIcon class="h-10 w-10 hover:bg-white rounded-md cursor-pointer"
                        @click="showProfileDropdown = !showProfileDropdown" />

                    <template #content>
                        <HeaderProfileIconDropdown />
                    </template>
                </Popper>
            </div>
        </div>
    </div>
</template>

<style scoped></style>