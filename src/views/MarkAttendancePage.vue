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
import SelectionBox from '@/components/primary/SelectionBox.vue';
import type { InputField, MessageField } from '@/stores/formManagers/dataEntryForm';
import type { Enrollment } from '@/types/enrollmentTypes';
import type { Course } from '@/types/courseTypes';
import type { Student } from '@/types/studentTypes';
import TableComponent, { type Filter, type TableActionType, type TableColumns, type tableRowItem } from '@/components/TableComponent.vue';
import type { Attendance } from '@/types/attendanceTypes';
import BillEnroller from '@/components/BillEnroller.vue';

const alertStore = useAlertsStore()
const dataEntryForm = useDataEntryFormsStore()

let coursesOptionFields: Ref<{ text: string, value: any }[]> = ref([])
let courseGroupOptionFields: Ref<{ text: string, value: any }[]> = ref([])
let studentOptionFields: Ref<{ text: string, value: any }[]> = ref([])
let courses: Course[] = []
let students: Student[] = []


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
}

const selectedCourseId = ref(0)
const selectedCourseGroup = ref('')
const selectedCourseData: Ref<Course | null> = ref(null)

const selectedStudentId = ref(0)
const selectedStudentData: Ref<Student | null> = ref(null)

const studentImageUrl = ref("")
const showAllStudentsForSelection = ref(false)

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
    let groups = courses.filter(c => c.name == gName)
    if (groups.length === 1) {
        selectedCourseId.value = groups[0].id
    } else {
        selectedCourseId.value = 0
        selectedCourseData.value = null
        groups.forEach(group => {
            coursesOptionFields.value.push({ value: group.id, text: group.group_name ? group.group_name : 'No Name' })
        })
    }
})
watch(selectedCourseId, async (courseId) => {
    if (courseId === 0) return

    if (!showAllStudentsForSelection.value)
        loadStudentsOfCourse(selectedCourseId.value)

    selectedCourseData.value = courses.find(c => c.id == courseId)!
    checkEnrolled()
})
watch(selectedStudentId, async (studentId) => {
    checkEnrolled()
    selectedStudentData.value = students.find(s => s.id == studentId)!

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
    (resp.data.enrollments as Enrollment[]).forEach(enrollment => {
        if (enrollment.student)
            studentOptionFields.value.push({ text: enrollment.student.name, value: enrollment.student.id })
    })
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
    let cName = ''
    if (selectedCourseData.value!['group_name'] === null)
        cName = selectedCourseData.value!['id'] + ' - ' + selectedCourseData.value!['name']
    else
        cName = selectedCourseData.value!['id'] + ' - ' + selectedCourseData.value!['name'] + ' - ' + selectedCourseData.value!['group_name']

    let sName = selectedStudentData.value!['id'] + ' - ' + selectedStudentData.value!['name']

    let timeP: InputField | MessageField = { name: 'time', type: 'month', text: 'Month', value: new Date().toJSON().slice(0, 7) }
    if (selectedCourseData.value!['fee']['type'] === 'daily')
        timeP = { name: 'time', type: 'date', text: 'Day', value: new Date().toLocaleDateString() }
    else if (selectedCourseData.value!['fee']['type'] === 'onetime')
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
    let resp = await createStudentPayment((enrollmentData.value!.enrollment as Enrollment).id, fee, confirmed.data.time as string, confirmed.data.custom_amount != '', confirmed.data.reason as string)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
    } else {
        paymentIdForBillEnroller.value = resp.data.payment.id
        shouldShowBillEnroller = true
        alertStore.insertAlert('Action completed.', resp.message)
    }

    if (shouldShowBillEnroller) {
        billEnrollerStudentId.value = selectedStudentData.value!['id'];
        showBillEnroller.value = true
    }
    enrollActionsEnabled.value = true
    checkEnrolled()
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

watch(enrollmentLoading, () => {
    if (enrollmentLoading.value)
        enrollStatusText.value = 'Loading...'
})
watch(enrollmentData, () => {
    if (enrollmentData.value!.enrollment !== null && (enrollmentData.value!.enrollment as Enrollment).suspended) {
        enrollStatusText.value = 'Student is Banned from the Course'
        return
    }
    else if (enrollmentData.value!.enrolled) {
        enrollActionsEnabled.value = true
        enrollStatusText.value = 'Enrolled With the Course'
    } else
        enrollStatusText.value = 'Not Enrolled With the Course'

})

const feeToPay = ref(-1)

function calculateFee() {
    let courseFee = Number(courses.find(c => c.id == selectedCourseId.value)!.fee.amount)

    let discount = 0

    if (enrollmentData.value!.enrollment === null) {
        feeToPay.value = -1
        return
    }

    let price_adjustments = (enrollmentData.value!.enrollment as Enrollment).price_adjustments

    if (price_adjustments !== null)
        if (price_adjustments.type === 'fixed')
            discount = price_adjustments.amount!
        else
            discount = (courseFee * price_adjustments.percentage!) / 100

    feeToPay.value = courseFee - discount
}

init()


const dataForTable: Ref<any[]> = ref([])
const countTotAttendances = ref(0)

const tableActions: TableActionType[] = [
    { renderAsRouterLink: false, type: 'text', emit: 'Select', text: 'Select', css: 'fill-blue-600 w-5' },
]
const tableColumns: TableColumns[] = [
    { label: 'ID' }, { label: 'Student' }, { label: 'Course' }, { label: 'Date' }, { label: 'Marked Automaticaly' },
]
// const tableFilters: Filter[] = [{ name: 'name', label: 'Name', type: 'text' }, { name: 'custom_id', label: 'Custom Id', type: 'text' },
// { name: 'phone_number', type: 'text', label: 'Phone Number' }, { name: 'email', type: 'text', label: 'Email' },
// { name: 'admission_paid', label: 'Admission Paid', type: 'select', options: [{ text: 'Paid', value: true }, { text: 'Not Paid', value: false }] }]

let attendanceData: Attendance[] = []

async function loadAttendances(startIndex?: number, filters?: any) {
    let resp = await getAttendace(startIndex, 20, { filters, sort: { by: "id", direction: 'desc' } })

    await new Promise(resolve => {
        const checkStudents = setInterval(() => {
            if (students.length > 0) {
                clearInterval(checkStudents);
                resolve(true);
            }
        }, 100);
    });
    if (resp.status == 'success') {
        countTotAttendances.value = resp.data.tot_count;
        attendanceData = resp.data.records
        dataForTable.value = [];
        (resp.data.records as Attendance[]).forEach(attend => {
            let studentName = students.find(s => s.id == attend.student_id)?.name
            let student = { type: 'textWithLink', text: studentName, url: `/students/${attend.student_id}/view` }
            let course = courses.find(c => c.id == attend.course_id)
            let courseName = course?.name
            let markedAuto: tableRowItem = {
                type: 'colorTag', text: attend.marked_automatically ? 'Yes' : 'No',
                css: attend.marked_automatically ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
            }

            if (course?.group_name) {
                courseName += ' - ' + course.group_name
            }

            dataForTable.value.push([attend.id, student, courseName, attend.date, markedAuto])
        });
    }
}

loadAttendances()

function selectForMarking(attendId: number) {
    let attendance = attendanceData.find(a => a.id == attendId)
    selectedCourseId.value = attendance!.course_id
    selectedStudentId.value = attendance!.student_id
}
</script>

<template>
    <div class="container">
        <div class="flex items-center">
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
                    <h4>{{ selectedCourseData ? selectedCourseData!.id : '' }}</h4>
                </div>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Instructor</h4>
                    <h4>{{ selectedCourseData ? (selectedCourseData!.instructor ? selectedCourseData!.instructor.name
                        : 'Deleted') : '' }}</h4>
                </div>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Enrollment Open</h4>
                    <h4>{{ selectedCourseData ? (selectedCourseData!.enrollment_open ? 'Open' : 'Closed') : '' }}
                    </h4>
                </div>
            </div>
            <div>
                <h1 class="font-semibold text-lg">Schedule</h1>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Day</h4>
                    <h4>{{ selectedCourseData ? selectedCourseData!.schedule[0].day : '' }}</h4>
                </div>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Time</h4>
                    <h4>{{ selectedCourseData ? selectedCourseData!.schedule[0].time : '' }}</h4>
                </div>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Venue / Hall</h4>
                    <h4>{{ selectedCourseData ? selectedCourseData!.schedule[0].venue : '' }}</h4>
                </div>
            </div>
            <div>
                <h1 class="font-semibold text-lg">Course Fee</h1>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Fee Type</h4>
                    <h4>{{ selectedCourseData ? selectedCourseData!.fee.type : '' }}</h4>
                </div>
                <div class="grid grid-cols-2 ml-5">
                    <h4>Fee</h4>
                    <h4>{{ selectedCourseData ? selectedCourseData!.fee.amount : '' }}</h4>
                </div>
            </div>
        </div>
        <div class="grid grid-cols-2 gap-x-10">
            <div>
                <div class="flex items-center">
                    <h4 class="mr-5 font-semibold">Select a Student</h4>

                    <SelectionBox :options="studentOptionFields" :value="selectedStudentId"
                        @input="(val) => { selectedStudentId = val }" class="w-[300px] mr-5" />

                    <p class="mr-3">Show all Students</p>
                    <input v-model="showAllStudentsForSelection" type="checkbox" class="w-6 h-6" />
                </div>
                <div class="mb-10 border rounded-xl py-3 px-10 mt-4 text-slate-800">
                    <h1 class="font-semibold text-lg">Basic Info</h1>
                    <div class="grid grid-cols-2 ml-5">
                        <h4>ID</h4>
                        <h4>{{ selectedStudentData ? selectedStudentData!.id : '' }}</h4>
                    </div>
                    <div class="grid grid-cols-2 ml-5">
                        <h4>Name</h4>
                        <h4>{{ selectedStudentData ? selectedStudentData!.name : '' }}</h4>
                    </div>
                    <div class="grid grid-cols-2 ml-5">
                        <h4>Grade</h4>
                        <h4>{{ selectedStudentData ? (selectedStudentData!.grade ? selectedStudentData!.grade.name :
                            'Deleted Grade') : '' }}</h4>
                    </div>
                    <div class="grid grid-cols-2 ml-5">
                        <h4>School</h4>
                        <h4>{{ selectedStudentData ? selectedStudentData!.school : '' }}</h4>
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
                        <div v-show="studentImageUrl !== ''" class="w-[300px]">
                            <img :src="studentImageUrl" alt="student image">
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
                <button :disabled="!enrollActionsEnabled" @click="markAttendance"
                    class="mt-10 border-2 rounded-xl w-[300px] bg-amber-400 hover:bg-amber-600 py-8 text-center disabled:bg-slate-200 shadow-lg">
                    <h3 class="font-semibold text-2xl">Mark Attendance</h3>
                </button>
            </div>
        </div>


        <h5 class="font-semibold text-xl mb-10">Marked Attendences</h5>

        <TableComponent :table-columns="tableColumns" :table-rows="dataForTable" :actions="tableActions"
            :refresh-func="async () => { await loadAttendances(); return true }" :paginate-total="countTotAttendances"
            :paginate-page-size="20" @load-page-emit="loadAttendances" @select="selectForMarking" />
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