<template>
  <div class="max-w-md mx-auto py-10 px-4">
    <n-h1 class="!mb-6">Profile</n-h1>

    <n-card title="Change Password" :bordered="false" class="shadow-sm">
      <n-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleSubmit">
        <n-form-item label="Current Password" path="currentPassword">
          <n-input
            v-model:value="form.currentPassword"
            type="password"
            show-password-on="click"
            placeholder="Enter current password"
          />
        </n-form-item>
        <n-form-item label="New Password" path="newPassword">
          <n-input
            v-model:value="form.newPassword"
            type="password"
            show-password-on="click"
            placeholder="At least 6 characters"
          />
        </n-form-item>
        <n-form-item label="Confirm New Password" path="confirmPassword">
          <n-input
            v-model:value="form.confirmPassword"
            type="password"
            show-password-on="click"
            placeholder="Repeat new password"
          />
        </n-form-item>
        <n-button type="primary" block :loading="isLoading" attr-type="submit">
          Update Password
        </n-button>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { type FormInst, type FormRules } from 'naive-ui'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const isLoading = ref(false)

const form = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })

const rules: FormRules = {
  currentPassword: {
    required: true,
    message: 'Please enter current password',
    trigger: ['input', 'blur'],
  },
  newPassword: [
    { required: true, message: 'Please enter new password', trigger: ['input', 'blur'] },
    { min: 6, message: 'At least 6 characters', trigger: ['input', 'blur'] },
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm new password', trigger: ['input', 'blur'] },
    {
      validator: (_rule, value) => value === form.newPassword,
      message: 'Passwords do not match',
      trigger: ['input', 'blur'],
    },
  ],
}

const handleSubmit = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) {
      return
    }

    isLoading.value = true
    try {
      await axios.post(
        '/api/me',
        { currentPassword: form.currentPassword, newPassword: form.newPassword },
        {
          headers: { Authorization: `Bearer ${authStore.token}` },
        },
      )
      message.success('Password updated!')
      form.currentPassword = ''
      form.newPassword = ''
      form.confirmPassword = ''
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update password')
    } finally {
      isLoading.value = false
    }
  })
}
</script>
