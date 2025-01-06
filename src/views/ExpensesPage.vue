<script setup lang="ts">
import { createExpense, createExpenseCateg, deleteExpense, deleteExpenseCateg, getExpenseCateg, getExpenses } from '@/apiConnections/expenses';
import NewItemButton from '@/components/minorUiComponents/NewItemButton.vue';
import PopUpPlaceholder from '@/components/popUpPlaceholder.vue';
import type { TableColumns } from '@/components/TableComponent.vue';
import TableComponent from '@/components/TableComponent.vue';
import { useAlertsStore } from '@/stores/alerts';
import { useConfirmationFormsStore } from '@/stores/formManagers/confirmationForm';
import { useDataEntryFormsStore } from '@/stores/formManagers/dataEntryForm';
import type { ExpenseType } from '@/types/expenses';
import { CheckCircleIcon, MinusCircleIcon } from '@heroicons/vue/24/solid';
import { ref, type Ref } from 'vue';



const confirmationForm = useConfirmationFormsStore()
const dataEntryForm = useDataEntryFormsStore()
const alertStore = useAlertsStore()

const expenseDataForTable: Ref<any[]> = ref([])
let expenseData: ExpenseType[] = []
const tableColumns: TableColumns[] = [{ label: 'ID', sortable: true }, { label: 'Type', sortable: true }, { label: 'Amount' }, { label: 'Description' }, { label: 'Month' }]


const limitLoadExpenses = 30
const countTotExpenses = ref(0)


let lastLoadSettings = { lastUsedIndex: 0, orderBy: 'id', orderDirec: 'desc' }

function setSorting(column: string, direction: 'asc' | 'desc') {
    // 'id', 'type', 'month'
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

async function loadExpenses(startIndex?: number) {
    if (startIndex === undefined)
        startIndex = lastLoadSettings.lastUsedIndex
    else
        lastLoadSettings.lastUsedIndex = startIndex

    let opt: any = {}
    opt.sort = { by: lastLoadSettings.orderBy, direction: lastLoadSettings.orderDirec }

    let resp = await getExpenses(startIndex, limitLoadExpenses, opt)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
        return
    }

    expenseData = resp.data.expenses
    countTotExpenses.value = resp.data.tot_count

    expenseDataForTable.value = []
    expenseData.forEach(expense => {
        expenseDataForTable.value.push([expense.id, expense.type, expense.amount, expense.description, expense.month])
    });
}
loadExpenses()

async function addNewExpense() {
    dataEntryForm.newDataEntryForm('Add New Expense', 'Add', [
        {
            name: 'categ', type: 'select', text: 'Category', required: true, options: expenseCategs.value.map((cat) => {
                return { text: cat, value: cat }
            })
        },
        { name: 'amount', type: "number", text: "Amount (LKR)", required: true },
        { name: 'description', type: "text", text: "Description", required: true },
        { name: 'month', type: "month", text: "Month incurred", required: true },
    ])

    // eslint-disable-next-line no-constant-condition
    while (true) {
        let results = await dataEntryForm.waitForSubmittedData()
        if (!results.submitted)
            return

        let resp = await createExpense(results.data.categ as string, results.data.amount as number, results.data.description as string, results.data.month as string)
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
            dataEntryForm.finishSubmission()
            alertStore.insertAlert('Action completed.', resp.message)
            loadExpenses(0)
            break
        }
    }
}

async function delExpense(ids: number[]) {
    let confirmed = await confirmationForm.newConfirmationForm("Confirm Deletion", "Are you sure you want to delete these expenses with IDs: " + ids.join(', ') + "?")
    if (!confirmed)
        return

    ids.forEach(async id => {
        let resp = await deleteExpense(id)
        if (resp.status === 'error') {
            alertStore.insertAlert('An error occured deleting expense.', resp.message, 'error')
            return
        }
        alertStore.insertAlert('Action completed.', resp.message)
    });
    loadExpenses()
}



// Expence Categ model code

const showManageExpenseCategs = ref(false)
const showAddCategInput = ref(false)
const newCategName = ref("")

const expenseCategs: Ref<string[]> = ref([]);

async function loadExpenseCategs() {
    let resp = await getExpenseCateg()
    if (resp.status == 'success') {
        expenseCategs.value = resp.data.categs
    } else {
        alertStore.insertAlert('An error occured.', resp.message, 'error')
    }
}

loadExpenseCategs()


async function delExpenseCateg(categ: string) {
    let confirmed = await confirmationForm.newConfirmationForm("Confirm Deletion", "Are you sure you want to delete this expense category ?")
    if (!confirmed)
        return

    let resp = await deleteExpenseCateg(categ)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured deleting expense category.', resp.message, 'error')
        return
    }
    loadExpenseCategs()
    alertStore.insertAlert('Action completed.', resp.message)
}

async function addExpenseCateg() {
    if (newCategName.value == '')
        return

    let resp = await createExpenseCateg(newCategName.value)
    if (resp.status === 'error') {
        alertStore.insertAlert('An error occured adding expense category.', resp.message, 'error')
        return
    }
    alertStore.insertAlert('Action completed.', resp.message)
    loadExpenseCategs()
    showAddCategInput.value = false
}
</script>

<template>
    <div class="container">
        <div class="flex justify-between items-center mt-10 mb-16">
            <h4 class="font-semibold text-3xl">Expenses</h4>
            <div class="flex gap-x-10">
                <NewItemButton text="Expense Category"
                    :on-click="() => { newCategName = ''; showManageExpenseCategs = !showManageExpenseCategs }" />
                <NewItemButton text="New Expense" :on-click="addNewExpense" />
            </div>
        </div>
        <div class="mb-10">
            <TableComponent :table-columns="tableColumns" :table-rows="expenseDataForTable"
                :refresh-func="async () => { await loadExpenses(); return true }" @delete-emit="delExpense"
                @load-page-emit="loadExpenses" :paginate-page-size="limitLoadExpenses"
                :paginate-total="countTotExpenses" :current-sorting="{ column: 'ID', direc: 'desc' }" @sort-by="(col: string, dir: any) => {
                    setSorting(col, dir); loadExpenses();
                }" />
        </div>
    </div>

    <PopUpPlaceholder :show="showManageExpenseCategs" :options="{ closeByEsc: true }">
        <div class="w-[600px]">
            <div class="py-3 px-5">
                <div class="flex justify-between items-center mb-8">
                    <p class="font-semibold text-2xl">Expense Categories</p>
                    <button class="bg-sky-600 text-white font-semibold py-2 px-3 rounded-lg"
                        @click="showAddCategInput = true; newCategName = ''">Add New</button>
                </div>

                <div class="flex gap-x-5 items-center mb-4 py-1 px-5" :class="showAddCategInput ? 'block' : 'hidden'">
                    <input class="border border-gray-300 py-1 px-5 w-[400px] rounded-md" v-model="newCategName" />
                    <CheckCircleIcon class="w-8 h-8 fill-green-600 cursor-pointer" @click="addExpenseCateg" />
                </div>

                <div class="max-h-[300px] overflow-y-auto">
                    <div class="flex justify-between items-center hover:bg-zinc-200 py-1 px-5"
                        v-for="categ in expenseCategs" :key="categ">
                        <p class="">{{ categ }}</p>
                        <MinusCircleIcon class="w-6 h-6 fill-red-500 cursor-pointer"
                            @click="() => { delExpenseCateg(categ) }" />
                    </div>
                </div>
            </div>

            <div class="flex justify-end bg-slate-200 py-4 px-5 mt-8">
                <button @click="showManageExpenseCategs = false"
                    class="bg-zinc-500 hover:bg-zinc-700 text-zinc-100 py-2 px-6 rounded-lg">Close</button>
            </div>
        </div>
    </PopUpPlaceholder>

</template>