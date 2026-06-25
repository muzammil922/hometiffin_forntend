import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { useToastStore } from '../../store/toastStore'

export default function NotificationToast() {
  const { toasts, removeToast } = useToastStore()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Mobile rendering format: suppress non-error toasts, show errors as a premium custom modal popup
  if (isMobile) {
    const errorToasts = toasts.filter((t) => t.type === 'error')
    if (errorToasts.length === 0) return null

    return (
      <AnimatePresence>
        {errorToasts.map((toast) => (
          <div key={toast.id} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-5 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-[32px] p-6 shadow-2xl border border-gray-100 max-w-sm w-full flex flex-col items-center gap-4 text-center relative"
            >
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner mt-2">
                <AlertTriangle className="w-7 h-7" />
              </div>
              
              <div className="flex flex-col gap-1.5 mt-1 text-center">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">System Alert</h3>
                <p className="text-xs text-gray-500 font-semibold leading-relaxed px-2">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="w-full py-3.5 mt-3 rounded-2xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-[0.98] transition-all cursor-pointer text-sm"
              >
                Okay
              </button>
            </motion.div>
          </div>
        ))}
      </AnimatePresence>
    )
  }

  // Desktop rendering format: standard slide-in cards stack on top-right
  return (
    <div className="fixed top-20 md:top-24 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 z-[100] flex flex-col gap-3 w-[calc(100%-2rem)] md:w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const styles = {
            success: 'bg-white border-l-4 border-l-emerald-500 text-gray-800 border-y border-r border-gray-100 shadow-xl',
            info: 'bg-white border-l-4 border-l-primary text-gray-800 border-y border-r border-gray-100 shadow-xl',
            warning: 'bg-white border-l-4 border-l-amber-500 text-gray-800 border-y border-r border-gray-100 shadow-xl',
            error: 'bg-white border-l-4 border-l-rose-500 text-gray-800 border-y border-r border-gray-100 shadow-xl',
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl transition-all ${styles[toast.type] || styles.info}`}
            >
              <div className="flex items-center gap-3">
                <span className="shrink-0 bg-gray-50 p-2 rounded-full">
                  {toast.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : toast.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  ) : toast.type === 'error' ? (
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
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
