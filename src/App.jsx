import React from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppRoutes from './router/routes'
import NotificationToast from './components/shared/NotificationToast'
import WhatsAppButton from './components/shared/WhatsAppButton'
import ScrollToHashElement from './components/shared/ScrollToHashElement'

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
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

