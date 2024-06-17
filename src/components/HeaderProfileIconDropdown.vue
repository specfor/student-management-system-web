<script setup lang="ts">
import router from '@/router';
import { useAuthStore } from '@/stores/authorization';


const authStore = useAuthStore()

function logOut() {
    authStore.logout()
    router.replace('/login')
}
</script>

<template>
    <div class="flex flex-col bg-gray-300 p-1 mt-2 rounded-lg">
        <!-- <button class="hover:bg-gray-100 px-8 py-2 border-b-2">Profile</button> -->
        <button class="hover:bg-gray-100 px-8 py-2 border-b-2" @click="logOut">Sign Out</button>
    </div>
</template>