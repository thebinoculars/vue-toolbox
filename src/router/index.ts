import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Login from '../pages/Login.vue'
import Register from '../pages/Register.vue'
import Base64Tool from '../pages/tools/Base64Tool.vue'
import UrlParser from '../pages/tools/UrlParser.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/login', name: 'login', component: Login },
  { path: '/register', name: 'register', component: Register },
  { path: '/tools/base64', name: 'base64-tool', component: Base64Tool },
  { path: '/tools/url-parser', name: 'url-parser', component: UrlParser },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
