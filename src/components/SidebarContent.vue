<template>
  <div
    class="p-2 border-b flex items-center gap-2"
    :style="darkModeStore.isDark ? 'border-color:#3a3a3f' : 'border-color:#e5e5e5'"
  >
    <n-input
      :value="search"
      placeholder="Search tools..."
      size="small"
      clearable
      @update:value="$emit('update:search', $event)"
    >
      <template #prefix>
        <n-icon :style="darkModeStore.isDark ? 'color:#888' : 'color:#aaa'"><Search /></n-icon>
      </template>
    </n-input>
  </div>

  <div class="flex-1 overflow-y-auto py-2">
    <template v-for="cat in filteredCategories" :key="cat">
      <div
        class="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
        :style="darkModeStore.isDark ? 'color:#666' : 'color:#aaa'"
      >
        {{ cat }}
      </div>
      <router-link
        v-for="tool in filteredTools.filter((t) => t.category === cat)"
        :key="tool.path"
        :to="tool.path"
        class="flex items-center gap-2.5 px-3 py-2 text-sm no-underline transition-colors"
        :style="
          route.path === tool.path
            ? darkModeStore.isDark
              ? 'background:#2d2d35;color:#818cf8'
              : 'background:#eef2ff;color:#6366f1'
            : darkModeStore.isDark
              ? 'color:#ccc'
              : 'color:#444'
        "
        @click="$emit('navigate')"
      >
        <n-icon size="15"><component :is="tool.icon" /></n-icon>
        {{ tool.title }}
      </router-link>
    </template>
    <n-empty
      v-if="filteredTools.length === 0"
      description="No tools found"
      size="small"
      class="mt-8"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NInput, NIcon, NEmpty } from 'naive-ui'
import { Search } from '@vicons/tabler'
import { useDarkModeStore } from '@/stores/darkMode'
import { tools, categories } from '~/shared/constants'

const props = defineProps<{ search: string }>()
defineEmits<{ 'update:search': [value: string]; navigate: [] }>()

const darkModeStore = useDarkModeStore()
const route = useRoute()

const filteredTools = computed(() =>
  tools.filter((t) => t.title.toLowerCase().includes(props.search.toLowerCase())),
)
const filteredCategories = computed(() =>
  categories.filter((c) => filteredTools.value.some((t) => t.category === c)),
)
</script>
