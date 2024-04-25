<script setup>
import { RouterView } from 'vue-router'
import PageHeader from './components/PageHeader.vue';
import SideMenu from './components/SideMenu.vue';
import { useAuthStore } from './stores/authorization';
import { onMounted } from 'vue';
import router from './router';
import { useSystemInfoStore } from './stores/systemInfo';
import SideAlerts from './components/SideAlerts.vue';

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
</template>

<style scoped></style>
