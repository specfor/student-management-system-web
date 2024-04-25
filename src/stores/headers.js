import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useHeaderStore = defineStore('headers', () => {
  const headers = ref({})

  function appendHeaders(headers_) {
    for (const [key, value] of Object.entries(headers_)) {
      headers.value[key] = value
    }
  }

  function getHeaders() {
    return headers.value
  }

  function removeHeader(key) {
    if (headers.value[key]) delete headers.value[key]
  }

  return {
    headers,
    getHeaders,
    appendHeaders,
    removeHeader
  }
})
