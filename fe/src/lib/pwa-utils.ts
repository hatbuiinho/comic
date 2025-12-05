// PWA Utilities for Shadcn Admin
// This file provides utilities for PWA functionality

// Extend Window interface for PWA
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }

  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[]
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed'
      platform: string
    }>
    prompt(): Promise<void>
  }

  interface Navigator {
    standalone?: boolean
  }

  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent
  }
}

/**
 * Check if the app is running in standalone mode
 */
export const isStandalone = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

/**
 * Check if PWA is installable
 */
export const isInstallable = (): Promise<boolean> => {
  return new Promise((resolve) => {
    window.addEventListener('beforeinstallprompt', () => {
      resolve(true)
    })

    // Timeout after 1 second
    setTimeout(() => resolve(false), 1000)
  })
}

/**
 * Prompt user to install PWA
 */
export const promptInstall = async (): Promise<boolean> => {
  const deferredPrompt = window.deferredPrompt

  if (!deferredPrompt) {
    return false
  }

  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice

  // Clear the deferredPrompt
  window.deferredPrompt = undefined

  return outcome === 'accepted'
}

/**
 * Check if the device is online
 */
export const isOnline = (): boolean => {
  return navigator.onLine
}

/**
 * Register service worker
 */
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New content is available
              if (confirm('New version available! Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' })
                window.location.reload()
              }
            }
          })
        }
      })
    } catch (_error) {
      // Silently handle registration failure
    }
  }
}

/**
 * Unregister service worker
 */
export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.unregister()
    }
  }
}

/**
 * Get app update info
 */
export const getUpdateInfo = (): {
  isUpdateAvailable: boolean
  updateUrl?: string
} => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    return {
      isUpdateAvailable: true,
      updateUrl: window.location.href,
    }
  }
  return { isUpdateAvailable: false }
}

/**
 * Check if running on iOS
 */
export const isIos = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent)
}

/**
 * Get PWA installation prompt event
 */
export const getInstallPrompt = (): BeforeInstallPromptEvent | undefined => {
  return window.deferredPrompt
}
