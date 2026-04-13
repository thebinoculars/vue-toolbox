<template>
  <div class="flex flex-col h-full">
    <!-- Toolbar -->
    <div
      :style="
        isDark
          ? 'background:#2a2a2e;border-color:#3a3a3f'
          : 'background:#f9f9f9;border-color:#e5e5e5'
      "
      class="border-b px-3 py-2 flex items-center gap-2 shrink-0"
    >
      <span class="text-xs font-medium" :style="isDark ? 'color:#888' : 'color:#888'">Episode</span>
      <n-select
        v-model:value="selected"
        :options="episodeOptions"
        placeholder="Select episode..."
        class="w-48"
        size="small"
        :loading="loadingOptions"
        @update:value="getEpisode"
      />
    </div>

    <!-- Content Section -->
    <div class="flex-1 overflow-y-auto p-5">
      <n-spin :show="loading">
        <template v-if="!loading && !stamps.length">
          <n-empty
            description="No track data available for this episode"
            class="mt-16"
            size="large"
          >
          </n-empty>
        </template>

        <template v-else>
          <div class="mb-8">
            <h2 class="text-2xl font-bold m-0 mb-1">{{ title }}</h2>
            <div class="text-sm" :style="isDark ? 'color:#aaa' : 'color:#666'">
              Aired: {{ release }}
            </div>
          </div>

          <div class="md:px-4">
            <n-timeline size="large" :icon-size="28">
              <n-timeline-item
                v-for="(item, index) in stamps"
                :key="item._id || index"
                type="info"
                :time="item.time"
              >
                <template #icon>
                  <n-icon size="24" :style="isDark ? 'color:#6366f1' : 'color:#4f46e5'">
                    <Music />
                  </n-icon>
                </template>
                <template #header>
                  <div class="flex items-center justify-between pb-1">
                    <div
                      class="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 flex-1 min-w-0 pr-4"
                    >
                      <div
                        class="text-base font-bold truncate"
                        :class="
                          currentTrackId === item.song?.id
                            ? isDark
                              ? 'text-indigo-400'
                              : 'text-indigo-600'
                            : ''
                        "
                        :title="item.song?.titles?.en || 'Unknown Title'"
                      >
                        {{ item.song?.titles?.en || 'Unknown Title' }}
                      </div>

                      <div
                        class="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"
                      ></div>

                      <n-text
                        depth="3"
                        class="flex items-center gap-1.5 text-sm truncate"
                        :title="item.album?.titles?.en || 'Unknown Album'"
                      >
                        <n-icon size="14" class="shrink-0"><Disc /></n-icon>
                        <span class="truncate">{{
                          item.album?.titles?.en || 'Unknown Album'
                        }}</span>
                      </n-text>
                    </div>

                    <div v-if="item.song?.id" class="shrink-0">
                      <n-tooltip trigger="hover" placement="left">
                        <template #trigger>
                          <n-button
                            circle
                            :type="
                              currentTrackId === item.song.id && isPlaying ? 'warning' : 'primary'
                            "
                            :secondary="currentTrackId !== item.song.id"
                            size="small"
                            class="shadow-sm"
                            @click="togglePlay(item.song.id)"
                          >
                            <template #icon>
                              <n-icon v-if="currentTrackId === item.song.id && isPlaying"
                                ><PlayerPause
                              /></n-icon>
                              <n-icon v-else><PlayerPlay /></n-icon>
                            </template>
                          </n-button>
                        </template>
                        {{ currentTrackId === item.song.id && isPlaying ? 'Pause' : 'Play' }}
                      </n-tooltip>
                    </div>
                  </div>
                </template>
              </n-timeline-item>
            </n-timeline>
          </div>
        </template>
      </n-spin>
    </div>

    <!-- Hidden audio element -->
    <audio
      ref="audioRef"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @ended="isPlaying = false"
    ></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import axios from 'axios'
import {
  NSpin,
  NText,
  NSelect,
  NTimeline,
  NTimelineItem,
  NButton,
  NIcon,
  NEmpty,
  NTooltip,
  useMessage,
} from 'naive-ui'
import { Music, Disc, PlayerPlay, PlayerPause } from '@vicons/tabler'
import { useDarkModeStore } from '@/stores/darkMode'
import type { OnePieceEpisode, OnePieceStamp } from '~/shared/types'

const AUDIO_SRC = 'http://onepiecetracklist.com/Music'

const { isDark } = useDarkModeStore()
const message = useMessage()

// State
const episodes = ref<OnePieceEpisode[]>([])
const stamps = ref<OnePieceStamp[]>([])
const title = ref('')
const release = ref('')
const selected = ref<number | null>(null)
const loading = ref(false)
const loadingOptions = ref(false)

// Audio State
const audioRef = ref<HTMLAudioElement | null>(null)
const currentTrackId = ref<number | null>(null)
const isPlaying = ref(false)

const episodeOptions = computed(() => {
  // Use a Set to extract unique episode numbers to prevent duplicate keys in n-select
  const uniqueKeys = new Set()
  const options: Array<{ label: string; value: number }> = []

  for (const ep of episodes.value) {
    if (!uniqueKeys.has(ep.episode)) {
      uniqueKeys.add(ep.episode)
      options.push({
        label: `Episode ${ep.episode}`,
        value: ep.episode,
      })
    }
  }

  return options
})

const getList = async () => {
  try {
    loadingOptions.value = true
    const { data } = await axios.get('/api/one-piece')

    if (data.success && data.episodes) {
      episodes.value = data.episodes
      if (data.episodes.length > 0) {
        selected.value = data.episodes[0].episode
        await getEpisode()
      }
    } else {
      throw new Error(data.message || 'Invalid response format')
    }
  } catch (err: any) {
    message.error(err.response?.data?.message || err.message || 'Failed to fetch episode list')
  } finally {
    loadingOptions.value = false
  }
}

const getEpisode = async () => {
  if (!selected.value) return

  stopPlayback()

  loading.value = true
  stamps.value = []
  title.value = ''
  release.value = ''

  try {
    const { data } = await axios.get(`/api/one-piece/${selected.value}`)

    if (data.success && data.item) {
      stamps.value = data.item.stamps || []
      title.value = data.item.titles?.en || ''
      release.value = data.item.release || ''
      document.title = `Episode ${selected.value}: ${title.value} — ToolBox`
    } else {
      throw new Error(data.message || 'Episode details not found')
    }
  } catch (err: any) {
    message.error(err.response?.data?.message || err.message || 'Failed to fetch episode details')
  } finally {
    loading.value = false
  }
}

const togglePlay = (id: number) => {
  if (!audioRef.value) return

  // If clicking on the currently loaded track, just toggle play/pause
  if (currentTrackId.value === id) {
    if (isPlaying.value) {
      audioRef.value.pause()
    } else {
      audioRef.value.play().catch((err) => {
        message.error('Failed to resume audio playback.')
        console.error(err)
      })
    }
    return
  }

  // Load new track
  currentTrackId.value = id
  audioRef.value.src = `${AUDIO_SRC}/${id}.mp3`
  audioRef.value.play().catch((err) => {
    message.error(
      'Failed to play audio. Autoplay might be blocked or the track source is unavailable.',
    )
    currentTrackId.value = null
    console.error(err)
  })
}

const stopPlayback = () => {
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
  }
  currentTrackId.value = null
  isPlaying.value = false
}

onMounted(() => {
  getList()
})

onBeforeUnmount(() => {
  stopPlayback()
})
</script>
