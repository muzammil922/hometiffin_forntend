import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'
import { Calendar, Utensils, X, Play, ChevronRight, Loader2, Upload, CheckCircle2, Phone, AlertCircle, Copy, QrCode, ChevronDown, ChevronUp, Sun, Moon, Leaf, ArrowLeft, Sparkles, UploadCloud, ShieldCheck, Check, Building2, User } from 'lucide-react'

export default function Subscription() {
  const { addToast } = useToastStore()
  const { user, fetchProfile } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Subscription state pulled from state
  const [subscription, setSubscription] = useState(null)

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState(null)

  // Purchase Form States
  const [purchasePlan, setPurchasePlan] = useState(null) // null, 'weekly', 'monthly'
  const [preferenceMealCategory, setPreferenceMealCategory] = useState('Balanced')
  const [preferenceDeliveryTime, setPreferenceDeliveryTime] = useState('lunch')
  const [paymentMethod, setPaymentMethod] = useState('meezan') // 'meezan', 'jazzcash'
  const [showManualDetails, setShowManualDetails] = useState(false)
  const [screenshot, setScreenshot] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Company Form States
  const [isCompany, setIsCompany] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [workerCount, setWorkerCount] = useState(1)

  const handleBackToPlans = () => {
    setPurchasePlan(null)
    setIsCompany(false)
    setCompanyName('')
    setContactName('')
    setContactPhone('')
    setContactEmail('')
    setCompanyAddress('')
    setWorkerCount(1)
    setScreenshot(null)
  }

  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (!subscription || subscription.status !== 'pending') return;

    const calculateTimeLeft = () => {
      const createdAt = new Date(subscription.createdAt).getTime();
      const now = new Date().getTime();
      const difference = (createdAt + 5 * 60 * 1000) - now;
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        loadSub();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [subscription]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Reset manual details accordion when payment method changes
  useEffect(() => {
    setShowManualDetails(false)
  }, [paymentMethod])

  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(true)

  const loadPlans = async () => {
    try {
      setPlansLoading(true)
      const res = await api.get('/subscriptions/plans')
      setPlans(res.data)
    } catch (err) {
      console.error('Failed to load subscription plans:', err)
      addToast('Failed to load subscription plans. Using defaults.', 'error')
      setPlans([
        { id: 'weekly', planType: 'weekly', price: 1800, totalMeals: 6, validityDays: 7 },
        { id: 'monthly', planType: 'monthly', price: 7000, totalMeals: 24, validityDays: 30 }
      ])
    } finally {
      setPlansLoading(false)
    }
  }

  const loadSub = async () => {
    try {
      setLoading(true)
      await fetchProfile() // refreshes user.subscriptions
      const sub = useAuthStore.getState().user?.subscriptions?.[0]
      setSubscription(sub || null)
    } catch (err) {
      console.error('Failed to load subscription:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSub()
    loadPlans()
  }, [])

  const handleStatusToggle = async () => {
    if (!subscription) return
    const newStatus = subscription.status === 'active' ? 'paused' : 'active'
    try {
      setUpdating(true)
      await api.put(`/subscriptions/${subscription.id}/status`, { status: newStatus })
      await fetchProfile()
      const updatedSub = useAuthStore.getState().user?.subscriptions?.[0]
      setSubscription(updatedSub || { ...subscription, status: newStatus })
      addToast(newStatus === 'active' ? 'Subscription resumed!' : 'Subscription paused.', 'success')
    } catch (err) {
      addToast('Failed to update subscription status.', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('File is too large. Max size is 5MB.', 'error')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshot(reader.result) // Base64 string
      };
      reader.readAsDataURL(file)
    }
  }

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text)
    addToast('Copied to clipboard!', 'success')
  }

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault()
    if (!screenshot) {
      addToast('Please upload payment screenshot proof.', 'error')
      return
    }

    try {
      setSubmitting(true)
      setIsConfirmModalOpen(true) // Open animated truck modal

      // Trigger API request in background
      const resPromise = api.post('/subscriptions', {
        planType: purchasePlan,
        preferences: {
          mealCategory: preferenceMealCategory,
          deliveryTime: preferenceDeliveryTime
        },
        paymentScreenshotUrl: screenshot,
        isCompany,
        companyName: isCompany ? companyName : undefined,
        contactName: isCompany ? contactName : undefined,
        contactPhone: isCompany ? contactPhone : undefined,
        contactEmail: isCompany ? contactEmail : undefined,
        companyAddress: isCompany ? companyAddress : undefined,
        workerCount: isCompany ? parseInt(workerCount, 10) : undefined
      })

      // Wait 7.5 seconds to let the truck animation play completely
      await new Promise((resolve) => setTimeout(resolve, 7500))

      const res = await resPromise

      addToast('Subscription request submitted successfully!', 'success')
      setSubscription(res.data)
      handleBackToPlans()
      await fetchProfile()
    } catch (err) {
      console.error(err)
      addToast(err.response?.data?.error || 'Failed to submit subscription request.', 'error')
    } finally {
      setIsConfirmModalOpen(false)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-8 text-left w-full animate-pulse">
        <div>
          <div className="h-8 bg-gray-200 rounded-lg w-56 mb-2" />
          <div className="h-4 bg-gray-200 rounded-lg w-80" />
        </div>
        <div className="p-8 bg-white rounded-3xl border border-gray-150 flex flex-col gap-6">
          <div className="flex justify-between gap-4 pb-6 border-b border-gray-100">
            <div className="flex gap-4 items-center">
              <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
              <div className="flex flex-col gap-2">
                <div className="h-5 bg-gray-200 rounded-lg w-40" />
                <div className="h-3 bg-gray-200 rounded-lg w-28" />
              </div>
            </div>
            <div className="w-24 h-10 bg-gray-200 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  // ── PENDING VERIFICATION STATE ──
  if (subscription && subscription.status === 'pending') {
    return (
      <div className="flex flex-col gap-8 text-left w-full max-w-6xl mx-auto px-4 py-6">
        <div>
          <h1 className="text-3xl font-black text-text-dark tracking-tight">My Subscription</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage your recurring tiffin meal plan status.</p>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Verification Message & Auto-Activation Timer */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-amber-100 p-8 sm:p-10 flex flex-col gap-8 justify-center items-center text-center shadow-card relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-200/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="p-5 bg-amber-50 rounded-full text-amber-500 animate-pulse border border-amber-100 w-fit mx-auto relative z-10 shadow-subtle">
                <AlertCircle className="w-12 h-12" />
              </div>
              <span className="absolute inset-0 rounded-full bg-amber-400/10 animate-ping opacity-75 scale-125 pointer-events-none" />
            </div>
            
            <div className="max-w-md">
              <h3 className="text-2xl sm:text-3xl font-black text-text-dark tracking-tight leading-tight">Payment Verification Pending</h3>
              <p className="text-sm text-gray-550 mt-3 font-semibold leading-relaxed">
                Thank you! We have received your payment proof for the <span className="text-primary capitalize font-bold">{subscription.planType} Tiffin Plan</span>.
              </p>
              <p className="text-xs text-gray-400 mt-2 font-medium leading-relaxed">
                Our operations team is currently validating your payment screenshot. Once approved, your subscription will be activated instantly and you will receive a WhatsApp confirmation.
              </p>
            </div>

            {/* Auto-Activation Countdown Box */}
            {timeLeft > 0 ? (
              <div className="flex flex-col items-center gap-3 border border-amber-150 bg-gradient-to-br from-amber-50/20 to-orange-50/10 p-6 rounded-2xl shadow-subtle w-full max-w-sm relative">
                <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider animate-pulse flex items-center gap-1">
                  ⏱️ Auto-Activation Countdown
                </span>
                <div className="text-4xl sm:text-5xl font-black text-amber-600 font-mono tracking-widest">{formatTime(timeLeft)}</div>
                <p className="text-[10px] text-gray-405 font-semibold">
                  Plan will automatically activate if not processed within 5 mins
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 border border-emerald-150 bg-emerald-50/20 px-6 py-4 rounded-2xl w-full max-w-sm shadow-subtle">
                <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider animate-pulse">⚡ Status Syncing</span>
                <p className="text-xs font-bold text-emerald-800">Auto-activation engaged. Enjoy your meals!</p>
              </div>
            )}
          </div>

          {/* Right Column: Plan Parameters, Uploaded Receipt & Actions */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-150 p-8 flex flex-col gap-6 justify-between shadow-card relative">
            <div>
              <h4 className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100/50 w-fit mb-4 uppercase tracking-wider">
                Plan Overview
              </h4>
              <div className="flex flex-col gap-3.5 border border-emerald-50 bg-[#F9FBF9] p-5 rounded-2xl w-full text-left">
                <div className="flex items-center gap-3 pb-3 border-b border-emerald-100/30">
                  <div className="p-2 bg-white rounded-lg border border-emerald-50 text-primary shadow-xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Plan Duration</p>
                    <p className="text-sm font-black text-text-dark capitalize">{subscription.planType} Subscription</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pb-3 border-b border-emerald-100/30">
                  <div className="p-2 bg-white rounded-lg border border-emerald-50 text-primary shadow-xs">
                    <Sun className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Preferred Delivery Slot</p>
                    <p className="text-sm font-black text-text-dark capitalize">
                      {subscription.preferenceDeliveryTime === 'dinner' ? '🌙 Dinner Slot (7:30 PM – 9:00 PM)' : '☀️ Lunch Slot (12:30 PM – 2:00 PM)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-emerald-50 text-primary shadow-xs">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Meal Category</p>
                    <p className="text-sm font-black text-text-dark capitalize">{subscription.preferenceMealCategory}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Preview */}
            {subscription.paymentScreenshotUrl && (
              <div className="flex flex-col items-center gap-3 p-5 bg-gray-50 border border-gray-150 rounded-2xl">
                <p className="text-[10px] font-extrabold text-gray-450 uppercase tracking-wider">Uploaded Payment Proof</p>
                <div className="border border-gray-250 rounded-xl overflow-hidden shadow-md bg-white hover:scale-[1.02] transition-transform duration-300 max-w-[200px] aspect-square flex items-center justify-center">
                  <img
                    src={subscription.paymentScreenshotUrl}
                    alt="Receipt proof"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setViewScreenshotUrl(subscription.paymentScreenshotUrl)}
                  />
                </div>
                <p className="text-[9px] text-gray-400 font-semibold">Click image to expand view</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <a href="https://wa.me/923113840943" target="_blank" rel="noopener noreferrer" className="w-full">
                <Button variant="primary" className="flex items-center justify-center gap-2 rounded-2xl py-4 font-black text-xs w-full cursor-pointer bg-gradient-to-r from-emerald-600 to-primary text-white hover:from-emerald-700 hover:to-emerald-800 shadow-md transform hover:-translate-y-0.5 transition-all">
                  <Phone className="w-4 h-4" />
                  Contact Support via WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── PURCHASE SUBSCRIPTION STATE ──
  if (purchasePlan) {
    const selectedPlanConfig = plans.find(p => p.planType === purchasePlan) || {
      price: purchasePlan === 'weekly' ? 1800 : 7000,
      discount: 0,
      totalMeals: purchasePlan === 'weekly' ? 6 : 24,
      validityDays: purchasePlan === 'weekly' ? 7 : 30
    }
    const discountAmount = selectedPlanConfig.discount || 0
    const totalWorkers = isCompany ? (parseInt(workerCount, 10) || 1) : 1
    const basePrice = Math.max(0, selectedPlanConfig.price - discountAmount)
    const finalPrice = basePrice * totalWorkers
    const planPrice = `PKR ${finalPrice.toLocaleString()}`
    const planDesc = isCompany
      ? `${selectedPlanConfig.totalMeals * totalWorkers} Total Meals (${selectedPlanConfig.totalMeals} days x ${totalWorkers} workers) delivered daily`
      : `${selectedPlanConfig.totalMeals} Meals (Lunch/Dinner) delivered daily for ${selectedPlanConfig.validityDays} days`
    const isWeekly = purchasePlan === 'weekly'

    return (
      <div className="flex flex-col gap-8 text-left w-full">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToPlans}
              className="rounded-2xl px-4 py-2.5 font-bold hover:bg-emerald-50 hover:text-primary transition-all border-gray-250 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-extrabold text-text-dark tracking-tight">Checkout Plan Setup</h1>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">Scan the QR code, transfer payment, and attach receipt to subscribe.</p>
            </div>
          </div>
        </div>

        {/* Form layout containing side-by-side panels */}
        <form onSubmit={handlePurchaseSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel: Send Payment Transfer */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Subscription Type Card */}
            <Card className="p-6 border border-emerald-100 bg-white rounded-3xl" hoverable={false}>
              <div className="flex items-center gap-2 border-b border-emerald-50 pb-3 mb-5">
                <h3 className="font-extrabold text-text-dark text-base">Subscription Type</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsCompany(false)}
                  className={`flex flex-col gap-2 p-5 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                    !isCompany
                      ? 'border-primary bg-emerald-50/15 shadow-sm ring-1 ring-primary/10'
                      : 'border-gray-150 hover:border-emerald-100 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${!isCompany ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-black text-text-dark">Individual Plan</span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-semibold leading-relaxed mt-1">
                    Deliveries for 1 person to your home or office address.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCompany(true)}
                  className={`flex flex-col gap-2 p-5 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                    isCompany
                      ? 'border-primary bg-emerald-50/15 shadow-sm ring-1 ring-primary/10'
                      : 'border-gray-150 hover:border-emerald-100 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${isCompany ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <span className="text-sm font-black text-text-dark font-sans flex items-center gap-1.5">
                      Corporate Plan / Tender
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-semibold leading-relaxed mt-1">
                    Subscribe on behalf of multiple workers. Meals delivered to your company address.
                  </p>
                </button>
              </div>
            </Card>

            {/* Company Details Form (conditionally shown) */}
            {isCompany && (
              <Card className="p-6 border border-emerald-100 bg-white rounded-3xl" hoverable={false}>
                <div className="flex items-center gap-2 border-b border-emerald-50 pb-3 mb-5">
                  <h3 className="font-extrabold text-text-dark text-base">Corporate Subscriber Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Google DeepMind"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-xs font-semibold bg-[#F9FBF9] text-text-dark focus:outline-none border border-emerald-100 focus:border-primary rounded-xl px-4 py-3"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Contact Person Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full text-xs font-semibold bg-[#F9FBF9] text-text-dark focus:outline-none border border-emerald-100 focus:border-primary rounded-xl px-4 py-3"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Contact Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +92 311 3840943"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full text-xs font-semibold bg-[#F9FBF9] text-text-dark focus:outline-none border border-emerald-100 focus:border-primary rounded-xl px-4 py-3"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Contact Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. corporate@company.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full text-xs font-semibold bg-[#F9FBF9] text-text-dark focus:outline-none border border-emerald-100 focus:border-primary rounded-xl px-4 py-3"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Company Delivery Address *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Enter the complete physical address where meals should be delivered daily"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      className="w-full text-xs font-semibold bg-[#F9FBF9] text-text-dark focus:outline-none border border-emerald-100 focus:border-primary rounded-xl px-4 py-3 resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Number of Workers *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={workerCount}
                      onChange={(e) => setWorkerCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full text-xs font-semibold bg-[#F9FBF9] text-text-dark focus:outline-none border border-emerald-100 focus:border-primary rounded-xl px-4 py-3"
                    />
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 border border-emerald-100 bg-white rounded-3xl" hoverable={false}>
              <div className="flex items-center gap-2 border-b border-emerald-50 pb-3 mb-5">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">1</span>
                <h3 className="font-extrabold text-text-dark text-base">Send Payment Transfer</h3>
              </div>
              
              <p className="text-xs font-semibold text-gray-500 mb-5 leading-relaxed">
                Please transfer the subscription fee of <span className="font-black text-text-dark">{planPrice}</span> using either bank transfer or mobile wallet, scan the QR code below, and take a screenshot of your successful transaction.
              </p>

              {/* Payment Method Tabs */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('meezan')}
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                    paymentMethod === 'meezan'
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-sm'
                      : 'border-gray-150 hover:border-emerald-100 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl border border-gray-150 bg-white flex items-center justify-center overflow-hidden shrink-0 p-1 shadow-sm">
                    <img src="/meezan_logo.png" alt="Meezan Bank" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-dark">Meezan Bank</p>
                    <p className="text-[10px] text-gray-400 font-semibold">Instant Bank / Raast</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('jazzcash')}
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                    paymentMethod === 'jazzcash'
                      ? 'border-amber-500 bg-amber-50/10 shadow-sm'
                      : 'border-gray-150 hover:border-amber-100 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl border border-gray-150 bg-white flex items-center justify-center overflow-hidden shrink-0 p-1 shadow-sm">
                    <img src="/jazzcash_logo.png" alt="JazzCash" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-dark">JazzCash</p>
                    <p className="text-[10px] text-gray-400 font-semibold">Mobile Wallet / Till ID</p>
                  </div>
                </button>
              </div>

              {/* Scan Animation Styles */}
              <style>{`
                @keyframes scan-animation {
                  0%, 100% { top: 8%; }
                  50% { top: 92%; }
                }
                .animate-scan-line {
                  animation: scan-animation 3s ease-in-out infinite;
                }
              `}</style>

              {/* Selected Account Details Display */}
              {paymentMethod === 'meezan' ? (
                <div className="flex flex-col gap-4">
                  {/* QR Code Card */}
                  <div className="bg-white border border-emerald-100 rounded-3xl p-6 flex flex-col items-center text-center shadow-subtle max-w-sm mx-auto w-full">
                    <div className="relative p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/60 mb-3 flex items-center justify-center group overflow-hidden">
                      {/* Decorative scanner lines/corners */}
                      <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-600 rounded-tl" />
                      <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-600 rounded-tr" />
                      <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-600 rounded-bl" />
                      <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-600 rounded-br" />
                      
                      {/* Soft pulse background scanner bar */}
                      <span className="absolute left-0 right-0 h-0.5 bg-emerald-500 opacity-60 animate-scan-line pointer-events-none" />

                      <img
                        src="/meezan_qr.jpg"
                        alt="Meezan Bank QR Code"
                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg shadow-sm"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      <QrCode className="w-3.5 h-3.5" />
                      Scan QR Code to Pay
                    </div>
                    <p className="text-[11px] text-gray-400 font-semibold mt-2.5">
                      Open your Meezan Bank or any Raast app scanner to complete payment instantly.
                    </p>
                  </div>

                  {/* Fallback Option Accordion Trigger */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setShowManualDetails(!showManualDetails)}
                      className="text-xs font-bold text-primary hover:text-emerald-700 flex items-center gap-1 transition-all cursor-pointer py-1"
                    >
                      {showManualDetails ? (
                        <>Hide Account Details <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>QR Code not scanning? Pay via Account Number <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>

                  {showManualDetails && (
                    <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-5 flex flex-col gap-3.5 transition-all duration-300">
                      <div className="flex items-center justify-between border-b border-emerald-100/50 pb-2">
                        <span className="text-xs font-bold text-emerald-800">Meezan Bank Account Details</span>
                        <span className="text-[10px] bg-emerald-700 text-white font-extrabold px-2 py-0.5 rounded-full uppercase">Active</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">Account Title</p>
                          <p className="text-sm font-black text-text-dark">MUHAMMAD MUZAMMIL</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">Account Number</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-text-dark font-mono">00300113570244</span>
                            <button type="button" onClick={() => handleCopyText('00300113570244')} className="text-primary hover:text-emerald-700 cursor-pointer">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">Branch</p>
                          <p className="text-sm font-bold text-text-dark">MEEZAN CENTRE</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">IBAN</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-text-dark font-mono">PK37MEZN0000300113570244</span>
                            <button type="button" onClick={() => handleCopyText('PK37MEZN0000300113570244')} className="text-primary hover:text-emerald-700 cursor-pointer">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* QR Code Card */}
                  <div className="bg-white border border-amber-100 rounded-3xl p-6 flex flex-col items-center text-center shadow-subtle max-w-sm mx-auto w-full">
                    <div className="relative p-4 bg-amber-50/20 rounded-2xl border border-amber-100/60 mb-3 flex items-center justify-center group overflow-hidden">
                      {/* Decorative scanner lines/corners */}
                      <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl" />
                      <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr" />
                      <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl" />
                      <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br" />
                      
                      {/* Soft pulse background scanner bar */}
                      <span className="absolute left-0 right-0 h-0.5 bg-amber-400 opacity-60 animate-scan-line pointer-events-none" />

                      <img
                        src="/jazzcash_qr.jpg"
                        alt="JazzCash QR Code"
                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg shadow-sm"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                      <QrCode className="w-3.5 h-3.5" />
                      Scan QR Code to Pay
                    </div>
                    <p className="text-[11px] text-gray-400 font-semibold mt-2.5">
                      Open your JazzCash or any wallet app scanner to pay instantly via Till ID.
                    </p>
                  </div>

                  {/* Fallback Option Accordion Trigger */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setShowManualDetails(!showManualDetails)}
                      className="text-xs font-bold text-primary hover:text-amber-700 flex items-center gap-1 transition-all cursor-pointer py-1"
                    >
                      {showManualDetails ? (
                        <>Hide Account Details <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>QR Code not scanning? Pay via Mobile Number / Till ID <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>

                  {showManualDetails && (
                    <div className="bg-amber-50/20 border border-amber-100 rounded-2xl p-5 flex flex-col gap-3.5 transition-all duration-300">
                      <div className="flex items-center justify-between border-b border-amber-100/50 pb-2">
                        <span className="text-xs font-bold text-amber-800">JazzCash / Mobile Account Details</span>
                        <span className="text-[10px] bg-amber-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase">Active</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">Account Title</p>
                          <p className="text-sm font-black text-text-dark">MUHAMMAD MUZAMIL Shop</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">Mobile Account Number</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-text-dark font-mono">03113840943</span>
                            <button type="button" onClick={() => handleCopyText('03113840943')} className="text-primary hover:text-amber-700 cursor-pointer">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">Till ID</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-text-dark font-mono">98361695</span>
                            <button type="button" onClick={() => handleCopyText('98361695')} className="text-primary hover:text-amber-700 cursor-pointer">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="sm:col-span-2 mt-1 p-3.5 bg-white border border-amber-100 rounded-xl">
                          <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">How to pay via USSD (Jazz SIM only):</p>
                          <p className="text-xs font-semibold text-text-dark leading-relaxed">
                            Dial <span className="font-mono font-bold">*786*10#</span>, then enter Till ID <span className="font-mono font-bold">98361695</span> to complete payment.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Right panel: Summary & Screenshot Upload */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Order Summary */}
            <Card className="p-6 border border-emerald-100 bg-[#F9FBF9] hover:translate-y-0 rounded-3xl" hoverable={false}>
              <h3 className="font-extrabold text-text-dark text-sm border-b border-emerald-50 pb-3 mb-4">Order Summary</h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-400">Plan Selected</span>
                  <span className="text-text-dark font-black capitalize">{purchasePlan} Plan</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-400">Subscription Type</span>
                  <span className="text-text-dark font-bold">{isCompany ? 'Corporate' : 'Individual'}</span>
                </div>
                {isCompany && (
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-gray-400">Workers Subscribed</span>
                    <span className="text-text-dark font-bold">{totalWorkers} Workers</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-400">Validity Period</span>
                  <span className="text-text-dark font-bold">{selectedPlanConfig.validityDays} Days</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-400">Total Deliveries</span>
                  <span className="text-text-dark font-bold">{isCompany ? `${selectedPlanConfig.totalMeals * totalWorkers} Meals` : `${selectedPlanConfig.totalMeals} Tiffin Meals`}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-400">Base Plan Price</span>
                  <span className="text-text-dark font-bold">PKR {selectedPlanConfig.price.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-lg border border-emerald-100/50">
                    <span>Discount Applied</span>
                    <span>- PKR {discountAmount.toLocaleString()}</span>
                  </div>
                )}

                {/* Dashed Separator */}
                <div className="border-t border-dashed border-emerald-200/80 my-1" />

                <div className="flex justify-between items-center text-sm font-black text-text-dark pt-1">
                  <span>Total Payable</span>
                  <span className="text-primary text-base font-black">{planPrice}</span>
                </div>

                <div className="mt-4 p-4 bg-white border border-emerald-50 rounded-2xl flex items-start gap-2.5 shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                    <span className="font-black text-text-dark">Safe & Secure Payment</span>
                    <br />
                    Once submitted, our team verifies the payment proof manually. Your plan starts only from the minute the admin approves it!
                  </div>
                </div>
              </div>
            </Card>

            {/* Step 2: Screenshot Upload & Checkout */}
            <Card className="p-5 border border-emerald-100 bg-white rounded-3xl" hoverable={false}>
              <div className="flex items-center gap-2 border-b border-emerald-50 pb-3 mb-4">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">2</span>
                <h3 className="font-extrabold text-text-dark text-sm">Attach Transfer Screenshot</h3>
              </div>
              
              <div className="flex flex-col gap-4">
                {!screenshot ? (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-6 hover:bg-emerald-50/10 hover:border-primary cursor-pointer transition-all group">
                    <div className="p-3 bg-emerald-50 rounded-xl text-primary mb-2 group-hover:scale-105 transition-all">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-text-dark mb-0.5">Click to Upload Receipt</span>
                    <span className="text-[9px] text-gray-400 font-semibold">Supports JPG, PNG, WEBP (Max 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex flex-col items-center gap-3 border border-emerald-100 bg-emerald-50/10 p-4 rounded-2xl">
                    <div className="relative shrink-0">
                      <img
                        src={screenshot}
                        alt="Uploaded Screenshot preview"
                        className="w-20 h-20 object-cover rounded-xl shadow-subtle border border-emerald-100 bg-white"
                      />
                      <span className="absolute -top-2 -right-2 p-0.5 bg-primary text-white rounded-full shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-text-dark">Screenshot uploaded</p>
                      <button
                        type="button"
                        onClick={() => setScreenshot(null)}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-bold mt-1 cursor-pointer inline-flex items-center gap-0.5"
                      >
                        Remove & Re-upload
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                  className="rounded-2xl w-full py-3.5 font-bold shadow-subtle text-sm flex items-center justify-center gap-2 cursor-pointer bg-primary text-white hover:bg-emerald-700"
                >
                  {submitting ? 'Submitting...' : `Subscribe Now`}
                </Button>
              </div>
            </Card>
          </div>
        </form>
      </div>
    )
  }

  // ── NO SUBSCRIPTION STATE ──
  if (!subscription) {
    const displayPlans = [
      {
        planType: 'weekly',
        title: 'Weekly Tiffin Plan',
        price: plans.find(p => p.planType === 'weekly')?.price || 1800,
        totalMeals: plans.find(p => p.planType === 'weekly')?.totalMeals || 6,
        validityDays: plans.find(p => p.planType === 'weekly')?.validityDays || 7,
        desc: 'Six days of healthy home tiffins from Monday to Saturday.',
        recommended: true,
        features: [
          '6 tiffins per week',
          'Weekly varying menu list',
          'Special dessert on Saturdays',
          'Pause/Resume anytime'
        ]
      },
      {
        planType: 'monthly',
        title: 'Monthly Tiffin Plan',
        price: plans.find(p => p.planType === 'monthly')?.price || 7000,
        totalMeals: plans.find(p => p.planType === 'monthly')?.totalMeals || 24,
        validityDays: plans.find(p => p.planType === 'monthly')?.validityDays || 30,
        desc: 'Premium monthly corporate tiffin meal plan package.',
        recommended: false,
        features: [
          '24 fresh tiffin packages',
          'Customize portion size daily',
          'Zero delivery fee',
          'Premium customer portal access'
        ]
      },
      {
        planType: 'company',
        title: 'Company Subscription',
        price: null,
        desc: 'Flexible and customizable corporate meal plans for your entire office or workplace team.',
        recommended: false,
        features: [
          'Subscribe on behalf of multiple workers',
          'Delivered hot to your office address',
          'Dedicated support manager coordinator',
          'Hassle-free custom menu setup'
        ]
      }
    ]

    return (
      <div className="flex flex-col gap-8 text-left w-full max-w-6xl mx-auto px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Tiffin Programs</h1>
          <p className="text-sm text-gray-500 mt-1">Choose a recurring plan and get fresh tiffins delivered daily.</p>
        </div>

        {/* Pricing Cards Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-stretch">
          {plansLoading ? (
            <div className="col-span-3 flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            displayPlans.map(plan => {
              const isWeekly = plan.planType === 'weekly'
              const isMonthly = plan.planType === 'monthly'
              const isCompanyPlan = plan.planType === 'company'

              return (
                <Card
                  key={plan.planType}
                  className={`flex flex-col p-8 gap-5 border bg-white justify-between relative overflow-hidden rounded-3xl ${
                    plan.recommended ? 'border-primary ring-2 ring-primary/25 bg-emerald-50/5' : 'border-emerald-100'
                  }`}
                  hoverable={true}
                >
                  {plan.recommended && (
                    <div className="absolute top-0 right-0 bg-[#046a38] text-white text-[9px] font-black uppercase tracking-widest py-1.5 px-4 rounded-bl-2xl">
                      BEST VALUE
                    </div>
                  )}

                  <div className="flex flex-col gap-4 text-left">
                    <span className={`text-[10px] font-black px-3.5 py-1 rounded-full w-fit uppercase tracking-wider ${
                      isWeekly
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                        : isMonthly
                        ? 'bg-sky-50 text-sky-800 border border-sky-100'
                        : 'bg-amber-50 text-amber-800 border border-amber-100'
                    }`}>
                      {plan.title}
                    </span>

                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex items-baseline gap-1.5">
                        {isCompanyPlan ? (
                          <span className="text-2xl font-black text-text-dark">Corporate Pricing</span>
                        ) : (
                          <>
                            <span className="text-3xl font-black text-primary">
                              PKR {plan.price.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-400 font-semibold">/ plan</span>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {isWeekly ? '6 meals • 7 Days validity' : isMonthly ? '24 meals • 30 Days validity' : 'Tailored for teams'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-550 font-medium leading-relaxed min-h-[40px]">
                      {plan.desc}
                    </p>

                    <div className="border-t border-gray-100 my-1" />

                    <ul className="flex flex-col gap-2.5 text-xs font-semibold text-gray-650">
                      {plan.features.map(feat => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-gray-600 leading-normal">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    variant={plan.recommended ? 'primary' : 'outline'}
                    onClick={() => {
                      if (isCompanyPlan) {
                        setIsCompany(true)
                        setPurchasePlan('monthly')
                      } else {
                        setIsCompany(false)
                        setPurchasePlan(plan.planType)
                      }
                    }}
                    className={`w-full rounded-xl py-3.5 font-bold mt-4 flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider ${
                      plan.recommended
                        ? 'bg-[#046a38] text-white hover:bg-[#03522c] border-none'
                        : 'border-2 border-[#046a38] text-[#046a38] hover:bg-emerald-50/10'
                    }`}
                  >
                    {isCompanyPlan ? <Building2 className="w-4 h-4" /> : <Utensils className="w-4 h-4" />}
                    {isCompanyPlan ? 'Configure Corporate' : 'Get Started'}
                  </Button>
                </Card>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // ── ACTIVE / PAUSED SUBSCRIPTION STATE ──
  const isActive = subscription.status === 'active'
  const planLabel = subscription.isCompany
    ? `${subscription.companyName} Corporate Plan`
    : (subscription.planType === 'weekly' ? 'Weekly Tiffin Plan' : 'Monthly Tiffin Plan')
  const matchingPlan = plans.find(p => p.planType === subscription.planType)
  const totalMeals = matchingPlan ? matchingPlan.totalMeals : (subscription.planType === 'weekly' ? 6 : 24)
  const usedMeals = Math.max(0, totalMeals - subscription.mealsRemaining)
  const progressPercent = totalMeals > 0 ? Math.round((usedMeals / totalMeals) * 100) : 0
  const renewalDate = subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'

  const getMealNameForDay = (dayIndex) => {
    if (!matchingPlan || !matchingPlan.mealSchedules) return 'Chef\'s Choice'
    const schedule = matchingPlan.mealSchedules.find(s => s.dayIndex === dayIndex)
    return schedule ? schedule.mealName : 'Chef\'s Choice'
  }

  return (
    <div className="flex flex-col gap-8 text-left w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">My Subscription</h1>
        <p className="text-sm text-gray-500">Your current meal plan and delivery schedule.</p>
      </div>

      {/* Plan Card */}
      <Card className="p-8 hover:translate-y-0" hoverable={false}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-emerald-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-text-dark text-base">{planLabel}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Renews on: {renewalDate}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={isActive ? 'success' : 'warning'}>
              {isActive ? 'Active' : subscription.status === 'paused' ? 'Paused' : subscription.status}
            </Badge>
            <Button
              variant={isActive ? 'outline' : 'primary'}
              size="sm"
              onClick={handleStatusToggle}
              isLoading={updating}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              {isActive ? (
                <><X className="w-4 h-4" /> Pause Plan</>
              ) : (
                <><Play className="w-4 h-4" /> Resume Plan</>
              )}
            </Button>
            {subscription.planType === 'weekly' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPurchasePlan('monthly')}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold border-none shadow-md cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" /> Upgrade to Monthly
              </Button>
            )}
          </div>
        </div>
        {subscription.isCompany && (
          <div className="mt-4 p-4.5 bg-emerald-50/20 border border-emerald-100/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-text-dark">Corporate Subscription Address</p>
                <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                  Delivering to: <span className="font-bold text-primary">{subscription.companyAddress}</span>
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Today's Delivery Quote</span>
              <span className="text-base font-black text-emerald-700">{subscription.workerCount} Fresh Tiffin Boxes</span>
            </div>
          </div>
        )}

        {/* Meals Stats */}
        <div className={`grid gap-4 pt-6 ${subscription.isCompany ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {(subscription.isCompany 
            ? [
                { label: 'Plan Type', value: subscription.planType === 'weekly' ? 'Corporate Weekly' : 'Corporate Monthly' },
                { label: 'Subscribed Employees', value: `${subscription.workerCount} Employees` },
                { label: 'Daily Tiffins Today', value: `${subscription.workerCount} Tiffins` },
                { label: 'Total Meals Quota', value: totalMeals * subscription.workerCount },
                { label: 'Total Meals Delivered', value: usedMeals * subscription.workerCount },
                { label: 'Total Meals Left', value: subscription.mealsRemaining * subscription.workerCount },
              ]
            : [
                { label: 'Plan Type', value: subscription.planType === 'weekly' ? 'Weekly' : 'Monthly' },
                { label: 'Total Meals', value: totalMeals },
                { label: 'Meals Used', value: usedMeals },
                { label: 'Meals Left', value: subscription.mealsRemaining },
              ]
          ).map((stat) => (
            <div key={stat.label} className="bg-background rounded-2xl p-4 border border-emerald-50 text-center">
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-black text-text-dark mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Meal Progress Bar */}
        <div className="pt-6">
          <div className="flex justify-between items-center text-xs font-bold mb-2">
            <span className="text-text-dark">Meal Completion Progress</span>
            <span className="text-primary">
              {subscription.isCompany 
                ? `${usedMeals * subscription.workerCount} / ${totalMeals * subscription.workerCount} Meals Received` 
                : `${usedMeals} / ${totalMeals} Meals Received`
              }
            </span>
          </div>
          <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden border border-emerald-50">
            <div
              className="bg-gradient-to-r from-primary to-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 font-semibold mt-2">
            {subscription.isCompany 
              ? `${subscription.mealsRemaining * subscription.workerCount} total meals (${subscription.mealsRemaining} days remaining) in your Corporate Plan.` 
              : `${subscription.mealsRemaining} meals remaining in your ${planLabel}.`
            }
          </p>
        </div>
      </Card>

      {/* Subscription Meal Calendar Card */}
      <Card className="p-8 hover:translate-y-0" hoverable={false}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-50 pb-4 mb-6 gap-3">
          <div>
            <h3 className="font-bold text-text-dark text-base">Subscription Meal Calendar</h3>
            <p className="text-xs text-gray-500 mt-1">Review your day-by-day menu and delivery progress</p>
          </div>
          {subscription.planType === 'monthly' && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 font-extrabold w-fit">
              <span>Day {usedMeals + 1} of 30</span>
            </div>
          )}
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${
          subscription.planType === 'monthly' ? 'max-h-[380px] overflow-y-auto pr-2' : ''
        }`}>
          {(() => {
            const items = []
            for (let i = 1; i <= totalMeals; i++) {
              const mealName = getMealNameForDay(i)
              const isCompleted = i < usedMeals + 1
              const isToday = i === usedMeals + 1
              const isUpcoming = i > usedMeals + 1

              items.push(
                <div
                  key={i}
                  className={`relative p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                    isToday
                      ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20 scale-[1.01]'
                      : isCompleted
                      ? 'border-emerald-100 bg-[#E8F5E9]/10 opacity-75'
                      : 'border-gray-150 bg-white hover:border-emerald-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${
                      isToday ? 'text-primary' : 'text-gray-400'
                    }`}>
                      Day {i}
                    </span>
                    {isToday ? (
                      <span className="flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-[9px] bg-primary text-white font-extrabold px-1.5 py-0.5 rounded-md uppercase">Today</span>
                      </span>
                    ) : isCompleted ? (
                      <Badge variant="success" className="text-[8px] px-1.5 py-0 uppercase">Completed</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[8px] px-1.5 py-0 uppercase">Upcoming</Badge>
                    )}
                  </div>
                  <div className="flex items-start gap-2 mt-1">
                    <Utensils className={`w-4 h-4 shrink-0 mt-0.5 ${isToday ? 'text-primary' : 'text-gray-400'}`} />
                    <p className={`text-xs font-bold ${isToday ? 'text-text-dark font-black' : isCompleted ? 'text-gray-400 line-through' : 'text-text-dark'}`}>
                      {mealName}
                    </p>
                  </div>
                </div>
              )
            }
            return items
          })()}
        </div>
      </Card>

      {/* Delivery Preferences */}
      <Card className="p-8 hover:translate-y-0" hoverable={false}>
        <h3 className="font-bold text-text-dark text-base pb-4 border-b border-emerald-50 mb-4">Delivery Preferences</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">Delivery Time Slot</p>
            <p className="text-sm font-bold text-text-dark">
              {subscription.preferenceDeliveryTime === 'dinner' ? '🌙 Dinner (7:30 PM – 9:00 PM)' : '☀️ Lunch (12:30 PM – 2:00 PM)'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">Meal Category</p>
            <p className="text-sm font-bold text-text-dark capitalize">
              {subscription.preferenceMealCategory || 'Any / Balanced'}
            </p>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 font-medium mt-6">
          To change your delivery preferences (time slot or meal category), please contact Home Tiffin support via WhatsApp.
        </p>
      </Card>

      {/* Confirmation/Truck Animation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#000c08]/95 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-[#021f16] border border-emerald-800/80 text-white rounded-3xl p-8 shadow-2xl z-10 overflow-hidden text-center"
            >
              <div className="py-8 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-3 mb-8">
                  <h3 className="text-xl font-bold text-white tracking-tight">Activating Your Plan</h3>
                  <p className="text-xs text-emerald-100/70 font-medium">
                    Please wait, we are setting up your tiffin delivery...
                  </p>
                </div>
                
                {/* Animated Confirm Button */}
                <div className="flex flex-col items-center justify-center gap-2 pt-2">
                  <button
                    disabled={true}
                    className="order animate mx-auto"
                  >
                    <span className="default">Subscribe & Pay</span>
                    <span className="success flex items-center justify-center gap-1.5">
                      Subscribed
                      <svg viewBox="0 0 12 10">
                        <polyline points="1.5 6 4.5 9 10.5 1" />
                      </svg>
                    </span>
                    <div className="box"></div>
                    <div className="truck">
                      <div className="back"></div>
                      <div className="front">
                        <div className="window"></div>
                      </div>
                      <div className="light top"></div>
                      <div className="light bottom"></div>
                    </div>
                    <div className="lines"></div>
                  </button>
                  <p className="text-[10px] text-emerald-100/50 font-bold uppercase tracking-wider mt-4">
                    Processing Delivery Truck...
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expanded Screenshot Viewer Modal */}
      {viewScreenshotUrl && (
        <Modal
          isOpen={!!viewScreenshotUrl}
          onClose={() => setViewScreenshotUrl(null)}
          title="Payment Verification Screenshot"
        >
          <div className="flex flex-col items-center justify-center p-2 bg-gray-50 border border-gray-150 rounded-2xl">
            <img
              src={viewScreenshotUrl}
              alt="Expanded receipt proof"
              className="w-full h-auto object-contain max-h-[70vh] rounded-xl shadow-lg bg-white"
            />
            <Button
              variant="secondary"
              onClick={() => setViewScreenshotUrl(null)}
              className="mt-4 rounded-xl font-bold w-full sm:w-auto px-6 py-2.5"
            >
              Close Preview
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
