<template>
  <div
    class="dark h-screen flex flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]"
  >
    <!-- Header -->
    <header
      class="sticky top-0 z-50 border-b h-12 flex items-center px-4 gap-3 shrink-0 bg-[var(--bg-secondary)] border-[var(--border-color)]"
    >
      <n-button text size="small" @click="layoutStore.toggleSidebar">
        <n-icon size="18" class="text-[var(--icon-color)]"><Menu2 /></n-icon>
      </n-button>

      <router-link
        to="/"
        class="flex items-center gap-2 no-underline shrink-0 hover:opacity-80 transition-opacity"
      >
        <n-icon size="22" color="#6366f1"><Tool /></n-icon>
        <span class="font-bold text-base tracking-wide m-0 text-[var(--text-primary)]"
          >ToolBox</span
        >
      </router-link>

      <div class="flex-1" />

      <router-link to="/login">
        <n-button size="small" text class="text-[var(--text-tertiary)]">Login</n-button>
      </router-link>
      <router-link to="/register">
        <n-button size="small" type="primary">Sign Up</n-button>
      </router-link>
    </header>

    <!-- Body -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <transition name="sidebar">
        <aside
          v-if="layoutStore.sidebarOpen"
          class="w-60 shrink-0 border-r flex flex-col overflow-hidden bg-[var(--bg-secondary)] border-[var(--border-color)]"
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
import { Menu2, Tool } from '@vicons/tabler'

import SidebarContent from '@/components/SidebarContent.vue'
import { useLayoutStore } from '@/stores/layout'

const layoutStore = useLayoutStore()

const onResize = () => {
  layoutStore.updateSidebarOnResize()
}

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
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
