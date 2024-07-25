<script setup lang="ts">
import { downloadStudentImage, getStudentById, updateStudentImage } from '@/apiConnections/students';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { getRouterParam, setRoute } from '@/utils/routeHelpers';
import { ref, type Ref } from 'vue';

const alertStore = useAlertsStore()
const dataEntryForm = useDataEntryFormsStore()

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

async function uploadStudentImage(studentId: number) {
    dataEntryForm.newDataEntryForm('Student\'s Image', 'Upload', [
        { name: 'profile', text: 'Select Image', type: 'file', accept: '.jpg,.jpeg,.png', preview: true, required: true }
    ])
    let results = await dataEntryForm.waitForSubmittedData()
    if (!results.submitted)
        return

    let img: any = results.data.profile
    let res = await updateStudentImage(studentId, img[0]);
    if (res.status === 'error') {
        if (res.data.type === 'user_error')
            Object.entries(res.data.messages).forEach(msg => {
                let err = ""
                if (Array.isArray(msg[1]) && !msg[1] === null)
                    err = msg[1].join(', ')
                else
                    err = msg[1] as string
                dataEntryForm.insertErrorMessage(msg[0], err)
            })
        else
            alertStore.insertAlert('An error occurred.', res.message, 'error')
        dataEntryForm.finishSubmission()
        return
    }
    dataEntryForm.finishSubmission()
    loadImage(studentId)
    alertStore.insertAlert('Action completed.', 'Student photo updated successfully.')
}
</script>

<template>
    <div class="bg-slate-200 w-full">
        <div class="container flex gap-x-10">
            <div class="grid grid-cols-3 gap-4 p-5 rounded-xl w-fit bg-white">
                <div class="flex flex-col items-center">
                    <div v-if="imageUrl === null" class="flex items-center justify-center ml-3">
                        <div
                            class="animate-pulse bg-gray-400 w-[300px] h-[300px] rounded-lg flex items-center justify-center">
                            <h4 class="text-2xl text-white">Loading</h4>
                        </div>
                    </div>
                    <div v-else class="w-[300px] h-[300px] ml-3 flex items-center">
                        <img :src="imageUrl" alt="student image" class="h-full w-full object-contain">
                    </div>
                    <button @click="() => { uploadStudentImage(student!.id); }"
                        class="border py-2 px-5 rounded-lg font-semibold mt-5">Update
                        Image</button>
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

            <div class="bg-white rounded-xl w-full max-w-[300px] p-5 flex flex-col items-center">
                <h2 class="text-xl font-semibold mb-10">Actions</h2>

                <button class="border bg-blue-500 py-2 px-5 rounded-md mb-3"
                    @click="() => { setRoute(`/enrollments?s_id=${student?.id}`) }">Enrolled Courses</button>
                <button class="border bg-blue-500 py-2 px-5 rounded-md mb-3"
                    @click="() => { setRoute(`/payments/students?s_id=${student?.id}`) }">Payments</button>
            </div>
        </div>
    </div>
</template>