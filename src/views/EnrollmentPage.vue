<!-- eslint-disable no-constant-condition -->
<script setup>
import { getCourses } from '@/apiConnections/courses';
import { enrollCourse, getEnrollmentsOfCourse, updateEnrollment } from '@/apiConnections/enrollments';
import { getStudents } from '@/apiConnections/students';
import TableComponent from '@/components/TableComponent.vue';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { PencilSquareIcon } from '@heroicons/vue/24/solid';
import { ref, watch } from 'vue';

const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()

const selectedCourseForTable = ref(0)
const selectedCourseData = ref([])
let courses = []

const enrollmentsDataForTable = ref([])
let enrollmentsData = []
const tableActions = [
    { type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]

let courseIdToFetchEnrollments = null;

async function loadEnrollments() {
    if (courseIdToFetchEnrollments === null)
        return

    let resp = await getEnrollmentsOfCourse(courseIdToFetchEnrollments)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    enrollmentsData = resp.data.enrollments
    enrollmentsDataForTable.value = []
    resp.data.enrollments.forEach(enrollment => {
        let priceOffer = 'NOT GIVEN'
        if (enrollment.price_adjustments !== null) {
            if (enrollment.price_adjustments.type === 'fixed')
                priceOffer = enrollment.price_adjustments.amount + ' fixed reduction'
            else
                priceOffer = enrollment.price_adjustments.percentage + '% reduction'
        }
        enrollmentsDataForTable.value.push([enrollment.id, enrollment.student.name, enrollment.suspended, priceOffer])
    });
}

watch(selectedCourseForTable, async (courseId) => {
    courseIdToFetchEnrollments = courseId
    loadEnrollments()
    selectedCourseData.value = courses.find(c => c.id == courseId)
})

let coursesOptionFields = ref([])
let studentOptionFields = []

async function init() {
    let resp = await getCourses()
    if (resp.status === 'error') {
        return
    }
    courses = resp.data.courses
    courses.forEach(course => {
        coursesOptionFields.value.push({ text: course.name, value: course.id })
    });

    resp = await getStudents()
    if (resp.status === 'error')
        return

    let students = resp.data.students
    students.forEach(student => {
        studentOptionFields.push({ text: student.name, value: student.id })
    })
}

init()

async function addNewEnrollment() {
    dataEntryForm.newDataEntryForm('Enroll to Course', 'Enroll', [
        { name: 'course_id', type: 'select', text: 'Course', options: coursesOptionFields, value: courseIdToFetchEnrollments, required: true },
        { name: 'student_id', type: 'select', text: 'Student', options: studentOptionFields, required: true },
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

        let resp = await enrollCourse(results.data['course_id'], results.data['student_id'], results.data['discount_type'], results.data['amount'], results.data['reason'])
        if (resp.status === 'error') {
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

async function editEnrollment(id) {
    let enrollment = enrollmentsData.find(g => g.id === id)

    dataEntryForm.newDataEntryForm('Update Enrollment', 'Update', [
        { name: 'id', type: 'text', text: 'Enrollment ID', disabled: true, value: enrollment.id },
        {
            name: 'suspend', type: 'select', text: 'Suspend Student', value: enrollment.suspended, options: [
                { text: 'Yes', value: true },
                { text: 'No', value: false }
            ],
        },
        { type: 'heading', text: 'Any price concession? (optional)' },
        {
            name: 'discount_type', type: 'select', text: 'Concession Type', value: enrollment.price_adjustments ? enrollment.price_adjustments.type : '', options: [
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

        let resp = await updateEnrollment(id, results.data['suspend'] === 'true', results.data['discount_type'], results.data['amount'], results.data['reason'])
        if (resp.status === 'error') {
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

async function delEnrollment() {
    alertStore.insertAlert('Can not delete.', 'Enrollments can not be deleted.', 'error')
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-16">
            <h4 class="font-semibold text-3xl">Course Enrollments</h4>
            <NewItemButton text="Enroll a Student" :on-click="addNewEnrollment" />
        </div>
        <div class="flex">
            <h4 class="mr-5 font-semibold">Select a Course</h4>
            <select class="border w-[300px] border-slate-400 rounded-md hover:border-slate-700 px-3 py-0.5
                             hover:bg-slate-100" name="selected-enrollment" :value="selectedCourseForTable"
                @input="(event) => { selectedCourseForTable = event.target.value }">
                <option class="" v-for="option in coursesOptionFields" :value="option['value']" :key="option['value']">
                    {{ option['text'] }}
                </option>
            </select>
        </div>
        <div class="mb-10 grid grid-cols-3 gap-x-10 border rounded-xl py-3 px-10 mt-4 text-slate-600">
            <div class="">
                <h1 class="font-semibold text-lg">Basic Info</h1>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Instructor</h4>
                    <h4>{{ selectedCourseData.id ? selectedCourseData.instructor.name : '' }}</h4>
                </div>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Enrollment Open</h4>
                    <h4>{{ selectedCourseData.id ? (selectedCourseData.enrollment_open ? 'Open' : 'Closed') : '' }}
                    </h4>
                </div>
            </div>
            <div>
                <h1 class="font-semibold text-lg">Schedule</h1>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Day</h4>
                    <h4>{{ selectedCourseData.id ? selectedCourseData.schedule[0].day : '' }}</h4>
                </div>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Time</h4>
                    <h4>{{ selectedCourseData.id ? selectedCourseData.schedule[0].time : '' }}</h4>
                </div>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Venue / Hall</h4>
                    <h4>{{ selectedCourseData.id ? selectedCourseData.schedule[0].venue : '' }}</h4>
                </div>
            </div>
            <div>
                <h1 class="font-semibold text-lg">Course Fee</h1>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Fee Type</h4>
                    <h4>{{ selectedCourseData.id ? selectedCourseData.fee.type : '' }}</h4>
                </div>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Fee</h4>
                    <h4>{{ selectedCourseData.id ? selectedCourseData.fee.amount : '' }}</h4>
                </div>
            </div>
        </div>
        <TableComponent :table-columns="['ID', 'Student Name', 'Suspended', 'Price Concession']"
            :table-rows="enrollmentsDataForTable" @edit-emit="editEnrollment" :actions="tableActions"
            :refresh-func="async () => { await loadEnrollments(); return true }" @delete-emit="delEnrollment" />
    </div>
</template>