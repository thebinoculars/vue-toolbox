import {
  Cloud,
  Code,
  DeviceGamepad,
  FileText,
  Link,
  Music,
  Palette,
  Photo,
  Tool,
} from '@vicons/tabler'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

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
  const BREAKPOINT = 1024

  const sidebarOpen = ref<boolean>(window.innerWidth >= BREAKPOINT)
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
    sidebarOpen.value = window.innerWidth >= BREAKPOINT
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
