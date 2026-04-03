<template>
  <div class="flex flex-col h-full">
    <!-- Tool header bar -->
    <div :style="isDark ? 'background:#232326;border-color:#3a3a3f' : 'background:#fff;border-color:#e5e5e5'"
      class="border-b px-5 py-3 flex items-center gap-3 shrink-0">
      <n-icon size="20" color="#6366f1"><CodeSlashOutline /></n-icon>
      <span class="font-semibold text-base">Base64 Encode / Decode</span>
      <n-tag size="small" type="primary" :bordered="false">Encoders / Decoders</n-tag>
      <div class="flex-1" />
      <n-radio-group v-model:value="mode" size="small">
        <n-radio-button value="encode">Encode</n-radio-button>
        <n-radio-button value="decode">Decode</n-radio-button>
      </n-radio-group>
    </div>

    <!-- Two-panel editor -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Input panel -->
      <div class="flex flex-col flex-1 border-r" :style="isDark ? 'border-color:#3a3a3f' : 'border-color:#e5e5e5'">
        <!-- Panel toolbar -->
        <div :style="isDark ? 'background:#2a2a2e;border-color:#3a3a3f' : 'background:#f9f9f9;border-color:#e5e5e5'"
          class="flex items-center gap-2 px-3 py-1.5 border-b">
          <span class="text-xs font-medium flex-1" :style="isDark ? 'color:#888' : 'color:#888'">
            {{ mode === 'encode' ? 'INPUT — Plain Text' : 'INPUT — Base64 String' }}
          </span>
          <n-button size="tiny" @click="handlePaste">
            <template #icon><n-icon><ClipboardOutline /></n-icon></template>
            Paste
          </n-button>
          <n-button size="tiny" @click="clearInput">
            <template #icon><n-icon><TrashOutline /></n-icon></template>
            Clear
          </n-button>
        </div>
        <textarea
          v-model="input"
          @input="handleConvert"
          :placeholder="mode === 'encode' ? 'Enter or paste text to encode...' : 'Enter or paste Base64 string to decode...'"
          class="flex-1 resize-none p-4 font-mono text-sm outline-none w-full"
          :style="isDark ? 'background:#18181c;color:#e5e5e5;' : 'background:#fff;color:#333;'"
          spellcheck="false"
        />
        <div :style="isDark ? 'background:#2a2a2e;border-color:#3a3a3f;color:#666' : 'background:#f9f9f9;border-color:#e5e5e5;color:#aaa'"
          class="px-3 py-1 border-t text-xs">
          {{ input.length }} characters
        </div>
      </div>

      <!-- Output panel -->
      <div class="flex flex-col flex-1">
        <div :style="isDark ? 'background:#2a2a2e;border-color:#3a3a3f' : 'background:#f9f9f9;border-color:#e5e5e5'"
          class="flex items-center gap-2 px-3 py-1.5 border-b">
          <span class="text-xs font-medium flex-1" :style="isDark ? 'color:#888' : 'color:#888'">
            {{ mode === 'encode' ? 'OUTPUT — Base64 String' : 'OUTPUT — Plain Text' }}
          </span>
          <n-button size="tiny" type="primary" :disabled="!output" @click="copyToClipboard">
            <template #icon><n-icon><CopyOutline /></n-icon></template>
            {{ copied ? 'Copied!' : 'Copy' }}
          </n-button>
          <n-button size="tiny" :disabled="!output" @click="downloadOutput">
            <template #icon><n-icon><DownloadOutline /></n-icon></template>
            Download
          </n-button>
        </div>
        <textarea
          v-model="output"
          readonly
          placeholder="Output will appear here..."
          class="flex-1 resize-none p-4 font-mono text-sm outline-none w-full cursor-default"
          :style="isDark ? 'background:#1c1c20;color:#e5e5e5;' : 'background:#fafafa;color:#333;'"
          spellcheck="false"
        />
        <div :style="isDark ? 'background:#2a2a2e;border-color:#3a3a3f;color:#666' : 'background:#f9f9f9;border-color:#e5e5e5;color:#aaa'"
          class="px-3 py-1 border-t text-xs">
          {{ output.length }} characters
        </div>
      </div>
    </div>

    <n-alert v-if="error" type="error" :bordered="false" closable @close="error = ''" class="m-3 shrink-0">
      {{ error }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NButton, NIcon, NRadioGroup, NRadioButton, NAlert, NTag } from 'naive-ui'
import { CodeSlashOutline, ClipboardOutline, TrashOutline, CopyOutline, DownloadOutline } from '@vicons/ionicons5'
import { useDarkMode } from '../../composables/useDarkMode'

type Mode = 'encode' | 'decode'

const { isDark } = useDarkMode()
const mode = ref<Mode>('encode')
const input = ref('')
const output = ref('')
const error = ref('')
const copied = ref(false)

const handleConvert = () => {
  error.value = ''
  if (!input.value) { output.value = ''; return }
  try {
    output.value = mode.value === 'encode' ? btoa(unescape(encodeURIComponent(input.value))) : decodeURIComponent(escape(atob(input.value)))
  } catch {
    error.value = 'Invalid input. Please check your data and try again.'
    output.value = ''
  }
}

const clearInput = () => { input.value = ''; output.value = ''; error.value = '' }

const handlePaste = async () => {
  try { input.value = await navigator.clipboard.readText(); handleConvert() } catch { error.value = 'Failed to read clipboard' }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(output.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { error.value = 'Failed to copy to clipboard' }
}

const downloadOutput = () => {
  const blob = new Blob([output.value], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `base64-${mode.value}.txt`
  a.click()
}

watch(mode, () => {
  const temp = input.value
  input.value = output.value
  output.value = temp
  handleConvert()
})
</script>
