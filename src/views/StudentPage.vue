<script setup>
import { getGrades } from '@/apiConnections/grades';
import { createStudent, deleteStudent, getStudents, updateStudent } from '@/apiConnections/students';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import TableComponent from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { ref } from "vue"
import { MagnifyingGlassIcon } from '@heroicons/vue/24/solid';

const alertStore = useAlertsStore()
const dataEntryForm = useDataEntryFormsStore()
const confirmationForm = useConfirmationFormsStore()

let studentData = []
const studentDataForTable = ref([])
const tableActions = ref([
    { type: 'icon', emit: 'ShowMore', icon: MagnifyingGlassIcon, css: 'fill-blue-600' }
])

async function loadStudents() {
    let resp = await getStudents()
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    studentData = resp.data.students
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
    let results = await dataEntryForm.newDataEntryForm('New Student', 'Create', [
        { name: 'name', text: 'Name', type: 'text', require: true },
        { name: 'full_name', text: 'Full Name', type: 'text' },
        { name: 'grade_id', text: 'Select Grade', type: 'select', required: true, options: craftGradesAsOptions() },
        { name: 'email', text: 'Email', type: 'text' },
        { name: 'birthday', text: 'Birth Date', type: 'date' },
        { name: 'phone_number', text: 'Phone Number', type: 'text' },
        { name: 'address', text: 'Address', type: 'text' },
        { name: 'school', text: 'School', type: 'text' },
        { name: 'parent_name', text: 'Parent Name', type: 'text' },
        { name: 'parent_phone_number', text: 'Parent\'s Phone Number', type: 'text' },
    ])
    if (!results.submitted)
        return

    let resp = await createStudent(...Object.values(results.data))
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }
    alertStore.insertAlert('Action completed.', 'Student added successfully.')
    loadStudents()
}

async function editStudent(id) {
    let student = studentData.find(s => s.id === id)

    let results = await dataEntryForm.newDataEntryForm('New Student', 'Create', [
        { name: 'name', text: 'Name', type: 'text', value: student.name },
        { name: 'full_name', text: 'Full Name', type: 'text', value: student.full_name },
        { name: 'grade_id', text: 'Select Grade', type: 'select', value: student.grade.id, options: craftGradesAsOptions() },
        { name: 'email', text: 'Email', type: 'text', value: student.email },
        { name: 'birthday', text: 'Birth Date', type: 'date', value: student.birthday },
        { name: 'phone_number', text: 'Phone Number', type: 'text', value: student.phone_number },
        { name: 'address', text: 'Address', type: 'text', value: student.address },
        { name: 'school', text: 'School', type: 'text', value: student.school },
        { name: 'parent_name', text: 'Parent Name', type: 'text', value: student.parent_name },
        { name: 'parent_phone_number', text: 'Parent\'s Phone Number', type: 'text', value: student.parent_phone_number },
    ])
    if (!results.submitted)
        return

    let resp = await updateStudent(id, ...Object.values(results.data))
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }
    alertStore.insertAlert('Action completed.', 'Student updated successfully.')
    loadStudents()
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
    console.log(student);
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-16">
            <h4 class="font-semibold text-3xl">Students</h4>
            <NewItemButton text="New Student" :on-click="addNewStudent" />
        </div>
        <TableComponent :table-columns="['ID', 'Name', 'Grade', 'Email', 'School', 'Actions']"
            :table-rows="studentDataForTable" :actions="tableActions" @edit-emit="editStudent" @show-more="showMoreInfo"
            :refresh-func="async () => { await loadStudents(); return true }" @delete-emit="delStudent" />
    </div>
</template>