<script setup lang="ts">
import { getGeneratedBillData, sendBillPrintCommand, updateBillStatus } from '@/apiConnections/billPrint';
import { useAlertsStore } from '@/stores/alerts';
import { formatMoney } from '@/utils/money';
import { ArrowDownCircleIcon, ArrowUpCircleIcon, PrinterIcon, TrashIcon, MinusCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline';
import { ref } from 'vue';

const alertStore = useAlertsStore()

const expanded = ref(false)
const expandPrint = ref(false)
const disableBtns = ref(false)
const props = defineProps<{
    billId: number
    billValue: string
    status: "pending" | "cancelled" | "printed"
    studentId?: number
    studentCustomId: string
    stduentName: string
    paymentData?: Array<{
        paymentId: number
        courseName: string
        paymentFor: string
        amount: string
    }>
    hideButtons?: boolean
    expand?: boolean
}>()

if (props.expand)
    expanded.value = true

const emit = defineEmits<{
    actionComplete: [action: typeof props.status],
    removePayment: [paymentId: number]
}>()

async function setBillStatus(status: typeof props.status) {
    disableBtns.value = true

    let resp = await updateBillStatus(props.billId, status)

    if (resp.status != 'success') {
        return false;
    }
    emit('actionComplete', status)
    return true;
}

async function printBill(status: typeof props.status) {
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
        let statusSet = await setBillStatus(status)
        if (!statusSet) {
            error.occured = true
            error.header = 'Receipt status update failed.'
            error.body = "An error occured while updating the receipt status."
        }
    }

    if (error.occured)
        alertStore.insertAlert(error.header, error.body, 'error')

    disableBtns.value = false
}
</script>

<template>
    <div class="py-2 px-3 text-md bg-slate-100 rounded-md">
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
            <div class="flex relative text-white">
                <button class="flex items-center justify-center gap-2 bg-green-600 px-2 py-1 rounded-l-sm hover:cursor-pointer active:bg-green-800
                disabled:bg-green-300 disabled:hover:cursor-not-allowed w-full" @click="() => { printBill('printed') }"
                    :disabled="disableBtns">
                    <PrinterIcon class="w-6 h-6" />
                    <p>Print</p>
                </button>
                <button class="w-fit flex items-center justify-center bg-green-600 active:bg-green-800
                disabled:bg-green-300 disabled:hover:cursor-not-allowed px-2 cursor-pointer border-l"
                    :disabled="disableBtns">
                    <ChevronDownIcon class="w-5 h-5" @click="expandPrint = !expandPrint" v-show="!expandPrint" />
                    <ChevronUpIcon class="w-5 h-5" @click="expandPrint = !expandPrint" v-show="expandPrint" />
                </button>
                <div class="absolute right-0 top-8" v-show="expandPrint">
                    <button class="w-fit flex items-center justify-center bg-green-600 active:bg-green-800
                    disabled:bg-green-300 disabled:hover:cursor-not-allowed px-5 py-2 cursor-pointer border-l border-t"
                        :disabled="disableBtns" @click="() => { setBillStatus('printed') }">
                        Mark as Printed
                    </button>
                </div>
            </div>
            <button class="flex items-center justify-center gap-2 px-2 py-1 rounded-sm text-white hover:cursor-pointer bg-red-600 active:bg-red-800
                 disabled:bg-red-300 disabled:hover:cursor-not-allowed" @click="() => { printBill('cancelled') }"
                :disabled="disableBtns || props.status == 'printed' || props.status == 'cancelled'">
                <TrashIcon class="w-6 h-6" />
                <p>Cancel</p>
            </button>
        </div>


        <div v-show="expanded" v-if="paymentData">
            <div class="h-1 my-3 w-full bg-slate-400 rounded-full"></div>

            <div class="mx-2">
                <div class="grid grid-cols-[3fr_1fr_1fr_10px] font-semibold mb-2">
                    <p class="">Course</p>
                    <p class="justify-self-end">Paid For</p>
                    <p class="justify-self-end">Payment</p>
                    <p class="w-7"></p>
                </div>

                <div class="grid grid-cols-[3fr_1fr_1fr_10px] items-center"
                    v-for="(payment, index) in props.paymentData" :key="index">
                    <p class="">{{ payment.courseName }}</p>
                    <p class="justify-self-end">{{ payment.paymentFor }}</p>
                    <div class="flex justify-end items-center">
                        <p class="justify-self-end">{{ payment.amount }}</p>
                    </div>
                    <MinusCircleIcon @click="$emit('removePayment', payment.paymentId)"
                        class="w-5 h-5 text-red-800 rounded-full ml-2 hover:bg-red-200 cursor-pointer" />
                </div>
            </div>
        </div>
    </div>
</template>