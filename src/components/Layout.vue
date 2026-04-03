<template>
  <div :class="isDark ? 'dark' : ''" class="h-screen flex flex-col overflow-hidden"
    :style="isDark ? 'background:#18181c;color:#fff' : 'background:#f5f5f5;color:#333'">

    <!-- Header -->
    <header :style="isDark ? 'background:#232326;border-color:#3a3a3f' : 'background:#fff;border-color:#e5e5e5'"
      class="sticky top-0 z-50 border-b h-12 flex items-center px-4 gap-3 shrink-0">

      <n-button text size="small" @click="sidebarOpen = !sidebarOpen">
        <n-icon size="18" :style="isDark ? 'color:#888' : 'color:#666'"><MenuOutline /></n-icon>
      </n-button>

      <router-link to="/" class="flex items-center gap-2 no-underline shrink-0">
        <n-icon size="22" color="#6366f1"><ConstructOutline /></n-icon>
        <span class="font-bold text-base" :style="isDark ? 'color:#fff' : 'color:#111'">ToolBox</span>
      </router-link>

      <div class="flex-1" />

      <n-button text size="small" @click="toggleDarkMode">
        <n-icon size="18" :style="isDark ? 'color:#facc15' : 'color:#555'">
          <component :is="isDark ? SunnyOutline : MoonOutline" />
        </n-icon>
      </n-button>

      <template v-if="user">
        <n-dropdown :options="userMenu" @select="handleUserAction">
          <n-button size="small" secondary>
            <template #icon><n-icon><PersonOutline /></n-icon></template>
            {{ user.email }}
          </n-button>
        </n-dropdown>
      </template>
      <template v-else>
        <router-link to="/login">
          <n-button size="small" text :style="isDark ? 'color:#aaa' : 'color:#555'">Login</n-button>
        </router-link>
        <router-link to="/register">
          <n-button size="small" type="primary">Sign Up</n-button>
        </router-link>
      </template>
    </header>

    <!-- Body -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Sidebar -->
      <transition name="sidebar">
        <aside v-if="sidebarOpen"
          :style="isDark ? 'background:#232326;border-color:#3a3a3f' : 'background:#fff;border-color:#e5e5e5'"
          class="w-60 shrink-0 border-r flex flex-col overflow-hidden">
          <SidebarContent :search="search" @update:search="search = $event" />
        </aside>
      </transition>

      <!-- Main content -->
      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NIcon, NDropdown } from 'naive-ui'
import { ConstructOutline, SunnyOutline, MoonOutline, PersonOutline, LogOutOutline, MenuOutline } from '@vicons/ionicons5'
import { useAuth } from '../composables/useAuth'
import { useDarkMode } from '../composables/useDarkMode'
import SidebarContent from './SidebarContent.vue'

const { user, logout } = useAuth()
const { isDark, toggleDarkMode } = useDarkMode()
const router = useRouter()

const sidebarOpen = ref(true)
const search = ref('')

const renderIcon = (icon: any) => () => h(NIcon, null, { default: () => h(icon) })
const userMenu = [{ label: 'Logout', key: 'logout', icon: renderIcon(LogOutOutline) }]
const handleUserAction = (key: string) => {
  if (key === 'logout') { logout(); router.push('/login') }
}
</script>

<style scoped>
.sidebar-enter-active, .sidebar-leave-active { transition: width 0.2s ease, opacity 0.2s ease; }
.sidebar-enter-from, .sidebar-leave-to { width: 0; opacity: 0; }
</style>
