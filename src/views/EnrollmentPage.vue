<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { getCourses } from '@/apiConnections/courses';
import { deleteEnrollment, enrollCourse, getEnrollmentsOfCourse, getStudentEnrollments, updateEnrollment } from '@/apiConnections/enrollments';
import { getStudents } from '@/apiConnections/students';
import TableComponent, { type TableActionType, type TableColumns, type tableRowItem } from '@/components/TableComponent.vue';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { PencilSquareIcon } from '@heroicons/vue/24/solid';
import { onMounted, ref, watch, type Ref } from 'vue';
import StudentSelector from '@/components/dataSelectors/StudentSelector.vue';
import CourseSelector from '@/components/dataSelectors/CourseSelector.vue';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { getRouteQuery, setRouteQuery } from '@/utils/routeHelpers';

const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()
const confirmationForm = useConfirmationFormsStore()

const tabSelectMode: Ref<any> = ref(null)

const selectedCourseId = ref(0)
const selectedStudentId = ref(0)


const enrollmentsDataForByCourseTab: Ref<any[]> = ref([])
const enrollmentsDataForByStudentTab: Ref<any[]> = ref([])
let enrollmentsDataTabCourse: any[] = []
let enrollmentsDataTabStudent: any[] = []

const tableActions: TableActionType[] = [
    { renderAsRouterLink: false, type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]
const tableColumnsByCourse: TableColumns[] = [
    { label: 'ID', sortable: false }, { label: 'Student Name' }, { label: 'Suspended' },
    { label: 'Price Concession' }, { label: 'Status' }]
const tableColumnsbyStudent: TableColumns[] = [
    { label: 'ID', sortable: false }, { label: 'Course Name' }, { label: 'Suspended' },
    { label: 'Price Concession' }, { label: 'Status' }]

const limitLoadEnrollments = 30
const countTotEnrollmentsTabCourse = ref(0)
const countTotEnrollmentsTabStudent = ref(0)

async function loadEnrollmentsByStudent(startIndex = 0) {
    let resp = await getStudentEnrollments(selectedStudentId.value, startIndex, limitLoadEnrollments)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    enrollmentsDataTabStudent = resp.data.enrollments
    countTotEnrollmentsTabStudent.value = resp.data.tot_count
    enrollmentsDataForByStudentTab.value = []


    resp.data.enrollments.forEach((enrollment: Enrollment) => {
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
        enrollmentsDataForByStudentTab.value.push([enrollment.id, course, enrollment.suspended, priceOffer, status])
    });
}

async function loadEnrollmentsByCourse(startIndex = 0) {
    let resp = await getEnrollmentsOfCourse(selectedCourseId.value, startIndex, limitLoadEnrollments)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    enrollmentsDataTabCourse = resp.data.enrollments
    countTotEnrollmentsTabCourse.value = resp.data.tot_count
    enrollmentsDataForByCourseTab.value = []

    resp.data.enrollments.forEach((enrollment: Enrollment) => {
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

        enrollmentsDataForByCourseTab.value.push([enrollment.id, student, enrollment.suspended, priceOffer, status])
    });
}


watch(selectedStudentId, () => {
    setRouteQuery('s_id', selectedStudentId.value)
    loadEnrollmentsByStudent();
})

watch(selectedCourseId, () => {
    setRouteQuery('c_id', selectedCourseId.value)
    loadEnrollmentsByCourse()
})

let studentOptionFields: Ref<{ text: string, value: any }[]> = ref([])

let courses: Course[] = []
let students: Student[] = []

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

function loadEnrollments() {
    if (tabSelectMode.value.activeTabHash == '#by-student')
        loadEnrollmentsByStudent()
    else if (tabSelectMode.value.activeTabHash == '#by-course')
        loadEnrollmentsByCourse()
}

async function init() {
    let resp = await getCourses()
    if (resp.status === 'error') {
        return
    }
    Object.entries(resp.data.courses as Course[][]).forEach(item => {
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

init()

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
                        :paginate-page-size="limitLoadEnrollments" :paginate-total="countTotEnrollmentsTabStudent" />
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
                        :paginate-page-size="limitLoadEnrollments" :paginate-total="countTotEnrollmentsTabCourse" />
                </div>
            </tab>
        </tabs>
    </div>
</template>