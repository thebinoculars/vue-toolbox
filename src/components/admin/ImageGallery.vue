<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <h2 class="text-2xl font-bold">{{ totalImages }} images</h2>

      <div class="flex items-center gap-3">
        <n-select
          v-model:value="sortBy"
          :options="sortOptions"
          @update:value="handleSortChange"
          :consistent-menu-width="false"
        />

        <n-button secondary @click="refreshGallery" round class="flex items-center">
          <template #icon
            ><n-icon class="mr-1"><Refresh /></n-icon
          ></template>
          Refresh
        </n-button>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Upload Loading Overlay -->
    <n-spin :show="isUploading || isDeleting">
      <template #description>
        <span v-if="isUploading">Uploading {{ uploadingCount }} images...</span>
        <span v-else-if="isDeleting">Deleting...</span>
      </template>

      <!-- Loading State -->
      <div
        v-if="isLoading && images.length === 0"
        class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 py-8"
      >
        <n-skeleton v-for="n in 12" :key="n" height="150px" width="100%" class="rounded-lg" />
      </div>

      <!-- Masonry Gallery -->
      <div
        v-if="images.length > 0"
        class="flex gap-4 min-h-[200px] w-full"
        :class="{
          'bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-xl p-4': isDragOver,
        }"
        @drop="handleDrop"
        @dragover.prevent="isDragOver = true"
        @dragenter.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
      >
        <div
          v-for="(column, colIndex) in masonryColumns"
          :key="colIndex"
          class="flex-1 flex flex-col gap-4"
        >
          <div
            v-for="image in column"
            :key="image._id"
            class="block w-full relative group cursor-pointer overflow-hidden rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            @click="openSlider(images.findIndex((img) => img._id === image._id))"
          >
            <img :src="image.url" :alt="image.filename" class="w-full h-auto object-cover" />

            <!-- Overlay with actions -->
            <div
              class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2"
            >
              <n-button circle size="small" @click.stop="downloadImage(image)" title="Download">
                <template #icon
                  ><n-icon><Download /></n-icon
                ></template>
              </n-button>
              <n-button circle size="small" @click.stop="showImageInfo(image)" title="Info">
                <template #icon
                  ><n-icon><InfoCircle /></n-icon
                ></template>
              </n-button>
              <n-button
                circle
                size="small"
                type="error"
                @click.stop="deleteImage(image._id)"
                title="Delete"
              >
                <template #icon
                  ><n-icon><Trash /></n-icon
                ></template>
              </n-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More Trigger -->
      <div
        v-if="hasMore && images.length > 0"
        ref="loadMoreTrigger"
        class="flex justify-center py-6"
      >
        <n-button :loading="isLoadingMore" type="primary" ghost @click="loadMore" round>
          Load more
        </n-button>
      </div>

      <!-- Empty State -->
      <div
        v-if="images.length === 0 && !isLoading"
        class="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-inner mt-8 transition-colors border-2 border-transparent"
        :class="{
          '!border-blue-500 !bg-blue-500/10': isDragOver,
          'border-dashed border-gray-300 dark:border-gray-700': !isDragOver,
        }"
        @drop="handleDrop"
        @dragover.prevent="isDragOver = true"
        @dragenter.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
      >
        <div class="text-gray-400 mb-4 text-center mx-auto w-min flex justify-center">
          <n-icon size="64">
            <Upload v-if="isDragOver" />
            <PhotoOff v-else />
          </n-icon>
        </div>
        <n-h3 class="mb-2">{{ isDragOver ? 'Drop images here' : 'No images yet' }}</n-h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ isDragOver ? 'Release to upload' : 'Upload or drag & drop your first images!' }}
        </p>
        <n-button type="primary" size="large" @click="triggerFileInput" round>
          Upload Images
        </n-button>
      </div>
    </n-spin>

    <ImageSlider
      v-if="showSlider"
      :images="images"
      :current-index="currentImageIndex"
      @close="closeSlider"
      @next="nextImage"
      @prev="prevImage"
      @go-to="goToImage"
    />

    <ImageInfoModal
      v-if="selectedImageInfo"
      :image="selectedImageInfo"
      @close="selectedImageInfo = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { NButton, NSelect, NSpin, NSkeleton, NH3, useMessage, useDialog, NIcon } from 'naive-ui'
import { Upload, Refresh, Download, InfoCircle, Trash, PhotoOff } from '@vicons/tabler'
import { useAuthStore } from '@/stores/auth'
import ImageSlider from './ImageSlider.vue'
import ImageInfoModal from './ImageInfoModal.vue'

const props = defineProps({
  albumId: { type: String, required: true },
})

const authStore = useAuthStore()
const message = useMessage()
const dialog = useDialog()

const images = ref<any[]>([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const isUploading = ref(false)
const isDeleting = ref(false)
const uploadingCount = ref(0)
const isDragOver = ref(false)
const sortBy = ref('newest')
const currentPage = ref(1)
const itemsPerPage = 20
const hasMore = ref(true)
const totalImages = ref(0)

const showSlider = ref(false)
const currentImageIndex = ref(0)
const selectedImageInfo = ref<any>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Largest', value: 'largest' },
  { label: 'Smallest', value: 'smallest' },
]

const columnCount = ref(6)

const updateColumns = () => {
  const width = window.innerWidth
  if (width >= 1280) columnCount.value = 6
  else if (width >= 1024) columnCount.value = 5
  else if (width >= 768) columnCount.value = 4
  else if (width >= 640) columnCount.value = 3
  else columnCount.value = 2
}

const masonryColumns = computed(() => {
  const ObjectCols: any[][] = Array.from({ length: columnCount.value }, () => [])
  images.value.forEach((img, idx) => {
    ObjectCols[idx % columnCount.value].push(img)
  })
  return ObjectCols
})

const getApiClient = () => {
  return axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${authStore.token}` },
  })
}

const loadImages = async (reset = false) => {
  if (reset) {
    isLoading.value = true
    currentPage.value = 1
    images.value = []
  } else {
    isLoadingMore.value = true
  }

  try {
    const api = getApiClient()
    const { data } = await api.get(`/albums/${props.albumId}/images`, {
      params: { page: currentPage.value, limit: itemsPerPage, sort: sortBy.value },
    })

    if (reset) {
      images.value = data.data.images || []
    } else {
      images.value.push(...(data.data.images || []))
    }

    totalImages.value = data.data.total || 0
    hasMore.value = data.data.hasMore || false
  } catch (error) {
    message.error('Failed to load images!')
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

const loadMore = async () => {
  if (!hasMore.value || isLoadingMore.value) return
  currentPage.value++
  await loadImages(false)
}

const handleSortChange = () => {
  loadImages(true)
}

const triggerFileInput = () => {
  if (!isUploading.value) fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    uploadFiles(Array.from(input.files))
  }
  input.value = ''
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  if (event.dataTransfer?.files) {
    const files = Array.from(event.dataTransfer.files)
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length > 0) {
      uploadFiles(imageFiles)
    } else {
      message.error('Please only drag and drop image files!')
    }
  }
}

const uploadFiles = async (files: File[]) => {
  if (files.length === 0) return

  const maxSize = 6 * 1024 * 1024
  const validFiles = files.filter((f) => {
    if (f.size > maxSize) {
      message.error(`File ${f.name} is too large (max 6MB)`)
      return false
    }
    return true
  })

  if (validFiles.length === 0) return

  isUploading.value = true
  uploadingCount.value = validFiles.length
  let successCount = 0

  const api = getApiClient()

  // Use sequential processing to not overload the browser/network if there are many files
  try {
    for (const file of validFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('albumId', props.albumId)

        await api.post(`/albums/${props.albumId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        successCount++
      } catch (err: any) {
        message.error(`Failed to upload ${file.name}`)
      }
    }

    if (successCount > 0) {
      message.success(`Successfully uploaded ${successCount} images!`)
      await loadImages(true)
    }
  } finally {
    isUploading.value = false
    uploadingCount.value = 0
  }
}

const deleteImage = (imageId: string) => {
  dialog.warning({
    title: 'Delete Image',
    content: 'Are you sure you want to delete this image?',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      isDeleting.value = true
      try {
        const api = getApiClient()
        await api.delete(`/albums/${props.albumId}/images/${imageId}`)
        images.value = images.value.filter((img) => img._id !== imageId)
        totalImages.value--
        message.success('Image deleted!')
      } catch (error) {
        message.error('Failed to delete image!')
        return false
      } finally {
        isDeleting.value = false
      }
    },
  })
}

const downloadImage = async (image: any) => {
  try {
    const response = await fetch(image.url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = image.filename || 'image'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    message.success('Downloading...')
  } catch (error) {
    message.error('Failed to download!')
  }
}

const showImageInfo = (image: any) => {
  selectedImageInfo.value = image
}

const openSlider = (index: number) => {
  currentImageIndex.value = index
  showSlider.value = true
}

const closeSlider = () => {
  showSlider.value = false
}

const nextImage = () => {
  if (currentImageIndex.value < images.value.length - 1) currentImageIndex.value++
}

const prevImage = () => {
  if (currentImageIndex.value > 0) currentImageIndex.value--
}

const goToImage = (index: number) => {
  currentImageIndex.value = index
}

const refreshGallery = () => {
  loadImages(true)
}

onMounted(() => {
  updateColumns()
  window.addEventListener('resize', updateColumns)

  loadImages(true)

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !isLoadingMore.value) {
        loadMore()
      }
    },
    { rootMargin: '200px' },
  )

  // Delay observing to ensure the ref is mounted
  setTimeout(() => {
    if (loadMoreTrigger.value) observer?.observe(loadMoreTrigger.value)
  }, 1000)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateColumns)
  if (observer) observer.disconnect()
})

defineExpose({
  triggerFileInput,
})
</script>
