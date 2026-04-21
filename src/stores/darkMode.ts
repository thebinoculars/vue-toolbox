import { defineStore } from 'pinia'
import { ref, watch, onMounted } from 'vue'

const STORAGE_KEY = 'dark-mode'

export const useDarkModeStore = defineStore('darkMode', () => {
  const isDark = ref(true)

  onMounted(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      isDark.value = saved === 'true'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyDarkMode()
  })

  const applyDarkMode = () => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleDarkMode = () => {
    isDark.value = !isDark.value
    localStorage.setItem(STORAGE_KEY, String(isDark.value))
    applyDarkMode()
  }

  watch(isDark, () => {
    applyDarkMode()
  })

  return {
    isDark,
    toggleDarkMode,
  }
})
