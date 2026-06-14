import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  token: null, // Stored strictly in memory for security
  user: JSON.parse(localStorage.getItem('user_profile')) || null,
  isAuthenticated: !!localStorage.getItem('user_profile'),
  loading: false,

  setToken: (token) => set({ token }),
  
  login: (userData, token) => {
    localStorage.setItem('user_profile', JSON.stringify(userData))
    set({ token, user: userData, isAuthenticated: true, loading: false })
  },

  logout: () => {
    localStorage.removeItem('user_profile')
    set({ token: null, user: null, isAuthenticated: false, loading: false })
  },

  updateProfile: (updatedData) => {
    const currentProfile = JSON.parse(localStorage.getItem('user_profile')) || {}
    const newProfile = { ...currentProfile, ...updatedData }
    localStorage.setItem('user_profile', JSON.stringify(newProfile))
    set({ user: newProfile })
  },

  setLoading: (loading) => set({ loading })
}))
