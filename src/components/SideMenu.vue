<script setup lang="ts">
import { useAuthStore } from '@/stores/authorization';
import { storeToRefs } from 'pinia';
import { RouterLink } from 'vue-router';
import {
    BanknotesIcon, UsersIcon, Squares2X2Icon, AcademicCapIcon, UserGroupIcon, BookOpenIcon, RocketLaunchIcon, IdentificationIcon,
    FolderOpenIcon, BookmarkIcon, DocumentChartBarIcon, ChartBarIcon, Cog8ToothIcon, Bars3Icon
} from '@heroicons/vue/24/outline';
import MenuBarCollapse from './minorUiComponents/MenuBarCollapse.vue';
import { ref, type FunctionalComponent } from 'vue';

const authStore = useAuthStore()
let { userPermissions } = storeToRefs(authStore)

const expanded = ref(true)

type link = { type: 'link', path: string, icon?: FunctionalComponent, text: string, permissions?: boolean }


function checkPermissions(permission: string) {
    let x = Object.keys(userPermissions.value).find((key) => {
        if (key === permission) {
            return userPermissions.value[key]
        }
        if (key === 'all') {
            return userPermissions.value[key]
        }
    })
    if (x !== undefined)
        return true
    return false
}

const routes: (
    link | { type: 'seperator' } | { type: 'group', text: string, icon: FunctionalComponent, children: link[], permissions?: boolean })[] = [
        { type: 'link', path: '/', icon: Squares2X2Icon, text: 'Dashboard' },
        { type: 'seperator' },
        { type: 'link', path: '/mark-attendance', text: 'Mark Attendance', icon: RocketLaunchIcon, permissions: checkPermissions('attendance') },
        { type: 'link', path: '/enrollments', text: 'Enrollments', icon: BookmarkIcon, permissions: checkPermissions('enrollment') },
        { type: 'link', path: '/students', text: 'Students', icon: IdentificationIcon, permissions: checkPermissions('students') },
        { type: 'seperator' },
        {
            type: 'group', text: 'Payments', icon: BanknotesIcon, permissions: checkPermissions('payments') || checkPermissions('instructor_payments'), children: [
                { type: 'link', path: '/payments/students', text: 'Student Payments', permissions: checkPermissions('payments') },
                { type: 'link', path: '/payments/instructors', text: 'Instructor Payments', permissions: checkPermissions('instructor_payments') }
            ]
        },
        { type: 'link', path: '/courses', text: 'Courses', icon: BookOpenIcon, permissions: checkPermissions('courses') },
        { type: 'link', path: '/instructors', text: 'Instructors', icon: AcademicCapIcon, permissions: checkPermissions('instructors') },
        { type: 'link', path: '/grades', text: 'Grades', icon: FolderOpenIcon, permissions: checkPermissions('grades') },
        { type: 'link', path: '/users', text: 'Users', icon: UsersIcon, permissions: checkPermissions('users') },
        { type: 'link', path: '/user-roles', text: 'User Roles', icon: UserGroupIcon, permissions: checkPermissions('user-roles') },
        { type: 'seperator' },
        {
            type: 'group', text: 'Settings', icon: Cog8ToothIcon, permissions: checkPermissions('system_config'), children: [
                { type: 'link', path: '/settings/message-system', text: 'Message System', permissions: checkPermissions('system_config') },
            ]
        },
    ]
</script>

<template>
    <div class="relative h-full" :class="expanded ? 'w-[200px]' : 'w-[70px]'">
        <div class="fixed overflow-y-auto overflow-x-hidden bg-blue-950" :class="expanded ? 'w-[200px]' : 'w-[70px]'">
            <div class="h-screen -mb-14 pt-3">
                <!-- <div class="hover:bg-blue-700 py-2 mb-4 cursor-pointer" @click="expanded = !expanded">
                    <Bars3Icon class="h-6 w-6 ml-4 text-white" />
                </div> -->

                <template v-for="(route, index) in routes" :key="index">
                    <RouterLink v-if="route.type === 'link'" :to="route.path!"
                        class="flex items-center py-2 px-4 w-full text-white hover:bg-blue-700"
                        active-class="bg-blue-600">
                        <component :is="route.icon" class="h-6 w-6 mr-3" />
                        {{ route.text }}
                    </RouterLink>

                    <MenuBarCollapse v-else-if="route.type == 'group'" :key="route.text">
                        <template v-slot:header>
                            <div class="py-2 px-4 w-full text-white hover:bg-blue-700 flex">
                                <component :is="route.icon" class="h-6 w-6 mr-3" />
                                {{ route.text }}
                            </div>
                        </template>

                        <template v-for="child in route.children" :key="child.path">
                            <RouterLink :to="child.path!" class="flex py-2 px-4 w-full text-white hover:bg-blue-700"
                                active-class="bg-blue-600">
                                <p>{{ child.text }}</p>
                            </RouterLink>
                        </template>
                    </MenuBarCollapse>

                    <div v-else-if="route.type == 'seperator'" class="h-1 bg-black mx-2 rounded-xl my-3"></div>
                </template>
            </div>
        </div>
    </div>
</template>