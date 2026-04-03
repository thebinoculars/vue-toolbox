<template>
  <div class="w-full max-w-md px-4">
    <n-card :bordered="false" class="shadow-xl rounded-2xl">
          <div class="text-center mb-8">
            <n-icon size="48" color="#6366f1" class="mb-3"><PersonAddOutline /></n-icon>
            <n-h2 class="!mb-1 !mt-2">Create Account</n-h2>
            <n-p :depth="3" class="!mt-0">Join us and start using powerful tools</n-p>
          </div>

          <n-form @submit.prevent="handleRegister">
            <n-form-item label="Email">
              <n-input v-model:value="email" type="text" placeholder="Enter your email" size="large" />
            </n-form-item>
            <n-form-item label="Password">
              <n-input v-model:value="password" type="password" placeholder="Min 6 characters" size="large" show-password-on="click" />
            </n-form-item>
            <n-form-item label="Confirm Password">
              <n-input v-model:value="confirmPassword" type="password" placeholder="Confirm your password" size="large" show-password-on="click" />
            </n-form-item>

            <n-alert v-if="error" type="error" class="mb-4" :bordered="false">{{ error }}</n-alert>
            <n-alert v-if="success" type="success" class="mb-4" :bordered="false">{{ success }}</n-alert>

            <n-button type="primary" block size="large" :loading="isLoading" attr-type="submit" round>
              Create Account
            </n-button>
          </n-form>

          <n-divider class="!my-5" />
          <div class="text-center space-y-2">
            <div>
              <n-text :depth="3" class="text-sm">Already have an account? </n-text>
              <router-link to="/login">
                <n-button text type="primary" size="small">Sign in</n-button>
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
import { NCard, NH2, NP, NIcon, NForm, NFormItem, NInput, NButton, NAlert, NDivider, NText } from 'naive-ui'
import { PersonAddOutline } from '@vicons/ionicons5'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { register } = useAuth()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const isLoading = ref(false)

const handleRegister = async () => {
  error.value = ''
  success.value = ''
  if (password.value !== confirmPassword.value) { error.value = 'Passwords do not match'; return }
  if (password.value.length < 6) { error.value = 'Password must be at least 6 characters'; return }

  isLoading.value = true
  try {
    const { data, error: registerError } = await register(email.value, password.value)
    if (registerError) error.value = registerError.message
    else if (data?.success) {
      success.value = 'Account created successfully! Redirecting...'
      setTimeout(() => router.push('/login'), 1500)
    } else {
      error.value = data?.message || 'Register failed'
    }
  } catch {
    error.value = 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}
</script>
