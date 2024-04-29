<script setup>
import { sendDeleteRequest, sendGetRequest, sendJsonPatchRequest, sendJsonPostRequest } from '@/baseFunctions/requests';
import { useAlertsStore } from '@/stores/alerts';
import { ref } from 'vue';
import TableComponent from '@/components/TableComponent.vue';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import { useDataEntryFormsStore } from '@/stores/dataEntryFormManager';
import { useCacheStore } from '@/stores/cache';

const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()
const cacheStore = useCacheStore()

let roleData = []
let roleDataForTable = ref([])

async function loadUserRoles() {
    let data = await sendGetRequest('/user-groups')
    if (data.status === 'error') {
        alertStore.insertAlert('An error occured.', data.message, 'error')
    } else {
        roleDataForTable.value = []
        roleData = data.data.roles
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
    let data = await sendGetRequest('/permissions')
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

    let results = await dataEntryForm.newDataEntryForm('Create New User Role', 'Create', fields)
    if (!results.submitted)
        return

    let permissionsToAdd = extractSelectedPermsFromAddNewFormData(results.data)

    let resp = await sendJsonPostRequest('/user-groups', {
        "name": results.data.role_name,
        "permissions": permissionsToAdd
    })
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured creating user role.', resp.message, 'error')
        return
    }

    alertStore.insertAlert('Action completed.', resp.message)
    loadUserRoles()
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

function deleteRoles(ids) {
    ids.forEach(async id => {
        let resp = await sendDeleteRequest('/user-groups/' + id)
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured deleting user role.', resp.message, 'error')
            return
        }
        alertStore.insertAlert('Action completed.', resp.message)
    });
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

    let results = await dataEntryForm.newDataEntryForm('Update User Role', 'Update', fields)
    if (!results.submitted)
        return

    let permissionsToAdd = extractSelectedPermsFromAddNewFormData(results.data)

    let resp = await sendJsonPatchRequest('/user-groups/' + id, {
        "name": results.data.role_name,
        "permissions": permissionsToAdd
    })
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured updating user role.', resp.message, 'error')
        return
    }

    alertStore.insertAlert('Action completed.', resp.message)
    loadUserRoles()
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
            :refresh-func="async () => { await loadUserRoles(); return true }" @delete-emit="deleteRoles"
            @edit-emit="editRole" />
    </div>
</template>