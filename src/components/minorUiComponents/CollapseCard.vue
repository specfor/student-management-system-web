<script setup lang="ts">
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/solid';
import { ref } from 'vue';

let { header, collapseOnStart } = defineProps<{
    header: string
    headerTextCss?: string
    headerCss?: string
    collapseOnStart?: boolean
}>()

const expanded = ref(true);

if (collapseOnStart) {
    expanded.value = false
}

function toggleExpand() {
    expanded.value = !expanded.value
}
</script>

<template>
    <div class="border-2  rounded-lg bg-white h-fit">
        <div class="px-4 py-2 flex justify-between" :class="headerCss">
            <h4 :class="headerTextCss ? headerTextCss : 'font-semibold text-lg'">{{ header }}</h4>
            <ChevronUpIcon v-show="expanded" @click="toggleExpand"
                class="w-8 h-8 cursor-pointer hover:bg-slate-300 rounded-full" />
            <ChevronDownIcon v-show="!expanded" @click="toggleExpand"
                class="w-8 h-8 cursor-pointer hover:bg-slate-300 rounded-full" />
        </div>
        <div v-show="expanded" class="border-t px-4 py-5">
            <slot></slot>
        </div>

    </div>
</template>