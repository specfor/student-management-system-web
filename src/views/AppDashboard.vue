<script setup lang="ts">
import { getMonthlyFinancialSummary, getStudentCount } from '@/apiConnections/analytics';
import CollapseCard from '@/components/minorUiComponents/CollapseCard.vue';
import { formatMoney } from '@/utils/money';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { ref, type Ref } from 'vue';
import { Doughnut } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend)

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const selectedMonthForIncome = ref(`${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`)

const studentCountData: Ref<{
    labels: string[];
    datasets: {
        backgroundColor: string[],
        data: number[]
    }[]
}> = ref({
    labels: ['Active', 'Inactive'],
    datasets: [
        {
            backgroundColor: ['#00D8FF', '#FF9136'],
            data: []
        }
    ]
})

const incomeDataForGraph: Ref<{
    labels: string[];
    datasets: {
        backgroundColor: string[],
        data: number[]
    }[]
}> = ref({
    labels: ['As This Month Class Fees', 'As Delayed Payments', 'As Admission Fees'],
    datasets: [
        {
            backgroundColor: ['#45E713', '#AF19FF', '#084a86'],
            data: []
        }
    ]
})
const expenseDataForGraph: Ref<{
    labels: string[];
    datasets: {
        backgroundColor: string[],
        data: number[]
    }[]
}> = ref({
    labels: ['As Instructor Salaries', 'Other Expenses'],
    datasets: [
        {
            backgroundColor: ['#CE9308', '#407CE3'],
            data: []
        }
    ]
})

const incomeData: Ref<{
    total_income?: { amount: string, currency: string },
    this_month_class_payments?: { amount: string, currency: string },
    out_standing_class_payments?: { amount: string, currency: string },
    admission_fees?: { amount: string, currency: string },
}> = ref({})
const expenseData: Ref<{
    total_expenses?: { amount: string, currency: string },
    instructor_salaries?: { amount: string, currency: string },
    other_expenses?: { amount: string, currency: string },
}> = ref({})

async function loadStudentCount() {
    let resp = await getStudentCount()
    if (resp.status === 'success') {
        studentCountData.value.datasets[0].data = [resp.data.active, resp.data.inactive]
    }
}
loadStudentCount()

async function loadMonthlyIncomeSummary() {
    let resp = await getMonthlyFinancialSummary(Number(selectedMonthForIncome.value.substring(0, 4)), Number(selectedMonthForIncome.value.substring(5)))
    if (resp.status === 'success') {
        incomeData.value = resp.data.income
        expenseData.value = resp.data.expenses
        incomeDataForGraph.value = {
            labels: ['As This Month Class Fees', 'As Delayed Payments', 'As Admission Fees'],
            datasets: [
                {
                    backgroundColor: ['#45E713', '#AF19FF', '#084a86'],
                    data: [Number(incomeData.value.this_month_class_payments?.amount), Number(incomeData.value.out_standing_class_payments?.amount), Number(incomeData.value.admission_fees?.amount)]
                }
            ]
        }
        expenseDataForGraph.value = {
            labels: ['As Instructor Salaries', 'Other Expenses'],
            datasets: [
                {
                    backgroundColor: ['#CE9308', '#407CE3'],
                    data: [Number(expenseData.value.instructor_salaries?.amount), Number(expenseData.value.other_expenses?.amount)]
                }
            ]
        }
    }
}
loadMonthlyIncomeSummary()
</script>

<template>
    <div class="bg-slate-200 w-full">
        <div class="container">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <CollapseCard class="col-span-2"
                    :header="'Monthly Financial Report - ' + months[Number(selectedMonthForIncome.substring(5)) - 1]">
                    <div class="grid grid-cols-2 justify-items-center mb-5 items-center">
                        <div class="grid grid-cols-2 justify-items-center mb-5 items-center">
                            <h5>Select Month</h5>
                            <input type="month" class="w-full border rounded-md px-2 py-1"
                                v-model="selectedMonthForIncome" @change="loadMonthlyIncomeSummary" />
                        </div>
                        <div class="grid grid-cols-2 justify-items-center mb-5 items-center">
                            <h5>Select Month</h5>
                            <input type="month" class="w-full border rounded-md px-2 py-1"
                                v-model="selectedMonthForIncome" @change="loadMonthlyIncomeSummary" />
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2">
                        <div>
                            <div class="w-full h-300px">
                                <Doughnut :data="incomeDataForGraph"
                                    :options="{ responsive: true, maintainAspectRatio: false }"
                                    v-if="incomeDataForGraph.datasets[0].data.length > 0" />
                            </div>
                            <div class="flex justify-center gap-x-10 mt-8" v-if="incomeData.total_income">
                                <h5>Total Income</h5>
                                <p>{{ incomeData.total_income.currency }} {{ formatMoney(incomeData.total_income.amount)
                                    }}
                                </p>
                            </div>
                        </div>
                        <div>
                            <div class="w-full h-300px">
                                <Doughnut :data="expenseDataForGraph"
                                    :options="{ responsive: true, maintainAspectRatio: false }"
                                    v-if="expenseDataForGraph.datasets[0].data.length > 0" />
                            </div>
                            <div class="flex justify-center gap-x-10 mt-8" v-if="expenseData.total_expenses">
                                <h5>Total Expenses</h5>
                                <p>{{ expenseData.total_expenses.currency }} {{
                                    formatMoney(expenseData.total_expenses.amount)
                                }}
                                </p>
                            </div>
                        </div>
                    </div>
                </CollapseCard>

                <CollapseCard header="Student Summary">
                    <div class="w-full h-300px">
                        <Doughnut :data="studentCountData" :options="{ responsive: true, maintainAspectRatio: false }"
                            v-if="studentCountData.datasets[0].data.length > 0" />
                    </div>
                    <div class="flex justify-center gap-x-10 mt-8" v-if="studentCountData.datasets[0].data.length > 0">
                        <h5>Total Number of Students</h5>
                        <p>{{ studentCountData.datasets[0].data[0] + studentCountData.datasets[0].data[1] }}</p>
                    </div>
                </CollapseCard>
            </div>
        </div>
    </div>
</template>

<style scoped></style>