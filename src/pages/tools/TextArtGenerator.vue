<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-hidden">
      <div class="h-full overflow-hidden p-4 flex flex-col lg:flex-row gap-4">
        <!-- Settings Panel -->
        <div
          :style="
            isDark
              ? 'background:#232326;border-color:#3a3a3f'
              : 'background:#fff;border-color:#e5e5e5'
          "
          class="w-full lg:w-96 rounded-2xl border p-4 flex flex-col overflow-y-auto"
        >
          <div class="space-y-4">
            <div class="space-y-3">
              <label class="text-sm font-medium">Text Content</label>
              <textarea
                v-model="settings.lyrics"
                rows="10"
                class="w-full rounded-xl border p-3 text-sm font-mono resize-none outline-none"
                :style="
                  isDark
                    ? 'background:#18181c;color:#e5e5e5;border-color:#3a3a3f'
                    : 'background:#fff;color:#333;border-color:#e5e5e5'
                "
                placeholder="Paste your text here..."
              />
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium mb-2">Width (px)</label>
                <n-input-number
                  v-model:value="settings.width"
                  :min="100"
                  :max="4000"
                  :step="100"
                  @update:value="handleWidthChange"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Height (px)</label>
                <n-input-number
                  v-model:value="settings.height"
                  :min="100"
                  :max="4000"
                  :step="100"
                  @update:value="handleHeightChange"
                />
              </div>
            </div>

            <n-checkbox v-model:checked="settings.maintainAspectRatio">
              Maintain aspect ratio
            </n-checkbox>

            <div>
              <label class="block text-sm font-medium mb-2">Font</label>
              <n-select v-model:value="settings.fontFamily" :options="fontOptions" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium mb-2">Font size</label>
                <n-slider
                  v-model:value="settings.fontSize"
                  :min="4"
                  :max="100"
                  :step="1"
                  show-input
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Line height</label>
                <n-slider
                  v-model:value="settings.lineHeight"
                  :min="4"
                  :max="100"
                  :step="1"
                  show-input
                />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium mb-2">Brightness</label>
                <n-slider
                  v-model:value="settings.brightness"
                  :min="0"
                  :max="200"
                  :step="5"
                  show-input
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Contrast</label>
                <n-slider
                  v-model:value="settings.contrast"
                  :min="0"
                  :max="200"
                  :step="5"
                  show-input
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Background color</label>
              <n-color-picker v-model:value="settings.bgColor" :show-alpha="false" />
            </div>

            <div class="flex gap-2 pt-2 justify-center">
              <n-button size="small" :disabled="!imageSrc" @click="handleChangeImage">
                <template #icon
                  ><n-icon><Upload /></n-icon
                ></template>
                Change
              </n-button>
              <n-button
                size="small"
                type="warning"
                :loading="isGenerating"
                :disabled="!imageSrc"
                @click="generate"
              >
                <template #icon
                  ><n-icon><PlayerPlay /></n-icon
                ></template>
                Generate
              </n-button>
              <n-button size="small" type="success" :disabled="!imageSrc" @click="download">
                <template #icon
                  ><n-icon><Download /></n-icon
                ></template>
                Download
              </n-button>
            </div>
          </div>
        </div>

        <!-- Preview Area -->
        <div
          class="flex-1 rounded-2xl border overflow-hidden flex flex-col"
          :style="
            isDark
              ? 'background:#232326;border-color:#3a3a3f'
              : 'background:#fff;border-color:#e5e5e5'
          "
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileUpload"
          />
          <div
            ref="previewContainer"
            class="flex-1 flex items-center justify-center cursor-pointer bg-opacity-50 transition-all overflow-auto"
            :style="isDark ? 'background:#18181c' : 'background:#fafafa'"
            @click="!imageSrc && triggerFileInput()"
            @wheel="handlePreviewWheel"
          >
            <div
              v-if="!imageSrc"
              class="flex flex-col items-center justify-center gap-2 text-slate-500"
            >
              <n-icon size="48"><Photo /></n-icon>
              <p class="text-sm">Click to upload image</p>
            </div>
            <canvas
              v-else
              ref="canvasRef"
              class="max-w-full max-h-full transition-transform duration-200"
              :style="canvasStyleWithZoom"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { NButton, NIcon, NInputNumber, NCheckbox, NSelect, NSlider, NColorPicker } from 'naive-ui'
import { Upload, PlayerPlay, Download, Photo } from '@vicons/tabler'
import { useDarkModeStore } from '@/stores/darkMode'
import type { TextArtSettings } from '~/shared/types'

const DEFAULT_SETTINGS: TextArtSettings = {
  width: 4000,
  height: 4000,
  lyrics:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  lineSeparator: '   ',
  bgColor: '#0a0a0a',
  brightness: 100,
  contrast: 100,
  fontFamily: 'Arial',
  fontSize: 26,
  lineHeight: 28,
  maintainAspectRatio: true,
}

const STORAGE_KEY = 'text-art.settings'

const { isDark } = useDarkModeStore()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const browser = globalThis as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fileInput = ref<any>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const canvasRef = ref<any>(null)
const imageSrc = ref<string | null>(null)
const isGenerating = ref(false)
const imageSize = reactive({ width: 0, height: 0 })

const settings = reactive<TextArtSettings>({ ...DEFAULT_SETTINGS })
const zoomLevel = ref(1)

const fontOptions = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Tahoma', value: 'Tahoma' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Garamond', value: 'Garamond' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Courier', value: 'Courier' },
  { label: 'Lucida Console', value: 'Lucida Console' },
  { label: 'Monaco', value: 'Monaco' },
  { label: 'Impact', value: 'Impact' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS' },
]

const imageAspectRatio = computed(() => {
  return imageSize.height > 0 ? imageSize.width / imageSize.height : 1
})

const canvasStyleWithZoom = computed(
  () =>
    `image-rendering: crisp-edges; background-color: ${settings.bgColor}; max-width: 100%; max-height: 100%; transform: scale(${zoomLevel.value}); transform-origin: center;`,
)

const handlePreviewWheel = (event: unknown) => {
  const wheelEvent = event as { deltaY?: number; preventDefault?: () => void }
  if (!imageSrc.value) return
  wheelEvent.preventDefault?.()

  const delta = (wheelEvent.deltaY ?? 0) > 0 ? -0.1 : 0.1
  zoomLevel.value = Math.max(0.5, Math.min(zoomLevel.value + delta, 3))
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event: unknown) => {
  const input = event as { target?: { files?: unknown[] } }
  const file = input.target?.files?.[0]
  if (!file) return

  const reader = new browser.FileReader()
  reader.onload = (e: unknown) => {
    const result = (e as { target?: { result: unknown } }).target?.result
    if (typeof result === 'string') {
      imageSrc.value = result
      loadImageAndGenerate()
    }
  }
  reader.readAsDataURL(file)
}

const handleChangeImage = () => {
  triggerFileInput()
}

const loadImageAndGenerate = async () => {
  if (!imageSrc.value) return

  const img = new browser.Image()
  img.onload = () => {
    imageSize.width = img.width
    imageSize.height = img.height

    if (settings.maintainAspectRatio) {
      settings.height = Math.max(100, Math.round(settings.width / imageAspectRatio.value))
    }

    generate()
  }
  img.onerror = () => {
    isGenerating.value = false
  }
  img.src = imageSrc.value
}

const handleWidthChange = (value: number | null) => {
  if (value === null) return
  settings.width = value
  if (settings.maintainAspectRatio && imageSize.width && imageSize.height) {
    settings.height = Math.max(100, Math.round(value / imageAspectRatio.value))
  }
}

const handleHeightChange = (value: number | null) => {
  if (value === null) return
  settings.height = value
  if (settings.maintainAspectRatio && imageSize.width && imageSize.height) {
    settings.width = Math.max(100, Math.round(value * imageAspectRatio.value))
  }
}

interface CanvasContext2D {
  fillStyle: string
  fillRect(x: number, y: number, width: number, height: number): void
  font: string
  textAlign: string
  textBaseline: string
  fillText(text: string, x: number, y: number): void
}

interface CanvasLike {
  width: number
  height: number
  getContext(contextId: string, options?: { willReadFrequently: boolean }): CanvasContext2D | null
}

const generateTextPoster = async (
  canvas: unknown,
  imgSrc: string,
  currentSettings: TextArtSettings,
) => {
  return new Promise<void>((resolve, reject) => {
    const canvasEl = canvas as CanvasLike
    const ctx = canvasEl.getContext('2d', { willReadFrequently: true })
    if (!ctx) return reject(new Error('Could not get 2D context'))

    const {
      width,
      height,
      lyrics,
      lineSeparator,
      bgColor,
      brightness,
      contrast,
      fontFamily,
      fontSize,
      lineHeight,
    } = currentSettings

    const img = new browser.Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const scale = Math.min(width / img.width, height / img.height)
      const actualWidth = Math.round(img.width * scale)
      const actualHeight = Math.round(img.height * scale)

      canvasEl.width = actualWidth
      canvasEl.height = actualHeight

      const offscreen = browser.document.createElement('canvas')
      offscreen.width = actualWidth
      offscreen.height = actualHeight
      const offCtx = offscreen.getContext('2d')
      if (!offCtx) return reject(new Error('Could not get offscreen context'))

      offCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
      offCtx.drawImage(img, 0, 0, actualWidth, actualHeight)

      const imgData = offCtx.getImageData(0, 0, actualWidth, actualHeight).data

      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, actualWidth, actualHeight)

      const rawText = lyrics.trim()
      const formattedText = rawText.split(/\r?\n/).join(lineSeparator).replace(/\s+/g, ' ').trim()
      const textToUse = formattedText.length > 0 ? `${formattedText} ` : 'TEXT '

      ctx.font = `600 ${fontSize}px "${fontFamily}", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const charStepX = fontSize * 0.45
      const charStepY = lineHeight
      let charIdx = 0

      for (let y = charStepY / 2; y < actualHeight; y += charStepY) {
        for (let x = charStepX / 2; x < actualWidth; x += charStepX) {
          const px = Math.floor(x)
          const py = Math.floor(y)
          if (px >= actualWidth || py >= actualHeight) continue

          const i = (py * actualWidth + px) * 4
          const r = imgData[i]
          const g = imgData[i + 1]
          const b = imgData[i + 2]
          const a = imgData[i + 3]

          if (a > 0) {
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
            const char = textToUse[charIdx % textToUse.length]
            ctx.fillText(char, x, y)
            charIdx += 1
          }
        }
      }

      resolve()
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imgSrc
  })
}

const generate = async () => {
  if (!imageSrc.value || !canvasRef.value) return

  isGenerating.value = true
  try {
    await generateTextPoster(canvasRef.value, imageSrc.value, settings)
    const ctx = canvasRef.value.getContext('2d')
    if (ctx) {
      ctx.imageSmoothingEnabled = false
    }
  } catch (error) {
    browser.console.error('Error generating text art', error)
  } finally {
    isGenerating.value = false
  }
}

const download = () => {
  if (!canvasRef.value) return

  const link = browser.document.createElement('a')
  link.download = `text-art-${Date.now()}.png`
  link.href = canvasRef.value.toDataURL('image/png')
  link.click()
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as TextArtSettings
      Object.assign(settings, { ...DEFAULT_SETTINGS, ...parsed })
    } catch {
      Object.assign(settings, DEFAULT_SETTINGS)
    }
  }
})

watch(
  settings,
  (newSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
  },
  { deep: true },
)
</script>
