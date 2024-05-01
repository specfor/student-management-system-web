import { ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { ExclamationCircleIcon } from '@heroicons/vue/24/solid'

export const useExtendablePopUpStore = defineStore('form-manager-extendable-pop-up', () => {
  let htmlBody = ref('')
  let componentObj = shallowRef(ExclamationCircleIcon)
  let argsPassed = ref([])
  let show = ref(false)

  function showHtmlContent(content, args = []) {
    argsPassed.value = args
    componentObj.value = ExclamationCircleIcon
    htmlBody.value = content
    show.value = true
  }

  function showComponent(component, args = []) {
    argsPassed.value = args
    htmlBody.value = ''
    componentObj.value = component
    show.value = true
  }

  return {
    show,
    htmlBody,
    componentObj,
    argsPassed,
    showHtmlContent,
    showComponent
  }
})
