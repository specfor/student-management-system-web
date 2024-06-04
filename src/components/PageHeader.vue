<script setup>
import { useSystemInfoStore } from '@/stores/systemInfo';
import { UserCircleIcon } from '@heroicons/vue/24/solid'
import { ref } from 'vue'; ``
import HeaderProfileIconDropdown from './HeaderProfileIconDropdown.vue'
import { storeToRefs } from 'pinia';

const systemInfoStore = useSystemInfoStore()
let { sysInfo } = storeToRefs(systemInfoStore)
const showProfileDropdown = ref(false)

// function closeProfileDropdown(event) {
//     console.log(event.target.class);
//     console.log(this);
//     if (showProfileDropdown.value)
//         showProfileDropdown.value = false
// }
</script>

<template>
    <div class="bg-blue-900 fixed top-0 w-full z-[5]">
        <div class="flex py-2 px-8 items-center justify-between">
            <div class="flex gap-4 items-center">
                <img src="/logo.png" alt="company logo" class="h-10">
                <h4 class="font-semibold text-xl text-white">{{ sysInfo['company-name'] }}</h4>
            </div>
            <div class="flex">
                <UserCircleIcon class="h-10 w-10 hover:bg-white rounded-md cursor-pointer"
                    @click="showProfileDropdown = !showProfileDropdown" id="header-profile-icon" />
            </div>
        </div>
    </div>
    <div class="relative">
        <HeaderProfileIconDropdown class="absolute top-14 right-2" v-show="showProfileDropdown" />
    </div>
</template>

<style scoped></style>