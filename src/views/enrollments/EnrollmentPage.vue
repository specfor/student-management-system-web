<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { getCourses } from '@/apiConnections/courses';
import { deleteEnrollment, enrollCourse, getEnrollments, updateEnrollment } from '@/apiConnections/enrollments';
import { getStudents } from '@/apiConnections/students';
import TableComponent, { type Filter, type TableActionType, type TableColumns, type tableRowItem } from '@/components/TableComponent.vue';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { PencilSquareIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/solid';
import { ref, type Ref } from 'vue';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { getRouteQuery, setRoute, setRouteQuery } from '@/utils/routeHelpers';
import { getStudentPayments } from '@/apiConnections/payments';
import { getAttendace } from '@/apiConnections/attendance';
import type { Course } from '@/types/courseTypes';
import type { Student } from '@/types/studentTypes';
import type { StudentPayment } from '@/types/paymentTypes';
import type { Attendance } from '@/types/attendanceTypes';
import type { Enrollment, EnrollmentPriceAdjustment, EnrollmentStatus } from '@/types/enrollmentTypes';
import { getInstructors } from '@/apiConnections/instructors';
import type { Instructor } from '@/types/InstructorTypes';

const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()
const confirmationForm = useConfirmationFormsStore()

const selectedCourseId = ref(0)
const selectedStudentId = ref(0)
const selectedInstructorId = ref(0)

let studentOptionFields: Ref<{ text: string, value: any }[]> = ref([])
let instructorOptionFields: Ref<{ text: string, value: any }[]> = ref([])
let courseOptionFields: Ref<{ text: string, value: any }[]> = ref([])

let enrollments: Enrollment[] = []
const enrollmentsDataForTable: Ref<any[]> = ref([])

const tableActions: TableActionType[] = [
    { renderAsRouterLink: false, type: 'icon', emit: 'ShowMore', icon: MagnifyingGlassIcon, css: 'fill-blue-600 w-5' },
    { renderAsRouterLink: false, type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' },
]
const tableColumns: TableColumns[] = [
    { label: 'ID', sortable: false }, { label: 'Student Name' }, { label: 'Course Name' },
    { label: 'Price Concession' }, { label: 'Status' }, { label: 'This Month Payment' }, { label: 'This Month Attendance' }]

const tableFilters: Filter[] = [{ name: 'student_id', label: 'Student', type: 'select', options: studentOptionFields.value },
{ name: 'course_id', type: 'select', label: 'Course', options: courseOptionFields.value },
{ name: 'instructor_id', type: 'select', label: 'Instructor', options: instructorOptionFields.value },]


const limitLoadEnrollments = 30
const countTotEnrollments = ref(0)

let courses: Course[] = []
let students: Student[] = []
let payments: StudentPayment[] = []
let attendance: Attendance[] = []


function checkRequiredDataAvailability() {
    return new Promise((resolve) => {
        let id = setInterval(() => {
            if (payments.length !== 0) { //&& attendance.length !== 0
                clearInterval(id)
                resolve(true)
            }
        }, 100)
    })
}

// watch(selectedInstructorId, () => {
//     setRouteQuery('i_id', selectedInstructorId.value)
//     lastLoadSettings.lastUsedIndex = 0
//     loadEnrollments()
// })

// watch(selectedStudentId, () => {
//     setRouteQuery('s_id', selectedStudentId.value)
//     lastLoadSettings.lastUsedIndex = 0
//     loadEnrollments();
// })

// watch(selectedCourseId, () => {
//     setRouteQuery('c_id', selectedCourseId.value)
//     lastLoadSettings.lastUsedIndex = 0
//     loadEnrollments()
// })

let lastLoadSettings: {
    lastUsedIndex: number, orderBy: string, orderDirec: 'asc' | 'desc',
    filters?: { instructor_id?: number, course_id?: number, student_id?: number, }
} = { lastUsedIndex: 0, orderBy: '', orderDirec: 'asc', filters: {} }

// let routeStudentId = getRouteQuery('s_id')
// if (routeStudentId !== null) {
//     lastLoadSettings.filters!.student_id = Number(routeStudentId)
// }
// let routeCourseId = getRouteQuery('c_id')
// if (routeCourseId !== null) {
//     lastLoadSettings.filters!.course_id = Number(routeCourseId)
// }
// let routeInstructorId = getRouteQuery('i_id')
// if (routeInstructorId !== null) {
//     lastLoadSettings.filters!.instructor_id = Number(routeInstructorId)
// }

async function loadEnrollments(startIndex?: number, filters?: any) {
    if (startIndex === undefined)
        startIndex = lastLoadSettings.lastUsedIndex
    else
        lastLoadSettings.lastUsedIndex = startIndex

    if (filters)
        lastLoadSettings.filters = filters

    let resp = await getEnrollments(startIndex, limitLoadEnrollments, { filters: lastLoadSettings.filters })
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    enrollments = resp.data.enrollments
    countTotEnrollments.value = resp.data.tot_count
    enrollmentsDataForTable.value = []

    await checkRequiredDataAvailability()

    resp.data.enrollments.forEach((enrollment: Enrollment) => {
        let paid = { type: 'colorTag', text: 'Not Paid', css: 'bg-red-200 text-red-800' }
        let payment = payments.find(p => p.enrollment.id == enrollment.id)
        if (payment)
            paid = { type: 'colorTag', text: 'Paid', css: 'bg-green-200 text-green-800' }

        let dayCount = attendance.filter(a => a.course_id == enrollment.course?.id && a.student_id == enrollment.student?.id).length
        let attend = `${dayCount} day`
        if (dayCount !== 1) attend += 's'

        let priceOffer = 'NOT GIVEN'
        if (enrollment.price_adjustments !== null) {
            if (enrollment.price_adjustments.type === 'fixed')
                priceOffer = enrollment.price_adjustments.amount + ' fixed reduction'
            else
                priceOffer = enrollment.price_adjustments.percentage + '% reduction'
        }
        let lastStatus = enrollment.status[enrollment.status.length - 1];
        let status = { type: 'colorTag', text: lastStatus.type, css: 'bg-green-200 text-green-800' }
        if (lastStatus.type === 'discontinued')
            status = { type: 'colorTag', text: lastStatus.type, css: 'bg-red-200 text-red-800' }
        else if (lastStatus.type === 'pending')
            status = { type: 'colorTag', text: lastStatus.type, css: 'bg-yellow-200 text-yellow-800' }
        else if (lastStatus.type === 'completed')
            status = { type: 'colorTag', text: lastStatus.type, css: 'bg-blue-200 text-blue-800' }

        let student: tableRowItem = "Deleted"
        if (enrollment.student)
            student = { type: 'textWithLink', text: enrollment.student.name, url: `/students/${enrollment.student.id}/view` }
        let course: tableRowItem = "Deleted"
        if (enrollment.course) {
            course = enrollment.course.name
            if (enrollment.course.group_name)
                course += " - " + enrollment.course.group_name
            // course = { type: 'textWithLink', text: course, url: `/courses/${enrollment.course.id}/view` }
        }
        enrollmentsDataForTable.value.push([enrollment.id, student, course, priceOffer, status, paid, attend])
    });
}
loadEnrollments()


async function initLoadCourses() {
    let resp = await getCourses()
    if (resp.status === 'error') {
        return
    }
    Object.entries(resp.data.courses as Course[][]).forEach(item => {
        item[1].forEach(course => {
            courses.push(course)
            let courseName = course.name
            if (course.group_name)
                courseName += " - " + course.group_name
            courseOptionFields.value.push({ text: courseName, value: course.id })
        })
    })
}
async function initLoadStudents() {
    let resp = await getStudents(undefined, undefined, { sort: { by: 'name', direction: 'asc' } })
    if (resp.status === 'error')
        return

    students = resp.data.students
    students.forEach(student => {
        studentOptionFields.value.push({ text: student.name, value: student.id })
    })
}
async function initLoadInstructors() {
    let resp = await getInstructors(undefined, undefined, { sort: { by: 'name', direction: 'asc' } })
    if (resp.status === 'error')
        return

    let instructors: Instructor[] = resp.data.instructors
    instructors.forEach(instructor => {
        instructorOptionFields.value.push({ text: instructor.name, value: instructor.id })
    })
}
async function initLoadPayments() {
    let resp = await getStudentPayments(undefined, undefined, { filters: { date_from: (new Date()).getFullYear() + '-' + ('0' + ((new Date()).getMonth() + 1)).slice(-2) } })
    if (resp.status === 'error')
        return

    payments = resp.data.payments
}
async function initLoadAttendance() {
    let resp = await getAttendace(undefined, undefined, { filters: { date_from: (new Date()).getFullYear() + '-' + ('0' + ((new Date()).getMonth() + 1)).slice(-2) + '-01' } })
    if (resp.status === 'error')
        return

    attendance = resp.data.records
}

initLoadInstructors()
initLoadCourses()
initLoadStudents()
initLoadAttendance()
initLoadPayments()

async function addNewEnrollment() {
    dataEntryForm.newDataEntryForm('Enroll to Course', 'Enroll', [
        { name: 'course_id', type: 'select', text: 'Course', options: courseOptionFields.value, required: true },
        { name: 'student_id', type: 'select', text: 'Student', options: studentOptionFields.value, required: true },
        { type: 'heading', text: 'Any price concession? (optional)' },
        {
            name: 'discount_type', type: 'select', text: 'Concession Type', options: [
                { text: 'Fixed', value: 'fixed' },
                { text: 'Percentage', value: 'percentage' },
            ]
        },
        { name: 'amount', type: 'number', text: 'Amount / Percentage' },
        { name: 'reason', type: 'text', text: 'Reason' },
    ])

    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await enrollCourse(results.data['course_id'] as number, results.data['student_id'] as number,
            results.data['discount_type'] as EnrollmentPriceAdjustment['type'], results.data['amount'] as number, results.data['reason'] as string)
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
            loadEnrollments()
            break
        }
    }
}

async function editEnrollment(id: number) {
    let enrollment = null

    enrollment = enrollments.find(g => g.id === id) as Enrollment

    dataEntryForm.newDataEntryForm('Update Enrollment', 'Update', [
        { name: 'id', type: 'text', text: 'Enrollment ID', disabled: true, value: enrollment.id },

        { type: 'heading', text: 'Status' },
        {
            name: 'status', type: 'select', text: 'Select', value: enrollment.status[enrollment.status.length - 1].type, options: [
                { text: 'Active', value: 'active' },
                { text: 'Pending', value: 'pending' },
                { text: 'Discontinued', value: 'discontinued' },
                { text: 'Completed', value: 'completed' },
            ],
        },
        { name: 'status_reason', type: 'textarea', text: 'Reason for change (for later reference)' },

        { type: 'heading', text: 'Any price concession? (optional)' },
        {
            name: 'discount_type', type: 'select', text: 'Concession Type', value: enrollment.price_adjustments ? enrollment.price_adjustments.type : 'none', options: [
                { text: 'None', value: 'none' },
                { text: 'Fixed', value: 'fixed' },
                { text: 'Percentage', value: 'percentage' },
            ]
        },
        {
            name: 'amount', type: 'number', text: 'Amount / Percentage',
            value: enrollment.price_adjustments ? (enrollment.price_adjustments.type === 'fixed' ? enrollment.price_adjustments.amount : enrollment.price_adjustments.percentage) : ''
        },
        { name: 'reason', type: 'text', text: 'Reason', value: enrollment.price_adjustments ? enrollment.price_adjustments.reason : '' },])

    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await updateEnrollment(id, false, results.data['discount_type'] as EnrollmentPriceAdjustment['type'],
            results.data['amount'] as number, results.data['reason'] as string, results.data['status'] as EnrollmentStatus['type'], results.data['status_reason'] as string)
        if (resp.status === 'error') {
            if (resp.data.type === 'user_error')
                Object.entries(resp.data.messages).forEach(msg => {
                    let err = ""
                    if (Array.isArray(msg[1]) && msg[1] !== null)
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
            loadEnrollments()
            break
        }
    }
}

async function delEnrollment(ids: number[]) {
    let confirmed = await confirmationForm.newConfirmationForm("Confirm Deletion", "Are you sure you want to delete these enrollments with IDs: " + ids.join(', ') + "?")
    if (!confirmed)
        return

    ids.forEach(async id => {
        let resp = await deleteEnrollment(id)
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured deleting grade.', resp.message, 'error')
            return
        }
        alertStore.insertAlert('Action completed.', resp.message)
    });
    loadEnrollments()
}

function showMoreInfo(id: number) {
    setRoute(`enrollments/${id}/view`)
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-10">
            <h4 class="font-semibold text-3xl">Course Enrollments</h4>
            <NewItemButton text="Enroll a Student" :on-click="addNewEnrollment" />
        </div>
        <div class="mb-10">
            <TableComponent :table-columns="tableColumns" :table-rows="enrollmentsDataForTable"
                @edit-emit="editEnrollment" :actions="tableActions"
                :refresh-func="async () => { await loadEnrollments(); return true }" @delete-emit="delEnrollment"
                @load-page-emit="loadEnrollments" :paginate-page-size="limitLoadEnrollments"
                :paginate-total="countTotEnrollments" @show-more="showMoreInfo" :filters="tableFilters" @filter-values="(val) => {
                    loadEnrollments(undefined, val)
                }" />
        </div>

    </div>
</template>