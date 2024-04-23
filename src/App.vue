<script setup>
import { RouterView } from 'vue-router'
import PageHeader from './components/PageHeader.vue';
import SideMenu from './components/SideMenu.vue';
</script>

<template>
  <div>
    <header>
      <PageHeader />
    </header>
    <div class="flex">
      <SideMenu />
      <RouterView />
    </div>
  </div>

</template>

<style scoped></style>
