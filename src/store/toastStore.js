import { create } from 'zustand'

export const useToastStore = create((set, get) => ({
  toasts: [], // { id, message, type: 'success' | 'info' | 'warning' | 'error' }
  
  addToast: (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9)
    const newToast = { id, message, type }
    set((state) => ({ toasts: [...state.toasts, newToast] }))
    
    // Auto dismiss after 5 seconds (except for error notifications)
    if (type !== 'error') {
      setTimeout(() => {
        get().removeToast(id)
      }, 5000)
    }
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  }))
}))
