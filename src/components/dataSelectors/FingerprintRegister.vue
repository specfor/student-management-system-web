<script setup lang="ts">
import { getFingerprintRegStatus, setFingerprintMode } from '@/apiConnections/fingerprint';
import type { getFingerprintRegStatusResponse } from '@/types/fingerprint';
import { onBeforeUnmount, onUnmounted, ref } from 'vue';

let finImage = ref("")
let finRegSuccess = ref(false)
let actionText = ref('Press finger on sensor 3 times.');
let errorMsg = ref("")

let { args } = defineProps<{ args: any }>()
let studentId = args
let checkerId = 0

async function setToRegMode() {
    let resp = await setFingerprintMode('register', studentId)
    if (resp.status == 'success')
        checkerId = setInterval(async () => {
            let resp = await getFingerprintRegStatus()
            if (resp.status == 'success') {
                let data: getFingerprintRegStatusResponse = resp.data
                if (data.status == 'completed') {
                    finRegSuccess.value = true
                    finImage.value = URL.createObjectURL(base64ToBlob(data.image, 'image/octet-stream'))
                    clearInterval(checkerId)
                }
                if (data.status == 'ongoing') {
                    errorMsg.value = ""
                    actionText.value = "Press finger on sensor " + (3 - Number(data.msg.split(' ')[1])) + " more times."
                }
                if (data.status == 'error') {
                    if (data.msg == 'already-registered')
                        errorMsg.value = "Fingerprint is already registered."
                    else if (data.msg == 'not-same-finger') {
                        errorMsg.value = "Place the same finger."
                    }
                }
            }
        }, 600)
}
setToRegMode()

onUnmounted(() => {
    setFingerprintMode('verify')
})
function base64ToBlob(base64: string, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}


onBeforeUnmount(() => {
    clearInterval(checkerId)
})
</script>

<template>
    <div class="flex justify-center items-center h-full w-[400px]">
        <div class="bg-white rounded-lg w-[400px] h-[500px] flex flex-col items-center">
            <div class="w-full h-20 flex justify-center items-center">
                <h1 class="text-2xl font-bold">Register Fingerprint</h1>
            </div>
            <div class="w-full h-20 flex flex-col justify-center items-center">
                <p class="mb-5">Place student finger on the scanner.</p>
                <p v-show="!finRegSuccess" class="bg-red-300 text-red-800 px-5">{{ errorMsg }}</p>
                <p v-show="finRegSuccess" class="bg-green-300 text-green-800 px-5">Successfully registered the
                    fingerprint.</p>
            </div>
            <div>
                <div v-show="finImage == ''"
                    class="w-60 h-60 border-2 rounded-md flex flex-col items-center justify-evenly text-center">

                    <h6>{{ actionText }}</h6>
                </div>
                <img v-show="finImage != ''" :src="finImage" alt="fingerprint" class="w-60 h-60 border-2 rounded-md" />
            </div>
            <p class="text-sm mt-10">Fingerprint can be added later.</p>
        </div>
    </div>

</template>