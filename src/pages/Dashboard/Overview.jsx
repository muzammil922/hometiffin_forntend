import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Calendar, CreditCard, ShoppingBag, Clock, Truck, Utensils, MapPin, CheckCircle2, Pause, ChevronRight } from 'lucide-react'
import api from '../../services/api'
import io from 'socket.io-client'
import { formatDate } from '../../services/dateFormatter'

export default function Overview() {
  const { user, fetchProfile } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [activeOrder, setActiveOrder] = useState(null)
  const [activeOrderStatus, setActiveOrderStatus] = useState('')
  const [loading, setLoading] = useState(true)

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

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Delivered': return 'success'
      case 'Preparing': return 'warning'
      case 'Picked Up': return 'accent'
      case 'Nearby': return 'accent'
      default: return 'primary'
    }
  }

  // Calculate monthly spent on verified orders
  const getMonthlySpend = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const monthlySum = orders
      .filter(o => {
        const orderDate = new Date(o.createdAt)
        return orderDate.getMonth() === currentMonth && 
               orderDate.getFullYear() === currentYear &&
               o.paymentStatus === 'verified'
      })
      .reduce((sum, o) => sum + o.billingTotal, 0)
    return monthlySum
  }

  const getTimelineSteps = () => {
    const status = activeOrderStatus || activeOrder?.status || 'Confirmed'
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
    return (
      <div className="flex flex-col gap-8 text-left w-full px-1 animate-pulse">
        {/* Welcome Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="h-9 bg-gray-200 rounded-lg w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-80"></div>
          </div>
        </div>

        {/* TOP STATS ROW (4 CARDS) */}
        <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-4 pb-2 snap-x snap-mandatory scrollbar-none">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 bg-white rounded-2xl border border-gray-100 flex flex-col gap-2 shrink-0 w-[200px] sm:w-[240px] lg:w-auto snap-start">
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-28 mt-1"></div>
            </div>
          ))}
        </div>

        {/* LOWER SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Today's Tiffin Skeleton */}
            <div className="p-6 bg-white rounded-2xl border border-gray-100 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="flex flex-col gap-2">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-16 bg-gray-55 rounded-xl"></div>
            </div>

            {/* Plan Progress Skeleton */}
            <div className="p-6 bg-white rounded-2xl border border-gray-100 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-5 bg-gray-200 rounded w-40"></div>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full mt-4"></div>
            </div>
          </div>

          {/* RIGHT Column Skeleton */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="p-6 bg-white rounded-2xl border border-gray-100 flex flex-col gap-4">
              <div className="pb-3 border-b border-gray-100">
                <div className="h-5 bg-gray-200 rounded w-28"></div>
              </div>
              <div className="flex flex-col gap-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="h-2.5 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 text-left w-full px-1 pb-12">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">Assalam-o-Alaikum, {user?.name?.split(' ')[0] || 'User'}! 👋</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Here is your Home Tiffin overview for today.</p>
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
        
        {/* Card 1: Active Plan */}
        <Card className="border border-gray-100 bg-white !p-5 hover:shadow-subtle transition-all duration-300 rounded-2xl shrink-0 w-[200px] sm:w-[240px] lg:w-auto snap-start" hoverable={false}>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Plan Status</span>
          <span className="text-base font-black text-text-dark mt-1 block truncate">
            {activeSub ? (activeSub.status === 'paused' ? 'Paused Plan' : planName) : 'No Plan'}
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

        {/* Card 4: Next Delivery */}
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
                    <h2 className="text-lg font-black text-text-dark mt-0.5">{activeOrder ? nextMealName : 'Scheduled Tiffin'}</h2>
                  </div>
                  <Badge variant={activeOrder ? getStatusBadgeVariant(activeOrderStatus) : 'primary'}>
                    {activeOrder ? activeOrderStatus : 'Scheduled'}
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

                {/* Tracking Progress Stepper (No cartoonish icons) */}
                {activeOrder && (
                  <div className="py-2 mb-2">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs font-bold text-gray-450 uppercase tracking-wider">Tiffin Tracking</span>
                      <Link to={`/dashboard/tracking?orderId=${activeOrder.id}`} className="text-xs font-bold text-primary hover:underline">
                        Live Tracking Map →
                      </Link>
                    </div>
                    
                    <div className="relative flex items-center justify-between w-full px-2 sm:px-6">
                      {/* Background Progress Line */}
                      <div className="absolute left-6 right-6 top-4 h-0.5 bg-gray-100 -translate-y-1/2" />
                      
                      {/* Filled Progress Line */}
                      <div 
                        className="absolute left-6 top-4 h-0.5 bg-primary -translate-y-1/2 transition-all duration-500"
                        style={{
                          width: 
                            activeOrderStatus === 'Delivered' ? 'calc(100% - 3rem)' :
                            ['Picked Up', 'Nearby'].includes(activeOrderStatus) ? '66%' :
                            activeOrderStatus === 'Preparing' ? '33%' : '0%'
                        }}
                      />

                      {/* Step Nodes */}
                      {getTimelineSteps().map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center relative z-10">
                          {/* Node Circle */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            step.active
                              ? 'bg-primary border-primary text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-300'
                          }`}>
                            {step.active && activeOrderStatus !== step.label ? (
                              <span className="text-[10px] font-black">✓</span>
                            ) : (
                              <div className={`w-2.5 h-2.5 rounded-full ${step.active ? 'bg-white animate-pulse' : 'bg-gray-350'}`} />
                            )}
                          </div>
                          {/* Step Label */}
                          <span className={`text-[10px] sm:text-xs font-bold mt-2 text-center ${
                            step.active ? 'text-text-dark font-extrabold' : 'text-gray-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Subscription Progress Card */}
              {activeSub && (
                <Card className="!p-6 border border-gray-100 bg-white shadow-sm rounded-2xl" hoverable={false}>
                  <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-100 mb-4">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Subscription Plan</span>
                      <h2 className="text-base font-black text-text-dark mt-0.5">{planName}</h2>
                    </div>
                    <span className="font-extrabold text-[11px] text-primary bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                      Renew date: {planRenewal}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center text-xs font-bold mb-2">
                      <span className="text-gray-500">Meal Progress</span>
                      <span className="text-primary">{completedMeals} / {totalMeals} Meals Completed</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 font-semibold mt-2.5 leading-relaxed">
                      {activeSub.status === 'paused'
                        ? `Plan is paused. You have ${activeSub.mealsRemaining} meals remaining.`
                        : `You have received ${completedMeals} of your ${totalMeals} meals. Delivery schedules are active.`}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            /* Invite Widget if No Plan */
            <Card className="p-8 border border-gray-150 bg-white flex flex-col items-center text-center gap-4 rounded-2xl" hoverable={false}>
              <div className="max-w-md">
                <h3 className="text-lg font-black text-text-dark">No Active Subscription</h3>
                <p className="text-xs text-gray-500 mt-1 font-semibold leading-relaxed">
                  Subscribe to a weekly or monthly tiffin plan to enjoy fresh home-cooked meals delivered daily to your doorstep.
                </p>
              </div>
              <Link to="/dashboard/subscription">
                <Button variant="primary" className="rounded-xl font-bold px-6 py-2.5 shadow-subtle bg-primary text-white">
                  Explore Subscription Plans
                </Button>
              </Link>
            </Card>
          )}

          {/* Recent Orders History List */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-text-dark tracking-tight">Recent Orders</h3>
              <Link to="/dashboard/orders" className="text-xs font-bold text-primary flex items-center gap-0.5 hover:underline">
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {orders.slice(0, 5).map((order) => {
                const itemsStr = Array.isArray(order.items)
                  ? order.items.map((i) => `${i.name} (Qty: ${i.quantity})`).join(', ')
                  : 'Tiffin Meal'
                return (
                  <Card 
                    key={order.id} 
                    className="flex flex-row items-center justify-between gap-4 !p-4 border border-gray-100 bg-white hover:border-gray-200 transition-all duration-200 rounded-2xl"
                    hoverable={true}
                  >
                    <div className="flex flex-col gap-1 text-left min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-text-dark">{order.orderNumber}</span>
                        <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 font-semibold truncate mt-0.5">{itemsStr}</p>
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
            <h3 className="font-extrabold text-text-dark text-base border-b border-gray-100 pb-3 mb-4">
              Delivery Info
            </h3>
            
            <div className="flex flex-col gap-4 text-xs font-semibold text-gray-650">
              <div>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Delivery Address</span>
                <span className="text-text-dark font-bold text-xs leading-relaxed">
                  {user?.savedAddresses?.[0]?.address || user?.address || 'Gulshan-e-Iqbal, Karachi'}
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
  )
}
