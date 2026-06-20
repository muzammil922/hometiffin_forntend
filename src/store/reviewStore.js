import { create } from 'zustand'
import io from 'socket.io-client'
import api from '../services/api'
import { useAuthStore } from './authStore'

let socket = null

export const useReviewStore = create((set, get) => ({
  testimonials: [],
  loading: false,
  socketConnected: false,
  
  fetchReviews: async () => {
    try {
      set({ loading: true })
      const res = await api.get('/reviews')
      set({ testimonials: res.data, loading: false })
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
      set({ loading: false })
    }
  },
  
  addReview: async (review) => {
    try {
      const res = await api.post('/reviews', review)
      // Prevent duplicate rendering by checking if already present in state
      set((state) => {
        const exists = state.testimonials.some((t) => t.id === res.data.id)
        if (exists) return {}
        return { testimonials: [res.data, ...state.testimonials] }
      })
      return res.data
    } catch (err) {
      console.error('Failed to add review:', err)
      throw err
    }
  },

  initSocket: () => {
    if (socket) return

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
    const token = useAuthStore.getState().token

    socket = io(socketUrl, {
      query: token ? { token } : {},
      transports: ['websocket', 'polling'],
      autoConnect: true
    })

    socket.on('connect', () => {
      console.log('Reviews socket connected')
      set({ socketConnected: true })
    })

    socket.on('review:new', (newReview) => {
      console.log('Received real-time review broadcast:', newReview)
      set((state) => {
        const exists = state.testimonials.some((t) => t.id === newReview.id)
        if (exists) return {}
        return { testimonials: [newReview, ...state.testimonials] }
      })
    })

    socket.on('disconnect', () => {
      console.log('Reviews socket disconnected')
      set({ socketConnected: false })
    })
  },

  disconnectSocket: () => {
    if (socket) {
      socket.disconnect()
      socket = null
      set({ socketConnected: false })
    }
  }
}))
