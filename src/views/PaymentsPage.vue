<!-- eslint-disable no-constant-condition -->
<script setup>
import { getPayments, refundPayment } from '@/apiConnections/payments';
import TableComponent from '@/components/TableComponent.vue';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { PencilSquareIcon } from '@heroicons/vue/24/solid';
import { ref } from 'vue';

const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()

const gradeDataForTable = ref([])
// let paymentData = []
const tableActions = [
    { type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]

async function loadPayment() {
    let resp = await getPayments()
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    // paymentData = resp.data.grades
    gradeDataForTable.value = []
    resp.data.payments.forEach(payment => {
        gradeDataForTable.value.push([payment.id, payment.payment_for, payment.amount,
        payment.enrollment.student.name, payment.enrollment.course.name, payment.payment_method, payment.refunded ? 'Yes' : 'No'])
    });
}
loadPayment()

// async function addNewGrade() {
//     dataEntryForm.newDataEntryForm('Create New Grade', 'Create', [
//         { name: 'name', type: 'text', text: 'Name', require: true }
//     ])

//     while (true) {
//         let results = await dataEntryForm.waitForSubmittedData()
//         if (!results.submitted)
//             return

//         let resp = await createGrade(results.data.name)
//         if (resp.status === 'error') {
//             alertStore.insertAlert('An error occured.', resp.message, 'error')
//             continue
//         } else {
//             dataEntryForm.finishSubmission()
//             alertStore.insertAlert('Action completed.', resp.message)
//             loadPayment()
//             break
//         }
//     }
// }

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
            <NewItemButton text="New Grade" :on-click="addNewGrade" />
        </div>
        <TableComponent :table-columns="['ID', 'Payment For', 'Amount', 'Student', 'Course', 'Method', 'Refunded']"
            :table-rows="gradeDataForTable" @edit-emit="editPayment" :actions="tableActions"
            :refresh-func="async () => { await loadPayment(); return true }" @delete-emit="delGrade" />
    </div>
</template>