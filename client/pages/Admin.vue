<template>
  <div
    class="h-screen flex flex-col overflow-hidden text-gray-100 font-sans bg-[var(--bg-primary)]"
  >
    <div v-if="loading" class="flex flex-1 justify-center items-center p-8">
      <n-spin size="large" />
    </div>
    <div v-else class="flex flex-col flex-1 h-full overflow-hidden">
      <!-- Header -->
      <header
        class="flex-shrink-0 h-12 px-4 flex justify-between items-center shadow-sm z-50 border-b transition-colors bg-[var(--bg-secondary)] border-[var(--border-color)]"
      >
        <div class="flex items-center gap-2">
          <n-button text size="small" class="mr-1" @click="sidebarOpen = !sidebarOpen">
            <n-icon size="18" class="text-[var(--icon-color)]"><Menu2 /></n-icon>
          </n-button>

          <router-link
            to="/admin"
            class="flex items-center space-x-2 no-underline text-blue-500 hover:text-blue-600 transition-colors"
          >
            <n-icon size="22"><Dashboard /></n-icon>
            <span class="text-base font-bold tracking-wide m-0 text-[var(--text-primary)]"
              >Admin</span
            >
          </router-link>
        </div>

        <div class="flex items-center gap-4">
          <template v-if="authStore.user">
            <n-dropdown :options="userMenu" placement="bottom-end" @select="handleUserAction">
              <div
                class="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap text-[var(--text-primary)]"
              >
                <span class="text-sm font-medium">{{ authStore.user.email }}</span>
                <n-icon size="16"><ChevronDown /></n-icon>
              </div>
            </n-dropdown>
          </template>
        </div>
      </header>

      <!-- Body -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar -->
        <transition name="sidebar">
          <aside
            v-if="sidebarOpen"
            class="w-60 shrink-0 border-r flex flex-col overflow-hidden transition-all duration-200 bg-[var(--bg-secondary)] border-[var(--border-color)]"
          >
            <!-- Sidebar Links -->
            <div class="flex-1 py-2">
              <router-link
                to="/admin/profile"
                class="flex items-center gap-2.5 px-3 py-2 text-sm no-underline transition-colors"
                :class="
                  route.path === '/admin/profile'
                    ? 'bg-[var(--bg-active)] text-[var(--accent-secondary)]'
                    : 'text-[var(--text-secondary)]'
                "
              >
                <n-icon size="15"><User /></n-icon>
                Profile
              </router-link>
              <router-link
                to="/admin/albums"
                class="flex items-center gap-2.5 px-3 py-2 text-sm no-underline transition-colors"
                :class="
                  route.path.startsWith('/admin/albums')
                    ? 'bg-[var(--bg-active)] text-[var(--accent-secondary)]'
                    : 'text-[var(--text-secondary)]'
                "
              >
                <n-icon size="15"><Photo /></n-icon>
                Gallery
              </router-link>
            </div>
          </aside>
        </transition>

        <main id="admin-main-scroll" class="flex-1 overflow-y-auto w-full p-4 md:p-6">
          <div v-if="route.path === '/admin'" class="flex items-center justify-center h-full">
            <div class="text-center">
              <n-icon size="64" class="text-blue-500 mb-4"><Dashboard /></n-icon>
              <h2 class="text-2xl font-bold mb-2">Welcome to Admin Dashboard</h2>
            </div>
          </div>
          <router-view v-else />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, Dashboard, Home, Logout, Menu2, Photo, User } from '@vicons/tabler'
import { NIcon } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loading = ref(true)
const sidebarOpen = ref(true)

const renderIcon = (icon: any) => () => h(NIcon, null, { default: () => h(icon) })
const userMenu = [
  { label: 'Profile', key: 'profile', icon: renderIcon(User) },
  { label: 'Home', key: 'home', icon: renderIcon(Home) },
  { label: 'Logout', key: 'logout', icon: renderIcon(Logout) },
]

const handleUserAction = (key: string) => {
  if (key === 'profile') {
    router.push('/admin/profile')
  } else if (key === 'home') {
    router.push('/')
  } else if (key === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}

onMounted(async () => {
  await authStore.fetchMe()
  if (!authStore.user) {
    router.push('/login')
  } else {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.sidebar {
  &-enter-active,
  &-leave-active {
    transition:
      width 0.2s ease,
      opacity 0.2s ease;
  }
  &-enter-from,
  &-leave-to {
    width: 0;
    opacity: 0;
  }
}
</style>
