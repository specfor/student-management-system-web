<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { getStudentPayments, refundStudentPayment } from '@/apiConnections/payments';
import TableComponent, { type Filter, type TableActionType, type TableColumns, type tableRowItem } from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { PencilSquareIcon } from '@heroicons/vue/24/solid';
import { ref, type Ref } from 'vue';
import type { StudentPayment } from '@/types/paymentTypes';
import { getInstructors } from '@/apiConnections/instructors';
import type { Instructor } from '@/types/InstructorTypes';
import type { Course } from '@/types/courseTypes';
import { getCourses } from '@/apiConnections/courses';
import { getStudents } from '@/apiConnections/students';
import type { Student } from '@/types/studentTypes';

const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()

const paymentDataForTable: Ref<any[]> = ref([])

const tableActions: TableActionType[] = [
    { renderAsRouterLink: false, type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]
const tableColumns: TableColumns[] = [
    { label: 'ID', sortable: true }, { label: 'Payment For' }, { label: 'Amount', sortable: true },
    { label: 'Student' }, { label: 'Course' }, { label: 'Custom Payment Reason' }, { label: 'Method' }, { label: 'Paid at' }, { label: 'Refunded' }]

// const thisMonth = (new Date()).getFullYear() + '-' + ('0' + ((new Date()).getMonth() + 1)).slice(-2)

const tableFilters: Ref<Filter[]> = ref([{ label: 'From 1st of', name: 'date_from', type: 'month' }, { label: 'Until 1st of', name: 'date_to', type: 'month' }])

const limitLoadPayments = 30
const countTotPayments = ref(0)


async function initLoadInstructors() {
    let resp = await getInstructors(undefined, undefined, { sort: { by: 'name', direction: 'asc' } })
    if (resp.status === 'success') {
        let insFilter: any = { label: 'Instructor', name: 'instructor_id', type: 'select', options: [] };
        (resp.data.instructors as Instructor[]).forEach(instructor => {
            insFilter.options.push({ text: instructor.name, value: instructor.id })
        });
        tableFilters.value.push(insFilter)
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
    tableFilters.value.push(courseFilter)
}
async function initLoadStudents() {
    let resp = await getStudents(undefined, undefined, { sort: { by: 'name', direction: 'asc' } })
    if (resp.status === 'error')
        return

    let studentFilter: any = { label: 'Student', name: 'student_id', type: 'select', options: [] };
    (resp.data.students as Student[]).forEach(student => {
        studentFilter.options.push({ text: student.name, value: student.id })
    })
    tableFilters.value.push(studentFilter)

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
    let payments: StudentPayment[] = resp.data.payments
    payments.forEach(payment => {
        let student: tableRowItem = "Deleted"
        if (payment.enrollment.student)
            student = { type: 'textWithLink', text: payment.enrollment.student.name, url: `/students/${payment.enrollment.student.id}/view` }
        let course: tableRowItem = "Deleted"
        if (payment.enrollment.course)
            // course = { type: 'textWithLink', text: payment.enrollment.course.name, url: `/courses/${payment.enrollment.course.id}/view` }
            course = payment.enrollment.course.name

        let refunded: tableRowItem = { type: 'colorTag', text: payment.refunded ? 'Yes' : 'No', css: payment.refunded ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700' }

        paymentDataForTable.value.push([payment.id, payment.payment_for, payment.amount,
            student, course, payment.custom_amount_reason, payment.payment_method, new Date(payment.created_at).toLocaleString(), refunded])
    });
}

loadPayments()

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

async function delPayment() {
    alertStore.insertAlert('Can not Delete.', 'Payments can not be deleted.', 'error')
}

</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-10">
            <h4 class="font-semibold text-3xl">Student Payments</h4>
        </div>

        <div class="mb-10">
            <TableComponent :table-columns="tableColumns" :table-rows="paymentDataForTable" @edit-emit="editPayment"
                :actions="tableActions" :refresh-func="async () => { await loadPayments(); return true }"
                @delete-emit="delPayment" @load-page-emit="loadPayments" :paginate-page-size="limitLoadPayments"
                :paginate-total="countTotPayments" :current-sorting="{ column: 'ID', direc: 'desc' }" @sort-by="(col, dir) => {
                    setSorting(col, dir); loadPayments();
                }" :filters="tableFilters" @filter-values="(val) => {
                    loadPayments(undefined, val)
                }" />
        </div>

    </div>
</template>