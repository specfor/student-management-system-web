<script setup lang="ts">
import { getInstructorMonthyPaymentCalculations } from '@/apiConnections/analytics';
import InstructorSelector from '@/components/dataSelectors/InstructorSelector.vue';
import SelectionBox from '@/components/primary/SelectionBox.vue';
import type { TableColumns, tableRowItem } from '@/components/TableComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import type { AnalyticsInstructorMonthlyPaymentCalculation, AnalyticsPaymentRecord } from '@/types/analytics';
import { formatMoney } from '@/utils/money';
import { CalculatorIcon, StarIcon } from '@heroicons/vue/24/outline';
import { ref, watch, type Ref } from 'vue';

const alertStore = useAlertsStore()

const tableColumns: TableColumns[] = [
    { label: 'Student' }, { label: 'Attendance' }, { label: 'Paid Amount' },
    { label: "Instructor's Share" }, { label: 'Class Share' }]
const tableColumnsForOtherMonthPayments: TableColumns[] = [
    { label: 'Student' }, { label: 'Attendance' }, { label: 'Paid Month' }, { label: 'Paid Amount' },
    { label: "Instructor's Share" }, { label: 'Class Share' }]

let selectedInstructorId = ref(0)
let selectedMonth = ref('')
let selectedPaymentsBy = ref('paid_month')

watch(selectedInstructorId, () => {
    loadCalculations()
})

watch(selectedMonth, () => {
    loadCalculations()
})

watch(selectedPaymentsBy, () => {
    loadCalculations()
})

let summary: Ref<AnalyticsInstructorMonthlyPaymentCalculation['overall'] | null> = ref(null)
let forSelectedMonthPayments: Ref<AnalyticsPaymentRecord[] | null> = ref(null)
let otherMonthPayments: Ref<AnalyticsPaymentRecord[] | null> = ref(null)
let relationData: Ref<AnalyticsInstructorMonthlyPaymentCalculation['relation_data'] | null> = ref(null)

let selectedMonthTableRows: Ref<{ courseId: number, rows: tableRowItem[][] }[]> = ref([])
let otherMonthsTableRows: Ref<{ courseId: number, rows: tableRowItem[][] }[]> = ref([])

async function loadCalculations() {
    if (selectedMonth.value === '' || selectedInstructorId.value === 0 || selectedPaymentsBy.value === '')
        return

    let date = selectedMonth.value.split('-')
    let resp = await getInstructorMonthyPaymentCalculations(selectedInstructorId.value, Number(date[0]), Number(date[1]),
        selectedPaymentsBy.value as 'paid_month' | 'marked_month')
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured while loading data.', resp.message, 'error')
        return
    }

    let data: AnalyticsInstructorMonthlyPaymentCalculation = resp.data

    summary.value = data.overall
    forSelectedMonthPayments.value = data.for_selected_month
    otherMonthPayments.value = data.for_other_months
    relationData.value = data.relation_data

    selectedMonthTableRows.value = []
    otherMonthsTableRows.value = []

    data.for_selected_month.forEach(coursePayments => {
        let rows: tableRowItem[][] = []
        coursePayments.records.forEach(record => {
            let studentData = relationData.value?.students.find(s => s.id === record.student_id)
            let studentName = studentData ? (studentData.custom_id ? studentData.custom_id + ' - ' : '') + studentData.name : 'DELETED'
            rows.push([studentName, record.attended_day_count + ' days', 'LKR ' + record.payment_amount,
                record.instructor_share.currency + ' ' + record.instructor_share.amount, record.class_share.currency + ' ' + record.class_share.amount,])
        });
        selectedMonthTableRows.value.push({
            courseId: coursePayments.course_id,
            rows: rows
        })
    });

    data.for_other_months.forEach(coursePayments => {
        let rows: tableRowItem[][] = []
        coursePayments.records.forEach(record => {
            let studentData = relationData.value?.students.find(s => s.id === record.student_id)
            let studentName = studentData ? (studentData.custom_id ? studentData.custom_id + ' - ' : '') + studentData.name : 'DELETED'
            rows.push([studentName, record.attended_day_count + ' days', record.month, 'LKR ' + record.payment_amount,
                record.instructor_share.currency + ' ' + record.instructor_share.amount, record.class_share.currency + ' ' + record.class_share.amount,])
        });
        otherMonthsTableRows.value.push({
            courseId: coursePayments.course_id,
            rows: rows
        })
    });
}
</script>

<template>
    <div class="container">
        <h1 class="font-semibold text-3xl mb-16">Instructor Monthly Payment Calculation</h1>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <InstructorSelector v-model:insturctor-id="selectedInstructorId" />
            <div class="flex items-center">
                <p class="font-semibold mr-10">Select Month</p>
                <input type="month" class="border px-4 py-1 rounded-md border-slate-400" v-model="selectedMonth" />
            </div>
            <div class="flex items-center">
                <p class="font-semibold mr-10">Limit Payments By</p>
                <SelectionBox class="w-[300px]"
                    :options="[{ text: 'Payment Marked Month', value: 'marked_month' }, { text: 'Payment Paid Month', value: 'paid_month' }]"
                    :value="selectedPaymentsBy" @input="(val) => { selectedPaymentsBy = val }" />
            </div>
        </div>

        <div v-if="summary === null" class="flex items-center justify-center w-full h-[300px] bg-amber-500 mt-16">
            <CalculatorIcon class="w-16 h-16 mr-10" />
            <p class="text-2xl">Select an instructor and a month to start calculating.</p>
        </div>

        <div class="my-10 border rounded-lg py-5 px-5 bg-yellow-400" v-if="summary !== null">
            <div class="grid grid-cols-2 mt-3 font-semibold">
                <div class="px-10">
                    <h3 class="font-bold text-center text-xl">Summary</h3>
                    <p class="font-normal">This report shows all the payments collected in a given month. Payments are
                        grouped by thecourse. Instructor's share and share of the class are calculated and shown
                        seperately.</p>
                </div>
                <div class="px-10">
                    <div class="grid grid-cols-2 gap-10">
                        <p>Total Revenue</p>
                        <p class="justify-self-end">{{ summary.payments.total.currency }} {{
                            formatMoney(summary.payments.total.amount) }}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-10">
                        <p>Instructor's Share</p>
                        <p class="justify-self-end">{{ summary.payments.instructor_share.currency }} {{
                            formatMoney(summary.payments.instructor_share.amount) }}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-10">
                        <p>Class Share</p>
                        <p class="justify-self-end">{{ summary.payments.class_share.currency }} {{
                            formatMoney(summary.payments.class_share.amount) }}</p>
                    </div>
                </div>
            </div>
        </div>

        <div v-for="(paymentCollection, index) of forSelectedMonthPayments" :key="index" class="border mt-16">
            <div class="py-5 px-5 bg-yellow-100">
                <h4 class="font-semibold text-lg">Course :- {{ paymentCollection.course_name }}</h4>
                <div class="grid grid-cols-3">
                    <div class="grid grid-cols-2 justify-self-center gap-10">
                        <p>Course Fee</p>
                        <p>LKR {{ paymentCollection['course_fee']['amount'] }}
                            {{ paymentCollection['course_fee']['type'] }}</p>
                    </div>
                    <div class="grid grid-cols-2 justify-self-center gap-10">
                        <p>Instructor Fee Percentage</p>
                        <p>{{ paymentCollection['instructor_fee_percentage'] }}%</p>
                    </div>
                    <div class="grid grid-cols-2 justify-self-center gap-10">
                        <p>Enrolled Active Student Count</p>
                        <p>{{ paymentCollection['enrollment_count'] }}</p>
                    </div>
                </div>
            </div>
            <div class="">
                <TableComponent :table-columns="tableColumns"
                    :table-rows="selectedMonthTableRows.find(row => row.courseId == paymentCollection.course_id)!['rows']"
                    :options="{ hideActionBar: true, hidePaginateBar: true }" />
            </div>
            <div class="flex flex-col items-end py-5">
                <div class="w-fit flex flex-col items-end mr-10">
                    <div class="grid grid-cols-2 gap-10 w-full">
                        <p class="justify-self-start">Total Revenue</p>
                        <p class="justify-self-end">{{ paymentCollection.tot_payments.currency }} {{
                            formatMoney(paymentCollection.tot_payments.amount) }}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-10 w-full">
                        <p class="justify-self-start">Instructor's Share</p>
                        <p class="justify-self-end">{{ paymentCollection.instructor_share.currency }} {{
                            formatMoney(paymentCollection.instructor_share.amount) }}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-10 w-full">
                        <p class="justify-self-start">Class Share</p>
                        <p class="justify-self-end">{{ paymentCollection.class_share.currency }} {{
                            formatMoney(paymentCollection.class_share.amount) }}</p>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="otherMonthPayments?.find(p => p.records.length > 0)"
            class="flex items-center text-red-600 mt-20 mb-12">
            <StarIcon class="w-10 h10 mr-10" />
            <h5 class="text-xl font-semibold">Payments made in the selected month but
                for another month.</h5>
        </div>


        <div v-for="(paymentCollection, index) of otherMonthPayments" :key="index">
            <div v-if="paymentCollection.records.length > 0" class="border my-16">
                <div class="py-5 px-5 bg-yellow-100">
                    <h4 class="font-semibold text-lg">Course :- {{ paymentCollection.course_name }}</h4>
                    <div class="grid grid-cols-3">
                        <div class="grid grid-cols-2 justify-self-center gap-10">
                            <p>Course Fee</p>
                            <p>LKR {{ paymentCollection['course_fee']['amount'] }}
                                {{ paymentCollection['course_fee']['type'] }}</p>
                        </div>
                        <div class="grid grid-cols-2 justify-self-center gap-10">
                            <p>Instructor Fee Percentage</p>
                            <p>{{ paymentCollection['instructor_fee_percentage'] }}%</p>
                        </div>
                        <div class="grid grid-cols-2 justify-self-center gap-10">
                            <p>Enrolled Active Student Count</p>
                            <p>{{ paymentCollection['enrollment_count'] }}</p>
                        </div>
                    </div>
                </div>
                <div class="">
                    <TableComponent :table-columns="tableColumnsForOtherMonthPayments"
                        :table-rows="otherMonthsTableRows.find(row => row.courseId == paymentCollection.course_id)!['rows']"
                        :options="{ hideActionBar: true, hidePaginateBar: true }" />
                </div>
                <div class="flex flex-col items-end py-5">
                    <div class="w-fit flex flex-col items-end mr-10">
                        <div class="grid grid-cols-2 gap-10 w-full">
                            <p class="justify-self-start">Total Revenue</p>
                            <p class="justify-self-end">{{ paymentCollection.tot_payments.currency }} {{
                                formatMoney(paymentCollection.tot_payments.amount) }}</p>
                        </div>
                        <div class="grid grid-cols-2 gap-10 w-full">
                            <p class="justify-self-start">Instructor's Share</p>
                            <p class="justify-self-end">{{ paymentCollection.instructor_share.currency }} {{
                                formatMoney(paymentCollection.instructor_share.amount) }}</p>
                        </div>
                        <div class="grid grid-cols-2 gap-10 w-full">
                            <p class="justify-self-start">Class Share</p>
                            <p class="justify-self-end">{{ paymentCollection.class_share.currency }} {{
                                formatMoney(paymentCollection.class_share.amount) }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>