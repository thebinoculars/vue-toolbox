<template>
  <div
    class="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
    @click="handleBackgroundClick"
  >
    <div class="relative w-full h-full flex flex-col">
      <div
        class="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4"
      >
        <div class="flex items-center justify-between">
          <div class="text-white">
            <span class="text-sm opacity-75">{{ currentIndex + 1 }} / {{ images.length }}</span>
            <h3 class="font-medium">{{ currentImage?.filename || 'Untitled' }}</h3>
          </div>

          <div class="flex items-center space-x-2">
            <button
              :disabled="zoomLevel <= 0.5"
              class="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-50 cursor-pointer"
              title="Zoom out"
              @click="zoomOut"
            >
              <n-icon size="20"><ZoomOut /></n-icon>
            </button>
            <span class="text-white text-sm px-2">{{ Math.round(zoomLevel * 100) }}%</span>
            <button
              :disabled="zoomLevel >= 3"
              class="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-50 cursor-pointer"
              title="Zoom in"
              @click="zoomIn"
            >
              <n-icon size="20"><ZoomIn /></n-icon>
            </button>
            <button
              class="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors cursor-pointer"
              title="Reset zoom"
              @click="resetZoom"
            >
              <n-icon size="20"><Maximize /></n-icon>
            </button>
            <button
              class="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors cursor-pointer"
              title="Close"
              @click="$emit('close')"
            >
              <n-icon size="20"><X /></n-icon>
            </button>
          </div>
        </div>
      </div>

      <button
        v-if="currentIndex > 0"
        class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2 bg-black/30 rounded-full hover:bg-black/50 transition-colors cursor-pointer"
        @click="$emit('prev')"
      >
        <n-icon size="32"><ChevronLeft /></n-icon>
      </button>

      <button
        v-if="currentIndex < images.length - 1"
        class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2 bg-black/30 rounded-full hover:bg-black/50 transition-colors cursor-pointer"
        @click="$emit('next')"
      >
        <n-icon size="32"><ChevronRight /></n-icon>
      </button>

      <div
        class="flex-1 flex items-center justify-center p-4 pt-20 pb-24 overflow-hidden"
        @wheel="handleWheel"
        @mousedown="startPan"
        @mousemove="handlePan"
        @mouseup="endPan"
        @mouseleave="endPan"
      >
        <div
          ref="imageContainer"
          class="relative"
          :style="{
            transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
            cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
            transition: isPanning ? 'none' : 'transform 0.2s ease',
          }"
        >
          <img
            v-if="currentImage?.url"
            :src="currentImage.url"
            :alt="currentImage.alt || 'Image'"
            class="max-w-full max-h-full object-contain select-none"
            draggable="false"
            @click.stop
          />
        </div>
      </div>

      <div
        class="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/50 to-transparent p-4"
      >
        <div
          ref="thumbnailContainer"
          class="flex space-x-2 overflow-x-auto scrollbar-hide"
          style="scrollbar-width: none; -ms-overflow-style: none"
        >
          <button
            v-for="(image, index) in images"
            :key="image._id"
            :class="[
              'flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all duration-200 cursor-pointer',
              index === currentIndex
                ? 'border-white scale-110'
                : 'border-transparent opacity-60 hover:opacity-80 hover:scale-105',
            ]"
            @click="goToImage(index)"
          >
            <img
              :src="image.thumbnailUrl || image.url"
              :alt="image.alt || ''"
              class="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { NIcon } from 'naive-ui'
import { ZoomIn, ZoomOut, Maximize, X, ChevronLeft, ChevronRight } from '@vicons/tabler'

const props = defineProps({
  images: { type: Array as () => any[], required: true },
  currentIndex: { type: Number, required: true },
})

const emit = defineEmits(['close', 'prev', 'next', 'go-to'])

const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const lastPanX = ref(0)
const lastPanY = ref(0)

const thumbnailContainer = ref<HTMLElement | null>(null)
const imageContainer = ref<HTMLElement | null>(null)

const currentImage = computed(() => props.images[props.currentIndex])

const handleBackgroundClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

const zoomIn = () => {
  if (zoomLevel.value < 3) {
    zoomLevel.value = Math.min(3, zoomLevel.value + 0.25)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.25)
    if (zoomLevel.value <= 1) {
      panX.value = 0
      panY.value = 0
    }
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

const startPan = (e: MouseEvent) => {
  if (zoomLevel.value > 1) {
    isPanning.value = true
    lastPanX.value = e.clientX
    lastPanY.value = e.clientY
  }
}

const handlePan = (e: MouseEvent) => {
  if (isPanning.value && zoomLevel.value > 1) {
    const deltaX = e.clientX - lastPanX.value
    const deltaY = e.clientY - lastPanY.value
    panX.value += deltaX / zoomLevel.value
    panY.value += deltaY / zoomLevel.value
    lastPanX.value = e.clientX
    lastPanY.value = e.clientY
  }
}

const endPan = () => {
  isPanning.value = false
}

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  if (e.deltaY < 0) zoomIn()
  else zoomOut()
}

const goToImage = (index: number) => {
  emit('go-to', index)
  resetZoom()
  nextTick(() => scrollThumbnailIntoView(index))
}

const scrollThumbnailIntoView = (index: number) => {
  if (!thumbnailContainer.value) return
  const container = thumbnailContainer.value
  const thumbnail = container.children[index] as HTMLElement
  if (thumbnail) {
    const containerRect = container.getBoundingClientRect()
    const thumbnailRect = thumbnail.getBoundingClientRect()
    const scrollLeft = thumbnail.offsetLeft - containerRect.width / 2 + thumbnailRect.width / 2
    container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
  }
}

watch(
  () => props.currentIndex,
  (newIndex) => {
    resetZoom()
    nextTick(() => scrollThumbnailIntoView(newIndex))
  },
)

onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        emit('close')
        break
      case 'ArrowLeft':
        if (props.currentIndex > 0) emit('prev')
        break
      case 'ArrowRight':
        if (props.currentIndex < props.images.length - 1) emit('next')
        break
      case '+':
      case '=':
        zoomIn()
        break
      case '-':
        zoomOut()
        break
      case '0':
        resetZoom()
        break
    }
  }
  document.addEventListener('keydown', handleKeydown)
  nextTick(() => scrollThumbnailIntoView(props.currentIndex))
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
