<script setup>
import { sendGetRequest } from '@/baseFunctions/requests';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import TableComponent from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useDataEntryFormsStore } from '@/stores/dataEntryFormManager';
import { ref } from 'vue';

const alertStore = useAlertsStore()
const dataEntryForm = useDataEntryFormsStore()

let userDataForTable = ref([])

async function loadUsers() {
    let data = await sendGetRequest('/users')
    if (data.status === 'error') {
        alertStore.insertAlert('An error occured.', data.message, 'error')
    } else {
        data.data.users.forEach(user => {
            userDataForTable.value.push([user.id, user.name, user.email, user.role.role_name])
        });
    }
}
loadUsers()

function addNewUser() {
    dataEntryForm.newDataEntryForm('Create New User', 'Create', [{ name: 'email', type: 'text', text: "Email" }])
    // newDataEntryForm('hehe')
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center">
            <h4 class="font-semibold text-3xl mb-8">Users</h4>
            <NewItemButton text="New User" :on-click="addNewUser" />
        </div>
        <TableComponent :table-columns="['ID', 'Name', 'Email', 'Role']" :table-rows="userDataForTable" />
    </div>
</template>
