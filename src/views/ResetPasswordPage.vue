<script setup lang="ts">
import { useSystemInfoStore } from '@/stores/systemInfo';
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAlertsStore } from '@/stores/alerts';
import { storeToRefs } from 'pinia';
import { sendResetPasswordRequest } from '@/apiConnections/auth';

const route = useRoute();
const router = useRouter();
const alertStore = useAlertsStore();

const systemInfoStore = useSystemInfoStore();
const { sysInfo } = storeToRefs(systemInfoStore);

let logoUrl = ref("/" + sysInfo.value['company-logo']);
watch(sysInfo, () => {
    logoUrl.value = "/" + sysInfo.value['company-logo'];
});

let email = ref("");
let token = ref("");
let password = ref("");
let confirmPassword = ref("");
let resetting = ref(false);

onMounted(() => {
    if (route.query.email) email.value = route.query.email as string;
    if (route.query.token) token.value = route.query.token as string;
});

async function handleReset() {
    if (!token.value || !email.value) {
        alertStore.insertAlert('Invalid Link', 'Missing email or reset token in URL. Please use the exact link from your email.', 'error');
        return;
    }
    if (!password.value || password.value.length < 8) {
        alertStore.insertAlert('Weak Password', 'Password must be at least 8 characters long.', 'error');
        return;
    }
    if (password.value !== confirmPassword.value) {
        alertStore.insertAlert('Password Mismatch', 'The confirmation password does not match.', 'error');
        return;
    }

    resetting.value = true;
    let resp = await sendResetPasswordRequest(email.value, token.value, password.value);
    resetting.value = false;

    if (resp.status === 'error') {
        let msg = resp.message ?? 'Failed to reset password.';
        if (typeof resp.data === 'object' && resp.data !== null) {
            msg = Object.values(resp.data).join(', ');
        }
        alertStore.insertAlert('Reset Failed', msg, 'error');
    } else {
        alertStore.insertAlert('Password Reset', resp.message ?? 'Your password has been successfully reset. You can now sign in.', 'success');
        router.replace('/login');
    }
}
</script>

<template>
    <div class="h-screen bg-slate-50">
        <div class="h-full flex flex-col justify-center items-center">
            <img :src="logoUrl" alt="company-logo" class="h-[180px]">
            <h4 class="font-bold text-3xl text-slate-800 mt-2">{{ sysInfo['company-name'] }}</h4>
            
            <div class="flex flex-col mt-8 gap-y-5 bg-white py-8 px-10 rounded-2xl shadow-md border border-slate-200 w-full max-w-md animate-fadeIn">
                <div class="text-center mb-1">
                    <h2 class="text-2xl font-bold text-slate-800">Set New Password</h2>
                    <p class="text-slate-500 text-sm mt-1">Please enter your new password below for <strong class="text-slate-700">{{ email }}</strong></p>
                </div>

                <div class="flex flex-col gap-y-1">
                    <label for="new-password" class="text-sm font-semibold text-slate-700">New Password</label>
                    <input type="password" id="new-password" placeholder="At least 8 characters"
                        class="text-md py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        v-model="password">
                </div>

                <div class="flex flex-col gap-y-1">
                    <label for="confirm-password" class="text-sm font-semibold text-slate-700">Confirm New Password</label>
                    <input type="password" id="confirm-password" placeholder="Re-type new password"
                        class="text-md py-2 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        v-model="confirmPassword" @keyup.enter="handleReset">
                </div>

                <button class="text-md bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-5 rounded-lg mt-3 font-semibold transition-all disabled:bg-blue-400 shadow-sm flex items-center justify-center gap-x-2"
                    :disabled="resetting" @click="handleReset">
                    <span v-if="resetting" class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    {{ resetting ? 'Resetting Password...' : 'Update Password' }}
                </button>

                <div class="text-center mt-2">
                    <router-link to="/login" class="text-sm text-slate-500 hover:text-slate-700 font-medium hover:underline">
                        Back to Sign In
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>
