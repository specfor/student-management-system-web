import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useDataEntryFormsStore = defineStore('form-manager-data-entry', () => {
  const show = ref(false)
  const submitted = ref(false)
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
    submitted.value = false

    for (const field of fields_) {
      if (field['type'] === 'checkbox') {
        fieldValues.value[field['name']] = {}
        for (const option of field['options']) {
          fieldValues.value[field['name']][option['name']] = !!option['checked']
        }
      } else if (field['type'] === 'heading' || field['type'] === 'message') {
        continue
      } else {
        if (field['value']) fieldValues.value[field['name']] = field['value']
        else fieldValues.value[field['name']] = ''
      }
      errorMessages.value[field['name']] = ''
    }
    show.value = true
  }

  function waitForSubmittedData() {
    success.value = false
    submitted.value = false
    return new Promise((resolve) => {
      let id = setInterval(() => {
        if (submitted.value) {
          clearInterval(id)
          resolve({ data: fieldValues.value, submitted: success.value })
        }
      }, 200)
    })
  }

  function finishSubmission() {
    submitted.value = false
    show.value = false
  }

  return {
    show,
    submitted,
    success,
    title,
    fields,
    fieldValues,
    successBtnText,
    errorMessages,
    newDataEntryForm,
    waitForSubmittedData,
    finishSubmission
  }
})
