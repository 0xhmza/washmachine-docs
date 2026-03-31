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
      { text: 'Guide', link: '/guide/setup' },
      { text: 'CLI', link: '/cli/overview' },
      { text: 'Internals', link: '/internals/overview' },
      { text: 'Bin2Shell', link: '/bin2shell/overview' },
      { text: 'GitHub', link: 'https://github.com/0xhmza/washmachine' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Welcome', link: '/' },
          { text: 'Setup', link: '/guide/setup' },
          { text: 'First Compilation', link: '/guide/first-compile' },
          { text: 'Output & Artifacts', link: '/guide/output' },
          { text: 'Testing', link: '/guide/testing' }
        ]
      },
      {
        text: 'CLI Reference',
        items: [
          { text: 'Overview', link: '/cli/overview' },
          { text: 'compile', link: '/cli/compile' },
          { text: 'analyze', link: '/cli/analyze' },
          { text: 'strip', link: '/cli/strip' },
          { text: 'backdoor', link: '/cli/backdoor' },
          { text: 'list', link: '/cli/list' },
          { text: 'provision', link: '/cli/provision' },
          { text: 'test', link: '/cli/test' }
        ]
      },
      {
        text: 'Internals',
        items: [
          { text: 'Architecture', link: '/internals/overview' },
          { text: 'YAML Catalog', link: '/internals/yaml-catalog' },
          { text: 'Compile Pipeline', link: '/internals/compile-pipeline' },
          { text: 'PE Analysis', link: '/internals/pe-analysis' },
          { text: 'PE Injection', link: '/internals/pe-injection' },
          { text: 'Build & Packaging', link: '/internals/build' }
        ]
      },
      {
        text: 'Bin2Shell',
        items: [
          { text: 'Overview', link: '/bin2shell/overview' },
          { text: 'Integration', link: '/bin2shell/integration' },
          { text: 'Web & Security', link: '/bin2shell/advanced' }
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
