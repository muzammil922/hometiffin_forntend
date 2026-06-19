import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'
import { Phone, MapPin, User, Compass, CheckCircle2 } from 'lucide-react'
import io from 'socket.io-client'

export default function Tracking() {
  const { addToast } = useToastStore()
  const [searchParams] = useSearchParams()
  const orderIdParam = searchParams.get('orderId')

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [riderCoords, setRiderCoords] = useState({ lat: 24.8607, lng: 67.0011 })
  const [orderStatus, setOrderStatus] = useState('Confirmed')
  const [eta, setEta] = useState('Pending')

  const fetchActiveOrder = async () => {
    try {
      setLoading(true)
      let targetId = orderIdParam
      if (!targetId) {
        // Find latest active order
        const res = await api.get('/orders/my-orders')
        const active = res.data.find(o => !['Delivered'].includes(o.status))
        if (active) {
          targetId = active.id
        }
      }

      if (targetId) {
        const res = await api.get(`/orders/${targetId}`)
        setOrder(res.data)
        setOrderStatus(res.data.status)
        setRiderCoords({ lat: 24.8607, lng: 67.0011 })
      } else {
        setOrder(null)
      }
    } catch (err) {
      console.error('Failed to load tracking order:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveOrder()
  }, [orderIdParam])

  // Socket.io integration
  useEffect(() => {
    if (!order) return

    const token = useAuthStore.getState().token
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
    const socket = io(socketUrl, {
      autoConnect: false,
      query: { token }
    })
    
    socket.connect()

    socket.on('connect', () => {
      console.log('Tracking page socket connected')
      socket.emit('join_order', { orderId: order.id })
    })

    socket.on('rider:location', (data) => {
      if (data && data.lat && data.lng) {
        setRiderCoords({ lat: parseFloat(data.lat), lng: parseFloat(data.lng) })
        setEta('Nearby')
        addToast('Rider location updated in real-time!', 'info')
      }
    })

    socket.on('order:status', (data) => {
      if (data && data.status) {
        setOrderStatus(data.status)
        addToast(`Order is now: ${data.status}!`, 'success')
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [order])

  const getTimelineSteps = () => {
    const status = orderStatus || 'Confirmed'
    const isConfirmed = true
    const isPreparing = ['Preparing', 'Picked Up', 'Nearby', 'Delivered'].includes(status)
    const isOntheWay = ['Picked Up', 'Nearby', 'Delivered'].includes(status)
    const isNearby = ['Nearby', 'Delivered'].includes(status)
    const isDelivered = status === 'Delivered'
    
    return [
      { label: 'Confirmed', time: '11:00 AM', active: isConfirmed },
      { label: 'Preparing', time: '11:45 AM', active: isPreparing },
      { label: 'Picked Up', time: '12:30 PM', active: isOntheWay },
      { label: 'Nearby', time: '1:05 PM', active: isNearby },
      { label: 'Delivered', time: '1:10 PM', active: isDelivered }
    ]
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-8 text-left w-full animate-pulse">
        {/* Header Skeleton */}
        <div>
          <div className="h-8 bg-gray-200 rounded-lg w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-96"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tracking Map left skeleton (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="w-full h-[400px] rounded-3xl bg-gray-200 border border-gray-200 shadow-subtle animate-pulse"></div>

            {/* Rider Info Card skeleton */}
            <div className="p-6 bg-white rounded-3xl border border-gray-200 shadow-subtle">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gray-200 animate-pulse"></div>
                  <div className="flex flex-col gap-2">
                    <div className="h-4 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                  </div>
                </div>
                <div className="w-24 h-10 bg-gray-200 rounded-2xl animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Delivery Progress Status Column Right skeleton (1/3 width) */}
          <div className="flex flex-col gap-6">
            <div className="p-6 bg-white rounded-3xl border border-gray-200 shadow-subtle h-full flex flex-col gap-6">
              <div className="h-5 bg-gray-200 rounded-lg w-32 pb-3 border-b border-gray-100 animate-pulse"></div>
              
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="h-3 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
              </div>

              {/* Timeline skeleton */}
              <div className="flex flex-col gap-6 border-l-2 border-gray-100 pl-4 ml-2 my-2 flex-1">
                {[1, 2, 3, 4, 5].map((_, index) => (
                  <div key={index} className="relative">
                    <span className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-gray-200 bg-white" />
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
                      {index === 0 && <div className="h-3 bg-gray-200 rounded-lg w-12 animate-pulse"></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center text-left w-full">
        <div className="p-4 bg-emerald-50 rounded-full text-primary">
          <Compass className="w-12 h-12" />
        </div>
        <div className="max-w-md">
          <h2 className="text-xl font-black text-text-dark">No Active Delivery to Track</h2>
          <p className="text-sm text-gray-500 mt-2 font-semibold leading-relaxed">
            You don't have any ongoing deliveries right now. Once you order meals from our menu, you will be able to track your rider here in real-time.
          </p>
        </div>
        <Link to="/menu">
          <Button variant="primary" className="rounded-2xl font-bold px-8 py-3.5 shadow-subtle">
            Browse Menu Catalog
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 text-left w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Live Delivery Tracking ({order.orderNumber})</h1>
        <p className="text-sm text-gray-500">Track your hot home-cooked meals from kitchen to doorstep.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tracking Map left (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="w-full h-[400px] rounded-3xl bg-gray-100 overflow-hidden relative shadow-subtle border border-emerald-100">
            <iframe 
              src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15000!2d${riderCoords.lng}!3d${riderCoords.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1718335000000`} 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              title="Live Delivery Map"
            />
            {/* Visual overlay indicator */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-semibold text-text-dark shadow-subtle">
              <Compass className="w-4 h-4 text-primary animate-spin" />
              <span>Rider GPS coords: {riderCoords.lat.toFixed(4)}, {riderCoords.lng.toFixed(4)}</span>
            </div>
          </div>

          {/* Rider Info Card */}
          <Card className="p-6 hover:translate-y-0" hoverable={false}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-text-dark text-sm">
                    Rider: {order.rider?.name || 'Assigning Rider...'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Contact: {order.rider?.phone || 'Contact not loaded'}
                  </p>
                </div>
              </div>

              {order.rider?.phone && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="secondary" 
                    onClick={() => window.open(`tel:${order.rider.phone}`)}
                    className="flex items-center gap-1.5"
                  >
                    <Phone className="w-4 h-4" /> Call Rider
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Delivery Progress Status Column Right (1/3 width) */}
        <div className="flex flex-col gap-6">
          <Card className="p-6 hover:translate-y-0 h-full flex flex-col gap-6" hoverable={false}>
            <h3 className="font-bold text-text-dark text-base pb-3 border-b border-emerald-50">Delivery Status</h3>
            
            <div className="flex items-center justify-between bg-background p-4 rounded-2xl border border-emerald-50">
              <span className="text-xs text-gray-500 font-semibold">Estimated Arrival</span>
              <span className="text-lg font-bold text-primary">{eta === 'Nearby' ? 'Nearby' : (orderStatus === 'Delivered' ? 'Delivered' : '15-20 mins')}</span>
            </div>

            {/* Timeline */}
            <div className="flex flex-col gap-6 border-l-2 border-emerald-100 pl-4 ml-2 my-2 flex-1">
              {getTimelineSteps().map((step, index) => (
                <div key={index} className="relative">
                  <span className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center ${
                    step.active ? 'border-primary bg-primary' : 'border-gray-200'
                  }`} />
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${step.active ? 'text-text-dark' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                    {step.active && <span className="text-gray-400 font-semibold">{step.time}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
