import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToastStore } from '../../store/toastStore'

export default function NotificationToast() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const bgColors = {
            success: 'bg-emerald-500 border-emerald-600 text-white',
            info: 'bg-primary text-text-light border-primary-dark',
            warning: 'bg-amber-500 border-amber-600 text-white',
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`pointer-events-auto flex items-center justify-between px-4 py-3 rounded-2xl border shadow-card ${bgColors[toast.type]}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-3 p-1 rounded-lg hover:bg-black/10 transition-all cursor-pointer"
                aria-label="Dismiss notification"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
