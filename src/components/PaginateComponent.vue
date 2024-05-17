<script setup>
import { ref, watch } from 'vue';
const emit = defineEmits(['loadPageEmit'])

let props = defineProps(['totalCount', 'pageSize'])

let pageNums = ref([])
let currentPage = ref(1)

watch(props, () => {
  let totalPages = Math.ceil(props.totalCount / props.pageSize)

  pageNums.value = []
  for (let i = 0; i < totalPages; i++) {
    pageNums.value.push(i + 1);
  }
})

function loadPage(pageNum) {
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

  <nav aria-label="Page navigation example">
    <ul class="flex items-center -space-x-px h-8 text-sm">
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
        <a href="#" :aria-current="currentPage === num ? 'page' : ''" class=" flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 
          hover:bg-gray-100 hover:text-gray-700" @click="loadPage(num)"
          :class="currentPage === num ? 'text-blue-600 border border-blue-300 bg-blue-100 hover:bg-blue-200 hover:text-blue-700' : ''">
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
    </ul>
  </nav>

</template>