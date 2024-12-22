<script setup lang="ts">
import { formatMoney } from '@/utils/money';
import { ArrowDownCircleIcon, ArrowUpCircleIcon, PrinterIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { ref } from 'vue';

let expanded = ref(false)

const props = defineProps<{
    billId: number
    billValue: string
    status: "pending" | "cancelled" | "printed"
    studentId: number
    studentCustomId: string
    stduentName: string
    paymentData: Array<{
        courseName: string
        paymentFor: string
        amount: string
    }>
}>()
</script>

<template>
    <div class="border-2 py-2 px-3 border-white text-md bg-slate-100 rounded-md">
        <div class="grid grid-cols-2">
            <div class="flex">
                <p class="font-semibold mr-4">Bill Value</p>
                <p class="text-blue-600 font-bold">LKR {{ formatMoney(props.billValue) }}</p>
            </div>
            <div class="flex">
                <p class="font-semibold mr-4">Status</p>
                <p class="font-bold px-3"
                    :class="props.status == 'printed' ? 'text-green-500' : (props.status == 'pending' ? 'text-yellow-500' : 'text-red-500')">
                    {{ props.status.toUpperCase() }}</p>
            </div>
        </div>
        <div class="grid grid-cols-2">
            <div class="flex">
                <p class="font-semibold mr-4">Bill ID</p>
                <p class="text-slate-700">{{ props.billId }}</p>
            </div>
            <div class="flex">
                <p class="font-semibold mr-4">Student ID</p>
                <p class="text-slate-700">{{ props.studentCustomId }}</p>
            </div>
        </div>
        <div class="flex">
            <p class="font-semibold mr-4">Student Name</p>
            <p class="text-slate-700">{{ props.stduentName }}</p>
        </div>

        <div class="grid grid-cols-3 gap-x-5 mt-2 text-sm">
            <div v-show="!expanded" @click="expanded = !expanded"
                class="flex items-center justify-center gap-2 bg-blue-600 px-2 py-1 rounded-sm text-white hover:cursor-pointer active:bg-blue-800">
                <ArrowDownCircleIcon class="w-6 h-6" />
                <p>Expand</p>
            </div>
            <div v-show="expanded" @click="expanded = !expanded"
                class="flex items-center justify-center gap-2 bg-blue-600 px-2 py-1 rounded-sm text-white hover:cursor-pointer active:bg-blue-800">
                <ArrowUpCircleIcon class="w-6 h-6" />
                <p>Collapse</p>
            </div>
            <div
                class="flex items-center justify-center gap-2 bg-green-600 px-2 py-1 rounded-sm text-white hover:cursor-pointer active:bg-green-800">
                <PrinterIcon class="w-6 h-6" />
                <p>Print</p>
            </div>
            <div :class="props.status == 'cancelled' ? 'bg-red-300 hover:cursor-not-allowed active:bg-red-300' : 'bg-red-600'"
                class="flex items-center justify-center gap-2 px-2 py-1 rounded-sm text-white hover:cursor-pointer active:bg-red-800">
                <TrashIcon class="w-6 h-6" />
                <p>Cancel</p>
            </div>
        </div>


        <div v-show="expanded">
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