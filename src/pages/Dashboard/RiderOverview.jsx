import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { Navigation, Phone, MapPin, CheckCircle, Package, Truck, Compass } from 'lucide-react'
import io from 'socket.io-client'

export default function RiderOverview() {
  const { addToast } = useToastStore()
  const [orders, setOrders] = useState([])
  const [availableOrders, setAvailableOrders] = useState([])
  const [activeTab, setActiveTab] = useState('assigned') // 'assigned' or 'available'
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [acceptingId, setAcceptingId] = useState(null)

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

    // Listen for new available orders
    socket.on('order:available', (newOrder) => {
      console.log('Real-time order available:', newOrder)
      addToast(`🔔 New Order Available: ${newOrder.orderNumber}!`, 'info')
      setAvailableOrders((prev) => {
        if (prev.some((o) => o.id === newOrder.id)) return prev
        return [newOrder, ...prev]
      })
    })

    // Listen for orders accepted by other riders
    socket.on('order:accepted', ({ orderId }) => {
      console.log('Real-time order accepted:', orderId)
      setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId))
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-8 text-left w-full animate-pulse">
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded-2xl mb-2"></div>
          <div className="h-4 w-80 bg-gray-100 rounded-xl"></div>
        </div>
        <div className="flex flex-col gap-6 max-w-4xl">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-6 bg-white border border-emerald-100 rounded-3xl shadow-sm">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-28 bg-gray-200 rounded-xl"></div>
                    <div className="h-5 w-20 bg-gray-100 rounded-full"></div>
                  </div>
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="h-4 w-40 bg-gray-200 rounded-lg"></div>
                    <div className="h-4 w-64 bg-gray-100 rounded-lg"></div>
                    <div className="h-4 w-32 bg-gray-100 rounded-lg"></div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-full md:w-56">
                  <div className="h-10 w-full bg-amber-100 rounded-xl"></div>
                  <div className="h-10 w-full bg-gray-100 rounded-xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 text-left w-full">
      <div>
        <h1 className="text-3xl font-black text-primary tracking-tight">Rider Delivery Board</h1>
        <p className="text-sm text-gray-500">Manage and complete assigned tiffin deliveries across the city.</p>
      </div>

      {/* Tabs Row */}
      <div className="flex gap-4 border-b border-emerald-100 pb-3">
        <button
          onClick={() => {
            setActiveTab('assigned')
            fetchAssignedOrders(false)
          }}
          className={`pb-1 px-3 font-bold text-sm cursor-pointer transition-all border-b-2 ${
            activeTab === 'assigned'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          My Deliveries ({orders.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('available')
            fetchAvailableOrders(false)
          }}
          className={`pb-1 px-3 font-bold text-sm cursor-pointer transition-all border-b-2 ${
            activeTab === 'available'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Available Opportunities ({availableOrders.length})
        </button>
      </div>

      <div className="flex flex-col gap-6 max-w-4xl">
        {activeTab === 'assigned' ? (
          orders.length > 0 ? (
            orders.map((order) => (
              <Card key={order.id} className="p-6 border border-emerald-100 bg-white" hoverable={false}>
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  
                  {/* Left Side: Order & Client Details */}
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-text-dark">{order.orderNumber}</span>
                      <Badge variant={order.status === 'Picked Up' ? 'warning' : 'primary'}>
                        {order.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-gray-600 font-semibold flex flex-col gap-1.5 mt-1">
                      <div className="flex items-center gap-2 text-text-dark font-extrabold text-sm">
                        <span className="w-5 h-5 rounded-lg bg-emerald-50 text-primary flex items-center justify-center font-bold">U</span>
                        <span>{order.customerName}</span>
                      </div>

                      <div className="flex items-start gap-2 mt-1">
                        <MapPin className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{order.customerAddress}</span>
                      </div>

                      {order.customerPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4.5 h-4.5 text-primary shrink-0" />
                          <span>{order.customerPhone}</span>
                        </div>
                      )}
                    </div>

                    {order.deliveryInstructions && (
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-150 mt-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Delivery Notes</p>
                        <p className="text-xs text-gray-600 font-medium">{order.deliveryInstructions}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Action Panel */}
                  <div className="flex flex-col justify-center gap-3 w-full md:w-56 border-t md:border-t-0 md:border-l border-emerald-50 pt-4 md:pt-0 md:pl-6">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest text-center md:text-left">
                      Update Delivery State
                    </span>
                    
                    {order.status === 'Confirmed' && (
                      <Button
                        variant="primary"
                        onClick={() => handleUpdateStatus(order.id, 'Picked Up')}
                        isLoading={updatingId === order.id}
                        className="w-full py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1.5"
                      >
                        <Package className="w-4.5 h-4.5" /> Pick Up Tiffin
                      </Button>
                    )}

                    {order.status === 'Preparing' && (
                      <Button
                        variant="primary"
                        onClick={() => handleUpdateStatus(order.id, 'Picked Up')}
                        isLoading={updatingId === order.id}
                        className="w-full py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1.5"
                      >
                        <Package className="w-4.5 h-4.5" /> Pick Up Tiffin
                      </Button>
                    )}

                    {order.status === 'Picked Up' && (
                      <Button
                        variant="primary"
                        onClick={() => handleUpdateStatus(order.id, 'Nearby')}
                        isLoading={updatingId === order.id}
                        className="w-full py-2.5 rounded-xl font-bold bg-primary text-white flex items-center justify-center gap-1.5"
                      >
                        <Navigation className="w-4.5 h-4.5 animate-pulse" /> Marked as Nearby
                      </Button>
                    )}

                    {order.status === 'Nearby' && (
                      <Button
                        variant="primary"
                        onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                        isLoading={updatingId === order.id}
                        className="w-full py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4.5 h-4.5" /> Complete Delivery
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => window.open(`tel:${order.customerPhone}`)}
                      className="w-full py-2.5 rounded-xl border-emerald-100 hover:bg-emerald-50/50 flex items-center justify-center gap-1.5 text-xs font-bold"
                    >
                      <Phone className="w-4 h-4" /> Call Customer
                    </Button>
                  </div>

                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center text-gray-400" hoverable={false}>
              No active deliveries assigned to you at the moment. Good job!
            </Card>
          )
        ) : (
          availableOrders.length > 0 ? (
            availableOrders.map((order) => (
              <Card key={order.id} className="p-6 border border-emerald-100 bg-white" hoverable={false}>
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  
                  {/* Left Side: Order details */}
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-text-dark">{order.orderNumber}</span>
                      <Badge variant="primary">{order.status}</Badge>
                    </div>

                    <div className="text-xs text-gray-600 font-semibold flex flex-col gap-1.5 mt-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                        <span className="leading-relaxed">Address Area: {order.customerAddress}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-400 font-medium">
                        <span>Items: {Array.isArray(order.items) ? order.items.map(i => `${i.name} x${i.quantity}`).join(', ') : 'Meal'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Acceptance Panel */}
                  <div className="flex flex-col justify-center gap-3 w-full md:w-56 border-t md:border-t-0 md:border-l border-emerald-50 pt-4 md:pt-0 md:pl-6">
                    <Button
                      variant="primary"
                      onClick={() => handleAcceptOrder(order.id)}
                      isLoading={acceptingId === order.id}
                      className="w-full py-2.5 rounded-xl font-bold bg-primary text-white flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4.5 h-4.5" /> Accept Delivery
                    </Button>
                  </div>

                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center text-gray-400" hoverable={false}>
              No unassigned available orders in the system. Check back later!
            </Card>
          )
        )}
      </div>
    </div>
  )
}
