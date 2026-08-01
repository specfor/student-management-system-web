<script setup lang="ts">
import { getFingerprintRegStatus, setFingerprintMode, forceAssignRfid } from '@/apiConnections/fingerprint';
import { getStudentById } from '@/apiConnections/students';
import type { getFingerprintRegStatusResponse } from '@/types/fingerprint';
import { echo } from '@/echo';
import { onUnmounted, ref, onMounted } from 'vue';

let rfidRegSuccess = ref(false)
let errorMsg = ref("")
let isConflict = ref(false)
let conflictStudent = ref<any>(null)
let timeLeft = ref(60)
let timerInterval: any = null;

let { args } = defineProps<{ args: any }>()
let studentId = args
const emit = defineEmits(['close'])

async function checkStatus() {
    let resp = await getFingerprintRegStatus()
    if (resp.status == 'success') {
        let data: getFingerprintRegStatusResponse = resp.data
        if (data.status == 'completed' && data.msg == 'rfid-registered') {
            rfidRegSuccess.value = true
            echo.channel("general-ui").stopListening("GeneralUIStatusUpdated")
            clearInterval(timerInterval)
            setTimeout(() => {
                emit('close')
            }, 3000)
        }
        if (data.status == 'error') {
            if (data.msg.startsWith('rfid-conflict:')) {
                echo.channel("general-ui").stopListening("GeneralUIStatusUpdated")
                clearInterval(timerInterval)
                let otherId = parseInt(data.msg.split(':')[1])
                let stResp = await getStudentById(otherId)
                if (stResp.status == 'success') {
                    conflictStudent.value = stResp.data
                    isConflict.value = true
                }
            }
        }
    }
}

function startTimer() {
    clearInterval(timerInterval)
    timeLeft.value = 60
    timerInterval = setInterval(() => {
        if (timeLeft.value > 0) {
            timeLeft.value--
        } else {
            clearInterval(timerInterval)
            handleCancel()
        }
    }, 1000)
}

async function setToRegMode() {
    let resp = await setFingerprintMode('register-rfid', studentId)
    if (resp.status == 'success') {
        echo.channel("general-ui").listen("GeneralUIStatusUpdated", checkStatus)
        // Check once initially
        checkStatus()
        startTimer()
    }
}

async function handleForceAssign() {
    let resp = await forceAssignRfid()
    if (resp.status == 'success') {
        isConflict.value = false
        // Start listening again to wait for the completed status
        echo.channel("general-ui").listen("GeneralUIStatusUpdated", checkStatus)
        startTimer()
    } else {
        errorMsg.value = "Failed to forcefully reassign RFID."
    }
}

function handleCancel() {
    isConflict.value = false
    errorMsg.value = "Registration cancelled."
    clearInterval(timerInterval)
    setFingerprintMode('verify')
    emit('close')
}

setToRegMode()

onUnmounted(() => {
    echo.channel("general-ui").stopListening("GeneralUIStatusUpdated")
    clearInterval(timerInterval)
    setFingerprintMode('verify')
})
</script>

<template>
    <div class="flex justify-center items-center h-full w-[450px]">
        <div class="bg-white rounded-lg w-[450px] h-auto min-h-[300px] flex flex-col items-center pb-6 relative">
            
            <div class="absolute top-4 right-4 text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded text-sm font-bold border" v-if="!rfidRegSuccess && !isConflict">
                {{ timeLeft }}s
            </div>

            <div class="w-full h-20 flex justify-center items-center bg-gray-100 rounded-t-lg border-b">
                <h1 class="text-2xl font-bold">Register RFID</h1>
            </div>
            
            <div v-if="!isConflict" class="w-full flex-1 flex flex-col justify-center items-center mt-8">
                <p class="mb-5 text-lg font-medium text-gray-700">Place student RFID card on the scanner.</p>
                <p v-show="!rfidRegSuccess && errorMsg != ''" class="bg-red-200 text-red-800 px-5 py-2 mt-4 rounded">{{ errorMsg }}</p>
                <div v-show="rfidRegSuccess" class="flex flex-col items-center mt-4">
                    <p class="bg-green-200 text-green-900 px-5 py-2 font-bold rounded">Successfully registered the RFID.</p>
                </div>
            </div>

            <div v-else class="w-full flex-1 flex flex-col justify-start items-center mt-6 px-6">
                <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 w-full rounded mb-6">
                    <p class="font-bold mb-2">RFID Conflict Detected!</p>
                    <p class="text-sm">This RFID card is already assigned to another student:</p>
                    <div class="mt-2 bg-white bg-opacity-60 p-2 rounded">
                        <p><strong>Name:</strong> {{ conflictStudent?.name }}</p>
                        <p><strong>ID:</strong> {{ conflictStudent?.custom_id }}</p>
                    </div>
                </div>
                
                <p class="text-gray-700 font-medium text-center mb-6">Do you want to forcefully reassign this card to the current student?</p>
                
                <div class="flex gap-4 w-full">
                    <button @click="handleForceAssign" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors">
                        Yes, Reassign
                    </button>
                    <button @click="handleCancel" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
