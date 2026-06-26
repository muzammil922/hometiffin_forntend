import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ChefHat,
  Tag,
  ShoppingCart,
  CheckCircle2,
  Banknote,
  CreditCard,
  CupSoda,
  Cake,
  Salad,
  Utensils,
  Sparkles,
  X
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { useCartStore } from '../store/cartStore'
import { useToastStore } from '../store/toastStore'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

export default function Cart() {
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, clearCart, getItemTotal, getSubtotal, fetchCart } = useCartStore()
  const { addToast } = useToastStore()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('') // 'Cash' or 'Online'
  const [isAddMoreExpanded, setIsAddMoreExpanded] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  // Fetch cart from backend database on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart()
    }
  }, [isAuthenticated])

  // Guest Details States
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestAddress, setGuestAddress] = useState('')

  // Prefill guest details from last checkout if exists
  useEffect(() => {
    if (!isAuthenticated && isConfirmModalOpen) {
      const lastEmail = localStorage.getItem('last_checkout_email') || ''
      const accountsData = JSON.parse(localStorage.getItem('hometiffin_accounts')) || {}
      const info = accountsData[lastEmail.toLowerCase()] || {}
      if (info.name) {
        setGuestName(info.name)
        setGuestEmail(info.email)
        setGuestPhone(info.phone)
        setGuestAddress(info.address)
      }
    }
  }, [isAuthenticated, isConfirmModalOpen])

  // Automatically start checkout for logged-in users upon opening confirmation modal
  useEffect(() => {
    if (isConfirmModalOpen && isAuthenticated && !isCheckingOut) {
      handleCheckout()
    }
  }, [isConfirmModalOpen, isAuthenticated])

  const deliveryFee = items.length > 0 ? 60 : 0
  const subtotal = getSubtotal()
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0
  const total = subtotal + deliveryFee - discount
  const totalQty = items.reduce((t, i) => t + i.quantity, 0)

  const handleRemove = (item) => {
    removeItem(item)
    addToast(`${item.name} removed from cart`, 'info')
  }

  const handleQtyChange = (item, delta) => {
    updateQuantity(item, item.quantity + delta)
  }

  const handleApplyCoupon = () => {
    if (couponCode.trim().toLowerCase() === 'tiffin10') {
      setCouponApplied(true)
      addToast('Coupon applied! 10% discount added', 'success')
    } else {
      addToast('Invalid coupon code', 'warning')
    }
  }

  const buildWhatsAppMessage = (guestData) => {
    let msg = `Hi Home Tiffin! My order:\n\n`

    // Customer Details
    const name = guestData?.name || user?.name || 'Customer'
    const phone = guestData?.phone || user?.phone || ''
    const address = guestData?.address || user?.address || ''
    const email = guestData?.email || user?.email || ''

    msg += `*Customer Details*:\n`
    msg += `Name: ${name}\n`
    if (phone) msg += `Phone: ${phone}\n`
    if (email) msg += `Email: ${email}\n`
    if (address) msg += `Delivery Address: ${address}\n\n`

    msg += `*Order Items*:\n`
    items.forEach((item, idx) => {
      msg += `*${idx + 1}. ${item.name}*\n`
      msg += `   Weight: ${item.weight} | Qty: ${item.quantity}\n`
      if (item.coldDrink) msg += `   Cold Drink: ${item.coldDrink.name}\n`
      if (item.meetha)    msg += `   Sweet: ${item.meetha.name}\n`
      if (item.salad)     msg += `   Salad: ${item.salad.name}\n`
      if (item.extraRoti) msg += `   Extra Roti: Yes\n`
      if (item.notes)     msg += `   Note: ${item.notes}\n`
      msg += `   Subtotal: PKR ${getItemTotal(item)}\n\n`
    })
    msg += `Delivery Fee: PKR ${deliveryFee}\n`
    if (couponApplied) msg += `Discount (TIFFIN10): -PKR ${discount}\n`
    msg += `*Total: PKR ${total}*\n`
    msg += `*Payment Method*: ${paymentMethod}\n\nPlease confirm my order. Thank you!`
    return msg
  }

  const handleCheckout = async (guestData) => {
    if (!paymentMethod) {
      addToast('Please select a payment method', 'warning')
      return
    }
    
    setIsCheckingOut(true)

    if (isAuthenticated) {
      try {
        const mappedPaymentMethod = paymentMethod === 'Cash' ? 'Cash on Delivery' : 'Bank Transfer'
        
        let address = user?.address
        if (user?.savedAddresses && Array.isArray(user.savedAddresses) && user.savedAddresses.length > 0) {
          address = user.savedAddresses[0].address || user.savedAddresses[0]
        }
        if (!address) {
          address = 'Gulshan-e-Iqbal, Karachi'
        }

        await api.post('/cart/checkout', {
          paymentMethod: mappedPaymentMethod,
          deliveryAddress: address,
          deliveryInstructions: 'Ring the bell'
        })

        setTimeout(async () => {
          addToast('Order placed successfully!', 'success')
          await clearCart()
          setIsCheckingOut(false)
          setIsConfirmModalOpen(false)
          navigate('/dashboard/overview')
        }, 9000)
      } catch (err) {
        console.error('Failed to place order:', err)
        addToast(err.response?.data?.error || 'Failed to place order. Please try again.', 'error')
        setIsCheckingOut(false)
        setIsConfirmModalOpen(false)
      }
    } else {
      try {
        await api.post('/orders/guest-checkout', {
          guestDetails: {
            name: guestData.name,
            email: guestData.email,
            phone: guestData.phone,
            address: guestData.address
          },
          items: items,
          paymentMethod: paymentMethod
        })

        setTimeout(() => {
          addToast('Order placed successfully! Confirmation SMS sent.', 'success')
          clearCart()
          setIsCheckingOut(false)
          setIsConfirmModalOpen(false)
          navigate('/menu')
        }, 9000)
      } catch (err) {
        console.error('Failed to place guest order:', err)
        addToast(err.response?.data?.error || 'Failed to place order. Please try again.', 'error')
        setIsCheckingOut(false)
        setIsConfirmModalOpen(false)
      }
    }
  }

  const handleGuestSubmit = (e) => {
    e.preventDefault()
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim() || !guestAddress.trim()) {
      addToast('Please fill out all fields', 'warning')
      return
    }
    if (!/\S+@\S+\.\S+/.test(guestEmail)) {
      addToast('Please enter a valid email address', 'warning')
      return
    }

    const currentAccounts = JSON.parse(localStorage.getItem('hometiffin_accounts')) || {}
    currentAccounts[guestEmail.toLowerCase()] = {
      name: guestName,
      email: guestEmail,
      phone: guestPhone,
      address: guestAddress,
      subscription: null,
      isGuest: true
    }
    localStorage.setItem('hometiffin_accounts', JSON.stringify(currentAccounts))
    localStorage.setItem('last_checkout_email', guestEmail)

    handleCheckout({
      name: guestName,
      email: guestEmail,
      phone: guestPhone,
      address: guestAddress
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            <span className="text-text-dark">Your </span>
            <span className="text-primary">Cart</span>
          </h1>
          {items.length > 0 && (
            <p className="text-sm text-gray-400 font-medium mt-1.5">
              {totalQty} item{totalQty !== 1 ? 's' : ''} in your order
            </p>
          )}
        </motion.div>

        {/* ── Empty State ── */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-6"
          >
            <div className="w-28 h-28 rounded-full bg-accent/30 border-2 border-accent flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-text-dark mb-1.5">Your cart is empty</h2>
              <p className="text-sm text-gray-400 font-medium">Browse our menu and add delicious meals</p>
            </div>
            <Link to="/menu">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-primary text-white px-10 py-3 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <ChefHat className="w-4 h-4" />
                Browse Menu
              </motion.button>
            </Link>
          </motion.div>
        ) : (

          /* ══════════════════════════════════════
             DUAL PANEL LAYOUT
             LEFT: Items list card  |  RIGHT: Dark summary card
             ══════════════════════════════════════ */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ════════════ LEFT: Items Panel (8 Columns) ════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-8 bg-white rounded-3xl border border-emerald-100/40 p-6 shadow-card"
            >
              {/* Column header */}
              <div className="pb-4 mb-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <span className="text-primary font-black text-sm tracking-wide uppercase">
                    Order Items
                  </span>
                </div>
                <div
                  id="cart-header-actions"
                  className="flex items-center gap-2"
                  onMouseEnter={() => setIsAddMoreExpanded(true)}
                  onMouseLeave={() => setIsAddMoreExpanded(false)}
                >
                  {/* Add More Button (Collapsible) */}
                  <motion.div layout className="flex items-center">
                    {isAddMoreExpanded ? (
                      <Link
                        to="/menu"
                        className="text-xs text-primary font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100/50 cursor-pointer hover:bg-emerald-100/50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          Add more items
                        </motion.span>
                      </Link>
                    ) : (
                      <motion.button
                        layoutId="add-more-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsAddMoreExpanded(true)
                        }}
                        className="p-1.5 rounded-lg text-primary hover:bg-emerald-50 border border-transparent hover:border-emerald-100/30 cursor-pointer transition-all flex items-center justify-center"
                        title="Add more items"
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    )}
                  </motion.div>

                  {/* Clear All Button */}
                  <motion.button
                    layout
                    onClick={(e) => {
                      e.stopPropagation()
                      clearCart()
                      addToast('Cart cleared', 'info')
                      setIsAddMoreExpanded(false)
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center justify-center gap-1 cursor-pointer p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    title="Clear all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <AnimatePresence>
                      {!isAddMoreExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          Clear all
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-4">
                <AnimatePresence mode="popLayout">
                  {items.map((item, idx) => {
                    const itemTotal = getItemTotal(item)

                    return (
                      <motion.div
                        key={`${item.id}-${item.weight}-${JSON.stringify(item.coldDrink)}-${idx}`}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.2 }}
                      >
                        {idx > 0 && <div className="h-px bg-gray-150/40 my-3" />}

                        <div className="flex items-center gap-4 py-2">
                          {/* Circular image */}
                          <div className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-background border border-emerald-100/30 shadow-sm flex items-center justify-center">
                            <img
                              src={item.image || '/cutout_biryani.png'}
                              alt={item.name}
                              className="w-14 h-14 object-contain scale-110"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className="text-sm font-bold text-text-dark truncate">{item.name}</h3>
                            <p className="text-xs text-primary/70 font-semibold mt-0.5">
                              {item.weight} · {item.category}
                            </p>
                            
                            {/* Extras list badge pills */}
                            {(item.coldDrink || item.meetha || item.salad || item.extraRoti) && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5 max-w-full">
                                {item.coldDrink && (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50/80 text-primary border border-emerald-100/50 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                    <CupSoda className="w-2.5 h-2.5 shrink-0" />
                                    {item.coldDrink.name}
                                  </span>
                                )}
                                {item.meetha && (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50/80 text-primary border border-emerald-100/50 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                    <Cake className="w-2.5 h-2.5 shrink-0" />
                                    {item.meetha.name}
                                  </span>
                                )}
                                {item.salad && (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50/80 text-primary border border-emerald-100/50 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                    <Salad className="w-2.5 h-2.5 shrink-0" />
                                    {item.salad.name}
                                  </span>
                                )}
                                {item.extraRoti && (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50/80 text-primary border border-emerald-100/50 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                    <Utensils className="w-2.5 h-2.5 shrink-0" />
                                    Extra Roti
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Price */}
                          <div className="flex-shrink-0 text-right hidden sm:block">
                            <span className="text-sm font-black text-text-dark">Rs. {itemTotal}</span>
                            {item.quantity > 1 && (
                              <p className="text-[10px] text-gray-400 font-semibold">×{item.quantity}</p>
                            )}
                          </div>

                          {/* Qty pill */}
                          <div className="flex-shrink-0 flex items-center bg-background rounded-full overflow-hidden border border-emerald-100/30 shadow-sm">
                            <button
                              onClick={() => handleQtyChange(item, -1)}
                              className="w-8 h-8 flex items-center justify-center text-primary hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-black text-text-dark select-none">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQtyChange(item, 1)}
                              className="w-8 h-8 flex items-center justify-center text-primary hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => handleRemove(item)}
                            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>


            </motion.div>

            {/* ════════════ RIGHT: Summary Panel (4 Columns) ════════════ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-4 lg:sticky lg:top-24 bg-gradient-to-br from-primary to-emerald-950 text-white rounded-3xl p-6 shadow-card border border-emerald-900/40 flex flex-col gap-6"
            >
              {/* Coupon */}
              <div className="text-left">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-accent" />
                  <span className="text-sm font-bold text-white">Have a coupon?</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    disabled={couponApplied}
                    className="flex-1 px-4 py-2.5 rounded-full bg-white border border-emerald-800 text-text-dark text-sm font-semibold placeholder-emerald-800/40 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 min-w-0 shadow-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleApplyCoupon}
                    disabled={couponApplied || !couponCode.trim()}
                    className="bg-accent text-primary px-5 py-2.5 rounded-full text-xs font-black whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 hover:bg-white transition-colors shadow-sm"
                  >
                    {couponApplied ? <CheckCircle2 className="w-4 h-4 text-primary" /> : 'Apply →'}
                  </motion.button>
                </div>
                {couponApplied ? (
                  <p className="text-xs text-accent font-bold mt-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    10% off — Rs. {discount} saved!
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-100/70 font-medium mt-2">
                    Try: <span className="font-bold text-white hover:underline cursor-pointer">TIFFIN10</span>
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-white/10" />

              {/* Totals */}
              <div className="flex flex-col gap-3 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-100/80 font-medium">Subtotal</span>
                  <span className="text-white font-bold">Rs. {subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-100/80 font-medium">Delivery Fee</span>
                  <span className="text-white font-bold">Rs. {deliveryFee}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-sm">
                    <span className="text-accent font-bold">Discount (10%)</span>
                    <span className="text-accent font-bold">— Rs. {discount}</span>
                  </div>
                )}
                
                <div className="h-px bg-white/10 my-1" />
                
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold text-base">Total</span>
                  <span className="text-accent font-black text-2xl">Rs. {total}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/10" />

              {/* Payment Methods */}
              <div className="flex flex-col gap-3 text-left">
                <span className="text-white font-bold text-sm">Payment Method</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentMethod('Cash')}
                    className={`flex-1 py-3 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === 'Cash'
                        ? 'border-accent bg-accent/15 text-accent shadow-sm'
                        : 'border-white/10 text-white/60 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    Cash
                  </button>
                  <button
                    onClick={() => setPaymentMethod('Online')}
                    className={`flex-1 py-3 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === 'Online'
                        ? 'border-accent bg-accent/15 text-accent shadow-sm'
                        : 'border-white/10 text-white/60 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Online
                  </button>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="mt-auto pt-2 flex flex-col gap-2">
                <motion.button
                  whileHover={paymentMethod ? { scale: 1.02 } : {}}
                  whileTap={paymentMethod ? { scale: 0.98 } : {}}
                  onClick={() => setIsConfirmModalOpen(true)}
                  disabled={!paymentMethod}
                  className={`w-full py-4 rounded-3xl font-bold text-base flex items-center justify-center gap-3 shadow-md transition-all ${
                    !paymentMethod
                      ? 'bg-white/10 text-white/40 cursor-not-allowed border border-transparent'
                      : 'bg-accent hover:bg-white text-primary border border-transparent cursor-pointer'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Confirm Order
                </motion.button>
                <p className="text-center text-[10px] text-emerald-100/50 font-bold uppercase tracking-wider">
                  {!paymentMethod ? 'Select a payment method' : 'Open order confirmation'}
                </p>
              </div>

            </motion.div>
            {/* ═══════ end right column ═══════ */}

          </div>
        )}
      </main>

      <Footer collapsible={true} />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isCheckingOut) setIsConfirmModalOpen(false)
              }}
              className="fixed inset-0 bg-[#000c08]/95 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-[#021f16] border border-emerald-800/80 text-white rounded-3xl p-8 shadow-2xl z-10 overflow-hidden text-center"
            >
              {/* Close Button */}
              {!isCheckingOut && (
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full text-emerald-100/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {(!isAuthenticated && !isCheckingOut) ? (
                // 1. Guest Form View
                <div>
                  <div className="flex flex-col items-center gap-3 mb-6">
                    <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30 text-accent shadow-inner">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Checkout Details</h3>
                    <p className="text-xs text-emerald-100/70 font-medium max-w-xs">
                      Please enter your contact and delivery details to complete your order.
                    </p>
                  </div>
                  
                  {/* Guest Form */}
                  <form onSubmit={handleGuestSubmit} className="flex flex-col gap-4 text-left">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-300">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Muzammil Khan"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-emerald-100/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-300">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-emerald-100/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-300">Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 03001234567"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-emerald-100/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-300">Delivery Address</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Complete address in Karachi"
                        value={guestAddress}
                        onChange={(e) => setGuestAddress(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-emerald-100/30 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-4 mt-2 rounded-3xl bg-accent hover:bg-white text-primary font-bold text-base shadow-md transition-all cursor-pointer"
                    >
                      Place Order
                    </button>
                  </form>
                </div>
              ) : (
                // 2. Animated Truck View (Plays automatically for logged-in or once guest form submits)
                <div className="py-8 flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center gap-3 mb-8">
                    <h3 className="text-xl font-bold text-white tracking-tight">Confirming Your Order</h3>
                    <p className="text-xs text-emerald-100/70 font-medium">
                      Please wait, your delivery truck is on the way...
                    </p>
                  </div>
                  
                  {/* Animated Confirm Button */}
                  <div className="flex flex-col items-center justify-center gap-2 pt-2">
                    <button
                      disabled={true} // Keep disabled so they cannot click it while it auto-animates
                      className="order animate mx-auto"
                    >
                      <span className="default">Confirm & Place Order</span>
                      <span className="success flex items-center justify-center gap-1.5">
                        Order Placed
                        <svg viewBox="0 0 12 10">
                          <polyline points="1.5 6 4.5 9 10.5 1" />
                        </svg>
                      </span>
                      <div className="box"></div>
                      <div className="truck">
                        <div className="back"></div>
                        <div className="front">
                          <div className="window"></div>
                        </div>
                        <div className="light top"></div>
                        <div className="light bottom"></div>
                      </div>
                      <div className="lines"></div>
                    </button>
                    <p className="text-[10px] text-emerald-100/50 font-bold uppercase tracking-wider mt-4">
                      Processing Delivery Truck...
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
