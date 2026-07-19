<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import type { FileInputFields } from "@/types/inputBoxTypes";

const props = defineProps<FileInputFields>();

const emit = defineEmits<{
  select: [values: { [key: string]: any }];
}>();

const values = ref([]);
const previewUrl = ref("");
const fileType = ref<"image" | "video" | "other">("other");

function handleFiles(event: any) {
  // Clean up previous URL to prevent memory leaks
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }

  var file = event.target.files[0];
  if (file) {
    previewUrl.value = URL.createObjectURL(file);

    // Detect file type for appropriate preview
    if (file.type.startsWith("image/")) {
      fileType.value = "image";
    } else if (file.type.startsWith("video/")) {
      fileType.value = "video";
    } else {
      fileType.value = "other";
    }
  } else {
    previewUrl.value = "";
    fileType.value = "other";
  }
}

// Clean up object URL when component is unmounted
onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<template>
  <div class="flex flex-col">
    <input
      type="file"
      class="border border-slate-400 rounded-md px-3 py-0.5 w-full"
      :accept="props.accept"
      :multiple="props.multiple"
      @input="
        (event: any) => {
          values = event.target.files;
          handleFiles(event);
          emit('select', values);
        }
      "
    />
    <div
      v-show="props['preview'] && !previewUrl"
      class="h-[300px] w-[300px] mt-4 rounded-md bg-slate-200 flex items-center justify-center"
    >
      <h4 class="text-slate-500">Select the File to Preview</h4>
    </div>

    <!-- Image Preview -->
    <img
      v-show="props['preview'] && previewUrl && fileType === 'image'"
      :src="previewUrl"
      alt="selected file"
      class="w-auto mt-4 h-[300px] rounded-md"
    />

    <!-- Video Preview -->
    <video
      v-show="props['preview'] && previewUrl && fileType === 'video'"
      :src="previewUrl"
      controls
      class="w-auto mt-4 h-[300px] rounded-md"
    >
      Your browser does not support the video tag.
    </video>

    <!-- Other File Types -->
    <div
      v-show="props['preview'] && previewUrl && fileType === 'other'"
      class="h-[300px] w-[300px] mt-4 rounded-md bg-slate-100 flex items-center justify-center border"
    >
      <div class="text-center">
        <h4 class="text-slate-600 mb-2">File Selected</h4>
        <p class="text-slate-500 text-sm">Preview not available for this file type</p>
      </div>
    </div>
  </div>
</template>
