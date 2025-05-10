<script setup lang="ts">
import { getFinancialSummaryForMonths, getMonthlyFinancialSummary, getStudentCount, getStudentMonthlyPaymentSummary } from '@/apiConnections/analytics';
import CollapseCard from '@/components/minorUiComponents/CollapseCard.vue';
import SelectionBox from '@/components/primary/SelectionBox.vue';
import { formatMoney } from '@/utils/money';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartData, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js'
import { ref, watch, type Ref } from 'vue';
import { Doughnut, Line } from 'vue-chartjs'
import autocolors from 'chartjs-plugin-autocolors';
import type { AnalyticsStudentMonthlyPaymentSummary, APIMoney } from '@/types/analytics';
import LoadingCursor from '@/components/minorUiComponents/loadingCursor.vue';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement)

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const selectedMonthForIncome = ref(`${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`)
const paymentCalculateType: Ref<"marked" | "paid_to"> = ref("paid_to")

const studentCountData: Ref<ChartData<'doughnut'>> = ref({
    labels: ['Active', 'Inactive'],
    datasets: [
        {
            backgroundColor: ['#00D8FF', '#FF9136'],
            data: []
        }
    ]
})

const incomeDataForGraph: Ref<ChartData<'doughnut'>> = ref({
    labels: ['As This Month Class Fees', 'As Delayed Payments', 'As Admission Fees'],
    datasets: [
        {
            backgroundColor: ['#45E713', '#AF19FF', '#084a86'],
            data: []
        }
    ]
})
const expenseDataForGraph: Ref<ChartData<'doughnut'>> = ref({
    labels: ['As Instructor Salaries'],
    datasets: [
        {
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
    other_expenses?: { [expenseCateg: string]: { amount: string, currency: string } },
}> = ref({})
const loadingMonthlyIncomeSummary = ref(false)

async function loadStudentCount() {
    let resp = await getStudentCount()
    if (resp.status === 'success') {
        studentCountData.value.datasets[0].data = [resp.data.active, resp.data.inactive]
    }
}
loadStudentCount()

async function loadMonthlyIncomeSummary() {
    loadingMonthlyIncomeSummary.value = true
    let byMarkedMonth = paymentCalculateType.value == 'marked'
    let resp = await getMonthlyFinancialSummary(Number(selectedMonthForIncome.value.substring(0, 4)), Number(selectedMonthForIncome.value.substring(5)), byMarkedMonth)
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
            labels: ['As Instructor Salaries'].concat(Object.keys(expenseData.value.other_expenses!)),
            datasets: [
                {
                    data: [Number(expenseData.value.instructor_salaries?.amount)].concat(Object.values(expenseData.value.other_expenses!).map((exp) => { return Number(exp.amount) }))
                }
            ]
        }
    }
    loadingMonthlyIncomeSummary.value = false
}
loadMonthlyIncomeSummary()

const financialSummaryForMonthsGraph: Ref<ChartData<'line'>> = ref({
    labels: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    datasets: []
})

async function loadFinanceSummaryForMonths() {
    let resp = await getFinancialSummaryForMonths(12)
    if (resp.status === 'success') {
        let financeData: {
            [yearMonth: string]: {
                total_income: APIMoney
                total_expenses: APIMoney
                net_income: APIMoney
            }
        } = resp.data.finances


        financialSummaryForMonthsGraph.value.labels = Object.keys(financeData).reverse()

        financialSummaryForMonthsGraph.value.datasets = [
            { label: 'Income', data: [], borderColor: 'rgb(154, 246, 102)', tension: 0.1 },
            { label: 'Expenses', data: [], borderColor: 'rgb(107, 149, 200)', tension: 0.1 },
            { label: 'Profit', data: [], borderColor: 'rgb(246, 101, 176)', tension: 0.1 },
        ]

        Object.values(financeData).forEach((finance) => {
            financialSummaryForMonthsGraph.value.datasets[0].data.unshift(Number(finance.total_income.amount))
            financialSummaryForMonthsGraph.value.datasets[1].data.unshift(Number(finance.total_expenses.amount))
            financialSummaryForMonthsGraph.value.datasets[2].data.unshift(Number(finance.net_income.amount))
        })
    }
}
loadFinanceSummaryForMonths()

const studentPaymentSummary: Ref<AnalyticsStudentMonthlyPaymentSummary> = ref({
    summary: []
})
const selectedMonthForStudentPayment = ref(`${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`)
const loadingStudentPaymentSummary = ref(false)

async function loadPaymentSummary() {
    loadingStudentPaymentSummary.value = true
    const resp = await getStudentMonthlyPaymentSummary(Number(selectedMonthForStudentPayment.value.substring(0, 4)), Number(selectedMonthForStudentPayment.value.substring(5)))
    if (resp.status === 'error') {
        loadingStudentPaymentSummary.value = false
        return
    }

    studentPaymentSummary.value = resp.data
    studentPaymentSummary.value.summary.sort((a, b) => a.instructor_name.localeCompare(b.instructor_name));
    loadingStudentPaymentSummary.value = false
}
loadPaymentSummary()

watch(selectedMonthForStudentPayment, () => {
    loadPaymentSummary()
})
</script>

<template>
    <div class="bg-slate-200 w-full">
        <div class="bg-slate-200 w-full h-max">
            <div class="container pb-20">
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
                                <h5>Calculate By Payment</h5>
                                <SelectionBox :value="paymentCalculateType"
                                    @input="(val) => { paymentCalculateType = val; loadMonthlyIncomeSummary() }"
                                    :options="[{ text: 'Marked Month', value: 'marked' }, { text: 'Paid To Month', value: 'paid_to' }]" />
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2">
                            <div>
                                <div v-if="loadingMonthlyIncomeSummary"
                                    class="w-full h-[300px] flex justify-center items-center">
                                    <LoadingCursor class="w-full h-[300px] flex justify-center items-center" />
                                </div>
                                <div v-else-if="incomeData.total_income?.amount != '0'" class="w-full h-[300px]">
                                    <Doughnut :data="incomeDataForGraph"
                                        :options="{ responsive: true, maintainAspectRatio: false, }"
                                        v-if="incomeDataForGraph.datasets[0].data.length > 0" />
                                </div>
                                <div v-else class="w-full h-[300px] flex justify-center items-center h-">
                                    <h5 class="text-slate-500">No Data to Plot a Graph</h5>
                                </div>
                                <div class="flex justify-center gap-x-10 mt-8" v-if="incomeData.total_income">
                                    <h5>Total Income</h5>
                                    <p>{{ incomeData.total_income.currency }} {{
                                        formatMoney(incomeData.total_income.amount)
                                        }}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <div v-if="loadingMonthlyIncomeSummary"
                                    class="w-full h-[300px] flex justify-center items-center">
                                    <LoadingCursor class="w-full h-[300px] flex justify-center items-center" />
                                </div>
                                <div v-else-if="expenseData.total_expenses?.amount != '0'" class="w-full h-[300px]">
                                    <Doughnut :data="expenseDataForGraph" :plugins="[autocolors]" :options="{
                                        responsive: true, maintainAspectRatio: false, plugins: {
                                            autocolors: {
                                                mode: 'data',
                                                enabled: true,
                                                offset: 6
                                            }
                                        }
                                    }" v-if="expenseDataForGraph.datasets[0].data.length > 0" />
                                </div>
                                <div v-else class="w-full h-[300px] flex justify-center items-center h-">
                                    <h5 class="text-slate-500">No Data to Plot a Graph</h5>
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
                            <Doughnut :data="studentCountData"
                                :options="{ responsive: true, maintainAspectRatio: false }"
                                v-if="studentCountData.datasets[0].data.length > 0" />
                        </div>
                        <div class="flex justify-center gap-x-10 mt-8"
                            v-if="studentCountData.datasets[0].data.length > 0">
                            <h5>Total Number of Students</h5>
                            <p>{{ studentCountData.datasets[0].data[0] + studentCountData.datasets[0].data[1] }}</p>
                        </div>
                    </CollapseCard>

                    <CollapseCard class="col-span-3" header="Financial Summary for Last 12 Months">
                        <div class="w-full h-[300px]">
                            <Line :data="financialSummaryForMonthsGraph"
                                :options="{ responsive: true, maintainAspectRatio: false }"
                                v-if="financialSummaryForMonthsGraph.datasets.length > 0" />
                        </div>
                    </CollapseCard>

                    <CollapseCard class="col-span-3"
                        :header="'Student Payment Summary - ' + months[Number(selectedMonthForStudentPayment.substring(5)) - 1]">
                        <div class="grid grid-cols-2 justify-items-center mb-5 items-center w-[500px]">
                            <h5>Select Month</h5>
                            <input type="month" class="w-full border rounded-md px-2 py-1"
                                v-model="selectedMonthForStudentPayment" @change="loadMonthlyIncomeSummary" />
                        </div>


                        <div v-show="loadingStudentPaymentSummary" class="">
                            <LoadingCursor class="w-full h-[300px] flex justify-center items-center" />
                        </div>
                        <div v-show="!loadingStudentPaymentSummary" class="w-full max-h-[800px] overflow-y-auto">
                            <CollapseCard v-for="(instructorSummary, index) in studentPaymentSummary.summary"
                                :collapse-on-start="true" :key="index" :header="instructorSummary['instructor_name']"
                                class="overflow-y-auto max-h-[800px] mt-4">

                                <div class="flex justify-between mb-4">
                                    <div class="bg-green-200 px-3 py-2">
                                        <h5 class="text-green-900">Collected Payment Income</h5>
                                        <p>{{ instructorSummary.collected_payment_amount.currency }} {{
                                            formatMoney(instructorSummary.collected_payment_amount.amount)
                                            }}</p>
                                    </div>
                                    <div class="bg-green-400 px-3 py-2">
                                        <h5 class="text-green-900">Estimated Payment Income</h5>
                                        <p>{{ instructorSummary.estimated_payment_amount.currency }} {{
                                            formatMoney(instructorSummary.estimated_payment_amount.amount)
                                            }}</p>
                                    </div>
                                    <div class="bg-orange-200 px-3 py-2">
                                        <h5 class="text-orange-900">Collected Instructor's Share Amount</h5>
                                        <p>{{ instructorSummary.collected_instructors_payment_amount.currency }} {{
                                            formatMoney(instructorSummary.collected_instructors_payment_amount.amount)
                                            }}</p>
                                    </div>
                                    <div class="bg-orange-400 px-3 py-2">
                                        <h5 class="text-orange-900">Estimated Instructor's Share Amount</h5>
                                        <p>{{ instructorSummary.estimated_instructors_payment_amount.currency }} {{
                                            formatMoney(instructorSummary.estimated_instructors_payment_amount.amount)
                                            }}</p>
                                    </div>
                                </div>

                                <div class="flex mt-10 w-full"
                                    v-for="(courseData, index) in instructorSummary.coursewise_payment_summary"
                                    :key="index">
                                    <div class="w-[250px] bg-cyan-200 px-3 py-2 mr-4">
                                        <p>{{ courseData['course_name'] }}</p>
                                        <p class="text-gray-500">{{ courseData['enrollment_count'] }} students enrolled
                                        </p>
                                    </div>
                                    <div class="flex justify-between gap-x-5 w-full">
                                        <div>
                                            <h5 class="text-gray-500">Collected Payment Income</h5>
                                            <p>{{ courseData.collected_payment_amount.currency }} {{
                                                formatMoney(courseData.collected_payment_amount.amount)
                                            }}</p>
                                        </div>
                                        <div>
                                            <h5 class="text-gray-500">Estimated Payment Income</h5>
                                            <p>{{ courseData.estimated_payment_amount.currency }} {{
                                                formatMoney(courseData.estimated_payment_amount.amount)
                                            }}</p>
                                        </div>
                                        <div>
                                            <h5 class="text-gray-500">Collected Instructor's Share Amount</h5>
                                            <p>{{ courseData.collected_instructors_payment_amount.currency }} {{
                                                formatMoney(courseData.collected_instructors_payment_amount.amount)
                                            }}</p>
                                        </div>
                                        <div>
                                            <h5 class="text-gray-500">Estimated Instructor's Share Amount</h5>
                                            <p>{{ courseData.estimated_instructors_payment_amount.currency }} {{
                                                formatMoney(courseData.estimated_instructors_payment_amount.amount)
                                            }}</p>
                                        </div>
                                    </div>
                                </div>
                            </CollapseCard>
                        </div>
                    </CollapseCard>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>