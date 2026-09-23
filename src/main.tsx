import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import ThemeProvider from './components/common/ThemeProvider.tsx'
import './styles/globals.css'

// Register service worker for PWA (production only — in dev it caches stale
// builds and survives normal reloads, so it's disabled while developing)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      // Never serve sw.js itself from the HTTP cache, so a new deployment is detected
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        // An installed iOS app is resumed, not reloaded: check for a new version
        // each time it comes back to the foreground
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') registration.update().catch(() => undefined)
        })
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
  })

  // A new version took over: reload once so the screen shows it
  // (not on the very first install, when there was no previous version)
  const hadController = Boolean(navigator.serviceWorker.controller)
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading || !hadController) return
    reloading = true
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
