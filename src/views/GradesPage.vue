<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { createGrade, deleteGrade, getGrades, updateGrade } from '@/apiConnections/grades';
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

const gradeDataForTable: Ref<any[]> = ref([])
let gradeData: Grade[] = []
const tableActions: TableActionType[] = [
    { renderAsRouterLink: false, type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]


const limitLoadGrades = 30
const countTotGrades = ref(0)

async function loadGrades(startIndex = 0) {
    let resp = await getGrades(startIndex, limitLoadGrades)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    gradeData = resp.data.grades
    countTotGrades.value = resp.data.tot_count

    gradeDataForTable.value = []
    gradeData.forEach(grade => {
        gradeDataForTable.value.push([grade.id, grade.name])
    });
}
loadGrades()

async function addNewGrade() {
    dataEntryForm.newDataEntryForm('Create New Grade', 'Create', [
        { name: 'name', type: 'text', text: 'Name', required: true }
    ])

    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await createGrade(results.data.name as string)
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
            loadGrades()
            break
        }
    }
}

async function editGrade(id: number) {
    let grade = gradeData.find(g => g.id === id)!

    dataEntryForm.newDataEntryForm('Update Grade', 'Update', [
        { name: 'name', type: 'text', text: 'Name', required: true, value: grade.name }
    ])

    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await updateGrade(id, results.data.name as string)
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
            loadGrades()
            break
        }
    }
}

async function delGrade(ids: number[]) {
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
        <div class="mb-10">
            <TableComponent :table-columns="['ID', 'Name']" :table-rows="gradeDataForTable" @edit-emit="editGrade"
                :actions="tableActions" :refresh-func="async () => { await loadGrades(); return true }"
                @delete-emit="delGrade" @load-page-emit="loadGrades" :paginate-page-size="limitLoadGrades"
                :paginate-total="countTotGrades" />
        </div>
    </div>
</template>