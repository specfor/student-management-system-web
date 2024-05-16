<!-- eslint-disable vue/require-v-for-key -->
<script setup>
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { storeToRefs } from 'pinia';
import { ArrowPathIcon } from '@heroicons/vue/24/solid';

const dataEntryForm = useDataEntryFormsStore()
const { show, previewUrls, submitted, allowSubmit, success, title, fields, fieldValues, successBtnText, errorMessages } = storeToRefs(dataEntryForm)

function validateInput(name) {
  let anyError = false;
  for (const field of fields.value) {
    if (field['name'] === name) {
      if (fieldValues.value[name].length === 0)
        if (field['required'])
          errorMessages.value[name] = 'This field is required.'
        else
          errorMessages.value[name] = ''
      else if (field['validate'])
        errorMessages.value[name] = field['validate'](fieldValues.value[name]) ?? ''
      else
        errorMessages.value[name] = ''
    }
    if (field['required'] ?? false)
      if (fieldValues.value[field['name']] === '')
        anyError = true
  }
  for (const field of fields.value) {
    if (field['type'] !== 'heading' || field['type'] !== 'message')
      continue
    if (errorMessages.value[field['name']] !== '')
      anyError = true;
  }
  allowSubmit.value = !anyError;
}

function handleFiles(fieldName, event) {
  var file = event.target.files[0]
  previewUrls.value[fieldName] = URL.createObjectURL(file)

}
</script>

<template>
  <TransitionRoot as="template" :show="show" @keydown.escape="show = false">
    <Dialog as="div" class="relative z-10">
      <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100"
        leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <TransitionChild as="template" enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
            <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all
                 sm:my-8 sm:w-full sm:max-w-lg">
              <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div class="text-center text-2xl font-bold mb-10 ">{{ title }}</div>
                <div v-for="field in fields">
                  <div v-if="field['type'] === 'select'" class="grid grid-cols-3 mb-1 relative">
                    <div class="flex justify-between">
                      <div class="font-semibold text-slate-700 py-0.5">
                        {{ field['text'] }}
                      </div>
                      <h3 class="text-xl text-red-700 pr-1" v-if="field['required']">*</h3>
                    </div>
                    <select :disabled="field['disabled']" class="col-span-2 border-2 border-slate-400 rounded-md hover:border-slate-700 px-3 py-0.5
                             hover:bg-slate-200 disabled:border" :name="field['name']"
                      :value="fieldValues[field['name']]"
                      @input="(event) => { fieldValues[field['name']] = event.target.value; validateInput(field['name']) }">
                      <option class="" v-for="option in field['options']" :value="option['value']">{{ option['text'] }}
                      </option>
                    </select>
                    <div class="absolute top-7 right-0 z-[1000] w-2/3 px-2 rounded-lg bg-red-500/80 text-rose-900"
                      v-if="errorMessages[field['name']]">
                      {{ errorMessages[field['name']] }}
                    </div>
                  </div>
                  <div v-else-if="field['type'] === 'checkbox'" class="grid grid-cols-3 my-2 relative">
                    <div class="flex justify-between">
                      <div class="font-semibold text-slate-700 py-0.5">
                        {{ field['text'] }}
                      </div>
                      <h3 class="text-xl text-red-700 pr-1" v-if="field['required']">*</h3>
                    </div>
                    <div class="col-span-2 grid grid-cols-2">
                      <div v-for="option in field['options']" class="flex mt-1">
                        <input class="w-5 h-5 mt-0.5" :disabled="field['disabled']" type="checkbox"
                          :checked="option['checked']"
                          @input="event => fieldValues[field['name']][option['name']] = event.target.checked">
                        <p class="ml-2 font-semibold ">{{ option['text'] }}</p>
                      </div>
                      <div class="absolute top-7 right-0 z-[1000] w-2/3 px-2 rounded-lg bg-red-500/80 text-rose-900"
                        v-if="errorMessages[field['name']]">
                        {{ errorMessages[field['name']] }}
                      </div>
                    </div>
                  </div>
                  <div v-else-if="field['type'] === 'textarea'" class="grid grid-cols-3 mb-1 relative">
                    <div class="flex justify-between">
                      <div class="font-semibold text-slate-700 py-0.5">
                        {{ field['text'] }}
                      </div>
                      <h3 class="text-xl text-red-700 pr-1" v-if="field['required']">*</h3>
                    </div>
                    <textarea :name="field['name']" cols="30" rows="3" :value="fieldValues[field['name']]"
                      @input="(event) => { fieldValues[field['name']] = event.target.value; validateInput(field['name']) }"
                      :disabled="field['disabled']" class="col-span-2 border-2 border-slate-400 rounded-md px-3 hover:border-slate-700
                               py-0.5 hover:bg-slate-100 focus:bg-slate-200 disabled:border"></textarea>
                    <div class="absolute top-7 right-0 z-[1000] w-2/3 px-2 rounded-lg bg-red-500/80 text-rose-900"
                      v-if="errorMessages[field['name']]">
                      {{ errorMessages[field['name']] }}
                    </div>
                  </div>
                  <div v-else-if="field['type'] === 'message'" class="mt-3 mb-1">
                    <div class="font-semibold text-slate-900 py-0.5 pl-4 pr-1 ml-5 bg-slate-300 rounded-l-full">
                      {{ field['text'] }}
                    </div>
                  </div>
                  <div v-else-if="field['type'] === 'heading'" class="mt-4 mb-1">
                    <div class="font-semibold text-lg py-0.5 pl-4 pr-1 text-center">
                      {{ field['text'] }}
                    </div>
                  </div>
                  <div v-else-if="field['type'] === 'file'" class="grid grid-cols-3 mb-1 relative">
                    <div class="flex justify-between">
                      <div class="font-semibold text-slate-700 py-0.5">
                        {{ field['text'] }}
                      </div>
                      <h3 class="text-xl text-red-700 pr-1" v-if="field['required']">*</h3>
                    </div>
                    <div class="col-span-2 flex flex-col">
                      <input type="file" class="border-2 border-slate-400 rounded-md px-3 py-0.5 w-full"
                        :accept="field['accept'] ? field['accept'] : null"
                        @input="(event) => { fieldValues[field['name']] = event.target.files; handleFiles(field['name'], event); validateInput(field['name']) }">
                      <div v-show="field['preview'] && !previewUrls[field['name']]"
                        class="h-[300px] w-[300px] mt-4 rounded-md bg-slate-200 flex items-center justify-center">
                        <h4 class="text-slate-500">Select the File to Preview</h4>
                      </div>
                      <img v-show="field['preview'] && previewUrls[field['name']]" :src="previewUrls[field['name']]"
                        alt="selected file" class="w-auto mt-4 h-[300px] rounded-md">
                    </div>
                  </div>
                  <div v-else class="grid grid-cols-3 mb-1 relative">
                    <div class="font-semibold text-slate-700 py-0.5 flex justify-between">
                      <h3>{{ field['text'] }}</h3>
                      <h3 class="text-xl text-red-700 pr-1" v-if="field['required']">*</h3>
                    </div>
                    <input class="col-span-2 border-2 border-slate-400 rounded-md px-3 hover:border-slate-700
                         py-0.5 hover:bg-slate-100 focus:bg-slate-200 disabled:border" :disabled="field['disabled']"
                      :type="field['type']" :value="fieldValues[field['name']]" :min="field['min']" :max="field['max']"
                      @input="(event) => { fieldValues[field['name']] = event.target.value; validateInput(field['name']) }">
                    <div class="absolute top-7 right-0 z-[1000] w-2/3 px-2 rounded-b-lg bg-red-500/80 text-rose-900"
                      v-if="errorMessages[field['name']]">
                      {{ errorMessages[field['name']] }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button v-if="successBtnText" type="button" :disabled="(allowSubmit && !submitted) ? false : 'disabled'"
                  class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold
                         text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:hover:bg-blue-200 disabled:bg-blue-200"
                  @click="success = true; submitted = true">
                  <span v-show="submitted && show">
                    <ArrowPathIcon class="w-5 animate-spin mr-2" />
                  </span>
                  <span>{{ successBtnText }}</span>
                </button>
                <button type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold
                         text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  @click="show = false; submitted = true" ref="cancelButtonRef">Cancel
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style scoped></style>