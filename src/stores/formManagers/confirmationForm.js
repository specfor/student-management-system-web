import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useConfirmationFormsStore = defineStore('form-manager-confirmation', () => {
  let confirm = ref(false)
  let open = ref(false)
  let title = ref(false)
  let message = ref(false)

  function newConfirmationForm(title_, message_) {
    title.value = title_
    message.value = message_
    confirm.value = false
    open.value = true
    return new Promise((resolve) => {
      let id = setInterval(() => {
        if (open.value === false) {
          clearInterval(id)
          resolve(confirm.value)
        }
      }, 200)
    })
  }

  return {
    open,
    title,
    message,
    confirm,
    newConfirmationForm
  }
})
