<script setup>
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { useExtendablePopUpStore } from '@/stores/formManagers/extendablePopUp';
import { storeToRefs } from 'pinia';

const extendablePopUpStore = useExtendablePopUpStore();
let { htmlBody, show, componentObj, argsPassed } = storeToRefs(extendablePopUpStore)
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
                 sm:my-8 sm:w-full sm:max-w-lg lg:max-w-4xl">
              <div v-if="htmlBody !== ''" v-html="htmlBody"></div>
              <div v-else>
                <Component :is="componentObj" :args="argsPassed" @close-emit="show = false" />
              </div>
              <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold
                         text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  @click="show = false" ref="cancelButtonRef">Close
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>