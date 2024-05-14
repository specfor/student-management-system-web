<!-- eslint-disable no-constant-condition -->
<script setup>
import { getUserRoles } from '@/apiConnections/userRoles';
import { createUser, deleteUser, getUsers, updateUser } from '@/apiConnections/users';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import TableComponent from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { ref } from 'vue';
import { PencilSquareIcon } from '@heroicons/vue/24/solid';

const alertStore = useAlertsStore()
const dataEntryForm = useDataEntryFormsStore()
const confirmForm = useConfirmationFormsStore()

let userData = []
let userDataForTable = ref([])
const tableActions = [{ type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }]

async function loadUsers() {
    userDataForTable.value = []
    let data = await getUsers()
    if (data.status === 'error') {
        alertStore.insertAlert('An error occured.', data.message, 'error')
    } else {
        userData = data.data.users
        data.data.users.forEach(user => {
            userDataForTable.value.push([user.id, user.name, user.email, user.role.role_name])
        });
    }
}
loadUsers()

async function addNewUser() {
    dataEntryForm.newDataEntryForm('Create New User', 'Create', [
        { name: 'name', type: 'text', text: 'Name', require: true },
        { name: 'email', type: 'text', text: "Email", require: true },
        { name: 'password', type: 'password', text: 'Password', require: true },
        { name: 'role', type: 'select', text: 'Select User Role', require: true, options: userRoleOptionFields }
    ])
    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await createUser(results.data.name, results.data.email, results.data.password, results.data.role)
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured.', resp.message, 'error')
            continue
        } else {
            alertStore.insertAlert('Action completed.', resp.message)
            loadUsers()
            dataEntryForm.finishSubmission()
            return
        }
    }
}

async function editUser(id) {
    let user = userData.find(u => u.id === id)

    dataEntryForm.newDataEntryForm('Update User', 'Update', [
        { name: 'name', type: 'text', text: 'Name', require: true, value: user.name },
        { name: 'role', type: 'select', text: 'Select User Role', require: true, value: user.role.id, options: userRoleOptionFields }
    ])

    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await updateUser(id, results.data.name, results.data.role)
        if (resp.status === 'error') {
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

async function delUser(ids) {
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
let userRoleOptionFields = []


async function init() {
    let userRoles = await getUserRoles()
    if (userRoles.status === 'error') {
        return
    }
    userRoles = userRoles.data.roles

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
        <TableComponent :table-columns="['ID', 'Name', 'Email', 'Role']" :table-rows="userDataForTable"
            :actions="tableActions" @edit-emit="editUser" :refresh-func="async () => { await loadUsers(); return true }"
            @delete-emit="delUser" />
    </div>
</template>
