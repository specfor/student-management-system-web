import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { Tabs, Tab } from 'vue3-tabs-component'
import Popper from 'vue3-popper'

const app = createApp(App).component('tabs', Tabs).component('tab', Tab)

app.component('Popper', Popper)

app.use(createPinia())
app.use(router)

app.mount('#app')
