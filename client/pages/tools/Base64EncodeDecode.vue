<template>
  <div class="flex flex-col h-full">
    <!-- Mode selector toolbar -->
    <div
      class="border-b px-3 py-2 flex items-center gap-2 shrink-0 bg-[#2a2a2e] border-[var(--border-color)]"
    >
      <span class="text-xs font-medium text-[var(--icon-color)]">Mode</span>
      <n-radio-group v-model:value="mode" size="small">
        <n-radio-button value="encode">Encode</n-radio-button>
        <n-radio-button value="decode">Decode</n-radio-button>
      </n-radio-group>
    </div>

    <!-- Two-panel editor -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Input panel -->
      <div class="flex flex-col flex-1 border-r border-[var(--border-color)]">
        <!-- Panel toolbar -->
        <div
          class="flex items-center gap-2 px-3 py-1.5 border-b bg-[#2a2a2e] border-[var(--border-color)]"
        >
          <span class="text-xs font-medium flex-1 text-[var(--icon-color)]">
            {{ mode === 'encode' ? 'INPUT — Plain Text' : 'INPUT — Base64 String' }}
          </span>
          <n-button size="tiny" @click="handlePaste">
            <template #icon
              ><n-icon><Clipboard /></n-icon
            ></template>
            Paste
          </n-button>
          <n-button size="tiny" @click="clearInput">
            <template #icon
              ><n-icon><Trash /></n-icon
            ></template>
            Clear
          </n-button>
        </div>
        <textarea
          v-model="input"
          :placeholder="
            mode === 'encode'
              ? 'Enter or paste text to encode...'
              : 'Enter or paste Base64 string to decode...'
          "
          class="flex-1 resize-none p-4 font-mono text-sm outline-none w-full bg-[var(--bg-primary)] text-[#e5e5e5]"
          spellcheck="false"
          @input="handleConvert"
        />
        <div
          class="px-3 py-1 border-t text-xs bg-[#2a2a2e] border-[var(--border-color)] text-[var(--text-muted)]"
        >
          {{ input.length }} characters
        </div>
      </div>

      <!-- Output panel -->
      <div class="flex flex-col flex-1">
        <div
          class="flex items-center gap-2 px-3 py-1.5 border-b bg-[#2a2a2e] border-[var(--border-color)]"
        >
          <span class="text-xs font-medium flex-1 text-[var(--icon-color)]">
            {{ mode === 'encode' ? 'OUTPUT — Base64 String' : 'OUTPUT — Plain Text' }}
          </span>
          <n-button size="tiny" type="primary" :disabled="!output" @click="copyToClipboard">
            <template #icon
              ><n-icon><Copy /></n-icon
            ></template>
            {{ copied ? 'Copied!' : 'Copy' }}
          </n-button>
          <n-button size="tiny" :disabled="!output" @click="downloadOutput">
            <template #icon
              ><n-icon><Download /></n-icon
            ></template>
            Download
          </n-button>
        </div>
        <textarea
          v-model="output"
          readonly
          placeholder="Output will appear here..."
          class="flex-1 resize-none p-4 font-mono text-sm outline-none w-full cursor-default bg-[#1c1c20] text-[#e5e5e5]"
          spellcheck="false"
        />
        <div
          class="px-3 py-1 border-t text-xs bg-[#2a2a2e] border-[var(--border-color)] text-[var(--text-muted)]"
        >
          {{ output.length }} characters
        </div>
      </div>
    </div>

    <n-alert
      v-if="error"
      type="error"
      :bordered="false"
      closable
      class="m-3 shrink-0"
      @close="error = ''"
    >
      {{ error }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { Clipboard, Copy, Download, Trash } from '@vicons/tabler'

type Base64Mode = 'encode' | 'decode'

const mode = ref<Base64Mode>('encode')
const input = ref('')
const output = ref('')
const error = ref('')
const copied = ref(false)

const handleConvert = () => {
  error.value = ''
  if (!input.value) {
    output.value = ''
    return
  }
  try {
    output.value =
      mode.value === 'encode'
        ? btoa(unescape(encodeURIComponent(input.value)))
        : decodeURIComponent(escape(atob(input.value)))
  } catch {
    error.value = 'Invalid input. Please check your data and try again.'
    output.value = ''
  }
}

const clearInput = () => {
  input.value = ''
  output.value = ''
  error.value = ''
}

const handlePaste = async () => {
  try {
    input.value = await navigator.clipboard.readText()
    handleConvert()
  } catch {
    error.value = 'Failed to read clipboard'
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(output.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    error.value = 'Failed to copy to clipboard'
  }
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
