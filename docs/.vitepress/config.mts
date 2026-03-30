import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Washmachine',
  description: 'A CLI-first shellcode loader builder with WinUI 3 desktop app',
  base: '/washmachine-docs/',

  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap', rel: 'stylesheet' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'CLI Reference', link: '/cli-reference' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'GitHub', link: 'https://github.com/0xhmza/washmachine' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting Started', link: '/getting-started' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'CLI Reference', link: '/cli-reference' },
          { text: 'Architecture', link: '/architecture' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/0xhmza/washmachine' }
    ],

    footer: {
      message: 'For educational and authorized security testing purposes only.',
      copyright: 'Copyright © 2026 Washmachine'
    },

    search: {
      provider: 'local'
    }
  }
})
