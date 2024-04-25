<script setup>
import { useSystemInfoStore } from '@/stores/systemInfo';
import { UserCircleIcon } from '@heroicons/vue/24/solid'
import { ref } from 'vue'; ``
import HeaderProfileIconDropdown from './HeaderProfileIconDropdown.vue'

const systemInfoStore = useSystemInfoStore()
let systemData = systemInfoStore.getInfo()

const showProfileDropdown = ref(false)

// function closeProfileDropdown(event) {
//     console.log(event.target.class);
//     console.log(this);
//     if (showProfileDropdown.value)
//         showProfileDropdown.value = false
// }
</script>

<template>
    <div class="bg-slate-300">
        <div class="flex py-2 px-8 items-center justify-between">
            <div class="flex gap-4">
                <img src="/favicon.ico" alt="company logo">
                <h4 class="font-semibold text-xl">{{ systemData['company-name'] }}</h4>
            </div>
            <div class="flex">
                <UserCircleIcon class="h-10 w-10 hover:bg-white rounded-md cursor-pointer"
                    @click="showProfileDropdown = !showProfileDropdown" id="header-profile-icon" />
            </div>
        </div>
    </div>
    <div class="relative">
        <HeaderProfileIconDropdown class="absolute right-2" v-show="showProfileDropdown" />
    </div>
</template>

<style scoped></style>