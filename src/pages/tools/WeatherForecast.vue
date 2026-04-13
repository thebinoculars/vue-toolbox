<template>
  <div class="flex flex-col h-full">
    <!-- Input bar -->
    <div
      :style="
        isDark
          ? 'background:#2a2a2e;border-color:#3a3a3f'
          : 'background:#f9f9f9;border-color:#e5e5e5'
      "
      class="border-b px-3 py-2 flex items-center gap-2 shrink-0"
    >
      <span class="text-xs font-medium" :style="isDark ? 'color:#888' : 'color:#888'">City</span>
      <n-input
        v-model:value="city"
        placeholder="Enter city name..."
        size="small"
        clearable
        class="flex-1"
        @keyup.enter="fetchWeather"
      />
      <n-button size="tiny" :loading="loading" @click="fetchWeather">
        <template #icon
          ><n-icon><Search /></n-icon
        ></template>
        Search
      </n-button>
      <n-button size="tiny" @click="detectLocation">
        <template #icon
          ><n-icon><MapPin /></n-icon
        ></template>
        Current Location
      </n-button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <n-alert
        v-if="error"
        type="error"
        :bordered="false"
        closable
        class="mb-4"
        @close="error = ''"
      >
        {{ error }}
      </n-alert>

      <template v-if="currentWeather">
        <!-- Current Weather -->
        <div class="mb-6">
          <div class="text-center mb-4">
            <h2 class="text-2xl font-bold mb-2">{{ city }}</h2>
            <div class="flex items-center justify-center gap-4">
              <img
                v-if="currentWeather.weather && currentWeather.weather[0]"
                :src="`https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@4x.png`"
                :alt="currentWeather.weather[0].description"
                class="w-20 h-20"
              />
              <div>
                <div class="text-4xl font-bold">{{ Math.round(currentWeather.main.temp) }}°C</div>
                <div class="text-lg capitalize">
                  {{
                    currentWeather.weather && currentWeather.weather[0]
                      ? currentWeather.weather[0].description
                      : 'Weather data unavailable'
                  }}
                </div>
              </div>
            </div>
          </div>

          <!-- Weather Details -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div
              class="text-center p-3 rounded-lg"
              :style="isDark ? 'background:#2a2a2e' : 'background:#f3f4f6'"
            >
              <div class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Feels Like
              </div>
              <div class="text-lg font-semibold">
                {{ Math.round(currentWeather.main.feels_like) }}°C
              </div>
            </div>
            <div
              class="text-center p-3 rounded-lg"
              :style="isDark ? 'background:#2a2a2e' : 'background:#f3f4f6'"
            >
              <div class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Humidity
              </div>
              <div class="text-lg font-semibold">{{ currentWeather.main.humidity }}%</div>
            </div>
            <div
              class="text-center p-3 rounded-lg"
              :style="isDark ? 'background:#2a2a2e' : 'background:#f3f4f6'"
            >
              <div class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Wind Speed
              </div>
              <div class="text-lg font-semibold">{{ currentWeather.wind.speed }} m/s</div>
            </div>
            <div
              class="text-center p-3 rounded-lg"
              :style="isDark ? 'background:#2a2a2e' : 'background:#f3f4f6'"
            >
              <div class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Pressure
              </div>
              <div class="text-lg font-semibold">{{ currentWeather.main.pressure }} hPa</div>
            </div>
          </div>
        </div>

        <!-- Forecast -->
        <div v-if="forecast.length > 0" class="mt-6">
          <h3 class="text-lg font-semibold mb-4">Forecast</h3>
          <div class="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2 auto-rows-max">
            <div
              v-for="item in forecast"
              :key="item.dt"
              class="text-center p-2 rounded-lg text-xs"
              :style="isDark ? 'background:#2a2a2e' : 'background:#f3f4f6'"
            >
              <div class="font-medium mb-1">{{ formatTime(item.dt) }}</div>
              <img
                v-if="item.weather?.[0]"
                :src="`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`"
                :alt="item.weather[0].description"
                class="w-6 h-6 mx-auto mb-1"
              />
              <div class="font-semibold">{{ Math.round(item.main.temp) }}°</div>
              <div class="text-gray-500">{{ item.main.humidity }}%</div>
            </div>
          </div>
        </div>
      </template>

      <n-empty
        v-else-if="!error && !loading"
        description="Enter a city name or use current location to get weather information"
        size="small"
        class="mt-16"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NInput, NButton, NIcon, NAlert, NEmpty } from 'naive-ui'
import { Search, MapPin } from '@vicons/tabler'
import { useDarkModeStore } from '@/stores/darkMode'
import axios from 'axios'
import type { WeatherInfo, ForecastItem } from '~/shared/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const navigatorObj = (globalThis as any).navigator

const { isDark } = useDarkModeStore()

const city = ref('Hanoi')
const loading = ref(false)
const error = ref('')
const currentWeather = ref<WeatherInfo | null>(null)
const forecast = ref<ForecastItem[]>([])

const fetchWeather = async () => {
  if (!city.value.trim()) {
    error.value = 'Please enter a city name'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const currentResponse = await axios.get(
      `/api/proxy/weather?q=${encodeURIComponent(city.value)}&path=/data/2.5/weather`,
    )

    const currentData = currentResponse.data

    const forecastResponse = await axios.get(
      `/api/proxy/weather?q=${encodeURIComponent(city.value)}&path=/data/2.5/forecast`,
    )

    const forecastData = forecastResponse.data

    if (!currentData || !forecastData || typeof forecastData !== 'object') {
      throw new Error('Invalid data received')
    }

    currentWeather.value = currentData as WeatherInfo
    forecast.value = (forecastData as any).list || []
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch weather data'
    currentWeather.value = null
    forecast.value = []
  } finally {
    loading.value = false
  }
}

const detectLocation = async () => {
  if (!navigatorObj.geolocation) {
    error.value = 'Geolocation is not supported by this browser'
    return
  }

  loading.value = true
  error.value = ''

  navigatorObj.geolocation.getCurrentPosition(
    async (position: any) => {
      try {
        const { latitude, longitude } = position.coords

        // Get city name from coordinates using reverse geocoding
        const locationResponse = await axios.get(
          `/api/proxy/weather?lat=${latitude}&lon=${longitude}&limit=1&path=/geo/1.0/reverse`,
        )

        const locationData = locationResponse.data

        if (!Array.isArray(locationData) || locationData.length === 0) {
          throw new Error('Could not determine location')
        }

        city.value = (locationData[0] as any).name
        await fetchWeather()
      } catch (err: any) {
        error.value = err.message || 'Failed to get location'
      } finally {
        loading.value = false
      }
    },
    () => {
      error.value = 'Location access denied'
      loading.value = false
    },
  )
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// Load default city weather on mount
onMounted(() => {
  fetchWeather()
})
</script>
