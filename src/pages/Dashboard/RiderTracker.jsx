import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useToastStore } from '../../store/toastStore'
import { Play, Square, Compass, Navigation, AlertCircle } from 'lucide-react'

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

  return (
    <div className="flex flex-col gap-8 text-left w-full max-w-2xl">
      <div>
        <h1 className="text-3xl font-black text-primary tracking-tight">Rider GPS Tracker Console</h1>
        <p className="text-sm text-gray-500">Log and broadcast your live delivery coordinates to customers and dispatch.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: Controller panel */}
        <div className="flex flex-col gap-6">
          <Card className="p-6 border border-emerald-100 bg-white flex flex-col gap-4" hoverable={false}>
            <h3 className="font-extrabold text-text-dark text-base pb-2 border-b border-emerald-50">GPS Controller</h3>
            
            <div className="text-xs">
              <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-2 block">
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
                  <AlertCircle className="w-5 h-5" />
                  <span>No active orders assigned to track.</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <Button
                variant="primary"
                onClick={toggleTracking}
                disabled={activeOrders.length === 0}
                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer ${
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
            </div>
          </Card>
        </div>

        {/* Right Side: GPS Diagnostics logs */}
        <div className="flex flex-col gap-6">
          <Card className="p-6 border border-emerald-100 bg-white flex flex-col h-[320px]" hoverable={false}>
            <h3 className="font-extrabold text-text-dark text-base pb-2 border-b border-emerald-50 mb-3 flex items-center gap-1.5">
              <Compass className="w-4.5 h-4.5 text-primary animate-spin" /> Diagnostics Log
            </h3>
            
            <div className="flex-1 overflow-y-auto bg-gray-50/50 border border-gray-150 rounded-2xl p-4 font-mono text-[10px] text-gray-500 flex flex-col gap-1.5 leading-relaxed text-left">
              {logText.length > 0 ? (
                logText.map((log, index) => (
                  <div key={index} className="truncate">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-400 italic text-center py-16">
                  Log is empty. Start tracking to initialize GPS signals.
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
