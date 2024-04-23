<script setup>
import { UserCircleIcon } from '@heroicons/vue/24/solid'
</script>

<template>
    <div class="bg-slate-300">
        <div class="flex py-2 px-8 items-center justify-between">
            <div class="flex gap-4">
                <img src="/favicon.ico" alt="company logo">
                <h4 class="font-semibold text-xl">Company Name</h4>
            </div>
            <div class="flex">
                <UserCircleIcon class="h-10 w-10" />
            </div>
        </div>
    </div>
</template>

<style scoped></style>