import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Calendar, CreditCard, ShoppingBag, Clock, Truck, Utensils, MapPin, CheckCircle2, Pause, ChevronRight } from 'lucide-react'
import api from '../../services/api'
import io from 'socket.io-client'

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
  const planRenewal = activeSub ? new Date(activeSub.endDate).toLocaleDateString() : 'N/A'

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
      { label: 'Confirmed', time: '11:00 AM', active: isConfirmed, icon: CheckCircle2 },
      { label: 'In Kitchen', time: '11:45 AM', active: isPreparing, icon: Utensils },
      { label: 'On the Way', time: '12:30 PM', active: isOntheWay, icon: Truck, pulse: ['Picked Up', 'Nearby'].includes(status) },
      { label: 'Delivered', time: '1:30 PM', active: isDelivered, icon: CheckCircle2 }
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 bg-white rounded-3xl border border-gray-150 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-200 animate-pulse"></div>
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-3 bg-gray-200 rounded-lg w-16 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded-lg w-28 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* LOWER SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT/CENTER column */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Active Plan Delivery Card Skeleton */}
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-gray-150 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="flex flex-col gap-2">
                  <div className="h-5 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded-lg w-28 animate-pulse"></div>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="h-3 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-36 animate-pulse"></div>
                </div>
              </div>

              {/* Next Meal Detail Block Skeleton */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="flex-1 flex flex-col gap-2 w-full animate-pulse">
                  <div className="h-4 bg-gray-200 rounded-lg w-24"></div>
                  <div className="h-5 bg-gray-200 rounded-lg w-56"></div>
                  <div className="h-3 bg-gray-200 rounded-lg w-36"></div>
                </div>
              </div>

              {/* Progress Tracking Progress Bar Skeleton */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <div className="h-3 bg-gray-200 rounded-lg w-36 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded-lg w-28 animate-pulse"></div>
                </div>
                <div className="w-full bg-gray-100 h-3.5 rounded-full"></div>
              </div>
            </div>

            {/* Recent Orders History List Skeleton */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-16 animate-pulse"></div>
              </div>

              <div className="flex flex-col gap-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-gray-150">
                    <div className="flex flex-col gap-2 text-left flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-4 bg-gray-200 rounded-lg w-20"></div>
                        <div className="h-5 bg-gray-200 rounded-lg w-16"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-lg w-48"></div>
                      <div className="h-3 bg-gray-200 rounded-lg w-24"></div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0">
                      <div className="flex flex-col gap-1 sm:items-end">
                        <div className="h-3 bg-gray-200 rounded-lg w-20"></div>
                        <div className="h-4 bg-gray-200 rounded-lg w-24"></div>
                      </div>
                      <div className="w-20 h-8 bg-gray-200 rounded-xl"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT Column Skeleton */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="p-6 bg-white rounded-3xl border border-gray-150 flex flex-col gap-4 animate-pulse">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                <div className="h-5 bg-gray-200 rounded-lg w-36"></div>
              </div>

              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-3 bg-gray-200 rounded-lg w-24 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hygiene promises card skeleton */}
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-150 flex flex-col gap-3 animate-pulse">
              <div className="w-24 h-5 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-40"></div>
              <div className="h-3 bg-gray-200 rounded-lg w-full"></div>
              <div className="h-3 bg-gray-200 rounded-lg w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 text-left w-full px-1">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Assalam-o-Alaikum, {user?.name || 'User'}!</h1>
          <p className="text-sm text-gray-500 font-medium">Here is your Home Tiffin overview for today.</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Active Plan */}
        <Card className="flex items-center gap-4 hover:translate-y-0.5 border border-emerald-50 bg-white" hoverable={false}>
          <div className="p-3.5 rounded-2xl text-emerald-600 bg-emerald-50">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">
              {activeSub?.status === 'paused' ? 'Paused Plan' : 'Active Plan'}
            </p>
            <p className="text-lg font-black text-text-dark">
              {activeSub ? (activeSub.status === 'paused' ? `${planName} (Paused)` : planName) : 'None'}
            </p>
          </div>
        </Card>

        {/* Card 2: Total Orders */}
        <Card className="flex items-center gap-4 hover:translate-y-0.5 border border-emerald-50 bg-white" hoverable={false}>
          <div className="p-3.5 rounded-2xl text-sky-600 bg-sky-50">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Total Orders</p>
            <p className="text-lg font-black text-text-dark">{orders.length}</p>
          </div>
        </Card>

        {/* Card 3: Spend */}
        <Card className="flex items-center gap-4 hover:translate-y-0.5 border border-emerald-50 bg-white" hoverable={false}>
          <div className="p-3.5 rounded-2xl text-amber-600 bg-amber-50">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Spend (Month)</p>
            <p className="text-lg font-black text-text-dark">PKR {getMonthlySpend()}</p>
          </div>
        </Card>

        {/* Card 4: Next Delivery */}
        <Card className="flex items-center gap-4 hover:translate-y-0.5 border border-emerald-50 bg-white" hoverable={false}>
          <div className="p-3.5 rounded-2xl text-rose-600 bg-rose-50">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Next Delivery</p>
            <p className="text-base font-black text-rose-700 tracking-tight font-mono mt-0.5">
              {hasActivePlan ? (
                `${formatNumber(timeLeft.hours)}h ${formatNumber(timeLeft.minutes)}m ${formatNumber(timeLeft.seconds)}s`
              ) : (
                'No Active Plan'
              )}
            </p>
          </div>
        </Card>

      </div>

      {/* ── LOWER SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT / CENTER: Active Details & History */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {activeSub || activeOrder ? (
            /* Active Plan Delivery Tracking & Completion details */
            <Card className="p-6 sm:p-8 border border-emerald-100 flex flex-col gap-6 bg-white relative overflow-hidden" hoverable={false}>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-50">
                <div>
                  <Badge variant={activeSub ? (activeSub.status === 'active' ? 'success' : 'warning') : 'success'} className="mb-2">
                    {activeSub ? (activeSub.status === 'active' ? 'Active Subscription' : 'Paused Subscription') : 'Active Order'}
                  </Badge>
                  <h3 className="text-xl font-black text-text-dark tracking-tight">{activeSub ? planName : 'Home Tiffin Delivery'}</h3>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">Renew date: {planRenewal}</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Today's Session</span>
                  <span className="text-sm font-bold text-primary">
                    {activeSub ? (activeSub.status === 'active' ? (activeSub.preferenceDeliveryTime === 'dinner' ? 'Dinner Slot (8:30 PM)' : 'Lunch Slot (1:30 PM)') : 'Paused') : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Next Meal Detail Block */}
              <div className="bg-[#F9FBF9] border border-emerald-100/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src="/biryanis.png"
                  alt="Today's Meal"
                  className="w-20 h-20 object-cover rounded-xl shadow-sm border border-emerald-100/80 bg-white"
                />
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                    {activeOrder ? 'Current Order Menu' : (activeSub.status === 'active' ? "Today's Plan Menu" : 'Plan Menu')}
                  </span>
                  <h4 className="font-extrabold text-text-dark text-base mt-1">{nextMealName}</h4>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{nextMealDesc}</p>
                </div>
              </div>

              {/* Visual Order Tracking Status */}
              {activeOrder && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Delivery Tracking Status</h4>
                    <Link to={`/dashboard/tracking?orderId=${activeOrder.id}`} className="text-xs font-bold text-primary hover:underline">
                      Open Live Tracking Map →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                    {getTimelineSteps().map((step, idx) => {
                      const StepIcon = step.icon;
                      return (
                        <div key={idx} className="bg-background rounded-xl p-3 border border-emerald-50/50 flex flex-col items-center justify-center text-center relative gap-1.5 shadow-sm">
                          <div className={`p-2 rounded-full ${
                             step.active 
                              ? 'bg-primary text-white' 
                              : 'bg-gray-100 text-gray-300'
                          } ${step.pulse ? 'animate-pulse' : ''}`}>
                            <StepIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${step.active ? 'text-text-dark' : 'text-gray-400'}`}>{step.label}</p>
                            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{step.time}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Plan Meals Progress Tracking */}
              {activeSub && (
                <div className="pt-2">
                  <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                    <span className="text-text-dark">Meal Completion Progress</span>
                    <span className="text-primary">{completedMeals} / {totalMeals} Meals Received</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden border border-emerald-50">
                    <div 
                      className="bg-gradient-to-r from-primary to-emerald-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1.5">
                    {activeSub.status === 'paused'
                      ? `Plan is paused. You have ${activeSub.mealsRemaining} meals remaining.`
                      : `You have enjoyed ${completedMeals} hot tiffins so far. Remaining ${activeSub.mealsRemaining} meals will be delivered as scheduled.`}
                  </p>
                </div>
              )}

            </Card>
          ) : (
            /* Invite Widget if No Plan */
            <Card className="p-8 border border-emerald-100 flex flex-col items-center justify-center text-center gap-5 bg-white" hoverable={false}>
              <div className="p-4 bg-emerald-50 rounded-full text-primary">
                <Utensils className="w-10 h-10" />
              </div>
              <div className="max-w-md">
                <h3 className="text-xl font-black text-text-dark">No Active Subscription</h3>
                <p className="text-sm text-gray-500 mt-2 font-semibold leading-relaxed">
                  You don't have a recurring meal subscription. Subscribe to Weekly or Monthly plans and enjoy hot, organic tiffins delivered daily to your doorstep.
                </p>
              </div>
              <Link to="/dashboard/subscription">
                <Button variant="primary" className="rounded-2xl font-bold px-8 py-3.5 shadow-subtle bg-primary text-white">
                  Explore Subscription Plans
                </Button>
              </Link>
            </Card>
          )}

          {/* Recent Orders History List */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-text-dark tracking-tight">Recent Orders</h3>
              <Link to="/dashboard/orders" className="text-xs font-bold text-primary flex items-center gap-0.5 hover:underline">
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-col gap-4">
              {orders.slice(0, 3).map((order) => {
                const itemsStr = Array.isArray(order.items)
                  ? order.items.map((i) => `${i.name} (Qty: ${i.quantity})`).join(', ')
                  : 'Tiffin Meal'
                return (
                  <Card 
                    key={order.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border border-emerald-50 bg-white hover:translate-y-0"
                    hoverable={false}
                  >
                    <div className="flex flex-col gap-1.5 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-dark">{order.orderNumber}</span>
                        <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 font-semibold truncate max-w-sm">{itemsStr}</p>
                      <p className="text-[10px] text-gray-400 font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-emerald-50 pt-4 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Total Amount</span>
                        <span className="text-sm font-bold text-primary">PKR {order.billingTotal}</span>
                      </div>
                      <Link to="/dashboard/orders">
                        <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                          Details
                        </Button>
                      </Link>
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
          <Card className="p-6 border border-emerald-100 bg-white" hoverable={false}>
            <div className="flex items-center gap-2.5 pb-3 border-b border-emerald-50">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="font-extrabold text-text-dark text-base">Delivery Preferences</h3>
            </div>
            
            <div className="flex flex-col gap-4 mt-4 text-xs font-semibold text-gray-600">
              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">Destination Address</p>
                <p className="text-text-dark leading-relaxed font-bold">
                  {user?.savedAddresses?.[0]?.address || user?.address || 'Gulshan-e-Iqbal, Karachi'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">Assigned Delivery Slot</p>
                <p className="text-text-dark font-bold">
                  {activeSub?.preferenceDeliveryTime === 'dinner' ? 'Dinner (7:30 PM - 9:00 PM)' : 'Lunch (12:30 PM - 2:00 PM)'}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">Contact Phone</p>
                <p className="text-text-dark font-bold">{user?.phone || 'Not provided'}</p>
              </div>

              {activeSub && (
                <div className="flex gap-2.5 mt-2 pt-2 border-t border-emerald-50/50">
                  <Link to="/dashboard/subscription" className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-[11px] py-2.5 font-bold flex items-center justify-center gap-1 rounded-xl">
                      Manage Subscription Plan
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Daily Hygiene Check Badge */}
          <Card className="p-6 border border-emerald-100 bg-emerald-50/30 flex flex-col gap-3" hoverable={false}>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full w-fit">Hygiene Promise</span>
            <h4 className="font-extrabold text-text-dark text-sm leading-snug">Insulated Thermal Packaging</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Every lunch and dinner tiffin box is packed in high-grade insulated thermal canisters to preserve heat, nutrition, and premium taste on its way to you.
            </p>
          </Card>

        </div>

      </div>

    </div>
  )
}
