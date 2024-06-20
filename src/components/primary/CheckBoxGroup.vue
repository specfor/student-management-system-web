<script setup lang="ts">
import { ref, watch, type Ref } from 'vue';
import type { CheckboxFields } from '@/types/inputBoxTypes';

const props = defineProps<CheckboxFields>()

const emit = defineEmits<{
    change: [values: { [key: string]: any }]
}>()

const values: Ref<{ [key: string]: any }> = ref({})

watch(values, (newVal) => {
    emit('change', newVal)
}, { deep: true })
function init() {
    for (const option of props.options) {
        values.value[option['name']] = option['checked'] === undefined ? false : option['checked']
    }
}
init()
</script>

<template>
    <div v-for="(option, index3) in props.options" :key="index3" class="flex mt-1">
        <input class="w-5 h-5 mt-0.5" :disabled="props.disabled" type="checkbox" :checked="option['checked']"
            v-model="values[option['name']]">
        <p class="ml-2 font-semibold ">{{ option['text'] }}</p>
    </div>
</template>