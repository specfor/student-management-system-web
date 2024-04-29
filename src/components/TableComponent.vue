<script setup>
import { defineProps, ref } from "vue";
import { ArrowPathIcon } from "@heroicons/vue/24/solid";

let selectedIds = ref([])
let isDisabled = ref(true)
let isActive = ref(false)
let isEditDisabled = ref(true)
let isEditActive = ref(false)
let searchInput = ref({})
let isHidden = ref(true)
let filterBgColor = ref('bg-white');

function isMultipleChecked() {
  if (selectedIds.value.length === 1) {
    isEditDisabled.value = false
    isEditActive.value = true
  } else {
    isEditDisabled.value = true
    isEditActive.value = false
  }
}

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
  refreshFunc
} = defineProps(['tableColumns', 'tableRows', 'actions', 'search', 'refreshFunc'])

let refreshingData = ref(false)

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
            ; $emit('deleteEmit', selectedIds); isDisabled = true; isActive = false; isEditDisabled = true; isEditActive = false; selectedIds = []; if (selectedIds) { isDisabled = true };
            selectedIds = []
          }">Delete
        </button>

        <button
          class="flex hover:cursor-pointer px-4 py-2 rounded-t-lg items-center border mr-3 disabled:cursor-not-allowed disabled:text-slate-400"
          :disabled="isEditDisabled"
          :class="{ 'bg-blue-400 text-white hover:bg-blue-700': isEditActive, 'text-slate-400': !isEditActive }"
          @click="() => { $emit('editEmit', selectedIds[0]); isDisabled = true; isEditActive = false; isActive = false; isDisabled = true; selectedIds = []; if (selectedIds) { isEditDisabled = true } }">
          Edit
        </button>

      </div>
      <div class="flex">
        <button
          class="flex hover:cursor-pointer hover:bg-slate-100 p-2 rounded-t-lg items-center border mr-3 disabled:cursor-not-allowed disabled:text-slate-400"
          @click="() => {
            refreshingData = true; refreshFunc().then((finished) => {
              ; if (finished) refreshingData = false
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
        <tr class="border-0 border-y-2 border-t-0 border-slate-500 bg-neutral-300">
          <th class="text-left px-3 pt-4 pb-2 font-bold"></th>
          <th class="text-left px-3 pt-4 pb-2 font-bold" v-for="(columnName, i) in tableColumns" :key="i">{{ columnName
            }}
          </th>
        </tr>
      </thead>

      <tbody class="font-semibold">
        <tr v-if="tableRows.length === 0">
          <td colspan="100%" class="text-center pt-2 text-slate-700">No Data To Display.</td>
        </tr>
        <tr v-for="row in tableRows" :key="row[0]"
          class="border-y border-slate-400 bg-neutral-100 hover:bg-neutral-200">
          <td class="pt-1 px-5">
            <input type="checkbox" class="h-5 w-5" :value="row[0]" v-model="selectedIds"
              v-on:change="() => { isChecked(); isMultipleChecked() }">
          </td>
          <td v-for="(data, index) in row" :key="index" class="px-3 py-1 text-slate-800">
            <span v-if="data === null || data === ''">None</span>
            <span v-else-if="typeof data === 'object'">
              <span v-if="data['type'] === 'html'" v-html="data['data']"></span>
            </span>
            <span v-else>{{ data }}</span>
          </td>
          <td v-if="actions" class="px-3 py-1 bg-neutral-300 flex items-center justify-center h-full">
            <div v-for="(action, index2) in actions" :key="index2">
              <router-link :to="{ name: 'OrderInfo', params: { id: row[0] } }">
                <Component v-if="action['type'] === 'icon'" :is="action['icon']" class="w-6 cursor-pointer mx-1"
                  :class="action['iconColor']" @click="$emit(action['onClickEvent'], row[0])" />
                <button v-else
                  class="py-0.5 my-0.5 mx-1 bg-blue-900/60 hover:bg-blue-900/80 rounded-md px-3 text-slate-100"
                  @click="$emit(action['onClickEvent'], row[0])">{{ action['btnText'] }}
                </button>
              </router-link>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped></style>