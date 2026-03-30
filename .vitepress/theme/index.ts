import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    if (typeof window === 'undefined') return

    const initCyberEffects = () => {
      document.body.classList.add('cyber-scanlines')
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initCyberEffects)
    } else {
      initCyberEffects()
    }

    router.onAfterRouteChange = () => {
      document.body.classList.remove('wm-route-transition')
      void document.body.offsetWidth
      document.body.classList.add('wm-route-transition')

      window.setTimeout(() => {
        document.body.classList.remove('wm-route-transition')
      }, 700)
    }
  }
}

export default theme
