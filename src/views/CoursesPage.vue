<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { createCourse, deleteCourse, getCourses, updateCourse } from '@/apiConnections/courses';
import { getGrades } from '@/apiConnections/grades';
import { getInstructors } from '@/apiConnections/instructors';
import TableComponent, { type TableActionType } from '@/components/TableComponent.vue';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { PencilSquareIcon } from '@heroicons/vue/24/solid';
import { ref, type Ref } from 'vue';


const confirmationForm = useConfirmationFormsStore()
const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()

const coursesDataForTable: Ref<any[]> = ref([])
let coursesData: Course[] = []
const tableActions: TableActionType[] = [
    { renderAsRouterLink: false, type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]


const limitLoadCourses = 30
const countTotCourses = ref(0)

async function loadCourses(startIndex = 0) {
    let resp = await getCourses(startIndex, limitLoadCourses)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    countTotCourses.value = resp.data.tot_count

    coursesDataForTable.value = []
    coursesData = []
    Object.entries(resp.data.courses as Course[][]).forEach((item) => {
        coursesDataForTable.value.push([{ value: 'Course - ' + item[0], type: 'group' }])
        item[1].forEach((course: Course) => {
            coursesDataForTable.value.push([course.id, course.group_name, course.grade ? course.grade.name : 'None', course.schedule[0].day,
            course.schedule[0].time, course.fee.amount, course.fee.type, course.instructor ? course.instructor.name : 'Deleted'])
            coursesData.push(course)
        })
    })
}
loadCourses()

let instructorOptionFields: { text: string, value: number }[] = []
let gradeOptionFields: { text: string, value: number }[] = []

async function init() {
    let resp = await getInstructors()
    if (resp.status === 'error') {
        return
    }
    let instructors: Instructor[] = resp.data.instructors

    instructors.forEach(instructor => {
        instructorOptionFields.push({ text: instructor.name, value: instructor.id })
    });

    // get grade data for selection boxes
    resp = await getGrades()
    if (resp.status === 'success') {
        resp.data.grades.forEach((grade: Grade) => {
            gradeOptionFields.push({ value: grade.id, text: grade.name })
        });
    }
}

init()

async function addNewCourse() {
    dataEntryForm.newDataEntryForm('Create New Course', 'Create', [
        { name: 'name', type: 'text', text: 'Course Name', required: true },
        { name: 'group_name', type: 'text', text: 'Group (if course has groups )' },
        { name: 'instructor_id', type: 'select', text: 'Instructor', options: instructorOptionFields, required: true },
        { type: 'heading', text: 'Enter Course Schedule' },
        {
            name: 'day', type: 'select', text: 'Course Day', required: true, options: [
                { text: 'Monday', value: 'monday' },
                { text: 'Tuesday', value: 'tuesday' },
                { text: 'Wednesday', value: 'wednesday' },
                { text: 'Thursday', value: 'thursday' },
                { text: 'Friday', value: 'friday' },
                { text: 'Saturday', value: 'saturday' },
                { text: 'Sunday', value: 'sunday' }
            ]
        },
        { name: 's_time', type: 'time', text: 'Course Start Time', required: true },
        { name: 'e_time', type: 'time', text: 'Course End Time', required: true },
        { name: 'venue', type: 'text', text: 'Course Venue / Hall', required: true },
        { type: 'heading', text: 'Enter Course Fee' },
        {
            name: 'fee_type', type: 'select', text: 'Course Fee Type', required: true, options: [
                { text: 'Daily', value: 'daily' },
                { text: 'Monthly', value: 'monthly' },
                { text: 'One Time', value: 'onetime' },
            ]
        },
        { name: 'amount', type: 'number', text: 'Course Fee', required: true },
        { type: 'heading', text: 'Limit to a Grade (Optional)' },
        { name: 'grade_id', type: 'select', text: 'Grade', options: gradeOptionFields },
    ])
    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await createCourse(results.data.name as string, results.data.group_name as string, results.data.instructor_id as number,
            results.data.day as CourseSchedule['day'], results.data.s_time as string, results.data.e_time as string, results.data.venue as string,
            results.data.fee_type as CourseFee['type'], results.data.amount as number, results.data.grade_id as number)
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
            loadCourses()
            break
        }
    }
}

async function editCourse(id: number) {
    let course = coursesData.find(g => g.id === id)!

    dataEntryForm.newDataEntryForm('Update Course', 'Update', [
        { name: 'id', type: 'text', text: 'Course ID', disabled: true, value: course.id },
        { name: 'name', type: 'text', text: 'Course Name', required: true, value: course.name },
        { name: 'group_name', type: 'text', text: 'Group (if course has groups )', value: course.group_name },
        { name: 'instructor_id', type: 'select', text: 'Instructor', options: instructorOptionFields, required: true, value: course.instructor ? course.instructor.id : '' },
        { type: 'heading', text: 'Enter Course Schedule' },
        {
            name: 'day', type: 'select', text: 'Course Day', required: true, value: course.schedule[0].day, options: [
                { text: 'Monday', value: 'monday' },
                { text: 'Tuesday', value: 'tuesday' },
                { text: 'Wednesday', value: 'wednesday' },
                { text: 'Thursday', value: 'thursday' },
                { text: 'Friday', value: 'friday' },
                { text: 'Saturday', value: 'saturday' },
                { text: 'Sunday', value: 'sunday' }
            ]
        },
        { name: 's_time', type: 'time', text: 'Course Start Time', required: true, value: course.schedule[0].time.substring(0, 5) },
        { name: 'e_time', type: 'time', text: 'Course End Time', required: true, value: course.schedule[0].time.substring(6, 11) },
        { name: 'venue', type: 'text', text: 'Course Venue / Hall', required: true, value: course.schedule[0].venue },
        { type: 'heading', text: 'Enter Course Fee' },
        {
            name: 'fee_type', type: 'select', text: 'Course Fee Type', required: true, value: course.fee.type, options: [
                { text: 'Daily', value: 'daily' },
                { text: 'Monthly', value: 'monthly' },
                { text: 'One Time', value: 'onetime' },
            ]
        },
        { name: 'amount', type: 'number', text: 'Course Fee', required: true, value: course.fee.amount },
        { type: 'heading', text: 'Limit to a Grade (Optional)' },
        { name: 'grade_id', type: 'select', text: 'Grade', options: gradeOptionFields, value: course.grade_id },
    ])

    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await updateCourse(id, results.data.name as string, results.data.group_name as string, results.data.instructor_id as number,
            results.data.day as CourseSchedule['day'], results.data.s_time as string, results.data.e_time as string, results.data.venue as string,
            results.data.fee_type as CourseFee['type'], results.data.amount as number, results.data.grade_id as number)
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
            loadCourses()
            break
        }
    }
}

async function delCourse(ids: number[]) {
    let confirmed = await confirmationForm.newConfirmationForm("Confirm Deletion", "Are you sure you want to delete these courses with IDs: " + ids.join(', ') + "?")
    if (!confirmed)
        return

    ids.forEach(async id => {
        let resp = await deleteCourse(id)
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured deleting course.', resp.message, 'error')
            return
        }
        alertStore.insertAlert('Action completed.', resp.message)
    });
    loadCourses()
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-16">
            <h4 class="font-semibold text-3xl">Courses</h4>
            <NewItemButton text="New Course" :on-click="addNewCourse" />
        </div>
        <div class="mb-10">
            <TableComponent
                :table-columns="['ID', 'Group', 'Grade', 'Course Day', 'Time', 'Fee', 'Payment Cycle', 'Instructor']"
                :table-rows="coursesDataForTable" @edit-emit="editCourse" :actions="tableActions"
                :refresh-func="async () => { await loadCourses(); return true }" @delete-emit="delCourse"
                @load-page-emit="loadCourses" :paginate-page-size="limitLoadCourses"
                :paginate-total="countTotCourses" />
        </div>
    </div>
</template>