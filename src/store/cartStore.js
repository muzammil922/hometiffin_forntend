import { create } from 'zustand'
import api from '../services/api'
import { useAuthStore } from './authStore'

export const useCartStore = create((set, get) => ({
  // items: { id, name, price, image, category, quantity,
  //          weight, weightMultiplier,
  //          coldDrink: { name, price } | null,
  //          meetha:    { name, price } | null,
  //          salad:     { name, price } | null,
  //          extraRoti: bool, notes: string, cartItemId: string }
  items: [],

  fetchCart: async () => {
    try {
      const isAuthenticated = useAuthStore.getState().isAuthenticated
      if (!isAuthenticated) return

      const res = await api.get('/cart')
      const mappedItems = res.data.map(item => {
        const cust = item.customization || {}
        let weightMultiplier = 1.0
        if (cust.weight === '300g') weightMultiplier = 0.75
        if (cust.weight === '700g') weightMultiplier = 1.35

        return {
          id: item.meal.id,
          name: item.meal.name,
          price: item.meal.price,
          image: item.meal.imageUrl,
          category: item.meal.category,
          quantity: item.quantity,
          weight: cust.weight || '500g',
          weightMultiplier,
          coldDrink: cust.coldDrink || null,
          meetha: cust.meetha || null,
          salad: cust.salad || null,
          extraRoti: cust.extraRoti || false,
          notes: cust.notes || '',
          cartItemId: item.id
        }
      })
      set({ items: mappedItems })
    } catch (err) {
      console.error('Failed to fetch cart:', err)
    }
  },

  addItem: async (item, customization = {
    weight: '500g',
    weightMultiplier: 1.0,
    coldDrink: null,
    meetha: null,
    salad: null,
    extraRoti: false,
    notes: ''
  }) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (isAuthenticated) {
      try {
        await api.post('/cart', {
          mealId: item.id,
          quantity: 1,
          customization: {
            weight: customization.weight,
            extraRoti: customization.extraRoti,
            coldDrink: customization.coldDrink,
            meetha: customization.meetha,
            salad: customization.salad,
            notes: customization.notes
          }
        })
        await get().fetchCart()
      } catch (err) {
        console.error('Failed to add item to cart on backend:', err)
      }
    } else {
      const items = [...get().items]

      const existingIndex = items.findIndex(i =>
        i.id === item.id &&
        i.weight === customization.weight &&
        JSON.stringify(i.coldDrink) === JSON.stringify(customization.coldDrink) &&
        JSON.stringify(i.meetha)    === JSON.stringify(customization.meetha) &&
        JSON.stringify(i.salad)     === JSON.stringify(customization.salad) &&
        i.extraRoti === customization.extraRoti &&
        i.notes === customization.notes
      )

      if (existingIndex > -1) {
        items[existingIndex].quantity += 1
      } else {
        items.push({
          ...item,
          quantity: 1,
          weight:           customization.weight,
          weightMultiplier: customization.weightMultiplier,
          coldDrink:        customization.coldDrink,
          meetha:           customization.meetha,
          salad:            customization.salad,
          extraRoti:        customization.extraRoti,
          notes:            customization.notes,
        })
      }
      set({ items })
    }
  },

  removeItem: async (cartItem) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (isAuthenticated && cartItem.cartItemId) {
      try {
        await api.delete(`/cart/${cartItem.cartItemId}`)
        await get().fetchCart()
      } catch (err) {
        console.error('Failed to remove item from cart on backend:', err)
      }
    } else {
      const items = get().items.filter(i =>
        !(i.id === cartItem.id &&
          i.weight === cartItem.weight &&
          JSON.stringify(i.coldDrink) === JSON.stringify(cartItem.coldDrink) &&
          JSON.stringify(i.meetha)    === JSON.stringify(cartItem.meetha) &&
          JSON.stringify(i.salad)     === JSON.stringify(cartItem.salad) &&
          i.extraRoti === cartItem.extraRoti &&
          i.notes === cartItem.notes)
      )
      set({ items })
    }
  },

  updateQuantity: async (cartItem, quantity) => {
    if (quantity <= 0) {
      await get().removeItem(cartItem)
      return
    }
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (isAuthenticated && cartItem.cartItemId) {
      try {
        await api.put(`/cart/${cartItem.cartItemId}`, { quantity })
        await get().fetchCart()
      } catch (err) {
        console.error('Failed to update quantity on backend:', err)
      }
    } else {
      const items = get().items.map(i => {
        if (
          i.id === cartItem.id &&
          i.weight === cartItem.weight &&
          JSON.stringify(i.coldDrink) === JSON.stringify(cartItem.coldDrink) &&
          JSON.stringify(i.meetha)    === JSON.stringify(cartItem.meetha) &&
          JSON.stringify(i.salad)     === JSON.stringify(cartItem.salad) &&
          i.extraRoti === cartItem.extraRoti &&
          i.notes === cartItem.notes
        ) {
          return { ...i, quantity }
        }
        return i
      })
      set({ items })
    }
  },

  clearCart: async () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (isAuthenticated) {
      try {
        await api.delete('/cart')
        set({ items: [] })
      } catch (err) {
        console.error('Failed to clear cart on backend:', err)
      }
    } else {
      set({ items: [] })
    }
  },

  syncLocalCart: async () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (!isAuthenticated) return
    
    const localItems = get().items
    if (localItems.length === 0) return

    try {
      for (const item of localItems) {
        if (!item.cartItemId) {
          await api.post('/cart', {
            mealId: item.id,
            quantity: item.quantity,
            customization: {
              weight: item.weight,
              extraRoti: item.extraRoti,
              coldDrink: item.coldDrink,
              meetha: item.meetha,
              salad: item.salad,
              notes: item.notes
            }
          })
        }
      }
      await get().fetchCart()
    } catch (err) {
      console.error('Failed to sync local cart with database:', err)
    }
  },

  getItemTotal: (item) => {
    const base   = Math.round(item.price * (item.weightMultiplier ?? 1.0))
    let extras   = 0
    if (item.coldDrink?.price) extras += item.coldDrink.price
    if (item.meetha?.price)    extras += item.meetha.price
    if (item.salad?.price)     extras += item.salad.price
    if (item.extraRoti)        extras += 20
    return (base + extras) * item.quantity
  },

  getSubtotal: () =>
    get().items.reduce((total, item) => total + get().getItemTotal(item), 0),

  getTotalItems: () =>
    get().items.reduce((total, item) => total + item.quantity, 0),
}))
