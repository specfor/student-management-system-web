<!-- eslint-disable no-constant-condition -->
<script setup>
import { getPayments, refundPayment } from '@/apiConnections/payments';
import TableComponent from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { PencilSquareIcon } from '@heroicons/vue/24/solid';
import { ref } from 'vue';
import PaginateComponent from '@/components/PaginateComponent.vue';

const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()

const paymentDataForTable = ref([])
const tableActions = [
    { type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]

const limitLoadPayments = 30
const countTotPayments = ref(0)

async function loadPayment(startIndex = 0) {
    let resp = await getPayments(startIndex, limitLoadPayments)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    countTotPayments.value = resp.data.tot_count
    paymentDataForTable.value = []
    resp.data.payments.forEach(payment => {
        paymentDataForTable.value.push([payment.id, payment.payment_for, payment.amount,
        payment.enrollment.student.name, payment.enrollment.course.name, payment.payment_method, payment.refunded ? 'Yes' : 'No'])
    });
}
loadPayment()

async function editPayment(id) {
    dataEntryForm.newDataEntryForm('Refund Payment', 'Refund', [
        { name: 'reason', type: 'text', text: 'Reason', require: true }
    ])

    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await refundPayment(id, results.data.reason)
        if (resp.status === 'error') {
            if (resp.data.type === 'user_error')
                Object.entries(resp.data.messages).forEach(msg => {
                    if (typeof msg[1] === 'object')
                        msg[1] = msg[1].join(', ')
                    dataEntryForm.insertErrorMessage(msg[0], msg[1])
                })
            else
                alertStore.insertAlert('An error occured.', resp.message, 'error')
            continue
        } else {
            dataEntryForm.finishSubmission()
            alertStore.insertAlert('Action completed.', resp.message)
            loadPayment()
            break
        }
    }
}

async function delGrade() {
    alertStore.insertAlert('Can not Delete.', 'Payments can not be deleted.', 'error')
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-16">
            <h4 class="font-semibold text-3xl">Payments</h4>
        </div>
        <TableComponent :table-columns="['ID', 'Payment For', 'Amount', 'Student', 'Course', 'Method', 'Refunded']"
            :table-rows="paymentDataForTable" @edit-emit="editPayment" :actions="tableActions"
            :refresh-func="async () => { await loadPayment(); return true }" @delete-emit="delGrade" />

        <div class="flex justify-center mt-4 mb-10">
            <PaginateComponent :total-count="countTotPayments" :page-size="limitLoadPayments"
                @load-page-emit="loadPayment" />
        </div>
    </div>
</template>