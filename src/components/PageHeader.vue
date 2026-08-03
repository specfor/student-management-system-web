<script setup lang="ts">
import { useSystemInfoStore } from '@/stores/systemInfo';
import { UserCircleIcon, BellIcon } from '@heroicons/vue/24/solid'
import { ref } from 'vue'; ``
import HeaderProfileIconDropdown from './HeaderProfileIconDropdown.vue'
import HeaderNotificationDropdown from './HeaderNotificationDropdown.vue'
import { storeToRefs } from 'pinia';
import { checkClientSoftwareStatus } from '@/apiConnections/client-software';

import { useAlertsStore } from '@/stores/alerts';
import { onMounted, onUnmounted } from 'vue';
import { echo } from '@/echo';

const systemInfoStore = useSystemInfoStore()
let { sysInfo } = storeToRefs(systemInfoStore)
const showProfileDropdown = ref(false)
const showNotificationDropdown = ref(false)
const unreadNotificationCount = ref(0)

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

const showMonitorSelection = ref(false);
const availableScreens = ref<any[]>([]);

async function openClientUI() {
    if ('getScreenDetails' in window) {
        try {
            const screenDetails = await (window as any).getScreenDetails();
            if (screenDetails.screens.length > 1) {
                availableScreens.value = screenDetails.screens;
                showMonitorSelection.value = true;
                return;
            }
        } catch (e) {
            console.warn("Failed to get screen details. Using default.", e);
        }
    }
    
    // Fallback or single screen
    openClientUIOnScreen(null);
}

function openClientUIOnScreen(screenObj: any | null) {
    showMonitorSelection.value = false;
    let windowFeatures = "toolbar=no,location=no,directories=no,status=no,menubar=no,resizable=yes";
    let url = "/client-general-ui";
    
    if (screenObj) {
        windowFeatures += `,width=${screenObj.width},height=${screenObj.height},top=${screenObj.top},left=${screenObj.left}`;
        url += "?auto_fullscreen=true";
    } else {
        windowFeatures += `,width=${screen.width},height=${screen.height},top=0,left=0`;
    }
    
    window.open(url, "_blank", windowFeatures);
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
                    <div class="relative cursor-pointer mr-6 flex items-center justify-center mt-1">
                        <BellIcon class="h-8 w-8 text-white hover:text-gray-300" 
                            @click="showNotificationDropdown = !showNotificationDropdown" />
                        <span v-if="unreadNotificationCount > 0" 
                              class="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}
                        </span>
                    </div>

                    <template #content>
                        <HeaderNotificationDropdown @update-count="(count) => unreadNotificationCount = count" />
                    </template>
                </Popper>

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

    <!-- Monitor Selection Modal -->
    <div v-if="showMonitorSelection" class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
            <h3 class="text-xl font-bold mb-4 text-gray-800">Select Monitor for Client UI</h3>
            <p class="text-sm text-gray-600 mb-4">Multiple displays detected. Where would you like to open the Client UI?</p>
            
            <div class="space-y-3">
                <button 
                    v-for="(screen, index) in availableScreens" 
                    :key="index"
                    @click="openClientUIOnScreen(screen)"
                    class="w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-md transition-colors flex flex-col"
                >
                    <span class="font-semibold text-gray-800">{{ screen.label || `Display ${index + 1}` }}</span>
                    <span class="text-xs text-gray-500">{{ screen.width }}x{{ screen.height }} {{ screen.isPrimary ? '(Primary)' : '' }}</span>
                </button>
            </div>
            
            <div class="mt-6 flex justify-end">
                <button 
                    @click="showMonitorSelection = false" 
                    class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped></style>