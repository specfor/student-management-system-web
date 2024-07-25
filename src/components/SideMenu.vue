<script setup lang="ts">
import { useAuthStore } from '@/stores/authorization';
import { storeToRefs } from 'pinia';
import { RouterLink } from 'vue-router';
import {
    BanknotesIcon, UsersIcon, Squares2X2Icon, AcademicCapIcon, UserGroupIcon, BookOpenIcon, RocketLaunchIcon, IdentificationIcon,
    FolderOpenIcon, BookmarkIcon, DocumentChartBarIcon
} from '@heroicons/vue/24/outline';

const authStore = useAuthStore()
let { userPermissions } = storeToRefs(authStore)
</script>

<template>
    <div class="bg-blue-950 w-[200px] h-full pt-3">
        <RouterLink to="/" class="flex items-center py-2 px-4 w-full text-white hover:bg-blue-700"
            active-class="bg-blue-600">
            <Squares2X2Icon class="h-6 w-6 mr-3" />
            Dashboard
        </RouterLink>
        <div class="h-1 bg-blue-500 mx-2 rounded-xl my-5"></div>
        <RouterLink v-if="userPermissions.all || userPermissions.attendance" to="/mark-attendance"
            class="flex items-center py-2 px-4 w-full text-white hover:bg-blue-700" active-class="bg-blue-600">
            <RocketLaunchIcon class="h-6 w-6 mr-3" />
            Mark Attendance
        </RouterLink>
        <!-- <RouterLink v-if="userPermissions.all || userPermissions.attendance" to="/attendance"
            class="flex items-center py-2 px-4 w-full text-white hover:bg-blue-700" active-class="bg-blue-600">
            <DocumentChartBarIcon class="h-6 w-6 mr-3" />
            Attendance
        </RouterLink> -->
            <RouterLink v-if="userPermissions.all || userPermissions.payments" to="/payments/students"
    </div>
</template>