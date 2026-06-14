import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items: [], // Array of { id, name, price, quantity, portionSize, addOns: { extraRoti, raita, dessert }, notes }
  
  addItem: (item, customization = { portionSize: 'Medium', addOns: { extraRoti: false, raita: false, dessert: false }, notes: '' }) => {
    const items = [...get().items]
    // Uniqueness of item is based on id + portionSize + addOns configuration + notes
    const existingIndex = items.findIndex(i => 
      i.id === item.id && 
      i.portionSize === customization.portionSize &&
      JSON.stringify(i.addOns) === JSON.stringify(customization.addOns) &&
      i.notes === customization.notes
    )

    if (existingIndex > -1) {
      items[existingIndex].quantity += 1
    } else {
      items.push({
        ...item,
        quantity: 1,
        portionSize: customization.portionSize,
        addOns: customization.addOns,
        notes: customization.notes
      })
    }
    set({ items })
  },

  removeItem: (itemId, portionSize, addOns, notes) => {
    const items = get().items.filter(i => 
      !(i.id === itemId && 
        i.portionSize === portionSize && 
        JSON.stringify(i.addOns) === JSON.stringify(addOns) && 
        i.notes === notes)
    )
    set({ items })
  },

  updateQuantity: (itemId, portionSize, addOns, notes, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId, portionSize, addOns, notes)
      return
    }
    const items = get().items.map(i => {
      if (i.id === itemId && 
          i.portionSize === portionSize && 
          JSON.stringify(i.addOns) === JSON.stringify(addOns) && 
          i.notes === notes) {
        return { ...i, quantity }
      }
      return i
    })
    set({ items })
  },

  clearCart: () => set({ items: [] }),

  getItemTotal: (item) => {
    let price = item.price
    // Portion size multipliers
    if (item.portionSize === 'Small') price = Math.round(price * 0.8)
    if (item.portionSize === 'Large') price = Math.round(price * 1.3)
    
    // Add-on extra charges (PKR prices)
    if (item.addOns.extraRoti) price += 20
    if (item.addOns.raita) price += 40
    if (item.addOns.dessert) price += 120
    
    return price * item.quantity
  },

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + get().getItemTotal(item), 0)
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0)
  }
}))
