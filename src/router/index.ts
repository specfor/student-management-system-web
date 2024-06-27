import { createRouter, createWebHistory } from "vue-router";
import AppDashboard from "@/views/AppDashboard.vue";
import UsersPage from "@/views/UsersPage.vue";
import LoginPage from "@/views/LoginPage.vue";
import UserRolesPage from "@/views/UserRolesPage.vue";
import GradesPage from "@/views/GradesPage.vue";
import StudentPage from "@/views/student/StudentPage.vue";
import InstructorsPage from "@/views/instructors/InstructorsPage.vue";
import CoursesPage from "@/views/CoursesPage.vue";
import EnrollmentPage from "@/views/EnrollmentPage.vue";
import PaymentsPage from "@/views/PaymentsPage.vue";
import MarkAttendancePage from "@/views/MarkAttendancePage.vue";
import AttendancePage from "@/views/AttendancePage.vue";
import StudentMoreInfo from "@/views/student/StudentMoreInfo.vue";
import InstructorMoreInfo from "@/views/instructors/InstructorMoreInfo.vue";

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
      path: "/payments",
      name: "payments",
      component: PaymentsPage,
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
