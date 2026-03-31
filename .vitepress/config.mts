import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Washmachine',
  description: 'YAML-driven shellcode loader generation and PE tooling — CLI + WinUI 3 desktop client',
  base: '/washmachine-docs/',
  cleanUrls: true,
  lastUpdated: true,
  appearance: 'dark',

  head: [
    ['link', { rel: 'icon', href: '/washmachine-docs/favicon.ico' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/washmachine-docs/icon-32x32.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/washmachine-docs/icon-180x180.png' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', {
      href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
      rel: 'stylesheet'
    }],
    ['meta', { name: 'theme-color', content: '#0a0e1a' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Washmachine — Shellcode Loader Toolkit' }],
    ['meta', { property: 'og:description', content: 'YAML-driven shellcode loader generation and PE tooling' }],
  ],

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'WASHMACHINE',

    nav: [
      { text: 'Overview', link: '/' },
      { text: 'Quickstart', link: '/getting-started' },
      { text: 'CLI Reference', link: '/cli-reference' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'Bin2Shell', link: '/bin2shell' },
      { text: 'GitHub', link: 'https://github.com/0xhmza/washmachine' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Welcome', link: '/' },
          { text: 'Quickstart', link: '/getting-started' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'CLI Commands', link: '/cli-reference' }
        ]
      },
      {
        text: 'Internals',
        items: [
          { text: 'Architecture', link: '/architecture' },
          { text: 'Bin2Shell', link: '/bin2shell' }
        ]
      }
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/0xhmza/washmachine' }],

    footer: {
      message: 'For educational and authorized security testing purposes only.',
      copyright: '© 2026 Washmachine'
    },

    editLink: {
      pattern: 'https://github.com/0xhmza/washmachine-docs/edit/main/:path',
      text: 'Edit this page on GitHub'
    },

    search: {
      provider: 'local'
    },

    outline: { level: [2, 3] }
  }
})
