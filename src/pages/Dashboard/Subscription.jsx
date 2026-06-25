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
import { formatDate } from '../../services/dateFormatter'
import { Calendar, Utensils, X, Play, ChevronRight, Loader2, Upload, CheckCircle2, Phone, AlertCircle, Copy, QrCode, ChevronDown, ChevronUp, Sun, Moon, Leaf, ArrowLeft, Sparkles, UploadCloud, ShieldCheck, Check, Building2, User, Lock, Clock } from 'lucide-react'
import { SubscriptionSkeleton } from '../../components/skeletons/dashboardSkeletons'
import { uploadImageToCloudinary } from '../../utils/cloudinary'

const parseAllocatedTimes = (str, slots) => {
  const times = {}
  if (!str) return times
  
  const hasPrefixes = str.includes('B:') || str.includes('L:') || str.includes('D:')
  if (hasPrefixes) {
    const parts = str.split('|')
    parts.forEach(part => {
      const trimmed = part.trim()
      if (trimmed.startsWith('B:')) {
        times.breakfast = trimmed.replace('B:', '').trim()
      } else if (trimmed.startsWith('L:')) {
        times.lunch = trimmed.replace('L:', '').trim()
      } else if (trimmed.startsWith('D:')) {
        times.dinner = trimmed.replace('D:', '').trim()
      }
    })
  } else if (slots) {
    if (slots.breakfast) times.breakfast = str
    if (slots.lunch) times.lunch = str
    if (slots.dinner) times.dinner = str
  }
  return times
}

export default function Subscription() {
  const { addToast } = useToastStore()
  const { user, fetchProfile } = useAuthStore()
  const [isPinned, setIsPinned] = useState(false)

  useEffect(() => {
    const scrollContainer = document.querySelector('main')
    if (!scrollContainer) return

    const handleScroll = () => {
      const panel = document.getElementById('subscription-panel')
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

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Subscription state pulled from state
  const [subscription, setSubscription] = useState(null)

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState(null)

  // Purchase Form States
  const [purchasePlan, setPurchasePlan] = useState(null) // null, 'weekly', 'monthly'
  const [preferenceMealCategory, setPreferenceMealCategory] = useState('Balanced')
  const [hasBreakfast, setHasBreakfast] = useState(false)
  const [hasLunch, setHasLunch] = useState(true)
  const [hasDinner, setHasDinner] = useState(false)
  const [breakfastPrefTime, setBreakfastPrefTime] = useState('8:00 AM')
  const [lunchPrefTime, setLunchPrefTime] = useState('1:30 PM')
  const [dinnerPrefTime, setDinnerPrefTime] = useState('8:30 PM')
  const [paymentMethod, setPaymentMethod] = useState('meezan') // 'meezan', 'jazzcash'
  const [showManualDetails, setShowManualDetails] = useState(false)
  const [screenshot, setScreenshot] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

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
      let fetchedPlans = [...res.data]
      if (fetchedPlans.length > 0 && !fetchedPlans.some(p => p.planType === 'company')) {
        fetchedPlans.push({
          id: 'company',
          planType: 'company',
          price: 300,
          totalMeals: 24,
          validityDays: 30,
          breakfastPrice: 200,
          lunchPrice: 300,
          dinnerPrice: 300
        })
      }
      setPlans(fetchedPlans)
    } catch (err) {
      console.error('Failed to load subscription plans:', err)
      addToast('Failed to load subscription plans. Using defaults.', 'error')
      setPlans([
        { id: 'weekly', planType: 'weekly', price: 1800, totalMeals: 6, validityDays: 7 },
        { id: 'monthly', planType: 'monthly', price: 7000, totalMeals: 24, validityDays: 30 },
        { id: 'company', planType: 'company', price: 300, totalMeals: 24, validityDays: 30, breakfastPrice: 200, lunchPrice: 300, dinnerPrice: 300 }
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('File is too large. Max size is 5MB.', 'error')
        return
      }
      try {
        setUploadingImage(true)
        addToast('Uploading receipt proof...', 'info')
        const url = await uploadImageToCloudinary(file)
        setScreenshot(url)
        addToast('Receipt proof uploaded successfully!', 'success')
      } catch (err) {
        console.error('Cloudinary upload error:', err)
        addToast(err.message || 'Failed to upload receipt image.', 'error')
      } finally {
        setUploadingImage(false)
      }
    }
  }

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text)
    addToast('Copied to clipboard!', 'success')
  }

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault()
    if (!hasBreakfast && !hasLunch && !hasDinner) {
      addToast('Please select at least one delivery meal slot (Breakfast, Lunch, or Dinner).', 'error')
      return
    }
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
          mealSlots: {
            breakfast: hasBreakfast,
            lunch: hasLunch,
            dinner: hasDinner
          },
          deliveryTime: hasLunch ? 'lunch' : (hasDinner ? 'dinner' : 'breakfast'),
          customTimes: {
            breakfast: hasBreakfast ? breakfastPrefTime : undefined,
            lunch: hasLunch ? lunchPrefTime : undefined,
            dinner: hasDinner ? dinnerPrefTime : undefined
          }
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
    return <SubscriptionSkeleton />
  }

  // ── PENDING VERIFICATION STATE ──
  if (subscription && subscription.status === 'pending') {
    return (
      <div className="flex flex-col gap-8 text-left w-full max-w-6xl mx-auto px-4 pt-6 pb-6">
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
                    <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Preferred Delivery Slots & Times</p>
                    <div className="text-xs font-bold text-text-dark capitalize flex flex-col gap-1 mt-0.5">
                      {(() => {
                        const slots = []
                        const mealSlots = subscription.preferences?.mealSlots
                        const custom = subscription.preferences?.customTimes || {}
                        if (mealSlots) {
                          if (mealSlots.breakfast) slots.push(`🍳 Breakfast: ${custom.breakfast || '8:00 AM'}`)
                          if (mealSlots.lunch) slots.push(`☀️ Lunch: ${custom.lunch || '1:30 PM'}`)
                          if (mealSlots.dinner) slots.push(`🌙 Dinner: ${custom.dinner || '8:30 PM'}`)
                        } else {
                          slots.push(subscription.preferenceDeliveryTime === 'dinner' ? '🌙 Dinner Slot' : '☀️ Lunch Slot')
                        }
                        return slots.map((s, idx) => <span key={idx}>{s}</span>)
                      })()}
                    </div>
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
    
    // Dynamic price based on slot selections
    const rawPrice = selectedPlanConfig.price || (purchasePlan === 'weekly' ? 1800 : 7000)
    let breakfastPrice = 0
    let lunchPrice = 0
    let dinnerPrice = 0
    let basePricePerWorker = 0

    if (isCompany) {
      // Company plan: Admin configures price PER SINGLE MEAL
      breakfastPrice = selectedPlanConfig.breakfastPrice || Math.round(rawPrice * 0.8) // fallback if unconfigured
      lunchPrice = selectedPlanConfig.lunchPrice || rawPrice
      dinnerPrice = selectedPlanConfig.dinnerPrice || rawPrice
      
      // Calculate single meal base cost per worker
      let singleMealCost = 0
      if (hasBreakfast) singleMealCost += breakfastPrice
      if (hasLunch) singleMealCost += lunchPrice
      if (hasDinner) singleMealCost += dinnerPrice
      
      // Multiply by totalMeals (e.g. 24) to get base price per worker for the entire plan duration
      basePricePerWorker = singleMealCost * selectedPlanConfig.totalMeals
    } else {
      // Individual weekly/monthly plans: Admin configures FLAT price for the entire plan
      breakfastPrice = selectedPlanConfig.breakfastPrice || Math.round(rawPrice * 0.25)
      lunchPrice = selectedPlanConfig.lunchPrice || Math.round(rawPrice * 0.40)
      dinnerPrice = selectedPlanConfig.dinnerPrice || Math.round(rawPrice * 0.40)
      
      if (hasBreakfast) basePricePerWorker += breakfastPrice
      if (hasLunch) basePricePerWorker += lunchPrice
      if (hasDinner) basePricePerWorker += dinnerPrice
    }
    
    const discountAmount = selectedPlanConfig.discount || 0
    const totalWorkers = isCompany ? (parseInt(workerCount, 10) || 1) : 1
    const subtotal = basePricePerWorker * totalWorkers
    const finalPrice = Math.max(0, subtotal - discountAmount)
    const planPrice = `PKR ${finalPrice.toLocaleString()}`
    const isNoSlotSelected = !hasBreakfast && !hasLunch && !hasDinner
    
    // Calculate total meals count based on slots active
    const activeSlotsCount = (hasBreakfast ? 1 : 0) + (hasLunch ? 1 : 0) + (hasDinner ? 1 : 0)
    const deliveriesCount = activeSlotsCount * selectedPlanConfig.totalMeals
    
    const planDesc = isCompany
      ? `${deliveriesCount * totalWorkers} Total Meals (${deliveriesCount} deliveries x ${totalWorkers} workers) for ${selectedPlanConfig.validityDays} days`
      : `${deliveriesCount} Meals delivered over ${selectedPlanConfig.validityDays} days`
    const isWeekly = purchasePlan === 'weekly'

    return (
      <div className="flex flex-col gap-8 text-left w-full pb-6">
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

            {/* Meal Preferences & Slots Selection Card */}
            <Card className="p-6 border border-emerald-100 bg-white rounded-3xl" hoverable={false}>
              <div className="flex items-center gap-2 border-b border-emerald-50 pb-3 mb-5 text-left">
                <h3 className="font-extrabold text-text-dark text-base">Meal Preferences & Delivery Slots</h3>
              </div>

              <div className="flex flex-col gap-6 text-left">
                {/* Preferred Meal Category */}
                <div>
                  <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-2.5 block">
                    Preferred Menu Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['Balanced', 'Diet', 'Keto', 'High Protein'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setPreferenceMealCategory(cat)}
                        className={`py-3.5 px-2 rounded-2xl border-2 text-center text-xs font-black transition-all cursor-pointer ${
                          preferenceMealCategory === cat
                            ? 'border-primary bg-emerald-50/15 shadow-sm text-primary'
                            : 'border-gray-150 hover:border-emerald-100 bg-white text-text-dark'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery Meal Slots Checkboxes */}
                <div>
                  <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-2.5 block">
                    Select Delivery Meal Slots (Price dynamic based on slots)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Breakfast Slot */}
                    <div
                      className={`flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all ${
                        hasBreakfast
                          ? 'border-primary bg-emerald-50/15 shadow-sm'
                          : 'border-gray-150 hover:border-emerald-100 bg-white'
                      }`}
                    >
                      <div 
                        onClick={() => setHasBreakfast(!hasBreakfast)}
                        className="flex items-center gap-3 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={hasBreakfast}
                          onChange={() => {}} // Click handled by parent div click
                          className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer shrink-0"
                        />
                        <div className="text-left flex-1">
                          <p className="text-xs font-bold text-text-dark">🍳 Breakfast</p>
                          <p className="text-[10px] text-gray-450 font-semibold mt-0.5">
                            PKR {breakfastPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {hasBreakfast && (
                        <div className="mt-1 flex flex-col gap-1 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                          <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Preferred Time</label>
                          <input
                            type="text"
                            placeholder="e.g. 8:00 AM"
                            value={breakfastPrefTime}
                            onChange={(e) => setBreakfastPrefTime(e.target.value)}
                            className="w-full text-[11px] font-bold bg-white text-text-dark focus:outline-none border border-emerald-100 focus:border-primary rounded-xl px-3 py-2"
                            onClick={(e) => e.stopPropagation()} // Stop checkbox toggle when typing
                          />
                        </div>
                      )}
                    </div>

                    {/* Lunch Slot */}
                    <div
                      className={`flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all ${
                        hasLunch
                          ? 'border-primary bg-emerald-50/15 shadow-sm'
                          : 'border-gray-150 hover:border-emerald-100 bg-white'
                      }`}
                    >
                      <div 
                        onClick={() => setHasLunch(!hasLunch)}
                        className="flex items-center gap-3 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={hasLunch}
                          onChange={() => {}} // Click handled by parent div click
                          className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer shrink-0"
                        />
                        <div className="text-left flex-1">
                          <p className="text-xs font-bold text-text-dark">☀️ Lunch</p>
                          <p className="text-[10px] text-gray-455 font-semibold mt-0.5">
                            PKR {lunchPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {hasLunch && (
                        <div className="mt-1 flex flex-col gap-1 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                          <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Preferred Time</label>
                          <input
                            type="text"
                            placeholder="e.g. 1:30 PM"
                            value={lunchPrefTime}
                            onChange={(e) => setLunchPrefTime(e.target.value)}
                            className="w-full text-[11px] font-bold bg-white text-text-dark focus:outline-none border border-emerald-100 focus:border-primary rounded-xl px-3 py-2"
                            onClick={(e) => e.stopPropagation()} // Stop checkbox toggle when typing
                          />
                        </div>
                      )}
                    </div>

                    {/* Dinner Slot */}
                    <div
                      className={`flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all ${
                        hasDinner
                          ? 'border-primary bg-emerald-50/15 shadow-sm'
                          : 'border-gray-150 hover:border-emerald-100 bg-white'
                      }`}
                    >
                      <div 
                        onClick={() => setHasDinner(!hasDinner)}
                        className="flex items-center gap-3 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={hasDinner}
                          onChange={() => {}} // Click handled by parent div click
                          className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer shrink-0"
                        />
                        <div className="text-left flex-1">
                          <p className="text-xs font-bold text-text-dark">🌙 Dinner</p>
                          <p className="text-[10px] text-gray-450 font-semibold mt-0.5">
                            PKR {dinnerPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {hasDinner && (
                        <div className="mt-1 flex flex-col gap-1 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                          <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Preferred Time</label>
                          <input
                            type="text"
                            placeholder="e.g. 8:30 PM"
                            value={dinnerPrefTime}
                            onChange={(e) => setDinnerPrefTime(e.target.value)}
                            className="w-full text-[11px] font-bold bg-white text-text-dark focus:outline-none border border-emerald-100 focus:border-primary rounded-xl px-3 py-2"
                            onClick={(e) => e.stopPropagation()} // Stop checkbox toggle when typing
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {isNoSlotSelected && (
                    <p className="text-[10px] text-rose-500 font-bold mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Please select at least one delivery meal slot to continue.
                    </p>
                  )}
                </div>
              </div>
            </Card>

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
                
                <div className="flex flex-col gap-1 text-[11px] bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100/50 my-2 text-left">
                  <p className="font-extrabold text-primary uppercase tracking-wider mb-1">
                    {isCompany ? 'Single Meal Slots Selection' : 'Meal Slots Selection'}
                  </p>
                  {hasBreakfast && (
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-500">Breakfast Slot</span>
                      <span className="text-text-dark">PKR {breakfastPrice.toLocaleString()} {isCompany && 'per meal'}</span>
                    </div>
                  )}
                  {hasLunch && (
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-500">Lunch Slot</span>
                      <span className="text-text-dark">PKR {lunchPrice.toLocaleString()} {isCompany && 'per meal'}</span>
                    </div>
                  )}
                  {hasDinner && (
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-500">Dinner Slot</span>
                      <span className="text-text-dark">PKR {dinnerPrice.toLocaleString()} {isCompany && 'per meal'}</span>
                    </div>
                  )}
                  <div className="border-t border-dashed border-emerald-200/50 my-1" />
                  <div className="flex justify-between font-bold text-text-dark">
                    <span>{isCompany ? 'Total Cost Per Meal' : 'Base Price per Worker'}</span>
                    <span>
                      PKR {isCompany 
                        ? ((hasBreakfast ? breakfastPrice : 0) + (hasLunch ? lunchPrice : 0) + (hasDinner ? dinnerPrice : 0)).toLocaleString()
                        : basePricePerWorker.toLocaleString()
                      }
                    </span>
                  </div>
                  {isCompany && (
                    <div className="flex justify-between font-bold text-text-dark">
                      <span>Total Cost Per Worker</span>
                      <span>PKR {basePricePerWorker.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-600 bg-emerald-50/55 px-2.5 py-1 rounded-lg border border-emerald-100/50">
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
                {uploadingImage ? (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-2xl p-6 bg-emerald-50/5">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                    <span className="text-xs font-bold text-text-dark">Uploading Receipt...</span>
                    <span className="text-[9px] text-gray-400 font-semibold">Please wait, uploading to secure server</span>
                  </div>
                ) : !screenshot ? (
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
                  disabled={uploadingImage || !screenshot}
                  className="rounded-2xl w-full py-3.5 font-bold shadow-subtle text-sm flex items-center justify-center gap-2 cursor-pointer bg-primary text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="flex flex-col gap-8 text-left w-full max-w-6xl mx-auto px-4 pt-6 pb-6">
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
  const planTotalMeals = matchingPlan ? matchingPlan.totalMeals : (subscription.planType === 'weekly' ? 6 : 24)
  const totalMeals = subscription.totalMealsInPlan ?? (planTotalMeals * (subscription.workerCount ?? 1))
  const usedMeals = subscription.mealsUsed
    ?? (Math.max(0, planTotalMeals - subscription.mealsRemaining) * (subscription.workerCount ?? 1))
  const progressPercent = totalMeals > 0 ? Math.round((usedMeals / totalMeals) * 100) : 0
  const renewalDate = subscription.endDate ? formatDate(subscription.endDate) : 'N/A'

  const getMealNameForDay = (dayIndex) => {
    if (!matchingPlan || !matchingPlan.mealSchedules) return 'Chef\'s Choice'
    const schedule = matchingPlan.mealSchedules.find(s => s.dayIndex === dayIndex)
    return schedule ? schedule.mealName : 'Chef\'s Choice'
  }
  const daysPerWeek = 6
  const totalWeeks = Math.ceil(totalMeals / daysPerWeek)
  const currentDay = usedMeals + 1
  const defaultWeek = Math.min(totalWeeks, Math.ceil(currentDay / daysPerWeek)) || 1
  const activeWeek = selectedWeek !== null ? selectedWeek : defaultWeek

  const getWeekStats = (weekNum) => {
    const start = (weekNum - 1) * daysPerWeek + 1
    const end = Math.min(totalMeals, weekNum * daysPerWeek)
    let completed = 0
    for (let i = start; i <= end; i++) {
      if (i < usedMeals + 1) completed++
    }
    return { completed, total: end - start + 1 }
  }

  return (
    <div className="w-full">
      {/* ─── DESKTOP VIEW ─── */}
      <div className="hidden md:flex flex-col gap-8 text-left w-full pb-20">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">My Subscription</h1>
          <p className="text-sm text-gray-550">Your current meal plan and delivery schedule.</p>
        </div>

        {/* Plan Card */}
        <Card className="p-8 hover:translate-y-0 shadow-card bg-white border border-emerald-100 rounded-3xl" hoverable={false}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-emerald-50">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3.5 bg-primary/10 text-primary border border-primary/20 rounded-2xl shrink-0">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-text-dark text-lg tracking-tight">{planLabel}</h3>
                  <Badge variant={isActive ? 'success' : 'warning'}>
                    {isActive ? 'Active' : subscription.status === 'paused' ? 'Paused' : subscription.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-550 mt-1 font-semibold">Renews on: {renewalDate}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <Button
                variant={isActive ? 'outline' : 'primary'}
                size="sm"
                onClick={handleStatusToggle}
                isLoading={updating}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 cursor-pointer rounded-xl font-bold px-4 py-2.5 text-xs uppercase tracking-wider"
              >
                {isActive ? (
                  'Pause Plan'
                ) : (
                  <><Play className="w-4 h-4" /> Resume Plan</>
                )}
              </Button>
              {subscription.planType === 'weekly' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setPurchasePlan('monthly')}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold border-none shadow-md cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-95 rounded-xl px-4 py-2.5 text-xs uppercase tracking-wider"
                >
                  <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" /> Upgrade to Monthly
                </Button>
              )}
            </div>
          </div>
          {subscription.isCompany && (
            <div className="mt-5 p-4.5 bg-emerald-50/20 border border-emerald-100/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-text-dark">Corporate Subscription Address</p>
                  <p className="text-[11px] text-gray-555 font-semibold mt-0.5">
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
          <div className="grid gap-4 sm:gap-5 pt-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            {(subscription.isCompany 
              ? [
                  { label: 'Plan Type', value: subscription.planType === 'weekly' ? 'Corporate Weekly' : 'Corporate Monthly', icon: Building2, colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-100/50' },
                  { label: 'Employees', value: `${subscription.workerCount} Employees`, icon: User, colorClass: 'bg-blue-50 text-blue-800 border-blue-100/50' },
                  { label: 'Total Quota', value: totalMeals, icon: Calendar, colorClass: 'bg-sky-50 text-sky-800 border-sky-100/50' },
                  { label: 'Meals Delivered', value: usedMeals, icon: CheckCircle2, colorClass: 'bg-amber-50 text-amber-800 border-amber-100/50' },
                  { label: 'Meals Remaining', value: subscription.mealsRemaining * subscription.workerCount, icon: Utensils, colorClass: 'bg-indigo-50 text-indigo-800 border-indigo-100/50' },
                ]
              : [
                  { label: 'Plan Type', value: subscription.planType === 'weekly' ? 'Weekly' : 'Monthly', icon: Sparkles, colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-100/50' },
                  { label: 'Total Meals', value: totalMeals, icon: Calendar, colorClass: 'bg-blue-50 text-blue-800 border-blue-100/50' },
                  { label: 'Meals Used', value: usedMeals, icon: CheckCircle2, colorClass: 'bg-amber-50 text-amber-800 border-amber-100/50' },
                  { label: 'Meals Remaining', value: subscription.mealsRemaining, icon: Utensils, colorClass: 'bg-indigo-50 text-indigo-800 border-indigo-100/50' },
                ]
            ).map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className={`rounded-2xl !p-4 sm:!p-5 border flex flex-col justify-between min-h-[100px] sm:min-h-[110px] text-left transition-all hover:shadow-subtle ${stat.colorClass}`}>
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider opacity-75">{stat.label}</span>
                    <div className="p-1 sm:p-1.5 bg-white rounded-lg border border-current/10 shadow-xs shrink-0">
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <p className="text-lg sm:text-xl font-black mt-2 leading-none">{stat.value}</p>
                </div>
              )
            })}
          </div>

          {/* Meal Progress Bar */}
          <div className="mt-6 p-5 bg-[#F9FBF9] border border-emerald-100/35 rounded-2xl">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">Meal Progress</p>
                <p className="text-xs font-bold text-text-dark">
                  {`${usedMeals} meals delivered`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-primary leading-none">
                  {usedMeals}
                </span>
                <span className="text-xs font-bold text-gray-400 ml-1">
                  / {totalMeals}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-150 h-4 rounded-full overflow-hidden border border-emerald-100/50">
              <div
                className="bg-gradient-to-r from-primary to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 font-semibold mt-2 text-left">
              {subscription.isCompany
                ? `${subscription.mealsRemaining * subscription.workerCount} meals remaining`
                : `${subscription.mealsRemaining} meals remaining`}
            </p>
          </div>
        </Card>

        {/* Subscription Meal Calendar Card */}
        <Card className="p-8 hover:translate-y-0 shadow-card bg-white border border-emerald-100 rounded-3xl" hoverable={false}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-emerald-50 pb-5 mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-primary rounded-xl border border-emerald-100/50">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-text-dark text-lg tracking-tight">
                  <span className="hidden sm:inline">Subscription Meal Calendar</span>
                  <span className="sm:hidden">Meal Calendar</span>
                </h3>
                <p className="text-xs text-gray-550 mt-0.5">Track your daily deliveries and meal menus week-by-week</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <span className="text-[10.5px] sm:text-xs font-bold text-gray-650 bg-gray-50 px-2 sm:px-3 py-1.5 rounded-xl border border-gray-100 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                {subscription.planType === 'monthly' && (() => {
                  const daysUsed = Math.max(0, planTotalMeals - subscription.mealsRemaining);
                  return (
                    <>
                      <span className="text-emerald-700 whitespace-nowrap">Day {daysUsed + 1} of 30</span>
                      <span className="text-gray-300">•</span>
                    </>
                  );
                })()}
                <span className="whitespace-nowrap">{usedMeals} Completed • {totalMeals - usedMeals} Remaining</span>
              </span>
            </div>
          </div>

          {/* Weekly Tabs (only if totalWeeks > 1) */}
          {totalWeeks > 1 && (
            <div className="flex flex-col gap-4 mb-6">
              <div 
                className="flex flex-row flex-nowrap gap-2 bg-[#F4F6F5] p-1.5 rounded-2xl overflow-x-auto border border-gray-150/50 max-w-full w-fit"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {Array.from({ length: totalWeeks }).map((_, idx) => {
                  const weekNum = idx + 1
                  const isSelected = activeWeek === weekNum
                  const { completed, total } = getWeekStats(weekNum)
                  const isWeekCompleted = completed === total
                  const isWeekActive = weekNum === defaultWeek

                  return (
                    <button
                      key={weekNum}
                      type="button"
                      onClick={() => setSelectedWeek(weekNum)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border-none ${
                        isSelected
                          ? 'bg-primary text-white shadow-subtle'
                          : 'text-primary/75 bg-transparent hover:bg-emerald-50 hover:text-primary'
                      }`}
                    >
                      <span>Week {weekNum}</span>
                      {isWeekCompleted ? (
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                      ) : isWeekActive ? (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>

              {/* Week Progress Bar */}
              {(() => {
                const { completed, total } = getWeekStats(activeWeek)
                const percent = Math.round((completed / total) * 100)
                return (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/15 border border-emerald-100/40 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-text-dark">Week {activeWeek} Progress</span>
                      <span className="text-[10px] bg-primary/10 text-primary font-extrabold px-2 py-0.5 rounded-md">
                        {completed} of {total} Received
                      </span>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-48">
                      <div className="flex-1 bg-gray-150 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-text-dark">{percent}%</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Calendar Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {(() => {
              const items = []
              const startDay = totalWeeks > 1 ? (activeWeek - 1) * daysPerWeek + 1 : 1
              const endDay = totalWeeks > 1 ? Math.min(totalMeals, activeWeek * daysPerWeek) : totalMeals

              for (let i = startDay; i <= endDay; i++) {
                const mealName = getMealNameForDay(i)
                const isCompleted = i < usedMeals + 1
                const isToday = i === usedMeals + 1

                items.push(
                  <motion.div
                    key={i}
                    whileHover={{ y: -4, scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative p-5 rounded-2xl border transition-all flex flex-col justify-between min-h-[140px] text-left overflow-hidden ${
                      isToday
                        ? 'border-primary bg-gradient-to-br from-emerald-50/30 to-emerald-100/10 shadow-md ring-2 ring-primary/20'
                        : isCompleted
                        ? 'border-slate-200/80 bg-gradient-to-br from-slate-50/90 to-slate-100/40 backdrop-blur-[1px] shadow-sm hover:border-slate-300 transition-all'
                        : 'border-gray-150 bg-white hover:border-emerald-100/80 hover:shadow-subtle'
                    }`}
                  >
                    {/* Subtle Background Art for Today */}
                    {isToday && (
                      <div className="absolute -right-6 -bottom-6 text-primary/5 pointer-events-none transform rotate-12">
                        <Utensils className="w-24 h-24" />
                      </div>
                    )}

                    {/* Subtle Background Art for Completed / Locked */}
                    {isCompleted && (
                      <div className="absolute -right-4 -bottom-4 text-slate-250/20 pointer-events-none transform -rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500">
                        <Lock className="w-16 h-16 stroke-[1.2]" />
                      </div>
                    )}

                    <div className="flex justify-between items-center w-full">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
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
                        <span className="flex items-center gap-1 bg-slate-100 text-slate-550 border border-slate-200/80 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm transition-all group-hover:bg-slate-200/80 group-hover:border-slate-300">
                          <Lock className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-550 transition-colors" />
                          Delivered
                        </span>
                      ) : (
                        <Badge variant="secondary" className="text-[8px] px-1.5 py-0.5 font-bold uppercase tracking-wider">
                          Upcoming
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-col gap-2.5 mt-4">
                      <div className="flex items-start gap-2">
                        {isCompleted ? (
                          <div className="relative w-4.5 h-4.5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-slate-350 transition-colors">
                            <Lock className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-555 transition-colors" />
                          </div>
                        ) : (
                          <Utensils className={`w-4 h-4 shrink-0 mt-0.5 ${isToday ? 'text-primary animate-bounce' : 'text-gray-400'}`} />
                        )}
                        <p className={`text-xs font-bold leading-snug ${
                          isToday 
                            ? 'text-text-dark font-black' 
                            : isCompleted 
                            ? 'text-gray-450 line-through decoration-gray-300 font-semibold' 
                            : 'text-text-dark'
                        }`}>
                          {mealName}
                        </p>
                      </div>
                    </div>

                    {/* Visual Completion Indicator Dot at bottom edge */}
                    <div className="absolute bottom-0 left-0 right-0 h-1">
                      <div className={`h-full ${
                        isToday 
                          ? 'bg-primary' 
                          : isCompleted 
                          ? 'bg-slate-300' 
                          : 'bg-transparent'
                      }`} />
                    </div>
                  </motion.div>
                )
              }
              return items
            })()}
          </div>
        </Card>

        {/* Delivery Preferences */}
        <Card className="p-8 hover:translate-y-0 shadow-card bg-white border border-emerald-100 rounded-3xl" hoverable={false}>
          <div className="flex items-center gap-3 border-b border-emerald-50 pb-4 mb-6">
            <div className="p-2.5 bg-emerald-50 text-primary rounded-xl border border-emerald-100/50">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-text-dark text-lg tracking-tight">Delivery Preferences</h3>
              <p className="text-xs text-gray-500 mt-0.5">Your set schedule details and dietary category</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Time Slot card */}
            <div className="flex items-center gap-4 p-5 bg-[#F9FBF9] border border-emerald-100/35 rounded-2xl">
              <div className="p-3.5 bg-amber-50 text-amber-650 border border-amber-150 rounded-xl shrink-0">
                <Sun className="w-6 h-6 text-amber-500" />
              </div>
              <div className="text-left">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block mb-0.5">Meal Slots & Delivery Times</span>
                {(() => {
                  const slots = []
                  const mealSlots = subscription.preferences?.mealSlots
                  const parsedAllocated = parseAllocatedTimes(subscription.allocatedDeliveryTime, mealSlots)
                  const allocated = {
                    ...parsedAllocated,
                    ...(subscription.preferences?.allocatedTimes || subscription.allocatedTimes || {})
                  }
                  const custom = subscription.preferences?.customTimes || {}
                  
                  if (mealSlots) {
                    if (mealSlots.breakfast) {
                      const time = allocated.breakfast || (custom.breakfast ? `${custom.breakfast} (Requested)` : 'Pending Admin')
                      slots.push(`🍳 Breakfast: ${time}`)
                    }
                    if (mealSlots.lunch) {
                      const time = allocated.lunch || (custom.lunch ? `${custom.lunch} (Requested)` : 'Pending Admin')
                      slots.push(`☀️ Lunch: ${time}`)
                    }
                    if (mealSlots.dinner) {
                      const time = allocated.dinner || (custom.dinner ? `${custom.dinner} (Requested)` : 'Pending Admin')
                      slots.push(`🌙 Dinner: ${time}`)
                    }
                  } else {
                    slots.push(subscription.preferenceDeliveryTime === 'dinner' ? '🌙 Dinner' : '☀️ Lunch')
                  }
                  
                  return (
                    <div className="flex flex-col gap-1 mt-1">
                      {slots.map((s, idx) => (
                        <div key={idx} className="text-xs font-bold text-text-dark">{s}</div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Meal Category card */}
            <div className="flex items-center gap-4 p-5 bg-[#F9FBF9] border border-emerald-100/35 rounded-2xl">
              <div className="p-3.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl shrink-0">
                <Leaf className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block mb-0.5">Meal Category</span>
                <span className="text-sm font-black text-text-dark capitalize mt-1 block">
                  {subscription.preferenceMealCategory || 'Balanced'}
                </span>
              </div>
            </div>

            {/* Allocated Delivery Time card */}
            {subscription.allocatedDeliveryTime && (
              <div className="flex items-center gap-4 p-5 bg-emerald-50 border border-emerald-200/80 rounded-2xl md:col-span-2">
                <div className="p-3.5 bg-primary text-white rounded-xl shrink-0">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-primary font-black uppercase tracking-wider block mb-0.5">Allocated Delivery Time</span>
                  <span className="text-sm font-black text-text-dark mt-1 block">
                    {subscription.allocatedDeliveryTime} (Expected Daily Delivery)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Change Request CTA box */}
          <div className="flex flex-col sm:flex-row sm:items-center items-center justify-between gap-4 p-5 bg-emerald-50/15 border border-emerald-100/35 rounded-2xl">
            <div className="flex items-start gap-3 text-left">
              <div className="p-1.5 bg-emerald-100/50 rounded-lg text-primary mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-dark">Want to change your delivery settings?</p>
                <p className="text-[10.5px] text-gray-555 font-medium leading-relaxed mt-0.5">
                  To update your time slot or meal type, simply send us a quick text on WhatsApp.
                </p>
              </div>
            </div>
            <a 
              href="https://wa.me/923113840943?text=Hi%20Home%20Tiffin,%20I%20want%20to%20change%20my%20delivery%20preferences." 
              target="_blank" 
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-emerald-600 text-emerald-800 hover:bg-emerald-50 px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                Contact Support
              </Button>
            </a>
          </div>
        </Card>
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
              <h1 className="text-2xl font-black tracking-tight">My Subscription</h1>
              <p className="text-xs text-emerald-200/80 font-medium mt-1">Your active meal plan & calendar tracker</p>
            </div>
          </div>

          {/* Card Stack representation */}
          <div className="relative h-44 mt-2 select-none">
            {/* Background card (stacked behind) */}
            <div className="absolute top-2 left-4 right-4 h-36 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm z-0 transform rotate-1 scale-95 opacity-60" />
            
            {/* Main card */}
            <div className="absolute top-0 left-0 right-0 h-38 bg-gradient-to-tr from-white/15 to-white/5 border border-white/20 rounded-3xl backdrop-blur-lg shadow-xl p-5 flex flex-col justify-between z-10 text-left">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-emerald-200/80 font-extrabold uppercase tracking-wider">
                    Active Tiffin Ledger
                  </p>
                  <h2 className="text-lg font-black mt-0.5 tracking-tight">
                    {planLabel}
                  </h2>
                </div>
                <Calendar className="w-6 h-6 text-emerald-300" />
              </div>

              <div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] text-emerald-300/80 font-extrabold uppercase tracking-widest">Status</p>
                    <p className="text-xl font-black tracking-tight uppercase">
                      {isActive ? 'Active' : 'Paused'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-emerald-300/80 font-extrabold uppercase tracking-widest">Renews on</p>
                    <p className="text-xs font-bold">
                      {renewalDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* White Panel */}
        <div 
          id="subscription-panel"
          style={{ 
            borderTopLeftRadius: '36px', 
            borderTopRightRadius: '36px' 
          }}
          className="bg-white -mt-16 pt-0 px-5 pb-24 relative z-20 min-h-screen shadow-card flex flex-col gap-6 text-left transition-all duration-300"
        >
          {/* Mobile Actions: Pause/Resume Plan */}
          <div 
            style={{ 
              borderTopLeftRadius: '36px', 
              borderTopRightRadius: '36px' 
            }}
            className="sticky top-[-16px] sm:top-[-24px] z-30 bg-white pt-8 pb-4 flex flex-col gap-4 -mx-5 px-5 border-b border-slate-100/50 transition-all duration-300"
          >
            <div className="flex gap-3">
              <Button
                variant={isActive ? 'outline' : 'primary'}
                size="sm"
                onClick={handleStatusToggle}
                isLoading={updating}
                className="flex-1 flex items-center justify-center gap-1.5 cursor-pointer rounded-xl font-bold py-3.5 text-xs uppercase tracking-wider"
              >
                {isActive ? (
                  'Pause Plan'
                ) : (
                  <><Play className="w-3.5 h-3.5" /> Resume</>
                )}
              </Button>
              {subscription.planType === 'weekly' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setPurchasePlan('monthly')}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold border-none shadow-md cursor-pointer transition-all rounded-xl py-3.5 text-xs uppercase tracking-wider"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" /> Upgrade
                </Button>
              )}
            </div>
          </div>

          {/* Corporate Address Quote */}
          {subscription.isCompany && (
            <div className="p-4 bg-emerald-50/20 border border-emerald-100/50 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-text-dark">Corporate Address</p>
                  <p className="text-[11px] text-gray-555 font-semibold mt-0.5">
                    Delivering to: <span className="font-bold text-primary">{subscription.companyAddress}</span>
                  </p>
                </div>
              </div>
              <div className="text-left border-t border-emerald-100/30 pt-2 flex justify-between items-center">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Today's Delivery</span>
                <span className="text-sm font-black text-emerald-700">{subscription.workerCount} Tiffins</span>
              </div>
            </div>
          )}

          {/* Meal Progress Bar */}
          <div className="p-4 bg-[#F9FBF9] border border-emerald-100/35 rounded-2xl">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">Meal Progress</p>
                <p className="text-xs font-bold text-text-dark">
                  {`${usedMeals} meals delivered`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-primary leading-none">
                  {usedMeals}
                </span>
                <span className="text-xs font-bold text-gray-400 ml-1">
                  / {totalMeals}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-150 h-3 rounded-full overflow-hidden border border-emerald-100/50">
              <div
                className="bg-gradient-to-r from-primary to-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 font-semibold mt-1.5 text-left">
              {subscription.isCompany
                ? `${subscription.mealsRemaining * subscription.workerCount} meals remaining`
                : `${subscription.mealsRemaining} meals remaining`}
            </p>
          </div>

          {/* Section Header */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mt-2">
            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">
              Meal Calendar
            </h3>
            <span className="text-[10px] font-black text-gray-450 uppercase tracking-wider">
              {usedMeals} Done • {totalMeals - usedMeals} Left
            </span>
          </div>

          {/* Weekly Tabs (only if totalWeeks > 1) */}
          {totalWeeks > 1 && (
            <div className="flex flex-col gap-4">
              <div 
                className="flex flex-row flex-nowrap gap-2 bg-[#F4F6F5] p-1.5 rounded-2xl overflow-x-auto border border-gray-150/50 max-w-full w-fit"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {Array.from({ length: totalWeeks }).map((_, idx) => {
                  const weekNum = idx + 1
                  const isSelected = activeWeek === weekNum
                  const { completed, total } = getWeekStats(weekNum)
                  const isWeekCompleted = completed === total
                  const isWeekActive = weekNum === defaultWeek

                  return (
                    <button
                      key={weekNum}
                      type="button"
                      onClick={() => setSelectedWeek(weekNum)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border-none ${
                        isSelected
                          ? 'bg-primary text-white shadow-subtle'
                          : 'text-primary/75 bg-transparent hover:bg-emerald-50 hover:text-primary'
                      }`}
                    >
                      <span>Week {weekNum}</span>
                      {isWeekCompleted ? (
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                      ) : isWeekActive ? (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>

              {/* Week Progress Bar */}
              {(() => {
                const { completed, total } = getWeekStats(activeWeek)
                const percent = Math.round((completed / total) * 100)
                return (
                  <div className="flex flex-col gap-2 bg-emerald-50/15 border border-emerald-100/40 p-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-text-dark">Week {activeWeek} Progress</span>
                      <span className="text-[10px] bg-primary/10 text-primary font-extrabold px-2 py-0.5 rounded-md">
                        {completed} of {total} Received
                      </span>
                    </div>
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1 bg-gray-150 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-text-dark">{percent}%</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Calendar Grid */}
          <div className="grid grid-cols-2 gap-3">
            {(() => {
              const items = []
              const startDay = totalWeeks > 1 ? (activeWeek - 1) * daysPerWeek + 1 : 1
              const endDay = totalWeeks > 1 ? Math.min(totalMeals, activeWeek * daysPerWeek) : totalMeals

              for (let i = startDay; i <= endDay; i++) {
                const mealName = getMealNameForDay(i)
                const isCompleted = i < usedMeals + 1
                const isToday = i === usedMeals + 1

                items.push(
                  <motion.div
                    key={i}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative p-4 rounded-2xl border transition-all flex flex-col justify-between min-h-[120px] text-left overflow-hidden ${
                      isToday
                        ? 'border-primary bg-gradient-to-br from-emerald-50/30 to-emerald-100/10 shadow-md ring-2 ring-primary/20'
                        : isCompleted
                        ? 'border-slate-200/80 bg-gradient-to-br from-slate-50/90 to-slate-100/40 backdrop-blur-[1px] shadow-sm'
                        : 'border-gray-150 bg-white hover:border-emerald-100/80'
                    }`}
                  >
                    {/* Subtle Background Art for Today */}
                    {isToday && (
                      <div className="absolute -right-6 -bottom-6 text-primary/5 pointer-events-none transform rotate-12">
                        <Utensils className="w-16 h-16" />
                      </div>
                    )}

                    {/* Subtle Background Art for Completed / Locked */}
                    {isCompleted && (
                      <div className="absolute -right-4 -bottom-4 text-slate-250/20 pointer-events-none transform -rotate-12">
                        <Lock className="w-12 h-12 stroke-[1.2]" />
                      </div>
                    )}

                    <div className="flex justify-between items-center w-full">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                        isToday ? 'text-primary' : 'text-gray-400'
                      }`}>
                        Day {i}
                      </span>
                      {isToday ? (
                        <span className="text-[8px] bg-primary text-white font-extrabold px-1.5 py-0.5 rounded-md uppercase">Today</span>
                      ) : isCompleted ? (
                        <span className="flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200/80 px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider">
                          <Lock className="w-2 h-2 text-slate-400" />
                          Delivered
                        </span>
                      ) : (
                        <span className="text-[8px] bg-slate-100 text-slate-450 border border-slate-150 px-1.5 py-0.5 rounded-lg font-bold uppercase tracking-wider">Upcoming</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 mt-3">
                      <div className="flex items-start gap-1.5">
                        {isCompleted ? (
                          <Lock className="w-3 h-3 text-slate-455 shrink-0 mt-0.5" />
                        ) : (
                          <Utensils className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isToday ? 'text-primary animate-bounce' : 'text-gray-400'}`} />
                        )}
                        <p className={`text-[11px] font-bold leading-tight ${
                          isToday 
                            ? 'text-text-dark font-black' 
                            : isCompleted 
                            ? 'text-gray-450 line-through decoration-gray-300 font-semibold' 
                            : 'text-text-dark'
                        }`}>
                          {mealName}
                        </p>
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-1">
                      <div className={`h-full ${
                        isToday 
                          ? 'bg-primary' 
                          : isCompleted 
                          ? 'bg-slate-300' 
                          : 'bg-transparent'
                      }`} />
                    </div>
                  </motion.div>
                )
              }
              return items
            })()}
          </div>

          {/* Delivery Preferences */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center gap-3 border-b border-emerald-50 pb-2">
              <div className="p-2 bg-emerald-50 text-primary rounded-xl border border-emerald-100/50">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-text-dark text-sm tracking-tight">Delivery Preferences</h3>
                <p className="text-[10px] text-gray-555 mt-0.5">Your schedule and meal category</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Time Slot card */}
              <div className="flex items-center gap-3 p-4 bg-[#F9FBF9] border border-emerald-100/35 rounded-2xl">
                <div className="p-2.5 bg-amber-50 text-amber-650 border border-amber-150 rounded-xl shrink-0">
                  <Sun className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Meal Slots & Delivery Times</span>
                  {(() => {
                    const slots = []
                    const mealSlots = subscription.preferences?.mealSlots
                    const parsedAllocated = parseAllocatedTimes(subscription.allocatedDeliveryTime, mealSlots)
                    const allocated = {
                      ...parsedAllocated,
                      ...(subscription.preferences?.allocatedTimes || subscription.allocatedTimes || {})
                    }
                    const custom = subscription.preferences?.customTimes || {}
                    
                    if (mealSlots) {
                      if (mealSlots.breakfast) {
                        const time = allocated.breakfast || (custom.breakfast ? `${custom.breakfast} (Requested)` : 'Pending Admin')
                        slots.push(`🍳 Breakfast: ${time}`)
                      }
                      if (mealSlots.lunch) {
                        const time = allocated.lunch || (custom.lunch ? `${custom.lunch} (Requested)` : 'Pending Admin')
                        slots.push(`☀️ Lunch: ${time}`)
                      }
                      if (mealSlots.dinner) {
                        const time = allocated.dinner || (custom.dinner ? `${custom.dinner} (Requested)` : 'Pending Admin')
                        slots.push(`🌙 Dinner: ${time}`)
                      }
                    } else {
                      slots.push(subscription.preferenceDeliveryTime === 'dinner' ? '🌙 Dinner' : '☀️ Lunch')
                    }
                    
                    return (
                      <div className="flex flex-col gap-1 mt-0.5">
                        {slots.map((s, idx) => (
                          <div key={idx} className="text-xs font-bold text-text-dark">{s}</div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Meal Category card */}
              <div className="flex items-center gap-3 p-4 bg-[#F9FBF9] border border-emerald-100/35 rounded-2xl">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl shrink-0">
                  <Leaf className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">Meal Category</span>
                  <span className="text-xs font-black text-text-dark capitalize mt-0.5 block">
                    {subscription.preferenceMealCategory || 'Balanced'}
                  </span>
                </div>
              </div>

              {/* Allocated Delivery Time card */}
              {subscription.allocatedDeliveryTime && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="p-2.5 bg-primary text-white rounded-xl shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] text-primary font-black uppercase tracking-wider block">Allocated Delivery Time</span>
                    <span className="text-xs font-black text-text-dark mt-0.5 block">
                      {subscription.allocatedDeliveryTime} (Expected Delivery)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Change Request CTA box */}
            <div className="flex flex-col gap-3 p-4 bg-emerald-50/15 border border-emerald-100/35 rounded-2xl text-left">
              <div className="flex items-start gap-2">
                <div className="p-1 bg-emerald-100/50 rounded-md text-primary shrink-0 mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-dark">Change preferences?</p>
                  <p className="text-[10px] text-gray-555 font-medium leading-normal mt-0.5">
                    Send a quick text on WhatsApp to change your time slot or meal type.
                  </p>
                </div>
              </div>
              <a 
                href="https://wa.me/923113840943?text=Hi%20Home%20Tiffin,%20I%20want%20to%20change%20my%20delivery%20preferences." 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full text-center"
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full rounded-xl border-emerald-600 text-emerald-800 hover:bg-emerald-50 py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Contact Support
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

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
