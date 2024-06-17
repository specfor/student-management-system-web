<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { getCourses } from '@/apiConnections/courses';
import { enrollCourse, getEnrollmentsOfCourse, updateEnrollment } from '@/apiConnections/enrollments';
import { getStudents } from '@/apiConnections/students';
import TableComponent from '@/components/TableComponent.vue';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { PencilSquareIcon } from '@heroicons/vue/24/solid';
import { ref, watch } from 'vue';
import PaginateComponent from '@/components/PaginateComponent.vue';
import SelectionBox from '@/components/primary/SelectionBox.vue';


const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()

const selectedCourseForTable = ref(0)
const selectedCourseGroup = ref('')
const selectedCourseData = ref([])
let courseGroupOptionFields = ref([])

let courses = []

const enrollmentsDataForTable = ref([])
let enrollmentsData = []
const tableActions = [
    { type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]

let courseIdToFetchEnrollments = null;


const limitLoadEnrollments = 30
const countTotEnrollments = ref(0)

async function loadEnrollments(startIndex = 0) {
    if (courseIdToFetchEnrollments === null)
        return

    let resp = await getEnrollmentsOfCourse(courseIdToFetchEnrollments, startIndex, limitLoadEnrollments)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    enrollmentsData = resp.data.enrollments
    countTotEnrollments.value = resp.data.tot_count

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


watch(selectedCourseGroup, async (gName) => {
    selectedCourseData.value = []
    coursesOptionFields.value = []
    let groups = courses.filter(c => c.name == gName)
    if (groups.length === 1) {
        selectedCourseForTable.value = groups[0].id
    } else {
        selectedCourseForTable.value = 0
        groups.forEach(group => {
            coursesOptionFields.value.push({ value: group.id, text: group.group_name ? group.group_name : 'No Name' })
        })
    }
})
watch(selectedCourseForTable, async (courseId) => {
    if (courseId === 0) return
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
    Object.entries(resp.data.courses).forEach(item => {
        courseGroupOptionFields.value.push({ value: item[0], text: item[0] })
        item[1].forEach(course => {
            courses.push(course)
        })
    })

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
    let courseOptions = []
    let selectedCourseName = courses.find(c => c.id == selectedCourseForTable.value).name
    let coursesWithSameName = courses.filter(c => c.name === selectedCourseName)
    coursesWithSameName.forEach(course => {
        courseOptions.push({ text: selectedCourseName + ' - ' + (course.group_name ? course.group_name : 'No Name'), value: course.id })
    })
    dataEntryForm.newDataEntryForm('Enroll to Course', 'Enroll', [
        { name: 'course_id', type: 'select', text: 'Course', options: courseOptions, value: courseIdToFetchEnrollments, required: true },
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
        <div class="flex justify-between items-center mb-10">
            <h4 class="font-semibold text-3xl">Course Attendance</h4>
        </div>

        <tabs nav-class="flex border-b-2 pb-[6px] justify-center" nav-item-link-class="border px-10 py-2 font-semibold"
            nav-item-link-active-class="bg-slate-200" panels-wrapper-class="pt-10">
            <tab name="by Student">
                <div class="flex justify-between items-center">
                    <div class="flex items-center mr-5">
                        <h4 class="mr-5 font-semibold">Select a Student</h4>
                        <SelectionBox :options="studentOptionFields" :value="selectedStudent"
                            @input="(val) => { selectedStudent = val }" class="w-[300px] mr-5" />
                    </div>
                    <NewItemButton text="Enroll a Student" :on-click="addNewEnrollment"
                        :disabled="selectedStudent === 0" />
                </div>
                <div class="mb-10 grid grid-cols-3 gap-x-10 border rounded-xl py-3 px-10 mt-4 text-slate-600">
                    <div class="justify-self-center">
                        <img :src="selectedStudentImageUrl" alt="student photo" class="object-cover w-[100px]">
                    </div>
                    <div class="col-span-2">
                        <h1 class="font-semibold text-lg">Student Info</h1>
                        <div class="grid grid-cols-2 ml-5">
                            <h4>Student Id</h4>
                            <h4>{{ selectedStudentData.custom_id }}</h4>
                        </div>
                        <div class="grid grid-cols-2 ml-5">
                            <h4>Name</h4>
                            <h4>{{ selectedStudentData.name }}</h4>
                        </div>
                        <div class="grid grid-cols-2 ml-5">
                            <h4>Grade</h4>
                            <h4>{{ selectedStudentData.grade ? selectedStudentData.grade.name : '' }}</h4>
                        </div>
                    </div>
                </div>
                <TableComponent :table-columns="['ID', 'Course Name', 'Suspended', 'Price Concession']"
                    :table-rows="enrollmentsDataForByStudentTab" @edit-emit="editEnrollment" :actions="tableActions"
                    :refresh-func="async () => { await loadEnrollments(); return true }" @delete-emit="delEnrollment" />

                <div class="flex justify-center mt-4 mb-10">
                    <PaginateComponent :total-count="countTotEnrollmentsTabStudent" :page-size="limitLoadEnrollments"
                        @load-page-emit="loadEnrollments" />
                </div>
            </tab>

            <tab name="by Course">
                <div class="flex justify-between items-center">
                    <div class="flex items-center mr-5">
                        <h4 class="mr-5 font-semibold">Select a Course</h4>
                        <SelectionBox :options="courseGroupOptionFields" :value="selectedCourseGroup"
                            @input="(val) => { selectedCourseGroup = val }" class="w-[300px] mr-5" />

                        <h4 class="mr-5 font-semibold ml-10" v-show="coursesOptionFields.length !== 0">Select a Group
                        </h4>
                        <SelectionBox v-show="coursesOptionFields.length !== 0" :options="coursesOptionFields"
                            :value="selectedCourseForTable" @input="(val) => { selectedCourseForTable = val }"
                            class="w-[300px] mr-5" />
                    </div>
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
                            <h4>{{ selectedCourseData.id ? (selectedCourseData.enrollment_open ? 'Open' : 'Closed') : ''
                                }}
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

                <div class="flex justify-center mt-4 mb-10">
                    <PaginateComponent :total-count="countTotEnrollments" :page-size="limitLoadEnrollments"
                        @load-page-emit="loadEnrollments" />
                </div>
            </tab>
        </tabs>

    </div>
</template>