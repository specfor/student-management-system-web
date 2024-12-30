import { createRouter, createWebHistory } from "vue-router";
import AppDashboard from "@/views/AppDashboard.vue";
import UsersPage from "@/views/UsersPage.vue";
import LoginPage from "@/views/LoginPage.vue";
import UserRolesPage from "@/views/UserRolesPage.vue";
import GradesPage from "@/views/GradesPage.vue";
import StudentPage from "@/views/student/StudentPage.vue";
import InstructorsPage from "@/views/instructors/InstructorsPage.vue";
import CoursesPage from "@/views/CoursesPage.vue";
import EnrollmentPage from "@/views/enrollments/EnrollmentPage.vue";
import StudentPaymentsPage from "@/views/payments/StudentPaymentsPage.vue";
import MarkAttendancePage from "@/views/MarkAttendancePage.vue";
import AttendancePage from "@/views/AttendancePage.vue";
import StudentMoreInfo from "@/views/student/StudentMoreInfo.vue";
import InstructorMoreInfo from "@/views/instructors/InstructorMoreInfo.vue";
import EnrollmentMoreInfoPage from "@/views/enrollments/EnrollmentMoreInfo.vue";
import InstructorMonthlyPayment from "@/views/reports/InstructorMonthlyPayment.vue";
import InstructorsPaymentsPage from "@/views/payments/InstructorsPaymentsPage.vue";
import InstructorPaymentCalculator from "@/views/payments/InstructorPaymentCalculator.vue";
import WhatsappSettings from "@/views/settings/WhatsappSettings.vue";
import LmsClientSettings from "@/views/settings/LmsClientSettings.vue";
import ExpensesPage from "@/views/ExpensesPage.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "dashboard",
      component: AppDashboard,
    },
    {
      path: "/users",
      name: "users",
      component: UsersPage,
    },
    {
      path: "/login",
      name: "login",
      component: LoginPage,
    },
    {
      path: "/user-roles",
      name: "user-roles",
      component: UserRolesPage,
    },
    {
      path: "/grades",
      name: "grades",
      component: GradesPage,
    },
    {
      path: "/students",
      name: "students",
      component: StudentPage,
    },
    {
      path: "/students/:id/view",
      name: "students-view",
      component: StudentMoreInfo,
    },
    {
      path: "/instructors",
      name: "instructors",
      component: InstructorsPage,
    },
    {
      path: "/instructors/:id/view",
      name: "instructors-view",
      component: InstructorMoreInfo,
    },
    {
      path: "/courses",
      name: "courses",
      component: CoursesPage,
    },
    {
      path: "/enrollments",
      name: "enrollments",
      component: EnrollmentPage,
    },
    {
      path: "/enrollments/:id/view",
      name: "enrollments-view",
      component: EnrollmentMoreInfoPage,
    },
    {
      path: "/payments/students",
      name: "student-payments",
      component: StudentPaymentsPage,
    },
    {
      path: "/payments/instructors",
      name: "instructor-payments",
      component: InstructorsPaymentsPage,
    },
    {
      path: "/payments/instructors/calculate",
      name: "instructor-payments-calculator",
      component: InstructorPaymentCalculator,
    },
    {
      path: "/mark-attendance",
      name: "mark-attendance",
      component: MarkAttendancePage,
    },
    {
      path: "/attendance",
      name: "attendance",
      component: AttendancePage,
    },
    {
      path: "/reports/instructors-monthly-payment",
      name: "instructor-monthly-payment",
      component: InstructorMonthlyPayment,
    },
    {
      path: "/settings/message-system",
      name: "whatsapp-settings",
      component: WhatsappSettings,
    },
    {
      path: "/settings/lms-client",
      name: "lms-client-settings",
      component: LmsClientSettings,
    },
    {
      path: "/expenses",
      name: "expenses",
      component: ExpensesPage,
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // }
  ],
});

export default router;
