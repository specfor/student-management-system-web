<script setup lang="ts">
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/solid';
import { ref } from 'vue';

let { header } = defineProps<{
    header: string
    headerTextCss?: string
    headerCss?: string
}>()

const expanded = ref(true);

function toggleExpand() {
    expanded.value = !expanded.value
}
</script>

<template>
    <div class="border-2  rounded-lg bg-white h-fit">
        <div class="px-4 py-2 flex justify-between" :class="headerCss">
            <h4 :class="headerTextCss ? headerTextCss : 'font-semibold text-lg'">{{ header }}</h4>
            <ChevronUpIcon v-show="expanded" @click="toggleExpand" class="w-8 h-8 cursor-pointer" />
            <ChevronDownIcon v-show="!expanded" @click="toggleExpand" class="w-8 h-8 cursor-pointer" />
        </div>
        <div v-show="expanded" class="border-t px-4 py-5">
            <slot></slot>
        </div>

    </div>
</template>