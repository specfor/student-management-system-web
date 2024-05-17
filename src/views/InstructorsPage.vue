<!-- eslint-disable no-constant-condition -->
<script setup>
import { createInstructor, deleteInstructor, getInstructors, updateInstructor, updateInstructorImage } from '@/apiConnections/instructors';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import TableComponent from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { ref } from "vue"
import { MagnifyingGlassIcon, PencilSquareIcon } from '@heroicons/vue/24/solid';
import { useExtendablePopUpStore } from '@/stores/formManagers/extendablePopUp';
import StudentMoreInfo from '@/components/customPopUps/StudentMoreInfo.vue';
import PaginateComponent from '@/components/PaginateComponent.vue';


const alertStore = useAlertsStore()
const dataEntryForm = useDataEntryFormsStore()
const confirmationForm = useConfirmationFormsStore()
const extendablePopUpStore = useExtendablePopUpStore()

let instructorData = []
const instructorDataForTable = ref([])
const tableActions = [
    { type: 'icon', emit: 'ShowMore', icon: MagnifyingGlassIcon, css: 'fill-blue-600 w-5' },
    { type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]


const limitLoadInstructors = 30
const countTotInstructors = ref(0)

async function loadInstructors(startIndex = 0) {
    let resp = await getInstructors(startIndex, limitLoadInstructors)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    instructorData = resp.data.instructors
    countTotInstructors.value = resp.data.tot_count

    instructorDataForTable.value = []
    resp.data.instructors.forEach(instructor => {
        instructorDataForTable.value.push([instructor.id, instructor.name, instructor.email, instructor.phone_number, instructor.work_place])
    });
}

async function init() {
    loadInstructors()
}
init()

async function addNewInstructor() {
    dataEntryForm.newDataEntryForm('New Instructor', 'Create', [
        { name: 'name', text: 'Name', type: 'text', required: true },
        { name: 'email', text: 'Email', type: 'text' },
        { name: 'phone_number', text: 'Phone Number', type: 'text' },
        { name: 'birthday', text: 'Birth Date', type: 'date' },
        { name: 'address', text: 'Address', type: 'textarea' },
        { name: 'work_place', text: 'Work Place', type: 'text' },
    ])

    let insId = null;
    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        console.log(results.data);
        let resp = await createInstructor(...Object.values(results.data))
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occurred.', resp.message, 'error')
            continue
        }
        dataEntryForm.finishSubmission()
        alertStore.insertAlert('Action completed.', 'Instructor added successfully.')
        loadInstructors()
        insId = resp.data.instructor.id
        break;
    }
    uploadInstructorImage(insId)
}

async function uploadInstructorImage(insId) {
    dataEntryForm.newDataEntryForm('Instructor\'s Image', 'Upload', [
        { text: "You can update the image later also. Click 'Cancel' to continue without image.", type: 'message' },
        { name: 'profile', text: 'Select Image', type: 'file', accept: '.jpg,.jpeg,.png', preview: true, required: true }
    ])
    let results = await dataEntryForm.waitForSubmittedData()
    if (!results.submitted)
        return

    let res = await updateInstructorImage(insId, results.data.profile[0]);
    if (res.status === 'error') {
        alertStore.insertAlert('An error occurred.', res.message, 'error')
        return
    }
    dataEntryForm.finishSubmission()
    alertStore.insertAlert('Action completed.', 'Instructor photo updated successfully.')
}

async function editInstructor(id) {
    let instructor = instructorData.find(s => s.id === id)

    dataEntryForm.newDataEntryForm('Update Instructor', 'Update', [
        { name: 'id', text: 'ID', type: 'text', disabled: true, value: instructor.id },
        { name: 'name', text: 'Name', type: 'text', required: true, value: instructor.name },
        { name: 'email', text: 'Email', type: 'text', value: instructor.email },
        { name: 'phone_number', text: 'Phone Number', type: 'text', value: instructor.phone_number },
        { name: 'birthday', text: 'Birth Date', type: 'date', value: instructor.birthday },
        { name: 'address', text: 'Address', type: 'textarea', value: instructor.address },
        { name: 'work_place', text: 'Work Place', type: 'text', value: instructor.work_place },
    ])

    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await updateInstructor(...Object.values(results.data))
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured.', resp.message, 'error')
            continue
        }
        alertStore.insertAlert('Action completed.', 'Instructor updated successfully.')
        loadInstructors()
        dataEntryForm.finishSubmission()
        break
    }
}

async function delInstructor(ids) {
    let confirmed = await confirmationForm.newConfirmationForm("Confirm Deletion", "Are you sure you want to delete these instructors with IDs: " + ids.join(', ') + "?")
    if (!confirmed)
        return

    ids.forEach(async id => {
        let resp = await deleteInstructor(id)
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured deleting instructor.', resp.message, 'error')
            return
        }
        alertStore.insertAlert('Action completed.', resp.message)
    });
    loadInstructors()
}

function showMoreInfo(id) {
    let instructor = instructorData.find(s => s.id === id)
    extendablePopUpStore.showComponent(StudentMoreInfo, instructor)
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-16">
            <h4 class="font-semibold text-3xl">Instructors</h4>
            <NewItemButton text="New Instructor" :on-click="addNewInstructor" />
        </div>
        <TableComponent :table-columns="['ID', 'Name', 'Email', 'Phone Number', 'Work Place']"
            :table-rows="instructorDataForTable" :actions="tableActions" @edit-emit="editInstructor"
            @show-more="showMoreInfo" :refresh-func="async () => { await loadInstructors(); return true }"
            @delete-emit="delInstructor" />

        <div class="flex justify-center mt-4 mb-10">
            <PaginateComponent :total-count="countTotInstructors" :page-size="limitLoadInstructors"
                @load-page-emit="loadInstructors" />
        </div>
    </div>
</template>