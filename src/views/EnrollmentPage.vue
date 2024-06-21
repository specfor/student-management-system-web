<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { getCourses } from '@/apiConnections/courses';
import { enrollCourse, getEnrollmentsOfCourse, getStudentEnrollments, updateEnrollment } from '@/apiConnections/enrollments';
import { getStudents } from '@/apiConnections/students';
import TableComponent, { type TableActionType } from '@/components/TableComponent.vue';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { PencilSquareIcon } from '@heroicons/vue/24/solid';
import { ref, watch, type Ref } from 'vue';
import PaginateComponent from '@/components/PaginateComponent.vue';
import StudentSelector from '@/components/dataSelectors/StudentSelector.vue';
import CourseSelector from '@/components/dataSelectors/CourseSelector.vue';


const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()

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

const limitLoadEnrollments = 30
const countTotEnrollmentsTabCourse = ref(0)
const countTotEnrollmentsTabStudent = ref(0)

async function loadEnrollments(startIndex = 0) {
    let resp = null

    if (tabSelectMode.value!.activeTabHash == '#by-student') {
        resp = await getStudentEnrollments(selectedStudentId.value, startIndex, limitLoadEnrollments)
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured.', resp.message, 'error')
            return
        }

        enrollmentsDataTabStudent = resp.data.enrollments
        countTotEnrollmentsTabStudent.value = resp.data.tot_count
        enrollmentsDataForByStudentTab.value = []
    } else {
        resp = await getEnrollmentsOfCourse(selectedCourseId.value, startIndex, limitLoadEnrollments)
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured.', resp.message, 'error')
            return
        }

        enrollmentsDataTabCourse = resp.data.enrollments
        countTotEnrollmentsTabCourse.value = resp.data.tot_count
        enrollmentsDataForByCourseTab.value = []
    }


    resp.data.enrollments.forEach((enrollment: Enrollment) => {
        let priceOffer = 'NOT GIVEN'
        if (enrollment.price_adjustments !== null) {
            if (enrollment.price_adjustments.type === 'fixed')
                priceOffer = enrollment.price_adjustments.amount + ' fixed reduction'
            else
                priceOffer = enrollment.price_adjustments.percentage + '% reduction'
        }
        if (tabSelectMode.value.activeTabHash == '#by-student') {
            let course = enrollment.course!.name
            if (enrollment.course!.group_name)
                course += " - " + enrollment.course!.group_name
            enrollmentsDataForByStudentTab.value.push([enrollment.id, course, enrollment.suspended, priceOffer])
        }
        else
            enrollmentsDataForByCourseTab.value.push([enrollment.id, enrollment.student ? enrollment.student.name : 'Deleted Student', enrollment.suspended, priceOffer])
    });
}

watch(selectedStudentId, loadEnrollments)

watch(selectedCourseId, loadEnrollments)

let studentOptionFields: Ref<{ text: string, value: any }[]> = ref([])

let courses: Course[] = []
let students: Student[] = []

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
        enrollment = enrollmentsDataTabStudent.find(g => g.id === id)
    else
        enrollment = enrollmentsDataTabCourse.find(g => g.id === id)

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

        let resp = await updateEnrollment(id, results.data['suspend'] as boolean, results.data['discount_type'] as EnrollmentPriceAdjustment['type'],
            results.data['amount'] as number, results.data['reason'] as string)
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

async function delEnrollment() {
    alertStore.insertAlert('Can not delete.', 'Enrollments can not be deleted.', 'error')
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-10">
            <h4 class="font-semibold text-3xl">Course Enrollments</h4>
        </div>

        <tabs nav-class="flex border-b-2 pb-[6px] justify-center" nav-item-link-class="border px-10 py-2 font-semibold"
            nav-item-link-active-class="bg-slate-200" panels-wrapper-class="pt-10" ref="tabSelectMode">
            <tab name="by Student">
                <div class="flex justify-end">
                    <NewItemButton text="Enroll a Student" :on-click="addNewEnrollment"
                        :disabled="selectedStudentId === 0" />
                </div>
                <div class="mb-5">
                    <StudentSelector @student="(s) => { selectedStudentId = s.id }" />
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
                <div class="flex justify-end">
                    <NewItemButton text="Enroll a Student" :on-click="addNewEnrollment"
                        :disabled="selectedCourseId === 0" />
                </div>
                <div class="mb-5">
                    <CourseSelector @course="(c) => { selectedCourseId = c.id }" />
                </div>
                <TableComponent :table-columns="['ID', 'Student Name', 'Suspended', 'Price Concession']"
                    :table-rows="enrollmentsDataForByCourseTab" @edit-emit="editEnrollment" :actions="tableActions"
                    :refresh-func="async () => { await loadEnrollments(); return true }" @delete-emit="delEnrollment" />

                <div class="flex justify-center mt-4 mb-10">
                    <PaginateComponent :total-count="countTotEnrollmentsTabCourse" :page-size="limitLoadEnrollments"
                        @load-page-emit="loadEnrollments" />
                </div>
            </tab>
        </tabs>
    </div>
</template>