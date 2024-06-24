<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { getGrades } from '@/apiConnections/grades';
import { createStudent, deleteStudent, getStudents, updateStudent, updateStudentImage } from '@/apiConnections/students';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import TableComponent, { type TableActionType, type TableColumns } from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { ref, type Ref } from "vue"
import { MagnifyingGlassIcon, PencilSquareIcon } from '@heroicons/vue/24/solid';
import { BookOpenIcon } from '@heroicons/vue/24/outline';
import { useExtendablePopUpStore } from '@/stores/formManagers/extendablePopUp';
import StudentMoreInfo from '@/components/customPopUps/StudentMoreInfo.vue';
import StudentCourses from '@/components/customPopUps/StudentCourses.vue';

const alertStore = useAlertsStore()
const dataEntryForm = useDataEntryFormsStore()
const confirmationForm = useConfirmationFormsStore()
const extendablePopUpStore = useExtendablePopUpStore()

let studentData: Student[] = []
const studentDataForTable: Ref<any[]> = ref([])
const tableActions: TableActionType[] = [
    { renderAsRouterLink: false, type: 'icon', emit: 'ShowMore', icon: MagnifyingGlassIcon, css: 'fill-blue-600 w-5' },
    { renderAsRouterLink: false, type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' },
    { renderAsRouterLink: false, type: 'icon', emit: 'coursesEmit', icon: BookOpenIcon, css: 'stroke-blue-600' },
]
const tableColumns: TableColumns[] = [
    { label: 'ID', sortable: true }, { label: 'Custom ID', sortable: true }, { label: 'Name', sortable: true },
    { label: 'Grade', sortable: true }, { label: 'Email', sortable: true }, { label: 'School' }
]

const limitLoadStudents = 3
const countTotStudents = ref(0)

let lastLoadSettings = { lastUsedIndex: 0, orderBy: '', orderDirec: 'asc' }

function setSorting(column: string, direction: 'asc' | 'desc') {
    switch (column) {
        case 'ID':
            lastLoadSettings.orderBy = 'id'
            break;
        case 'Custom ID':
            lastLoadSettings.orderBy = 'custom_id'
            break;
        case 'Name':
            lastLoadSettings.orderBy = 'name'
            break;

        case 'Grade':
            lastLoadSettings.orderBy = 'grade_id'
            break;
        case 'Email':
            lastLoadSettings.orderBy = 'email'
            break;
        case 'Birthday':
            lastLoadSettings.orderBy = 'birthday'
            break;
        default:
            break;
    }
    lastLoadSettings.orderDirec = direction
}

async function loadStudents(startIndex?: number) {
    if (startIndex === undefined)
        startIndex = lastLoadSettings.lastUsedIndex
    else
        lastLoadSettings.lastUsedIndex = startIndex

    let opt: any = {}
    opt.sort = { by: lastLoadSettings.orderBy, direction: lastLoadSettings.orderDirec }

    let resp = await getStudents(startIndex, limitLoadStudents, opt)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    studentData = resp.data.students
    countTotStudents.value = resp.data.tot_count
    studentDataForTable.value = []
    studentData.forEach(student => {
        studentDataForTable.value.push([student.id, student.custom_id, student.name, student.grade ? student.grade.name : 'DELETED GRADE', student.email, student.school])
    });
}

let gradeData: Grade[] = []
let gradeOptions: { value: number, text: string }[] = []

async function init() {
    loadStudents(0)
    let resp = await getGrades()
    if (resp.status === 'success') {
        gradeData = resp.data.grades
    }
    craftGradesAsOptions()
}
init()

function craftGradesAsOptions() {
    let ret: { value: number, text: string }[] = []
    gradeData.forEach(grade => {
        ret.push({ value: grade.id, text: grade.name })
    });
    gradeOptions = ret
}

async function addNewStudent() {
    dataEntryForm.newDataEntryForm('New Student', 'Create', [
        { name: 'custom_id', text: 'Student ID', type: 'text', required: true },
        { name: 'name', text: 'Name', type: 'text', required: true },
        { name: 'full_name', text: 'Full Name', type: 'text' },
        { name: 'grade_id', text: 'Select Grade', type: 'select', required: true, options: gradeOptions },
        { name: 'email', text: 'Email', type: 'text' },
        { name: 'birthday', text: 'Birth Date', type: 'date' },
        { name: 'phone_number', text: 'Phone Number', type: 'text' },
        { name: 'address', text: 'Address', type: 'textarea' },
        { name: 'school', text: 'School', type: 'text' },
        { name: 'parent_name', text: 'Parent Name', type: 'text' },
        { name: 'parent_phone_number', text: 'Parent\'s Phone Number', type: 'text' },
    ])

    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await createStudent(results.data['custom_id'] as string, results.data['name'] as string,
            results.data['full_name'] as string, results.data['grade_id'] as number, results.data['email'] as string, results.data['birthday'] as string,
            results.data['phone_number'] as string, results.data['address'] as string, results.data['school'] as string,
            results.data['parent_name'] as string, results.data['parent_phone_number'] as string)
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
        }
        dataEntryForm.finishSubmission()
        alertStore.insertAlert('Action completed.', 'Student added successfully.')
        loadStudents(0)
        uploadStudentImage(resp.data.student.id)
        break;
    }
}
async function uploadStudentImage(studentId: number) {
    dataEntryForm.newDataEntryForm('Student\'s Image', 'Upload', [
        { text: "You can update the image later also. Click 'close' to continue without image.", type: 'message' },
        { name: 'profile', text: 'Select Image', type: 'file', accept: '.jpg,.jpeg,.png', preview: true, required: true }
    ])
    let results = await dataEntryForm.waitForSubmittedData()
    if (!results.submitted)
        return

    let img: any = results.data.profile
    let res = await updateStudentImage(studentId, img[0]);
    if (res.status === 'error') {
        if (res.data.type === 'user_error')
            Object.entries(res.data.messages).forEach(msg => {
                let err = ""
                if (Array.isArray(msg[1]) && !msg[1] === null)
                    err = msg[1].join(', ')
                else
                    err = msg[1] as string
                dataEntryForm.insertErrorMessage(msg[0], err)
            })
        else
            alertStore.insertAlert('An error occurred.', res.message, 'error')
        dataEntryForm.finishSubmission()
        return
    }
    dataEntryForm.finishSubmission()
    alertStore.insertAlert('Action completed.', 'Student photo updated successfully.')
}

async function editStudent(id: number) {
    let student = studentData.find(s => s.id === id)!

    dataEntryForm.newDataEntryForm('Update Student', 'Update', [
        { name: 'id', text: 'ID', type: 'text', disabled: true, value: student.id },
        { name: 'custom_id', text: 'Student ID', type: 'text', required: true, value: student.custom_id },
        { name: 'name', text: 'Name', type: 'text', required: true, value: student.name },
        { name: 'full_name', text: 'Full Name', type: 'text', value: student.full_name },
        { name: 'grade_id', text: 'Select Grade', type: 'select', required: true, value: student.grade ? student.grade.id : '', options: gradeOptions },
        { name: 'email', text: 'Email', type: 'text', value: student.email },
        { name: 'birthday', text: 'Birth Date', type: 'date', value: student.birthday },
        { name: 'phone_number', text: 'Phone Number', type: 'text', value: student.phone_number },
        { name: 'address', text: 'Address', type: 'textarea', value: student.address },
        { name: 'school', text: 'School', type: 'text', value: student.school },
        { name: 'parent_name', text: 'Parent Name', type: 'text', value: student.parent_name },
        { name: 'parent_phone_number', text: 'Parent\'s Phone Number', type: 'text', value: student.parent_phone_number },
    ])

    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await updateStudent(results.data['id'] as number, results.data['custom_id'] as string, results.data['name'] as string,
            results.data['full_name'] as string, results.data['grade_id'] as number, results.data['email'] as string, results.data['birthday'] as string,
            results.data['phone_number'] as string, results.data['address'] as string, results.data['school'] as string,
            results.data['parent_name'] as string, results.data['parent_phone_number'] as string)
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
        }
        alertStore.insertAlert('Action completed.', 'Student updated successfully.')
        loadStudents()
        dataEntryForm.finishSubmission()
        break
    }
}

async function delStudent(ids: number[]) {
    let confirmed = await confirmationForm.newConfirmationForm("Confirm Deletion", "Are you sure you want to delete these students with IDs: " + ids.join(', ') + "?")
    if (!confirmed)
        return

    ids.forEach(async id => {
        let resp = await deleteStudent(id)
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured deleting student.', resp.message, 'error')
            return
        }
        alertStore.insertAlert('Action completed.', resp.message)
    });
    loadStudents()
}

function showMoreInfo(id: number) {
    let student = studentData.find(s => s.id === id)!
    extendablePopUpStore.showComponent(StudentMoreInfo, { 'student': student, 'uploadImageFunc': uploadStudentImage })
}

function showStudentCourses(id: number) {
    let student = studentData.find(s => s.id === id)
    extendablePopUpStore.showComponent(StudentCourses, { 'student': student, })

}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-16">
            <h4 class="font-semibold text-3xl">Students</h4>
            <NewItemButton text="New Student" :on-click="addNewStudent" />
        </div>
        <div class="mb-10">
            <TableComponent :table-columns="tableColumns" :table-rows="studentDataForTable" :actions="tableActions"
                @edit-emit="editStudent" @show-more="showMoreInfo"
                :refresh-func="async () => { await loadStudents(); return true }" @delete-emit="delStudent"
                @courses-emit="showStudentCourses" @load-page-emit="loadStudents"
                :paginate-page-size="limitLoadStudents" :paginate-total="countTotStudents" @sort-by="(col, dir) => {
                    setSorting(col, dir); loadStudents();
                }" :current-sorting="{ column: 'ID', direc: 'asc' }" />
        </div>
    </div>
</template>