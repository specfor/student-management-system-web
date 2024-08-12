<script setup lang="ts">
import { getInstructor, getInstructorsImage } from '@/apiConnections/instructors';
import { useAlertsStore } from '@/stores/alerts';
import type { Instructor } from '@/types/InstructorTypes';
import { getRouterParam } from '@/utils/routeHelpers';
import { ref, type Ref } from 'vue';

const alertStore = useAlertsStore()

const imageUrl: Ref<null | string> = ref(null)
const instructorId = getRouterParam('id')
const instructor: Ref<Instructor | null> = ref(null)

async function loadInstructor(instructorID: number) {
    let resp = await getInstructor(instructorID)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    instructor.value = resp.data.instructor
}

async function loadImage(instructorId: number) {
    let resp = await getInstructorsImage(instructorId);
    if (resp.status === 'error') {
        imageUrl.value = '/default-profile.png'
        return
    }
    imageUrl.value = URL.createObjectURL(resp.data.file)
}
loadInstructor(Number(instructorId))
loadImage(Number(instructorId))
</script>

<template>
    <div class="bg-slate-200 w-full">
        <div class="container">
            <div class="grid grid-cols-3 gap-4 p-5  rounded-xl w-fit bg-white">
                <div class="flex flex-col items-center">
                    <div v-if="imageUrl === null" class="flex items-center justify-center ml-3">
                        <div
                            class="animate-pulse bg-gray-400 w-[300px] h-[300px] rounded-lg flex items-center justify-center">
                            <h4 class="text-2xl text-white">Loading</h4>
                        </div>
                    </div>
                    <div v-else class="w-[300px] h-[300px] ml-3 flex items-center">
                        <img :src="imageUrl" alt="instructor image" class="h-full w-full object-contain">
                    </div>
                    <!-- <button @click="() => { $emit('closeEmit'); args.uploadImageFunc(args.instructor.id) }"
                        class="border py-2 px-5 rounded-lg font-semibold mt-5">Update
                        Image</button> -->
                </div>
                <div v-if="instructor === null" class="flex items-center justify-center">
                    <p>Loading</p>
                </div>
                <div v-else class="p-3 col-span-2 ml-5">
                    <div class="grid grid-cols-3 mt-2">
                        <h4>Instructor ID</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ instructor.id }}</p>
                    </div>
                    <div class="grid grid-cols-3 mt-2">
                        <h4>Name</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ instructor.name ?? 'None' }}</p>
                    </div>
                    <div class="grid grid-cols-3 mt-2">
                        <h4>Email</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ instructor.email ?? 'None' }}</p>
                    </div>
                    <div class="grid grid-cols-3 mt-2">
                        <h4>Phone Number</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ instructor.phone_number ?? 'None' }}</p>
                    </div>
                    <div class="grid grid-cols-3 mt-2">
                        <h4>Birthday</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ instructor.birthday ?? 'None' }}</p>
                    </div>
                    <div class="grid grid-cols-3 mt-2">
                        <h4>Address</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ instructor.address ?? 'None' }}</p>
                    </div>
                    <div class="grid grid-cols-3 mt-2">
                        <h4>Work Place</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ instructor.work_place ?? 'None' }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>