<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { createInstructor, deleteInstructor, getInstructors, updateInstructor, updateInstructorImage } from '@/apiConnections/instructors';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import TableComponent, { type Filter, type TableActionType, type TableColumns } from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { ref, type Ref } from "vue"
import { MagnifyingGlassIcon, PencilSquareIcon } from '@heroicons/vue/24/solid';
import { setRoute } from '@/utils/routeHelpers';
import type { Instructor } from '@/types/InstructorTypes';


const alertStore = useAlertsStore()
const dataEntryForm = useDataEntryFormsStore()
const confirmationForm = useConfirmationFormsStore()

let instructorData: Instructor[] = []
const instructorDataForTable: Ref<any[]> = ref([])
const tableActions: TableActionType[] = [
    { renderAsRouterLink: false, type: 'icon', emit: 'ShowMore', icon: MagnifyingGlassIcon, css: 'fill-blue-600 w-5' },
    { renderAsRouterLink: false, type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]
const tableColumns: TableColumns[] = [
    { label: 'ID', sortable: true }, { label: 'Name', sortable: true }, { label: 'Email', sortable: true },
    { label: 'Phone Number' }, { label: 'Work Place' }]
const tableFilters: Filter[] = [{ name: 'name', label: 'Name', type: 'text' }, { name: 'email', label: 'Email', type: 'text' },
{ name: 'phone_number', label: 'Phone Number', type: 'text' }]

const limitLoadInstructors = 30
const countTotInstructors = ref(0)

let lastLoadSettings: { lastUsedIndex: number, orderBy: string, orderDirec: 'asc' | 'desc', filters?: { name?: string, email?: string, phone_number?: string } }
    = { lastUsedIndex: 0, orderBy: '', orderDirec: 'asc' }

function setSorting(column: string, direction: 'asc' | 'desc') {
    switch (column) {
        case 'ID':
            lastLoadSettings.orderBy = 'id'
            break;
        case 'Name':
            lastLoadSettings.orderBy = 'name'
            break;
        default:
            break;
    }
    lastLoadSettings.orderDirec = direction
}

async function loadInstructors(startIndex?: number, filters?: any) {
    if (startIndex === undefined)
        startIndex = lastLoadSettings.lastUsedIndex
    else
        lastLoadSettings.lastUsedIndex = startIndex

    if (filters)
        lastLoadSettings.filters = filters

    let opt: any = {}
    opt.sort = { by: lastLoadSettings.orderBy, direction: lastLoadSettings.orderDirec }
    opt.filters = lastLoadSettings.filters

    let resp = await getInstructors(startIndex, limitLoadInstructors, opt)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    instructorData = resp.data.instructors
    countTotInstructors.value = resp.data.tot_count

    instructorDataForTable.value = []
    instructorData.forEach(instructor => {
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

        const instr = results.data
        let resp = await createInstructor(instr.name as string, instr.email as string, instr.phone_number as string,
            instr.birthday as string, instr.address as string, instr.work_place as string)
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
                alertStore.insertAlert('An error occurred.', resp.message, 'error')
            continue
        }
        dataEntryForm.finishSubmission()
        alertStore.insertAlert('Action completed.', 'Instructor added successfully.')
        loadInstructors(0)
        insId = resp.data.instructor.id
        break;
    }
    uploadInstructorImage(insId)
}

async function uploadInstructorImage(insId: number) {
    dataEntryForm.newDataEntryForm('Instructor\'s Image', 'Upload', [
        { text: "You can update the image later also. Click 'Cancel' to continue without image.", type: 'message' },
        { name: 'profile', text: 'Select Image', type: 'file', accept: '.jpg,.jpeg,.png', preview: true, required: true }
    ])
    let results = await dataEntryForm.waitForSubmittedData()
    if (!results.submitted)
        return

    let img: any = results.data.profile
    let res = await updateInstructorImage(insId, img[0]);
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
        return
    }
    dataEntryForm.finishSubmission()
    alertStore.insertAlert('Action completed.', 'Instructor photo updated successfully.')
}

async function editInstructor(id: number) {
    let instructor = instructorData.find(s => s.id === id)!

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

        let resp = await updateInstructor(id, results.data.name as string, results.data.email as string, results.data.phone_number as string,
            results.data.birthday as string, results.data.address as string, results.data.work_place as string)
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
        alertStore.insertAlert('Action completed.', 'Instructor updated successfully.')
        loadInstructors()
        dataEntryForm.finishSubmission()
        break
    }
}

async function delInstructor(ids: number[]) {
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

function showMoreInfo(id: number) {
    setRoute(`/instructors/${id}/view`)
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-16">
            <h4 class="font-semibold text-3xl">Instructors</h4>
            <NewItemButton text="New Instructor" :on-click="addNewInstructor" />
        </div>
        <div class="mb-10">
            <TableComponent :table-columns="tableColumns" :table-rows="instructorDataForTable" :actions="tableActions"
                @edit-emit="editInstructor" @show-more="showMoreInfo"
                :refresh-func="async () => { await loadInstructors(); return true }" @delete-emit="delInstructor"
                @load-page-emit="loadInstructors" :paginate-page-size="limitLoadInstructors"
                :paginate-total="countTotInstructors" :current-sorting="{ column: 'ID', direc: 'asc' }" @sort-by="(col, dir) => {
                    setSorting(col, dir); loadInstructors();
                }" :filters="tableFilters" @filter-values="(val) => {
                    loadInstructors(undefined, val)
                }" />
        </div>
    </div>
</template>