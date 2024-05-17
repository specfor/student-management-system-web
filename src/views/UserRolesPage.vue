<!-- eslint-disable no-constant-condition -->
<script setup>
import { useAlertsStore } from '@/stores/alerts';
import { ref } from 'vue';
import TableComponent from '@/components/TableComponent.vue';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { useCacheStore } from '@/stores/cache';
import { createUserRole, deleteUserRole, getAllPermissions, getUserRoles, updateUserRole } from '@/apiConnections/userRoles';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { PencilSquareIcon } from '@heroicons/vue/24/solid';
import PaginateComponent from '@/components/PaginateComponent.vue';


const confirmForm = useConfirmationFormsStore()
const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()
const cacheStore = useCacheStore()

let roleData = []
let roleDataForTable = ref([])
const tableActions = [
    { type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]


const limitLoadUserRoles = 30
const countTotUserRoles = ref(0)

async function loadUserRoles(startIndex = 0) {
    let data = await getUserRoles(startIndex, limitLoadUserRoles)
    if (data.status === 'error') {
        alertStore.insertAlert('An error occured.', data.message, 'error')
    } else {
        roleDataForTable.value = []
        roleData = data.data.roles
        countTotUserRoles.value = data.data.tot_count

        data.data.roles.forEach(role => {
            roleDataForTable.value.push([role.id, role.role_name, JSON.stringify(role.permissions)])
        });
    }
}
loadUserRoles()

let permissions = []

async function loadPermissions() {
    if ('all-permissions' in cacheStore.caches) {
        permissions = cacheStore.caches['all-permissions']
        return
    }
    let data = await getAllPermissions()
    if (data.status === 'error')
        alertStore.insertAlert('An error occured.', data.message, 'error')
    else {
        permissions = data.data.permissions
        cacheStore.createNew('all-permissions', data.data.permissions, 1)
    }
}
loadPermissions()

async function newUserRole() {
    let fields = [
        { name: 'role_name', type: 'text', text: "Role Name", required: true },
        { type: 'heading', text: 'Select Permissions for this Role' },
    ]
    for (const [role, perms] of Object.entries(permissions)) {
        let p = []
        perms.forEach(perm => {
            p.push({ name: perm, text: perm.charAt(0).toUpperCase() + perm.slice(1) })
        });
        fields.push({ type: 'checkbox', text: createCategName(role), name: role, options: p })
    }

    dataEntryForm.newDataEntryForm('Create New User Role', 'Create', fields)

    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let permissionsToAdd = extractSelectedPermsFromAddNewFormData(results.data)

        let resp = await createUserRole(results.data.role_name, permissionsToAdd)
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured creating user role.', resp.message, 'error')
            continue
        }

        dataEntryForm.finishSubmission()
        alertStore.insertAlert('Action completed.', resp.message)
        loadUserRoles()
        break
    }
}

function createCategName(name) {
    name = name.replace('_', ' ')
    let parts = name.split(' ')
    let result = ""
    parts.forEach(part => {
        result += part.charAt(0).toUpperCase() + part.slice(1)
    });
    return result
}

async function deleteRoles(ids) {
    let confirmed = await confirmForm.newConfirmationForm("Confirm Deletion", "Are you sure you want to delete these user roles with IDs: " + ids.join(', ') + "?")
    if (!confirmed)
        return

    ids.forEach(async id => {
        let resp = await deleteUserRole(id)
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured deleting user role.', resp.message, 'error')
            return
        }
        alertStore.insertAlert('Action completed.', resp.message)
    });
    loadUserRoles()
}

async function editRole(id) {
    let role = roleData.find(r => r['id'] === id)

    let fields = [
        { name: 'role_name', type: 'text', text: "Role Name", required: true, value: role['role_name'] },
        { type: 'heading', text: 'Select Permissions for this Role' },
    ]
    for (const [categ, perms] of Object.entries(permissions)) {
        let p = []
        perms.forEach(perm => {
            let permsAlreadySelected = role['permissions'][categ] ?? null
            if (permsAlreadySelected === null) {
                p.push({ name: perm, text: perm.charAt(0).toUpperCase() + perm.slice(1) })
            } else {
                if (permsAlreadySelected.includes(perm))
                    p.push({ name: perm, text: perm.charAt(0).toUpperCase() + perm.slice(1), checked: true })
                else
                    p.push({ name: perm, text: perm.charAt(0).toUpperCase() + perm.slice(1) })
            }
        });

        fields.push({ type: 'checkbox', text: createCategName(categ), name: categ, options: p })
    }

    dataEntryForm.newDataEntryForm('Update User Role', 'Update', fields)

    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let permissionsToAdd = extractSelectedPermsFromAddNewFormData(results.data)

        let resp = await updateUserRole(id, results.data.role_name, permissionsToAdd)
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured updating user role.', resp.message, 'error')
            continue
        }

        dataEntryForm.finishSubmission()
        alertStore.insertAlert('Action completed.', resp.message)
        loadUserRoles()
        break
    }
}

function extractSelectedPermsFromAddNewFormData(data) {
    let permissionsToAdd = {}

    for (const [key, val] of Object.entries(data)) {
        if (val === null || typeof val !== 'object' || Array.isArray(val))
            continue

        let selectedPermOptions = []
        for (const [permType, permVal] of Object.entries(val)) {
            if (permVal) {
                selectedPermOptions.push(permType)
            }
        }
        if (selectedPermOptions.length === 0)
            continue

        permissionsToAdd[key] = selectedPermOptions
    }
    return permissionsToAdd
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mb-16">
            <h4 class="font-semibold text-3xl">User Roles</h4>
            <NewItemButton text="New Role" :on-click="newUserRole" />
        </div>
        <TableComponent :table-columns="['ID', 'Role Name', 'Permissions']" :table-rows="roleDataForTable"
            :actions="tableActions" :refresh-func="async () => { await loadUserRoles(); return true }"
            @delete-emit="deleteRoles" @edit-emit="editRole" />

        <div class="flex justify-center mt-4 mb-10">
            <PaginateComponent :total-count="countTotUserRoles" :page-size="limitLoadUserRoles"
                @load-page-emit="loadUserRoles" />
        </div>
    </div>
</template>