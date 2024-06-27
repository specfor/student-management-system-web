<script setup lang="ts">
import { downloadStudentImage, getStudentById } from '@/apiConnections/students';
import { useAlertsStore } from '@/stores/alerts';
import { getRouterParam } from '@/utils/routeHelpers';
import { ref, type Ref } from 'vue';

const alertStore = useAlertsStore()

const imageUrl: Ref<null | string> = ref(null)

const studentId = getRouterParam('id')
let student: Ref<Student | null> = ref(null)

loadStudent(Number(studentId))
loadImage(Number(studentId))

async function loadStudent(studentID: number) {
    let resp = await getStudentById(studentID)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    student.value = resp.data.student
}

async function loadImage(studentId: number) {
    let resp = await downloadStudentImage(studentId);
    if (resp.status === 'error') {
        imageUrl.value = '/default-profile.png'
        return
    }

    imageUrl.value = URL.createObjectURL(resp.data.file)
}
</script>

<template>
    <div class="bg-slate-200 w-full">
        <div class="container">
            <div class="grid grid-cols-3 gap-4 p-5 rounded-xl w-fit bg-white">
                <div class="flex flex-col items-center">
                    <div v-if="imageUrl === null" class="flex items-center justify-center ml-3">
                        <div
                            class="animate-pulse bg-gray-400 w-[300px] h-[300px] rounded-lg flex items-center justify-center">
                            <h4 class="text-2xl text-white">Loading</h4>
                        </div>
                    </div>
                    <div v-else class="w-[300px] h-[300px] ml-3 flex items-center">
                        <img :src="imageUrl" alt="student image" class="object-contain">
                    </div>
                    <!-- <button @click="() => { $emit('closeEmit'); args.uploadImageFunc(args.student.id); }"
                class="border py-2 px-5 rounded-lg font-semibold mt-5">Update
                Image</button> -->
                </div>
                <div v-if="student === null" class="flex items-center justify-center">
                    <p>Loading</p>
                </div>
                <div v-else class="p-3 col-span-2 ml-5">
                    <div class="grid grid-cols-3 items-center">
                        <h4>ID</h4>
                        <p class="col-span-2 border-b border-slate-300 ">{{ student.id }}</p>
                    </div>
                    <div class="grid grid-cols-3 mt-3 items-center">
                        <h4>Student ID</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ student.custom_id ?? 'None' }}</p>
                    </div>
                    <div class="grid grid-cols-3 mt-3 items-center">
                        <h4>Name</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ student.name ?? 'None' }}
                        </p>
                    </div>
                    <div class="grid grid-cols-3 mt-3 items-center">
                        <h4>Full Name</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ student.full_name ?? 'None' }}</p>
                    </div>
                    <div class="grid grid-cols-3 mt-3 items-center">
                        <h4>Email</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ student.email ?? 'None' }}
                        </p>
                    </div>
                    <div class="grid grid-cols-3 mt-3 items-center">
                        <h4>Phone Number</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ student.phone_number ?? 'None' }}</p>
                    </div>
                    <div class="grid grid-cols-3 mt-3 items-center">
                        <h4>Birthday</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ student.birthday ?? 'None' }}</p>
                    </div>
                    <div class="grid grid-cols-3 mt-3 items-center">
                        <h4>Grade</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ student.grade ? student.grade.name : "None"
                            }}
                        </p>
                    </div>
                    <div class="grid grid-cols-3 mt-3 items-center">
                        <h4>Address</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ student.address ?? 'None' }}</p>
                    </div>
                    <div class="grid grid-cols-3 mt-3 items-center">
                        <h4>School</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ student.school ?? 'None' }}</p>
                    </div>
                    <div class="grid grid-cols-3 mt-3 items-center">
                        <h4>Parent's Name</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ student.parent_name ?? 'None' }}</p>
                    </div>
                    <div class="grid grid-cols-3 mt-3 items-center">
                        <h4>Parent's Phone Number</h4>
                        <p class="col-span-2 border-b border-slate-300">{{ student.parent_phone_number ?? 'None' }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>