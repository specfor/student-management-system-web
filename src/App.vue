<script setup lang="ts">
import { RouterView } from 'vue-router'
import PageHeader from './components/PageHeader.vue';
import SideMenu from './components/SideMenu.vue';
import { useAuthStore } from './stores/authorization';
import { ref } from 'vue';
import router from './router';
import { useSystemInfoStore } from './stores/systemInfo';
import SideAlerts from './components/SideAlerts.vue';
import AddNewModal from './components/formComponents/AddNewModal.vue';
import ConfirmationModal from './components/formComponents/ConfirmationModal.vue';
import ExtendablePopUp from './components/formComponents/ExtendablePopUp.vue';
import LoadingScreen from '@/views/LoadingScreen.vue'
import RightMenu from './components/RightMenu.vue';

const authStore = useAuthStore()
useSystemInfoStore()
const loading = ref(true)

async function checkAppUpdates() {
  let resp = await fetch('/build')
  let data = (await resp.text()).trim()

  let cachedVal = localStorage.getItem('appBuild')
  if (cachedVal === null || cachedVal !== data) {
    localStorage.setItem('appBuild', data)
  }
  if (cachedVal !== data)
    location.reload()
}
checkAppUpdates()

async function checkLogged() {
  await authStore.checkLoggedIn()
  if (authStore.LoggedIn) {
    if (router.currentRoute.value['path'] === '/login')
      router.push('/')
  } else {
    router.push('/login')
  }
  loading.value = false
}

checkLogged()

</script>

<template>
  <LoadingScreen v-if="loading" />

  <div v-else>
    <div v-if="authStore.LoggedIn && router.currentRoute.value.path !== '/client-general-ui'"
      class="h-dvh flex flex-col">
      <header class="TextNotCopy">
        <PageHeader />
      </header>
      <div class=" h-full flex flex-1 mt-14">
        <SideMenu class="TextNotCopy" />
        <RouterView class="pt-8" />
      </div>
      <RightMenu />
    </div>
    <div v-if="!authStore.LoggedIn || router.currentRoute.value.path === '/client-general-ui'">
      <RouterView />
    </div>
    <SideAlerts class=" fixed right-4 top-20 z-30" />
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
