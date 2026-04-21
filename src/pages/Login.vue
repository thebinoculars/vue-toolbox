<template>
  <div class="w-full max-w-md px-4">
    <n-card :bordered="false" class="shadow-xl rounded-2xl">
      <div class="text-center mb-8">
        <n-icon size="48" color="#6366f1" class="mb-3"><Lock /></n-icon>
        <n-h2 class="!mb-1 !mt-2">Welcome Back</n-h2>
        <n-p :depth="3" class="!mt-0">Sign in to access your tools</n-p>
      </div>

      <n-form @submit.prevent="handleLogin">
        <n-form-item label="Email">
          <n-input v-model:value="email" type="text" placeholder="Enter your email" size="large" />
        </n-form-item>
        <n-form-item label="Password">
          <n-input
            v-model:value="password"
            type="password"
            placeholder="Enter your password"
            size="large"
            show-password-on="click"
          />
        </n-form-item>

        <n-alert v-if="error" type="error" class="mb-4" :bordered="false">{{ error }}</n-alert>

        <n-button type="primary" block size="large" :loading="isLoading" attr-type="submit" round>
          Sign In
        </n-button>
      </n-form>

      <n-divider class="!my-5" />
      <div class="text-center space-y-2">
        <div>
          <n-text :depth="3" class="text-sm">Don't have an account? </n-text>
          <router-link to="/register">
            <n-button text type="primary" size="small">Create one</n-button>
          </router-link>
        </div>
        <div>
          <router-link to="/">
            <n-button text size="small" :style="'color:#888'">← Back to Home</n-button>
          </router-link>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NH2,
  NP,
  NIcon,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NAlert,
  NDivider,
  NText,
} from 'naive-ui'
import { Lock } from '@vicons/tabler'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  error.value = ''
  isLoading.value = true
  try {
    const { data, error: loginError } = await authStore.login(email.value, password.value)
    if (loginError) error.value = loginError.message
    else if (data?.success) router.push('/admin')
    else error.value = data?.message || 'Login failed'
  } catch {
    error.value = 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}
</script>
