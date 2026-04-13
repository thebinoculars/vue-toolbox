import type { Tool } from './types'

import { Code, Link, FileText, Cloud, Palette, Photo, Music, DeviceGamepad } from '@vicons/tabler'

export const tools: Tool[] = [
  {
    path: '/tools/base64-encode-decode',
    title: 'Base64 Encode/Decode',
    category: 'Encoders / Decoders',
    icon: Code,
    desc: 'Encode and decode Base64 strings',
  },
  {
    path: '/tools/url-parser',
    title: 'URL Parser',
    category: 'Utilities',
    icon: Link,
    desc: 'Parse and inspect URL components and query parameters',
  },
  {
    path: '/tools/markdown-editor',
    title: 'Markdown Editor',
    category: 'Editors',
    icon: FileText,
    desc: 'Write and preview Markdown with live rendering',
  },
  {
    path: '/tools/weather-forecast',
    title: 'Weather Forecast',
    category: 'Utilities',
    icon: Cloud,
    desc: 'Check current weather and forecast for any city',
  },
  {
    path: '/tools/text-art-generator',
    title: 'Text Art Generator',
    category: 'Editors',
    icon: Palette,
    desc: 'Convert images into stunning text-based art',
  },
  {
    path: '/tools/windows-spotlight',
    title: 'Windows Spotlight',
    category: 'Utilities',
    icon: Photo,
    desc: 'View beautiful images from Windows Spotlight with autoplay',
  },
  {
    path: '/tools/one-piece-music',
    title: 'One Piece Music',
    category: 'Utilities',
    icon: Music,
    desc: 'Listen to One Piece soundtracks by episode',
  },
  {
    path: '/tools/nes-emulator',
    title: 'NES Emulator',
    category: 'Games',
    icon: DeviceGamepad,
    desc: 'Play NES ROMs served from Netlify Blobs',
  },
]

export const categories = [...new Set(tools.map((t) => t.category))]
