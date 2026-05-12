<script setup lang="ts">
import { darkTheme } from 'naive-ui'

import Layout from '@/components/Layout.vue'

const theme = darkTheme
const route = useRoute()

const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))
const isAdminPage = computed(() => route.path.startsWith('/admin'))
</script>

<template>
  <NConfigProvider
    :theme="theme"
    :theme-overrides="{ common: { fontFamily: 'Inter, sans-serif' } }"
  >
    <NMessageProvider>
      <NDialogProvider>
        <!-- Auth pages: full screen centered, no sidebar -->
        <div
          v-if="isAuthPage"
          class="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]"
        >
          <router-view />
        </div>
        <!-- App pages: with sidebar layout -->
        <Layout v-else-if="!isAdminPage">
          <router-view />
        </Layout>
        <!-- Admin pages -->
        <div v-else class="min-h-screen bg-[var(--bg-primary)]">
          <router-view />
        </div>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
