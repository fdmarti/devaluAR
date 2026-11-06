import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue'),
  },
  // {
  //   path: '/historial-precios',
  //   name: 'historial-precios',
  //   component: () => import('../views/HistorialPrecios.vue'),
  // },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFound.vue'),
  },
]
