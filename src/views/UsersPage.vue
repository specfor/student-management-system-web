<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { getUserRoles } from '@/apiConnections/userRoles';
import { createUser, deleteUser, getUsers, updateUser } from '@/apiConnections/users';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import TableComponent, { type TableActionType, type TableColumns } from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { ref, type Ref } from 'vue';
import { PencilSquareIcon } from '@heroicons/vue/24/solid';

const alertStore = useAlertsStore()
const dataEntryForm = useDataEntryFormsStore()
const confirmForm = useConfirmationFormsStore()

let userData: User[] = []
let userDataForTable: Ref<any[][]> = ref([])
const tableActions: TableActionType[] = [{ renderAsRouterLink: false, type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }]
const tableColumns: TableColumns[] = [{ label: 'ID', sortable: true }, { label: 'Name', sortable: true }, { label: 'Email', sortable: true }, { label: 'Role' }]

const limitLoadUsers = 30
const countTotUsers = ref(0)

let userRoleOptionFields: { text: string, value: any }[] = []

let lastLoadSettings = { lastUsedIndex: 0, orderBy: '', orderDirec: 'asc' }

function setSorting(column: string, direction: 'asc' | 'desc') {
    switch (column) {
        case 'ID':
            lastLoadSettings.orderBy = 'id'
            break;
        case 'Name':
            lastLoadSettings.orderBy = 'name'
            break;
        case 'Email':
            lastLoadSettings.orderBy = 'email'
            break;
        case 'Role':
            lastLoadSettings.orderBy = 'role_id'
            break;
        default:
            break;
    }
    lastLoadSettings.orderDirec = direction
}

async function loadUsers(startIndex?: number) {
    if (startIndex === undefined)
        startIndex = lastLoadSettings.lastUsedIndex
    else
        lastLoadSettings.lastUsedIndex = startIndex

    let opt: any = {}
    opt.sort = { by: lastLoadSettings.orderBy, direction: lastLoadSettings.orderDirec }

    let data = await getUsers(startIndex, limitLoadUsers, opt)
    if (data.status === 'error') {
        alertStore.insertAlert('An error occured.', data.message, 'error')
    } else {
        userDataForTable.value = []
        userData = data.data.users
        countTotUsers.value = data.data.tot_count
        userData.forEach(user => {
            userDataForTable.value.push([user.id, user.name, user.email, user.role.role_name])
        });
    }
}
loadUsers()

async function addNewUser() {
    dataEntryForm.newDataEntryForm('Create New User', 'Create', [
        { name: 'name', type: 'text', text: 'Name', required: true },
        { name: 'email', type: 'text', text: "Email", required: true },
        { name: 'password', type: 'password', text: 'Password', required: true },
        { name: 'role', type: 'select', text: 'Select User Role', required: true, options: userRoleOptionFields }
    ])
    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await createUser(results.data.name as string, results.data.email as string, results.data.password as string, results.data.role as number)
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
            alertStore.insertAlert('Action completed.', resp.message)
            loadUsers(0)
            dataEntryForm.finishSubmission()
            return
        }
    }
}

async function editUser(id: number) {
    let user = userData.find(u => u.id === id)!

    dataEntryForm.newDataEntryForm('Update User', 'Update', [
        { name: 'name', type: 'text', text: 'Name', required: true, value: user.name },
        { name: 'role', type: 'select', text: 'Select User Role', required: true, value: user.role.id, options: userRoleOptionFields }
    ])

    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await updateUser(id, results.data.name as string, results.data.role as number)
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
            alertStore.insertAlert('Action completed.', resp.message)
            dataEntryForm.finishSubmission()
            loadUsers()
            return
        }
    }
}

async function delUser(ids: number[]) {
    let confirmed = await confirmForm.newConfirmationForm("Confirm Deletion", "Are you sure you want to delete these users with IDs: " + ids.join(', ') + "?")
    if (!confirmed)
        return

    ids.forEach(async id => {
        let resp = await deleteUser(id)
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured deleting user.', resp.message, 'error')
            return
        }
        alertStore.insertAlert('Action completed.', resp.message)
    });
    loadUsers()
}


async function init() {
    let userRolesRes = await getUserRoles()
    if (userRolesRes.status === 'error') {
        return
    }
    const userRoles = userRolesRes.data.roles as UserRole[]

    userRoles.forEach(userRole => {
        userRoleOptionFields.push({ text: userRole.role_name, value: userRole.id })
    });
}

init()

// Todo implement password reset option
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-16">
            <h4 class="font-semibold text-3xl">Users</h4>
            <NewItemButton text="New User" :on-click="addNewUser" />
        </div>
        <div class="mb-10">
            <TableComponent :table-columns="tableColumns" :table-rows="userDataForTable" :actions="tableActions"
                @edit-emit="editUser" :refresh-func="async () => { await loadUsers(); return true }"
                @delete-emit="delUser" @load-page-emit="loadUsers" :paginate-page-size="limitLoadUsers"
                :paginate-total="countTotUsers" :current-sorting="{ column: 'ID', direc: 'asc' }" @sort-by="(col, dir) => {
                    setSorting(col, dir); loadUsers();
                }" />
        </div>
    </div>
</template>
