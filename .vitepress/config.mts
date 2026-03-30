import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Washmachine',
  description: 'CLI-first shellcode loader builder with a WinUI 3 desktop app',
  base: '/washmachine-docs/',
  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    siteTitle: 'Washmachine Docs',

    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'CLI Reference', link: '/cli-reference' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'GitHub', link: 'https://github.com/0xhmza/washmachine' }
    ],

    sidebar: [
      {
        text: 'Documentation',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'CLI Reference', link: '/cli-reference' },
          { text: 'Architecture', link: '/architecture' }
        ]
      }
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/0xhmza/washmachine' }],

    footer: {
      message: 'For educational and authorized security testing purposes only.',
      copyright: 'Copyright © 2026 Washmachine'
    },

    editLink: {
      pattern: 'https://github.com/0xhmza/washmachine-docs/edit/main/:path',
      text: 'Edit this page on GitHub'
    },

    search: {
      provider: 'local'
    }
  }
})
