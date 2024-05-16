<!-- eslint-disable no-constant-condition -->
<script setup>
import { getGrades } from '@/apiConnections/grades';
import { createStudent, deleteStudent, getStudents, updateStudent, updateStudentImage } from '@/apiConnections/students';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import TableComponent from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { ref } from "vue"
import { MagnifyingGlassIcon, PencilSquareIcon } from '@heroicons/vue/24/solid';
import { useExtendablePopUpStore } from '@/stores/formManagers/extendablePopUp';
import StudentMoreInfo from '@/components/customPopUps/StudentMoreInfo.vue';

const alertStore = useAlertsStore()
const dataEntryForm = useDataEntryFormsStore()
const confirmationForm = useConfirmationFormsStore()
const extendablePopUpStore = useExtendablePopUpStore()

let studentData = []
const studentDataForTable = ref([])
const tableActions = [
    { type: 'icon', emit: 'ShowMore', icon: MagnifyingGlassIcon, css: 'fill-blue-600 w-5' },
    { type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]

async function loadStudents() {
    let resp = await getStudents()
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    studentData = resp.data.students
    studentDataForTable.value = []
    resp.data.students.forEach(student => {
        studentDataForTable.value.push([student.id, student.name, student.grade.name ?? '', student.email, student.school])
    });
}

let gradeData = []

async function init() {
    loadStudents()
    let resp = await getGrades()
    if (resp.status === 'success') {
        gradeData = resp.data.grades
    }
}
init()

function craftGradesAsOptions() {
    let ret = []
    gradeData.forEach(grade => {
        ret.push({ value: grade.id, text: grade.name })
    });
    return ret
}
async function addNewStudent() {
    dataEntryForm.newDataEntryForm('New Student', 'Create', [
        { name: 'name', text: 'Name', type: 'text', required: true },
        { name: 'full_name', text: 'Full Name', type: 'text' },
        { name: 'grade_id', text: 'Select Grade', type: 'select', required: true, options: craftGradesAsOptions() },
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

        let resp = await createStudent(...Object.values(results.data))
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured.', resp.message, 'error')
            continue
        }
        dataEntryForm.finishSubmission()
        alertStore.insertAlert('Action completed.', 'Student added successfully.')
        loadStudents()
        uploadStudentImage(resp.data.student.id)
        break;
    }
}
async function uploadStudentImage(insId) {
    dataEntryForm.newDataEntryForm('Student\'s Image', 'Upload', [
        { text: "You can update the image later also. Click 'close' to continue without image.", type: 'message' },
        { name: 'profile', text: 'Select Image', type: 'file', accept: '.jpg,.jpeg,.png', preview: true, required: true }
    ])
    let results = await dataEntryForm.waitForSubmittedData()
    if (!results.submitted)
        return

    let res = await updateStudentImage(insId, results.data.profile[0]);
    if (res.status === 'error') {
        alertStore.insertAlert('An error occurred.', res.message, 'error')
        dataEntryForm.finishSubmission()
        return
    }
    dataEntryForm.finishSubmission()
    alertStore.insertAlert('Action completed.', 'Student photo updated successfully.')
}

async function editStudent(id) {
    let student = studentData.find(s => s.id === id)

    dataEntryForm.newDataEntryForm('Update Student', 'Update', [
        { name: 'id', text: 'ID', type: 'text', disabled: true, value: student.id },
        { name: 'name', text: 'Name', type: 'text', required: true, value: student.name },
        { name: 'full_name', text: 'Full Name', type: 'text', value: student.full_name },
        { name: 'grade_id', text: 'Select Grade', type: 'select', required: true, value: student.grade.id, options: craftGradesAsOptions() },
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

        let resp = await updateStudent(...Object.values(results.data))
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured.', resp.message, 'error')
            continue
        }
        alertStore.insertAlert('Action completed.', 'Student updated successfully.')
        loadStudents()
        dataEntryForm.finishSubmission()
        break
    }
}

async function delStudent(ids) {
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

function showMoreInfo(id) {
    let student = studentData.find(s => s.id === id)
    extendablePopUpStore.showComponent(StudentMoreInfo, { 'student': student, 'uploadImageFunc': uploadStudentImage })
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-16">
            <h4 class="font-semibold text-3xl">Students</h4>
            <NewItemButton text="New Student" :on-click="addNewStudent" />
        </div>
        <TableComponent :table-columns="['ID', 'Name', 'Grade', 'Email', 'School']" :table-rows="studentDataForTable"
            :actions="tableActions" @edit-emit="editStudent" @show-more="showMoreInfo"
            :refresh-func="async () => { await loadStudents(); return true }" @delete-emit="delStudent" />
    </div>
</template>