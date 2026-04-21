<template>
  <div>
    <div v-if="isLoading" class="flex justify-center py-20">
      <n-spin size="large" />
    </div>

    <n-spin v-else-if="album" :show="isDeleting">
      <template #description>Deleting album...</template>
      <div class="space-y-6">
        <div class="flex items-center gap-4 mb-4">
          <n-button circle @click="router.back()" class="flex-shrink-0">
            <template #icon
              ><n-icon><ArrowLeft /></n-icon
            ></template>
          </n-button>
          <div class="flex-1">
            <div class="flex items-center">
              <n-h1 class="!mb-0 !mt-0">{{ album.name }}</n-h1>
              <n-tag v-if="album.isPrivate" type="warning" size="small" class="ml-3">Private</n-tag>
            </div>
            <p v-if="album.description" class="text-gray-500 mt-1">{{ album.description }}</p>
          </div>

          <div class="flex items-center gap-4 flex-shrink-0">
            <n-button type="primary" @click="handleUploadClick">
              <template #icon
                ><n-icon><Upload /></n-icon
              ></template>
              Upload
            </n-button>
            <n-button secondary @click="showEditModal = true">
              <template #icon
                ><n-icon><Edit /></n-icon
              ></template>
              Edit
            </n-button>
            <n-button secondary type="error" @click="deleteAlbum">
              <template #icon
                ><n-icon><Trash /></n-icon
              ></template>
              Delete
            </n-button>
          </div>
        </div>

        <!-- Gallery Component -->
        <ImageGallery ref="galleryRef" :album-id="album._id" />
      </div>
    </n-spin>

    <!-- Not Found -->
    <div v-else class="text-center py-12">
      <div class="mb-4 text-gray-400 flex justify-center">
        <n-icon size="64"><AlertTriangle /></n-icon>
      </div>
      <n-h3>Album not found</n-h3>
      <p class="text-gray-500 mb-6">This album might have been deleted or you don't have access.</p>
      <n-button type="primary" @click="router.push('/admin/albums')">Back to Albums</n-button>
    </div>

    <!-- Edit Modal -->
    <n-modal v-model:show="showEditModal" preset="card" title="Edit Album" class="max-w-md">
      <n-form ref="editFormRef" :model="editForm" :rules="rules" @submit.prevent="updateAlbum">
        <n-form-item label="Album Name" path="name">
          <n-input v-model:value="editForm.name" />
        </n-form-item>
        <n-form-item label="Description" path="description">
          <n-input v-model:value="editForm.description" type="textarea" />
        </n-form-item>
        <n-form-item label="Privacy">
          <n-switch v-model:value="editForm.isPrivate" />
        </n-form-item>
        <n-button type="primary" block :loading="isUpdating" attr-type="submit"> Update </n-button>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import {
  NH1,
  NH3,
  NButton,
  NTag,
  NSpin,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSwitch,
  useMessage,
  useDialog,
  NIcon,
  type FormInst,
} from 'naive-ui'
import { ArrowLeft, Edit, Trash, AlertTriangle, Upload } from '@vicons/tabler'
import { useAuthStore } from '@/stores/auth'
import ImageGallery from '@/components/admin/ImageGallery.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const authStore = useAuthStore()

const editFormRef = ref<FormInst | null>(null)
const galleryRef = ref<any>(null)

const album = ref<any>(null)
const isLoading = ref(true)
const showEditModal = ref(false)
const isUpdating = ref(false)
const isDeleting = ref(false)

const editForm = reactive({ name: '', description: '', isPrivate: false })

const rules = {
  name: {
    required: true,
    message: 'Please input the album name',
    trigger: ['input', 'blur'],
  },
}

const getApiClient = () => {
  return axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${authStore.token}` },
  })
}

const loadAlbum = async () => {
  try {
    const api = getApiClient()
    const { data } = await api.get(`/albums/${route.params.id}`)
    album.value = data.data
    editForm.name = album.value.name
    editForm.description = album.value.description || ''
    editForm.isPrivate = !!album.value.isPrivate
  } catch (error: any) {
    if (error.response?.status === 404) {
      message.error('Album not found!')
    } else {
      message.error('Failed to load album!')
    }
  } finally {
    isLoading.value = false
  }
}

const updateAlbum = async () => {
  editFormRef.value?.validate(async (errors) => {
    if (errors) return

    isUpdating.value = true
    try {
      const api = getApiClient()
      const { data } = await api.put(`/albums/${route.params.id}`, editForm)
      album.value = data.data
      showEditModal.value = false
      message.success('Album updated!')
    } catch (error) {
      message.error('Failed to update album!')
    } finally {
      isUpdating.value = false
    }
  })
}

const deleteAlbum = () => {
  dialog.warning({
    title: 'Delete Album',
    content: 'Are you sure you want to delete this album? All photos inside will be deleted!',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      isDeleting.value = true
      const api = getApiClient()
      return api
        .delete(`/albums/${route.params.id}`)
        .then(() => {
          message.success('Album deleted!')
          router.push('/admin/albums')
        })
        .catch(() => {
          message.error('Failed to delete album')
          isDeleting.value = false
          return false
        })
    },
  })
}

const handleUploadClick = () => {
  if (galleryRef.value) {
    galleryRef.value.triggerFileInput()
  }
}

onMounted(() => {
  loadAlbum()
})
</script>
