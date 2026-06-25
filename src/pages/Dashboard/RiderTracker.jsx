import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { useToastStore } from '../../store/toastStore'
import { Play, Square, Compass, Navigation, AlertCircle, Phone, MapPin, User, Clock, Terminal } from 'lucide-react'

export default function RiderTracker() {
  const { addToast } = useToastStore()
  const [activeOrders, setActiveOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [isTracking, setIsTracking] = useState(false)
  const [coords, setCoords] = useState({ lat: 24.8607, lng: 67.0011 })
  const [logText, setLogText] = useState([])

  const fetchRiderOrders = async () => {
    try {
      const res = await api.get('/rider/orders')
      setActiveOrders(res.data)
      if (res.data.length > 0) {
        setSelectedOrderId(res.data[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchRiderOrders()
  }, [])

  // Tracking Simulation Loop
  useEffect(() => {
    let interval = null
    let localLat = coords.lat
    let localLng = coords.lng

    if (isTracking && selectedOrderId) {
      addToast('Live GPS Broadcasting Started!', 'info')
      setLogText((prev) => [`[${new Date().toLocaleTimeString()}] GPS Signal Lock - Active`, ...prev])

      interval = setInterval(async () => {
        // Mock slight movements in Karachi coordinates
        localLat += (Math.random() - 0.5) * 0.0015
        localLng += (Math.random() - 0.5) * 0.0015
        const currentCoords = { lat: localLat, lng: localLng }
        setCoords(currentCoords)

        try {
          await api.post('/rider/location', {
            orderId: selectedOrderId,
            lat: localLat,
            lng: localLng,
          })
          
          setLogText((prev) => [
            `[${new Date().toLocaleTimeString()}] Broadcasted: lat=${localLat.toFixed(5)}, lng=${localLng.toFixed(5)}`,
            ...prev,
          ])
        } catch (err) {
          setLogText((prev) => [
            `[${new Date().toLocaleTimeString()}] Connection Error - Retry Pending`,
            ...prev,
          ])
        }
      }, 8000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
        addToast('Live GPS Broadcasting Stopped.', 'warning')
      }
    }
  }, [isTracking, selectedOrderId])

  const toggleTracking = () => {
    if (!selectedOrderId) {
      addToast('Please select an active order to start tracking.', 'warning')
      return
    }
    setIsTracking(!isTracking)
  }

  const selectedOrder = activeOrders.find(o => o.id === selectedOrderId)

  return (
    <div className="flex flex-col gap-8 text-left w-full pb-16">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Rider GPS Tracker Console</h1>
        <p className="text-sm text-gray-500 font-medium">Log and broadcast your live delivery coordinates to customers and dispatch.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3 width) - Map & Customer Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="w-full h-[400px] rounded-3xl bg-gray-105 overflow-hidden relative shadow-subtle border border-emerald-100">
            <iframe 
              src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15000!2d${coords.lng}!3d${coords.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1718335000000`} 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              title="GPS Broadcaster Map"
            />
            {/* Visual overlay indicator */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-semibold text-text-dark shadow-subtle">
              <Compass className={`w-4 h-4 text-primary ${isTracking ? 'animate-spin' : ''}`} />
              <span>Broadcasting Coords: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
            </div>
          </div>

          {/* Selected Order Customer Info Card */}
          {selectedOrder ? (
            <Card className="p-6 hover:translate-y-0" hoverable={false}>
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="font-extrabold text-text-dark text-base">Customer Delivery Details</h3>
                  </div>
                  <Badge variant="primary">{selectedOrder.status}</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-gray-655">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Customer Name</span>
                    <span className="text-text-dark font-extrabold text-sm">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Delivery Address</span>
                    <span className="text-text-dark font-extrabold text-sm truncate" title={selectedOrder.customerAddress}>{selectedOrder.customerAddress}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Order Reference</span>
                    <span className="text-text-dark font-extrabold text-sm">{selectedOrder.orderNumber}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  {selectedOrder.customerPhone && (
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(`tel:${selectedOrder.customerPhone}`)}
                      className="flex items-center gap-1.5 py-2.5 rounded-2xl border-emerald-100 hover:bg-emerald-50 text-xs font-bold text-gray-655 cursor-pointer"
                    >
                      <Phone className="w-4 h-4 text-primary" /> Call Customer
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedOrder.customerAddress}`, '_blank')
                    }}
                    className="flex items-center gap-1.5 py-2.5 rounded-2xl border-emerald-100 hover:bg-emerald-50 text-xs font-bold text-gray-655 cursor-pointer"
                  >
                    <Navigation className="w-4 h-4 text-primary" /> Get Directions
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-gray-450 border border-gray-150 rounded-2xl" hoverable={false}>
              No active order selected. Select an order to view customer details.
            </Card>
          )}
        </div>

        {/* Right Column (1/3 width) - GPS Controls & Diagnostics */}
        <div className="flex flex-col gap-6">
          <Card className="p-6 hover:translate-y-0 h-full flex flex-col gap-6" hoverable={false}>
            <h3 className="font-bold text-text-dark text-base pb-3 border-b border-emerald-55">Broadcast Status</h3>
            
            {/* Order Selector */}
            <div className="text-xs">
              <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-2 block text-left">
                Select Active Order
              </label>
              {activeOrders.length > 0 ? (
                <select
                  value={selectedOrderId}
                  disabled={isTracking}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-emerald-50 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-semibold bg-gray-50 text-text-dark"
                >
                  {activeOrders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      {ord.orderNumber} - {ord.customerName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl p-3.5 text-rose-700">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span className="font-semibold text-xs">No active orders assigned to track.</span>
                </div>
              )}
            </div>

            {/* Broadcast Stepper Timeline */}
            <div className="flex flex-col gap-6 border-l-2 border-emerald-100 pl-4 ml-2 my-2 flex-1 text-xs">
              {/* Step 1: Order Selected */}
              <div className="relative text-left">
                <span className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                  selectedOrderId ? 'border-primary bg-primary' : 'border-gray-200'
                }`} />
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${selectedOrderId ? 'text-text-dark' : 'text-gray-400'}`}>
                    Active Order Selected
                  </span>
                  {selectedOrderId && (
                    <span className="text-primary font-bold">
                      {selectedOrder?.orderNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Step 2: GPS Signal Lock */}
              <div className="relative text-left">
                <span className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                  isTracking ? 'border-primary bg-primary' : 'border-gray-200'
                }`} />
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${isTracking ? 'text-text-dark' : 'text-gray-400'}`}>
                    GPS Signal Lock
                  </span>
                  {isTracking && (
                    <span className="text-emerald-500 font-bold animate-pulse">
                      SECURE
                    </span>
                  )}
                </div>
              </div>

              {/* Step 3: Stream Live coordinates */}
              <div className="relative text-left">
                <span className={`absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                  isTracking ? 'border-primary bg-primary' : 'border-gray-200'
                }`}>
                  {isTracking && (
                    <span className="absolute inset-0 rounded-full bg-emerald-450/40 animate-ping" />
                  )}
                </span>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${isTracking ? 'text-text-dark' : 'text-gray-400'}`}>
                    Broadcasting Live stream
                  </span>
                  {isTracking && (
                    <span className="text-primary font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> LIVE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Controller Button */}
            <Button
              variant="primary"
              onClick={toggleTracking}
              disabled={activeOrders.length === 0}
              className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-subtle ${
                isTracking 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                  : 'bg-primary hover:bg-primary-dark text-white'
              }`}
            >
              {isTracking ? (
                <>
                  <Square className="w-4.5 h-4.5" /> Stop GPS Broadcast
                </>
              ) : (
                <>
                  <Play className="w-4.5 h-4.5" /> Start Live Tracking
                </>
              )}
            </Button>

            {/* Diagnostics Logs Terminal Console */}
            <div className="flex flex-col gap-2 border-t border-emerald-50 pt-4">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> Diagnostics Log</span>
                {isTracking && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-sans">BROADCASTING</span>}
              </div>
              <div className="h-[120px] overflow-y-auto bg-gray-50/50 border border-gray-150 rounded-2xl p-4 font-mono text-[9px] text-gray-500 flex flex-col gap-1.5 leading-relaxed text-left">
                {logText.length > 0 ? (
                  logText.map((log, index) => (
                    <div key={index} className="truncate">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 italic text-center py-10">
                    Log is empty. Start tracking to initialize GPS signals.
                  </div>
                )}
              </div>
            </div>

          </Card>
        </div>
      </div>
    </div>
  )
}
