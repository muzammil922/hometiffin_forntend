import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useToastStore } from '../../store/toastStore'
import { QrCode, Wifi, WifiOff, LogOut, CheckCircle, RefreshCw } from 'lucide-react'

export default function WhatsAppConnector() {
  const { addToast } = useToastStore()
  const [status, setStatus] = useState('checking') // checking, connected, disconnected, error
  const [qrCode, setQrCode] = useState(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)

  const checkConnectionStatus = async () => {
    try {
      setStatus('checking')
      const res = await api.get('/admin/whatsapp/status')
      
      // Evolution Connection States: 'CONNECTED', 'DISCONNECTED', 'open', etc.
      const state = res.data?.instance?.state || res.data?.connectionState?.state || res.data?.state || 'DISCONNECTED'
      if (state === 'CONNECTED' || state === 'open') {
        setStatus('connected')
        setQrCode(null)
      } else {
        setStatus('disconnected')
      }
    } catch (err) {
      console.error(err)
      setStatus('disconnected') // default to disconnected if API instances are offline
    }
  }

  const generateQRCode = async () => {
    try {
      setLoadingQr(true)
      setQrCode(null)
      const res = await api.get('/admin/whatsapp/qr')
      
      const base64Qr = res.data?.base64 || res.data?.qrcode || res.data?.code
      if (base64Qr) {
        setQrCode(base64Qr)
      } else if (
        res.data?.message?.toLowerCase().includes('already connected') || 
        res.data?.message?.toLowerCase().includes('connected') ||
        res.data?.instance?.state === 'open'
      ) {
        addToast('WhatsApp is already connected!', 'success')
        setStatus('connected')
      } else {
        addToast(res.data?.message || 'QR Code not returned from WhatsApp server. Try again.', 'warning')
      }
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to fetch WhatsApp connection QR code.', 'error')
    } finally {
      setLoadingQr(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect WhatsApp from the backend? Message notifications will stop.')) {
      return
    }

    try {
      setLoadingAction(true)
      await api.post('/admin/whatsapp/disconnect')
      addToast('WhatsApp logged out successfully.', 'success')
      checkConnectionStatus()
    } catch (err) {
      addToast('Failed to disconnect WhatsApp.', 'error')
    } finally {
      setLoadingAction(false)
    }
  }

  useEffect(() => {
    checkConnectionStatus()
  }, [])

  // Auto-poll connection status while QR code is displayed
  useEffect(() => {
    let intervalId;
    
    const silentPoll = async () => {
      try {
        const res = await api.get('/admin/whatsapp/status')
        const state = res.data?.instance?.state || res.data?.connectionState?.state || res.data?.state || 'DISCONNECTED'
        if (state === 'CONNECTED' || state === 'open') {
          setStatus('connected')
          setQrCode(null)
          addToast('WhatsApp connected successfully!', 'success')
        }
      } catch (err) {
        // silent fail during polling
      }
    }

    if (qrCode && status !== 'connected') {
      intervalId = setInterval(silentPoll, 3000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [qrCode, status])

  return (
    <div className="flex flex-col gap-8 text-left w-full">
      <div>
        <h1 className="text-3xl font-black text-primary tracking-tight">Evolution WhatsApp Gateway</h1>
        <p className="text-sm text-gray-500">Connect the self-hosted WhatsApp instance to send automated customer notifications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: Connection Status Card */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <Card className="p-6 border border-emerald-100 bg-white" hoverable={false}>
            <h3 className="font-extrabold text-text-dark text-base pb-3 border-b border-emerald-50">Connection Status</h3>
            
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              {status === 'checking' && (
                <div className="flex flex-col items-center justify-center gap-4 w-full animate-pulse">
                  <div className="w-14 h-14 rounded-full bg-gray-200"></div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-5 bg-gray-200 rounded-lg w-28"></div>
                    <div className="h-3 bg-gray-200 rounded-lg w-36"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded-xl w-full mt-2"></div>
                </div>
              )}

              {status === 'connected' && (
                <>
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                    <Wifi className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 justify-center w-fit mx-auto">
                      <CheckCircle className="w-4 h-4" /> Connected
                    </span>
                    <p className="text-xs text-gray-400 font-semibold mt-2">Server notifications are active.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleDisconnect} 
                    isLoading={loadingAction}
                    className="mt-2 w-full py-2.5 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-2"
                  >
                    <WifiOff className="w-4 h-4" /> Disconnect Instance
                  </Button>
                </>
              )}

              {status === 'disconnected' && (
                <>
                  <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shadow-sm">
                    <WifiOff className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <span className="bg-rose-100 text-rose-800 font-bold text-xs px-3 py-1 rounded-full w-fit mx-auto block">
                      Disconnected
                    </span>
                    <p className="text-xs text-gray-400 font-semibold mt-2">WhatsApp is logged out.</p>
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={generateQRCode} 
                    isLoading={loadingQr}
                    className="mt-2 w-full py-2.5 rounded-xl bg-primary text-white flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" /> Generate Login QR
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="secondary"
              onClick={checkConnectionStatus}
              className="w-full mt-4 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Status
            </Button>
          </Card>
        </div>

        {/* Right Side: QR Code Display Panel (2/3 width) */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card className="p-6 sm:p-8 border border-emerald-100 bg-white min-h-[300px] flex flex-col justify-center items-center text-center" hoverable={false}>
            {loadingQr ? (
              <div className="flex flex-col items-center gap-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded-lg w-48 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded-lg w-64 mb-4"></div>
                <div className="p-4 bg-white border border-gray-150 rounded-3xl shadow-sm">
                  <div className="w-64 h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
                </div>
                <div className="w-36 h-10 bg-gray-200 rounded-xl mt-2"></div>
              </div>
            ) : qrCode ? (
              <div className="flex flex-col items-center gap-4">
                <h3 className="font-extrabold text-text-dark text-base">Scan QR Code via WhatsApp</h3>
                <p className="text-xs text-gray-500 max-w-sm">Open WhatsApp on your mobile, go to Linked Devices &rarr; Link a Device, and scan this QR code to log in.</p>
                <div className="p-4 bg-white border-2 border-emerald-100 rounded-3xl shadow-sm">
                  <img
                    src={qrCode.startsWith('data:image') ? qrCode : `data:image/png;base64,${qrCode}`}
                    alt="WhatsApp QR Link Code"
                    className="w-64 h-64 object-contain"
                  />
                </div>
                <Button variant="outline" onClick={generateQRCode} isLoading={loadingQr} className="py-2.5 px-6 text-xs">
                  Regenerate QR Code
                </Button>
              </div>
            ) : status === 'connected' ? (
              <div className="max-w-md">
                <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-black text-text-dark">Authentication Complete!</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Your WhatsApp account is securely connected to the Home Tiffin gateway. Automatic alerts are active for order placement, rider location updates, status modifications, and screenshot verifications.
                </p>
              </div>
            ) : (
              <div className="max-w-md">
                <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-black text-gray-400">QR Code Console</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Generate a QR code using the status panel to connect WhatsApp. Once connection is established, the scanned instance will automatically receive system alert messages.
                </p>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  )
}
