<script setup lang="ts">
import { getGeneratedBillData, sendBillPrintCommand, updateBillStatus } from '@/apiConnections/billPrint';
import { useAlertsStore } from '@/stores/alerts';
import { formatMoney } from '@/utils/money';
import { ArrowDownCircleIcon, ArrowUpCircleIcon, PrinterIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { ref } from 'vue';

const alertStore = useAlertsStore()

const expanded = ref(false)
const disableBtns = ref(false)
const props = defineProps<{
    billId: number
    billValue: string
    status: "pending" | "cancelled" | "printed"
    studentId?: number
    studentCustomId: string
    stduentName: string
    paymentData?: Array<{
        courseName: string
        paymentFor: string
        amount: string
    }>
    hideButtons?: boolean
}>()

const emit = defineEmits<{
    actionComplete: [action: typeof props.status]
}>()

async function setBillStatus(status: typeof props.status) {
    disableBtns.value = true
    let error = { occured: false, header: "", body: "" };

    if (status == 'printed') {
        let bResp = await getGeneratedBillData(props.billId)
        if (bResp.status != 'success') {
            error.occured = true
            error.header = "Receipt generaiton Failed"
            error.body = bResp.message
        } else {
            let pResp = await sendBillPrintCommand(bResp.data.bill)
            if (pResp.status == 'success') {
                if (pResp.data.code != 0) {
                    error.occured = true
                    error.header = 'Error printing receipt'
                    error.body = pResp.data.message
                }
            }
            else {
                error.occured = true
                error.header = "Printer not found"
                error.body = "No connection to the Printer"
            }
        }

    }

    if (!error.occured) {
        let resp = await updateBillStatus(props.billId, status)

        if (resp.status != 'success') {
            error.header = 'Receipt status update failed.'
            error.body = resp.message
        }
        emit('actionComplete', status)
    }

    if (error.occured)
        alertStore.insertAlert(error.header, error.body, 'error')

    disableBtns.value = false
}
</script>

<template>
    <div class="border-2 py-2 px-3 border-white text-md bg-slate-100 rounded-md">
        <div class="grid grid-cols-5">
            <div class="flex col-span-3">
                <p class="font-semibold mr-4">Receipt Value</p>
                <p class="text-blue-600 font-bold">LKR {{ formatMoney(props.billValue) }}</p>
            </div>
            <div class="flex col-span-2">
                <p class="font-semibold mr-4">Status</p>
                <p class="font-bold px-3"
                    :class="props.status == 'printed' ? 'text-green-500' : (props.status == 'pending' ? 'text-yellow-500' : 'text-red-500')">
                    {{ props.status.toUpperCase() }}</p>
            </div>
        </div>
        <div class="grid grid-cols-5">
            <div class="flex col-span-3">
                <p class="font-semibold mr-4">Receipt ID</p>
                <p class="text-slate-700">{{ props.billId }}</p>
            </div>
            <div class="flex col-span-2">
                <p class="font-semibold mr-4">Student ID</p>
                <p class="text-slate-700">{{ props.studentCustomId }}</p>
            </div>
        </div>
        <div class="flex">
            <p class="font-semibold mr-4">Student Name</p>
            <p class="text-slate-700">{{ props.stduentName }}</p>
        </div>

        <div class="grid grid-cols-3 gap-x-5 mt-2 text-sm" v-if="!hideButtons">
            <button v-show="!expanded" @click="expanded = !expanded"
                class="flex items-center justify-center gap-2 bg-blue-600 px-2 py-1 rounded-sm text-white hover:cursor-pointer active:bg-blue-800">
                <ArrowDownCircleIcon class="w-6 h-6" />
                <p>Expand</p>
            </button>
            <button v-show="expanded" @click="expanded = !expanded"
                class="flex items-center justify-center gap-2 bg-blue-600 px-2 py-1 rounded-sm text-white hover:cursor-pointer active:bg-blue-800">
                <ArrowUpCircleIcon class="w-6 h-6" />
                <p>Collapse</p>
            </button>
            <button class="flex items-center justify-center gap-2 bg-green-600 px-2 py-1 rounded-sm text-white hover:cursor-pointer active:bg-green-800
                 disabled:bg-green-300 disabled:hover:cursor-not-allowed" @click="() => { setBillStatus('printed') }"
                :disabled="disableBtns">
                <PrinterIcon class="w-6 h-6" />
                <p>Print</p>
            </button>
            <button class="flex items-center justify-center gap-2 px-2 py-1 rounded-sm text-white hover:cursor-pointer bg-red-600 active:bg-red-800
                 disabled:bg-red-300 disabled:hover:cursor-not-allowed" @click="() => { setBillStatus('cancelled') }"
                :disabled="disableBtns || props.status == 'printed' || props.status == 'cancelled'">
                <TrashIcon class="w-6 h-6" />
                <p>Cancel</p>
            </button>
        </div>


        <div v-show="expanded" v-if="paymentData">
            <div class="h-1 my-3 w-full bg-slate-400 rounded-full"></div>

            <div class="mx-5">
                <div class="grid grid-cols-5 font-semibold mb-2">
                    <p class="col-span-3">Course</p>
                    <p class="justify-self-end">Paid For</p>
                    <p class="justify-self-end">Payment</p>
                </div>

                <div class="grid grid-cols-5" v-for="(payment, index) in props.paymentData" :key="index">
                    <p class="col-span-3">{{ payment.courseName }}</p>
                    <p class="justify-self-end">{{ payment.paymentFor }}</p>
                    <p class="justify-self-end">{{ payment.amount }}</p>
                </div>
            </div>
        </div>
    </div>
</template>