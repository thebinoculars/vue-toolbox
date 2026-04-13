<template>
  <div
    :class="darkModeStore.isDark ? 'dark' : ''"
    class="h-screen flex flex-col overflow-hidden"
    :style="
      darkModeStore.isDark ? 'background:#18181c;color:#fff' : 'background:#f5f5f5;color:#333'
    "
  >
    <!-- Header -->
    <header
      :style="
        darkModeStore.isDark
          ? 'background:#232326;border-color:#3a3a3f'
          : 'background:#fff;border-color:#e5e5e5'
      "
      class="sticky top-0 z-50 border-b h-12 flex items-center px-4 gap-3 shrink-0"
    >
      <n-button text size="small" @click="layoutStore.toggleSidebar">
        <n-icon size="18" :style="darkModeStore.isDark ? 'color:#888' : 'color:#666'"
          ><Menu2
        /></n-icon>
      </n-button>

      <router-link to="/" class="flex items-center gap-2 no-underline shrink-0">
        <n-icon size="22" color="#6366f1"><component :is="layoutStore.pageIcon" /></n-icon>
        <span
          class="font-bold text-base"
          :style="darkModeStore.isDark ? 'color:#fff' : 'color:#111'"
          >{{ layoutStore.pageTitle }}</span
        >
      </router-link>

      <div class="flex-1" />

      <n-button text size="small" @click="darkModeStore.toggleDarkMode">
        <n-icon size="18" :style="darkModeStore.isDark ? 'color:#facc15' : 'color:#555'">
          <component :is="darkModeStore.isDark ? Sun : Moon" />
        </n-icon>
      </n-button>

      <template v-if="authStore.user">
        <n-dropdown :options="userMenu" @select="handleUserAction">
          <n-button size="small" secondary>
            <template #icon
              ><n-icon><User /></n-icon
            ></template>
            {{ authStore.user.email }}
          </n-button>
        </n-dropdown>
      </template>
      <template v-else>
        <router-link to="/login">
          <n-button size="small" text :style="darkModeStore.isDark ? 'color:#aaa' : 'color:#555'"
            >Login</n-button
          >
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
        <aside
          v-if="layoutStore.sidebarOpen"
          :style="
            darkModeStore.isDark
              ? 'background:#232326;border-color:#3a3a3f'
              : 'background:#fff;border-color:#e5e5e5'
          "
          class="w-60 shrink-0 border-r flex flex-col overflow-hidden"
        >
          <SidebarContent
            :search="layoutStore.search"
            @update:search="layoutStore.search = $event"
          />
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
import { h, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NIcon, NDropdown } from 'naive-ui'
import { Sun, Moon, User, Logout, Menu2 } from '@vicons/tabler'
import { useAuthStore } from '@/stores/auth'
import { useDarkModeStore } from '@/stores/darkMode'
import { useLayoutStore } from '@/stores/layout'
import SidebarContent from '@/components/SidebarContent.vue'

const authStore = useAuthStore()
const darkModeStore = useDarkModeStore()
const layoutStore = useLayoutStore()
const router = useRouter()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const browser = (globalThis as any).window

const onResize = () => {
  layoutStore.updateSidebarOnResize()
}

onMounted(() => {
  if (browser) {
    browser.addEventListener('resize', onResize)
  }
})

onUnmounted(() => {
  if (browser) {
    browser.removeEventListener('resize', onResize)
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderIcon = (icon: any) => () => h(NIcon, null, { default: () => h(icon) })
const userMenu = [{ label: 'Logout', key: 'logout', icon: renderIcon(Logout) }]
const handleUserAction = (key: string) => {
  if (key === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}
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
