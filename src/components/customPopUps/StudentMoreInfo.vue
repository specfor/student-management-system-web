<script setup>
import { sendFileDownloadRequest } from '@/baseFunctions/requests';
import { ref } from 'vue';

const imageUrl = ref(null)

let { args } = defineProps(['args'])

async function loadImage(studentId) {
    let resp = await sendFileDownloadRequest(`/students/${studentId}/image`);
    if (resp.status === 'error') {
        imageUrl.value = '/default-profile.png'
        return
    }

    imageUrl.value = URL.createObjectURL(resp.data.file)
}
loadImage(args.id)
</script>

<template>
    <div class="grid grid-cols-3 p-5">
        <div v-if="imageUrl === null" class="flex items-center justify-center">
            <div class="animate-pulse bg-gray-400 w-full h-full rounded-lg flex items-center justify-center">
                <h4 class="text-2xl text-white">Loading</h4>
            </div>
        </div>
        <div v-else class="p-3">
            <img :src="imageUrl" alt="student image">
        </div>
        <div class="p-3 col-span-2">
            <div class="grid grid-cols-2">
                <h4>Student ID</h4>
                <p>{{ args.id }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Name</h4>
                <p>{{ args.name }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Full Name</h4>
                <p>{{ args.full_name }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Email</h4>
                <p>{{ args.email }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Phone Number</h4>
                <p>{{ args.phone_number }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Birthday</h4>
                <p>{{ args.birthday }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Grade</h4>
                <p>{{ args.grade.name }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Address</h4>
                <p>{{ args.address }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>School</h4>
                <p>{{ args.school }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Parent's Name</h4>
                <p>{{ args.parent_name }}</p>
            </div>
            <div class="grid grid-cols-2">
                <h4>Parent's Phone Number</h4>
                <p>{{ args.parent_phone_number }}</p>
            </div>
        </div>
    </div>
</template>