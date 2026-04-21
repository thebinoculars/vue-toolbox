<template>
  <n-modal
    :show="true"
    preset="card"
    title="Image Information"
    class="max-w-md"
    @update:show="(val) => !val && $emit('close')"
  >
    <div class="space-y-4">
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500">File name:</span>
        <span class="font-medium max-w-[200px] truncate" :title="image.filename || 'N/A'">
          {{ truncateText(image.filename || 'N/A', 20) }}
        </span>
      </div>

      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500">File size:</span>
        <span class="font-medium">{{ formatFileSize(image.size) }}</span>
      </div>

      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500">Format:</span>
        <span class="font-medium">{{ image.format?.toUpperCase() || 'N/A' }}</span>
      </div>

      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500">Dimensions:</span>
        <span class="font-medium">{{ image.width || 0 }} × {{ image.height || 0 }}</span>
      </div>

      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500">Uploaded at:</span>
        <span class="font-medium">{{ formatDate(image.createdAt) }}</span>
      </div>

      <n-divider class="!my-4" />

      <div class="flex space-x-3">
        <n-button type="primary" block class="flex-1 flex items-center" @click="downloadImage">
          <template #icon
            ><n-icon class="mr-1"><Download /></n-icon
          ></template>
          Download
        </n-button>
        <n-button block class="flex-1 flex items-center" @click="copyUrl">
          <template #icon
            ><n-icon class="mr-1"><Link /></n-icon
          ></template>
          Copy URL
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { useMessage, NModal, NDivider, NButton, NIcon } from 'naive-ui'
import { Download, Link } from '@vicons/tabler'

const props = defineProps({
  image: { type: Object, required: true },
})
defineEmits(['close'])

const message = useMessage()

const truncateText = (text: string, maxLength: number) => {
  if (!text) return 'N/A'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return 'N/A'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const downloadImage = async () => {
  try {
    const response = await fetch(props.image.url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = props.image.filename || 'image'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    message.success('Download started')
  } catch (error) {
    message.error('Failed to download!')
  }
}

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(props.image.url)
    message.success('URL copied!')
  } catch (error) {
    message.error('Failed to copy URL!')
  }
}
</script>
