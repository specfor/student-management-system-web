<script setup lang="ts">
import { getInstructorPaymentCalculated, getStudentPaymentListForInstructorPaymentCalculation, markInstructorPayment } from '@/apiConnections/payments';
import InstructorSelector from '@/components/dataSelectors/InstructorSelector.vue';
import type { TableColumns, tableRowItem } from '@/components/TableComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { formatMoney } from '@/utils/money';
import { setRoute } from '@/utils/routeHelpers';
import { CalculatorIcon, StarIcon } from '@heroicons/vue/24/outline';
import { ref, watch, type Ref } from 'vue';

const alertStore = useAlertsStore()
const dataEntryForm = useDataEntryFormsStore()

const tableColumns: TableColumns[] = [
    { label: '#' }, { label: 'Student' }, { label: 'Attendance' }, { label: 'Paid Amount' }, { label: 'Paid Date' },
    { label: "Paid Instructor's Share" }]
const tableColumnsForOtherMonthPayments: TableColumns[] = [
    { label: '#' }, { label: 'Student' }, { label: 'Attendance' }, { label: 'Paid Amount' }, { label: 'Paid Date' },
    { label: "Paid Instructor's Share" }]

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

let forSelectedMonthPayments: Ref<StudentPaymentListingResponse['for_selected_month'] | null> = ref(null)
let otherMonthPayments: Ref<StudentPaymentListingResponse['for_other_months'] | null> = ref(null)
let relationData: Ref<StudentPaymentListingResponse['relation_data'] | null> = ref(null)

let selectedMonthTableRows: Ref<{ courseId: number, rows: tableRowItem[][] }[]> = ref([])
let otherMonthsTableRows: Ref<{ courseId: number, rows: tableRowItem[][] }[]> = ref([])


let mapIndexToRelaventId: { [key: number]: { paymentId?: number, enrollmentId?: number, paid: boolean } } = {}

async function loadCalculations() {
    if (selectedMonth.value === '' || selectedInstructorId.value === 0)
        return

    let date = selectedMonth.value.split('-')
    let resp = await getStudentPaymentListForInstructorPaymentCalculation(selectedInstructorId.value, Number(date[0]), Number(date[1]))
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured while loading data.', resp.message, 'error')
        return
    }

    let data: StudentPaymentListingResponse = resp.data

    forSelectedMonthPayments.value = data.for_selected_month
    otherMonthPayments.value = data.for_other_months
    relationData.value = data.relation_data

    selectedMonthTableRows.value = []
    otherMonthsTableRows.value = []

    let index = 1

    data.for_selected_month.forEach(coursePayments => {
        let rows: tableRowItem[][] = []
        coursePayments.records.forEach(record => {
            console.log(record.payment_id, record.enrollment_id);

            let tmp: { paymentId: undefined | number, enrollmentId: undefined | number, paid: boolean } =
                { paymentId: undefined, enrollmentId: undefined, paid: record.paid_instructor_share }
            if (record.payment_id)
                tmp['paymentId'] = record.payment_id
            if (record.enrollment_id)
                tmp['enrollmentId'] = record.enrollment_id
            mapIndexToRelaventId[index] = tmp

            let studentData = relationData.value?.students.find(s => s.id === record.student_id)
            let studentName = studentData ? (studentData.custom_id ? studentData.custom_id + ' - ' : '') + studentData.name : 'DELETED'
            rows.push([index, studentName, record.attended_day_count + ' days', `${record.payment_amount.currency} ${formatMoney(record.payment_amount.amount)}`,
                record.paid_date ? new Date(record.paid_date).toLocaleDateString() : '-',
                {
                    type: 'colorTag', text: record.paid_instructor_share ? 'Yes' : 'No',
                    css: record.paid_instructor_share ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }])
            index++
        });
        selectedMonthTableRows.value.push({
            courseId: coursePayments.course_id,
            rows: rows
        })
    });

    data.for_other_months.forEach(coursePayments => {
        let rows: tableRowItem[][] = []
        coursePayments.records.forEach(record => {
            if (record.payment_id)
                mapIndexToRelaventId[index] = { paymentId: record.payment_id, paid: record.paid_instructor_share }
            if (record.enrollment_id)
                mapIndexToRelaventId[index] = { enrollmentId: record.enrollment_id, paid: record.paid_instructor_share }

            let studentData = relationData.value?.students.find(s => s.id === record.student_id)
            let studentName = studentData ? (studentData.custom_id ? studentData.custom_id + ' - ' : '') + studentData.name : 'DELETED'
            rows.push([index, studentName, record.attended_day_count + ' days', `${record.payment_amount.currency} ${formatMoney(record.payment_amount.amount)}`,
                record.paid_date ? new Date(record.paid_date).toLocaleDateString() : '-',
                {
                    type: 'colorTag', text: record.paid_instructor_share ? 'Yes' : 'No',
                    css: record.paid_instructor_share ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }])
            index++
        });
        otherMonthsTableRows.value.push({
            courseId: coursePayments.course_id,
            rows: rows
        })
    });
}

let selectedPayment: Ref<{ [key: number]: number[] }> = ref({})

function setSelectedRows(courseId: number, rows: number[]) {
    selectedPayment.value[courseId] = rows
}

async function showCalculatedPayment() {
    let paymentIds: number[] = []
    let pendingPaymentEnrollmentIds: number[] = []

    Object.values(selectedPayment.value).forEach(rowIndexes => {
        rowIndexes.forEach(rowIndex => {
            if (!mapIndexToRelaventId[rowIndex].paid)
                if (mapIndexToRelaventId[rowIndex].paymentId !== undefined)
                    paymentIds.push(mapIndexToRelaventId[rowIndex].paymentId!)
                else
                    pendingPaymentEnrollmentIds.push(mapIndexToRelaventId[rowIndex].enrollmentId!)
        })

    })

    if (paymentIds.length === 0 && pendingPaymentEnrollmentIds.length === 0) {
        alertStore.insertAlert('Select Payments', "Please select at least one payment where instructor's share is not paid.", 'error')
        return
    }

    let resp = await getInstructorPaymentCalculated(paymentIds, pendingPaymentEnrollmentIds)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured while loading data.', resp.message, 'error')
        return
    }
    let calculated = resp.data.calculated_payment

    dataEntryForm.newDataEntryForm('New Instructor Payment', 'Create', [
        {
            name: 'instructor_share', text: "Total Instructor's Share", type: 'text', disabled: true,
            value: `${calculated.overall.total.currency} ${formatMoney(calculated.overall.total.amount)}`
        },
        {
            name: 'paid', text: 'From Paid Students', type: 'text', disabled: true,
            value: `${calculated.for_paid.total.currency} ${formatMoney(calculated.for_paid.total.amount)}`
        },
        {
            name: 'pending_payment', text: 'For Unpaid Students', type: 'text', disabled: true,
            value: `${calculated.for_pending.total.currency} ${formatMoney(calculated.for_pending.total.amount)}`
        },
    ], { allowSubmit: true })

    let results = await dataEntryForm.waitForSubmittedData()
    if (!results.submitted)
        return

    dataEntryForm.finishSubmission()

    let resp2 = await markInstructorPayment(selectedInstructorId.value, paymentIds, Number(selectedMonth.value.substring(5)),
        Number(selectedMonth.value.substring(0, 4)), calculated.overall.total.amount, pendingPaymentEnrollmentIds)

    if (resp2.status === 'error') {
        alertStore.insertAlert('An error occured while marking payment.', resp2.message, 'error')
        return
    }
    alertStore.insertAlert('Action completed.', 'Instructor payment marked successfully.')
    setRoute('/payments/instructors')
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
        </div>
        <p class="my-10" v-if="forSelectedMonthPayments !== null">Select student payments to calculate the new payment
            amount. If instructor's share of any selected student payment is paid before, it is discarded when
            calculating the new instructor's payment. If you need to pay instructor when the student has not paid,
            select those records also.</p>

        <div v-if="forSelectedMonthPayments === null"
            class="flex items-center justify-center w-full h-[300px] bg-amber-500 mt-16">
            <CalculatorIcon class="w-16 h-16 mr-10" />
            <p class="text-2xl">Select an instructor and a month to start calculating.</p>
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
                    @selected-rows="(rows) => { setSelectedRows(paymentCollection.course_id, rows) }"
                    :table-rows="selectedMonthTableRows.find(row => row.courseId == paymentCollection.course_id)!['rows']"
                    :options="{ hideActionBar: true, hidePaginateBar: true, showRowCheckBox: true }" />
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
                        @selected-rows="(rows) => { setSelectedRows(paymentCollection.course_id, rows) }"
                        :table-rows="otherMonthsTableRows.find(row => row.courseId == paymentCollection.course_id)!['rows']"
                        :options="{ hideActionBar: true, hidePaginateBar: true, showRowCheckBox: true }" />
                </div>
            </div>
        </div>

        <div class="my-20 flex justify-end" v-show="forSelectedMonthPayments !== null">
            <button class="bg-blue-600 hover:bg-blue-800 py-2 px-5 text-white" @click="showCalculatedPayment">Calculate
                Payment</button>
        </div>
    </div>
</template>