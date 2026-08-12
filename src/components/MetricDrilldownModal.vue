<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TableColumns, tableRowItem } from './TableComponent.vue';
import TableComponent from './TableComponent.vue';
import { XMarkIcon } from '@heroicons/vue/24/solid';

const props = defineProps<{
    visible: boolean;
    title: string;
    fetchData: (page: number) => Promise<{ data: any[]; total: number } | null>;
    mapRow: (item: any) => tableRowItem[];
    columns: TableColumns[];
    actions?: any[];
}>();

const emit = defineEmits(['close', 'action']);

const tableRows = ref<tableRowItem[][]>([]);
const totalItems = ref(0);
const loading = ref(false);

async function loadData(page: number = 1) {
    loading.value = true;
    const result = await props.fetchData(page);
    if (result) {
        tableRows.value = result.data.map(props.mapRow);
        totalItems.value = result.total;
    } else {
        tableRows.value = [];
        totalItems.value = 0;
    }
    loading.value = false;
    return true;
}

watch(() => props.visible, (newVal) => {
    if (newVal) {
        loadData(1);
    }
});

function handlePageChange(startIndex: number) {

    const page = Math.floor(startIndex / 15) + 1;
    loadData(page);
}

// Since TableComponent uses the URL `?page=X` by default, this might conflict.
// If it conflicts, we might need to modify TableComponent.
// For now we pass the props.
</script>

<template>
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh]">
            <div class="flex justify-between items-center p-4 border-b">
                <h2 class="text-xl font-bold">{{ title }}</h2>
                <button @click="emit('close')" class="text-gray-500 hover:text-gray-700">
                    <XMarkIcon class="w-6 h-6" />
                </button>
            </div>
            
            <div class="p-4 overflow-y-auto flex-grow relative">
                <div v-if="loading" class="absolute inset-0 flex justify-center items-center bg-white bg-opacity-70 z-10">
                    <span class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></span>
                </div>
                
                <TableComponent
                    v-if="!loading || tableRows.length > 0"
                    :table-columns="columns"
                    :table-rows="tableRows"
                    :paginate-total="totalItems"
                    :paginate-page-size="15"
                    :actions="actions"
                    @load-page-emit="handlePageChange"
                    :refresh-func="async () => { return await loadData(1); }"
                    :options="{ hideActionBar: true, hidePaginateBar: totalItems <= 15, showRowCheckBox: false }"
                    @discard="(id) => emit('action', 'discard', id)"
                    @recover="(id) => emit('action', 'recover', id)"
                />
            </div>
        </div>
    </div>
</template>
