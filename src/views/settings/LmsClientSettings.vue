<script setup lang="ts">
import { generateClientAuthToken, getClientAuthToken } from '@/apiConnections/client-software';
import CollapseCard from '@/components/minorUiComponents/CollapseCard.vue';
import LoadingCursor from '@/components/minorUiComponents/loadingCursor.vue';
import { ClipboardIcon } from '@heroicons/vue/24/outline';
import { ref, type Ref } from 'vue';

let authToken: Ref<null | string> = ref(null)

async function loadAuthToken() {
    let resp = await getClientAuthToken()
    if (resp.status === 'success') {
        authToken.value = resp.data.token
    }
}
loadAuthToken()

async function genNewToken() {
    let resp = await generateClientAuthToken()
    if (resp.status === 'success') {
        authToken.value = resp.data.token
    }
}

function copyToken() {
    navigator.clipboard.writeText(authToken.value!)
}
</script>

<template>
    <div class="bg-slate-200 w-full">
        <div class="container max-w-screen-xl my-10">
            <CollapseCard header="LMS Client Software" header-text-css="text-2xl font-semibold" header-css="my-2 mx-2">
                <div class="px-2">
                    <h1 class="text-xl  font-semibold">Auth Token</h1>

                    <p class="mt-6 text-slate-600">This token is used to authenticate client software. Generate a token.
                        Copy it and paste it in the "Config Auth" section in the client software.</p>

                    <div v-if="authToken === null" class="mt-5">
                        <LoadingCursor />
                    </div>
                    <div v-else class="mt-5 ml-10">
                        <div class="grid grid-cols-3 items-center mt-2 text-slate-700">
                            <p>Auth Token</p>
                            <div class="flex items-center col-span-2">
                                <input type="text"
                                    class="border border-slate-300 rounded-lg p-2 pl-4 pr-12 w-full disabled:bg-gray-200"
                                    :disabled="true" v-model="authToken" />
                                <ClipboardIcon
                                    class="min-w-8 min-h-8 h-8 w-8 p-1 -ml-10 bg-gray-400 text-white hover:bg-black rounded-md"
                                    @click="copyToken" />
                            </div>
                        </div>
                        <div class="flex justify-end">
                            <button @click="genNewToken"
                                class="border py-2 px-5 rounded-lg font-semibold mt-5 bg-blue-500 text-white hover:bg-blue-700 disabled:bg-blue-300">Generate
                                New</button>
                        </div>
                    </div>
                </div>
            </CollapseCard>
        </div>
    </div>
</template>