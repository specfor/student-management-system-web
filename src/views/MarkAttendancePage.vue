<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { getAttendace, sendMarkAttendance } from '@/apiConnections/attendance';
import { getCourses } from '@/apiConnections/courses';
import { getEnrollments, getStudentEnrollmentOfCourse } from '@/apiConnections/enrollments';
import { createStudentPayment } from '@/apiConnections/payments';
import { downloadStudentImage, getStudents } from '@/apiConnections/students';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { ref, watch, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SelectionBox from '@/components/primary/SelectionBox.vue';
import type { InputField, MessageField } from '@/stores/formManagers/dataEntryForm';
import type { Enrollment } from '@/types/enrollmentTypes';
import type { Course } from '@/types/courseTypes';
import type { Student } from '@/types/studentTypes';
import TableComponent, { type Filter, type TableActionType, type TableColumns, type tableRowItem } from '@/components/TableComponent.vue';
import type { Attendance } from '@/types/attendanceTypes';
import BillEnroller from '@/components/BillEnroller.vue';
import LoadingCursor from '@/components/minorUiComponents/loadingCursor.vue';
import { ListBulletIcon } from '@heroicons/vue/24/solid';

const alertStore = useAlertsStore()
const dataEntryForm = useDataEntryFormsStore()
const route = useRoute()
const router = useRouter()

let coursesOptionFields: Ref<{ text: string, value: any }[]> = ref([])
let courseGroupOptionFields: Ref<{ text: string, value: any }[]> = ref([])
let studentOptionFields: Ref<{ text: string, value: any }[]> = ref([])
let courses: Course[] = []
let students: Student[] = []
let studentEnrolledCourses: Ref<Course[]> = ref([])
const loadingStudentEnrolledCourses = ref(false)

const showBillEnroller = ref(false)
const billEnrollerStudentId = ref(0)
const paymentIdForBillEnroller = ref(0)

async function init() {
    enrollStatusText.value = 'Select a Course & a Student'
    let resp = await getCourses()
    if (resp.status === 'error') {
        return
    }

    Object.entries(resp.data.courses as { [key: string]: Course[] }).forEach((courseGroup: [string, Course[]]) => {
        courseGroupOptionFields.value.push({ value: courseGroup[0], text: courseGroup[0] })
        courseGroup[1].forEach((course) => {
            courses.push(course)
        })
    })

    resp = await getStudents()
    if (resp.status === 'error')
        return

    students = resp.data.students
    handleQueryParams()
}

function handleQueryParams() {
    // Check if we have a student pre-selected in URL
    if (route.query.student_id) {
        let presetStudentId = parseInt(route.query.student_id as string)
        if (!isNaN(presetStudentId)) {
            showAllStudentsForSelection.value = true
            
            // Explicitly populate the list
            studentOptionFields.value = []
            students.forEach(student => {
                studentOptionFields.value.push({ text: student.name, value: student.id })
            })
            
            // Wait a tick for UI update, then select
            setTimeout(() => {
                selectedStudentId.value = presetStudentId
                
                if (route.query.course_id) {
                    let presetCourseId = parseInt(route.query.course_id as string)
                    if (!isNaN(presetCourseId)) {
                        const course = courses.find(c => c.id === presetCourseId)
                        if (course) {
                            selectedCourseGroup.value = course.name
                            setTimeout(() => {
                                selectedCourseId.value = presetCourseId
                            }, 50)
                        }
                    }
                } else {
                    selectedCourseGroup.value = ''
                    selectedCourseId.value = 0
                }

                // Remove from URL so refreshing doesn't stick
                router.replace({ query: {} })
            }, 100)
        }
    }
}

watch(() => route.query, () => {
    if (students.length > 0) {
        handleQueryParams()
    }
})

const selectedCourseId = ref(0)
const selectedCourseGroup = ref('')
const selectedCourseData: Ref<Course | null> = ref(null)

const selectedStudentId = ref(0)
const selectedStudentData: Ref<Student | null> = ref(null)

const studentImageUrl = ref("")
const showAllStudentsForSelection = ref(false)

const showOnlyActiveEnrollments = ref(true)

watch(showOnlyActiveEnrollments, () => {
    loadEnrolledCourses(selectedStudentId.value)
})

watch(showAllStudentsForSelection, (newVal) => {
    if (newVal) {
        studentOptionFields.value = []
        students.forEach(student => {
            studentOptionFields.value.push({ text: student.name, value: student.id })
        })
    } else {
        if (selectedCourseId.value > 0)
            loadStudentsOfCourse(selectedCourseId.value)
    }
})
watch(selectedCourseGroup, async (gName) => {
    feeToPay.value = -1
    coursesOptionFields.value = []
    let coursesList = courses.filter(c => c.name == gName)
    if (coursesList.length === 1) {
        selectedCourseId.value = coursesList[0].id
    } else {
        selectedCourseData.value = null
        coursesList.forEach(course => {
            coursesOptionFields.value.push({ value: course.id, text: course.group_name ? course.group_name : 'No Name' })
        })
    }
})
watch(selectedCourseId, async (courseId) => {
    if (courseId === 0) return

    if (!showAllStudentsForSelection.value)
        loadStudentsOfCourse(selectedCourseId.value)

    selectedCourseData.value = courses.find(c => c.id == courseId) || null
    checkEnrolled()
})
watch(selectedStudentId, async (studentId) => {
    checkEnrolled()
    loadEnrolledCourses(selectedStudentId.value)
    selectedStudentData.value = students.find(s => s.id == studentId) || null

    studentImageUrl.value = ""
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
    enrollmentLoading.value = true

    loadStudentEnrollmentOfCourse()
}

const enrollmentData: Ref<{ enrolled: boolean, enrollment: Enrollment | null, paid: boolean } | null> = ref(null)
const enrollmentLoading = ref(false)

async function loadStudentsOfCourse(courseId: number) {
    let resp = await getEnrollments(0, undefined, { filters: { course_id: courseId } })
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    studentOptionFields.value = [];

    let selectedStudentFoundInList = false;
    (resp.data.enrollments as Enrollment[]).forEach(enrollment => {
        if (enrollment.student && enrollment.status?.length > 0 && enrollment.status[enrollment.status.length - 1].type === 'active') {
            studentOptionFields.value.push({ text: enrollment.student.name, value: enrollment.student.id })
            if (enrollment.student.id == selectedStudentId.value)
                selectedStudentFoundInList = true
        }
    })
    if (!selectedStudentFoundInList)
        selectedStudentId.value = 0
}

async function loadEnrolledCourses(studentId: number) {
    studentEnrolledCourses.value = [];
    if (studentId == 0)
        return

    loadingStudentEnrolledCourses.value = true

    let filters: { [key: string]: any } = { student_id: studentId }

    if (showOnlyActiveEnrollments.value)
        filters['status_is'] = 'active'

    let resp = await getEnrollments(0, undefined, { filters: filters })
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    (resp.data.enrollments as Enrollment[]).forEach(enrollment => {
        if (enrollment.course)
            studentEnrolledCourses.value.push(enrollment.course)
    })
    loadingStudentEnrolledCourses.value = false
}

async function loadStudentEnrollmentOfCourse() {
    let resp = await getStudentEnrollmentOfCourse(selectedCourseId.value, selectedStudentId.value)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    enrollmentData.value = resp.data
    enrollmentLoading.value = false
    calculateFee()
}

async function markPayment() {
    enrollActionsEnabled.value = false

    if (!selectedCourseData.value || !selectedStudentData.value || !enrollmentData.value || !enrollmentData.value.enrollment) {
        alertStore.insertAlert('An error occured.', 'Please ensure a course and student are selected properly and the student is enrolled.', 'error')
        enrollActionsEnabled.value = true
        return
    }

    let cName = ''
    if (selectedCourseData.value.group_name === null)
        cName = selectedCourseData.value.id + ' - ' + selectedCourseData.value.name
    else
        cName = selectedCourseData.value.id + ' - ' + selectedCourseData.value.name + ' - ' + selectedCourseData.value.group_name

    let sName = selectedStudentData.value.id + ' - ' + selectedStudentData.value.name

    let timeP: InputField | MessageField = { name: 'time', type: 'month', text: 'Month', value: new Date().toJSON().slice(0, 7) }
    if (selectedCourseData.value.fee?.type === 'daily')
        timeP = { name: 'time', type: 'date', text: 'Day', value: new Date().toLocaleDateString() }
    else if (selectedCourseData.value.fee?.type === 'onetime')
        timeP = { type: 'message', text: 'Course fee is a one time fee.' }

    dataEntryForm.newDataEntryForm('Payment Confirmation', 'Confirm', [
        { type: 'heading', text: 'Check all below details!' },
        { name: 'course', type: 'text', text: 'Course', value: cName, disabled: true },
        { name: 'student', type: 'text', text: 'Student', value: sName, disabled: true },
        { name: 'amount', type: 'text', text: 'Amount', value: feeToPay.value, disabled: true },
        { type: 'heading', text: 'Custom Class Fee (Optional)' },
        { name: 'custom_amount', type: 'number', text: 'Custom Amount' },
        { name: 'reason', type: 'text', text: 'Reason' },
        { type: 'heading', text: 'Select the time period of the payment' },
        timeP
    ], { allowSubmit: true })
    let confirmed = await dataEntryForm.waitForSubmittedData()

    dataEntryForm.finishSubmission()
    if (!confirmed.submitted) {
        enrollActionsEnabled.value = true
        return
    }

    let fee = feeToPay.value
    if (confirmed.data.custom_amount != '')
        fee = confirmed.data.custom_amount as number

    let shouldShowBillEnroller = false
    let resp;
    if (selectedCourseData.value.fee?.type === 'onetime')
        resp = await createStudentPayment((enrollmentData.value.enrollment as Enrollment).id, fee, 'onetime', confirmed.data.custom_amount != '', confirmed.data.reason as string)
    else
        resp = await createStudentPayment((enrollmentData.value.enrollment as Enrollment).id, fee, confirmed.data.time as string, confirmed.data.custom_amount != '', confirmed.data.reason as string)

    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
    } else {
        paymentIdForBillEnroller.value = resp.data.payment.id
        shouldShowBillEnroller = true
        alertStore.insertAlert('Action completed.', resp.message)
    }

    if (shouldShowBillEnroller) {
        billEnrollerStudentId.value = selectedStudentData.value.id;
        showBillEnroller.value = true
    }
    enrollActionsEnabled.value = true
    checkEnrolled()
}

async function markAttendance() {
    enrollActionsEnabled.value = false

    if (selectedCourseId.value === 0 || selectedStudentId.value === 0) {
        alertStore.insertAlert('An error occured.', 'Please select a valid course and student first.', 'error')
        enrollActionsEnabled.value = true
        return
    }

    let dateToPass = customAttendanceDate.value !== '' ? customAttendanceDate.value : undefined;
    let resp = await sendMarkAttendance(selectedCourseId.value, selectedStudentId.value, dateToPass)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error', -1, () => {
            window.dispatchEvent(new CustomEvent('open-scan-queue', { detail: { filter: 'failed' } }));
        })
    } else {
        alertStore.insertAlert('Action completed.', resp.message, 'success', 10000, () => {
            window.dispatchEvent(new CustomEvent('open-scan-queue', { detail: { filter: 'success' } }));
        })
    }
    enrollActionsEnabled.value = true
}

const enrollActionsEnabled = ref(false)
const enrollStatusText = ref('')
const customAttendanceDate = ref('')

// Attendance History Modal State
const showHistoryModal = ref(false)
const historyRecords = ref<Attendance[]>([])
const historyLoading = ref(false)
const historyHasMore = ref(true)
const historyPage = ref(0)
const historyPageSize = 10

async function loadHistory(reset = false) {
    if (selectedCourseId.value === 0 || selectedStudentId.value === 0) return;
    if (reset) {
        historyRecords.value = []
        historyPage.value = 0
        historyHasMore.value = true
    }
    historyLoading.value = true
    let resp = await getAttendace(historyPage.value * historyPageSize, historyPageSize, {
        sort: { by: 'date', direction: 'desc' },
        filters: { courseId: selectedCourseId.value, studentId: selectedStudentId.value }
    })
    historyLoading.value = false
    if (resp.status === 'success') {
        historyRecords.value.push(...resp.data.records)
        if (resp.data.records.length < historyPageSize) {
            historyHasMore.value = false
        }
        historyPage.value++
    }
}

watch(enrollmentLoading, () => {
    if (enrollmentLoading.value)
        enrollStatusText.value = 'Loading...'
})
watch(enrollmentData, () => {
    if (!enrollmentData.value) return;
    if (enrollmentData.value.enrollment !== null && (enrollmentData.value.enrollment as Enrollment).suspended) {
        enrollStatusText.value = 'Student is Banned from the Course'
        return
    }
    else if (enrollmentData.value.enrolled) {
        enrollActionsEnabled.value = true
        enrollStatusText.value = 'Enrolled With the Course'
    } else
        enrollStatusText.value = 'Not Enrolled With the Course'

})

const feeToPay = ref(-1)

function calculateFee() {
    const course = courses.find(c => c.id == selectedCourseId.value);
    if (!course || !course.fee) {
        feeToPay.value = -1;
        return;
    }

    let courseFee = Number(course.fee.amount)

    let discount = 0

    if (!enrollmentData.value || enrollmentData.value.enrollment === null) {
        feeToPay.value = -1
        return
    }

    let price_adjustments = (enrollmentData.value.enrollment as Enrollment).price_adjustments

    if (price_adjustments !== null) {
        if (price_adjustments.type === 'fixed')
            discount = price_adjustments.amount || 0
        else
            discount = (courseFee * (price_adjustments.percentage || 0)) / 100
    }

    feeToPay.value = courseFee - discount
}

init()


function selectCourse(courseId: number) {
    let course = courses.find(c => c.id == courseId)
    if (course) {
        selectedCourseGroup.value = course.name
        selectedCourseId.value = course.id
    }

}

// const dataForTable: Ref<any[]> = ref([])
// const countTotAttendances = ref(0)

// const tableActions: TableActionType[] = [
//     { renderAsRouterLink: false, type: 'text', emit: 'Select', text: 'Select', css: 'fill-blue-600 w-5' },
// ]
// const tableColumns: TableColumns[] = [
//     { label: 'ID' }, { label: 'Student' }, { label: 'Course' }, { label: 'Date' }, { label: 'Marked Automaticaly' },
// ]
// const tableFilters: Filter[] = [{ name: 'name', label: 'Name', type: 'text' }, { name: 'custom_id', label: 'Custom Id', type: 'text' },
// { name: 'phone_number', type: 'text', label: 'Phone Number' }, { name: 'email', type: 'text', label: 'Email' },
// { name: 'admission_paid', label: 'Admission Paid', type: 'select', options: [{ text: 'Paid', value: true }, { text: 'Not Paid', value: false }] }]

// let attendanceData: Attendance[] = []

// async function loadAttendances(startIndex?: number, filters?: any) {
//     let resp = await getAttendace(startIndex, 20, { filters, sort: { by: "id", direction: 'desc' } })

//     await new Promise(resolve => {
//         const checkStudents = setInterval(() => {
//             if (students.length > 0) {
//                 clearInterval(checkStudents);
//                 resolve(true);
//             }
//         }, 100);
//     });
//     if (resp.status == 'success') {
//         countTotAttendances.value = resp.data.tot_count;
//         attendanceData = resp.data.records
//         dataForTable.value = [];
//         (resp.data.records as Attendance[]).forEach(attend => {
//             let studentName = students.find(s => s.id == attend.student_id)?.name
//             let student = { type: 'textWithLink', text: studentName, url: `/students/${attend.student_id}/view` }
//             let course = courses.find(c => c.id == attend.course_id)
//             let courseName = course?.name
//             let markedAuto: tableRowItem = {
//                 type: 'colorTag', text: attend.marked_automatically ? 'Yes' : 'No',
//                 css: attend.marked_automatically ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
//             }

//             if (course?.group_name) {
//                 courseName += ' - ' + course.group_name
//             }

//             dataForTable.value.push([attend.id, student, courseName, attend.date, markedAuto])
//         });
//     }
// }

// loadAttendances()

// function selectForMarking(attendId: number) {
//     let attendance = attendanceData.find(a => a.id == attendId)
//     selectedCourseId.value = attendance!.course_id
//     selectedStudentId.value = attendance!.student_id
// }
</script>

<template>
    <div class="container">
        <div class="flex items-center pt-10">
            <h4 class="mr-5 font-semibold">Select a Course</h4>
            <SelectionBox :options="courseGroupOptionFields" :value="selectedCourseGroup"
                @input="(val) => { selectedCourseGroup = val }" class="w-[300px] mr-5" />

            <h4 class="mr-5 font-semibold ml-10" v-show="coursesOptionFields.length !== 0">Select a Group </h4>
            <SelectionBox v-show="coursesOptionFields.length !== 0" :options="coursesOptionFields"
                :value="selectedCourseId" @input="(val) => { selectedCourseId = val }" class="w-[300px] mr-5" />
        </div>



        <div class="mb-10 grid grid-cols-3 gap-x-10 border rounded-xl py-3 px-10 mt-4 text-slate-800">
            <div class="">
                <h1 class="font-semibold text-lg">Basic Info</h1>
                <div class="grid grid-cols-2 ml-5">
                    <h4>ID</h4>
                    <h4>{{ selectedCourseData?.id || '' }}</h4>
                </div>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Instructor</h4>
                    <h4>{{ selectedCourseData?.instructor?.name || (selectedCourseData ? 'Deleted' : '') }}</h4>
                </div>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Enrollment Open</h4>
                    <h4>{{ selectedCourseData ? (selectedCourseData.enrollment_open ? 'Open' : 'Closed') : '' }}
                    </h4>
                </div>
            </div>
            <div>
                <h1 class="font-semibold text-lg">Schedule</h1>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Day</h4>
                    <h4>{{ selectedCourseData?.schedule?.[0]?.day || '' }}</h4>
                </div>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Time</h4>
                    <h4>{{ selectedCourseData?.schedule?.[0]?.time || '' }}</h4>
                </div>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Venue / Hall</h4>
                    <h4>{{ selectedCourseData?.schedule?.[0]?.venue || '' }}</h4>
                </div>
            </div>
            <div>
                <h1 class="font-semibold text-lg">Course Fee</h1>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Fee Type</h4>
                    <h4>{{ selectedCourseData?.fee?.type || '' }}</h4>
                </div>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Fee</h4>
                    <h4>{{ selectedCourseData?.fee?.amount || '' }}</h4>
                </div>
            </div>
        </div>
        <div class="grid grid-cols-3 gap-x-10">
            <div class="col-span-2 grid grid-cols-2 gap-x-10 border py-3 px-5 rounded-xl">
                <div>
                    <div class="flex items-center">
                        <h4 class="mr-5 font-semibold">Select a Student</h4>

                        <SelectionBox :options="studentOptionFields" :value="selectedStudentId"
                            @input="(val) => { selectedStudentId = val }" class="w-[300px] mr-5" />

                        <p class="mr-3">Show all Students</p>
                        <input v-model="showAllStudentsForSelection" type="checkbox" class="w-6 h-6" />
                    </div>
                    <div class="border-t-2 py-3 px-10 mt-4 text-slate-800">
                        <h1 class="font-semibold text-lg">Basic Info</h1>
                        <div class="grid grid-cols-2 ml-5">
                            <h4>ID</h4>
                            <h4>{{ selectedStudentData?.id || '' }}</h4>
                        </div>
                        <div class="grid grid-cols-2 ml-5">
                            <h4>Name</h4>
                            <h4>{{ selectedStudentData?.name || '' }}</h4>
                        </div>
                        <div class="grid grid-cols-2 ml-5">
                            <h4>Grade</h4>
                            <h4>{{ selectedStudentData ? (selectedStudentData.grade?.name || 'Deleted Grade') : '' }}</h4>
                        </div>
                        <div class="grid grid-cols-2 ml-5">
                            <h4>School</h4>
                            <h4>{{ selectedStudentData?.school || '' }}</h4>
                        </div>
                        <div class="flex flex-col items-center mt-3">
                            <div v-show="studentImageUrl === ''"
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
                            <div v-show="studentImageUrl !== ''" class="">
                                <img :src="studentImageUrl" alt="student image"
                                    class="object-contain w-[300px] h-[300px]">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="border-l-2 px-3 py-4">
                    <h4 class="font-semibold text-lg text-center mb-5">Student Enrolled Courses</h4>

                    <div class="flex gap-x-5 mb-5">
                        <p>Show only active enrollments</p>
                        <input type="checkbox" class="w-6 h-6" v-model="showOnlyActiveEnrollments" />
                    </div>
                    <div v-show="loadingStudentEnrolledCourses" class="mt-10">
                        <LoadingCursor />
                    </div>

                    <div class="border rounded-xl bg-yellow-100 py-4 px-3 text-yellow-800"
                        v-show="selectedStudentId == 0 && !loadingStudentEnrolledCourses">
                        <p class="text-center">Select a Student to load Enrolled Courses</p>
                    </div>

                    <div class="border rounded-xl bg-yellow-100 py-4 px-3 text-yellow-800"
                        v-show="selectedStudentId != 0 && studentEnrolledCourses.length == 0 && !loadingStudentEnrolledCourses">
                        <p class="text-center">No Enrolled Courses Found</p>
                    </div>

                    <div class="text-blue-800 max-h-[450px] overflow-y-auto">
                        <div class="flex justify-between items-center bg-blue-100 py-1 px-5 mt-1"
                            v-for="course in studentEnrolledCourses" :key="course.id">
                            <p>{{ course.name + (course.group_name ? ' - ' + course.group_name : '') }}</p>
                            <button @click="() => { selectCourse(course.id) }"
                                class="border bg-blue-300 hover:bg-blue-400 active:bg-blue-500 border-blue-400 rounded-lg px-2 py-1 text-sm">Select</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col items-center">
                <div class="py-3 w-full text-center text-xl"
                    :class="enrollmentLoading ? 'bg-slate-400' : (enrollActionsEnabled ? 'bg-blue-500' : 'bg-red-500')">
                    <h3 class="text-white font-bold">{{ enrollStatusText }}</h3>
                </div>
                <div class="flex mt-10 items-center">
                    <div v-show="enrollActionsEnabled" class="mr-5 border h-fit flex items-center rounded-xl pl-5">
                        <p class="text-lg mr-2">Payment Status</p>
                        <p class="text-xl font-semibold text-white rounded-r-xl py-3 px-5"
                            :class="enrollmentData?.paid ? 'bg-green-500' : 'bg-red-500'">
                            {{ enrollmentData?.paid ? "Paid" : "Not Paid" }}</p>
                    </div>
                    <button :disabled="!enrollActionsEnabled" @click="markPayment"
                        class="border-2 rounded-xl w-[250px] bg-green-400 hover:bg-green-600 py-4 items-center disabled:bg-slate-200 flex flex-col shadow-lg">
                        <h3 class="font-semibold text-2xl">Mark Payment</h3>
                        <div class="gap-x-3 mt-3 text-lg font-bold text-white">
                            <h5>{{ feeToPay !== -1 ? 'Rs. ' + feeToPay : '' }}</h5>
                        </div>
                    </button>
                </div>

                <div v-if="selectedStudentData" class="mt-6 border-2 border-slate-300 rounded-xl bg-white px-6 py-4 shadow-md w-full max-w-xl">
                    <div class="flex items-center justify-between border-b pb-2 mb-3">
                        <span class="font-bold text-lg text-slate-700">Payment Trustworthiness</span>
                        <span class="px-3 py-1 rounded-full font-bold text-sm text-white"
                            :class="[
                                (selectedStudentData.trust_score ?? 100) >= 80 ? 'bg-green-600' :
                                (selectedStudentData.trust_score ?? 100) >= 50 ? 'bg-amber-500' : 'bg-red-600'
                            ]">
                            {{ selectedStudentData.trust_score ?? 100 }}% Trust Score
                        </span>
                    </div>
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm gap-2">
                        <p class="text-slate-600">
                            ⚡ Usual Tendency: <span class="font-semibold text-slate-800">{{ selectedStudentData.payment_week_tendency ? selectedStudentData.payment_week_tendency.primary_week : 'N/A' }}</span>
                        </p>
                        <p class="text-xs text-slate-500 italic">
                            {{ (selectedStudentData.trust_score ?? 100) < 50 ? '⚠️ High risk of non-payment' : (selectedStudentData.trust_score ?? 100) < 80 ? '🔔 Occasionally delayed' : '✅ Reliable payer' }}
                        </p>
                    </div>
                </div>

                <div class="mt-6 flex flex-col items-center">
                    <label class="text-sm font-semibold text-slate-700 mb-1">Select Custom Date (Optional)</label>
                    <input type="date" v-model="customAttendanceDate" class="border rounded-md px-3 py-2 w-[300px] focus:outline-amber-500 text-center" />
                </div>

                <div class="mt-4 flex items-stretch gap-2 w-[300px]">
                    <button :disabled="!enrollActionsEnabled" @click="markAttendance"
                        class="border-2 rounded-xl flex-1 bg-amber-400 hover:bg-amber-600 py-8 text-center disabled:bg-slate-200 shadow-lg">
                        <h3 class="font-semibold text-2xl">Mark Attendance</h3>
                    </button>
                    
                    <button :disabled="selectedCourseId === 0 || selectedStudentId === 0" @click="() => { showHistoryModal = true; loadHistory(true) }"
                        class="border-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white px-4 disabled:bg-slate-300 disabled:text-slate-500 shadow-lg flex items-center justify-center transition-colors"
                        title="View Attendance History">
                        <ListBulletIcon class="w-8 h-8" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Attendance History Modal -->
        <div v-if="showHistoryModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] flex flex-col">
                <div class="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 class="text-2xl font-bold text-slate-800">Attendance History</h2>
                    <button @click="showHistoryModal = false" class="text-slate-500 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div class="overflow-y-auto flex-1 pr-2 space-y-3">
                    <div v-if="historyRecords.length === 0 && !historyLoading" class="text-center py-8 text-slate-500 italic">
                        No attendance records found for this course.
                    </div>
                    
                    <div v-for="record in historyRecords" :key="record.id" 
                         class="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 flex justify-between items-center">
                        <div class="flex flex-col">
                            <span class="font-bold text text-slate-700">{{ record.date }}</span>
                            <span class="text-sm text-slate-500">Marked: {{ record.marked_automatically ? 'Automatically' : 'Manually' }}</span>
                        </div>
                        <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold border border-green-200">
                            Present
                        </div>
                    </div>
                    
                    <div v-if="historyLoading" class="flex justify-center py-4">
                        <LoadingCursor />
                    </div>
                    
                    <button v-if="historyHasMore && !historyLoading && historyRecords.length > 0" 
                            @click="loadHistory(false)"
                            class="w-full py-3 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors border border-slate-300">
                        Load More
                    </button>
                    <div v-if="!historyHasMore && historyRecords.length > 0 && !historyLoading" class="text-center text-sm text-slate-400 mt-4 pb-2">
                        End of history
                    </div>
                </div>
            </div>
        </div>
        <!-- 
        <h5 class="font-semibold text-xl mb-10">Marked Attendences</h5>

        <TableComponent :table-columns="tableColumns" :table-rows="dataForTable" :actions="tableActions"
            :refresh-func="async () => { await loadAttendances(); return true }" :paginate-total="countTotAttendances"
            :paginate-page-size="20" @load-page-emit="loadAttendances" @select="selectForMarking" /> -->
        <!--:filters="tableFilters" @filter-values="(val) => {
                loadStudents(undefined, val)
            }"  -->
        <!-- @edit-emit="editStudent" @show-more="showMoreInfo"
             @delete-emit="delStudent"
            @courses-emit="showStudentCourses" @load-page-emit="loadStudents" :paginate-page-size="limitLoadStudents"
            :paginate-total="countTotStudents" @sort-by="(col, dir) => {
                setSorting(col, dir); loadStudents();
            }" :current-sorting="{ column: 'Custom ID', direc: 'desc' }"  -->
    </div>
    <BillEnroller :show="showBillEnroller" :student-id="billEnrollerStudentId" :payment-id="paymentIdForBillEnroller"
        @close="showBillEnroller = false" />
</template>