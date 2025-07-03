<!-- eslint-disable no-constant-condition -->
<script setup lang="ts">
import { useAlertsStore } from '@/stores/alerts';
import { ref, type Ref } from 'vue';
import TableComponent, { type TableActionType, type TableColumns } from '@/components/TableComponent.vue';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import { useCacheStore } from '@/stores/cache';
import { createUserRole, deleteUserRole, getAllPermissions, getUserRoles, updateUserRole } from '@/apiConnections/userRoles';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { PencilSquareIcon } from '@heroicons/vue/24/solid';
import type { UserRole } from '@/types/userRoleTypes';

const confirmForm = useConfirmationFormsStore()
const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()
const cacheStore = useCacheStore()

let roleData: UserRole[] = []
let roleDataForTable: Ref<any> = ref([])
const tableActions: TableActionType[] = [
    { renderAsRouterLink: false, type: 'icon', emit: 'editEmit', icon: PencilSquareIcon, css: 'fill-blue-600' }
]
const tableColumns: TableColumns[] = [{ label: 'ID', sortable: true }, { label: 'Role Name', sortable: true }, { label: 'Permissions' }]


const limitLoadUserRoles = 30
const countTotUserRoles = ref(0)

let lastLoadSettings = { lastUsedIndex: 0, orderBy: '', orderDirec: 'asc' }

function setSorting(column: string, direction: 'asc' | 'desc') {
    switch (column) {
        case 'ID':
            lastLoadSettings.orderBy = 'id'
            break;
        case 'Role Name':
            lastLoadSettings.orderBy = 'role_name'
            break;
        default:
            break;
    }
    lastLoadSettings.orderDirec = direction
}

async function loadUserRoles(startIndex?: number) {
    if (startIndex === undefined)
        startIndex = lastLoadSettings.lastUsedIndex
    else
        lastLoadSettings.lastUsedIndex = startIndex

    let opt: any = {}
    opt.sort = { by: lastLoadSettings.orderBy, direction: lastLoadSettings.orderDirec }

    let data = await getUserRoles(startIndex, limitLoadUserRoles, opt)
    if (data.status === 'error') {
        alertStore.insertAlert('An error occured.', data.message, 'error')
    } else {
        roleDataForTable.value = []
        roleData = data.data.roles
        countTotUserRoles.value = data.data.tot_count

        roleData.forEach(role => {
            roleDataForTable.value.push([role.id, role.role_name, JSON.stringify(role.permissions)])
        });
    }
}
loadUserRoles()

let permissions: UserRole['permissions'] | undefined = undefined

async function loadPermissions() {
    if ('all-permissions' in cacheStore.caches) {
        permissions = JSON.parse(cacheStore.caches['all-permissions'])
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
    let fields: any = [
        { name: 'role_name', type: 'text', text: "Role Name", required: true },
        { type: 'heading', text: 'Select Permissions for this Role' },
    ]
    for (const [role, perms] of Object.entries(permissions!)) {
        let p: { name: string, text: string }[] = []
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

        let resp = await createUserRole(results.data.role_name as string, permissionsToAdd)
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
                alertStore.insertAlert('An error occured creating user role.', resp.message, 'error')
            continue
        }

        dataEntryForm.finishSubmission()
        alertStore.insertAlert('Action completed.', resp.message)
        loadUserRoles(0)
        break
    }
}

function createCategName(name: string) {
    name = name.replace('_', ' ')
    let parts = name.split(' ')
    let result = ""
    parts.forEach(part => {
        result += part.charAt(0).toUpperCase() + part.slice(1)
    });
    return result
}

async function deleteRoles(ids: number[]) {
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

async function editRole(id: number) {
    let role = roleData.find(r => r['id'] === id)!

    let fields: any[] = [
        { name: 'role_name', type: 'text', text: "Role Name", required: true, value: role['role_name'] },
        { type: 'heading', text: 'Select Permissions for this Role' },
    ]
    for (const [categ, perms] of Object.entries(permissions!)) {
        let p: { name: string, text: string, checked?: boolean }[] = []
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

        let resp = await updateUserRole(id, results.data.role_name as string, permissionsToAdd)
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
                alertStore.insertAlert('An error occured updating user role.', resp.message, 'error')
            continue
        }

        dataEntryForm.finishSubmission()
        alertStore.insertAlert('Action completed.', resp.message)
        loadUserRoles()
        break
    }
}

function extractSelectedPermsFromAddNewFormData(data: any) {
    let permissionsToAdd: { [key: string]: string[] } = {}

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
        <div class="mb-10">
            <TableComponent :table-columns="tableColumns" :table-rows="roleDataForTable" :actions="tableActions"
                :refresh-func="async () => { await loadUserRoles(); return true }" @delete-emit="deleteRoles"
                @edit-emit="editRole" @load-page-emit="loadUserRoles" :paginate-page-size="limitLoadUserRoles"
                :paginate-total="countTotUserRoles" :current-sorting="{ column: 'ID', direc: 'asc' }" @sort-by="(col, dir) => {
                    setSorting(col, dir); loadUserRoles();
                }" />
        </div>
    </div>
</template>