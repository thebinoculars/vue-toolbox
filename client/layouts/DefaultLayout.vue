<template>
  <div class="dark h-screen flex flex-col overflow-hidden bg-(--bg-primary) text-(--text-primary)">
    <!-- Header -->
    <header
      class="sticky top-0 z-50 border-b h-12 flex items-center px-4 gap-3 shrink-0 bg-(--bg-secondary) border-(--border-color)"
    >
      <n-button text size="small" @click="toggleSidebar">
        <n-icon size="18" class="text-(--icon-color)"><Menu2 /></n-icon>
      </n-button>

      <router-link
        to="/"
        class="flex items-center gap-2 no-underline shrink-0 hover:opacity-80 transition-opacity"
      >
        <n-icon size="22" color="#6366f1"><Tool /></n-icon>
        <span class="font-bold text-base tracking-wide m-0 text-(--text-primary)">ToolBox</span>
      </router-link>

      <div class="flex-1" />

      <router-link to="/login">
        <n-button size="small" text class="text-(--text-tertiary)">Login</n-button>
      </router-link>
    </header>

    <!-- Body -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <transition name="sidebar">
        <aside
          v-if="sidebarOpen"
          class="w-60 shrink-0 border-r flex flex-col overflow-hidden bg-(--bg-secondary) border-(--border-color)"
        >
          <!-- Search -->
          <div class="p-2 border-b flex items-center gap-2 border-(--border-color)">
            <n-input
              :value="toolStore.search"
              placeholder="Search tools..."
              size="small"
              clearable
              @update:value="toolStore.search = $event"
            >
              <template #prefix>
                <n-icon class="text-(--icon-color)"><Search /></n-icon>
              </template>
            </n-input>
          </div>

          <!-- Tools list -->
          <div class="flex-1 overflow-y-auto py-2">
            <template v-for="cat in toolStore.searchedCategories" :key="cat">
              <div
                class="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-(--text-muted)"
              >
                {{ cat }}
              </div>
              <router-link
                v-for="tool in toolStore.getSearchedToolsByCategory(cat)"
                :key="tool.path"
                :to="tool.path"
                class="flex items-center gap-2.5 px-3 py-2 text-sm no-underline transition-colors"
                :class="
                  route.path === tool.path
                    ? 'bg-(--bg-active) text-(--accent-secondary)'
                    : 'text-(--text-secondary)'
                "
              >
                <n-icon size="15"><component :is="tool.icon" /></n-icon>
                {{ tool.title }}
              </router-link>
            </template>
            <n-empty
              v-if="toolStore.searchedTools.length === 0"
              description="No tools found"
              size="small"
              class="mt-8"
            />
          </div>
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
import { Menu2, Search, Tool } from '@vicons/tabler'

import { useToolStore } from '@/stores/tool'

// Constants
const BREAKPOINT = 1024

// State
const sidebarOpen = ref<boolean>(window.innerWidth >= BREAKPOINT)
const toolStore = useToolStore()
const route = useRoute()

// Functions
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const updateSidebarOnResize = () => {
  sidebarOpen.value = window.innerWidth >= BREAKPOINT
}

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', updateSidebarOnResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSidebarOnResize)
})
</script>
