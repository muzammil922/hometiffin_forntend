import { create } from 'zustand'

export const useOrderStore = create((set) => ({
  activeOrder: null, // Current order: { id, status, rider: { name, phone, lat, lng }, estimatedTime }
  orders: [], // Past orders
  riderLocation: null, // { lat, lng } updated in real-time via Socket.io

  setActiveOrder: (activeOrder) => set({ activeOrder }),
  updateOrderStatus: (status) => set((state) => ({
    activeOrder: state.activeOrder ? { ...state.activeOrder, status } : null
  })),
  setRiderLocation: (riderLocation) => set({ riderLocation }),
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] }))
}))
