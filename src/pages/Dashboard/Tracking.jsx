import React, { useState, useEffect } from 'react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useToastStore } from '../../store/toastStore'
import { Phone, MapPin, User, Compass, CheckCircle2 } from 'lucide-react'
import io from 'socket.io-client'

export default function Tracking() {
  const { addToast } = useToastStore()
  
  // Real-time tracker coordinates
  const [riderCoords, setRiderCoords] = useState({ lat: 24.8607, lng: 67.0011 })
  const [orderStatus, setOrderStatus] = useState('Picked Up')
  const [eta, setEta] = useState('12 mins')

  // Socket.io integration
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
    const socket = io(socketUrl, { autoConnect: false })
    
    socket.connect()

    socket.on('connect', () => {
      console.log('Connected to socket servers')
    })

    socket.on('rider:location', (data) => {
      // Expect coordinates: { lat, lng }
      if (data && data.lat && data.lng) {
        setRiderCoords({ lat: data.lat, lng: data.lng })
        addToast('Rider location updated in real-time!', 'info')
      }
    })

    socket.on('order:status', (data) => {
      // Expect status: string
      if (data && data.status) {
        setOrderStatus(data.status)
        addToast(`Order is now: ${data.status}!`, 'success')
      }
    })

    // Simulated path movement for demonstration purposes
    let simIndex = 0
    const mockRoute = [
      { lat: 24.8607, lng: 67.0011, eta: '12 mins' },
      { lat: 24.8615, lng: 67.0045, eta: '9 mins' },
      { lat: 24.8625, lng: 67.0080, eta: '6 mins' },
      { lat: 24.8632, lng: 67.0112, eta: '3 mins' },
      { lat: 24.8607, lng: 67.0143, eta: 'Nearby' } // User destination
    ]

    const interval = setInterval(() => {
      if (simIndex < mockRoute.length) {
        const step = mockRoute[simIndex]
        setRiderCoords({ lat: step.lat, lng: step.lng })
        setEta(step.eta)
        if (step.eta === 'Nearby') {
          setOrderStatus('Nearby')
        }
        simIndex++
      } else {
        setOrderStatus('Delivered')
        clearInterval(interval)
      }
    }, 15000) // update every 15s

    return () => {
      socket.disconnect()
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex flex-col gap-8 text-left">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Live Delivery Tracking</h1>
        <p className="text-sm text-gray-500">Track your hot home-cooked meals from kitchen to doorstep.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tracking Map left (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="w-full h-[400px] rounded-3xl bg-gray-100 overflow-hidden relative shadow-subtle border border-emerald-100">
            {/* Fallback Google Maps iframe integration */}
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
                  <h4 className="font-bold text-text-dark text-sm">Rider: Shahrukh Khan</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Contact: +92 312 3456789</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  onClick={() => window.open('tel:+923123456789')}
                  className="flex items-center gap-1.5"
                >
                  <Phone className="w-4 h-4" /> Call Rider
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Delivery Progress Status Column Right (1/3 width) */}
        <div className="flex flex-col gap-6">
          <Card className="p-6 hover:translate-y-0 h-full flex flex-col gap-6" hoverable={false}>
            <h3 className="font-bold text-text-dark text-base pb-3 border-b border-emerald-50">Delivery Status</h3>
            
            <div className="flex items-center justify-between bg-background p-4 rounded-2xl border border-emerald-50">
              <span className="text-xs text-gray-500 font-semibold">Estimated Arrival</span>
              <span className="text-lg font-bold text-primary">{eta}</span>
            </div>

            {/* Timeline */}
            <div className="flex flex-col gap-6 border-l-2 border-emerald-100 pl-4 ml-2 my-2 flex-1">
              {[
                { label: 'Confirmed', time: '11:00 AM', active: true },
                { label: 'Preparing', time: '11:45 AM', active: orderStatus !== 'Pending' },
                { label: 'Picked Up', time: '12:30 PM', active: ['Picked Up', 'Nearby', 'Delivered'].includes(orderStatus) },
                { label: 'Nearby', time: '1:05 PM', active: ['Nearby', 'Delivered'].includes(orderStatus) },
                { label: 'Delivered', time: '1:10 PM', active: orderStatus === 'Delivered' }
              ].map((step, index) => (
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
