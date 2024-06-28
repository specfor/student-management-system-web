<script setup lang="ts">
import { ref, watch, type Ref } from 'vue';
const emit = defineEmits<{
  loadPageEmit: [startingIndex: number]
}>()

let props = defineProps(['totalCount', 'pageSize'])

let pageNums: Ref<number[]> = ref([])
let currentPage = ref(1)

watch(props, () => {
  let totalPages = Math.ceil(props.totalCount / props.pageSize)

  pageNums.value = []
  for (let i = 0; i < totalPages; i++) {
    pageNums.value.push(i + 1);
  }
})

function loadPage(pageNum: number) {
  let sIndex = (pageNum - 1) * props.pageSize;
  emit('loadPageEmit', sIndex)
  currentPage.value = pageNum
}

function prevPage() {
  if (currentPage.value > 1)
    loadPage(currentPage.value - 1);
}

function nextPage() {
  if (currentPage.value < pageNums.value.length) {
    loadPage(currentPage.value + 1);
  }
}
</script>

<template>

  <nav aria-label="Page navigation example" class="w-full">
    <ul class="flex justify-center items-center -space-x-px h-8 text-sm relative">
      <li>
        <a href="#" @click="prevPage"
          class="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700">
          <span class="sr-only">Previous</span>
          <svg class="w-2.5 h-2.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 6 10">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M5 1 1 5l4 4" />
          </svg>
        </a>
      </li>
      <li v-for="num in pageNums" :key="num">
        <a href="#" class=" flex items-center justify-center px-3 h-8 leading-tight border" @click="loadPage(num)"
          :class="currentPage == num ?
            'text-blue-600  border-blue-300 bg-blue-100 hover:bg-blue-200 hover:text-blue-700' :
            'text-gray-500  bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700'">
          {{ num }}</a>
      </li>
      <li>
        <a href="#" @click="nextPage"
          class="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700">
          <span class="sr-only">Next</span>
          <svg class="w-2.5 h-2.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 6 10">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="m1 9 4-4-4-4" />
          </svg>
        </a>
      </li>
      <div class="absolute right-0 text-md">
        <div class="border py-1 px-3 rounded-md text-slate-600">
          <p>Records Count: <span class="text-blue-500 font-bold">{{ props.totalCount }}</span></p>
        </div>
      </div>
    </ul>
  </nav>

</template>