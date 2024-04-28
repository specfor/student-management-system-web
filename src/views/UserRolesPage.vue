<script setup>
import { sendGetRequest, sendJsonPostRequest } from '@/baseFunctions/requests';
import { useAlertsStore } from '@/stores/alerts';
import { ref } from 'vue';
import TableComponent from '@/components/TableComponent.vue';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import { useDataEntryFormsStore } from '@/stores/dataEntryFormManager';
import { useCacheStore } from '@/stores/cache';

const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()
const cacheStore = useCacheStore()

let roleDataForTable = ref([])

async function loadUserRoles() {
    let data = await sendGetRequest('/user-groups')
    if (data.status === 'error') {
        alertStore.insertAlert('An error occured.', data.message, 'error')
    } else {
        roleDataForTable.value = []
        data.data.roles.forEach(role => {
            roleDataForTable.value.push([role.id, role.role_name, JSON.stringify(role.permissions)])
        });
    }
}
loadUserRoles()

const permissions = ref([])

async function loadPermissions() {
    if ('all-permissions' in cacheStore.caches) {
        permissions.value = cacheStore.caches['all-permissions']
        return
    }
    let data = await sendGetRequest('/permissions')
    if (data.status === 'error')
        alertStore.insertAlert('An error occured.', data.message, 'error')
    else {
        permissions.value = data.data.permissions
        cacheStore.createNew('all-permissions', data.data.permissions, 1)
    }
}
loadPermissions()

async function newUserRole() {
    let fields = [
        { name: 'role_name', type: 'text', text: "Role Name", required: true },
        { type: 'heading', text: 'Select Permissions for this Role' },
    ]
    for (const [role, perms] of Object.entries(permissions.value)) {
        let p = []
        perms.forEach(perm => {
            p.push({ name: perm, text: perm.charAt(0).toUpperCase() + perm.slice(1) })
        });
        fields.push({ type: 'checkbox', text: createRoleName(role), name: role, options: p })
    }

    let results = await dataEntryForm.newDataEntryForm('Create New User Role', 'Create', fields)
    if (!results.submitted)
        return

    let permissionsToAdd = {}

    for (const [key, val] of Object.entries(results.data)) {
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

function createRoleName(name) {
    name = name.replace('_', ' ')
    let parts = name.split(' ')
    let result = ""
    parts.forEach(part => {
        result += part.charAt(0).toUpperCase() + part.slice(1)
    });
    return result
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center">
            <h4 class="font-semibold text-3xl mb-8">User Roles</h4>
            <NewItemButton text="New Role" :on-click="newUserRole" />
        </div>
        <TableComponent :table-columns="['ID', 'Role Name', 'Permissions']" :table-rows="roleDataForTable" />
    </div>
</template>