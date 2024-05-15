<script setup>
import { downloadStudentImage } from '@/apiConnections/students';
import { ref } from 'vue';

const imageUrl = ref(null)

let { args } = defineProps(['args'])

async function loadImage(studentId) {
    let resp = await downloadStudentImage(studentId);
    if (resp.status === 'error') {
        imageUrl.value = '/default-profile.png'
        return
    }

    imageUrl.value = URL.createObjectURL(resp.data.file)
}
loadImage(args.student.id)
</script>

<template>
    <div class="grid grid-cols-3 gap-4 p-5">
        <div class="flex flex-col items-center">
            <div v-if="imageUrl === null" class="flex items-center justify-center ml-3">
                <div class="animate-pulse bg-gray-400 w-[300px] h-[300px] rounded-lg flex items-center justify-center">
                    <h4 class="text-2xl text-white">Loading</h4>
                </div>
            </div>
            <div v-else class="w-[300px] h-[300px] ml-3">
                <img :src="imageUrl" alt="student image">
            </div>
            <!-- <button @click="() => { args.uploadImageFunc(args.student.id) }"
                class="border-2 py-2 px-5 rounded-lg font-semibold">Update
                Image</button> -->
        </div>
        <div class="p-3 col-span-2">
            <div class="grid grid-cols-2">
                <h4>Student ID</h4>
                <p>{{ args.student.id }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Name</h4>
                <p>{{ args.student.name }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Full Name</h4>
                <p>{{ args.student.full_name }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Email</h4>
                <p>{{ args.student.email }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Phone Number</h4>
                <p>{{ args.student.phone_number }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Birthday</h4>
                <p>{{ args.student.birthday }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Grade</h4>
                <p>{{ args.student.grade.name }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Address</h4>
                <p>{{ args.student.address }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>School</h4>
                <p>{{ args.student.school }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Parent's Name</h4>
                <p>{{ args.student.parent_name }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Parent's Phone Number</h4>
                <p>{{ args.student.parent_phone_number }}</p>
            </div>
        </div>
    </div>
</template>