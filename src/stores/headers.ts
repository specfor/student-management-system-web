import { ref } from "vue";
import { defineStore } from "pinia";

export const useHeaderStore = defineStore("headers", () => {
  const headers = ref({} as { [key: string]: string });

  function appendHeaders(headers_: { [key: string]: string }) {
    for (const [key, value] of Object.entries(headers_)) {
      headers.value[key] = value;
    }
  }

  function getHeaders() {
    return headers.value;
  }

  function removeHeader(key: string) {
    if (headers.value[key]) delete headers.value[key];
  }

  return {
    headers,
    getHeaders,
    appendHeaders,
    removeHeader,
  };
});
