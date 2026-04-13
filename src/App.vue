<script setup lang="ts">
import { computed } from 'vue'
import { NConfigProvider, NMessageProvider, darkTheme, lightTheme } from 'naive-ui'
import { useDarkModeStore } from '@/stores/darkMode'
import { useRoute } from 'vue-router'
import Layout from '@/components/Layout.vue'

const darkModeStore = useDarkModeStore()
const theme = computed(() => (darkModeStore.isDark ? darkTheme : lightTheme))
const route = useRoute()

const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))
</script>

<template>
  <NConfigProvider
    :theme="theme"
    :theme-overrides="{ common: { fontFamily: 'Inter, sans-serif' } }"
  >
    <NMessageProvider>
      <!-- Auth pages: full screen centered, no sidebar -->
      <div
        v-if="isAuthPage"
        class="min-h-screen flex items-center justify-center"
        :style="darkModeStore.isDark ? 'background:#18181c' : 'background:#f5f5f5'"
      >
        <router-view />
      </div>
      <!-- App pages: with sidebar layout -->
      <Layout v-else>
        <router-view />
      </Layout>
    </NMessageProvider>
  </NConfigProvider>
</template>
