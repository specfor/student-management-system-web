<script setup lang="ts">
import { getBills } from '@/apiConnections/billPrint';
import type { StudentPaymentBill } from '@/types/billTypes';
import { ref, watch, type Ref } from 'vue';
import BillCard from './BillCard.vue';
import { useglobalDataStore } from '@/stores/globalData';
import SelectionBox from '../primary/SelectionBox.vue';

const globalDataStore = useglobalDataStore()

const filterStatus: Ref<"pending" | "cancelled" | "printed"> = ref("pending")

let bills: Ref<Array<{
    id: number
    billValue: string
    status: "pending" | "cancelled" | "printed"
    studentId: number
    studentCustomId: string
    studentName: string
    paymentData: Array<{
        courseName: string
        paymentFor: string
        amount: string
    }>
}>> = ref([]);

async function loadBills() {
    let resp = await getBills(0, 15, { sort: { by: "id", direction: "desc" }, filters: { status: filterStatus.value } })
    if (resp.status == 'success') {
        bills.value = [];
        (resp.data.bills as StudentPaymentBill[]).forEach(async (bill) => {
            let student = await globalDataStore.findStudent(bill.student_id)
            let b = {
                id: bill.id,
                billValue: bill.total,
                status: bill.status,
                studentId: bill.student_id,
                studentCustomId: bill.student_custom_id,
                studentName: student ? student.name : "Deleted",
                paymentData: Object.values(bill.payment_data)
            }
            bills.value.push(b)
        })
    }
}

loadBills()

watch(filterStatus, loadBills)
</script>

<template>
    <div class="w-full h-full p-4">
        <h1 class="font-semibold text-xl text-center mb-5">Bill Print Queue</h1>

        <div class="mb-3">
            <p class="font-semibold text-lg">Filters</p>
            <div class="grid grid-cols-2 items-center ml-5">
                <div class="grid grid-cols-3 items-center">
                    <p>Status</p>
                    <SelectionBox :value="filterStatus" @input="(val) => { filterStatus = val }"
                        :options="[{ text: 'PENDING', value: 'pending' }, { text: 'CANCELLED', value: 'cancelled' }, { text: 'PRINTED', value: 'printed' }]"
                        class="col-span-2" />
                </div>
            </div>
        </div>

        <div v-show="bills.length == 0" class="border-2 border-white py-5 px-2">
            <h4>No Bills in queue to print.</h4>
        </div>

        <div v-show="bills.length != 0" class="">
            <div v-for="bill in bills" :key="bill.id">
                <BillCard :bill-id="bill.id" :bill-value="bill.billValue" :payment-data="bill.paymentData"
                    :student-id="bill.studentId" :student-custom-id="bill.studentCustomId"
                    :stduent-name="bill.studentName" :status="bill.status" class="mt-3" />

            </div>
        </div>
    </div>
</template>