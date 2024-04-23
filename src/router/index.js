import { createRouter, createWebHistory } from 'vue-router'
import AppDashboard from '@/views/AppDashboard.vue'
import UsersPage from '@/views/UsersPage.vue'

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
