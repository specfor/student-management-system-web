<script setup>
import { RouterView } from 'vue-router'
import PageHeader from './components/PageHeader.vue';
import SideMenu from './components/SideMenu.vue';
import { useAuthStore } from './stores/authorization';
import { onMounted, ref } from 'vue';
import router from './router';
import { useSystemInfoStore } from './stores/systemInfo';
import SideAlerts from './components/SideAlerts.vue';
import AddNewModal from './components/formComponents/AddNewModal.vue';
import ConfirmationModal from './components/formComponents/ConfirmationModal.vue';
import ExtendablePopUp from './components/formComponents/ExtendablePopUp.vue';
import LoadingScreen from '@/views/LoadingScreen.vue'

const authStore = useAuthStore()
useSystemInfoStore()
const loading = ref(true)

onMounted(async () => {
  await authStore.checkLoggedIn()
  if (authStore.LoggedIn) {
    if (router.currentRoute.value['path'] === '/login')
      router.push('/')
  } else {
    router.push('/login')
  }
  loading.value = false
})

</script>

<template>
  <LoadingScreen v-if="loading" />

  <div class="TextNotCopy">
    <div v-if="authStore.LoggedIn" class="h-dvh flex flex-col">
      <header>
        <PageHeader />
      </header>
      <div class="flex flex-1 mt-14">
        <div class="relative w-[200px] h-full">
          <SideMenu class="fixed" />
        </div>
        <RouterView class="pt-8" />
      </div>
    </div>
    <div v-if="!authStore.LoggedIn">
      <RouterView />
    </div>
    <SideAlerts class="fixed right-4 top-14 z-30" />
    <AddNewModal />
    <ConfirmationModal />
    <ExtendablePopUp />
  </div>
</template>

<style scoped>
.TextNotCopy {
  -webkit-touch-callout: none;
  /* iOS Safari */
  -webkit-user-select: none;
  /* Safari */
  -khtml-user-select: none;
  /* Konqueror HTML */
  -moz-user-select: none;
  /* Old versions of Firefox */
  -ms-user-select: none;
  /* Internet Explorer/Edge */
  user-select: none;
  /* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox */
}
</style>
