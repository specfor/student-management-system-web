<script setup>
import { createGrade, deleteGrade, getGrades, updateGrade } from '@/apiConnections/grades';
import TableComponent from '@/components/TableComponent.vue';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { ref } from 'vue';

const confirmationForm = useConfirmationFormsStore()
const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()

const gradeDataForTable = ref([])
let gradeData = []

async function loadGrades() {
    let resp = await getGrades()
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    gradeData = resp.data.grades
    gradeDataForTable.value = []
    resp.data.grades.forEach(grade => {
        gradeDataForTable.value.push([grade.id, grade.name])
    });
}
loadGrades()

async function addNewGrade() {
    let results = await dataEntryForm.newDataEntryForm('Create New Grade', 'Create', [
        { name: 'name', type: 'text', text: 'Name', require: true }
    ])
    if (!results.submitted)
        return

    let resp = await createGrade(results.data.name)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
    } else {
        alertStore.insertAlert('Action completed.', resp.message)
        loadGrades()
    }
}

async function editGrade(id) {
    let grade = gradeData.find(g => g.id === id)

    let results = await dataEntryForm.newDataEntryForm('Update Grade', 'Update', [
        { name: 'name', type: 'text', text: 'Name', require: true, value: grade.name }
    ])
    if (!results.submitted)
        return

    let resp = await updateGrade(id, results.data.name)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
    } else {
        alertStore.insertAlert('Action completed.', resp.message)
        loadGrades()
    }
}

async function delGrade(ids) {
    let confirmed = await confirmationForm.newConfirmationForm("Confirm Deletion", "Are you sure you want to delete these grades with IDs: " + ids.join(', ') + "?")
    if (!confirmed)
        return

    ids.forEach(async id => {
        let resp = await deleteGrade(id)
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured deleting grade.', resp.message, 'error')
            return
        }
        alertStore.insertAlert('Action completed.', resp.message)
    });
    loadGrades()
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-16">
            <h4 class="font-semibold text-3xl">Grades</h4>
            <NewItemButton text="New Grade" :on-click="addNewGrade" />
        </div>
        <TableComponent :table-columns="['ID', 'Name']" :table-rows="gradeDataForTable" @edit-emit="editGrade"
            :refresh-func="async () => { await loadGrades(); return true }" @delete-emit="delGrade" />
    </div>
</template>