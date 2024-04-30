<script setup>
import { RouterView } from 'vue-router'
import PageHeader from './components/PageHeader.vue';
import SideMenu from './components/SideMenu.vue';
import { useAuthStore } from './stores/authorization';
import { onMounted } from 'vue';
import router from './router';
import { useSystemInfoStore } from './stores/systemInfo';
import SideAlerts from './components/SideAlerts.vue';
import AddNewModal from './components/formComponents/AddNewModal.vue';
import ConfirmationModal from './components/formComponents/ConfirmationModal.vue';

const authStore = useAuthStore()
useSystemInfoStore()

onMounted(async () => {
  await authStore.checkLoggedIn()
  if (authStore.LoggedIn) {
    if (router.currentRoute.value['path'] === '/login')
      router.push('/')
  }

  if (!authStore.LoggedIn) {
    router.push('/login')
  }
})

</script>

<template>
  <div class="TextNotCopy">
    <div v-if="authStore.LoggedIn" class="h-dvh flex flex-col">
      <header>
        <PageHeader />
      </header>
      <div class="flex flex-1">
        <SideMenu />
        <RouterView class="pt-8" />
      </div>
    </div>
    <div v-if="!authStore.LoggedIn">
      <RouterView />
    </div>
    <SideAlerts class="fixed right-4 top-14 z-30" />
    <AddNewModal />
    <ConfirmationModal />
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
