<!-- eslint-disable no-constant-condition -->
<script setup>
import { sendMarkAttendance } from '@/apiConnections/attendance';
import { getCourses } from '@/apiConnections/courses';
import { getStudentEnrollmentOfCourse } from '@/apiConnections/enrollments';
import { createPayment } from '@/apiConnections/payments';
import { downloadStudentImage, getStudents } from '@/apiConnections/students';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { ref, watch } from 'vue';

const alertStore = useAlertsStore()
const dataEntryForm = useDataEntryFormsStore()

let coursesOptionFields = ref([])
let courseGroupOptionFields = ref([])
let studentOptionFields = ref([])
let courses = []
let students = []

async function init() {
    enrollStatusText.value = 'Select a Course & a Student'
    let resp = await getCourses()
    if (resp.status === 'error') {
        return
    }

    Object.entries(resp.data.courses).forEach(item => {
        courseGroupOptionFields.value.push({ value: item[0], text: item[0] })
        item[1].forEach(course => {
            courses.push(course)
        })
    })

    resp = await getStudents()
    if (resp.status === 'error')
        return

    students = resp.data.students
    students.forEach(student => {
        studentOptionFields.value.push({ text: student.name, value: student.id })
    })
}

const selectedCourseId = ref(0)
const selectedCourseGroup = ref('')
const selectedCourseData = ref([])

const selectedStudentId = ref(0)
const selectedStudentData = ref([])

const studentImageUrl = ref(null)

watch(selectedCourseGroup, async (gName) => {
    feeToPay.value = ''
    coursesOptionFields.value = []
    let groups = courses.filter(c => c.name == gName)
    if (groups.length === 1) {
        selectedCourseId.value = groups[0].id
    } else {
        selectedCourseId.value = 0
        selectedCourseData.value = []
        groups.forEach(group => {
            coursesOptionFields.value.push({ value: group.id, text: group.group_name ? group.group_name : 'No Name' })
        })
    }
})
watch(selectedCourseId, async (courseId) => {
    if (courseId === 0) return
    selectedCourseData.value = courses.find(c => c.id == courseId)
    checkEnrolled()
})
watch(selectedStudentId, async (studentId) => {
    checkEnrolled()
    selectedStudentData.value = students.find(s => s.id == studentId)

    studentImageUrl.value = null
    let resp = await downloadStudentImage(studentId)
    if (resp.status === 'error') {
        studentImageUrl.value = '/default-profile.png'
        return
    }

    studentImageUrl.value = URL.createObjectURL(resp.data.file)
})

function checkEnrolled() {
    if (selectedCourseId.value === 0 || selectedStudentId.value === 0)
        return

    enrollActionsEnabled.value = false
    enrollmentData.value = { loading: true }

    loadStudentEnrollmentOfCourse()
}

const enrollmentData = ref({})

async function loadStudentEnrollmentOfCourse() {
    let resp = await getStudentEnrollmentOfCourse(selectedCourseId.value, selectedStudentId.value)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }
    enrollmentData.value = resp.data
    calculateFee()
}

async function markPayment() {
    enrollActionsEnabled.value = false
    let cName = ''
    if (selectedCourseData.value['group_name'] === null)
        cName = selectedCourseData.value['id'] + ' - ' + selectedCourseData.value['name']
    else
        cName = selectedCourseData.value['id'] + ' - ' + selectedCourseData.value['name'] + ' - ' + selectedCourseData.value['group_name']

    let sName = selectedStudentData.value['id'] + ' - ' + selectedStudentData.value['name']

    let timeP = { name: 'time', type: 'month', text: 'Month', value: new Date().toJSON().slice(0, 7) }
    if (selectedCourseData.value['fee']['type'] === 'daily')
        timeP = { name: 'time', type: 'date', text: 'Day', value: new Date().toJSON().slice(0, 10) }
    else if (selectedCourseData.value['fee']['type'] === 'onetime')
        timeP = { type: 'message', text: 'Course fee is a one time fee.' }

    dataEntryForm.newDataEntryForm('Payment Confirmation', 'Confirm', [
        { type: 'heading', text: 'Check all below details!' },
        { name: 'course', type: 'text', text: 'Course', value: cName, disabled: true },
        { name: 'student', type: 'text', text: 'Student', value: sName, disabled: true },
        { name: 'amount', type: 'text', text: 'Amount', value: feeToPay.value, disabled: true },
        { type: 'heading', text: 'Select the time period of the payment' },
        timeP
    ], { allowSubmit: true })
    let confirmed = await dataEntryForm.waitForSubmittedData()
    dataEntryForm.finishSubmission()
    if (!confirmed.submitted) {
        enrollActionsEnabled.value = true
        return
    }

    let resp = await createPayment(enrollmentData.value.enrollment.id, feeToPay.value)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
    } else {
        alertStore.insertAlert('Action completed.', resp.message)
    }
    enrollActionsEnabled.value = true
}

async function markAttendance() {
    enrollActionsEnabled.value = false
    let resp = await sendMarkAttendance(selectedCourseId.value, selectedStudentId.value)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
    } else {
        alertStore.insertAlert('Action completed.', resp.message)
    }
    enrollActionsEnabled.value = true
}

const enrollActionsEnabled = ref(false)
const enrollStatusText = ref('')

watch(enrollmentData, () => {
    if (enrollmentData.value.loading) {
        enrollStatusText.value = 'Loading...'
        return
    }

    if (enrollmentData.value.enrollment)
        if (enrollmentData.value.enrollment.suspended) {
            enrollStatusText.value = 'Student is Banned from the Course'
            return
        }

    if (enrollmentData.value.enrolled) {
        enrollActionsEnabled.value = true
        enrollStatusText.value = 'Enrolled With the Course'
    } else
        enrollStatusText.value = 'Not Enrolled With the Course'
})

const feeToPay = ref('')

function calculateFee() {
    let courseFee = courses.find(c => c.id == selectedCourseId.value).fee.amount

    let discount = 0

    if (enrollmentData.value.enrollment.price_adjustments)
        if (enrollmentData.value.enrollment.price_adjustments.type === 'fixed')
            discount = enrollmentData.value.enrollment.price_adjustments.amount
        else
            discount = (courseFee * enrollmentData.value.enrollment.price_adjustments.percentage) / 100

    feeToPay.value = courseFee - discount
}

init()
</script>

<template>
    <div class="container">
        <div class="flex">
            <h4 class="mr-5 font-semibold">Select a Course</h4>
            <select class="border w-[300px] border-slate-400 rounded-md hover:border-slate-700 px-3 py-0.5
                             hover:bg-slate-100" name="selected-enrollment" :value="selectedCourseGroup"
                @input="(event) => { selectedCourseGroup = event.target.value }">
                <option class="" v-for="option in courseGroupOptionFields" :value="option['value']"
                    :key="option['value']">
                    {{ option['text'] }}
                </option>
            </select>

            <h4 class="mr-5 font-semibold ml-10" v-show="coursesOptionFields.length !== 0">Select a Group </h4>
            <select v-show="coursesOptionFields.length !== 0" class="border w-[300px] border-slate-400 rounded-md hover:border-slate-700 px-3 py-0.5
                             hover:bg-slate-100" name="selected-enrollment" :value="selectedCourseId"
                @input="(event) => { selectedCourseId = event.target.value }">
                <option class="" v-for="option in coursesOptionFields" :value="option['value']" :key="option['value']">
                    {{ option['text'] }}
                </option>
            </select>
        </div>
        <div class="mb-10 grid grid-cols-3 gap-x-10 border rounded-xl py-3 px-10 mt-4 text-slate-800">
            <div class="">
                <h1 class="font-semibold text-lg">Basic Info</h1>
                <div class="grid grid-cols-2 ml-5">
                    <h4>ID</h4>
                    <h4>{{ selectedCourseData.id ? selectedCourseData.id : '' }}</h4>
                </div>
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
        <div class="grid grid-cols-2 gap-x-10">
            <div>
                <div class="flex">
                    <h4 class="mr-5 font-semibold">Select a Student</h4>
                    <select class="border w-[300px] border-slate-400 rounded-md hover:border-slate-700 px-3 py-0.5
                             hover:bg-slate-100" name="selected-enrollment" :value="selectedStudentId"
                        @input="(event) => { selectedStudentId = event.target.value }">
                        <option class="" v-for="option in studentOptionFields" :value="option['value']"
                            :key="option['value']">
                            {{ option['text'] }}
                        </option>
                    </select>
                </div>
                <div class="mb-10 border rounded-xl py-3 px-10 mt-4 text-slate-800">
                    <h1 class="font-semibold text-lg">Basic Info</h1>
                    <div class="grid grid-cols-2 ml-5">
                        <h4>ID</h4>
                        <h4>{{ selectedStudentData.id ? selectedStudentData.id : '' }}</h4>
                    </div>
                    <div class="grid grid-cols-2 ml-5">
                        <h4>Name</h4>
                        <h4>{{ selectedStudentData.id ? selectedStudentData.name : '' }}</h4>
                    </div>
                    <div class="grid grid-cols-2 ml-5">
                        <h4>Grade</h4>
                        <h4>{{ selectedStudentData.id ? selectedStudentData.grade.name : '' }}</h4>
                    </div>
                    <div class="grid grid-cols-2 ml-5">
                        <h4>School</h4>
                        <h4>{{ selectedStudentData.id ? selectedStudentData.school : '' }}</h4>
                    </div>
                    <div class="flex flex-col items-center mt-3">
                        <div v-show="studentImageUrl === null"
                            class="flex items-center justify-center w-[300px] h-[300px]">
                            <div v-show="selectedStudentId !== 0"
                                class="animate-pulse bg-gray-300 w-full h-full rounded-lg flex items-center justify-center">
                                <h4 class="text-2xl text-slate-700">Loading</h4>
                            </div>
                            <div v-show="selectedStudentId === 0"
                                class="bg-gray-300 w-full h-full rounded-lg flex items-center justify-center">
                                <h4 class="text-2xl text-slate-700">Select a Student</h4>
                            </div>
                        </div>
                        <div v-show="studentImageUrl !== null" class="w-[300px]">
                            <img :src="studentImageUrl" alt="student image">
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex flex-col items-center">
                <div class="py-3 w-full text-center text-xl"
                    :class="enrollmentData.loading ? 'bg-slate-400' : (enrollActionsEnabled ? 'bg-blue-500' : 'bg-red-500')">
                    <h3 class="text-white font-bold">{{ enrollStatusText }}</h3>
                </div>
                <button :disabled="!enrollActionsEnabled" @click="markPayment"
                    class="mt-10 border-2 rounded-xl w-[300px] bg-green-400 hover:bg-green-600 py-8 items-center disabled:bg-slate-200 flex flex-col shadow-lg">
                    <h3 class="font-semibold text-2xl">Mark Payment</h3>
                    <div class="gap-x-3 mt-3 text-lg font-bold text-white">
                        <h5>{{ feeToPay !== '' ? 'Rs. ' + feeToPay : '' }}</h5>
                    </div>
                </button>
                <button :disabled="!enrollActionsEnabled" @click="markAttendance"
                    class="mt-10 border-2 rounded-xl w-[300px] bg-amber-400 hover:bg-amber-600 py-8 text-center disabled:bg-slate-200 shadow-lg">
                    <h3 class="font-semibold text-2xl">Mark Attendance</h3>
                </button>
            </div>
        </div>
    </div>
</template>