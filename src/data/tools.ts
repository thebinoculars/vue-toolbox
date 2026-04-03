import { type Component } from 'vue'
import { CodeSlashOutline, LinkOutline } from '@vicons/ionicons5'

export interface Tool {
  path: string
  title: string
  category: string
  icon: Component
  desc: string
}

export const tools: Tool[] = [
  {
    path: '/tools/base64',
    title: 'Base64 Encode/Decode',
    category: 'Encoders / Decoders',
    icon: CodeSlashOutline,
    desc: 'Encode and decode Base64 strings',
  },
  {
    path: '/tools/url-parser',
    title: 'URL Parser',
    category: 'Utilities',
    icon: LinkOutline,
    desc: 'Parse and inspect URL components and query parameters',
  },
]

export const categories = [...new Set(tools.map((t) => t.category))]
