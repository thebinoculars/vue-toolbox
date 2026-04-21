<template>
  <div class="spotlight-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading beautiful images...</p>
    </div>

    <!-- Main Content -->
    <div
      v-else
      class="main-container"
      :style="{ backgroundImage: `url(${currentImageUrl})` }"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
    >
      <!-- Image Overlay -->
      <div class="image-overlay"></div>

      <!-- Title Section -->
      <div class="title-section">
        <h2 v-show="controlsVisible" class="image-title">
          {{ imageData?.title || 'Beautiful Image' }}
        </h2>
      </div>

      <!-- Fullscreen Button (Top Right) -->
      <n-float-button
        v-show="controlsVisible"
        :right="24"
        :top="24"
        position="absolute"
        class="icon-button"
        :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'"
        @click="toggleFullscreen"
      >
        <n-icon size="20">
          <Maximize v-if="!isFullscreen" />
          <Minimize v-else />
        </n-icon>
      </n-float-button>

      <!-- Play Button (Bottom Left) -->
      <n-float-button
        v-show="controlsVisible"
        :left="24"
        :bottom="24"
        position="absolute"
        :class="{ active: autoplayEnabled }"
        class="icon-button"
        :title="autoplayEnabled ? 'Stop Autoplay' : 'Start Autoplay'"
        @click="toggleAutoplay"
      >
        <n-icon size="20">
          <PlayerPlay v-if="!autoplayEnabled" />
          <PlayerPause v-else />
        </n-icon>
      </n-float-button>

      <!-- New Image Button (Bottom Right) -->
      <n-float-button
        v-show="controlsVisible"
        :right="24"
        :bottom="24"
        position="absolute"
        class="icon-button"
        :disabled="loading"
        title="New Image"
        @click="fetchNewImage"
      >
        <n-icon size="20">
          <Refresh />
        </n-icon>
      </n-float-button>

      <!-- Progress Bar for Autoplay -->
      <div
        v-if="autoplayEnabled && controlsVisible"
        class="progress-bar"
        :style="{ width: progressWidth + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Refresh, PlayerPlay, PlayerPause, Maximize, Minimize } from '@vicons/tabler'
import { NIcon, NFloatButton } from 'naive-ui'
import axios from 'axios'
import type { SpotlightImageData, SpotlightResponse } from '~/shared/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const browser = (globalThis as any).window
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const consoleLog = (globalThis as any).console

// Type definitions for browser APIs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TimerId = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IntervalId = any

// Reactive state
const imageData = ref<SpotlightImageData | null>(null)
const loading = ref(true)
const autoplayEnabled = ref(false)
const autoplayTimer = ref<TimerId | null>(null)
const progressTimer = ref<IntervalId | null>(null)
const progressWidth = ref(0)
const isFullscreen = ref(false)
const isMobile = ref(false)
const controlsVisible = ref(true)
const hideControlsTimer = ref<TimerId | null>(null)

// Constants
const AUTOPLAY_INTERVAL = 10000 // 10 seconds
const PROGRESS_UPDATE_INTERVAL = 100 // Update progress every 100ms
const CONTROLS_HIDE_DELAY = 3000 // 3 seconds

// Computed properties
const currentImageUrl = computed(() => {
  if (!imageData.value) return ''
  return isMobile.value
    ? imageData.value.portraitImage?.asset || ''
    : imageData.value.landscapeImage?.asset || ''
})

// Methods
const fetchSpotlightData = async () => {
  try {
    loading.value = true

    const response = await axios.get('/api/proxy/spotlight')

    const data: SpotlightResponse = response.data

    if (data?.ad) {
      imageData.value = data.ad
    }
  } catch (error) {
    consoleLog.error('Failed to fetch spotlight data:', error)
  } finally {
    loading.value = false
  }
}

const fetchNewImage = () => {
  resetProgress()
  fetchSpotlightData()
}

const toggleAutoplay = () => {
  autoplayEnabled.value = !autoplayEnabled.value

  if (autoplayEnabled.value) {
    startAutoplay()
  } else {
    stopAutoplay()
  }
}

const startAutoplay = () => {
  stopAutoplay() // Clear any existing timers

  // Start progress animation
  progressWidth.value = 0
  const startTime = Date.now()

  progressTimer.value = browser.setInterval(() => {
    const elapsed = Date.now() - startTime
    const progress = (elapsed / AUTOPLAY_INTERVAL) * 100

    if (progress >= 100) {
      progressWidth.value = 100
      if (progressTimer.value) {
        browser.clearInterval(progressTimer.value)
      }
      progressTimer.value = null
    } else {
      progressWidth.value = progress
    }
  }, PROGRESS_UPDATE_INTERVAL)

  // Set autoplay timer
  autoplayTimer.value = browser.setTimeout(() => {
    if (autoplayEnabled.value) {
      fetchNewImage()
      startAutoplay() // Restart for next cycle
    }
  }, AUTOPLAY_INTERVAL)
}

const stopAutoplay = () => {
  if (!browser) return

  if (autoplayTimer.value) {
    browser.clearTimeout(autoplayTimer.value)
    autoplayTimer.value = null
  }

  if (progressTimer.value) {
    browser.clearInterval(progressTimer.value)
    progressTimer.value = null
  }

  progressWidth.value = 0
}

const resetProgress = () => {
  if (autoplayEnabled.value) {
    stopAutoplay()
    startAutoplay()
  }
}

const toggleFullscreen = async () => {
  if (!browser) return
  const container = browser.document.querySelector('.spotlight-container')
  if (container && !browser.document.fullscreenElement) {
    await container.requestFullscreen()
    isFullscreen.value = true
  } else if (browser.document.fullscreenElement) {
    await browser.document.exitFullscreen()
    isFullscreen.value = false
  }
}

const showControls = () => {
  controlsVisible.value = true
  if (isFullscreen.value) {
    startHideControlsTimer()
  }
}

const hideControls = () => {
  if (isFullscreen.value) {
    controlsVisible.value = false
  }
}

const handleFullscreenChange = () => {
  if (!browser) return
  isFullscreen.value = !!browser.document.fullscreenElement
  controlsVisible.value = true

  if (isFullscreen.value) {
    startHideControlsTimer()
  } else {
    clearHideControlsTimer()
  }
}

const onMouseMove = () => {
  if (isFullscreen.value) {
    showControls()
  }
}

const onMouseLeave = () => {
  if (isFullscreen.value) {
    hideControls()
  }
}

const startHideControlsTimer = (delay = CONTROLS_HIDE_DELAY) => {
  clearHideControlsTimer()
  if (!browser) return

  hideControlsTimer.value = browser.setTimeout(() => {
    if (isFullscreen.value) {
      controlsVisible.value = false
    }
  }, delay)
}

const clearHideControlsTimer = () => {
  if (!browser) return

  if (hideControlsTimer.value) {
    browser.clearTimeout(hideControlsTimer.value)
    hideControlsTimer.value = null
  }
}

const handleResize = () => {
  if (!browser) return
  isMobile.value = browser.innerWidth < 768
}

// Lifecycle
onMounted(() => {
  handleResize()
  fetchSpotlightData()

  if (browser) {
    browser.addEventListener('resize', handleResize)
    browser.document.addEventListener('fullscreenchange', handleFullscreenChange)
  }
})

onUnmounted(() => {
  stopAutoplay()
  clearHideControlsTimer()
  if (browser) {
    browser.removeEventListener('resize', handleResize)
    browser.document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }
})
</script>

<style scoped>
.spotlight-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #000;
}

/* Fullscreen mode */
.spotlight-container:fullscreen {
  width: 100vw;
  height: 100vh;
  cursor: none;
}

.spotlight-container:fullscreen:hover {
  cursor: default;
}

/* Loading State */
.loading-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 16px;
  opacity: 0.8;
  margin: 0;
}

/* Main Container */
.main-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6));
  z-index: 1;
}

/* Title Section */
.title-section {
  position: absolute;
  top: 24px;
  left: 24px;
  right: 24px;
  z-index: 3;
}

.image-title {
  color: white;
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* Icon Buttons */
.icon-button {
  position: absolute;
  z-index: 3;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    opacity 0.2s ease;
  backdrop-filter: blur(14px);
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: scale(1.05);
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-bar {
  height: 2px;
  background: linear-gradient(to right, #0066ff, #00d4ff);
  transition: width 0.1s linear;
  border-radius: 1px;
}

/* Responsive */
@media (max-width: 768px) {
  .title-section {
    top: 16px;
    left: 16px;
    right: 16px;
  }

  .image-title {
    font-size: 20px;
  }

  .icon-button {
    width: 48px;
    height: 48px;
  }

  .fullscreen-btn {
    top: 16px;
    right: 16px;
  }

  .play-btn {
    bottom: 16px;
    left: 16px;
  }

  .new-image-btn {
    bottom: 16px;
    right: 16px;
  }
}
</style>
