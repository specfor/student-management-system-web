<script setup lang="ts">
import { defineProps, ref, toRef, watch, type FunctionalComponent, type Ref } from "vue";
import { ArrowPathIcon, Cog6ToothIcon } from "@heroicons/vue/24/solid";
import { ArrowLongDownIcon, ArrowLongUpIcon } from "@heroicons/vue/24/outline";
import PaginateComponent from "./PaginateComponent.vue";
import TableColoredTag from "./primary/TableColoredTag.vue";
import { setRoute } from "@/utils/routeHelpers";
import type { CheckboxFields, SelectionBoxFields } from "@/types/inputBoxTypes";
import SelectionBox from "./primary/SelectionBox.vue";

const selectAll = ref(false)
const selectedIds: Ref<any[]> = ref([])
const isDisabled = ref(true)
const isActive = ref(false)
const searchInput: Ref<any> = ref({})
const isHidden = ref(true)
const filterBgColor = ref('bg-white');
const refreshingData = ref(false)
const showTableOptions = ref(false)
const showResetBtn = ref(false)

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

let props = defineProps<{
  tableColumns: TableColumns[]
  tableRows: tableRowItem[][]
  actions?: TableActionType[]
  filters?: Filter[]
  paginateTotal?: number
  paginatePageSize?: number
  refreshFunc?: () => Promise<boolean>
  currentSorting?: { column: string, direc: 'asc' | 'desc' }
  options?: { hideActionBar?: boolean, hidePaginateBar?: boolean, showRowCheckBox?: boolean }
}>()

let tableColumns = toRef(props, 'tableColumns')
let tableRows = toRef(props, 'tableRows')
let actions = toRef(props, 'actions')
let filters = toRef(props, 'filters')
let paginateTotal = toRef(props, 'paginateTotal')
let paginatePageSize = toRef(props, 'paginatePageSize')
let currentSorting = toRef(props, 'currentSorting')
let refreshFunc = props.refreshFunc
let options = toRef(props, 'options')


watch(selectAll, (isTrue) => {
  if (isTrue) {
    selectedIds.value = tableRows.value.map((row) => row[0])
    isDisabled.value = false
  } else {
    selectedIds.value = []
    isDisabled.value = true
  }
})

for (const filter of filters.value ?? []) {
  searchInput.value[filter.name] = filter.value
}

function resetFilters() {
  showResetBtn.value = false
  searchInput.value = {}
  for (const filter of filters.value ?? []) {
    searchInput.value[filter.name] = filter.value
  }
}

if (currentSorting.value)
  activeSorting.value = currentSorting.value



export type TableActionType =
  ({
    renderAsRouterLink: true
    url: string
    params?: any
  } | {
    renderAsRouterLink: false
  }) & Inputs

export type TableColumns = { label: string, sortable?: boolean }

export type tableRowItem = string | number | null | undefined | {
  type: "group"
  value: string | number | boolean
} | {
  type: "html"
  html: string
} | {
  type: "colorTag"
  text: string
  css?: string
} | {
  type: 'textWithLink'
  text: string
  url: string
}

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

export type Filter = {
  label: string
  name: string
  value?: any
} & ({
  type: 'select'
  options: SelectionBoxFields['options']
} | {
  type: 'checkbox'
  options: CheckboxFields
} | {
  type: "textarea"
  | "text"
  | "password"
  | "date"
  | "month"
  | "time"
  | "number"
})
</script>

<template>
  <div class="w-full h-full overflow-x-auto">
    <div class="flex justify-between w-full" v-if="options?.hideActionBar !== true">
      <div class="flex">
        <div class="flex px-4 py-2 rounded-tl-lg items-center border text-slate-700 text-sm">
          Group Actions
        </div>
        <button
          class="flex hover:cursor-pointer px-4 py-2 rounded-tr-lg items-center border mr-3 disabled:cursor-not-allowed disabled:text-slate-400"
          :disabled="isDisabled"
          :class="{ 'bg-red-600 text-white hover:bg-red-700': isActive, 'text-slate-400': !isActive }" @click="() => {
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
        <div v-show="showResetBtn">
          <button @click="() => {
            resetFilters(); $emit('filterValues', searchInput)
          }" class="py-2 px-3 border rounded-tl-lg items-center bg-yellow-600 font-semibold">Reset Filters</button>
        </div>
        <div
          @click="isHidden = !isHidden; filterBgColor === 'bg-white' ? filterBgColor = 'bg-slate-200' : filterBgColor = 'bg-white'"
          class="flex hover:cursor-pointer p-2  hover:bg-slate-100 border" :class="filterBgColor">
          <h4 class="font-semibold mr-2">Filters</h4>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
            stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </div>
      </div>
    </div>

    <div class="w-full bg-slate-200" :class="{ 'hidden': isHidden }">
      <div class="grid grid-cols-3 gap-x-5 gap-y-3 rounded-tl-lg py-3 px-3">
        <div v-for="(item, i) in filters" :key="i" class="grid grid-cols-3 items-center">
          <h5 v-text="item['label']" class="flex items-center justify-self-end mr-3"></h5>
          <template v-if="item.type == 'select'">
            <SelectionBox :value="searchInput[item.name]" :options="item.options" class="col-span-2"
              @input="(val) => { searchInput[item.name] = val; $emit('filterValues', searchInput); showResetBtn = true }" />
          </template>
          <template v-else>
            <input :type="item.type" class="rounded-md border border-stone-600 px-3 h-8 mt-1 col-span-2"
              v-model="searchInput[item.name]" @input="$emit('filterValues', searchInput); showResetBtn = true">
          </template>
        </div>
      </div>
    </div>
    <div class="border" v-show="showTableOptions">
      <h4>agaoegh</h4>
    </div>


    <table class="table-auto border-collapse border w-full">
      <thead>
        <tr class="border-0 border-y-2 border-t-0 border-slate-500 bg-neutral-200">
          <th class="text-left px-3 pt-4 pb-2 font-bold"
            v-if="options?.hideActionBar !== true || options?.showRowCheckBox">
            <input type="checkbox" class="w-5 h-5 mx-2" v-model="selectAll" @click="selectAll = !selectAll"
              v-on:change="() => { isChecked(); $emit('selected-rows', selectedIds) }" />
            <!-- <Cog6ToothIcon class="w-8 h-8 cursor-pointer hover:rotate-180 duration-700 transition-all"
              @click="showTableOptions = !showTableOptions" /> -->
          </th>
          <!-- <th class="text-2xl text-left pr-4 pt-4 pb-2 font-bold">#</th> -->
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
          <th v-if="actions ? (actions.length > 0) : false" class="text-center px-3 pt-4 pb-2 font-bold">Actions</th>
        </tr>
      </thead>

      <tbody class="overflow-y-scroll">
        <tr v-if="tableRows.length === 0">
          <td colspan="100%" class="text-center pt-2 text-slate-700">No Data To Display.</td>
        </tr>
        <tr v-for="row in tableRows" :key="row[0] as string"
          class="border-y border-slate-300 bg-neutral-50 hover:bg-neutral-200">
          <td class="pt-1 px-5"
            v-if="(options?.hideActionBar !== true || options?.showRowCheckBox === true) && !row.some(value => { return typeof value == 'object' && value !== null && value.type === 'group' })">
            <input type="checkbox" class="h-5 w-5" :value="row[0]" v-model="selectedIds"
              v-on:change="() => { isChecked(); $emit('selected-rows', selectedIds) }">
          </td>
          <td colspan="100%" class="py-1 font-semibold bg-white pl-6"
            v-if="row.find(value => { return typeof value == 'object' && value !== null && value.type === 'group' })">
            {{ (row.find(value => { return typeof value == 'object' && value !== null && value.type === 'group' })! as
              any).value
            }}
          </td>
          <template
            v-if="!row.some(value => { return typeof value == 'object' && value !== null && value.type === 'group' })">
            <td v-for="(data, index) in row" :key="index" class="pl-1 pr-3 py-1 text-slate-800">
              <span v-if="data === null || data === ''" class="">None</span>
              <span v-else-if="typeof data === 'object'">
                <span v-if="data['type'] === 'html'" v-html="data['html']"></span>
                <TableColoredTag v-else-if="data['type'] === 'colorTag'" :text="data['text']"
                  :css="data['css'] ?? ''" />
                <span v-else-if="data['type'] === 'textWithLink'" @click="() => { setRoute(data['url']) }"
                  class="text-blue-500 cursor-pointer">{{ data['text']
                  }}</span>
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

    <div class="flex justify-center mt-4" v-if="options?.hidePaginateBar ? !options.hidePaginateBar : true">
      <PaginateComponent :total-count="paginateTotal" :page-size="paginatePageSize"
        @load-page-emit="$emit('loadPageEmit', $event)" />
    </div>
  </div>

</template>

<style scoped></style>