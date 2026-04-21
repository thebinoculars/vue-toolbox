<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <n-h1 class="!mb-0">Albums</n-h1>
      <n-button type="primary" size="large" @click="showCreateModal = true" round>
        <template #icon
          ><n-icon><Plus /></n-icon
        ></template>
        Create New Album
      </n-button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full mb-4">
      <div class="sm:col-span-3">
        <n-input
          v-model:value="searchQuery"
          placeholder="Search albums..."
          class="w-full"
          @input="handleSearch"
          clearable
          size="large"
        >
          <template #prefix>
            <n-icon><Search /></n-icon>
          </template>
        </n-input>
      </div>
      <div class="sm:col-span-1">
        <n-select
          v-model:value="sortBy"
          :options="sortOptions"
          @update:value="handleSortChange"
          class="w-full"
          size="large"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="grid md:grid-cols-3 xl:grid-cols-4 gap-6">
      <n-card v-for="n in 8" :key="n" class="shadow-md" :bordered="false">
        <template #cover>
          <n-skeleton height="192px" width="100%" />
        </template>
        <n-skeleton text :repeat="2" />
      </n-card>
    </div>

    <!-- Albums Grid -->
    <div v-else-if="albums.length > 0" class="grid md:grid-cols-3 xl:grid-cols-4 gap-6">
      <n-card
        v-for="album in albums"
        :key="album._id"
        class="shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-2xl overflow-hidden"
        :bordered="false"
        hoverable
      >
        <template #cover>
          <div
            class="h-48 bg-gray-200 dark:bg-gray-800 relative overflow-hidden"
            @click="goToAlbum(album._id)"
          >
            <img
              v-if="album.coverImage"
              :src="album.coverImage"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-800"
            >
              <n-icon size="48"><Photo /></n-icon>
            </div>

            <div
              class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2"
              @click.stop
            >
              <n-button circle size="small" @click.stop="editAlbum(album)">
                <template #icon
                  ><n-icon><Edit /></n-icon
                ></template>
              </n-button>
              <n-button circle size="small" type="error" @click.stop="deleteAlbum(album._id)">
                <template #icon
                  ><n-icon><Trash /></n-icon
                ></template>
              </n-button>
            </div>

            <div
              v-if="album.isPrivate"
              class="absolute top-3 left-3 bg-gray-900 bg-opacity-70 text-white rounded-md px-2 py-1 text-xs flex items-center space-x-1"
            >
              <n-icon><Lock /></n-icon>
              <span>Private</span>
            </div>
          </div>
        </template>

        <div @click="goToAlbum(album._id)">
          <n-h3 class="!mt-0 !mb-1 group-hover:text-blue-500 transition-colors">{{
            album.name
          }}</n-h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ album.imageCount || 0 }} images • {{ formatDate(album.createdAt) }}
          </p>
        </div>
      </n-card>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 mt-8"
    >
      <div class="text-gray-400 mb-4 flex justify-center">
        <n-icon size="64"><PhotoOff /></n-icon>
      </div>
      <n-h3 class="mb-2">{{ searchQuery ? 'No albums found' : 'No albums yet' }}</n-h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        {{
          searchQuery
            ? 'Try testing different keywords.'
            : 'Create your first album to get started!'
        }}
      </p>
      <n-button
        v-if="!searchQuery"
        type="primary"
        size="large"
        @click="showCreateModal = true"
        round
      >
        Create Your First Album
      </n-button>
    </div>

    <!-- Modals -->
    <n-modal v-model:show="showCreateModal" preset="card" title="Create New Album" class="max-w-md">
      <n-form ref="createFormRef" :model="createForm" :rules="rules" @submit.prevent="createAlbum">
        <n-form-item label="Album Name" path="name">
          <n-input v-model:value="createForm.name" placeholder="Enter album name..." />
        </n-form-item>
        <n-form-item label="Description" path="description">
          <n-input
            v-model:value="createForm.description"
            type="textarea"
            placeholder="Short description..."
          />
        </n-form-item>
        <n-form-item label="Privacy">
          <n-switch v-model:value="createForm.isPrivate">
            <template #checked>Private</template>
            <template #unchecked>Public</template>
          </n-switch>
        </n-form-item>
        <n-button type="primary" block :loading="isCreating" attr-type="submit">
          Create Album
        </n-button>
      </n-form>
    </n-modal>

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
import { useRouter } from 'vue-router'
import axios from 'axios'
import {
  NH1,
  NH3,
  NButton,
  NInput,
  NSelect,
  NCard,
  NSkeleton,
  NModal,
  NForm,
  NFormItem,
  NSwitch,
  useMessage,
  useDialog,
  NIcon,
  type FormInst,
} from 'naive-ui'
import { Plus, Search, Edit, Trash, Lock, Photo, PhotoOff } from '@vicons/tabler'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const authStore = useAuthStore()

const createFormRef = ref<FormInst | null>(null)
const editFormRef = ref<FormInst | null>(null)

const albums = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const sortBy = ref('newest')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const isCreating = ref(false)
const isUpdating = ref(false)
const currentAlbum = ref<any>(null)

let searchTimeout: any = null

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Name A-Z', value: 'name' },
  { label: 'Most Images', value: 'images' },
]

const createForm = reactive({ name: '', description: '', isPrivate: false })
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

const loadAlbums = async () => {
  isLoading.value = true
  try {
    const api = getApiClient()
    const { data } = await api.get('/albums', {
      params: { search: searchQuery.value, sort: sortBy.value },
    })
    albums.value = data?.data || []
  } catch (error) {
    message.error('Failed to load albums')
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(loadAlbums, 500)
}

const handleSortChange = () => {
  loadAlbums()
}

const goToAlbum = (id: string) => {
  router.push(`/admin/albums/${id}`)
}

const createAlbum = async () => {
  createFormRef.value?.validate(async (errors) => {
    if (errors) return

    isCreating.value = true
    try {
      const api = getApiClient()
      const { data } = await api.post('/albums', createForm)
      showCreateModal.value = false
      message.success('Album created!')
      router.push(`/admin/albums/${data.data._id}`)
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create album')
    } finally {
      isCreating.value = false
      createForm.name = ''
      createForm.description = ''
    }
  })
}

const editAlbum = (album: any) => {
  currentAlbum.value = album
  editForm.name = album.name
  editForm.description = album.description || ''
  editForm.isPrivate = !!album.isPrivate
  showEditModal.value = true
}

const updateAlbum = async () => {
  editFormRef.value?.validate(async (errors) => {
    if (errors) return

    isUpdating.value = true
    try {
      const api = getApiClient()
      const { data } = await api.put(`/albums/${currentAlbum.value._id}`, editForm)
      const index = albums.value.findIndex((a) => a._id === currentAlbum.value._id)
      if (index !== -1) {
        albums.value[index] = { ...albums.value[index], ...data.data }
      }
      showEditModal.value = false
      message.success('Album updated!')
    } catch (error) {
      message.error('Failed to update album')
    } finally {
      isUpdating.value = false
    }
  })
}

const deleteAlbum = (albumId: string) => {
  dialog.warning({
    title: 'Delete Album',
    content: 'Are you sure you want to delete this album? All photos inside will be deleted!',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      const api = getApiClient()
      return api
        .delete(`/albums/${albumId}`)
        .then(() => {
          albums.value = albums.value.filter((a) => a._id !== albumId)
          message.success('Album deleted!')
        })
        .catch(() => {
          message.error('Failed to delete album')
          return false
        })
    },
  })
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

onMounted(() => {
  loadAlbums()
})
</script>
