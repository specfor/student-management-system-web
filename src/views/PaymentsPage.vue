<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { getPayments, refundPayment } from '@/apiConnections/payments';
import TableComponent, { type Filter, type TableActionType, type TableColumns, type tableRowItem } from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { PencilSquareIcon } from '@heroicons/vue/24/solid';
import { onMounted, ref, watch, type Ref } from 'vue';
import CourseSelector from '@/components/dataSelectors/CourseSelector.vue';
import StudentSelector from '@/components/dataSelectors/StudentSelector.vue';
import { getRouteQuery, setRouteQuery } from '@/utils/routeHelpers';

const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()

const tabSelectMode: Ref<any> = ref(null)

const paymentDatByCourseTable: Ref<any[]> = ref([])
const paymentDataByStudentTable: Ref<any[]> = ref([])
const tableActions: TableActionType[] = [
    { renderAsRouterLink: false, type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]
const tableColumns: TableColumns[] = [
    { label: 'ID', sortable: true }, { label: 'Payment For' }, { label: 'Amount', sortable: true },
    { label: 'Student' }, { label: 'Course' }, { label: 'Method' }, { label: 'Refunded' }]

const thisMonth = (new Date()).getFullYear() + '-' + ('0' + (new Date()).getMonth()).slice(-2)

const tableFilters: Filter[] = [{ label: 'From 1st of', name: 'date_from', type: 'month', value: thisMonth }, { label: 'Until 1st of', name: 'date_to', type: 'month' }]

const limitLoadPayments = 30
const countTotPaymentsForByCourse = ref(0)
const countTotPaymentsForByStudent = ref(0)

const selectedStudentId = ref(0)
const selectedCourseId = ref(0)

watch(selectedStudentId, (id) => {
    setRouteQuery('s_id', selectedStudentId.value)
    loadPaymentByStudent(0, id)
})
watch(selectedCourseId, (id) => {
    setRouteQuery('c_id', selectedCourseId.value)
    loadPaymentByCourse(0, id)
})

// can call selectTab method on tabSelectMode before mounting. that is why this code is not in init
onMounted(() => {
    let routeStudentId = getRouteQuery('s_id')
    if (routeStudentId !== null) {
        tabSelectMode.value.selectTab('#by-student')
        selectedStudentId.value = Number(routeStudentId)
    }
    let routeCourseId = getRouteQuery('c_id')
    if (routeCourseId !== null) {
        tabSelectMode.value.selectTab('#by-course')
        selectedCourseId.value = Number(routeCourseId)
    }
})

let lastLoadSettingsStudents: { lastUsedIndex: number, orderBy: string, orderDirec: 'asc' | 'desc', filters: { student_id: number, date_from?: string, date_to?: string } }
    = { lastUsedIndex: 0, orderBy: '', orderDirec: 'asc', filters: { student_id: 0, date_from: thisMonth, date_to: "" } }
let lastLoadSettingsCourses: { lastUsedIndex: number, orderBy: string, orderDirec: 'asc' | 'desc', filters: { course_id: number, date_from?: string, date_to?: string } }
    = { lastUsedIndex: 0, orderBy: '', orderDirec: 'asc', filters: { course_id: 0, date_from: thisMonth, date_to: "" } }

function setSorting(column: string, direction: 'asc' | 'desc') {
    let orderBy = ''
    switch (column) {
        case 'ID':
            orderBy = 'id'
            break;
        case 'Amount':
            orderBy = 'name'
            break;
        default:
            break;
    }
    if (tabSelectMode.value.activeTabHash == '#by-student') {
        lastLoadSettingsStudents.orderBy = orderBy
        lastLoadSettingsStudents.orderDirec = direction
    } else {
        lastLoadSettingsCourses.orderBy = orderBy
        lastLoadSettingsCourses.orderDirec = direction
    }
}

function loadPayment() {
    loadPaymentByCourse()
    loadPaymentByStudent()
}

async function loadPaymentByStudent(startIndex?: number, studentId = 0, filters?: { [key: string]: any }) {
    if (studentId !== 0)
        lastLoadSettingsStudents.filters.student_id = studentId

    if (startIndex === undefined)
        startIndex = lastLoadSettingsStudents.lastUsedIndex
    else
        lastLoadSettingsStudents.lastUsedIndex = startIndex

    if (filters?.date_from)
        lastLoadSettingsStudents.filters.date_from = filters.date_from
    else
        lastLoadSettingsStudents.filters.date_from = thisMonth
    if (filters?.date_to)
        lastLoadSettingsStudents.filters.date_to = filters.date_to
    else
        lastLoadSettingsStudents.filters.date_to = undefined

    let opt: any = {}
    opt.sort = { by: lastLoadSettingsStudents.orderBy, direction: lastLoadSettingsStudents.orderDirec }
    opt.filters = lastLoadSettingsStudents.filters

    let resp = await getPayments(startIndex, limitLoadPayments, opt)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    countTotPaymentsForByStudent.value = resp.data.tot_count
    paymentDataByStudentTable.value = []
    let payments: Payment[] = resp.data.payments
    payments.forEach(payment => {
        let student: tableRowItem = "Deleted"
        if (payment.enrollment.student)
            student = { type: 'textWithLink', text: payment.enrollment.student.name, url: `/students/${payment.enrollment.student.id}/view` }
        let course: tableRowItem = "Deleted"
        if (payment.enrollment.course)
            // course = { type: 'textWithLink', text: payment.enrollment.course.name, url: `/courses/${payment.enrollment.course.id}/view` }
            course = payment.enrollment.course.name

        paymentDataByStudentTable.value.push([payment.id, payment.payment_for, payment.amount,
            student, course, payment.payment_method, payment.refunded ? 'Yes' : 'No'])
    });
}


async function loadPaymentByCourse(startIndex?: number, courseId = 0, filters?: { [key: string]: any }) {
    if (courseId !== 0)
        lastLoadSettingsCourses.filters.course_id = courseId

    if (startIndex === undefined)
        startIndex = lastLoadSettingsCourses.lastUsedIndex
    else
        lastLoadSettingsCourses.lastUsedIndex = startIndex

    if (filters?.date_from)
        lastLoadSettingsCourses.filters.date_from = filters.date_from
    else
        lastLoadSettingsCourses.filters.date_from = thisMonth
    if (filters?.date_to)
        lastLoadSettingsCourses.filters.date_to = filters.date_to
    else
        lastLoadSettingsCourses.filters.date_to = undefined

    let opt: any = {}
    opt.sort = { by: lastLoadSettingsCourses.orderBy, direction: lastLoadSettingsCourses.orderDirec }
    opt.filters = lastLoadSettingsCourses.filters

    let resp = await getPayments(startIndex, limitLoadPayments, opt)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }
    countTotPaymentsForByCourse.value = resp.data.tot_count
    paymentDatByCourseTable.value = []
    let payments: Payment[] = resp.data.payments
    payments.forEach(payment => {
        let student: tableRowItem = "Deleted"
        if (payment.enrollment.student)
            student = { type: 'textWithLink', text: payment.enrollment.student.name, url: `/students/${payment.enrollment.student.id}/view` }
        let course: tableRowItem = "Deleted"
        if (payment.enrollment.course)
            // course = { type: 'textWithLink', text: payment.enrollment.course.name, url: `/courses/${payment.enrollment.course.id}/view` }
            course = payment.enrollment.course.name

        paymentDatByCourseTable.value.push([payment.id, payment.payment_for, payment.amount,
            student, course, payment.payment_method, payment.refunded ? 'Yes' : 'No'])
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

        let resp = await refundPayment(id, results.data.reason as string)
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
        <div class="flex justify-between items-center mb-10">
            <h4 class="font-semibold text-3xl">Payments</h4>
        </div>

        <tabs nav-class="flex border-b-2 pb-[6px] justify-center" nav-item-link-class="border px-10 py-2 font-semibold"
            nav-item-link-active-class="bg-slate-200" panels-wrapper-class="pt-10" ref="tabSelectMode"
            :options="{ useUrlFragment: false }">
            <tab name="by Student">
                <div class="mb-5">
                    <StudentSelector v-model:student-id="selectedStudentId" />
                </div>
                <div class="mb-10">
                    <TableComponent :table-columns="tableColumns" :table-rows="paymentDataByStudentTable"
                        @edit-emit="editPayment" :actions="tableActions"
                        :refresh-func="async () => { await loadPaymentByStudent(); return true }"
                        @delete-emit="delGrade" @load-page-emit="loadPaymentByStudent"
                        :paginate-page-size="limitLoadPayments" :paginate-total="countTotPaymentsForByStudent"
                        :current-sorting="{ column: 'ID', direc: 'asc' }" @sort-by="(col, dir) => {
                            setSorting(col, dir); loadPaymentByStudent();
                        }" :filters="tableFilters" @filter-values="(val) => {
                            loadPaymentByStudent(undefined, undefined, val)
                        }" />
                </div>
            </tab>

            <tab name="by Course">
                <div class="mb-5">
                    <CourseSelector v-model:course-id="selectedCourseId" />
                </div>
                <div class="mb-10">
                    <TableComponent :table-columns="tableColumns" :table-rows="paymentDatByCourseTable"
                        @edit-emit="editPayment" :actions="tableActions"
                        :refresh-func="async () => { await loadPaymentByCourse(); return true }" @delete-emit="delGrade"
                        :paginate-page-size="limitLoadPayments" :paginate-total="countTotPaymentsForByCourse"
                        @load-page-emit="loadPaymentByCourse" :current-sorting="{ column: 'ID', direc: 'asc' }"
                        @sort-by="(col, dir) => {
                            setSorting(col, dir); loadPaymentByCourse();
                        }" :filters="tableFilters" @filter-values="(val) => {
                            loadPaymentByCourse(undefined, undefined, val)
                        }" />
                </div>
            </tab>
        </tabs>
    </div>
</template>