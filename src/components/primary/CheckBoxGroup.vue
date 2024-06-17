<script setup lang="ts">
import { ref, type Ref } from 'vue';
import type { CheckboxFields } from '@/types/inputBoxTypes';

const props = defineProps<CheckboxFields>()

const emit = defineEmits<{
    checked: [value: boolean]
}>()

const values: Ref<{ [key: string]: any }> = ref([])
</script>

<template>
    <div class="col-span-2 grid grid-cols-2">
        <div v-for="(option, index3) in props.options" :key="index3" class="flex mt-1">
            <input class="w-5 h-5 mt-0.5" :disabled="props.disabled" type="checkbox" :checked="option['checked']"
                @input="event => values[option['name']] = event.target.checked">
            <p class="ml-2 font-semibold ">{{ option['text'] }}</p>
        </div>
    </div>
</template>