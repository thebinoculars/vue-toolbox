<template>
  <div class="p-2 border-b flex items-center gap-2 border-[var(--border-color)]">
    <n-input
      :value="search"
      placeholder="Search tools..."
      size="small"
      clearable
      @update:value="$emit('update:search', $event)"
    >
      <template #prefix>
        <n-icon class="text-[var(--icon-color)]"><Search /></n-icon>
      </template>
    </n-input>
  </div>

  <div class="flex-1 overflow-y-auto py-2">
    <template v-for="cat in filteredCategories" :key="cat">
      <div
        class="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
      >
        {{ cat }}
      </div>
      <router-link
        v-for="tool in filteredTools.filter((t) => t.category === cat)"
        :key="tool.path"
        :to="tool.path"
        class="flex items-center gap-2.5 px-3 py-2 text-sm no-underline transition-colors"
        :class="
          route.path === tool.path
            ? 'bg-[var(--bg-active)] text-[var(--accent-secondary)]'
            : 'text-[var(--text-secondary)]'
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
import { Search } from '@vicons/tabler'
import { useRoute } from 'vue-router'

import { categories, tools } from '@/data/tools'

const props = defineProps<{ search: string }>()
defineEmits<{ 'update:search': [value: string]; navigate: [] }>()

const route = useRoute()

const filteredTools = computed(() =>
  tools.filter((t) => t.title.toLowerCase().includes(props.search.toLowerCase())),
)
const filteredCategories = computed(() =>
  categories.filter((c) => filteredTools.value.some((t) => t.category === c)),
)
</script>
