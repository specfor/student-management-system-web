import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSystemInfoStore = defineStore('systemInfo', () => {
  const sysInfo = ref({})
  let loaded = ref(false)

  if (!loaded.value) {
    loadInfoFromLocalStorage()
    laodInfoFromInternet()
    loaded.value = true
  }

  function getInfo() {
    return sysInfo.value
  }

  function loadInfoFromLocalStorage() {
    let savedData = localStorage.getItem('sysInfo')
    if (savedData !== null) sysInfo.value = JSON.parse(savedData)
  }

  async function laodInfoFromInternet() {
    let data = await (await fetch('/systemInfo.json')).json()
    sysInfo.value = data
    data = JSON.stringify(data)
    localStorage.setItem('sysInfo', data)
  }

  return {
    getInfo
  }
})
