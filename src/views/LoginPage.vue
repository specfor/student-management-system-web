<script setup>
import { useSystemInfoStore } from '@/stores/systemInfo';
import { computed, ref, watch } from 'vue';

import { useAuthStore } from '@/stores/authorization';
import router from '@/router';
import { useAlertsStore } from '@/stores/alerts';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const alertStore = useAlertsStore();

const systemInfoStore = useSystemInfoStore()
const { sysInfo } = storeToRefs(systemInfoStore)

let logoUrl = ref("/" + sysInfo.value['company-logo'])

watch(sysInfo, () => {
    logoUrl.value = "/" + sysInfo.value['company-logo']
})

let email = ref("")
let password = ref("")
let logginIn = ref(false)

async function login() {
    logginIn.value = true
    let resp = await authStore.login(email.value, password.value)
    if (resp.success === false)
        alertStore.insertAlert('An error occured trying to sign in.', resp.message, 'error')
    else {
        router.replace('/')
    }
    logginIn.value = false
}
</script>

<template>
    <div class="h-screen">
        <div class="h-full flex flex-col justify-center items-center">
            <img :src="logoUrl" alt="company-logo" class="h-[200px]">
            <h4 class="font-bold text-4xl">{{ sysInfo['company-name'] }}</h4>
            <div class="flex flex-col mt-14 gap-y-6 bg-slate-100 py-8 px-12 rounded-lg">
                <div class="grid grid-cols-2">
                    <label for="email" class="text-xl justify-self-end mr-4">Email</label>
                    <input type="text" name="email" id="email" class="text-md py-1 px-3 rounded-md bg-white border"
                        v-model="email">
                </div>
                <div class="grid grid-cols-2">
                    <label for="password" class="text-xl justify-self-end mr-4">Password</label>
                    <input type="password" name="password" id="password"
                        class="text-md py-1 px-3 rounded-md bg-white border" v-model="password">
                </div>

                <button class="text-xl bg-slate-300 py-2 px-5 rounded-full mt-4 font-semibold disabled:bg-slate-200"
                    :disabled="logginIn" @click="login">Sign In</button>
            </div>
        </div>
    </div>
</template>