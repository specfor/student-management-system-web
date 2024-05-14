<script setup>
import { RouterLink } from 'vue-router';


</script>

<template>
    <div class="bg-back-secondary w-[200px] pt-3">
        <RouterLink to="/" class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            Dashboard
        </RouterLink>
        <RouterLink to="/users" class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            Users
        </RouterLink>
        <RouterLink to="/user-roles" class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            User Roles
        </RouterLink>
        <RouterLink to="/grades" class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            Grades
        </RouterLink>
        <RouterLink to="/students" class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            Students
        </RouterLink>
        <RouterLink to="/instructors" class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            Instructors
        </RouterLink>
        <RouterLink to="/courses" class="flex py-2 px-4 w-full hover:bg-gray-100" active-class="bg-white">
            Courses
        </RouterLink>
    </div>
</template>