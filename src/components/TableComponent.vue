<script setup lang="ts">
import { defineComponent, defineProps, ref, toRef, watch, type FunctionalComponent, type Ref } from "vue";
import PaginateComponent from "./PaginateComponent.vue";

const selectedIds = ref([])
const isDisabled = ref(true)
const isActive = ref(false)
const searchInput: Ref<any> = ref({})
const isHidden = ref(true)
const filterBgColor = ref('bg-white');
const refreshingData = ref(false)
const showTableOptions = ref(false)
let activeSorting: Ref<{ column: string, direc: 'asc' | 'desc' }> = ref({ column: '', direc: 'asc' })

function isChecked() {
  if (selectedIds.value.length === 0) {
    isActive.value = false
    isDisabled.value = true
  } else {
    isActive.value = true
    isDisabled.value = false
  }
}

let {
  tableColumns,
  tableRows,
  actions,
  search,
  paginatePageSize,
  paginateTotal,
  currentSorting,
  refreshFunc
} = defineProps<{
  tableColumns: TableColumns[]
  tableRows: any[][]
  actions: TableActionType[]
  search?: any
  paginateTotal: number
  paginatePageSize: number
  refreshFunc?: () => Promise<boolean>
  currentSorting?: { column: string, direc: 'asc' | 'desc' }
}>()

if (currentSorting)
  activeSorting.value = currentSorting


export type TableActionType =
  ({
    renderAsRouterLink: true
    url: string
    params?: any
  } | {
    renderAsRouterLink: false
  }) & Inputs

export type TableColumns = { label: string, sortable?: boolean }

type Inputs = {
  type: "icon"
  icon: FunctionalComponent;
  emit: string
  css?: string
} |
{
  type: 'text'
  text: string
  emit: string
  css?: string
}

</script>

<template>
  <div class="w-full overflow-x-auto">
    <div class="flex justify-between w-full">
      <div class="flex">
        <div class="flex px-4 py-2 rounded-tl-lg items-center border text-slate-700 text-sm">
          Group Actions
        </div>
        <button
          class="flex hover:cursor-pointer px-4 py-2 rounded-tr-lg items-center border mr-3 disabled:cursor-not-allowed disabled:text-slate-400"
          :disabled="isDisabled"
          :class="{ 'bg-red-400 text-white hover:bg-red-700': isActive, 'text-slate-400  ': !isActive }" @click="() => {
            $emit('deleteEmit', selectedIds); isDisabled = true; isActive = false; selectedIds = []; if (selectedIds) { isDisabled = true };
            selectedIds = [];
          }">Delete
        </button>
      </div>
      <div class="flex">
        <button
          class="flex hover:cursor-pointer hover:bg-slate-100 p-2 rounded-t-lg items-center border mr-3 disabled:cursor-not-allowed disabled:text-slate-400"
          @click="() => {
            refreshingData = true; if (refreshFunc !== undefined) refreshFunc().then((finished: boolean) => {
              if (finished) refreshingData = false
            });
          }" :disabled="refreshingData">
          <ArrowPathIcon class="h-6 mr-3" :class="{ 'animate-spin': refreshingData }" />
          <h4 class="font-semibold">Refresh Data</h4>
        </button>
        <div
          @click="isHidden = !isHidden; filterBgColor === 'bg-white' ? filterBgColor = 'bg-slate-400' : filterBgColor = 'bg-white'"
          class="flex hover:cursor-pointer p-2 rounded-t-lg items-center hover:bg-slate-100 border"
          :class="filterBgColor">
          <h4 class="font-semibold mr-2">Filters</h4>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
            stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </div>
      </div>
    </div>

    <div class="relative">
      <div class="block mb-2 bg-slate-400 rounded-l-lg rounded-b-lg w-1/2 py-3 px-3 absolute top-0 right-0 z-[1030]"
        :class="{ 'hidden': isHidden }">
        <div v-for="(item, i) in search" :key="i" class="grid grid-cols-3 ml-5">
          <h5 v-text="item['searchParameter']" class="flex items-center"></h5>
          <input :type="item.type" class="rounded-md border-2 border-stone-600 bg-stone-200 px-3 h-8 mt-1 col-span-2"
            v-model="searchInput[item.paramNumber]" @input="$emit(item['searchParamType'], searchInput)">
        </div>
      </div>
    </div>
    <table class="table-auto border-collapse border w-full">

      <thead>
        <tr class="border-0 border-y-2 border-t-0 border-slate-500 bg-neutral-200">
          <th class="text-left px-3 pt-4 pb-2 font-bold">
          </th>
          <th class="text-left px-1 pt-4 pb-2 font-bold" v-for="(column, i) in tableColumns" :key="i">
            <div class="flex">
              {{ column.label }}
              <ArrowLongDownIcon class="w-5 ml-1 hover:stroke-2 hover:stroke-slate-800 cursor-pointer"
                :class="(activeSorting.column === column.label && activeSorting.direc === 'asc') ? 'stroke-slate-900' : 'stroke-slate-400'"
                @click="() => { $emit('sortBy', column.label, 'asc'); activeSorting.column = column.label; activeSorting.direc = 'asc' }"
                v-if="column.sortable" />
              <ArrowLongUpIcon class="w-5 hover:stroke-2 hover:stroke-slate-800  cursor-pointer"
                :class="(activeSorting.column === column.label && activeSorting.direc === 'desc') ? 'stroke-slate-900' : 'stroke-slate-400'"
                @click="() => { $emit('sortBy', column.label, 'desc'); activeSorting.column = column.label; activeSorting.direc = 'desc' }"
                v-if="column.sortable" />
            </div>
          </th>
          <th v-if="actions.length > 0" class="text-center px-3 pt-4 pb-2 font-bold">Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="tableRows.length === 0">
          <td colspan="100%" class="text-center pt-2 text-slate-700">No Data To Display.</td>
        </tr>
        <tr v-for="row in tableRows" :key="row[0]" class="border-y border-slate-300 bg-neutral-50 hover:bg-neutral-200">
          <td class="pt-1 px-5"
            v-if="!row.some(value => { return typeof value == 'object' && value !== null && value.type === 'group' })">
            <input type="checkbox" class="h-5 w-5" :value="row[0]" v-model="selectedIds" v-on:change="isChecked">
          </td>
          <td colspan="100%" class="py-1 font-semibold bg-white pl-6"
            v-if="row.find(value => { return typeof value == 'object' && value !== null && value.type === 'group' })">
            {{ row.find(value => { return typeof value == 'object' && value !== null && value.type === 'group' }).value
            }}
          </td>
          <template
            v-if="!row.some(value => { return typeof value == 'object' && value !== null && value.type === 'group' })">
            <td v-for="(data, index) in row" :key="index" class="px-3 py-1 text-slate-800">
              <span v-if="data === null || data === ''" class="">None</span>
              <span v-else-if="typeof data === 'object'">
                <span v-if="data['type'] === 'html'" v-html="data['value']"></span>
              </span>
              <span v-else>{{ data }}</span>
            </td>
          </template>
          <td
            v-if="actions && !row.some(value => { return typeof value == 'object' && value !== null && value.type === 'group' })"
            class="px-3 py-1 flex items-center justify-center h-full">
            <div v-for="(action, index2) in actions" :key="index2">
              <router-link v-if="action['renderAsRouterLink']" class="flex items-center"
                :to="{ name: action['url'], params: action['params'] ?? {} }">
                <Component v-if="action['type'] === 'icon'" :is="action['icon']" class="w-6 cursor-pointer mx-1"
                  :class="action['css']" @click="$emit(action['emit'], row[0])" />
                <button v-else
                  class="py-0.5 my-0.5 mx-1 bg-blue-900/60 hover:bg-blue-900/80 rounded-md px-3 text-slate-100"
                  @click="$emit(action['emit'], row[0])">{{ action['text'] }}
                </button>
              </router-link>
              <div v-else class="flex items-center">
                <Component v-if="action['type'] === 'icon'" :is="action['icon']" class="w-6 cursor-pointer mx-1"
                  :class="action['css']" @click="$emit(action['emit'], row[0])" />
                <button v-else
                  class="py-0.5 my-0.5 mx-1 bg-blue-900/60 hover:bg-blue-900/80 rounded-md px-3 text-slate-100"
                  @click="$emit(action['emit'], row[0])">{{ action['text'] }}
                </button>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="flex justify-center mt-4">
    <PaginateComponent :total-count="paginateTotal" :page-size="paginatePageSize"
      @load-page-emit="$emit('loadPageEmit', $event)" />
  </div>
</template>

<style scoped></style>