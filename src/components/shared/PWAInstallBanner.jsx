import React, { useState, useEffect } from 'react'
import { ChefHat } from 'lucide-react'
import AnimatedLogo from './AnimatedLogo'

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if dismissed previously
    const isDismissed = localStorage.getItem('pwa_banner_dismissed') === 'true'
    if (isDismissed) return

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iosDetected = /iphone|ipad|ipod/.test(userAgent)
    const isStandalone = ('standalone' in window.navigator) && (window.navigator.standalone)
    
    if (iosDetected && !isStandalone) {
      setIsIOS(true)
      setShowBanner(true)
      return
    }

    // Android/Chrome event listener
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowBanner(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa_banner_dismissed', 'true')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="w-full bg-accent text-text-dark px-6 py-4 rounded-2xl border border-emerald-200/50 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <AnimatedLogo className="h-8 shrink-0" />
        <div className="text-left">
          <p className="font-semibold text-sm md:text-base m-0">Install Home Tiffin App</p>
          <p className="text-xs text-emerald-800 m-0">
            {isIOS 
              ? 'Tap the Share button below, then select "Add to Home Screen"' 
              : 'Add Home Tiffin to your home screen for quick, offline-capable ordering!'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {!isIOS && (
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-primary text-text-light text-xs font-semibold rounded-xl hover:bg-primary-dark cursor-pointer transition-all shadow-subtle"
          >
            Install Now
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="px-3 py-2 text-xs font-medium text-emerald-800 hover:text-text-dark cursor-pointer transition-all"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
