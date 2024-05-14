import { createRouter, createWebHistory } from 'vue-router'
import AppDashboard from '@/views/AppDashboard.vue'
import UsersPage from '@/views/UsersPage.vue'
import LoginPage from '@/views/LoginPage.vue'
import UserRolesPage from '@/views/UserRolesPage.vue'
import GradesPage from '@/views/GradesPage.vue'
import StudentPage from '@/views/StudentPage.vue'
import InstructorsPage from '@/views/InstructorsPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: AppDashboard
    },
    {
      path: '/users',
      name: 'users',
      component: UsersPage
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage
    },
    {
      path: '/user-roles',
      name: 'user-roles',
      component: UserRolesPage
    },
    {
      path: '/grades',
      name: 'grades',
      component: GradesPage
    },
    {
      path: '/students',
      name: 'students',
      component: StudentPage
    },
    {
      path: '/instructors',
      name: 'instructors',
      component: InstructorsPage
    }
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // }
  ]
})

export default router
