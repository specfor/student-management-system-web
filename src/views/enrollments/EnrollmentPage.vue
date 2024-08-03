<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { getCourses } from '@/apiConnections/courses';
import { deleteEnrollment, enrollCourse, getEnrollments, updateEnrollment } from '@/apiConnections/enrollments';
import { getStudents } from '@/apiConnections/students';
import TableComponent, { type TableActionType, type TableColumns, type tableRowItem } from '@/components/TableComponent.vue';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { PencilSquareIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/solid';
import { onMounted, ref, watch, type Ref } from 'vue';
import StudentSelector from '@/components/dataSelectors/StudentSelector.vue';
import CourseSelector from '@/components/dataSelectors/CourseSelector.vue';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { getRouteQuery, setRoute, setRouteQuery } from '@/utils/routeHelpers';
import { getStudentPayments } from '@/apiConnections/payments';
import { getAttendace } from '@/apiConnections/attendance';
import InstructorSelector from '@/components/dataSelectors/InstructorSelector.vue';

const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()
const confirmationForm = useConfirmationFormsStore()

const tabSelectMode: Ref<any> = ref(null)

const selectedCourseId = ref(0)
const selectedStudentId = ref(0)
const selectedInstructorId = ref(0)


const enrollmentsDataForByCourseTab: Ref<any[]> = ref([])
const enrollmentsDataForByStudentTab: Ref<any[]> = ref([])
const enrollmentsDataForByInstructorTab: Ref<any[]> = ref([])

let enrollmentsDataTabCourse: any[] = []
let enrollmentsDataTabStudent: any[] = []
let enrollmentsDataTabInstructor: any[] = []

const tableActions: TableActionType[] = [
    { renderAsRouterLink: false, type: 'icon', emit: 'ShowMore', icon: MagnifyingGlassIcon, css: 'fill-blue-600 w-5' },
    { renderAsRouterLink: false, type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' },
]
const tableColumnsByCourse: TableColumns[] = [
    { label: 'ID', sortable: false }, { label: 'Student Name' },
    { label: 'Price Concession' }, { label: 'Status' }, { label: 'This Month Payment' }, { label: 'This Month Attendance' }]
const tableColumnsbyStudent: TableColumns[] = [
    { label: 'ID', sortable: false }, { label: 'Course Name' },
    { label: 'Price Concession' }, { label: 'Status' }, { label: 'This Month Payment' }, { label: 'This Month Attendance' }]
const tableColumnsbyTeacher: TableColumns[] = [
    { label: 'ID', sortable: false }, { label: 'Course Name' }, { label: 'Student Name' },
    { label: 'Price Concession' }, { label: 'Status' }, { label: 'This Month Payment' }, { label: 'This Month Attendance' }]

const limitLoadEnrollments = 30
const countTotEnrollmentsTabCourse = ref(0)
const countTotEnrollmentsTabStudent = ref(0)
const countTotEnrollmentsTabInstructor = ref(0)

let studentOptionFields: Ref<{ text: string, value: any }[]> = ref([])

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

watch(selectedInstructorId, () => {
    setRouteQuery('i_id', selectedInstructorId.value)
    lastLoadSettingsInstructors.lastUsedIndex = 0
    loadEnrollmentsByTeacher()
})


let lastLoadSettingsStudents = { lastUsedIndex: 0, orderBy: '', orderDirec: 'asc' }
let lastLoadSettingsCourses = { lastUsedIndex: 0, orderBy: '', orderDirec: 'asc' }
let lastLoadSettingsInstructors = { lastUsedIndex: 0, orderBy: '', orderDirec: 'asc' }

async function loadEnrollmentsByStudent(startIndex?: number) {
    if (startIndex === undefined)
        startIndex = lastLoadSettingsStudents.lastUsedIndex
    else
        lastLoadSettingsStudents.lastUsedIndex = startIndex

    let resp = await getEnrollments(startIndex, limitLoadEnrollments, { filters: { student_id: selectedStudentId.value } })
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    enrollmentsDataTabStudent = resp.data.enrollments
    countTotEnrollmentsTabStudent.value = resp.data.tot_count
    enrollmentsDataForByStudentTab.value = []

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

        let course: tableRowItem = "Deleted"
        if (enrollment.course) {
            course = enrollment.course.name
            if (enrollment.course.group_name)
                course += " - " + enrollment.course.group_name
            // course = { type: 'textWithLink', text: course, url: `/courses/${enrollment.course.id}/view` }
        }
        enrollmentsDataForByStudentTab.value.push([enrollment.id, course, priceOffer, status, paid, attend])
    });
}

async function loadEnrollmentsByTeacher(startIndex?: number) {
    if (startIndex === undefined)
        startIndex = lastLoadSettingsInstructors.lastUsedIndex
    else
        lastLoadSettingsInstructors.lastUsedIndex = startIndex

    let resp = await getEnrollments(startIndex, limitLoadEnrollments, { filters: { instructor_id: selectedInstructorId.value } })
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    enrollmentsDataTabInstructor = resp.data.enrollments
    countTotEnrollmentsTabInstructor.value = resp.data.tot_count
    enrollmentsDataForByInstructorTab.value = []

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
        enrollmentsDataForByInstructorTab.value.push([enrollment.id, course, student, priceOffer, status, paid, attend])
    });
}

async function loadEnrollmentsByCourse(startIndex?: number) {
    if (startIndex === undefined)
        startIndex = lastLoadSettingsCourses.lastUsedIndex
    else
        lastLoadSettingsCourses.lastUsedIndex = startIndex

    let resp = await getEnrollments(startIndex, limitLoadEnrollments, { filters: { course_id: selectedCourseId.value } })
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    enrollmentsDataTabCourse = resp.data.enrollments
    countTotEnrollmentsTabCourse.value = resp.data.tot_count
    enrollmentsDataForByCourseTab.value = []

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

        enrollmentsDataForByCourseTab.value.push([enrollment.id, student, priceOffer, status, paid, attend])
    });
}


watch(selectedStudentId, () => {
    setRouteQuery('s_id', selectedStudentId.value)
    lastLoadSettingsStudents.lastUsedIndex = 0
    loadEnrollmentsByStudent();
})

watch(selectedCourseId, () => {
    setRouteQuery('c_id', selectedCourseId.value)
    lastLoadSettingsCourses.lastUsedIndex = 0
    loadEnrollmentsByCourse()
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
    let routeInstructorId = getRouteQuery('i_id')
    if (routeInstructorId !== null) {
        tabSelectMode.value.selectTab('#by-teacher')
        selectedInstructorId.value = Number(routeInstructorId)
    }
})

function loadEnrollments() {
    if (tabSelectMode.value.activeTabHash == '#by-student')
        loadEnrollmentsByStudent()
    else if (tabSelectMode.value.activeTabHash == '#by-course')
        loadEnrollmentsByCourse()
}

async function initLoadCourses() {
    let resp = await getCourses()
    if (resp.status === 'error') {
        return
    }
    Object.entries(resp.data.courses as Course[][]).forEach(item => {
        item[1].forEach(course => {
            courses.push(course)
        })
    })
}
async function initLoadStudents() {
    let resp = await getStudents()
    if (resp.status === 'error')
        return

    students = resp.data.students
    students.forEach(student => {
        studentOptionFields.value.push({ text: student.name, value: student.id })
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

initLoadCourses()
initLoadStudents()
initLoadAttendance()
initLoadPayments()

async function addNewEnrollment() {
    let courseOptions: { text: string, value: any }[] = []
    let studentValue = -1
    if (tabSelectMode.value.activeTabHash == '#by-student') {
        studentValue = selectedStudentId.value
        courses.forEach(course => {
            courseOptions.push({ text: course.id + ' - ' + course.name + (course.group_name ? ' - ' + course.group_name : ''), value: course.id })
        })
    } else {
        let selectedCourseName = courses.find(c => c.id == selectedCourseId.value)!.name
        let coursesWithSameName = courses.filter(c => c.name === selectedCourseName)
        coursesWithSameName.forEach(course => {
            courseOptions.push({ text: course.id + ' - ' + selectedCourseName + (course.group_name ? ' - ' + course.group_name : ''), value: course.id })
        })
    }
    dataEntryForm.newDataEntryForm('Enroll to Course', 'Enroll', [
        { name: 'course_id', type: 'select', text: 'Course', options: courseOptions, value: selectedCourseId.value, required: true },
        { name: 'student_id', type: 'select', text: 'Student', options: studentOptionFields.value, required: true, value: studentValue },
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

    if (tabSelectMode.value.activeTabHash == '#by-student')
        enrollment = enrollmentsDataTabStudent.find(g => g.id === id) as Enrollment
    else if (tabSelectMode.value.activeTabHash == '#by-teacher')
        enrollment = enrollmentsDataTabInstructor.find(g => g.id === id) as Enrollment
    else
        enrollment = enrollmentsDataTabCourse.find(g => g.id === id) as Enrollment

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
        </div>

        <tabs nav-class="flex border-b-2 pb-[6px] justify-center" nav-item-link-class="border px-10 py-2 font-semibold"
            nav-item-link-active-class="bg-slate-200" panels-wrapper-class="pt-10" ref="tabSelectMode"
            :options="{ useUrlFragment: false }">
            <tab name="by Student">
                <div class="flex justify-end mb-3">
                    <NewItemButton text="Enroll a Student" :on-click="addNewEnrollment"
                        :disabled="selectedStudentId === 0" />
                </div>
                <div class="mb-5">
                    <StudentSelector v-model:student-id="selectedStudentId" />
                </div>
                <div class="mb-10">
                    <TableComponent :table-columns="tableColumnsbyStudent" :table-rows="enrollmentsDataForByStudentTab"
                        @edit-emit="editEnrollment" :actions="tableActions"
                        :refresh-func="async () => { await loadEnrollmentsByStudent(); return true }"
                        @delete-emit="delEnrollment" @load-page-emit="loadEnrollmentsByStudent"
                        :paginate-page-size="limitLoadEnrollments" :paginate-total="countTotEnrollmentsTabStudent"
                        @show-more="showMoreInfo" />
                </div>
            </tab>

            <tab name="by Course">
                <div class="flex justify-end mb-3">
                    <NewItemButton text="Enroll a Student" :on-click="addNewEnrollment"
                        :disabled="selectedCourseId === 0" />
                </div>
                <div class="mb-5">
                    <CourseSelector v-model:course-id="selectedCourseId" />
                </div>
                <div class="mb-10">
                    <TableComponent :table-columns="tableColumnsByCourse" :table-rows="enrollmentsDataForByCourseTab"
                        @edit-emit="editEnrollment" :actions="tableActions"
                        :refresh-func="async () => { await loadEnrollmentsByCourse(); return true }"
                        @delete-emit="delEnrollment" @load-page-emit="loadEnrollmentsByCourse"
                        :paginate-page-size="limitLoadEnrollments" :paginate-total="countTotEnrollmentsTabCourse"
                        @show-more="showMoreInfo" />
                </div>
            </tab>

            <tab name="by Teacher">
                <div class="flex justify-end mb-3">
                    <NewItemButton text="Enroll a Student" :on-click="addNewEnrollment"
                        :disabled="selectedCourseId === 0" />
                </div>
                <div class="mb-5">
                    <InstructorSelector v-model:insturctor-id="selectedInstructorId" />
                </div>
                <div class="mb-10">
                    <TableComponent :table-columns="tableColumnsbyTeacher"
                        :table-rows="enrollmentsDataForByInstructorTab" @edit-emit="editEnrollment"
                        :actions="tableActions"
                        :refresh-func="async () => { await loadEnrollmentsByTeacher(); return true }"
                        @delete-emit="delEnrollment" @load-page-emit="loadEnrollmentsByTeacher"
                        :paginate-page-size="limitLoadEnrollments" :paginate-total="countTotEnrollmentsTabInstructor"
                        @show-more="showMoreInfo" />
                </div>
            </tab>
        </tabs>
    </div>
</template>