import { create } from 'zustand'
import api from '../services/api'

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('token') || null, // Persist token in localStorage
  user: JSON.parse(localStorage.getItem('user_profile')) || null,
  isAuthenticated: !!localStorage.getItem('user_profile') && !!localStorage.getItem('token'),
  loading: false,

  setToken: (token) => {
    localStorage.setItem('token', token)
    set({ token })
  },
  
  login: (userData, token) => {
    localStorage.setItem('user_profile', JSON.stringify(userData))
    localStorage.setItem('token', token)
    set({ token, user: userData, isAuthenticated: true, loading: false })
    
    // Sync local cart to database dynamically
    import('./cartStore.js')
      .then((m) => m.useCartStore.getState().syncLocalCart())
      .catch((err) => console.error('Cart sync error:', err))
  },

  logout: () => {
    localStorage.removeItem('user_profile')
    localStorage.removeItem('token')
    set({ token: null, user: null, isAuthenticated: false, loading: false })
  },

  updateProfile: (updatedData) => {
    const currentProfile = JSON.parse(localStorage.getItem('user_profile')) || {}
    const newProfile = { ...currentProfile, ...updatedData }
    localStorage.setItem('user_profile', JSON.stringify(newProfile))
    set({ user: newProfile })
  },

  fetchProfile: async () => {
    try {
      const res = await api.get('/users/profile')
      if (res.data) {
        localStorage.setItem('user_profile', JSON.stringify(res.data))
        set({ user: res.data })
        return res.data
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
    }
  },

  setLoading: (loading) => set({ loading })
}))
