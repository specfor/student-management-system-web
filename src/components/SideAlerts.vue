<script setup>
import { CheckCircleIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/vue/24/solid';
import { useAlertsStore } from "@/stores/alerts";

const alertStore = useAlertsStore()

function removeNotification(id) {
  alertStore.removeAlert(id)
}
</script>

<template>
  <div class="space-y-3 items-end flex flex-col">
    <TransitionGroup name="notifications">
      <div v-for="notification in alertStore.alerts" :key="notification['id']">
        <div v-if="notification['type'] === 'success'" class="flex p-2 bg-green-400/90 rounded-lg space-x-5 w-max">
          <CheckCircleIcon class="fill-green-800 w-[50px] h-[50px]" />
          <div>
            <div class="text-xl font-semibold text-green-900">{{ notification['title'] }}</div>
            <div class="text-sm text-green-900">{{ notification['message'] }}</div>
          </div>
          <XMarkIcon
            class="stroke-green-800 stroke-2 w-[25px] h-[25px] hover:border-2 hover:border-green-600 mt-1 justify-self-end"
            @click="removeNotification(notification['id'])" />
        </div>
        <div v-else-if="notification['type'] === 'error'" class="flex p-2 bg-rose-400/90 rounded-lg space-x-5 w-max">
          <ExclamationCircleIcon class="fill-rose-800 w-[50px] h-[50px]" />
          <div>
            <div class="text-xl font-semibold text-rose-900">{{ notification['title'] }}</div>
            <div class="text-sm text-rose-900">{{ notification['message'] }}</div>
          </div>
          <XMarkIcon
            class="stroke-rose-800 stroke-2 w-[25px] h-[25px] hover:border-2 hover:border-rose-600 mt-1 justify-self-end"
            @click="removeNotification(notification['id'])" />
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notifications-enter-active,
.notifications-move {
  @apply transition;
  @apply ease-out;
  @apply duration-500;
}

.notifications-leave-active {
  @apply transition;
  @apply absolute;
  @apply ease-in;
  @apply duration-500;
}

.notifications-enter-from,
.notifications-leave-to {
  @apply opacity-0;
  @apply translate-x-[100px];
}

.notifications-enter-to,
.notifications-leave-from {
  @apply opacity-100;
}
</style>