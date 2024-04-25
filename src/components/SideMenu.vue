<script setup>
import { RouterLink } from 'vue-router';


</script>

<template>
    <div class="bg-back-secondary w-[200px] pt-3">
        <RouterLink to="/">
            <div class="flex py-2 px-4 w-full hover:bg-gray-100">
                Dashboard
            </div>
        </RouterLink>
        <RouterLink to="/users">
            <div class="flex py-2 px-4 w-full hover:bg-gray-100">
                Users
            </div>
        </RouterLink>
    </div>
</template>