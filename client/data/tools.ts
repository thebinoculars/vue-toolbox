import {
  Cloud,
  Code,
  DeviceGamepad,
  FileText,
  Language,
  Link,
  Music,
  Palette,
  Photo,
} from '@vicons/tabler'

import type { Tool } from '~/shared/types'

export const tools: Tool[] = [
  {
    path: '/tools/base64-encode-decode',
    title: 'Base64 Encode/Decode',
    category: 'Development',
    icon: Code,
    desc: 'Encode and decode Base64 strings',
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
].sort((a, b) => {
  if (a.category !== b.category) {
    return a.category.localeCompare(b.category)
  }
  return a.title.localeCompare(b.title)
})

export const categories = [...new Set(tools.map((t) => t.category))]
