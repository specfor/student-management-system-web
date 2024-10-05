<script setup lang="ts">
import { useSystemInfoStore } from '@/stores/systemInfo';
import { UserCircleIcon } from '@heroicons/vue/24/solid'
import { ref } from 'vue'; ``
import HeaderProfileIconDropdown from './HeaderProfileIconDropdown.vue'
import { storeToRefs } from 'pinia';
import { checkClientSoftwareStatus } from '@/apiConnections/client-software';

const systemInfoStore = useSystemInfoStore()
let { sysInfo } = storeToRefs(systemInfoStore)
const showProfileDropdown = ref(false)

const fingerprintConnected = ref(false)

setInterval(async () => {
    let resp = await checkClientSoftwareStatus()
    if (resp.status == 'success') {
        let data: { software: number, fingerprint: "connected" | "disconnected" } = resp.data

        fingerprintConnected.value = data.fingerprint == "connected"
    }
}, 4000);
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