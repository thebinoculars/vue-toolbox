<template>
  <div class="flex flex-col h-full">
    <!-- Toolbar -->
    <div
      :style="
        isDark
          ? 'background:#2a2a2e;border-color:#3a3a3f'
          : 'background:#f9f9f9;border-color:#e5e5e5'
      "
      class="border-b px-3 py-2 flex items-center gap-2 shrink-0 overflow-x-auto flex-wrap"
    >
      <div class="flex items-center gap-1 shrink-0">
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button size="tiny" @click="newFile">
              <template #icon
                ><n-icon><FilePlus /></n-icon
              ></template>
            </n-button>
          </template>
          New file
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button size="tiny" @click="openFile">
              <template #icon
                ><n-icon><Folder /></n-icon
              ></template>
            </n-button>
          </template>
          Open file
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button size="tiny" :disabled="undoStack.length <= 1" @click="undo">
              <template #icon
                ><n-icon><CornerUpLeft /></n-icon
              ></template>
            </n-button>
          </template>
          Undo (Ctrl+Z)
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button size="tiny" :disabled="redoStack.length === 0" @click="redo">
              <template #icon
                ><n-icon><CornerUpRight /></n-icon
              ></template>
            </n-button>
          </template>
          Redo (Ctrl+Y)
        </n-tooltip>
        <n-tooltip v-for="btn in toolbarButtons" :key="btn.label" placement="bottom">
          <template #trigger>
            <n-button size="tiny" @click="btn.action">
              <template #icon
                ><n-icon><component :is="btn.icon" /></n-icon
              ></template>
            </n-button>
          </template>
          {{ btn.label }}
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button size="tiny" @click="downloadMd">
              <template #icon
                ><n-icon><Download /></n-icon
              ></template>
            </n-button>
          </template>
          Download .md
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button size="tiny" @click="exportHtml">
              <template #icon
                ><n-icon><FileCode /></n-icon
              ></template>
            </n-button>
          </template>
          Export HTML
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button size="tiny" @click="exportPdf">
              <template #icon
                ><n-icon><Printer /></n-icon
              ></template>
            </n-button>
          </template>
          Export PDF
        </n-tooltip>
      </div>

      <div class="flex-1" />

      <div class="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        <span class="text-xs shrink-0" :style="isDark ? 'color:#666' : 'color:#999'"
          >{{ wordCount }} words · {{ content.length }} chars</span
        >

        <input
          v-model="fileName"
          class="text-xs px-2 py-1 rounded border shrink-0 w-32 text-center outline-none"
          :style="
            isDark
              ? 'background:#18181c;border-color:#3a3a3f;color:#ccc'
              : 'background:#fff;border-color:#e5e5e5;color:#555'
          "
        />

        <n-radio-group v-model:value="viewMode" size="small" class="shrink-0">
          <n-radio-button value="split">Split</n-radio-button>
          <n-radio-button value="editor">Editor</n-radio-button>
          <n-radio-button value="preview">Preview</n-radio-button>
        </n-radio-group>
      </div>
    </div>

    <!-- Editor + Preview -->
    <div class="flex flex-1 overflow-hidden">
      <div
        v-if="viewMode !== 'preview'"
        class="flex flex-col flex-1 overflow-hidden"
        :class="viewMode === 'split' ? 'border-r' : ''"
        :style="isDark ? 'border-color:#3a3a3f' : 'border-color:#e5e5e5'"
      >
        <textarea
          ref="editorRef"
          v-model="content"
          spellcheck="false"
          placeholder="# Start writing markdown here..."
          class="flex-1 resize-none p-4 font-mono text-sm outline-none w-full leading-relaxed"
          :style="isDark ? 'background:#18181c;color:#e5e5e5' : 'background:#fff;color:#333'"
          @input="onInput"
          @keydown="onKeydown"
          @scroll="onEditorScroll"
        />
      </div>

      <div
        v-if="viewMode !== 'editor'"
        ref="previewRef"
        class="flex-1 overflow-y-auto p-6 prose-content"
        :style="isDark ? 'background:#1c1c20;color:#e5e5e5' : 'background:#fafafa;color:#333'"
        v-html="renderedHtml"
      />
    </div>

    <!-- Link/Image modal -->
    <n-modal
      v-model:show="showLinkModal"
      preset="card"
      :title="linkModalMode === 'link' ? 'Insert Link' : 'Insert Image'"
      style="max-width: 400px"
    >
      <div class="space-y-3">
        <n-form-item :label="linkModalMode === 'link' ? 'Display Text' : 'Alt Text'">
          <n-input
            v-model:value="linkText"
            :placeholder="linkModalMode === 'link' ? 'Link text' : 'Image alt text'"
          />
        </n-form-item>
        <n-form-item label="URL">
          <n-input v-model:value="linkUrl" placeholder="https://..." @keydown.enter="confirmLink" />
        </n-form-item>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showLinkModal = false">Cancel</n-button>
          <n-button type="primary" @click="confirmLink">Insert</n-button>
        </div>
      </template>
    </n-modal>

    <input ref="fileInputRef" type="file" accept=".md,.txt" class="hidden" @change="onFileSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'
import {
  NButton,
  NIcon,
  NTooltip,
  NRadioGroup,
  NRadioButton,
  NModal,
  NInput,
  NFormItem,
} from 'naive-ui'
import {
  Download,
  Folder,
  FilePlus,
  FileCode,
  Printer,
  Bold,
  Italic,
  Strikethrough,
  H1,
  H2,
  H3,
  List,
  ListNumbers,
  Quote,
  Code,
  Link,
  Photo,
  Table,
  CornerUpLeft,
  CornerUpRight,
} from '@vicons/tabler'
import { useDarkModeStore } from '@/stores/darkMode'

const STORAGE_KEY = 'markdown-editor.content'

const { isDark } = useDarkModeStore()

const content = ref(`# Welcome to Markdown Editor

## Features
- **Live preview** — Real-time rendering
- **Toolbar** — Quick format buttons
- **Export** — Download as .md, PDF or HTML

### Code Example
\`\`\`javascript
function hello() {
  console.log("Hello World!")
}
\`\`\`

**Happy writing!** 🚀`)

const fileName = ref('untitled.md')
const viewMode = ref<'split' | 'editor' | 'preview'>('split')
const showLinkModal = ref(false)
const linkModalMode = ref<'link' | 'image'>('link')
const linkText = ref('')
const linkUrl = ref('')
const editorRef = ref<HTMLTextAreaElement>()
const previewRef = ref<HTMLDivElement>()
const fileInputRef = ref<HTMLInputElement>()
const isSyncingScroll = ref(false)

const undoStack = ref<string[]>([content.value])
const redoStack = ref<string[]>([])

const wordCount = computed(() => {
  const text = content.value.trim()
  return text ? text.split(/\s+/).length : 0
})

const renderedHtml = computed(() => {
  try {
    return marked.parse(content.value) as string
  } catch {
    return ''
  }
})

const onInput = () => {
  redoStack.value = []
  undoStack.value.push(content.value)
  if (undoStack.value.length > 100) undoStack.value.shift()
  autoSave()
}

const undo = () => {
  if (undoStack.value.length <= 1) return
  redoStack.value.push(undoStack.value.pop()!)
  content.value = undoStack.value[undoStack.value.length - 1]
}

const redo = () => {
  if (!redoStack.value.length) return
  const next = redoStack.value.pop()!
  undoStack.value.push(next)
  content.value = next
}

const onEditorScroll = () => {
  if (isSyncingScroll.value || !previewRef.value || !editorRef.value) return
  isSyncingScroll.value = true
  const pct =
    editorRef.value.scrollTop / (editorRef.value.scrollHeight - editorRef.value.clientHeight || 1)
  previewRef.value.scrollTop = pct * (previewRef.value.scrollHeight - previewRef.value.clientHeight)
  requestAnimationFrame(() => {
    isSyncingScroll.value = false
  })
}

// Toggle wrap: bọc nếu chưa có, bỏ nếu đã có
const insertFormat = (before: string, after: string) => {
  const el = editorRef.value
  if (!el) return
  const { selectionStart: s, selectionEnd: e, value } = el
  const selected = value.slice(s, e)

  // Check if already wrapped
  const beforeStart = s - before.length
  const afterEnd = e + after.length
  if (
    beforeStart >= 0 &&
    value.slice(beforeStart, s) === before &&
    value.slice(e, afterEnd) === after
  ) {
    // Remove wrapping
    content.value = value.slice(0, beforeStart) + selected + value.slice(afterEnd)
    setTimeout(() => el.setSelectionRange(beforeStart, beforeStart + selected.length), 0)
  } else {
    // Add wrapping
    content.value = value.slice(0, s) + before + selected + after + value.slice(e)
    setTimeout(
      () => el.setSelectionRange(s + before.length, s + before.length + selected.length),
      0,
    )
  }
  el.focus()
  onInput()
}

const insertLine = (prefix: string) => {
  const el = editorRef.value
  if (!el) return
  const { selectionStart: s, value } = el
  const lineStart = value.lastIndexOf('\n', s - 1) + 1
  const lineEnd = value.indexOf('\n', s)
  const end = lineEnd === -1 ? value.length : lineEnd
  const line = value.slice(lineStart, end)
  if (line.startsWith(prefix)) {
    content.value = value.slice(0, lineStart) + line.slice(prefix.length) + value.slice(end)
  } else {
    content.value = value.slice(0, lineStart) + prefix + line + value.slice(end)
  }
  el.focus()
  onInput()
}

const insertAtCursor = (text: string) => {
  const el = editorRef.value
  if (!el) return
  const s = el.selectionStart
  content.value = content.value.slice(0, s) + text + content.value.slice(el.selectionEnd)
  el.focus()
  setTimeout(() => el.setSelectionRange(s + text.length, s + text.length), 0)
  onInput()
}

// Link/Image modal
const openLinkModal = (mode: 'link' | 'image') => {
  const el = editorRef.value
  linkModalMode.value = mode
  linkText.value = el ? el.value.slice(el.selectionStart, el.selectionEnd) : ''
  linkUrl.value = ''
  showLinkModal.value = true
}

const confirmLink = () => {
  if (!linkUrl.value) return
  const text = linkText.value || (linkModalMode.value === 'link' ? 'link' : 'image')
  const md =
    linkModalMode.value === 'link' ? `[${text}](${linkUrl.value})` : `![${text}](${linkUrl.value})`
  insertAtCursor(md)
  showLinkModal.value = false
}

const toolbarButtons = [
  { label: 'Bold', icon: Bold, action: () => insertFormat('**', '**') },
  { label: 'Italic', icon: Italic, action: () => insertFormat('*', '*') },
  { label: 'Strikethrough', icon: Strikethrough, action: () => insertFormat('~~', '~~') },
  { label: 'H1', icon: H1, action: () => insertLine('# ') },
  { label: 'H2', icon: H2, action: () => insertLine('## ') },
  { label: 'H3', icon: H3, action: () => insertLine('### ') },
  { label: 'Bullet list', icon: List, action: () => insertLine('- ') },
  { label: 'Numbered list', icon: ListNumbers, action: () => insertLine('1. ') },
  { label: 'Quote', icon: Quote, action: () => insertLine('> ') },
  { label: 'Code', icon: Code, action: () => insertFormat('`', '`') },
  { label: 'Insert link', icon: Link, action: () => openLinkModal('link') },
  { label: 'Insert image', icon: Photo, action: () => openLinkModal('image') },
  {
    label: 'Insert table',
    icon: Table,
    action: () => insertAtCursor('\n| Col 1 | Col 2 |\n|-------|-------|\n| Cell  | Cell  |\n'),
  },
]

const onKeydown = (e: KeyboardEvent) => {
  if (!e.ctrlKey && !e.metaKey) return
  if (e.key.toLowerCase() === 'z') {
    e.preventDefault()
    e.shiftKey ? redo() : undo()
  }
  if (e.key.toLowerCase() === 'y') {
    e.preventDefault()
    redo()
  }
}

const autoSave = () => {
  try {
    localStorage.setItem(STORAGE_KEY, content.value)
  } catch {
    /* ignore */
  }
}

const newFile = () => {
  content.value = ''
  fileName.value = 'untitled.md'
  undoStack.value = ['']
  redoStack.value = []
}

const downloadMd = () => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content.value], { type: 'text/markdown' }))
  a.download = fileName.value
  a.click()
}

const exportHtml = () => {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${fileName.value}</title></head><body>${renderedHtml.value}</body></html>`
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  a.download = fileName.value.replace('.md', '.html')
  a.click()
}

const exportPdf = () => {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:2rem;line-height:1.6}
    pre{background:#f5f5f5;padding:1rem;border-radius:4px;overflow-x:auto}
    code{background:#f5f5f5;padding:.2rem .4rem;border-radius:3px}
    blockquote{border-left:4px solid #6366f1;padding-left:1rem;color:#666}
    table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:.5rem}
  </style></head><body>${renderedHtml.value}</body></html>`)
  win.document.close()
  win.onload = () => {
    win.print()
  }
}

const openFile = () => fileInputRef.value?.click()

const onFileSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    content.value = ev.target?.result as string
    fileName.value = file.name
    undoStack.value = [content.value]
    redoStack.value = []
  }
  reader.readAsText(file)
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    content.value = saved
    undoStack.value = [saved]
  }
})
</script>

<style scoped>
.prose-content :deep(h1) {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 1.5rem 0 0.75rem;
}
.prose-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 1.25rem 0 0.5rem;
}
.prose-content :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
}
.prose-content :deep(p) {
  margin: 0.75rem 0;
  line-height: 1.7;
}
.prose-content :deep(ul),
.prose-content :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.75rem 0;
}
.prose-content :deep(li) {
  margin: 0.25rem 0;
}
.prose-content :deep(code) {
  font-family: monospace;
  font-size: 0.875rem;
  padding: 0.15rem 0.35rem;
  border-radius: 3px;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}
.prose-content :deep(pre) {
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1rem 0;
  background: rgba(0, 0, 0, 0.05);
}
.prose-content :deep(pre code) {
  background: none;
  color: inherit;
  padding: 0;
}
.prose-content :deep(blockquote) {
  border-left: 3px solid #6366f1;
  padding-left: 1rem;
  margin: 1rem 0;
  opacity: 0.75;
  font-style: italic;
}
.prose-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}
.prose-content :deep(th),
.prose-content :deep(td) {
  border: 1px solid #e5e5e5;
  padding: 0.5rem 0.75rem;
}
.prose-content :deep(th) {
  font-weight: 600;
  background: rgba(0, 0, 0, 0.03);
}
.prose-content :deep(a) {
  color: #6366f1;
  text-decoration: none;
}
.prose-content :deep(a:hover) {
  text-decoration: underline;
}
.prose-content :deep(img) {
  max-width: 100%;
  border-radius: 6px;
}
.prose-content :deep(hr) {
  border: none;
  border-top: 1px solid #e5e5e5;
  margin: 1.5rem 0;
}
.prose-content :deep(del) {
  opacity: 0.6;
}
</style>
