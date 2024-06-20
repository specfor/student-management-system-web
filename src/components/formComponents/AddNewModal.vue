<script setup lang="ts">
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { storeToRefs } from 'pinia';
import { ArrowPathIcon, XCircleIcon } from '@heroicons/vue/24/solid';
import SelectionBox from '../primary/SelectionBox.vue';
import CheckBoxGroup from '../primary/CheckBoxGroup.vue';
import FileInput from '../primary/FileInput.vue';

const dataEntryForm = useDataEntryFormsStore()
const { show, submitted, allowSubmit, success, title, fields, fieldValues, successBtnText, errorMessages, generalErrorMessages } = storeToRefs(dataEntryForm)

function validateInput(name: string) {
  let anyError = false;
  for (const field of fields.value) {
    if ('name' in field)
      if (field.name === name && typeof fieldValues.value[name] !== 'number') {
        if (!fieldValues.value[name])
          if (field['required']) {
            errorMessages.value[name] = 'This field is required.'
            anyError = true
          }
          else
            errorMessages.value[name] = ''
        else if (field['validate']) {
          let err = field['validate'](fieldValues.value[name])
          if (err)
            anyError = true
          errorMessages.value[name] = err ?? ''
        }
        else
          errorMessages.value[name] = ''
      }
  }
  allowSubmit.value = !anyError;
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

                <div class="bg-red-300 px-3 py-1 mb-4 text-red-700"
                  v-if="Object.entries(generalErrorMessages).length !== 0">
                  <div v-for="err in Object.entries(generalErrorMessages)" :key="err[0]"
                    class="flex items-center justify-between">
                    <h4>{{ err[1] }}</h4>
                    <XCircleIcon class="w-5 h-5 hover:fill-white" @click="dataEntryForm.removeErrorMessage(err[0])" />
                  </div>
                </div>

                <div v-for="(field, index) in fields" :key="index">
                  <div v-if="field['type'] === 'select'" class="grid grid-cols-3 mb-1 relative">
                    <div class="flex justify-between">
                      <div class="font-semibold text-slate-700 py-0.5">
                        {{ field['text'] }}
                      </div>
                      <h3 class="text-xl text-red-700 pr-1" v-if="field['required']">*</h3>
                    </div>
                    <SelectionBox :options="field['options']" :disabled="field['disabled']"
                      :value="fieldValues[field['name']] as (string | boolean | number)"
                      @input="(val) => { fieldValues[field['name']] = val; validateInput(field['name']) }"
                      class="col-span-2" />
                    <div class="mb-2 mt-1 px-2 flex items-center justify-between col-span-3 bg-red-300 text-red-900"
                      v-if="errorMessages[field['name']]">
                      <h1>{{ errorMessages[field['name']] }}</h1>
                      <XCircleIcon class="w-5 h-5 hover:fill-white"
                        @click="dataEntryForm.removeErrorMessage(field['name'])" />
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
                      <CheckBoxGroup :options="field['options']"
                        @change="(val) => { fieldValues[field['name']] = val; validateInput(field['name']) }" />
                      <div class="mb-2 mt-1 px-2 flex items-center justify-between col-span-3 bg-red-300 text-red-900"
                        v-if="errorMessages[field['name']]">
                        <h1>{{ errorMessages[field['name']] }}</h1>
                        <XCircleIcon class="w-5 h-5 hover:fill-white"
                          @click="dataEntryForm.removeErrorMessage(field['name'])" />
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
                    <textarea :name="field['name']" cols="30" rows="3"
                      :value="fieldValues[field['name']] as (string | number)"
                      @input="(event: any) => { fieldValues[field['name']] = event.target.value; validateInput(field['name']) }"
                      :disabled="field['disabled']" class="col-span-2 border border-slate-400 rounded-md px-3 hover:border-slate-700
                               py-0.5 hover:bg-slate-100 focus:bg-slate-200 disabled:border"></textarea>
                    <div class="mb-2 mt-1 px-2 flex items-center justify-between col-span-3 bg-red-300 text-red-900"
                      v-if="errorMessages[field['name']]">
                      <h1>{{ errorMessages[field['name']] }}</h1>
                      <XCircleIcon class="w-5 h-5 hover:fill-white"
                        @click="dataEntryForm.removeErrorMessage(field['name'])" />
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
                    <div class="col-span-2 flex">
                      <FileInput @select="(val) => {
                        fieldValues[field['name']] = val; validateInput(field['name'])
                      }" :accept="field['accept']" :multiple="field['multiple']" />
                    </div>
                    <div class="mb-2 mt-1 px-2 flex items-center justify-between col-span-3 bg-red-300 text-red-900"
                      v-if="errorMessages[field['name']]">
                      <h1>{{ errorMessages[field['name']] }}</h1>
                      <XCircleIcon class="w-5 h-5 hover:fill-white"
                        @click="dataEntryForm.removeErrorMessage(field['name'])" />
                    </div>
                  </div>
                  <div v-else class="grid grid-cols-3 mb-1 relative">
                    <div class="font-semibold text-slate-700 py-0.5 flex justify-between">
                      <h3>{{ field['text'] }}</h3>
                      <h3 class="text-xl text-red-700 pr-1" v-if="'required' in field && field['required']">*</h3>
                    </div>
                    <input class="col-span-2 border border-slate-400 rounded-md px-3 hover:border-slate-700
                         py-0.5 hover:bg-slate-100 focus:bg-slate-200 disabled:border"
                      :disabled="'disabled' in field && field['disabled']" :type="field['type']"
                      :value="'name' in field ? fieldValues[field['name']] : ''"
                      :min="'min' in field ? field['min'] : undefined" :max="'max' in field ? field['max'] : undefined"
                      @input="(event: any) => { if ('name' in field) { fieldValues[field['name']] = event.target.value; validateInput(field['name']) } }">
                    <div class="mb-2 mt-1 px-2 flex items-center justify-between col-span-3 bg-red-300 text-red-900"
                      v-if="'name' in field && errorMessages[field['name']]">
                      <h1>{{ errorMessages[field['name']] }}</h1>
                      <XCircleIcon class="w-5 h-5 hover:fill-white"
                        @click="dataEntryForm.removeErrorMessage(field['name'])" />
                    </div>
                  </div>
                </div>
              </div>
              <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button v-if="successBtnText" type="button" :disabled="(allowSubmit && !submitted) ? false : true"
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