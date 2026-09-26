<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { getStudentPayments, refundStudentPayment } from '@/apiConnections/payments';
import { getAdmissionFees, updateAdmissionFee } from '@/apiConnections/students';
import TableComponent, { type Filter, type TableActionType, type TableColumns, type tableRowItem } from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { PencilSquareIcon } from '@heroicons/vue/24/solid';
import { ref, type Ref, computed } from 'vue';
import type { StudentPayment } from '@/types/paymentTypes';
import { getInstructors } from '@/apiConnections/instructors';
import type { Instructor } from '@/types/InstructorTypes';
import type { Course } from '@/types/courseTypes';
import { getCourses } from '@/apiConnections/courses';
import { getStudents } from '@/apiConnections/students';
import type { Student } from '@/types/studentTypes';
import BillEnroller from '@/components/BillEnroller.vue';
import DailyIncomeCard from '@/components/DailyIncomeCard.vue';
import { useAuthStore } from '@/stores/authorization';

const authStore = useAuthStore()
const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()

const currentTab = ref<'class' | 'admission'>('class')

const paymentDataForTable: Ref<any[]> = ref([])

const classTableActions: TableActionType[] = [
    { renderAsRouterLink: false, type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]
const admissionTableActions: TableActionType[] = [
    { renderAsRouterLink: false, type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]

const classTableColumns: TableColumns[] = [
    { label: 'ID', sortable: true }, { label: 'Payment For' }, { label: 'Amount', sortable: true },
    { label: 'Student' }, { label: 'Course' }, { label: 'Custom Payment Reason' }, { label: 'Method' }, { label: 'Receipt ID' }, { label: 'Paid at' }, { label: 'Refunded' }]

const admissionTableColumns: TableColumns[] = [
    { label: 'ID', sortable: true }, { label: 'Student' }, { label: 'Amount', sortable: true }, { label: 'Paid Status' }, { label: 'Reductions' }, { label: 'Date' }
]

const classTableFilters: Ref<Filter[]> = ref([{ label: 'From 1st of', name: 'date_from', type: 'month' }, { label: 'Until 1st of', name: 'date_to', type: 'month' }])
const admissionTableFilters: Ref<Filter[]> = ref([])

let payments: StudentPayment[] = []
let admissionFees: any[] = []
const limitLoadPayments = 30
const countTotPayments = ref(0)

const activeTableColumns = computed(() => currentTab.value === 'class' ? classTableColumns : admissionTableColumns)
const activeTableActions = computed(() => currentTab.value === 'class' ? classTableActions : admissionTableActions)
const activeTableFilters = computed(() => currentTab.value === 'class' ? classTableFilters.value : admissionTableFilters.value)

async function initLoadInstructors() {
    let resp = await getInstructors(undefined, undefined, { sort: { by: 'name', direction: 'asc' } })
    if (resp.status === 'success') {
        let insFilter: any = { label: 'Instructor', name: 'instructor_id', type: 'select', options: [] };
        (resp.data.instructors as Instructor[]).forEach(instructor => {
            insFilter.options.push({ text: instructor.name, value: instructor.id })
        });
        classTableFilters.value.push(insFilter)
    }
}
async function initLoadCourses() {
    let resp = await getCourses()
    if (resp.status === 'error') {
        return
    }
    let courseFilter: any = { label: 'Course', name: 'course_id', type: 'select', options: [] };
    Object.entries(resp.data.courses as Course[][]).forEach(item => {
        item[1].forEach(course => {
            let courseName = course.name
            if (course.group_name)
                courseName += " - " + course.group_name
            courseFilter.options.push({ text: courseName, value: course.id })
        })
    })
    classTableFilters.value.push(courseFilter)
}
async function initLoadStudents() {
    let resp = await getStudents(undefined, undefined, { sort: { by: 'name', direction: 'asc' } })
    if (resp.status === 'error')
        return

    let studentFilter: any = { label: 'Student', name: 'student_id', type: 'select', options: [] };
    (resp.data.students as Student[]).forEach(student => {
        studentFilter.options.push({ text: student.name, value: student.id })
    })
    classTableFilters.value.push(studentFilter)
    
    let admissionStudentFilter = JSON.parse(JSON.stringify(studentFilter))
    admissionTableFilters.value.push(admissionStudentFilter)
}
initLoadInstructors()
initLoadCourses()
initLoadStudents()

let lastLoadSettings: {
    lastUsedIndex: number, orderBy: string, orderDirec: 'asc' | 'desc',
    filters: { student_id?: number, course_id?: number, instructor_id?: number, date_from?: string, date_to?: string }
}
    = { lastUsedIndex: 0, orderBy: '', orderDirec: 'desc', filters: { date_from: "", date_to: "" } }

function setSorting(column: string, direction: 'asc' | 'desc') {
    let orderBy = ''
    switch (column) {
        case 'ID':
            orderBy = 'id'
            break;
        case 'Amount':
            orderBy = 'amount'
            break;
        default:
            break;
    }

    lastLoadSettings.orderBy = orderBy
    lastLoadSettings.orderDirec = direction
}

async function loadData(startIndex?: number, filters?: { [key: string]: any }) {
    if (currentTab.value === 'class') {
        await loadPayments(startIndex, filters)
    } else {
        await loadAdmissionFees(startIndex, filters)
    }
}

async function loadPayments(startIndex?: number, filters?: { [key: string]: any }) {
    if (startIndex === undefined)
        startIndex = lastLoadSettings.lastUsedIndex
    else
        lastLoadSettings.lastUsedIndex = startIndex

    if (filters?.date_from)
        lastLoadSettings.filters.date_from = filters.date_from
    else
        lastLoadSettings.filters.date_from = undefined
    if (filters?.date_to)
        lastLoadSettings.filters.date_to = filters.date_to
    else
        lastLoadSettings.filters.date_to = undefined
    if (filters?.student_id)
        lastLoadSettings.filters.student_id = filters.student_id
    else
        lastLoadSettings.filters.student_id = undefined
    if (filters?.course_id)
        lastLoadSettings.filters.course_id = filters.course_id
    else
        lastLoadSettings.filters.course_id = undefined
    if (filters?.instructor_id)
        lastLoadSettings.filters.instructor_id = filters.instructor_id
    else
        lastLoadSettings.filters.instructor_id = undefined

    let opt: any = {}
    opt.sort = { by: lastLoadSettings.orderBy, direction: lastLoadSettings.orderDirec }
    opt.filters = lastLoadSettings.filters

    let resp = await getStudentPayments(startIndex, limitLoadPayments, opt)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    countTotPayments.value = resp.data.tot_count
    paymentDataForTable.value = []
    payments = resp.data.payments
    payments.forEach(payment => {
        let student: tableRowItem = "Deleted"
        if (payment.enrollment?.student)
            student = { type: 'textWithLink', text: payment.enrollment.student.name, url: `/students/${payment.enrollment.student.id}/view` }
        let course: tableRowItem = "Deleted"
        if (payment.enrollment?.course)
            course = payment.enrollment.course.name

        let refunded: tableRowItem = { type: 'colorTag', text: payment.refunded ? 'Yes' : 'No', css: payment.refunded ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700' }

        paymentDataForTable.value.push([payment.id, payment.payment_for, payment.amount,
            student, course, payment.custom_amount_reason, payment.payment_method, payment.bill_id ??
        { type: 'button', text: "Assign Receipt", emit: 'assignBill', css: 'bg-blue-200 active:bg-blue-400 text-blue-700' },
        new Date(payment.created_at).toLocaleString(), refunded])
    });
}

async function loadAdmissionFees(startIndex?: number, filters?: { [key: string]: any }) {
    if (startIndex === undefined) startIndex = lastLoadSettings.lastUsedIndex
    else lastLoadSettings.lastUsedIndex = startIndex

    if (filters?.student_id) lastLoadSettings.filters.student_id = filters.student_id
    else lastLoadSettings.filters.student_id = undefined

    let opt: any = {}
    opt.sort = { by: lastLoadSettings.orderBy, direction: lastLoadSettings.orderDirec }
    opt.filters = { student_id: lastLoadSettings.filters.student_id }

    let resp = await getAdmissionFees(startIndex, limitLoadPayments, opt)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    countTotPayments.value = resp.data.tot_count
    paymentDataForTable.value = []
    admissionFees = resp.data.admission_fees
    admissionFees.forEach(fee => {
        let student: tableRowItem = "Deleted"
        if (fee.student)
            student = { type: 'textWithLink', text: fee.student.name, url: `/students/${fee.student.id}/view` }

        let paidStatus: tableRowItem = { type: 'colorTag', text: fee.paid ? 'Paid' : 'Unpaid', css: fee.paid ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700' }

        paymentDataForTable.value.push([
            fee.id,
            student,
            fee.amount,
            paidStatus,
            fee.reductions ?? "None",
            new Date(fee.created_at).toLocaleString()
        ])
    });
}

loadData()

async function editPayment(id: number) {
    if (currentTab.value === 'admission') {
        let fee = admissionFees.find(f => f.id === id)
        dataEntryForm.newDataEntryForm('Edit Admission Fee', 'Save', [
            { name: 'amount', type: 'number', text: 'Amount', default: fee?.amount, required: true },
            { name: 'reduction_reason', type: 'text', text: 'Reductions', default: fee?.reductions }
        ])
        while (true) {
            let results = await dataEntryForm.waitForSubmittedData()
            if (!results.submitted) return

            let resp = await updateAdmissionFee(id, Number(results.data.amount), undefined, results.data.reduction_reason as string)
            if (resp.status === 'error') {
                if (resp.data.type === 'user_error')
                    Object.entries(resp.data.messages).forEach(msg => {
                        let err = Array.isArray(msg[1]) ? msg[1].join(', ') : msg[1] as string
                        dataEntryForm.insertErrorMessage(msg[0], err)
                    })
                else alertStore.insertAlert('An error occured.', resp.message, 'error')
                continue
            } else {
                dataEntryForm.finishSubmission()
                alertStore.insertAlert('Action completed.', resp.message)
                loadData()
                break
            }
        }
        return
    }

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
            loadData()
            break
        }
    }
}

async function delPayment() {
    alertStore.insertAlert('Can not Delete.', 'Payments can not be deleted.', 'error')
}

const billAsignerVisible = ref(false)
const billAsignPaymentId = ref(0)
const billAsignStudentId = ref(0)

function showBillAsigner(PaymentId: number) {
    payments.find(p => {
        if (p.id === PaymentId) {
            billAsignStudentId.value = p.enrollment?.student_id ?? 0
        }
    })
    billAsignPaymentId.value = PaymentId
    billAsignerVisible.value = true
}

function switchTab(tab: 'class' | 'admission') {
    currentTab.value = tab
    lastLoadSettings.lastUsedIndex = 0
    loadData()
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-10">
            <h4 class="font-semibold text-3xl">Student Payments</h4>
        </div>

        <DailyIncomeCard v-if="authStore.canSeeCard('daily_income_summary')" />

        <!-- Tabs -->
        <div class="border-b border-gray-200 mb-6 mt-4">
            <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                <button @click="switchTab('class')" 
                    :class="{'border-blue-500 text-blue-600': currentTab === 'class', 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300': currentTab !== 'class'}" 
                    class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200">
                    Class Payments
                </button>
                <button @click="switchTab('admission')" 
                    :class="{'border-blue-500 text-blue-600': currentTab === 'admission', 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300': currentTab !== 'admission'}" 
                    class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200">
                    Admission Fees
                </button>
            </nav>
        </div>

        <div class="mb-10" :key="currentTab">
            <TableComponent :table-columns="activeTableColumns" :table-rows="paymentDataForTable" @edit-emit="editPayment"
                :actions="activeTableActions" :refresh-func="async () => { await loadData(); return true }"
                @delete-emit="delPayment" @load-page-emit="loadData" :paginate-page-size="limitLoadPayments"
                :paginate-total="countTotPayments" :current-sorting="{ column: 'ID', direc: 'desc' }" @sort-by="(col, dir) => {
                    setSorting(col, dir); loadData();
                }" :filters="activeTableFilters" @filter-values="(val) => {
                    loadData(undefined, val)
                }" @assign-bill="(paymentId) => {
                    showBillAsigner(paymentId)
                }" />
        </div>

        <div class="aboslute inset-0 bg-gray-800 bg-opacity-50">
            <BillEnroller :payment-id="billAsignPaymentId" :student-id="billAsignStudentId" :show="billAsignerVisible"
                @close="() => { billAsignerVisible = false }" @bill-created="(id) => {
                    loadData()
                }" />
        </div>
    </div>
</template>