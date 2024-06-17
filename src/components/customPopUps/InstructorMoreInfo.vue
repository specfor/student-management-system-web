<script setup lang="ts">
import { getInstructorsImage } from '@/apiConnections/instructors';
import { ref } from 'vue';

const imageUrl = ref(null)

let { args } = defineProps(['args'])

async function loadImage(instructorId) {
    let resp = await getInstructorsImage(instructorId);
    if (resp.status === 'error') {
        imageUrl.value = '/default-profile.png'
        return
    }
    imageUrl.value = URL.createObjectURL(resp.data.file)
}
loadImage(args.instructor.id)
</script>

<template>
    <div class="grid grid-cols-3 gap-4 p-5">
        <div class="flex flex-col items-center">
            <div v-if="imageUrl === null" class="flex items-center justify-center ml-3">
                <div class="animate-pulse bg-gray-400 w-[300px] h-[300px] rounded-lg flex items-center justify-center">
                    <h4 class="text-2xl text-white">Loading</h4>
                </div>
            </div>
            <div v-else class="w-[300px] h-[300px] ml-3 flex items-center">
                <img :src="imageUrl" alt="instructor image">
            </div>
            <button @click="() => { $emit('closeEmit'); args.uploadImageFunc(args.instructor.id) }"
                class="border py-2 px-5 rounded-lg font-semibold mt-5">Update
                Image</button>
        </div>
        <div class="p-3 col-span-2 ml-5">
            <div class="grid grid-cols-2 mt-2">
                <h4>Instructor ID</h4>
                <p>{{ args.instructor.id }}</p>
            </div>
            <div class="grid grid-cols-2 mt-2">
                <h4>Name</h4>
                <p>{{ args.instructor.name ?? 'None' }}</p>
            </div>
            <div class="grid grid-cols-2 mt-2">
                <h4>Email</h4>
                <p>{{ args.instructor.email ?? 'None' }}</p>
            </div>
            <div class="grid grid-cols-2 mt-2">
                <h4>Phone Number</h4>
                <p>{{ args.instructor.phone_number ?? 'None' }}</p>
            </div>
            <div class="grid grid-cols-2 mt-2">
                <h4>Birthday</h4>
                <p>{{ args.instructor.birthday ?? 'None' }}</p>
            </div>
            <div class="grid grid-cols-2 mt-2">
                <h4>Address</h4>
                <p>{{ args.instructor.address ?? 'None' }}</p>
            </div>
            <div class="grid grid-cols-2 mt-2">
                <h4>Work Place</h4>
                <p>{{ args.instructor.work_place ?? 'None' }}</p>
            </div>
        </div>
    </div>
</template>