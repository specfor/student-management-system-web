<script setup lang="ts">
import { getMonthlyIncomeSummary, getStudentCount } from '@/apiConnections/analytics';
import CollapseCard from '@/components/minorUiComponents/CollapseCard.vue';
import { formatMoney } from '@/utils/money';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { ref, type Ref } from 'vue';
import { Doughnut } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend)

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

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
            backgroundColor: ['#00D8FF', '#FF6A19'],
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

const incomeData: Ref<{
    total_income?: { amount: string, currency: string },
    this_month_class_payments?: { amount: string, currency: string },
    out_standing_class_payments?: { amount: string, currency: string },
    admission_fees?: { amount: string, currency: string },
}> = ref({})


async function loadStudentCount() {
    let resp = await getStudentCount()
    if (resp.status === 'success') {
        studentCountData.value.datasets[0].data = [resp.data.active, resp.data.inactive]
    }
}
loadStudentCount()

async function loadMonthlyIncomeSummary() {
    let resp = await getMonthlyIncomeSummary(new Date().getFullYear(), (new Date().getMonth() + 1))
    if (resp.status === 'success') {
        incomeData.value = resp.data
        incomeDataForGraph.value.datasets[0].data = [resp.data.this_month_class_payments.amount, resp.data.out_standing_class_payments.amount, resp.data.admission_fees.amount]
    }
}
loadMonthlyIncomeSummary()

</script>

<template>
    <div class="bg-slate-200 w-full">
        <div class="container">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <CollapseCard :header="'Monthly Income - ' + months[new Date().getMonth()]">
                    <div class="w-full h-300px">
                        <Doughnut :data="incomeDataForGraph" :options="{ responsive: true, maintainAspectRatio: false }"
                            v-if="incomeDataForGraph.datasets[0].data.length > 0" />
                    </div>
                    <div class="flex justify-center gap-x-10 mt-8" v-if="incomeData.total_income">
                        <h5>Total Income</h5>
                        <p>{{ incomeData.total_income.currency }} {{ formatMoney(incomeData.total_income.amount) }}</p>
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