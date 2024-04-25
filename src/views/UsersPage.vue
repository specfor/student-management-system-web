<script setup>
import { sendGetRequest } from '@/baseFunctions/requests';

import TableComponent from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { ref } from 'vue';

const alertStore = useAlertsStore()

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
</script>

<template>
    <div class="container">
        <h4 class="font-semibold text-3xl mb-8">Users</h4>
        <TableComponent :table-columns="['ID', 'Name', 'Email', 'Role']" :table-rows="userDataForTable" />
    </div>
</template>
