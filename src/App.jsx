import React from 'react'
import { BrowserRouter } from 'react-router-dom'
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToHashElement />
        <AppRoutes />
        <NotificationToast />
        <WhatsAppButton />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
