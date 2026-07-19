<script setup lang="ts">
import { useSystemInfoStore } from '@/stores/systemInfo';
import { ref, watch } from 'vue';

import { useAuthStore } from '@/stores/authorization';
import router from '@/router';
import { useAlertsStore } from '@/stores/alerts';
import { storeToRefs } from 'pinia';
import { sendForgotPasswordRequest } from '@/apiConnections/auth';

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

let showForgotModal = ref(false)
let forgotEmail = ref("")
let sendingReset = ref(false)

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

async function sendResetLink() {
    if (!forgotEmail.value || !forgotEmail.value.includes('@')) {
        alertStore.insertAlert('Invalid Email', 'Please enter a valid email address.', 'error');
        return;
    }
    sendingReset.value = true;
    let resp = await sendForgotPasswordRequest(forgotEmail.value);
    sendingReset.value = false;
    if (resp.status === 'error') {
        let msg = resp.message ?? 'Failed to send password reset email.';
        if (typeof resp.data === 'object' && resp.data !== null) {
            msg = Object.values(resp.data).join(', ');
        }
        alertStore.insertAlert('Error', msg, 'error');
    } else {
        alertStore.insertAlert('Email Sent', resp.message ?? 'Password reset link sent successfully to your email.', 'success');
        showForgotModal.value = false;
        forgotEmail.value = "";
    }
}
</script>

<template>
    <div class="h-screen relative overflow-hidden bg-slate-50">
        <!-- Forgot Password Modal -->
        <div v-if="showForgotModal" class="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 flex flex-col gap-y-4 border border-slate-100 animate-fadeIn">
                <h3 class="text-2xl font-bold text-slate-800">Reset Password</h3>
                <p class="text-slate-600 text-sm">
                    Enter the email address associated with your account and we'll send you a secure link to reset your password.
                </p>
                <div class="flex flex-col gap-y-1 mt-2">
                    <label for="forgot-email" class="text-sm font-semibold text-slate-700">Email Address</label>
                    <input type="email" id="forgot-email" placeholder="name@example.com"
                        class="text-md py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        v-model="forgotEmail" @keyup.enter="sendResetLink">
                </div>
                <div class="flex justify-end gap-x-3 mt-4">
                    <button type="button" class="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                        @click="showForgotModal = false" :disabled="sendingReset">Cancel</button>
                    <button type="button" class="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all disabled:bg-blue-400 flex items-center gap-x-2 shadow-sm"
                        @click="sendResetLink" :disabled="sendingReset">
                        <span v-if="sendingReset" class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                        {{ sendingReset ? 'Sending...' : 'Send Reset Link' }}
                    </button>
                </div>
            </div>
        </div>

        <div class="h-full flex flex-col justify-center items-center">
            <img :src="logoUrl" alt="company-logo" class="h-[200px]">
            <h4 class="font-bold text-4xl text-slate-800">{{ sysInfo['company-name'] }}</h4>
            <div class="flex flex-col mt-14 gap-y-6 bg-slate-100 py-8 px-12 rounded-xl shadow-sm border border-slate-200 w-full max-w-md">
                <div class="flex flex-col gap-y-1">
                    <label for="email" class="text-md font-semibold text-slate-700">Email</label>
                    <input type="text" name="email" id="email" class="text-md py-2 px-3 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        v-model="email" @keyup.enter="login">
                </div>
                <div class="flex flex-col gap-y-1">
                    <div class="flex justify-between items-center">
                        <label for="password" class="text-md font-semibold text-slate-700">Password</label>
                        <button type="button" class="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline focus:outline-none"
                            @click="showForgotModal = true">Forgot Password?</button>
                    </div>
                    <input type="password" name="password" id="password"
                        class="text-md py-2 px-3 rounded-lg bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" v-model="password" @keyup.enter="login">
                </div>

                <button class="text-lg bg-slate-800 hover:bg-slate-900 text-white py-2.5 px-5 rounded-lg mt-2 font-semibold transition-all disabled:bg-slate-400 shadow-sm"
                    :disabled="logginIn" @click="login">{{ logginIn ? 'Signing in...' : 'Sign In' }}</button>
            </div>
        </div>
    </div>
</template>