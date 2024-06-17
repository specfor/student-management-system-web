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
        <RouterLink v-if="userPermissions.all || userPermissions.enrollment" to="/enrollments"
            class="flex items-center py-2 px-4 w-full text-white hover:bg-blue-700" active-class="bg-blue-600">
            <BookmarkIcon class="h-6 w-6 mr-3" />
            Enrollments
        </RouterLink>
        <RouterLink v-if="userPermissions.all || userPermissions.students" to="/students"
            class="flex items-center py-2 px-4 w-full text-white hover:bg-blue-700" active-class="bg-blue-600">
            <IdentificationIcon class="h-6 w-6 mr-3" />
            Students
        </RouterLink>
        <div class="h-1 bg-blue-500 mx-2 rounded-xl my-5"></div>
        <RouterLink v-if="userPermissions.all || userPermissions.payments" to="/payments"
            class="flex items-center py-2 px-4 w-full text-white hover:bg-blue-700" active-class="bg-blue-600">
            <BanknotesIcon class="h-6 w-6 mr-3" />
            Payments
        </RouterLink>
        <RouterLink v-if="userPermissions.all || userPermissions.courses" to="/courses"
            class="flex items-center py-2 px-4 w-full text-white hover:bg-blue-700" active-class="bg-blue-600">
            <BookOpenIcon class="h-6 w-6 mr-3" />
            Courses
        </RouterLink>
        <RouterLink v-if="userPermissions.all || userPermissions.instructors" to="/instructors"
            class="flex items-center py-2 px-4 w-full text-white hover:bg-blue-700" active-class="bg-blue-600">
            <AcademicCapIcon class="h-6 w-6 mr-3" />
            Instructors
        </RouterLink>
        <RouterLink v-if="userPermissions.all || userPermissions.grades" to="/grades"
            class="flex items-center py-2 px-4 w-full text-white hover:bg-blue-700" active-class="bg-blue-600">
            <FolderOpenIcon class="h-6 w-6 mr-3" />
            Grades
        </RouterLink>
        <RouterLink v-if="userPermissions.all || userPermissions.users" to="/users"
            class="flex items-center py-2 px-4 w-full text-white hover:bg-blue-700" active-class="bg-blue-600">
            <UsersIcon class="h-6 w-6 mr-3" />
            Users
        </RouterLink>
        <RouterLink v-if="userPermissions.all" to="/user-roles"
            class="flex items-center py-2 px-4 w-full text-white hover:bg-blue-700" active-class="bg-blue-600">
            <UserGroupIcon class="h-6 w-6 mr-3" />
            User Roles
        </RouterLink>

    </div>
</template>