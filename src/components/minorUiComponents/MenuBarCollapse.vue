<script setup lang="ts">
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';
import { ref, watch } from 'vue';

let expanded = ref(false);

const props = defineProps<{
    options?: {
        hideExpandCollapseIcons?: boolean
    }
}>()

watch(props, (val) => {
    if (val.options?.hideExpandCollapseIcons)
        expanded.value = false
})
</script>

<template>
    <div :class="{ 'bg-slate-900': expanded }">
        <div class="flex items-center justify-between cursor-pointer  hover:bg-blue-700" @click="expanded = !expanded">
            <slot name="header">
            </slot>
            <ChevronUpIcon class="w-6 h-6 stroke-2 mr-2 text-white"
                v-show="expanded && !props.options?.hideExpandCollapseIcons" />
            <ChevronDownIcon class="w-6 h-6 stroke-2 mr-2 text-white"
                v-show="!expanded && !props.options?.hideExpandCollapseIcons" />
        </div>

        <div v-show="expanded" class="text-sm">
            <slot></slot>
        </div>
    </div>
</template>