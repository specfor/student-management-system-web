import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useDataEntryFormsStore = defineStore('form-manager-data-entry', () => {
  const show = ref(false)
  const success = ref(false)
  const title = ref('')
  const fields = ref([])
  const fieldValues = ref({})
  const successBtnText = ref('')
  const errorMessages = ref({})

  function newDataEntryForm(title_, successBtn_, fields_) {
    fieldValues.value = {}
    success.value = false
    title.value = title_
    fields.value = fields_
    successBtnText.value = successBtn_

    for (const field of fields_) {
      if (field['type'] === 'checkbox') {
        fieldValues.value[field['name']] = {}
        for (const option of field['options']) {
          fieldValues.value[field['name']][option['name']] = !!option['checked']
        }
      } else {
        if (field['value']) fieldValues.value[field['name']] = field['value']
        else fieldValues.value[field['name']] = ''
      }
      errorMessages.value[field['name']] = ''
    }
    show.value = true
    console.log('showing form')
    return new Promise((resolve) => {
      let id = setInterval(() => {
        if (!show.value) {
          clearInterval(id)
          resolve({ data: fieldValues.value, submitted: success.value })
        }
      }, 200)
    })
  }
  return {
    show,
    success,
    title,
    fields,
    fieldValues,
    successBtnText,
    errorMessages,
    newDataEntryForm
  }
})
