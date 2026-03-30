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
      { text: 'Overview', link: '/' },
      { text: 'Quickstart', link: '/getting-started' },
      { text: 'Reference', link: '/cli-reference' },
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
          { text: 'CLI Reference', link: '/cli-reference' }
        ]
      },
      {
        text: 'Internals',
        items: [
          { text: 'Architecture', link: '/architecture' },
          { text: 'Bin2Shell Integration', link: '/bin2shell' }
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
