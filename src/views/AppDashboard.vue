<script setup lang="ts">
import {
    getCourseCalendar,
    getEnrollmentCount,
    getFinancialSummaryForMonths,
    getMonthlyFinancialSummary,
    getOutstandingPayments,
    getInstructorPaymentStatus,
    getAttendanceRate,
    getStudentCount,
    getStudentMonthlyPaymentSummary,
    getStudentDetails,
    getEnrollmentDetails,
    getOutstandingPaymentDetails,
    getInstructorPaymentDetails,
    getIncomeDetails,
    getExpenseDetails,
} from "@/apiConnections/analytics";
import CollapseCard from "@/components/minorUiComponents/CollapseCard.vue";
import MetricDrilldownModal from "@/components/MetricDrilldownModal.vue";
import SelectionBox from "@/components/primary/SelectionBox.vue";
import type { TableColumns, tableRowItem } from "@/components/TableComponent.vue";
import { formatMoney } from "@/utils/money";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import { ref, watch, type Ref } from "vue";
import { Doughnut, Line } from "vue-chartjs";
import autocolors from "chartjs-plugin-autocolors";
import type { AnalyticsStudentMonthlyPaymentSummary, APIMoney } from "@/types/analytics";
import LoadingCursor from "@/components/minorUiComponents/loadingCursor.vue";
import CalandarComponent from "@/components/minorUiComponents/CalandarComponent.vue";
import { useAuthStore } from "@/stores/authorization";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const auth = useAuthStore();

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// ─── Existing card state ──────────────────────────────────────────────────────

const drilldownState = ref({
    visible: false,
    title: '',
    fetchData: async (page: number): Promise<any> => { return { data: [], total: 0 }; },
    mapRow: (item: any): tableRowItem[] => [],
    columns: [] as TableColumns[]
});

function openDrilldown(title: string, fetchFn: (page: number) => any, mapRowFn: (item: any) => any, cols: any) {
    drilldownState.value = {
        visible: true,
        title,
        fetchData: fetchFn,
        mapRow: mapRowFn,
        columns: cols
    };
}

function openStudentDrilldown(filter: 'active' | 'inactive' | 'paid' | 'active_not_paid') {
    let title = `Students (${filter})`;
    if (filter === 'active_not_paid') title = 'Students (Active Not Paid)';
    openDrilldown(
        title,
        (page) => getStudentDetails(globalSelectedMonth.value, filter, page).then(res => res.data),
        (item: any) => [item.id, { type: 'textWithLink', text: item.name, url: `/students/${item.id}` }, item.phone_number],
        [{ name: 'ID' }, { name: 'Name' }, { name: 'Phone' }]
    );
}

function openEnrollmentDrilldown(status: 'active' | 'pending' | 'completed' | 'discontinued') {
    openDrilldown(
        `Enrollments (${status})`,
        (page) => getEnrollmentDetails(globalSelectedMonth.value, status, page).then(res => res.data),
        (item: any) => [item.id, { type: 'textWithLink', text: item.student?.name, url: `/students/${item.student?.id}` }, item.course?.name],
        [{ name: 'ID' }, { name: 'Student Name' }, { name: 'Course Name' }]
    );
}

function openOutstandingPaymentDrilldown(status: 'paid' | 'unpaid') {
    openDrilldown(
        `Outstanding Payments (${status})`,
        (page) => getOutstandingPaymentDetails(globalSelectedMonth.value, status, page).then(res => res.data),
        (item: any) => [item.id, { type: 'textWithLink', text: item.name, url: `/students/${item.id}` }, item.phone_number],
        [{ name: 'ID' }, { name: 'Name' }, { name: 'Phone' }]
    );
}

function openInstructorPaymentDrilldown(status: 'paid' | 'unpaid') {
    openDrilldown(
        `Instructor Payments (${status})`,
        (page) => getInstructorPaymentDetails(globalSelectedMonth.value, status, page).then(res => res.data),
        (item: any) => [item.id, { type: 'textWithLink', text: item.name, url: `/instructors/${item.id}` }, item.phone_number],
        [{ name: 'ID' }, { name: 'Name' }, { name: 'Phone' }]
    );
}

function openIncomeDrilldown(filter: 'this_month' | 'delayed' | 'admission') {
    let title = 'Income';
    if (filter === 'this_month') title = 'Income (This Month Class Fees)';
    if (filter === 'delayed') title = 'Income (Delayed Payments)';
    if (filter === 'admission') title = 'Income (Admission Fees)';

    openDrilldown(
        title,
        (page) => getIncomeDetails(globalSelectedMonth.value, filter, paymentCalculateType.value === 'marked', page).then((res: any) => res.data),
        (item: any) => {
            if (filter === 'admission') {
                return [item.id, { type: 'textWithLink', text: item.student?.name, url: `/students/${item.student?.id}` }, 'Admission Fee', item.amount, new Date(item.created_at).toLocaleDateString()];
            }
            return [item.id, { type: 'textWithLink', text: item.enrollment?.student?.name, url: `/students/${item.enrollment?.student?.id}` }, item.enrollment?.course?.name, item.amount, new Date(item.created_at).toLocaleDateString()];
        },
        [{ name: 'ID' }, { name: 'Student Name' }, { name: 'Category / Course' }, { name: 'Amount' }, { name: 'Date' }]
    );
}

function openExpenseDrilldown(filter: string) {
    const isInstructorSalary = filter === 'instructor_salaries';
    const title = isInstructorSalary ? 'Expenses (Instructor Salaries)' : `Expenses (${filter})`;

    openDrilldown(
        title,
        (page) => getExpenseDetails(globalSelectedMonth.value, filter, paymentCalculateType.value === 'marked', page).then((res: any) => res.data),
        (item: any) => {
            if (isInstructorSalary) {
                return [item.id, { type: 'textWithLink', text: item.instructor?.name, url: `/instructors/${item.instructor?.id}` }, 'Salary', item.tot_amount, new Date(item.created_at).toLocaleDateString()];
            }
            return [item.id, item.description || '-', item.type, item.amount, new Date(item.created_at).toLocaleDateString()];
        },
        [{ name: 'ID' }, { name: 'Description / Name' }, { name: 'Type' }, { name: 'Amount' }, { name: 'Date' }]
    );
}

const globalSelectedMonth = ref(
  `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, "0")}`
);
const paymentCalculateType: Ref<"marked" | "paid_to"> = ref("paid_to");
const loadingStudentCount = ref(false);

function handleStudentChartClick(event: any, elements: any[]) {
    if (elements.length > 0) {
        const index = elements[0].index;
        if (index === 0) openStudentDrilldown('active_not_paid');
        else if (index === 1) openStudentDrilldown('paid');
        else if (index === 2) openStudentDrilldown('inactive');
    }
}

const studentCountData: Ref<ChartData<"doughnut">> = ref({
    labels: ["Active Not Paid", "Active Paid", "Inactive"],
    datasets: [{ backgroundColor: ["#00D8FF", "#5355a2", "#FF9136"], data: [] }],
});

const incomeDataForGraph: Ref<ChartData<"doughnut">> = ref({
    labels: ["As This Month Class Fees", "As Delayed Payments", "As Admission Fees"],
    datasets: [{ backgroundColor: ["#45E713", "#AF19FF", "#084a86"], data: [] }],
});
const expenseDataForGraph: Ref<ChartData<"doughnut">> = ref({
    labels: ["As Instructor Salaries"],
    datasets: [{ data: [] }],
});

const incomeData: Ref<{
  total_income?: { amount: string; currency: string };
  this_month_class_payments?: { amount: string; currency: string };
  out_standing_class_payments?: { amount: string; currency: string };
  admission_fees?: { amount: string; currency: string };
}> = ref({});
const expenseData: Ref<{
  total_expenses?: { amount: string; currency: string };
  instructor_salaries?: { amount: string; currency: string };
  other_expenses?: { [expenseCateg: string]: { amount: string; currency: string } };
}> = ref({});
const loadingMonthlyIncomeSummary = ref(false);

function handleIncomeChartClick(event: any, elements: any[]) {
    if (elements.length > 0) {
        const index = elements[0].index;
        if (index === 0) openIncomeDrilldown('this_month');
        else if (index === 1) openIncomeDrilldown('delayed');
        else if (index === 2) openIncomeDrilldown('admission');
    }
}

function handleExpenseChartClick(event: any, elements: any[], chart: any) {
    if (elements.length > 0) {
        const index = elements[0].index;
        const label = chart.data.labels[index] as string;
        if (index === 0) openExpenseDrilldown('instructor_salaries');
        else {
            // For other expenses, the label is the category name
            openExpenseDrilldown(label);
        }
    }
}

async function loadStudentCount() {
  loadingStudentCount.value = true;
  let resp = await getStudentCount(globalSelectedMonth.value);
  if (resp.status === "success") {
    // Handle both current month (with real-time data) and previous months (cached data)
    if (resp.data && typeof resp.data === "object" && Object.keys(resp.data).length > 0) {
      studentCountData.value.datasets[0].data = [
        (resp.data.active || 0) - (resp.data["paid_student_count"] || 0),
        resp.data["paid_student_count"] || 0,
        resp.data.inactive || 0,
      ];
    } else {
      // If no data available (e.g., for previous months with no cached data)
      studentCountData.value.datasets[0].data = [0, 0, 0];
    }
  } else {
    studentCountData.value.datasets[0].data = [0, 0, 0];
  }
  loadingStudentCount.value = false;
}
if (auth.canSeeCard("student_summary")) loadStudentCount();

async function loadMonthlyIncomeSummary() {
    loadingMonthlyIncomeSummary.value = true;
    let byMarkedMonth = paymentCalculateType.value == "marked";
    let resp = await getMonthlyFinancialSummary(
        Number(globalSelectedMonth.value.substring(0, 4)),
        Number(globalSelectedMonth.value.substring(5)),
        byMarkedMonth
    );
    if (resp.status === "success") {
        incomeData.value = resp.data.income;
        expenseData.value = resp.data.expenses;
        incomeDataForGraph.value = {
            labels: ["As This Month Class Fees", "As Delayed Payments", "As Admission Fees"],
            datasets: [{
                backgroundColor: ["#45E713", "#AF19FF", "#084a86"],
                data: [
                    Number(incomeData.value.this_month_class_payments?.amount),
                    Number(incomeData.value.out_standing_class_payments?.amount),
                    Number(incomeData.value.admission_fees?.amount),
                ],
            }],
        };
        expenseDataForGraph.value = {
            labels: ["As Instructor Salaries"].concat(Object.keys(expenseData.value.other_expenses!)),
            datasets: [{
                data: [Number(expenseData.value.instructor_salaries?.amount)].concat(
                    Object.values(expenseData.value.other_expenses!).map((exp) => Number(exp.amount))
                ),
            }],
        };
    }
    loadingMonthlyIncomeSummary.value = false;
}
if (auth.canSeeCard("monthly_financial_report")) loadMonthlyIncomeSummary();

const financialSummaryForMonthsGraph: Ref<ChartData<"line">> = ref({ labels: [], datasets: [] });

async function loadFinanceSummaryForMonths() {
    let resp = await getFinancialSummaryForMonths(12);
    if (resp.status === "success") {
        let financeData: {
            [yearMonth: string]: { total_income: APIMoney; total_expenses: APIMoney; net_income: APIMoney };
        } = resp.data.finances;
        financialSummaryForMonthsGraph.value.labels = Object.keys(financeData).reverse();
        financialSummaryForMonthsGraph.value.datasets = [
            { label: "Income",   data: [], borderColor: "rgb(154, 246, 102)", tension: 0.1 },
            { label: "Expenses", data: [], borderColor: "rgb(107, 149, 200)", tension: 0.1 },
            { label: "Profit",   data: [], borderColor: "rgb(246, 101, 176)", tension: 0.1 },
        ];
        Object.values(financeData).forEach((finance) => {
            (financialSummaryForMonthsGraph.value.datasets[0].data as number[]).unshift(Number(finance.total_income.amount));
            (financialSummaryForMonthsGraph.value.datasets[1].data as number[]).unshift(Number(finance.total_expenses.amount));
            (financialSummaryForMonthsGraph.value.datasets[2].data as number[]).unshift(Number(finance.net_income.amount));
        });
    }
}
if (auth.canSeeCard("financial_summary_12m")) loadFinanceSummaryForMonths();

const studentPaymentSummary: Ref<AnalyticsStudentMonthlyPaymentSummary> = ref({ summary: [] });
const loadingStudentPaymentSummary = ref(false);

async function loadPaymentSummary() {
    loadingStudentPaymentSummary.value = true;
    const resp = await getStudentMonthlyPaymentSummary(
        Number(globalSelectedMonth.value.substring(0, 4)),
        Number(globalSelectedMonth.value.substring(5))
    );
    if (resp.status === "error") { loadingStudentPaymentSummary.value = false; return; }
    studentPaymentSummary.value = resp.data;
    studentPaymentSummary.value.summary.sort((a, b) => a.instructor_name.localeCompare(b.instructor_name));
    loadingStudentPaymentSummary.value = false;
}
if (auth.canSeeCard("student_payment_summary")) loadPaymentSummary();

watch(globalSelectedMonth, () => {
    if (auth.canSeeCard("student_summary")) loadStudentCount();
    if (auth.canSeeCard("monthly_financial_report") || auth.canSeeCard("expense_summary")) loadMonthlyIncomeSummary();
    if (auth.canSeeCard("student_payment_summary")) loadPaymentSummary();
    if (auth.canSeeCard("enrollment_overview")) loadEnrollmentData();
    if (auth.canSeeCard("outstanding_payments")) loadOutstandingPayments();
    if (auth.canSeeCard("instructor_payment_status")) loadInstructorPaymentStatus();
    if (auth.canSeeCard("attendance_rate")) loadAttendanceRate();
});

const calendarData = ref<
  { title: string; body: string; timeRange: string; date: string; status: string; notes: string; courseId: number }[]
>([]);

async function loadCourseCalendar(year: number, month: number) {
    const resp = await getCourseCalendar(year, month);
    if (resp.status === "success") {
        calendarData.value = [];
        const calendar = resp.data.calendar;
        for (const date in calendar) {
            if (Object.prototype.hasOwnProperty.call(calendar, date)) {
                calendar[date].forEach((cls: any) => {
                    calendarData.value.push({
                        title: cls.class_name, body: `Instructor: ${cls.instructor_name}`,
                        status: cls.status, timeRange: cls.time, date, notes: cls.notes, courseId: cls.id,
                    });
                });
            }
        }
    }
}

const now = new Date();
// Load calendar data if either the full calendar or Today's Classes card needs it
if (auth.canSeeCard("course_calendar") || auth.canSeeCard("todays_classes"))
    loadCourseCalendar(now.getFullYear(), now.getMonth() + 1);
// Also load financial summary for Expense Summary card (Card F shares the monthly financial data)
if (!auth.canSeeCard("monthly_financial_report") && auth.canSeeCard("expense_summary"))
    loadMonthlyIncomeSummary();


// ─── Card A: Enrollment Overview ─────────────────────────────────────────────
const enrollmentData = ref<{ active: number; discontinued: number; completed: number; pending: number } | null>(null);
async function loadEnrollmentData() {
    const resp = await getEnrollmentCount(globalSelectedMonth.value);
    if (resp.status === "success") enrollmentData.value = resp.data;
}
if (auth.canSeeCard("enrollment_overview")) loadEnrollmentData();

// ─── Card B: Outstanding Payments ────────────────────────────────────────────
const outstandingPayments = ref<{ month: string; total_active: number; paid_count: number; unpaid_count: number } | null>(null);
const loadingOutstanding = ref(false);
async function loadOutstandingPayments() {
    loadingOutstanding.value = true;
    const resp = await getOutstandingPayments(globalSelectedMonth.value);
    if (resp.status === "success") outstandingPayments.value = resp.data;
    loadingOutstanding.value = false;
}
if (auth.canSeeCard("outstanding_payments")) loadOutstandingPayments();

// ─── Card C: Instructor Payment Status ───────────────────────────────────────
const instructorPaymentStatus = ref<{
    month: string; paid_count: number; unpaid_count: number;
    instructors: { instructor_id: number; instructor_name: string; paid: boolean; amount: string | null }[];
} | null>(null);
const loadingInstructorStatus = ref(false);
async function loadInstructorPaymentStatus() {
    loadingInstructorStatus.value = true;
    const resp = await getInstructorPaymentStatus(globalSelectedMonth.value);
    if (resp.status === "success") instructorPaymentStatus.value = resp.data;
    loadingInstructorStatus.value = false;
}
if (auth.canSeeCard("instructor_payment_status")) loadInstructorPaymentStatus();

// ─── Card D: Today's Classes (reuses calendar data) ──────────────────────────
const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
// calendarData is already loaded if course_calendar is visible; filtered in template

// ─── Card E: Attendance Rate ──────────────────────────────────────────────────
const attendanceRate = ref<{
    month: string; overall_rate: number | null; total_possible: number; total_attended: number;
    courses: { course_id: number; course_name: string; sessions: number; enrollments: number; attended: number; rate_percent: number | null }[];
} | null>(null);
const loadingAttendance = ref(false);
async function loadAttendanceRate() {
    loadingAttendance.value = true;
    const resp = await getAttendanceRate(globalSelectedMonth.value);
    if (resp.status === "success") attendanceRate.value = resp.data;
    loadingAttendance.value = false;
}
if (auth.canSeeCard("attendance_rate")) loadAttendanceRate();

// ─── Card F: Expense Summary (reuses monthly financial data) ─────────────────
// expenseData is already populated by loadMonthlyIncomeSummary when visible
</script>

<template>
    <div class="bg-slate-200 w-full">
        <MetricDrilldownModal
            :visible="drilldownState.visible"
            :title="drilldownState.title"
            :fetch-data="drilldownState.fetchData"
            :map-row="drilldownState.mapRow"
            :columns="drilldownState.columns"
            @close="drilldownState.visible = false"
        />
        <div class="bg-slate-200 w-full h-max">
            <div class="container pb-20">
                <div class="bg-white p-4 rounded-md shadow-md mb-5 flex items-center justify-between">
                    <h2 class="text-xl font-bold">Dashboard Dashboard</h2>
                    <div class="flex items-center gap-3">
                        <h5 class="text-gray-700 font-medium">Viewing Month:</h5>
                        <input type="month" class="border rounded-md px-3 py-1" v-model="globalSelectedMonth" />
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                    <!-- ── Monthly Financial Report ── -->
                    <CollapseCard
                        v-if="auth.canSeeCard('monthly_financial_report')"
                        class="col-span-2"
                        :header="'Monthly Financial Report - ' + months[Number(globalSelectedMonth.substring(5)) - 1]"
                    >
                        <div class="grid grid-cols-1 justify-items-center mb-5 items-center">
                            <div class="grid grid-cols-2 justify-items-center mb-5 items-center">
                                <h5>Calculate By Payment</h5>
                                <SelectionBox :value="paymentCalculateType"
                                    @input="(val) => { paymentCalculateType = val; loadMonthlyIncomeSummary(); }"
                                    :options="[{ text: 'Marked Month', value: 'marked' }, { text: 'Paid To Month', value: 'paid_to' }]" />
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2">
                            <div>
                                <div v-if="loadingMonthlyIncomeSummary" class="w-full h-[300px] flex justify-center items-center">
                                    <LoadingCursor class="w-full h-[300px] flex justify-center items-center" />
                                </div>
                                <div v-else-if="incomeData.total_income?.amount != '0'" class="w-full h-[300px]">
                                    <Doughnut :data="incomeDataForGraph"
                                        :options="{ responsive: true, maintainAspectRatio: false, onClick: handleIncomeChartClick, plugins: { legend: { onClick: (e) => e.native?.stopPropagation() } } }"
                                        v-if="incomeDataForGraph.datasets[0].data.length > 0" />
                                </div>
                                <div v-else class="w-full h-[300px] flex justify-center items-center">
                                    <h5 class="text-slate-500">No Data to Plot a Graph</h5>
                                </div>
                                <div class="flex justify-center gap-x-10 mt-8" v-if="incomeData.total_income">
                                    <h5>Total Income</h5>
                                    <p>{{ incomeData.total_income.currency }} {{ formatMoney(incomeData.total_income.amount) }}</p>
                                </div>
                            </div>
                            <div>
                                <div v-if="loadingMonthlyIncomeSummary" class="w-full h-[300px] flex justify-center items-center">
                                    <LoadingCursor class="w-full h-[300px] flex justify-center items-center" />
                                </div>
                                <div v-else-if="expenseData.total_expenses?.amount != '0'" class="w-full h-[300px]">
                                    <Doughnut :data="expenseDataForGraph" :plugins="[autocolors]"
                                        :options="{ responsive: true, maintainAspectRatio: false, onClick: handleExpenseChartClick, plugins: { autocolors: { mode: 'data', enabled: true, offset: 6 }, legend: { onClick: (e) => e.native?.stopPropagation() } } }"
                                        v-if="expenseDataForGraph.datasets[0].data.length > 0" />
                                </div>
                                <div v-else class="w-full h-[300px] flex justify-center items-center">
                                    <h5 class="text-slate-500">No Data to Plot a Graph</h5>
                                </div>
                                <div class="flex justify-center gap-x-10 mt-8" v-if="expenseData.total_expenses">
                                    <h5>Total Expenses</h5>
                                    <p>{{ expenseData.total_expenses.currency }} {{ formatMoney(expenseData.total_expenses.amount) }}</p>
                                </div>
                            </div>
                        </div>
                    </CollapseCard>

                    <!-- ── Student Summary ── -->
                    <CollapseCard v-if="auth.canSeeCard('student_summary')" header="Student Summary">
                        <div class="w-full h-300px">
                            <Doughnut :data="studentCountData"
                                :options="{ responsive: true, maintainAspectRatio: false, onClick: handleStudentChartClick, plugins: { legend: { onClick: (e) => e.native?.stopPropagation() } } }"
                                v-if="studentCountData.datasets[0].data.length > 0" />
                        </div>
                        <div class="flex justify-center gap-x-10 mt-8 cursor-pointer hover:text-blue-600 transition-colors"
                             v-if="studentCountData.datasets[0].data.length > 0"
                             @click="openStudentDrilldown('active')">
                            <h5>Total Student Count</h5>
                            <p>{{ (studentCountData.datasets[0].data[0] as number) + (studentCountData.datasets[0].data[1] as number) + (studentCountData.datasets[0].data[2] as number) }}</p>
                        </div>
                        <div class="flex justify-center gap-x-10 mt-2 cursor-pointer hover:text-blue-600 transition-colors"
                             v-if="studentCountData.datasets[0].data.length > 0"
                             @click="openStudentDrilldown('active')">
                            <h5>Total Active Student Count</h5>
                            <p>{{ (studentCountData.datasets[0].data[0] as number) + (studentCountData.datasets[0].data[1] as number) }}</p>
                        </div>
                        <div class="flex justify-center gap-x-10 mt-2 cursor-pointer hover:text-blue-600 transition-colors"
                             v-if="studentCountData.datasets[0].data.length > 0"
                             @click="openStudentDrilldown('paid')">
                            <h5>Total Paid Student Count</h5>
                            <p>{{ studentCountData.datasets[0].data[1] }}</p>
                        </div>
                    </CollapseCard>

                    <!-- ── Card A: Enrollment Overview ── -->
                    <CollapseCard v-if="auth.canSeeCard('enrollment_overview')" header="Enrollment Overview">
                        <div v-if="!enrollmentData" class="w-full h-[120px] flex justify-center items-center">
                            <LoadingCursor />
                        </div>
                        <div v-else class="grid grid-cols-2 gap-4 mt-2">
                            <div class="bg-blue-100 rounded-lg p-4 text-center cursor-pointer hover:bg-blue-200 transition-colors" @click="openEnrollmentDrilldown('active')">
                                <p class="text-2xl font-bold text-blue-700">{{ enrollmentData.active }}</p>
                                <p class="text-sm text-blue-600 mt-1">Active</p>
                            </div>
                            <div class="bg-yellow-100 rounded-lg p-4 text-center cursor-pointer hover:bg-yellow-200 transition-colors" @click="openEnrollmentDrilldown('pending')">
                                <p class="text-2xl font-bold text-yellow-700">{{ enrollmentData.pending }}</p>
                                <p class="text-sm text-yellow-600 mt-1">Pending</p>
                            </div>
                            <div class="bg-green-100 rounded-lg p-4 text-center cursor-pointer hover:bg-green-200 transition-colors" @click="openEnrollmentDrilldown('completed')">
                                <p class="text-2xl font-bold text-green-700">{{ enrollmentData.completed }}</p>
                                <p class="text-sm text-green-600 mt-1">Completed</p>
                            </div>
                            <div class="bg-red-100 rounded-lg p-4 text-center cursor-pointer hover:bg-red-200 transition-colors" @click="openEnrollmentDrilldown('discontinued')">
                                <p class="text-2xl font-bold text-red-700">{{ enrollmentData.discontinued }}</p>
                                <p class="text-sm text-red-600 mt-1">Discontinued</p>
                            </div>
                        </div>
                    </CollapseCard>

                    <!-- ── Card B: Outstanding Payments Alert ── -->
                    <CollapseCard v-if="auth.canSeeCard('outstanding_payments')" header="Outstanding Payments Alert">
                        <div v-if="loadingOutstanding" class="w-full h-[120px] flex justify-center items-center">
                            <LoadingCursor />
                        </div>
                        <div v-else-if="outstandingPayments" class="mt-2">
                            <p class="text-sm text-slate-500 mb-3">{{ outstandingPayments.month }}</p>
                            <div class="grid grid-cols-3 gap-3">
                                <div class="bg-slate-100 rounded-lg p-3 text-center cursor-pointer hover:bg-slate-200 transition-colors" @click="openStudentDrilldown('active')">
                                    <p class="text-2xl font-bold text-slate-700">{{ outstandingPayments.total_active }}</p>
                                    <p class="text-xs text-slate-500 mt-1">Total Active</p>
                                </div>
                                <div class="bg-green-100 rounded-lg p-3 text-center cursor-pointer hover:bg-green-200 transition-colors" @click="openOutstandingPaymentDrilldown('paid')">
                                    <p class="text-2xl font-bold text-green-700">{{ outstandingPayments.paid_count }}</p>
                                    <p class="text-xs text-green-600 mt-1">Paid</p>
                                </div>
                                <div class="bg-orange-100 rounded-lg p-3 text-center cursor-pointer hover:bg-orange-200 transition-colors" @click="openOutstandingPaymentDrilldown('unpaid')">
                                    <p class="text-2xl font-bold text-orange-700">{{ outstandingPayments.unpaid_count }}</p>
                                    <p class="text-xs text-orange-600 mt-1">Unpaid</p>
                                </div>
                            </div>
                            <div class="mt-4 bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div class="bg-green-500 h-3 rounded-full transition-all"
                                    :style="{ width: outstandingPayments.total_active > 0 ? (outstandingPayments.paid_count / outstandingPayments.total_active * 100) + '%' : '0%' }">
                                </div>
                            </div>
                            <p class="text-xs text-slate-500 text-right mt-1">
                                {{ outstandingPayments.total_active > 0 ? Math.round(outstandingPayments.paid_count / outstandingPayments.total_active * 100) : 0 }}% collected
                            </p>
                        </div>
                    </CollapseCard>

                    <!-- ── Card C: Instructor Payment Status ── -->
                    <CollapseCard v-if="auth.canSeeCard('instructor_payment_status')" header="Instructor Payment Status">
                        <div v-if="loadingInstructorStatus" class="w-full h-[120px] flex justify-center items-center">
                            <LoadingCursor />
                        </div>
                        <div v-else-if="instructorPaymentStatus" class="mt-2">
                            <p class="text-sm text-slate-500 mb-3">{{ instructorPaymentStatus.month }}</p>
                            <div class="flex gap-4 mb-4">
                                <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                    {{ instructorPaymentStatus.paid_count }} Paid
                                </span>
                                <span class="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                                    {{ instructorPaymentStatus.unpaid_count }} Pending
                                </span>
                            </div>
                            <div class="space-y-2 max-h-[250px] overflow-y-auto">
                                <div v-for="instructor in instructorPaymentStatus.instructors" :key="instructor.instructor_id"
                                    class="flex items-center justify-between px-3 py-2 rounded-lg"
                                    :class="instructor.paid ? 'bg-green-50' : 'bg-orange-50'">
                                    <span class="text-sm font-medium">{{ instructor.instructor_name }}</span>
                                    <span class="text-sm" :class="instructor.paid ? 'text-green-600' : 'text-orange-500'">
                                        {{ instructor.paid ? '✓ Paid' : '⏳ Pending' }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CollapseCard>

                    <!-- ── Card D: Today's Classes ── -->
                    <CollapseCard v-if="auth.canSeeCard('todays_classes')" header="Today's Classes">
                        <div v-if="calendarData.length === 0" class="w-full h-[100px] flex justify-center items-center">
                            <p class="text-slate-400 text-sm">No classes scheduled today</p>
                        </div>
                        <div v-else class="space-y-2 max-h-[300px] overflow-y-auto mt-2">
                            <template v-if="calendarData.filter(c => c.date === todayStr).length === 0">
                                <p class="text-slate-400 text-sm text-center py-4">No classes today</p>
                            </template>
                            <div v-for="cls in calendarData.filter(c => c.date === todayStr)"
                                :key="cls.courseId + cls.timeRange"
                                class="bg-white rounded-lg px-4 py-3 border-l-4"
                                :class="{
                                    'border-green-500': cls.status === 'conducted',
                                    'border-blue-400': cls.status === 'scheduled',
                                    'border-red-400': cls.status === 'cancelled'
                                }">
                                <p class="font-semibold text-sm">{{ cls.title }}</p>
                                <p class="text-xs text-slate-500">{{ cls.body }}</p>
                                <p class="text-xs text-slate-400 mt-1">{{ cls.timeRange }}</p>
                            </div>
                        </div>
                    </CollapseCard>

                    <!-- ── Card E: Attendance Rate Tracker ── -->
                    <CollapseCard v-if="auth.canSeeCard('attendance_rate')" header="Attendance Rate Tracker">
                        <div v-if="loadingAttendance" class="w-full h-[120px] flex justify-center items-center">
                            <LoadingCursor />
                        </div>
                        <div v-else-if="attendanceRate" class="mt-2">
                            <p class="text-sm text-slate-500 mb-2">{{ attendanceRate.month }}</p>
                            <div class="text-center mb-4">
                                <p class="text-4xl font-bold" :class="(attendanceRate.overall_rate ?? 0) >= 75 ? 'text-green-600' : 'text-orange-500'">
                                    {{ attendanceRate.overall_rate !== null ? attendanceRate.overall_rate + '%' : 'N/A' }}
                                </p>
                                <p class="text-sm text-slate-500 mt-1">Overall Attendance Rate</p>
                            </div>
                            <div class="space-y-2 max-h-[200px] overflow-y-auto">
                                <div v-for="course in attendanceRate.courses" :key="course.course_id"
                                    class="flex items-center justify-between bg-slate-50 rounded px-3 py-2">
                                    <span class="text-xs text-slate-700 truncate flex-1 mr-2">{{ course.course_name }}</span>
                                    <span class="text-xs font-semibold shrink-0"
                                        :class="course.rate_percent !== null && course.rate_percent >= 75 ? 'text-green-600' : 'text-orange-500'">
                                        {{ course.rate_percent !== null ? course.rate_percent + '%' : 'N/A' }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CollapseCard>

                    <!-- ── Card F: Expense Summary ── -->
                    <CollapseCard v-if="auth.canSeeCard('expense_summary')" header="Expense Summary">
                        <div v-if="loadingMonthlyIncomeSummary" class="w-full h-[120px] flex justify-center items-center">
                            <LoadingCursor />
                        </div>
                        <div v-else-if="expenseData.total_expenses" class="mt-2">
                            <div class="bg-red-50 rounded-lg p-4 mb-3 text-center">
                                <p class="text-2xl font-bold text-red-700">
                                    {{ expenseData.total_expenses.currency }} {{ formatMoney(expenseData.total_expenses.amount) }}
                                </p>
                                <p class="text-sm text-red-500 mt-1">Total Expenses This Month</p>
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between px-2 py-1 bg-slate-50 rounded" v-if="expenseData.instructor_salaries">
                                    <span class="text-sm text-slate-600">Instructor Salaries</span>
                                    <span class="text-sm font-medium">
                                        {{ expenseData.instructor_salaries.currency }} {{ formatMoney(expenseData.instructor_salaries.amount) }}
                                    </span>
                                </div>
                                <div v-for="(amt, categName) in expenseData.other_expenses" :key="categName"
                                    class="flex justify-between px-2 py-1 bg-slate-50 rounded">
                                    <span class="text-sm text-slate-600">{{ categName }}</span>
                                    <span class="text-sm font-medium">{{ amt.currency }} {{ formatMoney(amt.amount) }}</span>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-6 text-slate-400 text-sm">No expense data this month</div>
                    </CollapseCard>

                    <!-- ── Course Calendar ── -->
                    <CollapseCard v-if="auth.canSeeCard('course_calendar')" header="Course Calendar" class="col-span-3">
                        <CalandarComponent
                            :cards="calendarData"
                            @update:cards="(card) => {
                                const idx = calendarData.findIndex(c => c.courseId === card.courseId && c.date === card.date);
                                if (idx !== -1) calendarData[idx] = { ...calendarData[idx], ...card };
                            }"
                            @update:date="(dt) => { loadCourseCalendar(dt.getFullYear(), dt.getMonth() + 1); }"
                        />
                    </CollapseCard>

                    <!-- ── Financial Summary 12 Months ── -->
                    <CollapseCard v-if="auth.canSeeCard('financial_summary_12m')" class="col-span-3" header="Financial Summary for Last 12 Months">
                        <div class="w-full h-[300px]">
                            <Line :data="financialSummaryForMonthsGraph"
                                :options="{ responsive: true, maintainAspectRatio: false }"
                                v-if="financialSummaryForMonthsGraph.datasets.length > 0" />
                        </div>
                    </CollapseCard>

                    <!-- ── Student Payment Summary ── -->
                    <CollapseCard
                        v-if="auth.canSeeCard('student_payment_summary')"
                        class="col-span-3"
                        :header="'Student Payment Summary - ' + months[Number(globalSelectedMonth.substring(5)) - 1]"
                    >
                        <div v-show="loadingStudentPaymentSummary">
                            <LoadingCursor class="w-full h-[300px] flex justify-center items-center" />
                        </div>
                        <div v-show="!loadingStudentPaymentSummary" class="w-full max-h-[800px] overflow-y-auto">
                            <CollapseCard
                                v-for="(instructorSummary, index) in studentPaymentSummary.summary"
                                :collapse-on-start="true" :key="index"
                                :header="instructorSummary['instructor_name']"
                                class="overflow-y-auto max-h-[800px] mt-4"
                            >
                                <div class="flex justify-between mb-4">
                                    <div class="bg-green-200 px-3 py-2">
                                        <h5 class="text-green-900">Collected Payment Income</h5>
                                        <p>{{ instructorSummary.collected_payment_amount.currency }} {{ formatMoney(instructorSummary.collected_payment_amount.amount) }}</p>
                                    </div>
                                    <div class="bg-green-400 px-3 py-2">
                                        <h5 class="text-green-900">Estimated Payment Income</h5>
                                        <p>{{ instructorSummary.estimated_payment_amount.currency }} {{ formatMoney(instructorSummary.estimated_payment_amount.amount) }}</p>
                                    </div>
                                    <div class="bg-orange-200 px-3 py-2">
                                        <h5 class="text-orange-900">Collected Instructor's Share Amount</h5>
                                        <p>{{ instructorSummary.collected_instructors_payment_amount.currency }} {{ formatMoney(instructorSummary.collected_instructors_payment_amount.amount) }}</p>
                                    </div>
                                    <div class="bg-orange-400 px-3 py-2">
                                        <h5 class="text-orange-900">Estimated Instructor's Share Amount</h5>
                                        <p>{{ instructorSummary.estimated_instructors_payment_amount.currency }} {{ formatMoney(instructorSummary.estimated_instructors_payment_amount.amount) }}</p>
                                    </div>
                                </div>
                                <div class="flex mt-10 w-full"
                                    v-for="(courseData, index) in instructorSummary.coursewise_payment_summary" :key="index">
                                    <div class="w-[250px] bg-cyan-200 px-3 py-2 mr-4">
                                        <p>{{ courseData["course_name"] }}</p>
                                        <p class="text-gray-500">{{ courseData["enrollment_count"] }} students enrolled</p>
                                    </div>
                                    <div class="flex justify-between gap-x-5 w-full">
                                        <div>
                                            <h5 class="text-gray-500">Collected Payment Income</h5>
                                            <p>{{ courseData.collected_payment_amount.currency }} {{ formatMoney(courseData.collected_payment_amount.amount) }}</p>
                                        </div>
                                        <div>
                                            <h5 class="text-gray-500">Estimated Payment Income</h5>
                                            <p>{{ courseData.estimated_payment_amount.currency }} {{ formatMoney(courseData.estimated_payment_amount.amount) }}</p>
                                        </div>
                                        <div>
                                            <h5 class="text-gray-500">Collected Instructor's Share Amount</h5>
                                            <p>{{ courseData.collected_instructors_payment_amount.currency }} {{ formatMoney(courseData.collected_instructors_payment_amount.amount) }}</p>
                                        </div>
                                        <div>
                                            <h5 class="text-gray-500">Estimated Instructor's Share Amount</h5>
                                            <p>{{ courseData.estimated_instructors_payment_amount.currency }} {{ formatMoney(courseData.estimated_instructors_payment_amount.amount) }}</p>
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

