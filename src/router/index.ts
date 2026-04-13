import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import Login from '@/pages/Login.vue'
import Register from '@/pages/Register.vue'
import Base64EncodeDecode from '@/pages/tools/Base64EncodeDecode.vue'
import UrlParser from '@/pages/tools/UrlParser.vue'
import MarkdownEditor from '@/pages/tools/MarkdownEditor.vue'
import WeatherForecast from '@/pages/tools/WeatherForecast.vue'
import TextArtGenerator from '@/pages/tools/TextArtGenerator.vue'
import WindowsSpotlight from '@/pages/tools/WindowsSpotlight.vue'
import OnePieceMusic from '@/pages/tools/OnePieceMusic.vue'
import NesEmulator from '@/pages/tools/NesEmulator.vue'

const routes = [
  { path: '/', component: Home, meta: { title: 'ToolBox', icon: 'Tool' } },
  {
    path: '/login',
    component: Login,
    meta: { title: 'Login' },
  },
  {
    path: '/register',
    component: Register,
    meta: { title: 'Register' },
  },
  {
    path: '/tools/base64-encode-decode',
    component: Base64EncodeDecode,
    meta: { title: 'Base64 Encode/Decode', icon: 'Code' },
  },
  {
    path: '/tools/url-parser',
    component: UrlParser,
    meta: { title: 'URL Parser', icon: 'Link' },
  },
  {
    path: '/tools/markdown-editor',
    component: MarkdownEditor,
    meta: { title: 'Markdown Editor', icon: 'FileText' },
  },
  {
    path: '/tools/weather-forecast',
    component: WeatherForecast,
    meta: { title: 'Weather Forecast', icon: 'Cloud' },
  },
  {
    path: '/tools/text-art-generator',
    component: TextArtGenerator,
    meta: { title: 'Text Art Generator', icon: 'Palette' },
  },
  {
    path: '/tools/windows-spotlight',
    component: WindowsSpotlight,
    meta: { title: 'Spotlight', icon: 'Photo' },
  },
  {
    path: '/tools/one-piece-music',
    component: OnePieceMusic,
    meta: { title: 'One Piece Music', icon: 'Music' },
  },
  {
    path: '/tools/nes-emulator',
    component: NesEmulator,
    meta: { title: 'NES Emulator', icon: 'DeviceGamepad' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const browser = (globalThis as any).window
router.afterEach((to) => {
  if (browser) {
    browser.document.title = (to.meta.title as string) || 'ToolBox'
  }
})

export default router
