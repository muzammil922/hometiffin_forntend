import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { Navigation, Phone, MapPin, CheckCircle, Package, Truck, Compass, AlertCircle, Clock } from 'lucide-react'
import io from 'socket.io-client'

export default function RiderOverview() {
  const { user } = useAuthStore()
  const { addToast } = useToastStore()
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const [orders, setOrders] = useState([])
  const [availableOrders, setAvailableOrders] = useState([])
  const [activeTab, setActiveTab] = useState('available') // 'available' or 'assigned'
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [acceptingId, setAcceptingId] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [visibleCount, setVisibleCount] = useState(10)
  const [isPinned, setIsPinned] = useState(false)
  const [activeStatIndex, setActiveStatIndex] = useState(0)

  // Cancel Order Modal states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState(null)

  // COD Completion Modal states
  const [isCodModalOpen, setIsCodModalOpen] = useState(false)
  const [codOrder, setCodOrder] = useState(null)
  const [collectedAmount, setCollectedAmount] = useState('')
  const [submittingCod, setSubmittingCod] = useState(false)

  // Complaint states
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false)
  const [complaintOrder, setComplaintOrder] = useState(null)
  const [complaintReason, setComplaintReason] = useState('')
  const [complaintDescription, setComplaintDescription] = useState('')
  const [submittingComplaint, setSubmittingComplaint] = useState(false)
  const [cancelOrder, setCancelOrder] = useState(false)

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

  const handleOpenComplaintModal = (order) => {
    setComplaintOrder(order)
    setComplaintReason('')
    setComplaintDescription('')
    setCancelOrder(false)
    setIsComplaintModalOpen(true)
  }

  const handleComplaintSubmit = async (e) => {
    e.preventDefault()
    if (!complaintReason || !complaintDescription) {
      addToast('Please fill in all fields.', 'warning')
      return
    }
    try {
      setSubmittingComplaint(true)
      await api.post('/complaints', {
        type: 'rider',
        orderId: complaintOrder.id,
        reason: complaintReason,
        description: complaintDescription,
        cancelOrder
      })
      addToast(cancelOrder ? 'Complaint submitted and order has been CANCELLED.' : 'Complaint submitted successfully to admin.', 'success')
      setIsComplaintModalOpen(false)
      fetchAssignedOrders(false)
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to submit complaint.', 'error')
    } finally {
      setSubmittingComplaint(false)
    }
  }

  const handleOpenCancelModal = (order) => {
    setOrderToCancel(order)
    setIsCancelModalOpen(true)
  }

  const handleCompleteDeliveryClick = (order) => {
    const isCod = order.paymentMethod?.toLowerCase() === 'cod' || order.paymentMethod?.toLowerCase() === 'cash on delivery';
    if (isCod) {
      setCodOrder(order)
      setCollectedAmount(order.billingTotal?.toString() || '')
      setIsCodModalOpen(true)
    } else {
      handleUpdateStatus(order.id, 'Delivered')
    }
  }

  const handleCodSubmit = async (e) => {
    e.preventDefault()
    if (!collectedAmount || isNaN(Number(collectedAmount)) || Number(collectedAmount) < 0) {
      addToast('Please enter a valid collected amount.', 'warning')
      return
    }
    try {
      setSubmittingCod(true)
      await api.put(`/rider/orders/${codOrder.id}/status`, {
        status: 'Delivered',
        codAmountCollected: Number(collectedAmount)
      })
      addToast('Delivery completed and COD amount recorded!', 'success')
      setIsCodModalOpen(false)
      fetchAssignedOrders(false)
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to complete delivery.', 'error')
    } finally {
      setSubmittingCod(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'available') {
      setVisibleCount(10)
    }
  }, [activeTab])

  const fetchAssignedOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const res = await api.get('/rider/orders')
      setOrders(res.data)
    } catch (err) {
      addToast('Failed to load assigned delivery orders.', 'error')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const fetchAvailableOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const res = await api.get('/rider/orders/available')
      setAvailableOrders(res.data)
    } catch (err) {
      addToast('Failed to load available orders.', 'error')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId)
      await api.put(`/rider/orders/${orderId}/status`, { status })
      addToast(`Order status updated to "${status}" successfully!`, 'success')
      fetchAssignedOrders(false)
    } catch (err) {
      addToast('Failed to update delivery status.', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleAcceptOrder = async (orderId) => {
    try {
      setAcceptingId(orderId)
      await api.post(`/rider/orders/${orderId}/accept`)
      addToast('Delivery accepted successfully!', 'success')
      setActiveTab('assigned')
      fetchAssignedOrders(true)
      fetchAvailableOrders(false)
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to accept delivery.', 'error')
    } finally {
      setAcceptingId(null)
    }
  }

  // Fetch initial data
  useEffect(() => {
    const initFetch = async () => {
      setLoading(true)
      await Promise.all([
        fetchAssignedOrders(false),
        fetchAvailableOrders(false)
      ])
      setLoading(false)
    }
    initFetch()
  }, [])

  // Socket.io integration for real-time dispatch alerts
  useEffect(() => {
    const token = useAuthStore.getState().token
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
    const socket = io(socketUrl, {
      autoConnect: false,
      query: { token }
    })

    socket.connect()

    socket.on('connect', () => {
      console.log('Rider overview socket connected')
    })

    socket.on('order:available', (newOrder) => {
      console.log('Real-time order available:', newOrder)
      addToast(`🔔 New Order Available: ${newOrder.orderNumber}!`, 'info')
      setAvailableOrders((prev) => {
        if (prev.some((o) => o.id === newOrder.id)) return prev
        return [newOrder, ...prev]
      })
    })

    socket.on('order:accepted', ({ orderId }) => {
      console.log('Real-time order accepted:', orderId)
      setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId))
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const awaitingPickupCount = orders.filter(o => o.status === 'Confirmed' || o.status === 'Preparing').length
  const inTransitCount = orders.filter(o => o.status === 'Picked Up').length
  const deliveringNearbyCount = orders.filter(o => o.status === 'Nearby').length
  const opportunitiesCount = availableOrders.length

  const mobileHeroStats = [
    {
      label: 'Awaiting Pickup',
      value: String(awaitingPickupCount),
      hint: 'Deliveries waiting to be picked up',
      icon: Package,
    },
    {
      label: 'In Transit',
      value: String(inTransitCount),
      hint: 'Deliveries currently on the road',
      icon: Truck,
    },
    {
      label: 'Delivering Nearby',
      value: String(deliveringNearbyCount),
      hint: 'Deliveries close to destination',
      icon: Compass,
    },
    {
      label: 'Opportunities',
      value: String(opportunitiesCount),
      hint: 'Available delivery orders to accept',
      icon: AlertCircle,
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStatIndex((prev) => (prev + 1) % mobileHeroStats.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [mobileHeroStats.length])

  if (loading) {
    return (
      <div className="flex flex-col gap-8 text-left w-full animate-pulse pb-20 max-w-6xl">
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded-2xl mb-2"></div>
          <div className="h-4 w-80 bg-gray-150 rounded-xl"></div>
        </div>

        {/* Skeleton Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 bg-white border border-emerald-50 rounded-3xl h-24 shadow-sm"></div>
          ))}
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-emerald-50 rounded-3xl h-80 p-5 flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 bg-gray-200 rounded-lg"></div>
                <div className="h-5 w-16 bg-gray-150 rounded-full"></div>
              </div>
              <div className="flex flex-col gap-3 my-4">
                <div className="h-4 w-32 bg-gray-105 rounded-md"></div>
                <div className="h-4 w-48 bg-gray-105 rounded-md"></div>
                <div className="h-4 w-28 bg-gray-105 rounded-md"></div>
              </div>
              <div className="h-10 w-full bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderOrderList = () => {
    if (activeTab === 'assigned') {
      return orders.length > 0 ? (
        orders.map((order) => (
          <Card key={order.id} className="border border-emerald-100 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between p-0 overflow-hidden rounded-3xl" hoverable={true}>
            {/* Header */}
            <div className="bg-emerald-50/10 px-5 py-4 border-b border-emerald-50/50 flex justify-between items-center">
              <span className="text-base font-black text-slate-800">{order.orderNumber}</span>
              <Badge variant={order.status === 'Picked Up' ? 'warning' : order.status === 'Nearby' ? 'warning' : 'primary'}>
                {order.status}
              </Badge>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 flex flex-col gap-4">
              {/* Customer Name */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-100/50">
                  {order.customerName ? order.customerName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Customer</p>
                  <p className="text-sm font-extrabold text-slate-800 leading-none mt-1">{order.customerName}</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50/40 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Delivery Address</p>
                  <p className="text-xs font-semibold text-gray-650 leading-relaxed mt-1">{order.customerAddress}</p>
                </div>
              </div>

              {/* Phone */}
              {order.customerPhone && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50/40 text-primary flex items-center justify-center shrink-0">
                    <Phone className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone Number</p>
                    <p className="text-xs font-extrabold text-gray-655 mt-1">{order.customerPhone}</p>
                  </div>
                </div>
              )}

              {/* Placed At */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50/40 text-primary flex items-center justify-center shrink-0">
                  <Clock className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Placed At</p>
                  <p className="text-xs font-semibold text-gray-655 mt-1 leading-none">{formatDate(order.createdAt)}</p>
                </div>
              </div>

              {/* Delivery Notes */}
              {order.deliveryInstructions && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 mt-1">
                  <p className="text-[9px] text-gray-450 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-gray-400" /> Delivery Notes
                  </p>
                  <p className="text-xs text-gray-605 font-medium leading-relaxed">{order.deliveryInstructions}</p>
                </div>
              )}
            </div>

            {/* Footer Action Panel */}
            <div className="px-5 pb-5 pt-0 flex flex-col gap-3">
              <div className="w-full border-t border-emerald-50/80 mb-2" />
              
              {(order.status === 'Confirmed' || order.status === 'Preparing') && (
                <Button
                  variant="primary"
                  onClick={() => handleUpdateStatus(order.id, 'Picked Up')}
                  isLoading={updatingId === order.id}
                  className="w-full py-3 rounded-2xl font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1.5 cursor-pointer text-sm animate-pulse"
                >
                  <Package className="w-4.5 h-4.5" /> Pick Up Tiffin
                </Button>
              )}

              {order.status === 'Picked Up' && (
                <Button
                  variant="primary"
                  onClick={() => handleUpdateStatus(order.id, 'Nearby')}
                  isLoading={updatingId === order.id}
                  className="w-full py-3 rounded-2xl font-bold bg-primary text-white flex items-center justify-center gap-1.5 cursor-pointer text-sm"
                >
                  <Navigation className="w-4.5 h-4.5 animate-pulse" /> Marked as Nearby
                </Button>
              )}

              {order.status === 'Nearby' && (
                <Button
                  variant="primary"
                  onClick={() => handleCompleteDeliveryClick(order)}
                  isLoading={updatingId === order.id}
                  className="w-full py-3 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 cursor-pointer text-sm"
                >
                  <CheckCircle className="w-4.5 h-4.5" /> Complete Delivery
                </Button>
              )}

              {/* Secondary Action Grid */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.open(`tel:${order.customerPhone}`)}
                  className="flex-1 py-2.5 rounded-2xl border-emerald-100 hover:bg-emerald-50/50 flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer text-gray-655"
                >
                  <Phone className="w-4 h-4 text-primary" /> Call Customer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenComplaintModal(order)}
                  className="flex-1 py-2.5 rounded-2xl border-rose-100 hover:bg-rose-50 flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 cursor-pointer"
                >
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" /> Report Customer
                </Button>
              </div>

              {order.hasComplaint && (
                <Button
                  variant="primary"
                  onClick={() => handleOpenCancelModal(order)}
                  className="w-full py-2.5 rounded-2xl font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow-sm"
                >
                  <AlertCircle className="w-4.5 h-4.5" /> Cancel Order
                </Button>
              )}
            </div>
          </Card>
        ))
      ) : (
        <Card className="p-8 text-center text-gray-400 col-span-full border border-gray-150 rounded-2xl" hoverable={false}>
          No active deliveries assigned to you at the moment. Good job!
        </Card>
      )
    } else {
      return availableOrders.length > 0 ? (
        <>
          {availableOrders.slice(0, visibleCount).map((order) => (
            <Card key={order.id} className="border border-emerald-100 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between p-0 overflow-hidden rounded-3xl" hoverable={true}>
              {/* Header */}
              <div className="bg-emerald-50/10 px-5 py-4 border-b border-emerald-50/50 flex justify-between items-center">
                <span className="text-base font-black text-slate-800">{order.orderNumber}</span>
                <Badge variant="primary">{order.status}</Badge>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col gap-4">
                {/* Address Area */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50/40 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Address Area</p>
                    <p className="text-xs font-semibold text-gray-600 leading-relaxed mt-1">{order.customerAddress}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50/40 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Package className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Order Items</p>
                    <p className="text-xs font-semibold text-gray-600 mt-1 leading-relaxed">
                      {Array.isArray(order.items) ? order.items.map(i => `${i.name} x${i.quantity}`).join(', ') : 'Meal'}
                    </p>
                  </div>
                </div>

                {/* Received At */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50/40 text-primary flex items-center justify-center shrink-0">
                    <Clock className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Received At</p>
                    <p className="text-xs font-semibold text-gray-600 mt-1 leading-none">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 pb-5 pt-0 flex flex-col gap-3">
                <div className="w-full border-t border-emerald-50/80 mb-2" />
                <Button
                  variant="primary"
                  onClick={() => handleAcceptOrder(order.id)}
                  isLoading={acceptingId === order.id}
                  className="w-full py-3 rounded-2xl font-bold bg-primary text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-subtle text-sm"
                >
                  <CheckCircle className="w-4.5 h-4.5" /> Accept Delivery
                </Button>
              </div>
            </Card>
          ))}

          {availableOrders.length > visibleCount && (
            <div 
              ref={(el) => {
                if (el) {
                  if (el.observer) el.observer.disconnect();
                  const observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting) {
                      setVisibleCount((prev) => Math.min(prev + 10, availableOrders.length));
                    }
                  }, { threshold: 0.1 });
                  observer.observe(el);
                  el.observer = observer;
                }
              }}
              className="py-6 text-center text-xs font-extrabold text-primary animate-pulse col-span-full"
            >
              Loading more opportunities...
            </div>
          )}
        </>
      ) : (
        <Card className="p-8 text-center text-gray-400 col-span-full border border-gray-150 rounded-2xl" hoverable={false}>
          No unassigned available orders in the system. Check back later!
        </Card>
      )
    }
  }

  return (
    <div className="w-full">
      {/* ─── DESKTOP VIEW ─── */}
      <div className="hidden md:flex flex-col gap-8 text-left w-full px-1 pb-12 max-w-6xl">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">Assalam-o-Alaikum, {user?.name?.split(' ')[0] || 'Rider'}! 👋</h1>
            <p className="text-xs sm:text-sm text-gray-555 font-medium">Here is your Rider dashboard overview for today.</p>
          </div>

          {/* Segmented Control for Opportunities vs Deliveries */}
          <div className="bg-emerald-50/50 p-1 rounded-2xl flex border border-emerald-100/50 shadow-sm shrink-0">
            <button
              onClick={() => {
                setActiveTab('available')
                fetchAvailableOrders(false)
              }}
              className={`py-2 px-6 rounded-xl font-extrabold text-xs cursor-pointer transition-all duration-200 ${
                activeTab === 'available'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Opportunities ({availableOrders.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('assigned')
                fetchAssignedOrders(false)
              }}
              className={`py-2 px-6 rounded-xl font-extrabold text-xs cursor-pointer transition-all duration-200 ${
                activeTab === 'assigned'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-550 hover:text-gray-800'
              }`}
            >
              My Deliveries ({orders.length})
            </button>
          </div>
        </div>

        {/* ── TOP STATS ROW (4 CARDS) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {/* Card 1: Awaiting Pickup */}
          <Card className="border border-gray-100 bg-white !p-5 hover:shadow-subtle transition-all duration-300 rounded-2xl" hoverable={false}>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Awaiting Pickup</span>
            <span className="text-xl font-black text-text-dark mt-1 block">
              {awaitingPickupCount}
            </span>
          </Card>

          {/* Card 2: In Transit */}
          <Card className="border border-gray-100 bg-white !p-5 hover:shadow-subtle transition-all duration-300 rounded-2xl" hoverable={false}>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">In Transit</span>
            <span className="text-xl font-black text-text-dark mt-1 block">
              {inTransitCount}
            </span>
          </Card>

          {/* Card 3: Delivering Nearby */}
          <Card className="border border-gray-100 bg-white !p-5 hover:shadow-subtle transition-all duration-300 rounded-2xl" hoverable={false}>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Delivering Nearby</span>
            <span className="text-xl font-black text-text-dark mt-1 block">
              {deliveringNearbyCount}
            </span>
          </Card>

          {/* Card 4: Opportunities */}
          <Card className="border border-gray-100 bg-white !p-5 hover:shadow-subtle transition-all duration-300 rounded-2xl" hoverable={false}>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Opportunities</span>
            <span className="text-xl font-black text-text-dark mt-1 block">
              {opportunitiesCount}
            </span>
          </Card>
        </div>

        {/* ── LOWER SECTION ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {renderOrderList()}
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
              <h1 className="text-2xl font-black tracking-tight">Rider Overview</h1>
              <p className="text-xs text-emerald-200/80 font-medium mt-1">Manage and complete deliveries</p>
            </div>
          </div>

          {/* Card Stack – auto-rotating stats */}
          <div className="relative h-44 mt-2 select-none overflow-visible">
            {/* Back peek */}
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

            {/* Front card */}
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
          {/* Sticky Tab Switcher inside panel */}
          <div
            style={{
              borderTopLeftRadius: isPinned ? '0px' : '36px',
              borderTopRightRadius: isPinned ? '0px' : '36px',
            }}
            className="sticky top-[-16px] sm:top-[-24px] z-30 bg-white pt-8 pb-4 flex flex-col gap-4 -mx-5 px-5 border-b border-slate-100 transition-all duration-300"
          >
            <div className="bg-emerald-50/50 p-1 rounded-2xl flex border border-emerald-100/50 w-full shadow-sm">
              <button
                onClick={() => {
                  setActiveTab('available')
                  fetchAvailableOrders(false)
                }}
                className={`flex-1 py-3.5 rounded-xl font-extrabold text-xs cursor-pointer transition-all duration-200 ${
                  activeTab === 'available'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-550 hover:text-gray-800'
                }`}
              >
                Opportunities ({availableOrders.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('assigned')
                  fetchAssignedOrders(false)
                }}
                className={`flex-1 py-3.5 rounded-xl font-extrabold text-xs cursor-pointer transition-all duration-200 ${
                  activeTab === 'assigned'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-550 hover:text-gray-800'
                }`}
              >
                My Deliveries ({orders.length})
              </button>
            </div>
          </div>

          {/* Render List under the tab */}
          <div className="flex flex-col gap-6">
            {renderOrderList()}
          </div>
        </div>
      </div>

      {/* ─── Rider Complaint Modal ─── */}
      <Modal 
        isOpen={isComplaintModalOpen} 
        onClose={() => setIsComplaintModalOpen(false)} 
        title={`Report Customer - Order ${complaintOrder?.orderNumber || ''}`}
      >
        <form onSubmit={handleComplaintSubmit} className="flex flex-col gap-4">
          <Input 
            label="Reason / Subject *" 
            placeholder="e.g. Customer unreachable / Misbehavior / Wrong Address" 
            value={complaintReason} 
            onChange={(e) => setComplaintReason(e.target.value)} 
            required 
          />
          <Input 
            label="Details *" 
            type="textarea"
            placeholder="Describe the issue in detail..." 
            value={complaintDescription} 
            onChange={(e) => setComplaintDescription(e.target.value)} 
            required 
          />
          <div className="flex items-center gap-3 bg-rose-50/40 border border-rose-100/50 p-4.5 rounded-2xl select-none cursor-pointer mt-1"
               onClick={() => setCancelOrder(!cancelOrder)}>
            <input 
              type="checkbox"
              id="cancelOrder"
              checked={cancelOrder}
              onChange={(e) => setCancelOrder(e.target.checked)}
              className="accent-primary w-4.5 h-4.5 shrink-0 rounded cursor-pointer"
            />
            <div className="text-left">
              <label htmlFor="cancelOrder" className="text-xs font-black text-rose-700 block cursor-pointer">
                Cancel Delivery Order?
              </label>
              <span className="text-[10px] text-gray-450 font-semibold block mt-0.5">
                Check this if you are unable to complete the delivery and need this order cancelled.
              </span>
            </div>
          </div>
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={submittingComplaint} 
            className="w-full py-3.5 mt-2 rounded-2xl font-bold bg-primary text-white cursor-pointer shadow-subtle"
          >
            Submit Report to Admin
          </Button>
        </form>
      </Modal>

      {/* ─── Cancel Order Confirmation Modal ─── */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirm Order Cancellation"
      >
        <div className="flex flex-col gap-4 text-left">
          <p className="text-sm text-gray-600 font-medium">
            Are you sure you want to cancel the delivery order <span className="font-extrabold text-primary">{orderToCancel?.orderNumber}</span>?
          </p>
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-xs text-rose-700 font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>
              This action cannot be undone. The customer and admin will be notified immediately of this cancellation.
            </span>
          </div>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsCancelModalOpen(false)}
              className="flex-1 py-3 rounded-2xl font-bold border-gray-250 hover:bg-gray-50 text-gray-700 cursor-pointer text-sm"
            >
              No
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  setCancellingId(orderToCancel.id)
                  await api.post(`/rider/orders/${orderToCancel.id}/cancel`)
                  addToast('Order has been CANCELLED successfully.', 'success')
                  setIsCancelModalOpen(false)
                  fetchAssignedOrders(false)
                } catch (err) {
                  addToast(err.response?.data?.error || 'Failed to cancel order.', 'error')
                } finally {
                  setCancellingId(null)
                }
              }}
              isLoading={cancellingId === orderToCancel?.id}
              className="flex-1 py-3 rounded-2xl font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-subtle text-sm"
            >
              Yes
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── COD Delivery Completion Modal ─── */}
      <Modal
        isOpen={isCodModalOpen}
        onClose={() => setIsCodModalOpen(false)}
        title="Complete COD Delivery"
      >
        <form onSubmit={handleCodSubmit} className="flex flex-col gap-4 text-left">
          <div className="bg-emerald-50/30 border border-emerald-100/50 p-4.5 rounded-2xl flex flex-col gap-2">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Customer Name</p>
              <p className="text-sm font-extrabold text-slate-800">{codOrder?.customerName}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Meal Name(s)</p>
              <p className="text-xs font-semibold text-gray-750">
                {Array.isArray(codOrder?.items) 
                  ? codOrder.items.map(i => `${i.name} x${i.quantity}`).join(', ') 
                  : 'Meal'}
              </p>
            </div>
            <div className="flex justify-between items-center border-t border-emerald-50/50 pt-2.5 mt-1">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Payment Method</p>
                <p className="text-xs font-extrabold text-slate-700">Cash on Delivery (COD)</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Amount</p>
                <p className="text-sm font-black text-primary">PKR {codOrder?.billingTotal}</p>
              </div>
            </div>
          </div>

          <Input
            label="Amount Collected (PKR) *"
            type="number"
            placeholder="Enter actual cash amount collected..."
            value={collectedAmount}
            onChange={(e) => setCollectedAmount(e.target.value)}
            required
            min="0"
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={submittingCod}
            className="w-full py-3.5 mt-2 rounded-2xl font-bold bg-primary text-white cursor-pointer shadow-subtle"
          >
            Confirm & Complete
          </Button>
        </form>
      </Modal>
    </div>
  )
}
