import {
  Cloud,
  Code,
  DeviceGamepad,
  FileText,
  GridDots,
  Language,
  Link,
  Music,
  Palette,
  Photo,
} from '@vicons/tabler'
import { defineStore } from 'pinia'

export const useToolStore = defineStore('tools', () => {
  const tools = [
    {
      path: '/tools/base64-encode-decode',
      title: 'Base64 Encode/Decode',
      category: 'Development',
      icon: Code,
      desc: 'Encode and decode Base64 strings',
    },
    {
      path: '/tools/caro-game',
      title: 'Caro Game',
      category: 'Entertainment',
      icon: GridDots,
      desc: 'Play Caro (tic-tac-toe) online with friends',
    },
    {
      path: '/tools/markdown-editor',
      title: 'Markdown Editor',
      category: 'Editors',
      icon: FileText,
      desc: 'Write and preview Markdown with live rendering',
    },
    {
      path: '/tools/nes-emulator',
      title: 'NES Emulator',
      category: 'Entertainment',
      icon: DeviceGamepad,
      desc: 'Play NES ROMs served from Netlify Blobs',
    },
    {
      path: '/tools/one-piece-music',
      title: 'One Piece Music',
      category: 'Media',
      icon: Music,
      desc: 'Listen to One Piece soundtracks by episode',
    },
    {
      path: '/tools/text-art-generator',
      title: 'Text Art Generator',
      category: 'Media',
      icon: Palette,
      desc: 'Convert images into stunning text-based art',
    },
    {
      path: '/tools/translator',
      title: 'Translator',
      category: 'Utilities',
      icon: Language,
      desc: 'Translate text between multiple languages using Google Translate',
    },
    {
      path: '/tools/url-parser',
      title: 'URL Parser',
      category: 'Development',
      icon: Link,
      desc: 'Parse and inspect URL components and query parameters',
    },
    {
      path: '/tools/weather-forecast',
      title: 'Weather Forecast',
      category: 'Utilities',
      icon: Cloud,
      desc: 'Check current weather and forecast for any city',
    },
    {
      path: '/tools/windows-spotlight',
      title: 'Windows Spotlight',
      category: 'Media',
      icon: Photo,
      desc: 'View beautiful images from Windows Spotlight with autoplay',
    },
  ].sort((a, b) =>
    a.category !== b.category
      ? a.category.localeCompare(b.category)
      : a.title.localeCompare(b.title),
  )

  const categories = [...new Set(tools.map((t) => t.category))]
  const search = ref('')

  const searchedTools = computed(() =>
    tools.filter((t) => t.title.toLowerCase().includes(search.value.toLowerCase())),
  )

  const searchedCategories = computed(() =>
    categories.filter((c) => searchedTools.value.some((t) => t.category === c)),
  )

  const getToolsByCategory = (category: string) => {
    return tools.filter((t) => t.category === category)
  }

  const getSearchedToolsByCategory = (category: string) => {
    return searchedTools.value.filter((t) => t.category === category)
  }

  return {
    tools,
    categories,
    search,
    searchedTools,
    searchedCategories,
    getToolsByCategory,
    getSearchedToolsByCategory,
  }
})
