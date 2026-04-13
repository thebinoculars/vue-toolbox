<template>
  <div class="p-5 max-w-6xl mx-auto flex flex-col gap-6">
    <n-alert v-if="listError" type="error" :title="listError" />

    <template v-else>
      <div
        v-if="playingId"
        class="rounded-lg border p-4 flex flex-col gap-3"
        :style="
          darkModeStore.isDark
            ? 'border-color:#3a3a3f;background:#232326'
            : 'border-color:#e5e5e5;background:#fafafa'
        "
      >
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2 min-w-0">
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button size="small" quaternary circle @click="closeEmulator">
                  <template #icon>
                    <n-icon><ArrowLeft /></n-icon>
                  </template>
                </n-button>
              </template>
              Back to games
            </n-tooltip>
            <n-text v-if="activeName" strong class="truncate">{{ activeName }}</n-text>
          </div>
        </div>

        <n-alert v-if="playError" type="error" :title="playError" />

        <n-spin :show="gameLoading" class="min-h-[200px] flex justify-center items-center">
          <div v-if="romUrl" class="w-full flex flex-col items-center gap-3">
            <NesVue
              :key="playingId"
              ref="nesRef"
              :url="romUrl"
              :turbo="speed"
              :gain="volume"
              :width="width"
              :height="height"
              :p1="pad1"
              :p2="pad2"
              @fps="onFps"
              @success="onStarted"
            />
            <div class="flex flex-wrap justify-center gap-1">
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button size="small" quaternary circle :disabled="!started" @click="reset">
                    <template #icon>
                      <n-icon><RotateClockwise /></n-icon>
                    </template>
                  </n-button>
                </template>
                Reset
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button size="small" quaternary circle :disabled="!started" @click="stop">
                    <template #icon>
                      <n-icon><Square /></n-icon>
                    </template>
                  </n-button>
                </template>
                Stop
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    quaternary
                    circle
                    :disabled="!started"
                    @click="pauseOrResume"
                  >
                    <template #icon>
                      <n-icon>
                        <component :is="paused ? PlayerPlay : PlayerPause" />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                {{ paused ? 'Resume' : 'Pause' }}
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button size="small" quaternary circle :disabled="!started" @click="save">
                    <template #icon>
                      <n-icon><DeviceFloppy /></n-icon>
                    </template>
                  </n-button>
                </template>
                Save state
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button size="small" quaternary circle :disabled="!started" @click="loadState">
                    <template #icon>
                      <n-icon><Folder /></n-icon>
                    </template>
                  </n-button>
                </template>
                Load state
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button size="small" quaternary circle :disabled="!started" @click="shot">
                    <template #icon>
                      <n-icon><Camera /></n-icon>
                    </template>
                  </n-button>
                </template>
                Screenshot
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    quaternary
                    circle
                    :disabled="!started"
                    @click="settingsOpen = true"
                  >
                    <template #icon>
                      <n-icon><Settings /></n-icon>
                    </template>
                  </n-button>
                </template>
                Settings
              </n-tooltip>
            </div>
            <n-text depth="3" class="text-xs">{{ fps ? `FPS: ${fps}` : '' }}</n-text>
          </div>
        </n-spin>
      </div>

      <n-spin v-else :show="listLoading">
        <n-empty
          v-if="!listLoading && games.length === 0"
          description="No games available."
          class="py-16"
        />

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <n-card
            v-for="g in games"
            :key="g._id"
            hoverable
            class="cursor-pointer min-h-[5rem] flex items-center justify-center"
            role="button"
            tabindex="0"
            @click="selectGame(g._id)"
            @keydown.enter.prevent="selectGame(g._id)"
          >
            <div class="text-center font-medium text-base px-2">{{ g.name }}</div>
          </n-card>
        </div>
      </n-spin>
    </template>

    <n-drawer v-model:show="settingsOpen" :width="320" placement="right">
      <n-drawer-content title="Emulator settings" closable>
        <div class="flex flex-col gap-4">
          <div>
            <div class="text-sm font-medium mb-2">Size</div>
            <div class="flex items-center gap-2">
              <n-button
                size="small"
                quaternary
                circle
                :disabled="size <= scales[0]"
                @click="resizeScale(-1)"
              >
                <template #icon>
                  <n-icon><Minus /></n-icon>
                </template>
              </n-button>
              <span class="text-sm tabular-nums min-w-[3rem] text-center">{{ size }}×</span>
              <n-button
                size="small"
                quaternary
                circle
                :disabled="size >= scales[scales.length - 1]"
                @click="resizeScale(1)"
              >
                <template #icon>
                  <n-icon><Plus /></n-icon>
                </template>
              </n-button>
            </div>
          </div>

          <n-divider class="!my-0" />

          <div>
            <div class="text-sm font-medium mb-2">Volume</div>
            <n-slider v-model:value="volume" :min="0" :max="100" :step="1" />
          </div>

          <n-divider class="!my-0" />

          <div>
            <div class="text-sm font-medium mb-2">Speed</div>
            <n-slider v-model:value="speed" :min="5" :max="20" :step="1" />
          </div>

          <n-divider class="!my-0" />

          <div>
            <div class="text-sm font-medium mb-2">Keys</div>
            <div class="overflow-x-auto">
              <table class="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th class="text-left py-1 pr-2 w-14 font-medium">Button</th>
                    <th class="text-left py-1 pr-2 font-medium">P1</th>
                    <th class="text-left py-1 font-medium">P2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="key in padKeys" :key="key">
                    <td class="py-1 pr-2 align-middle">{{ key }}</td>
                    <td class="py-1 pr-1 align-middle">
                      <n-input
                        readonly
                        size="tiny"
                        class="keymap !text-xs"
                        :value="pad1[key]"
                        @keydown.prevent="mapPad1($event, key)"
                      />
                    </td>
                    <td class="py-1 align-middle">
                      <n-input
                        readonly
                        size="tiny"
                        class="keymap !text-xs"
                        :value="pad2[key]"
                        @keydown.prevent="mapPad2($event, key)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import axios from 'axios'
import { NesVue } from 'nes-vue'
import {
  NCard,
  NSpin,
  NEmpty,
  NAlert,
  NText,
  NIcon,
  NButton,
  NTooltip,
  NDrawer,
  NDrawerContent,
  NSlider,
  NDivider,
  NInput,
} from 'naive-ui'
import {
  ArrowLeft,
  Settings,
  RotateClockwise,
  Square,
  PlayerPlay,
  PlayerPause,
  DeviceFloppy,
  Folder,
  Camera,
  Minus,
  Plus,
} from '@vicons/tabler'
import { useDarkModeStore } from '@/stores/darkMode'

const STORAGE_KEY = 'nes-emulator.settings'

type GameCard = {
  _id: string
  name: string
  romUrl: string
  imageUrl: string | null
}

type PadKey = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'A' | 'B' | 'C' | 'D' | 'SELECT' | 'START'

const padKeys: PadKey[] = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'A', 'B', 'C', 'D', 'SELECT', 'START']

const darkModeStore = useDarkModeStore()

const games = ref<GameCard[]>([])
const listLoading = ref(true)
const listError = ref('')

const playingId = ref<string | null>(null)
const activeName = ref('')
const romUrl = ref<string | null>(null)
const gameLoading = ref(false)
const playError = ref('')
const settingsOpen = ref(false)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nesRef = ref<any>(null)
const fps = ref(0)
const started = ref(false)
const paused = ref(false)

const volume = ref(50)
const size = ref(2)
const speed = ref(10)
const width = computed(() => Math.round(size.value * 256))
const height = computed(() => Math.round(size.value * 240))

const scales: number[] = []
for (let i = 1; i <= 5; i += 0.5) {
  scales.push(Number(i.toFixed(1)))
}

const pad1 = ref<Record<PadKey, string>>({
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  A: 'Numpad2',
  B: 'Numpad1',
  C: 'Numpad5',
  D: 'Numpad4',
  SELECT: 'Space',
  START: 'Enter',
})

const pad2 = ref<Record<PadKey, string>>({
  UP: 'KeyW',
  DOWN: 'KeyS',
  LEFT: 'KeyA',
  RIGHT: 'KeyD',
  A: 'KeyK',
  B: 'KeyJ',
  C: 'KeyI',
  D: 'KeyU',
  SELECT: 'KeyO',
  START: 'KeyP',
})

function loadPersistedSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const o = JSON.parse(raw) as {
      volume?: number
      size?: number
      speed?: number
      pad1?: Partial<Record<PadKey, string>>
      pad2?: Partial<Record<PadKey, string>>
    }
    if (typeof o.volume === 'number') volume.value = o.volume
    if (typeof o.size === 'number') {
      size.value = scales.reduce((best, cur) =>
        Math.abs(cur - o.size!) < Math.abs(best - o.size!) ? cur : best,
      )
    }
    if (typeof o.speed === 'number') speed.value = Math.min(20, Math.max(5, o.speed))
    if (o.pad1) {
      for (const k of padKeys) {
        if (typeof o.pad1[k] === 'string') pad1.value[k] = o.pad1[k]!
      }
    }
    if (o.pad2) {
      for (const k of padKeys) {
        if (typeof o.pad2[k] === 'string') pad2.value[k] = o.pad2[k]!
      }
    }
  } catch {
    /* ignore */
  }
}

function persistSettings() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        volume: volume.value,
        size: size.value,
        speed: speed.value,
        pad1: pad1.value,
        pad2: pad2.value,
      }),
    )
  } catch {
    /* ignore */
  }
}

watch([volume, size, speed, pad1, pad2], persistSettings, { deep: true })

const resizeScale = (delta: number) => {
  const idx = scales.findIndex((s) => s === size.value)
  const next = idx + delta
  if (idx !== -1 && scales[next] !== undefined) {
    size.value = scales[next]!
  }
}

const mapPad1 = (e: KeyboardEvent, key: PadKey) => {
  pad1.value = { ...pad1.value, [key]: e.code }
}

const mapPad2 = (e: KeyboardEvent, key: PadKey) => {
  pad2.value = { ...pad2.value, [key]: e.code }
}

const loadList = async () => {
  listLoading.value = true
  listError.value = ''
  try {
    const { data } = await axios.get<{ success?: boolean; games?: GameCard[]; message?: string }>(
      '/api/nes-games',
    )
    if (data.success && Array.isArray(data.games)) {
      games.value = data.games
    } else {
      throw new Error(data.message || 'Invalid response')
    }
  } catch (e: unknown) {
    const ax = axios.isAxiosError(e)
    const msg =
      (ax && (e.response?.data as { message?: string })?.message) ||
      (e instanceof Error
        ? e.message
        : 'Failed to load games. Run `netlify dev` on port 8888 when using `npm run dev`.')
    listError.value = msg
  } finally {
    listLoading.value = false
  }
}

const selectGame = async (id: string) => {
  const game = games.value.find((g) => g._id === id)
  if (!game) {
    playError.value = 'Selected game not found'
    return
  }
  playingId.value = id
  playError.value = ''
  romUrl.value = ''
  gameLoading.value = true
  started.value = false
  paused.value = false
  fps.value = 0

  try {
    romUrl.value = `/api/nes-games/${id}`
    activeName.value = game.name
    globalThis.document.title = `${game.name} — NES Emulator — ToolBox`
  } catch (e: unknown) {
    const ax = axios.isAxiosError(e)
    const msg =
      (ax && (e.response?.data as { message?: string })?.message) ||
      (e instanceof Error ? e.message : 'Failed to load game or ROM')
    playError.value = msg
  } finally {
    gameLoading.value = false
  }
}

const closeEmulator = () => {
  try {
    nesRef.value?.stop()
  } catch {
    /* ignore */
  }
  playingId.value = null
  activeName.value = ''
  romUrl.value = ''
  playError.value = ''
  started.value = false
  paused.value = false
  fps.value = 0
  globalThis.document.title = 'NES Emulator'
}

const onFps = (frame: string | number) => {
  fps.value = typeof frame === 'number' ? frame : parseInt(String(frame), 10)
}

const onStarted = () => {
  started.value = true
  paused.value = false
}

const reset = () => {
  try {
    nesRef.value?.reset()
    started.value = true
    paused.value = false
    fps.value = 0
  } catch {
    /* ignore */
  }
}

const stop = () => {
  try {
    nesRef.value?.stop()
    started.value = false
    paused.value = false
    fps.value = 0
  } catch {
    /* ignore */
  }
}

const pauseOrResume = () => {
  try {
    if (paused.value) {
      nesRef.value?.play()
    } else {
      nesRef.value?.pause()
    }
    paused.value = !paused.value
  } catch {
    /* ignore */
  }
}

const save = () => {
  try {
    nesRef.value?.save(activeName.value)
  } catch {
    /* ignore */
  }
}

const loadState = () => {
  try {
    nesRef.value?.load(activeName.value)
  } catch {
    /* ignore */
  }
}

const shot = () => {
  try {
    nesRef.value?.screenshot(true)
  } catch {
    /* ignore */
  }
}

const keyHandler = (e: Event) => {
  if (!(e instanceof KeyboardEvent)) return
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault()
    const el = globalThis.document?.activeElement
    if (el?.classList.contains('keymap')) {
      el.dispatchEvent(new KeyboardEvent('keypress', { code: e.code }))
    }
  }
}

onMounted(() => {
  loadPersistedSettings()
  globalThis.addEventListener?.('keydown', keyHandler, true)
  loadList()
})

onUnmounted(() => {
  globalThis.removeEventListener?.('keydown', keyHandler, true)
})
</script>
