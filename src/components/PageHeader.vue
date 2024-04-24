<script setup>
import { useSystemInfoStore } from '@/stores/systemInfo';
import { UserCircleIcon } from '@heroicons/vue/24/solid'

const systemInfoStore = useSystemInfoStore()
let systemData = systemInfoStore.getInfo()
</script>

<template>
    <div class="bg-slate-300">
        <div class="flex py-2 px-8 items-center justify-between">
            <div class="flex gap-4">
                <img src="/favicon.ico" alt="company logo">
                <h4 class="font-semibold text-xl">{{ systemData['company-name'] }}</h4>
            </div>
            <div class="flex">
                <UserCircleIcon class="h-10 w-10" />
            </div>
        </div>
    </div>
</template>

<style scoped></style>