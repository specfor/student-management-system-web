import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import vClickOutside from 'click-outside-vue3'
import { Tabs, Tab } from 'vue3-tabs-component'

const app = createApp(App).component('tabs', Tabs).component('tab', Tab)

app.use(vClickOutside)
app.use(createPinia())
app.use(router)

app.mount('#app')
