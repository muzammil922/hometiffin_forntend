import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { useToastStore } from '../../store/toastStore'

export default function NotificationToast() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-20 md:top-24 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 z-[100] flex flex-col gap-3 w-[calc(100%-2rem)] md:w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const styles = {
            success: 'bg-white border-l-4 border-l-emerald-500 text-gray-800 border-y border-r border-gray-100 shadow-xl',
            info: 'bg-white border-l-4 border-l-primary text-gray-800 border-y border-r border-gray-100 shadow-xl',
            warning: 'bg-white border-l-4 border-l-amber-500 text-gray-800 border-y border-r border-gray-100 shadow-xl',
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl transition-all ${styles[toast.type]}`}
            >
              <div className="flex items-center gap-3">
                <span className="shrink-0 bg-gray-50 p-2 rounded-full">
                  {toast.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : toast.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Info className="w-5 h-5 text-primary" />
                  )}
                </span>
                <span className="text-sm font-extrabold tracking-wide">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
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
