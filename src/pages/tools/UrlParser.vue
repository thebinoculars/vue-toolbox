<template>
  <div class="flex flex-col h-full">
    <!-- Tool header -->
    <div :style="isDark ? 'background:#232326;border-color:#3a3a3f' : 'background:#fff;border-color:#e5e5e5'"
      class="border-b px-5 py-3 flex items-center gap-3 shrink-0">
      <n-icon size="20" color="#6366f1"><LinkOutline /></n-icon>
      <span class="font-semibold text-base">URL Parser</span>
      <n-tag size="small" type="primary" :bordered="false">Utilities</n-tag>
    </div>

    <!-- Input bar -->
    <div :style="isDark ? 'background:#2a2a2e;border-color:#3a3a3f' : 'background:#f9f9f9;border-color:#e5e5e5'"
      class="border-b px-3 py-2 flex items-center gap-2 shrink-0">
      <span class="text-xs font-medium" :style="isDark ? 'color:#888' : 'color:#888'">URL</span>
      <n-input
        v-model:value="input"
        placeholder="Enter a URL to parse..."
        size="small"
        clearable
        class="flex-1"
        @update:value="parse"
      />
      <n-button size="tiny" @click="handlePaste">
        <template #icon><n-icon><ClipboardOutline /></n-icon></template>
        Paste
      </n-button>
      <n-button size="tiny" @click="input = ''; parsed = null; error = ''">
        <template #icon><n-icon><TrashOutline /></n-icon></template>
        Clear
      </n-button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-5">
      <n-alert v-if="error" type="error" :bordered="false" closable @close="error = ''" class="mb-4">
        {{ error }}
      </n-alert>

      <template v-if="parsed">
        <!-- Overview -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          <div v-for="field in overviewFields" :key="field.label">
            <div class="text-xs font-semibold uppercase tracking-wider mb-1" :style="isDark ? 'color:#666' : 'color:#aaa'">
              {{ field.label }}
            </div>
            <div class="flex items-center gap-2">
              <code class="flex-1 text-sm px-3 py-2 rounded font-mono break-all"
                :style="isDark ? 'background:#2a2a2e;color:#e5e5e5' : 'background:#f3f4f6;color:#333'">
                {{ field.value || '—' }}
              </code>
              <n-button v-if="field.value" size="tiny" @click="copy(field.value)">
                <n-icon><CopyOutline /></n-icon>
              </n-button>
            </div>
          </div>
        </div>

        <!-- Query params -->
        <div v-if="parsed.searchParams.size > 0">
          <div class="text-xs font-semibold uppercase tracking-wider mb-2" :style="isDark ? 'color:#666' : 'color:#aaa'">
            Query Parameters ({{ parsed.searchParams.size }})
          </div>
          <n-data-table :columns="columns" :data="queryRows" size="small" :bordered="false"
            :style="isDark ? 'background:#232326' : ''" />
        </div>
        <n-empty v-else description="No query parameters" size="small" class="mt-4" />
      </template>

      <n-empty v-else-if="!error" description="Enter a URL above to parse it" size="small" class="mt-16" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { NInput, NButton, NIcon, NTag, NAlert, NEmpty, NDataTable, NText } from 'naive-ui'
import { LinkOutline, ClipboardOutline, TrashOutline, CopyOutline } from '@vicons/ionicons5'
import { useDarkMode } from '../../composables/useDarkMode'

const { isDark } = useDarkMode()

const input = ref('')
const parsed = ref<URL | null>(null)
const error = ref('')

const parse = (val: string) => {
  error.value = ''
  parsed.value = null
  if (!val.trim()) return
  try {
    parsed.value = new URL(val.trim())
  } catch {
    error.value = 'Invalid URL. Make sure to include the protocol (e.g. https://)'
  }
}

const overviewFields = computed(() => {
  if (!parsed.value) return []
  const u = parsed.value
  return [
    { label: 'Protocol', value: u.protocol.replace(':', '') },
    { label: 'Host', value: u.host },
    { label: 'Hostname', value: u.hostname },
    { label: 'Port', value: u.port },
    { label: 'Pathname', value: u.pathname },
    { label: 'Hash', value: u.hash },
    { label: 'Origin', value: u.origin },
    { label: 'Full URL', value: u.href },
  ]
})

const queryRows = computed(() => {
  if (!parsed.value) return []
  return [...parsed.value.searchParams.entries()].map(([key, value]) => ({ key, value }))
})

const columns = [
  { title: 'Key', key: 'key', width: 200, render: (row: any) => h(NText, { code: true }, { default: () => row.key }) },
  { title: 'Value', key: 'value', render: (row: any) => h(NText, { code: true }, { default: () => row.value }) },
]

const copy = async (text: string) => {
  try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
}

const handlePaste = async () => {
  try { input.value = await navigator.clipboard.readText(); parse(input.value) } catch { error.value = 'Failed to read clipboard' }
}
</script>
