import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Tool,
  Code,
  Link,
  FileText,
  Cloud,
  Palette,
  Photo,
  Music,
  DeviceGamepad,
} from '@vicons/tabler'

export const iconMap: Record<string, any> = {
  Tool,
  Code,
  Link,
  FileText,
  Cloud,
  Palette,
  Photo,
  Music,
  DeviceGamepad,
}

export const useLayoutStore = defineStore('layout', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const browser = (globalThis as any).window
  const BREAKPOINT = 1024

  const sidebarOpen = ref<boolean>(browser?.innerWidth >= BREAKPOINT || true)
  const search = ref('')

  const router = useRouter()

  const pageTitle = computed(() => {
    const routeTitle = router.currentRoute.value.meta.title as string
    return routeTitle?.split(' — ')[0] || 'ToolBox'
  })

  const pageIcon = computed(() => {
    const iconName = router.currentRoute.value.meta.icon as string
    return iconMap[iconName] || Tool
  })

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const setSidebarOpen = (open: boolean) => {
    sidebarOpen.value = open
  }

  const updateSidebarOnResize = () => {
    sidebarOpen.value = browser?.innerWidth >= BREAKPOINT || true
  }

  return {
    sidebarOpen,
    search,
    pageTitle,
    pageIcon,
    toggleSidebar,
    setSidebarOpen,
    updateSidebarOnResize,
  }
})
