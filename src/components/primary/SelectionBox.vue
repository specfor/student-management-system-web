<script setup lang="ts">
import type { SelectionBoxFields } from '@/types/inputBoxTypes';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import { ref, watch, type Ref } from 'vue';

const props = defineProps<SelectionBoxFields>()

const emit = defineEmits<{
    input: [any]
}>()

// Use to select search box element
const searchBox: any = ref(null)

let isOpen = ref(false)
let selected: Ref<string | boolean | number> = ref('')
let search = ref('')
let optionsRendered: Ref<SelectionBoxFields['options']> = ref([{ text: "", value: "" }])
let focusSelection: Ref<string | boolean | number> = ref('')

optionsRendered.value = props.options
watch(props, (newVal) => {
    selected.value = newVal.value!
    optionsRendered.value = newVal.options
}, { deep: true })

watch(optionsRendered, (newVal) => {
    if (newVal.length > 0)
        focusSelection.value = optionsRendered.value[0]['value']
})

function setSelected(value: string | number | boolean) {
    selected.value = value
    isOpen.value = false
    emit('input', value)
}

function searchItem() {
    optionsRendered.value = props.options.filter(option => {
        return option['text'].toLowerCase().includes(search.value.toLowerCase())
    })
}

function moveSelection(direction: 'up' | 'down') {
    let index = optionsRendered.value.indexOf(optionsRendered.value.find(option => option['value'] == focusSelection.value)!);
    if (direction == 'up' && index > 0)
        focusSelection.value = optionsRendered.value[index - 1]['value']
    else if (direction == 'down' && index < optionsRendered.value.length - 1)
        focusSelection.value = optionsRendered.value[index + 1]['value']
}

</script>

<template>
    <!-- @keydown.space="() => {if (!isOpen) { isOpen = true }}" -->
    <div class="relative" @keydown.esc="(event) => { if (isOpen) event.preventDefault(); isOpen = false }"
        @keydown.tab="(event) => { if (isOpen) event.preventDefault(); searchBox.focus() }"
        @keydown.up="() => { moveSelection('up') }" @keydown.down="() => { moveSelection('down') }" @keydown.enter="() => {
            if (isOpen) setSelected(focusSelection)
        }" @keydown="searchBox.focus()">
        <Popper @open:popper="isOpen = true" @close:popper="isOpen = false" class="w-full" offsetDistance="0">
            <div tabindex="0" @click="() => { isOpen = !isOpen }"
                class="border w-full min-h-9 border-gray-400 bg-white hover:bg-gray-100 rounded-md py-1 flex justify-between items-center">
                <h1 class="mx-5 overflow-hidden">{{ props.options.find(o => o['value'] == props.value) ?
                    props.options.find(o => o['value'] ==
                        props.value)!['text'] : '' }}</h1>
                <ChevronDownIcon class="w-4 h-4 stroke-2 mr-1" />
            </div>

            <template #content="{ close }">
                <div class="w-full bg-white shadow-lg z-30" v-show="isOpen">
                    <div class="relative mt-2 mb-3 mx-1">
                        <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                            <MagnifyingGlassIcon class="w-5 h-5 stroke-2 stroke-slate-600" aria-hidden="true" />
                        </div>
                        <input type="text" :value="search"
                            @input="(event: any) => { search = event.target.value; searchItem() }"
                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-300 focus:border-blue-300 block w-full ps-10 p-2.5"
                            placeholder="Search" ref="searchBox">
                    </div>
                    <div class="max-h-96 h-auto border overflow-y-auto">
                        <h3 v-for="(option, index) in optionsRendered" :key="index" class="py-1 px-5"
                            :class="{ 'bg-slate-200': option['value'] == focusSelection }"
                            v-on:mouseover="() => { focusSelection = option['value'] }"
                            @click="() => { setSelected(option['value']); close() }">
                            {{ option['text'] }}</h3>
                    </div>
                </div>
            </template>
        </Popper>


    </div>
</template>