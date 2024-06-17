<script setup lang="ts">
import { ref, type InputHTMLAttributes, type Ref } from 'vue';
import type { FileInputFields } from '@/types/inputBoxTypes';

const props = defineProps<FileInputFields>()

const emit = defineEmits<{
    select: [values: { [key: string]: any }]
}>()

const values: Ref<{ [key: string]: any }> = ref({})
const previewUrl = ref("")

function handleFiles(event: any) {
    var file = event.target.files[0]
    previewUrl.value = URL.createObjectURL(file)
}

</script>

<template>
    <div class="flex flex-col">
        <input type="file" class="border border-slate-400 rounded-md px-3 py-0.5 w-full" :accept="props.accept"
            @input="(event: any) => { values = event.target.files; handleFiles(event); }">
        <div v-show="props['preview'] && !previewUrl"
            class="h-[300px] w-[300px] mt-4 rounded-md bg-slate-200 flex items-center justify-center">
            <h4 class="text-slate-500">Select the File to Preview</h4>
        </div>
        <img v-show="props['preview'] && previewUrl" :src="previewUrl" alt="selected file"
            class="w-auto mt-4 h-[300px] rounded-md">
    </div>
</template>