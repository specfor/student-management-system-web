<script setup>
import { useSystemInfoStore } from '@/stores/systemInfo';
import { ref } from 'vue';

import { useAuthStore } from '@/stores/authorization';
import router from '@/router';

const authStore = useAuthStore();

const systemInfoStore = useSystemInfoStore()
const systemData = systemInfoStore.getInfo()

let logoUrl = "/" + systemData['company-logo']

let email = ref("")
let password = ref("")
let logginIn = ref(false)

async function login() {
    logginIn.value = true
    let resp = await authStore.login(email.value, password.value)
    if (resp.success === false)
        console.log(resp.message);
    else {
        router.replace('/')
        console.log(resp.message);
    }
    logginIn.value = false
}
</script>

<template>
    <div class="h-screen">
        <div class="h-full flex flex-col justify-center items-center">
            <img :src="logoUrl" alt="company-logo" class="h-[200px]">
            <h4 class="font-bold text-4xl">{{ systemData['company-name'] }}</h4>
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