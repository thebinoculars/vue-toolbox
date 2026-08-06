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
        <span class="font-medium max-w-50 truncate" :title="image.filename || 'N/A'">
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
        <span class="font-medium">{{ formatDate(image.created_at) }}</span>
      </div>

      <n-divider class="my-4" />

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
import { Download, Link } from '@vicons/tabler'

import { copyToClipboard } from '@/utils/clipboard'
import { downloadFile } from '@/utils/download'
import { formatDate, formatFileSize, truncateText } from '@/utils/format'

const props = defineProps({
  image: { type: Object, required: true },
})
defineEmits(['close'])

const message = useMessage()

// Functions
const downloadImage = async () => {
  try {
    message.success('Downloading...')
    await downloadFile(props.image.url, props.image.filename)
  } catch {
    message.error('Failed to download!')
  }
}

const copyUrl = async () => {
  try {
    await copyToClipboard(props.image.url)
    message.success('URL copied!')
  } catch {
    message.error('Failed to copy URL!')
  }
}
</script>
