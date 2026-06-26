import React, { useState, useEffect } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppRoutes from './router/routes'
import NotificationToast from './components/shared/NotificationToast'
import WhatsAppButton from './components/shared/WhatsAppButton'
import ScrollToHashElement from './components/shared/ScrollToHashElement'
import PageLoader from './components/shared/PageLoader'

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AppContent() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')

  return (
    <>
      <ScrollToHashElement />
      <AppRoutes />
      <NotificationToast />
      {!isDashboard && <WhatsAppButton />}
    </>
  )
}

export default function App() {
  const [appLoading, setAppLoading] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Start fading out after 2 seconds (when loader completes one full fill cycle)
    const fadeTimer = setTimeout(() => {
      setFadeOut(true)
    }, 2000)

    // Completely unmount splash container after the 500ms transition ends
    const unmountTimer = setTimeout(() => {
      setAppLoading(false)
    }, 2500)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(unmountTimer)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {appLoading && (
          <div
            className={`fixed inset-0 z-[9999] transition-opacity duration-500 bg-[#FFF8E7] ${
              fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <PageLoader />
          </div>
        )}
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

