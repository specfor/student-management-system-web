<script setup lang="ts">
import { getBills } from '@/apiConnections/billPrint';
import type { StudentPaymentBill } from '@/types/billTypes';
import { ref, watch, type Ref } from 'vue';
import BillCard from './BillCard.vue';
import { useglobalDataStore } from '@/stores/globalData';
import SelectionBox from '../primary/SelectionBox.vue';
import LoadingCursor from '../minorUiComponents/loadingCursor.vue';
import PopUpPlaceholder from '../popUpPlaceholder.vue';
import BillPaymentManager from './BillPaymentManager.vue';

const globalDataStore = useglobalDataStore()

const filterStatus: Ref<"pending" | "cancelled" | "printed"> = ref("pending")
const loadingBills = ref(false)

type BillPaymentManagerProps = InstanceType<typeof BillPaymentManager>['$props'];
const selectedPaymentToRemove: Ref<BillPaymentManagerProps['payment']> = ref({ amount: '', course: "", student: '', id: 0, billId: 0 });
const showBillPaymentManager = ref(false)

let bills: Ref<Array<{
    id: number
    billValue: string
    status: "pending" | "cancelled" | "printed"
    studentId: number
    studentCustomId: string
    studentName: string
    paymentData: Array<{
        paymentId: number
        courseName: string
        paymentFor: string
        amount: string
    }>
}>> = ref([]);

let shownBills: typeof bills = ref([])

async function loadBills() {
    loadingBills.value = true
    let resp = await getBills(0, 15, { sort: { by: "updated_at", direction: "desc" }, filters: { status: filterStatus.value } })
    if (resp.status == 'success') {
        bills.value = [];
        await Promise.all((resp.data.bills as StudentPaymentBill[]).map(async (bill) => {
            let student = await globalDataStore.findStudent(bill.student_id)

            let b: typeof bills.value[0] = {
                id: bill.id,
                billValue: bill.total,
                status: bill.status,
                studentId: bill.student_id,
                studentCustomId: bill.student_custom_id,
                studentName: student ? student.name : "Deleted",
                paymentData: []
            }
            Object.entries(bill.payment_data).forEach(payment => {
                b.paymentData.push({ paymentId: Number(payment[0]), ...payment[1] })
            })
            bills.value.push(b)
        }))
        shownBills.value = bills.value.slice(0, 1)
    }
    showingAllBills.value = false
    loadingBills.value = false
}

loadBills()
globalDataStore.insertHook('refresh-receipt-list', loadBills)

watch(filterStatus, loadBills)

function removeBill(id: number, status: typeof bills.value[0]['status']) {
    if (status != filterStatus.value) {
        bills.value = bills.value.filter(b => b.id != id)
        shownBills.value = shownBills.value.filter(b => b.id != id)
    }
}

let showingAllBills = ref(false)

function flipShowAllBills() {
    if (!showingAllBills.value)
        shownBills.value = bills.value
    else
        shownBills.value = bills.value.slice(0, 1)

    showingAllBills.value = !showingAllBills.value
}

function showRemovePayment(paymentId: number) {
    bills.value.forEach((bill) => {
        let p = bill.paymentData.find(payment => payment.paymentId == paymentId)
        if (p) {
            selectedPaymentToRemove.value = { id: p.paymentId, billId: bill.id, amount: p.amount, course: p.courseName, student: bill.studentName }
            showBillPaymentManager.value = true;
            return
        }
    });
}
</script>

<template>
    <div class="w-full h-full max-h-screen p-4">
        <h1 class="font-semibold text-xl text-center mb-5">Bill Print Queue</h1>

        <div class="mb-3">
            <p class="font-semibold text-lg">Filters</p>
            <div class="grid grid-cols-2 gap-x-5 items-center ml-5">
                <div class="grid grid-cols-3 items-center">
                    <p>Status</p>
                    <SelectionBox :value="filterStatus" @input="(val) => { filterStatus = val }"
                        :options="[{ text: 'PENDING', value: 'pending' }, { text: 'CANCELLED', value: 'cancelled' }, { text: 'PRINTED', value: 'printed' }]"
                        class="col-span-2" />
                </div>
                <button @click="loadBills"
                    class="font-semibold bg-stone-600 hover:bg-stone-800 w-fit px-4 justify-self-end py-1 text-white rounded-md">Refresh</button>
            </div>
        </div>

        <div class="mt-20" v-show="loadingBills">
            <LoadingCursor />
        </div>

        <div v-show="bills.length == 0 && !loadingBills" class="border-2 border-white py-5 px-2">
            <h4>No Bills in queue to print.</h4>
        </div>

        <div v-show="shownBills.length !== 0 && !loadingBills" class="overflow-y-auto h-[80%]">
            <template v-for="(bill, index) in shownBills" :key="bill.id">
                <BillCard :bill-id="bill.id" :bill-value="bill.billValue" :payment-data="bill.paymentData"
                    :student-id="bill.studentId" :student-custom-id="bill.studentCustomId"
                    :stduent-name="bill.studentName" :status="bill.status" class="mt-3"
                    @action-complete="(status) => { removeBill(bill.id, status) }" :expand="index == 0"
                    @remove-payment="showRemovePayment" />

                <div class="flex justify-center" v-show="index == 0">
                    <button @click="flipShowAllBills" class="my-2 border px-3 bg-gray-400 text-black">{{ showingAllBills
                        ? 'Hide' :
                        'Show All'
                        }}</button>
                </div>
            </template>
        </div>
    </div>

    <PopUpPlaceholder :show="showBillPaymentManager">
        <BillPaymentManager :payment="selectedPaymentToRemove" @close="showBillPaymentManager = false"
            @close-and-refresh-bills="() => { showBillPaymentManager = false; loadBills() }" />
    </PopUpPlaceholder>
</template>