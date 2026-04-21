<template>
  <div class="p-6">
    <!-- Page title -->
    <div class="mb-6">
      <n-h2 class="!mb-1">All Tools</n-h2>
      <n-p :depth="3" class="!mt-0 text-sm">{{ tools.length }} tools available</n-p>
    </div>

    <!-- Categories -->
    <div v-for="cat in categories" :key="cat" class="mb-8">
      <div class="flex items-center gap-2 mb-3">
        <n-tag type="primary" size="small">{{ cat }}</n-tag>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <router-link
          v-for="tool in tools.filter((t) => t.category === cat)"
          :key="tool.path"
          :to="tool.path"
          class="no-underline"
        >
          <n-card hoverable size="small" class="cursor-pointer h-full">
            <div class="flex items-center gap-3">
              <n-icon size="22" color="#6366f1"><component :is="tool.icon" /></n-icon>
              <div>
                <div class="text-sm font-medium">{{ tool.title }}</div>
                <n-text :depth="3" class="text-xs">{{ tool.desc }}</n-text>
              </div>
            </div>
          </n-card>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NCard, NH2, NP, NIcon, NText, NTag } from 'naive-ui'
import { tools, categories } from '@/data/tools'
</script>
