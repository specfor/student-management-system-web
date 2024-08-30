<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { deleteInstructorPayment, getInstructorPayments, refundStudentPayment } from '@/apiConnections/payments';
import TableComponent, { type Filter, type TableActionType, type TableColumns, type tableRowItem } from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { MagnifyingGlassIcon } from '@heroicons/vue/24/solid';
import { onMounted, ref, watch, type Ref } from 'vue';
import { getRouteQuery, setRoute, setRouteQuery } from '@/utils/routeHelpers';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import { getInstructors } from '@/apiConnections/instructors';
import type { InstructorPayment } from '@/types/paymentTypes';
import type { Instructor } from '@/types/InstructorTypes';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';

const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()
const confirmationForm = useConfirmationFormsStore()

let payments: InstructorPayment[]
const paymentData: Ref<any[]> = ref([])

const tableActions: TableActionType[] = [
    { renderAsRouterLink: false, type: 'icon', emit: 'moreInfoEmit', icon: MagnifyingGlassIcon, css: 'fill-blue-600' }
]
const tableColumns: TableColumns[] = [
    { label: 'ID', sortable: true }, { label: 'Payment For', sortable: true }, { label: 'Instructor' }, { label: 'Total Amount' }, { label: 'Pending Payments' },
    { label: 'Resolved' }, { label: 'Paid at', sortable: true }]

// const thisMonth = (new Date()).getFullYear() + '-' + ('0' + ((new Date()).getMonth() + 1)).slice(-2)

const tableFilters: Ref<Filter[]> = ref([{ label: 'From 1st of', name: 'date_from', type: 'month', value: "" }, { label: 'Until 31st of', name: 'date_to', type: 'month' }])

const limitLoadPayments = 30
const countTotPaymentsFor = ref(0)

const selectedInstructorId = ref(0)


let lastLoadSettings: { lastUsedIndex: number, orderBy: string, orderDirec: 'asc' | 'desc', filters: { instructor_id: number, date_from?: string, date_to?: string } }
    = { lastUsedIndex: 0, orderBy: 'id', orderDirec: 'desc', filters: { instructor_id: 0, date_from: "", date_to: "" } }

watch(selectedInstructorId, (id) => {
    setRouteQuery('i_id', id)
})

// can call selectTab method on tabSelectMode before mounting. that is why this code is not in init
onMounted(() => {
    let routeInstructorId = getRouteQuery('i_id')
    if (routeInstructorId !== null) {
        lastLoadSettings.filters.instructor_id = Number(routeInstructorId)
    }
})

async function init() {
    let resp = await getInstructors()
    if (resp.status === 'success') {
        let insFilter: any = { label: 'Instructor', name: 'instructor_id', type: 'select', options: [] };
        (resp.data.instructors as Instructor[]).forEach(instructor => {
            insFilter.options.push({ text: instructor.name, value: instructor.id })
        });
        tableFilters.value.push(insFilter)
    }
}
init()

function setSorting(column: string, direction: 'asc' | 'desc') {
    let orderBy = ''
    switch (column) {
        case 'ID':
            orderBy = 'id'
            break;
        case 'Paid at':
            orderBy = 'created_at'
            break;
        case 'Payment For':
            orderBy = 'paid_month'
            break;
        default:
            break;
    }
    lastLoadSettings.orderBy = orderBy
    lastLoadSettings.orderDirec = direction
}

loadPayments()

async function loadPayments(startIndex?: number, filters?: { [key: string]: any }) {
    if (startIndex === undefined)
        startIndex = lastLoadSettings.lastUsedIndex
    else
        lastLoadSettings.lastUsedIndex = startIndex

    if (filters?.instructor_id) {
        selectedInstructorId.value = filters.instructor_id
        lastLoadSettings.filters.instructor_id = filters.instructor_id
    } else
        lastLoadSettings.filters.instructor_id = 0


    if (filters?.date_from)
        lastLoadSettings.filters.date_from = filters.date_from
    else
        lastLoadSettings.filters.date_from = ""
    if (filters?.date_to)
        lastLoadSettings.filters.date_to = filters.date_to
    else
        lastLoadSettings.filters.date_to = ""

    let opt: any = {}
    opt.sort = { by: lastLoadSettings.orderBy, direction: lastLoadSettings.orderDirec }
    opt.filters = lastLoadSettings.filters

    let resp = await getInstructorPayments(startIndex, limitLoadPayments, opt)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    countTotPaymentsFor.value = resp.data.tot_count
    paymentData.value = []
    payments = resp.data.payments
    payments.forEach(payment => {
        let instructor: tableRowItem = "Deleted"
        if (payment.instructor)
            instructor = { type: 'textWithLink', text: payment.instructor.name, url: `/instructors/${payment.instructor_id}/view` }

        let pendingResolved = { type: 'colorTag', text: payment.pending_payments_resolved, css: 'bg-green-200 text-green-800' }
        if (!payment.pending_payments_resolved)
            pendingResolved.css = 'bg-red-200 text-red-800'

        paymentData.value.push([payment.id, payment.paid_month, instructor,
        `${payment.tot_amount.currency} ${payment.tot_amount.amount}`, `${payment.tot_pending_amount.currency} ${payment.tot_pending_amount.amount}`,
            pendingResolved, new Date(payment.created_at).toLocaleString()])
    });
}

async function editPayment(id: number) {
    dataEntryForm.newDataEntryForm('Refund Payment', 'Refund', [
        { name: 'reason', type: 'text', text: 'Reason', required: true }
    ])

    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await refundStudentPayment(id, results.data.reason as string)
        if (resp.status === 'error') {
            if (resp.data.type === 'user_error')
                Object.entries(resp.data.messages).forEach(msg => {
                    let err = ""
                    if (Array.isArray(msg[1]) && !msg[1] === null)
                        err = msg[1].join(', ')
                    else
                        err = msg[1] as string
                    dataEntryForm.insertErrorMessage(msg[0], err)
                })
            else
                alertStore.insertAlert('An error occured.', resp.message, 'error')
            continue
        } else {
            dataEntryForm.finishSubmission()
            alertStore.insertAlert('Action completed.', resp.message)
            loadPayments()
            break
        }
    }
}

function moreInfo(id: number) {
    let p = payments.find(payment => payment.id === id)!
    setRoute('/payments/instructors/calculate?i_id=' + p.instructor_id + '&m=' + p.paid_month)
}

async function delPayment(ids: number[]) {
    let confirmed = await confirmationForm.newConfirmationForm("Confirm Deletion", "Are you sure you want to delete these paymnets with IDs: " + ids.join(', ') + "?")
    if (!confirmed)
        return

    ids.forEach(async id => {
        let resp = await deleteInstructorPayment(id)
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured deleting the payment.', resp.message, 'error')
            return
        }
        alertStore.insertAlert('Action completed.', resp.message)
    });
    loadPayments()
}

function newPayment() {
    setRoute('/payments/instructors/calculate')
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-10">
            <h4 class="font-semibold text-3xl">Instructor Payments</h4>
        </div>

        <div class="flex justify-end mb-16">
            <NewItemButton text="Mark Payment" :on-click="newPayment" />
        </div>

        <div class="mb-10">
            <TableComponent :table-columns="tableColumns" :table-rows="paymentData" @more-info-emit="moreInfo"
                :actions="tableActions" :refresh-func="async () => { await loadPayments(); return true }"
                @delete-emit="delPayment" @load-page-emit="loadPayments" :paginate-page-size="limitLoadPayments"
                :paginate-total="countTotPaymentsFor" :current-sorting="{ column: 'ID', direc: 'desc' }" @sort-by="(col, dir) => {
                    setSorting(col, dir); loadPayments();
                }" :filters="tableFilters" @filter-values="(val) => {
                    loadPayments(undefined, val)
                }" />
        </div>

    </div>
</template>