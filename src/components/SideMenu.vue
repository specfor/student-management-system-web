<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
    <div class="bg-back-secondary w-[200px] h-full">
        <div class="flex py-2 px-4">
            <RouterLink to="/">Dashboard</RouterLink>
        </div>
        <div class="flex py-2 px-4">
            <RouterLink to="/users">Users</RouterLink>
        </div>
    </div>
</template>