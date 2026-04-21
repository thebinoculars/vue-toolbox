<template>
  <div
    class="h-screen flex flex-col overflow-hidden text-gray-900 dark:text-gray-100 font-sans"
    :style="darkModeStore.isDark ? 'background:#18181c' : 'background:#f5f5f5'"
  >
    <div v-if="loading" class="flex flex-1 justify-center items-center p-8">
      <n-spin size="large" />
    </div>
    <div v-else class="flex flex-col flex-1 h-full overflow-hidden">
      <!-- Header -->
      <header
        class="flex-shrink-0 h-12 px-4 flex justify-between items-center shadow-sm z-50 border-b transition-colors"
        :style="
          darkModeStore.isDark
            ? 'background:#232326; border-color:#3a3a3f'
            : 'background:#fff; border-color:#e5e5e5'
        "
      >
        <div class="flex items-center gap-2">
          <n-button text size="small" @click="sidebarOpen = !sidebarOpen" class="mr-1">
            <n-icon size="18" :style="darkModeStore.isDark ? 'color:#888' : 'color:#666'"
              ><Menu2
            /></n-icon>
          </n-button>

          <router-link
            to="/admin"
            class="flex items-center space-x-2 no-underline text-blue-500 hover:text-blue-600 transition-colors"
          >
            <n-icon size="22"><Dashboard /></n-icon>
            <span
              class="text-base font-bold tracking-wide m-0"
              :style="darkModeStore.isDark ? 'color:#fff' : 'color:#111'"
              >Admin</span
            >
          </router-link>
        </div>

        <div class="flex items-center gap-4">
          <n-button text size="small" @click="darkModeStore.toggleDarkMode">
            <n-icon size="18" :style="darkModeStore.isDark ? 'color:#facc15' : 'color:#555'">
              <component :is="darkModeStore.isDark ? 'Sun' : 'Moon'" />
            </n-icon>
          </n-button>

          <template v-if="authStore.user">
            <n-dropdown :options="userMenu" @select="handleUserAction" placement="bottom-end">
              <div
                class="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
                :style="darkModeStore.isDark ? 'color:#fff' : 'color:#333'"
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
            :style="
              darkModeStore.isDark
                ? 'background:#232326; border-color:#3a3a3f'
                : 'background:#fff; border-color:#e5e5e5'
            "
            class="w-60 shrink-0 border-r flex flex-col overflow-hidden transition-all duration-200"
          >
            <!-- Sidebar Links -->
            <div class="flex-1 py-2">
              <div
                class="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
                :style="darkModeStore.isDark ? 'color:#666' : 'color:#aaa'"
              >
                CONTENT
              </div>
              <router-link
                to="/admin/albums"
                class="flex items-center gap-2.5 px-3 py-2 text-sm no-underline transition-colors"
                :style="
                  route.path.startsWith('/admin/albums')
                    ? darkModeStore.isDark
                      ? 'background:#2d2d35;color:#818cf8'
                      : 'background:#eef2ff;color:#6366f1'
                    : darkModeStore.isDark
                      ? 'color:#ccc'
                      : 'color:#444'
                "
              >
                <n-icon size="15"><Photo /></n-icon>
                Gallery
              </router-link>
            </div>
          </aside>
        </transition>

        <main class="flex-1 overflow-y-auto w-full p-4 md:p-6" id="admin-main-scroll">
          <div v-if="route.path === '/admin'" class="flex items-center justify-center h-full">
            <div class="text-center">
              <n-icon size="64" class="text-blue-500 mb-4"><Dashboard /></n-icon>
              <h2 class="text-2xl font-bold mb-2">Welcome to Admin Dashboard</h2>
              <p class="text-gray-500 mb-6">
                Select a section from the sidebar to manage your content.
              </p>
              <n-button type="primary" @click="router.push('/admin/albums')"
                >Go to Gallery</n-button
              >
            </div>
          </div>
          <router-view v-else />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDarkModeStore } from '@/stores/darkMode'
import { NButton, NSpin, NIcon, NDropdown } from 'naive-ui'
import { Home, Logout, Dashboard, Menu2, Photo, ChevronDown } from '@vicons/tabler'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const darkModeStore = useDarkModeStore()
const loading = ref(true)
const sidebarOpen = ref(true)

const renderIcon = (icon: any) => () => h(NIcon, null, { default: () => h(icon) })
const userMenu = [
  { label: 'Home', key: 'home', icon: renderIcon(Home) },
  { label: 'Logout', key: 'logout', icon: renderIcon(Logout) },
]

const handleUserAction = (key: string) => {
  if (key === 'home') {
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

<style scoped>
.sidebar-enter-active,
.sidebar-leave-active {
  transition:
    width 0.2s ease,
    opacity 0.2s ease;
}
.sidebar-enter-from,
.sidebar-leave-to {
  width: 0;
  opacity: 0;
}
</style>
