<script setup>
import { useAuthStore } from '@/stores/authorization';
import { storeToRefs } from 'pinia';
import { RouterLink } from 'vue-router';

const authStore = useAuthStore()
let { userPermissions } = storeToRefs(authStore)
</script>

<template>
    <div class="bg-back-secondary w-[200px] pt-3">
        <RouterLink to="/" class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            Dashboard
        </RouterLink>
        <RouterLink v-if="userPermissions.all || userPermissions.users" to="/users"
            class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            Users
        </RouterLink>
        <RouterLink v-if="userPermissions.all" to="/user-roles" class="flex py-2 px-4 w-full hover:bg-gray-100"
            active-class="bg-white">
            User Roles
        </RouterLink>
        <RouterLink v-if="userPermissions.all || userPermissions.grades" to="/grades"
            class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            Grades
        </RouterLink>
        <RouterLink v-if="userPermissions.all || userPermissions.students" to="/students"
            class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            Students
        </RouterLink>
        <RouterLink v-if="userPermissions.all || userPermissions.instructors" to="/instructors"
            class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            Instructors
        </RouterLink>
        <RouterLink v-if="userPermissions.all || userPermissions.courses" to="/courses"
            class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            Courses
        </RouterLink>
        <RouterLink v-if="userPermissions.all || userPermissions.enrollment" to="/enrollments"
            class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            Enrollments
        </RouterLink>
        <RouterLink v-if="userPermissions.all || userPermissions.payments" to="/payments"
            class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            Payments
        </RouterLink>
        <RouterLink v-if="userPermissions.all || userPermissions.attendance" to="/mark-attendance"
            class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            Mark Attendance
        </RouterLink>
    </div>
</template>