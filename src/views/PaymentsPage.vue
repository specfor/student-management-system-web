<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { getPayments, refundPayment } from '@/apiConnections/payments';
import TableComponent, { type TableActionType } from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { PencilSquareIcon } from '@heroicons/vue/24/solid';
import { ref, type Ref } from 'vue';
import PaginateComponent from '@/components/PaginateComponent.vue';
import CourseSelector from '@/components/dataSelectors/CourseSelector.vue';
import StudentSelector from '@/components/dataSelectors/StudentSelector.vue';

const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()

const tabSelectMode: Ref<any> = ref(null)

const paymentDatByCourseTable: Ref<any[]> = ref([])
const paymentDatByStudentTable: Ref<any[]> = ref([])
const tableActions: TableActionType[] = [
    { renderAsRouterLink: false, type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]

const limitLoadPayments = 30
const countTotPaymentsForByCourse = ref(0)
const countTotPaymentsForByStudent = ref(0)

async function loadPayment(startIndex = 0, courseId = 0, studentId = 0) {
    let params: any = {}
    if (courseId !== 0)
        params.course_id = courseId
    if (studentId !== 0)
        params.student_id = studentId

    let resp = await getPayments(startIndex, limitLoadPayments, params)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    if (tabSelectMode.value.activeTabHash == '#by-student') {
        countTotPaymentsForByStudent.value = resp.data.tot_count
        paymentDatByStudentTable.value = []
        let payments: Payment[] = resp.data.payments
        payments.forEach(payment => {
            paymentDatByStudentTable.value.push([payment.id, payment.payment_for, payment.amount,
            payment.enrollment.student ? payment.enrollment.student.name : 'Deleted Student', payment.enrollment.course ? payment.enrollment.course.name : 'Deleted Course',
            payment.payment_method, payment.refunded ? 'Yes' : 'No'])
        });
    } else {
        countTotPaymentsForByCourse.value = resp.data.tot_count
        paymentDatByCourseTable.value = []
        let payments: Payment[] = resp.data.payments
        payments.forEach(payment => {
            paymentDatByCourseTable.value.push([payment.id, payment.payment_for, payment.amount,
            payment.enrollment.student ? payment.enrollment.student.name : 'Deleted Student', payment.enrollment.course ? payment.enrollment.course.name : 'Deleted Course',
            payment.payment_method, payment.refunded ? 'Yes' : 'No'])
        });
    }
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

function setCourse(course: Course) {
    loadPayment(0, course.id!)
}
function setStudent(student: Student) {
    loadPayment(0, 0, student.id!)
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-10">
            <h4 class="font-semibold text-3xl">Payments</h4>
        </div>

        <tabs nav-class="flex border-b-2 pb-[6px] justify-center" nav-item-link-class="border px-10 py-2 font-semibold"
            nav-item-link-active-class="bg-slate-200" panels-wrapper-class="pt-10" ref="tabSelectMode">
            <tab name="by Student">
                <div class="mb-5">
                    <StudentSelector @student="setStudent" />
                </div>
                <TableComponent
                    :table-columns="['ID', 'Payment For', 'Amount', 'Student', 'Course', 'Method', 'Refunded']"
                    :table-rows="paymentDatByStudentTable" @edit-emit="editPayment" :actions="tableActions"
                    :refresh-func="async () => { await loadPayment(); return true }" @delete-emit="delGrade" />

                <div class="flex justify-center mt-4 mb-10">
                    <PaginateComponent :total-count="countTotPaymentsForByStudent" :page-size="limitLoadPayments"
                        @load-page-emit="loadPayment" />
                </div>
            </tab>

            <tab name="by Course">
                <div class="mb-5">
                    <CourseSelector @course="setCourse" />
                </div>
                <TableComponent
                    :table-columns="['ID', 'Payment For', 'Amount', 'Student', 'Course', 'Method', 'Refunded']"
                    :table-rows="paymentDatByCourseTable" @edit-emit="editPayment" :actions="tableActions"
                    :refresh-func="async () => { await loadPayment(); return true }" @delete-emit="delGrade" />

                <div class="flex justify-center mt-4 mb-10">
                    <PaginateComponent :total-count="countTotPaymentsForByCourse" :page-size="limitLoadPayments"
                        @load-page-emit="loadPayment" />
                </div>
            </tab>
        </tabs>
    </div>
</template>