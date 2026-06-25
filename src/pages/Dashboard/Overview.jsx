import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Calendar, Utensils, MapPin, CheckCircle2, ChevronRight, Pencil, User, Phone, Loader2, Clock, ShoppingBag, Wallet, Sparkles } from 'lucide-react'
import api from '../../services/api'
import io from 'socket.io-client'
import { formatDate } from '../../services/dateFormatter'
import { computeDailyOrderStats } from '../../services/orderStats'
import { useToastStore } from '../../store/toastStore'
import { OverviewSkeleton } from '../../components/skeletons/dashboardSkeletons'

export default function Overview() {
  const { user, fetchProfile, updateProfile } = useAuthStore()
  const { addToast } = useToastStore()
  const [orders, setOrders] = useState([])
  const [activeOrder, setActiveOrder] = useState(null)
  const [activeOrderStatus, setActiveOrderStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [isPinned, setIsPinned] = useState(false)
  const [activeStatIndex, setActiveStatIndex] = useState(0)

  useEffect(() => {
    const scrollContainer = document.querySelector('main')
    if (!scrollContainer) return

    const handleScroll = () => {
      const panel = document.getElementById('overview-panel')
      if (panel) {
        const rect = panel.getBoundingClientRect()
        setIsPinned(scrollContainer.scrollTop > 50 && rect.top <= 56)
      } else {
        setIsPinned(false)
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    const timer = setTimeout(handleScroll, 100)

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      clearTimeout(timer)
    }
  }, [])

  // ── Edit Profile Modal State ──
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const openEditModal = () => {
    setEditName(user?.name || '')
    setEditPhone(user?.phone || '')
    setEditAddress(user?.savedAddresses?.[0]?.address || user?.address || '')
    setEditModalOpen(true)
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!editName.trim()) {
      addToast('Name cannot be empty.', 'error')
      return
    }
    try {
      setEditSaving(true)
      const payload = {
        name: editName.trim(),
        phone: editPhone.trim(),
        savedAddresses: editAddress.trim()
          ? [{ label: 'Home', address: editAddress.trim() }]
          : (user?.savedAddresses || [])
      }
      const res = await api.put('/users/profile', payload)
      // Update both store + localStorage
      updateProfile(res.data)
      addToast('Profile updated successfully!', 'success')
      setEditModalOpen(false)
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update profile.', 'error')
    } finally {
      setEditSaving(false)
    }
  }

  // Active Subscription Stats
  const activeSub = user?.subscriptions?.[0]
  const hasActivePlan = !!activeSub && activeSub.status === 'active'
  const planName = activeSub ? (activeSub.planType === 'weekly' ? 'Weekly Tiffin Plan' : 'Monthly Tiffin Plan') : 'None'
  const planRenewal = activeSub ? formatDate(activeSub.endDate) : 'N/A'

  // Quotas
  const totalMeals = activeSub ? (activeSub.planType === 'weekly' ? 7 : 30) : 0
  const completedMeals = activeSub ? totalMeals - activeSub.mealsRemaining : 0
  const progressPercent = totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0

  // Simulated countdown timer for next tiffin delivery
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })

  const getSlotDetails = () => {
    if (!hasActivePlan || !activeSub) return null

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute

    let slotStart = 0 // in minutes from midnight
    let slotEnd = 0

    const slotType = activeSub.preferenceDeliveryTime?.toLowerCase()
    if (slotType === 'breakfast') {
      slotStart = 8 * 60 // 8:00 AM
      slotEnd = 9 * 60 + 30 // 9:30 AM
    } else if (slotType === 'dinner') {
      slotStart = 19 * 60 + 30 // 7:30 PM
      slotEnd = 21 * 60 // 9:00 PM
    } else {
      // Default to lunch
      slotStart = 12 * 60 + 30 // 12:30 PM
      slotEnd = 14 * 60 // 2:00 PM
    }

    const isInSlot = currentTimeInMinutes >= slotStart && currentTimeInMinutes < slotEnd

    return {
      isInSlot,
      slotStart,
      slotEnd,
      currentTimeInMinutes
    }
  }

  const slotDetails = getSlotDetails()
  const isInSlot = slotDetails?.isInSlot
  const showTracking = !!activeOrder || (hasActivePlan && isInSlot)

  const getEffectiveStatus = () => {
    if (activeOrderStatus) return activeOrderStatus
    
    // Simulate status based on slot time
    if (hasActivePlan && isInSlot && slotDetails) {
      const elapsed = slotDetails.currentTimeInMinutes - slotDetails.slotStart
      if (elapsed < 15) return 'Confirmed'
      if (elapsed < 40) return 'Preparing'
      if (elapsed < 80) return 'Picked Up'
      return 'Delivered'
    }
    
    return 'Confirmed'
  }
  const effectiveStatus = getEffectiveStatus()

  // Fetch initial profile & orders
  const fetchData = async () => {
    try {
      setLoading(true)
      await fetchProfile()
      const res = await api.get('/orders/my-orders')
      setOrders(res.data)
      
      const active = res.data.find(o => !['Delivered'].includes(o.status))
      if (active) {
        setActiveOrder(active)
        setActiveOrderStatus(active.status)
      } else {
        setActiveOrder(null)
        setActiveOrderStatus('')
      }
    } catch (err) {
      console.error('Failed to load overview data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Re-fetch profile silently whenever user comes back to this tab
    // so subscription status stays in sync with My Subscription page
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchProfile()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Timer countdown hook
  useEffect(() => {
    if (!hasActivePlan || !activeSub) return

    const calculateTimeLeft = () => {
      const now = new Date()
      let targetTime = new Date()
      
      const isLunch = activeSub.preferenceDeliveryTime?.toLowerCase() === 'lunch'
      if (isLunch) {
        targetTime.setHours(13, 30, 0, 0) // Lunch delivery deadline
      } else {
        targetTime.setHours(20, 30, 0, 0) // Dinner delivery deadline
      }

      if (now.getTime() > targetTime.getTime()) {
        targetTime.setDate(targetTime.getDate() + 1)
      }

      const diff = targetTime.getTime() - now.getTime()
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff / (1000 * 60)) % 60)
      const seconds = Math.floor((diff / 1000) % 60)

      setTimeLeft({ hours, minutes, seconds })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [hasActivePlan, activeSub])

  // Real-time socket room join & tracking
  useEffect(() => {
    if (!activeOrder) return

    const token = useAuthStore.getState().token
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
    const socket = io(socketUrl, {
      autoConnect: false,
      query: { token }
    })
    
    socket.connect()

    socket.on('connect', () => {
      console.log('Overview tracking socket connected')
      socket.emit('join_order', { orderId: activeOrder.id })
    })

    socket.on('order:status', (data) => {
      if (data && data.status) {
        setActiveOrderStatus(data.status)
        if (data.status === 'Delivered') {
          setTimeout(() => {
            fetchData()
          }, 3000)
        }
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [activeOrder])

  const formatNumber = (num) => String(num).padStart(2, '0')

  const getDeliverySlotLabel = (slot) => {
    const type = slot?.toLowerCase()
    if (type === 'breakfast') return 'Breakfast (8:00 AM - 9:30 AM)'
    if (type === 'dinner') return 'Dinner (7:30 PM - 9:00 PM)'
    return 'Lunch (12:30 PM - 2:00 PM)'
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Delivered': return 'success'
      case 'Preparing': return 'warning'
      case 'Picked Up': return 'accent'
      case 'Nearby': return 'accent'
      default: return 'primary'
    }
  }

  // Calculate monthly spent on one-time daily orders
  const getMonthlySpend = () => computeDailyOrderStats(orders).dailyMonthly

  const mobileHeroStats = [
    {
      label: 'Next Delivery',
      value: hasActivePlan ? `${formatNumber(timeLeft.hours)}h ${formatNumber(timeLeft.minutes)}m` : '—',
      hint: 'Time until your next tiffin',
      icon: Clock,
    },
    {
      label: 'Total Orders',
      value: String(orders.length),
      hint: 'All orders placed so far',
      icon: ShoppingBag,
    },
    {
      label: 'Monthly Spend',
      value: `PKR ${getMonthlySpend().toLocaleString()}`,
      hint: 'Verified payments this month',
      icon: Wallet,
    },
    {
      label: 'Plan Status',
      value: activeSub ? (activeSub.status === 'paused' ? 'Paused Plan' : planName) : 'No Plan',
      hint: hasActivePlan ? 'Your active subscription' : 'Subscribe to get started',
      icon: Sparkles,
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStatIndex((prev) => (prev + 1) % mobileHeroStats.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [mobileHeroStats.length])

  const getTimelineSteps = () => {
    const status = effectiveStatus
    const isConfirmed = true
    const isPreparing = ['Preparing', 'Picked Up', 'Nearby', 'Delivered'].includes(status)
    const isOntheWay = ['Picked Up', 'Nearby', 'Delivered'].includes(status)
    const isDelivered = status === 'Delivered'
    
    return [
      { label: 'Confirmed', active: isConfirmed },
      { label: 'In Kitchen', active: isPreparing },
      { label: 'On the Way', active: isOntheWay },
      { label: 'Delivered', active: isDelivered }
    ]
  }

  const nextMealName = activeOrder 
    ? (Array.isArray(activeOrder.items) ? activeOrder.items.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ') : 'Custom Meal')
    : (activeSub?.preferenceMealCategory === 'balanced' ? 'Balanced Veg & Grain Special' : 'Sindhi Chicken Biryani (Single Serving)')

  const nextMealDesc = activeOrder 
    ? `Portion: ${activeOrder.items[0]?.portion || 'Regular portion'} | Status: ${activeOrderStatus || activeOrder.status}`
    : (activeSub?.status === 'paused'
        ? 'Your subscription is paused. Deliveries are suspended.'
        : 'Sides: Roti, Fresh Mint Raita, Seasonal Salad')

  if (loading) {
    return <OverviewSkeleton />
  }

  return (
    <div className="w-full">
      <style>{`
        @keyframes progress-flow {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-progress-flow {
          background: linear-gradient(90deg, #065F46 0%, #10B981 50%, #065F46 100%);
          background-size: 200% 100%;
          animation: progress-flow 1.5s linear infinite;
        }
      `}</style>

      {/* ─── DESKTOP VIEW ─── */}
      <div className="hidden md:flex flex-col gap-8 text-left w-full px-1 pb-12">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">Assalam-o-Alaikum, {user?.name?.split(' ')[0] || 'User'}! 👋</h1>
            <p className="text-xs sm:text-sm text-gray-550 font-medium">Here is your Home Tiffin overview for today.</p>
          </div>
          {!hasActivePlan && (
            <Link to="/dashboard/subscription">
              <Button variant="primary" className="rounded-2xl font-bold px-6 py-3 shadow-subtle">
                Browse Subscription Plans
              </Button>
            </Link>
          )}
        </div>

        {/* ── TOP STATS ROW (4 CARDS) ── */}
        <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-4 pb-2 snap-x snap-mandatory scrollbar-none">
          {/* Card 1: Next Delivery */}
          <Card className="border border-gray-100 bg-white !p-5 hover:shadow-subtle transition-all duration-300 rounded-2xl shrink-0 w-[200px] sm:w-[240px] lg:w-auto snap-start" hoverable={false}>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Next Delivery</span>
            <span className="text-xl font-black text-text-dark mt-1 block font-mono">
              {hasActivePlan ? (
                `${formatNumber(timeLeft.hours)}h ${formatNumber(timeLeft.minutes)}m`
              ) : (
                '—'
              )}
            </span>
          </Card>

          {/* Card 2: Total Orders */}
          <Card className="border border-gray-100 bg-white !p-5 hover:shadow-subtle transition-all duration-300 rounded-2xl shrink-0 w-[200px] sm:w-[240px] lg:w-auto snap-start" hoverable={false}>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Orders</span>
            <span className="text-xl font-black text-text-dark mt-1 block">
              {orders.length}
            </span>
          </Card>

          {/* Card 3: Spend */}
          <Card className="border border-gray-100 bg-white !p-5 hover:shadow-subtle transition-all duration-300 rounded-2xl shrink-0 w-[200px] sm:w-[240px] lg:w-auto snap-start" hoverable={false}>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Monthly Spend</span>
            <span className="text-xl font-black text-primary mt-1 block truncate">
              PKR {getMonthlySpend()}
            </span>
          </Card>

          {/* Card 4: Active Plan */}
          <Card className="border border-gray-100 bg-white !p-5 hover:shadow-subtle transition-all duration-300 rounded-2xl shrink-0 w-[200px] sm:w-[240px] lg:w-auto snap-start" hoverable={false}>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Plan Status</span>
            <span className="text-base font-black text-text-dark mt-1 block truncate">
              {activeSub ? (activeSub.status === 'paused' ? 'Paused Plan' : planName) : 'No Plan'}
            </span>
          </Card>
        </div>

        {/* ── LOWER SECTION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT / CENTER: Active Details & History */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {activeSub || activeOrder ? (
              <div className="flex flex-col gap-6">
                {/* Today's Tiffin Delivery Status Card */}
                <Card className="!p-6 border border-gray-100 bg-white shadow-sm rounded-2xl" hoverable={false}>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Today's Delivery</span>
                      <h2 className="text-lg font-black text-text-dark mt-0.5">{activeOrder ? nextMealName : (activeSub?.preferenceMealCategory ? `${activeSub.preferenceMealCategory.charAt(0).toUpperCase() + activeSub.preferenceMealCategory.slice(1)} Tiffin` : 'Scheduled Tiffin')}</h2>
                    </div>
                    <Badge variant={getStatusBadgeVariant(effectiveStatus)}>
                      {effectiveStatus === 'Delivered' ? 'Delivered' : (isInSlot ? effectiveStatus : 'Scheduled')}
                    </Badge>
                  </div>

                  {/* Delivery Time & Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 rounded-xl p-4 mb-6">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Estimated Delivery</span>
                      <span className="text-xs font-bold text-text-dark mt-0.5 block">
                        {activeSub?.preferenceDeliveryTime === 'dinner' ? 'Dinner Slot (7:30 PM - 9:00 PM)' : 'Lunch Slot (12:30 PM - 2:00 PM)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Portion Size</span>
                      <span className="text-xs font-bold text-text-dark mt-0.5 block">
                        {activeOrder?.items?.[0]?.portion || 'Standard (500g)'}
                      </span>
                    </div>
                  </div>

                  {/* Tracking Progress Stepper */}
                  {showTracking && (
                    <div className="py-2 mb-2">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-xs font-bold text-gray-450 uppercase tracking-wider">Tiffin Tracking</span>
                        <Link to={activeOrder ? `/dashboard/tracking?orderId=${activeOrder.id}` : "/dashboard/tracking"} className="text-xs font-bold text-primary hover:underline">
                          Live Tracking Map →
                        </Link>
                      </div>
                      
                      <div className="relative flex items-center justify-between w-full px-2 sm:px-6">
                        {/* Background Progress Line */}
                        <div className="absolute left-6 right-6 top-4 h-0.5 bg-gray-100 -translate-y-1/2" />
                        
                        {/* Filled Progress Line */}
                        <div 
                          className={`absolute left-6 top-4 h-0.5 -translate-y-1/2 transition-all duration-500 ${
                            effectiveStatus !== 'Delivered' ? 'animate-progress-flow' : 'bg-primary'
                          }`}
                          style={{
                            width: 
                              effectiveStatus === 'Delivered' ? 'calc(100% - 3rem)' :
                              ['Picked Up', 'Nearby'].includes(effectiveStatus) ? '66%' :
                              effectiveStatus === 'Preparing' ? '33%' : '0%'
                          }}
                        />

                        {/* Step Nodes */}
                        {getTimelineSteps().map((step, idx) => (
                          <div key={idx} className="flex flex-col items-center relative z-10">
                            {/* Node Circle */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative ${
                              step.active
                                ? 'bg-primary border-primary text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-300'
                            }`}>
                              {/* Radar Ping Ripple Effect for active step */}
                              {step.active && step.label !== 'Delivered' && (
                                <span className="absolute inset-0 rounded-full bg-emerald-450/20 animate-ping" />
                              )}
                              {step.active ? (
                                <span className="text-[10px] font-black">✓</span>
                              ) : (
                                <div className="w-2.5 h-2.5 rounded-full bg-white relative z-10" />
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-gray-450 mt-2 uppercase tracking-wide">{step.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inside Kitchen / Menu details */}
                  <div className="mt-4 border-t border-gray-100 pt-4 flex flex-col gap-2.5">
                    <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Today's Menu Details</p>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      {nextMealDesc}
                    </p>
                  </div>
                </Card>

                {/* Plan Progress Card */}
                {hasActivePlan && (
                  <Card className="p-6 border border-emerald-50 bg-[#F9FBF9] rounded-2xl" hoverable={false}>
                    <div className="flex items-end justify-between mb-3.5">
                      <div>
                        <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Tiffin Plan Progress</span>
                        <h4 className="font-black text-text-dark text-base mt-1">
                          {`${completedMeals} meals delivered`}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-black text-primary leading-none">{completedMeals}</span>
                        <span className="text-xs font-bold text-gray-400 ml-1">/ {totalMeals}</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-150 h-3 rounded-full overflow-hidden border border-emerald-100/50">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-700" 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 font-semibold mt-2.5">
                      {activeSub.mealsRemaining} tiffins remaining in your current cycle.
                    </p>
                  </Card>
                )}
              </div>
            ) : (
              /* If No active subscription / order details */
              <Card className="p-8 text-center bg-gray-50 border border-gray-150 rounded-2xl flex flex-col items-center justify-center gap-4" hoverable={false}>
                <div className="max-w-md">
                  <h3 className="text-lg font-black text-text-dark tracking-tight">No Active Program</h3>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-2">
                    You aren't subscribed to any recurring meal plan at the moment. Subscribe to a plan and get healthy fresh meals delivered daily!
                  </p>
                </div>
                <Link to="/dashboard/subscription" className="mt-2">
                  <Button variant="primary" className="rounded-xl px-5 py-2.5 font-bold text-xs uppercase tracking-wider">
                    Browse Plans
                  </Button>
                </Link>
              </Card>
            )}

            {/* Recent Orders Table */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="font-extrabold text-text-dark text-base tracking-tight">Recent Orders Log</h3>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {orders.length} Placed
                </span>
              </div>
              
              <div className="flex flex-col gap-4">
                {orders.slice(0, 5).map((order) => {
                  const itemsStr = Array.isArray(order.items)
                    ? order.items.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ')
                    : 'Tiffin Meal'
                  return (
                    <Card key={order.id} className="border border-gray-100 bg-white hover:translate-y-0.5 transition-all p-5 rounded-2xl flex items-center justify-between gap-4 text-left shadow-xs" hoverable={false}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-text-dark">{order.orderNumber}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase border border-slate-200">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-555 font-semibold truncate mt-0.5">{itemsStr}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] text-gray-400 font-bold">Ordered:</span>
                          <span className="text-[10px] bg-emerald-50 text-primary font-extrabold px-2 py-0.5 rounded border border-emerald-100/50">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-sm font-black text-primary">PKR {order.billingTotal}</span>
                      </div>
                    </Card>
                  )
                })}
                {orders.length === 0 && !loading && (
                  <p className="text-gray-450 py-6 text-center text-sm font-medium">
                    No orders placed yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Delivery Preferences & Daily Tips */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Delivery Configuration Address Card */}
            <Card className="p-6 border border-gray-100 bg-white shadow-sm rounded-2xl" hoverable={false}>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <h3 className="font-extrabold text-text-dark text-base">Delivery Info</h3>
                <button
                  onClick={openEditModal}
                  className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer border border-emerald-100"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
              </div>
              
              <div className="flex flex-col gap-4 text-xs font-semibold text-gray-655">
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Full Name</span>
                  <span className="text-text-dark font-bold text-xs leading-relaxed">
                    {user?.name || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Delivery Address</span>
                  <span className="text-text-dark font-bold text-xs leading-relaxed">
                    {user?.savedAddresses?.[0]?.address || user?.address || 'Not set'}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Delivery Slot</span>
                  <span className="text-text-dark font-bold text-xs">
                    {activeSub?.preferenceDeliveryTime === 'dinner' ? 'Dinner (7:30 PM - 9:00 PM)' : 'Lunch (12:30 PM - 2:00 PM)'}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Contact Phone</span>
                  <span className="text-text-dark font-bold text-xs">{user?.phone || 'Not provided'}</span>
                </div>

                {activeSub && (
                  <div className="mt-2 pt-4 border-t border-gray-100">
                    <Link to="/dashboard/subscription" className="w-full">
                      <Button variant="outline" size="sm" className="w-full text-xs py-2.5 font-bold flex items-center justify-center gap-1 rounded-xl">
                        Manage Subscription
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>

            {/* Daily Hygiene Check Badge */}
            <Card className="p-5 border border-emerald-50 bg-emerald-50/20 rounded-2xl flex flex-col gap-2" hoverable={false}>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full w-fit">
                Hygiene Promise
              </span>
              <h4 className="font-black text-text-dark text-sm mt-1">Insulated thermal canisters</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Tiffins are packed in high-grade insulated containers to preserve heat and freshness.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* ─── MOBILE VIEW (Mockup Style) ─── */}
      <div className="md:hidden flex flex-col -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] bg-[#F4F6F5] text-left relative">
        {/* Header Block with Card Stack */}
        <div className="sticky top-[-16px] sm:top-[-24px] z-0 bg-gradient-to-br from-[#065F46] via-[#044e39] to-emerald-950 pt-10 pb-20 px-6 rounded-b-[40px] text-white overflow-hidden flex flex-col gap-6">
          {/* Background glowing bubbles */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-emerald-400/10 rounded-full blur-3xl" />

          {/* Header Title & Sub */}
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight">Overview Dashboard</h1>
              <p className="text-xs text-emerald-200/80 font-medium mt-1">Your daily meal log tracker</p>
            </div>
          </div>

          {/* Card Stack – auto-rotating stats */}
          <div className="relative h-44 mt-2 select-none overflow-visible">
            {/* Back peek – next card behind */}
            <motion.div
              key={`peek-${(activeStatIndex + 1) % mobileHeroStats.length}`}
              initial={{ opacity: 0.3, y: 14, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 0.55, y: 8, scale: 0.95, rotate: 1 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="absolute top-2 left-4 right-4 h-36 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm z-0 p-5 flex flex-col justify-end"
            >
              <p className="text-[9px] text-white/25 font-extrabold uppercase tracking-wider">
                {mobileHeroStats[(activeStatIndex + 1) % mobileHeroStats.length].label}
              </p>
            </motion.div>

            {/* Front card – active stat */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStatIndex}
                initial={{ opacity: 0, y: 28, scale: 0.88, rotate: 1.5 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, y: -32, scale: 0.94, rotate: -0.5 }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                className="absolute top-0 left-0 right-0 h-[152px] bg-gradient-to-tr from-white/15 to-white/5 border border-white/20 rounded-3xl backdrop-blur-lg shadow-xl p-5 flex flex-col justify-between z-10 text-left"
              >
                {(() => {
                  const stat = mobileHeroStats[activeStatIndex]
                  const Icon = stat.icon
                  return (
                    <>
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] text-emerald-200/80 font-extrabold uppercase tracking-wider">
                            {stat.label}
                          </p>
                          <h2 className="text-2xl font-black mt-1 tracking-tight truncate">
                            {stat.value}
                          </h2>
                        </div>
                        <Icon className="w-6 h-6 text-emerald-300 shrink-0" />
                      </div>
                      <div>
                        <p className="text-[9px] text-emerald-300/80 font-extrabold uppercase tracking-widest">
                          {stat.hint}
                        </p>
                        <div className="flex gap-1.5 mt-2.5">
                          {mobileHeroStats.map((_, i) => (
                            <span
                              key={i}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === activeStatIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/35'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* White Panel */}
        <div
          id="overview-panel"
          style={{
            borderTopLeftRadius: isPinned ? '0px' : '36px',
            borderTopRightRadius: isPinned ? '0px' : '36px',
          }}
          className="bg-white -mt-16 pt-0 px-5 pb-24 relative z-20 min-h-screen shadow-card flex flex-col gap-6 text-left transition-all duration-300"
        >
          {/* Sticky CTA container inside white panel */}
          <div
            style={{
              borderTopLeftRadius: isPinned ? '0px' : '36px',
              borderTopRightRadius: isPinned ? '0px' : '36px',
            }}
            className="sticky top-[-16px] sm:top-[-24px] z-30 bg-white pt-8 pb-4 flex flex-col gap-4 -mx-5 px-5 border-b border-slate-100 transition-all duration-300"
          >
            {!hasActivePlan && (
              <motion.div whileTap={{ scale: 0.98 }} className="w-full">
                <Link
                  to="/dashboard/subscription"
                  className="w-full bg-gradient-to-r from-[#046a38] to-primary hover:from-[#03522c] hover:to-emerald-800 text-white font-extrabold text-xs py-4 px-6 rounded-2xl shadow-subtle flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer transition-all duration-300"
                >
                  Browse Subscription Plans
                </Link>
              </motion.div>
            )}
          </div>

          {/* Tracking Progress Stepper */}
          {showTracking && (
            <Card className="!p-5 border border-emerald-100 bg-white rounded-2xl text-left" hoverable={false}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-450 uppercase tracking-wider">Tiffin Tracking</span>
                <Link to={activeOrder ? `/dashboard/tracking?orderId=${activeOrder.id}` : "/dashboard/tracking"} className="text-xs font-bold text-primary">
                  Live Map →
                </Link>
              </div>
              
              <div className="relative flex items-center justify-between w-full px-1">
                <div className="absolute left-4 right-4 top-3 h-0.5 bg-gray-100 -translate-y-1/2" />
                <div 
                  className={`absolute left-4 top-3 h-0.5 -translate-y-1/2 transition-all duration-500 ${
                    effectiveStatus !== 'Delivered' ? 'animate-progress-flow' : 'bg-primary'
                  }`}
                  style={{
                    width: 
                      effectiveStatus === 'Delivered' ? 'calc(100% - 2rem)' :
                      ['Picked Up', 'Nearby'].includes(effectiveStatus) ? '66%' :
                      effectiveStatus === 'Preparing' ? '33%' : '0%'
                  }}
                />

                {getTimelineSteps().map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center relative z-10">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all text-[9px] font-black ${
                      step.active ? 'bg-primary border-primary text-white' : 'bg-white border-gray-250 text-gray-300'
                    }`}>
                      {step.active ? '✓' : idx + 1}
                    </div>
                    <span className="text-[8px] font-black text-gray-500 mt-1 uppercase tracking-tight">{step.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Today's Tiffin details */}
          {(activeSub || activeOrder) && (
            <Card className="!p-5 border border-emerald-50 bg-[#F9FBF9] rounded-2xl text-left" hoverable={false}>
              <h4 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">Today's Menu Details</h4>
              <p className="text-xs font-bold text-text-dark leading-snug">{activeOrder ? nextMealName : (activeSub?.preferenceMealCategory ? `${activeSub.preferenceMealCategory.charAt(0).toUpperCase() + activeSub.preferenceMealCategory.slice(1)} Tiffin` : 'Scheduled Tiffin')}</p>
              <p className="text-[11px] text-gray-550 font-medium leading-relaxed mt-1">{nextMealDesc}</p>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-primary px-2.5 py-1.5 rounded-xl border border-emerald-100/60 text-[10px] font-bold mt-3">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                {getDeliverySlotLabel(activeSub?.preferenceDeliveryTime)}
              </span>
            </Card>
          )}

          {/* Delivery Preferences / Config */}
          <Card className="p-5 border border-gray-100 bg-white shadow-sm rounded-2xl text-left" hoverable={false}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
              <h3 className="font-extrabold text-text-dark text-sm">Delivery Info</h3>
              <button
                onClick={openEditModal}
                className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-xl transition-all cursor-pointer border border-emerald-100"
              >
                <Pencil className="w-2.5 h-2.5" />
                Edit
              </button>
            </div>
            
            <div className="flex flex-col gap-3 text-xs font-semibold text-gray-650">
              <div>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Full Name</span>
                <span className="text-text-dark font-bold text-xs">{user?.name || '—'}</span>
              </div>

              <div>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Delivery Address</span>
                <span className="text-text-dark font-bold text-xs leading-relaxed">{user?.savedAddresses?.[0]?.address || user?.address || 'Not set'}</span>
              </div>

              <div>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Delivery Slot</span>
                <span className="text-text-dark font-bold text-xs">
                  {activeSub?.preferenceDeliveryTime === 'dinner' ? 'Dinner (7:30 PM - 9:00 PM)' : 'Lunch (12:30 PM - 2:00 PM)'}
                </span>
              </div>

              <div>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Contact Phone</span>
                <span className="text-text-dark font-bold text-xs">{user?.phone || 'Not provided'}</span>
              </div>

              {activeSub && (
                <div className="mt-1 pt-3 border-t border-gray-100">
                  <Link to="/dashboard/subscription" className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-xs py-2 font-bold flex items-center justify-center gap-1 rounded-xl">
                      Manage Subscription
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Meal Progress (Mobile) */}
          {hasActivePlan && (
            <Card className="p-4 bg-[#F9FBF9] border border-emerald-100/35 rounded-2xl text-left" hoverable={false}>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">Meal Progress</p>
                  <p className="text-xs font-bold text-text-dark">{`${completedMeals} meals delivered`}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-primary leading-none">{completedMeals}</span>
                  <span className="text-xs font-bold text-gray-400 ml-0.5">/ {totalMeals}</span>
                </div>
              </div>
              <div className="w-full bg-gray-150 h-2.5 rounded-full overflow-hidden border border-emerald-100/50">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </Card>
          )}

          {/* Recent Orders List (Mobile) */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Recent Orders</h3>
              <span className="text-[10px] font-black text-gray-450 uppercase tracking-wider">
                {orders.length} Logged
              </span>
            </div>
            
            <div className="flex flex-col gap-3">
              {orders.slice(0, 5).map((order) => {
                const itemsStr = Array.isArray(order.items)
                  ? order.items.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ')
                  : 'Tiffin Meal'
                return (
                  <Card key={order.id} className="border border-emerald-50/50 bg-[#F9FBF9] hover:translate-y-0.5 p-4 rounded-2xl flex items-center justify-between gap-4 text-left shadow-xs" hoverable={false}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-text-dark">{order.orderNumber}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-semibold truncate mt-1">{itemsStr}</p>
                      <span className="text-[9px] bg-emerald-50 text-primary font-extrabold px-2 py-0.5 rounded border border-emerald-100/50 mt-1.5 inline-block">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-xs font-black text-primary">PKR {order.billingTotal}</span>
                    </div>
                  </Card>
                )
              })}
              {orders.length === 0 && !loading && (
                <p className="text-gray-450 py-6 text-center text-sm font-medium">No orders placed yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => !editSaving && setEditModalOpen(false)}
        title="Edit Profile"
        id="edit-profile-modal"
      >
        <form onSubmit={handleProfileSave} className="flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" /> Full Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Ali Hassan"
              required
              className="w-full px-4 py-3 rounded-2xl border border-emerald-100 bg-white text-gray-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-400"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Phone className="w-3 h-3" /> Contact Number
            </label>
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="e.g. 03xxxxxxxxx"
              className="w-full px-4 py-3 rounded-2xl border border-emerald-100 bg-white text-gray-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-400"
            />
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Delivery Address
            </label>
            <textarea
              rows={3}
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="e.g. Flat 5, Block B, Gulshan-e-Iqbal, Karachi"
              className="w-full px-4 py-3 rounded-2xl border border-emerald-100 bg-white text-gray-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none placeholder-gray-400"
            />
          </div>

          {/* Info note */}
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed bg-emerald-50/50 px-3 py-2.5 rounded-xl border border-emerald-100/50">
            Changes apply immediately to your profile and delivery info shown across the dashboard.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              disabled={editSaving}
              className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSaving}
              className="flex-1 py-3 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {editSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
