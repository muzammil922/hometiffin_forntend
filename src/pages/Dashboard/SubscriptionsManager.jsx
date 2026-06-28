import React, { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToastStore } from '../../store/toastStore'
import { formatDate, formatDateTime } from '../../services/dateFormatter'
import { Calendar, Users, Sliders, Edit, CheckCircle, Pause, AlertCircle, RefreshCw, XCircle, DollarSign, Eye, Loader2, Play, X, MoreVertical, Mail, Phone, User, Info, Truck, Search, Download, Clock } from 'lucide-react'
import Pagination from '../../components/ui/Pagination'
import { loadPdfLibs } from '../../utils/pdfExport'

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

export default function SubscriptionsManager() {
  const { addToast } = useToastStore()
  const [activeTab, setActiveTab] = useState('directory') // 'directory', 'pricing'
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSub, setSelectedSub] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  // Pagination + search
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalSubs, setTotalSubs] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Stats (fetched separately to avoid mixing with paginated list)
  const [stats, setStats] = useState({ active: 0, pending: 0, paused: 0, revenue: 0 })
  
  // screenshot preview modal
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState(null)

  const [activeActionDropdownId, setActiveActionDropdownId] = useState(null)

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.action-dropdown-container')) {
        setActiveActionDropdownId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  // Edit Form Fields
  const [editStatus, setEditStatus] = useState('active')
  const [editMeals, setEditMeals] = useState(0)
  const [editDeliveryTime, setEditDeliveryTime] = useState('lunch')
  const [editMealCategory, setEditMealCategory] = useState('balanced')
  const [editAllocatedDeliveryTime, setEditAllocatedDeliveryTime] = useState('')
  const [editHasBreakfast, setEditHasBreakfast] = useState(false)
  const [editHasLunch, setEditHasLunch] = useState(true)
  const [editHasDinner, setEditHasDinner] = useState(false)
  const [editAllocatedBreakfast, setEditAllocatedBreakfast] = useState('')
  const [editAllocatedLunch, setEditAllocatedLunch] = useState('')
  const [editAllocatedDinner, setEditAllocatedDinner] = useState('')
  const [sendingSmsId, setSendingSmsId] = useState(null)
  
  // Bulk selection states
  const [selectedSubIds, setSelectedSubIds] = useState([])
  const [bulkDeliveryTime, setBulkDeliveryTime] = useState('')
  const [isBulkSending, setIsBulkSending] = useState(false)

  const [updating, setUpdating] = useState(false)

  // Plan editor states
  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [savingPlans, setSavingPlans] = useState({})

  // Plan Menu Schedule states
  const [meals, setMeals] = useState([])
  const [mealsLoading, setMealsLoading] = useState(false)
  const [scheduleActiveTab, setScheduleActiveTab] = useState('weekly')
  const [monthlySubTab, setMonthlySubTab] = useState(1) // 1 for 1-10, 2 for 11-20, 3 for 21-30
  const [scheduleData, setScheduleData] = useState({}) // { [planId]: [{ dayIndex, mealName, mealId }] }
  const [weeklyMenuData, setWeeklyMenuData] = useState({ breakfast: [], lunch: [], dinner: [] })
  const [savingSchedule, setSavingSchedule] = useState({})
  const [activeDropdown, setActiveDropdown] = useState(null) // { planId, dayIndex, category }

  const DEFAULT_LIMIT = 20
  const [limit, setLimit] = useState(DEFAULT_LIMIT)

  const fetchSubscriptions = useCallback(async (pg = 1, search = '', status = '', lim = limit) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: pg, limit: lim })
      if (search) params.set('search', search)
      if (status && status !== 'All') params.set('status', status)
      const res = await api.get(`/admin/subscriptions?${params}`)
      setSubscriptions(res.data.data)
      setTotalSubs(res.data.total)
      setTotalPages(res.data.totalPages)
      setPage(res.data.page)
    } catch (err) {
      console.error('Failed to load subscriptions:', err)
      addToast('Failed to load subscription list.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  const fetchStats = useCallback(async () => {
    try {
      const [active, pending, paused, all] = await Promise.all([
        api.get('/admin/subscriptions?status=active&limit=1'),
        api.get('/admin/subscriptions?status=pending&limit=1'),
        api.get('/admin/subscriptions?status=paused&limit=1'),
        api.get('/admin/subscriptions?limit=1'),
      ])
      // Revenue computed from all subs (approximate – we keep this simple)
      setStats({
        active:  active.data.total,
        pending: pending.data.total,
        paused:  paused.data.total,
        revenue: 0, // not available without full list
      })
    } catch {}
  }, [])

  const fetchPlans = async () => {
    try {
      setPlansLoading(true)
      const res = await api.get('/admin/plans')
      let fetchedPlans = [...res.data]
      
      // Ensure company plan exists for corporate plan configuration
      if (fetchedPlans.length > 0 && !fetchedPlans.some(p => p.planType === 'company')) {
        fetchedPlans.push({
          id: 'company',
          planType: 'company',
          price: 300,
          totalMeals: 24,
          validityDays: 30,
          breakfastPrice: 200,
          lunchPrice: 300,
          dinnerPrice: 300,
          isMock: true
        })
      }
      setPlans(fetchedPlans)
    } catch (err) {
      console.error('Failed to load plans:', err)
      addToast('Failed to load subscription plans configuration.', 'error')
    } finally {
      setPlansLoading(false)
    }
  }

  const fetchMeals = async () => {
    try {
      setMealsLoading(true)
      const res = await api.get('/meals')
      setMeals(res.data)
    } catch (err) {
      console.error('Failed to fetch meals:', err)
      addToast('Failed to load menu items for auto-suggest.', 'error')
    } finally {
      setMealsLoading(false)
    }
  }

  const getInitializedSchedule = (plan) => {
    if (!plan) return []
    const totalDays = plan.planType === 'weekly' ? 6 : 30
    const list = []
    for (let i = 1; i <= totalDays; i++) {
      const existing = plan.mealSchedules?.find(s => s.dayIndex === i)
      
      let breakfast = { name: '', description: '' }
      let lunch = { name: '', description: '' }
      let dinner = { name: '', description: '' }

      if (existing) {
        try {
          const parsed = JSON.parse(existing.mealName)
          breakfast = parsed.breakfast || breakfast
          lunch = parsed.lunch || lunch
          dinner = parsed.dinner || dinner
        } catch (e) {
          // Fallback if legacy text
          lunch = { name: existing.mealName, description: '' }
        }
      }

      list.push({
        dayIndex: i,
        breakfast,
        lunch,
        dinner
      })
    }
    return list
  }

  useEffect(() => {
    fetchSubscriptions(1, '', '')
    fetchStats()
    fetchPlans()
    fetchMeals()
  }, [])

  const fetchWeeklyMenu = async (weeklyPlanId) => {
    try {
      const res = await api.get('/meals/weekly-menu')
      if (res.data && weeklyPlanId) {
        const list = []
        const daysCount = 6
        for (let i = 1; i <= daysCount; i++) {
          const idx = i - 1
          const breakfast = res.data.breakfast?.[idx] || { name: '', description: '' }
          const lunch = res.data.lunch?.[idx] || { name: '', description: '' }
          const dinner = res.data.dinner?.[idx] || { name: '', description: '' }
          
          list.push({
            dayIndex: i,
            breakfast: { 
              name: breakfast.name || '', 
              description: breakfast.description || '' 
            },
            lunch: { 
              name: lunch.name || '', 
              description: lunch.description || '' 
            },
            dinner: { 
              name: dinner.name || '', 
              description: dinner.description || '' 
            }
          })
        }
        setScheduleData(prev => ({ ...prev, [weeklyPlanId]: list }))
      }
    } catch (err) {
      console.error('Failed to load weekly menu:', err)
    }
  }

  useEffect(() => {
    if (plans.length > 0) {
      const initialSchedules = {}
      plans.forEach(plan => {
        initialSchedules[plan.id] = getInitializedSchedule(plan)
      })
      setScheduleData(initialSchedules)

      const weeklyPlan = plans.find(p => p.planType === 'weekly')
      if (weeklyPlan) {
        fetchWeeklyMenu(weeklyPlan.id)
      }
    }
  }, [plans])

  const handleScheduleMealSlotChange = (planId, dayIndex, category, field, value) => {
    setScheduleData(prev => {
      const currentPlanSchedule = [...(prev[planId] || [])]
      const index = currentPlanSchedule.findIndex(item => item.dayIndex === dayIndex)
      
      const newDayObj = index > -1 
        ? { ...currentPlanSchedule[index] } 
        : { dayIndex, breakfast: { name: '', description: '' }, lunch: { name: '', description: '' }, dinner: { name: '', description: '' } }
      
      newDayObj[category] = {
        ...newDayObj[category],
        [field]: value
      }

      if (index > -1) {
        currentPlanSchedule[index] = newDayObj
      } else {
        currentPlanSchedule.push(newDayObj)
      }
      return { ...prev, [planId]: currentPlanSchedule }
    })
  }

  const handleSaveSchedule = async (planId) => {
    try {
      setSavingSchedule(prev => ({ ...prev, [planId]: true }))
      
      const currentPlan = plans.find(p => p.id === planId)
      if (!currentPlan) return;

      const schedules = scheduleData[planId] || []
      
      // Serialize Breakfast, Lunch, Dinner details into mealName in PlanMealSchedule
      const formattedSchedules = schedules.map(item => ({
        dayIndex: item.dayIndex,
        mealName: JSON.stringify({
          breakfast: { 
            name: item.breakfast?.name?.trim() || 'Chef\'s Choice', 
            description: item.breakfast?.description?.trim() || '' 
          },
          lunch: { 
            name: item.lunch?.name?.trim() || 'Chef\'s Choice', 
            description: item.lunch?.description?.trim() || '' 
          },
          dinner: { 
            name: item.dinner?.name?.trim() || 'Chef\'s Choice', 
            description: item.dinner?.description?.trim() || '' 
          }
        }),
        mealId: null
      }))

      await api.put(`/admin/plans/${planId}/schedule`, { schedules: formattedSchedules })

      // If it's the weekly plan, also update the weeklyMenu.json config file
      if (currentPlan.planType === 'weekly') {
        await api.put('/admin/weekly-menu', {
          breakfast: schedules.map(item => ({
            name: item.breakfast?.name?.trim() || 'Chef\'s Choice',
            description: item.breakfast?.description?.trim() || ''
          })),
          lunch: schedules.map(item => ({
            name: item.lunch?.name?.trim() || 'Chef\'s Choice',
            description: item.lunch?.description?.trim() || ''
          })),
          dinner: schedules.map(item => ({
            name: item.dinner?.name?.trim() || 'Chef\'s Choice',
            description: item.dinner?.description?.trim() || ''
          }))
        })
      }

      addToast('Meal schedule saved successfully!', 'success')
      fetchPlans() // Refresh plans to sync mealSchedules
      fetchWeeklyMenu() // Sync state
    } catch (err) {
      console.error('Failed to save meal schedule:', err)
      addToast(err.response?.data?.error || 'Failed to save meal schedule.', 'error')
    } finally {
      setSavingSchedule(prev => ({ ...prev, [planId]: false }))
    }
  }


  const handlePlanChange = (planId, field, value) => {
    setPlans(prevPlans => prevPlans.map(p => {
      if (p.id === planId) {
        const updated = { ...p, [field]: value }
        
        // Auto calculate Price if totalMeals or lunchPrice changes
        if (field === 'totalMeals' || field === 'lunchPrice') {
          const quota = Number(updated.totalMeals || 0)
          const lPrice = Number(updated.lunchPrice || 0)
          
          if (p.planType !== 'company') {
            updated.price = quota * lPrice
          }
        }
        return updated
      }
      return p
    }))
  }

  const handleSavePlanConfig = async (plan) => {
    try {
      setSavingPlans(prev => ({ ...prev, [plan.id]: true }))
      const payload = {
        planType: plan.planType,
        price: Number(plan.price),
        discount: Number(plan.discount || 0),
        totalMeals: Number(plan.totalMeals),
        validityDays: Number(plan.validityDays),
        breakfastPrice: Number(plan.breakfastPrice || 0),
        lunchPrice: Number(plan.lunchPrice || 0),
        dinnerPrice: Number(plan.dinnerPrice || 0)
      }
      
      if (plan.isMock || plan.id === 'company') {
        try {
          await api.post('/admin/plans', payload)
        } catch (postErr) {
          await api.put(`/admin/plans/${plan.id}`, payload)
        }
      } else {
        await api.put(`/admin/plans/${plan.id}`, payload)
      }
      
      addToast(`${plan.planType.toUpperCase()} plan pricing updated!`, 'success')
      fetchPlans()
    } catch (err) {
      console.error(err)
      addToast(err.response?.data?.error || 'Failed to update plan configuration.', 'error')
    } finally {
      setSavingPlans(prev => ({ ...prev, [plan.id]: false }))
    }
  }

  const [isPausingId, setIsPausingId] = useState(null)

  const handleQuickStatusUpdate = async (sub, newStatus) => {
    try {
      if (newStatus === 'paused') {
        setIsPausingId(sub.id)
      } else {
        setLoading(true)
      }

      await api.put(`/admin/subscriptions/${sub.id}`, {
        status: newStatus
      })

      if (newStatus === 'paused') {
        // Add artificial delay for animation
        await new Promise(r => setTimeout(r, 2000))
        setIsPausingId(null)
      }

      addToast(`Subscription marked as ${newStatus} successfully!`, 'success')
      
      // Update local state instead of refreshing the whole table
      setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, status: newStatus } : s))
      
      if (newStatus !== 'paused') {
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      setIsPausingId(null)
      setLoading(false)
      addToast(err.response?.data?.error || 'Failed to update subscription status.', 'error')
    }
  }

  const handleEditClick = (sub) => {
    setSelectedSub(sub)
    setEditStatus(sub.status)
    setEditMeals(sub.mealsRemaining)
    setEditDeliveryTime(sub.preferenceDeliveryTime || 'lunch')
    setEditMealCategory(sub.preferenceMealCategory || 'balanced')
    setEditAllocatedDeliveryTime(sub.allocatedDeliveryTime || '')
    
    const mealSlots = sub.preferences?.mealSlots
    setEditHasBreakfast(mealSlots ? !!mealSlots.breakfast : false)
    setEditHasLunch(mealSlots ? !!mealSlots.lunch : (sub.preferenceDeliveryTime !== 'dinner'))
    setEditHasDinner(mealSlots ? !!mealSlots.dinner : (sub.preferenceDeliveryTime === 'dinner'))
    
    const parsedAllocated = parseAllocatedTimes(sub.allocatedDeliveryTime, mealSlots)
    const allocated = {
      ...parsedAllocated,
      ...(sub.preferences?.allocatedTimes || sub.allocatedTimes || {})
    }
    const customTimes = sub.preferences?.customTimes || {}
    setEditAllocatedBreakfast(allocated.breakfast || customTimes.breakfast || '')
    setEditAllocatedLunch(allocated.lunch || customTimes.lunch || '')
    setEditAllocatedDinner(allocated.dinner || customTimes.dinner || '')
    
    setIsModalOpen(true)
  }

  const handleUpdateSubscription = async () => {
    try {
      setUpdating(true)
      
      const times = []
      if (editHasBreakfast && editAllocatedBreakfast) times.push(`B: ${editAllocatedBreakfast}`)
      if (editHasLunch && editAllocatedLunch) times.push(`L: ${editAllocatedLunch}`)
      if (editHasDinner && editAllocatedDinner) times.push(`D: ${editAllocatedDinner}`)
      const allocatedStr = times.join(' | ')

      const res = await api.put(`/admin/subscriptions/${selectedSub.id}`, {
        status: editStatus,
        mealsRemaining: editMeals,
        preferenceMealCategory: editMealCategory,
        allocatedDeliveryTime: allocatedStr,
        allocatedTimes: {
          breakfast: editHasBreakfast ? editAllocatedBreakfast : undefined,
          lunch: editHasLunch ? editAllocatedLunch : undefined,
          dinner: editHasDinner ? editAllocatedDinner : undefined
        },
        preferences: {
          mealCategory: editMealCategory,
          mealSlots: {
            breakfast: editHasBreakfast,
            lunch: editHasLunch,
            dinner: editHasDinner
          },
          deliveryTime: [
            editHasBreakfast ? 'breakfast' : '',
            editHasLunch ? 'lunch' : '',
            editHasDinner ? 'dinner' : ''
          ].filter(Boolean).join(','),
          customTimes: {
            breakfast: editHasBreakfast ? editAllocatedBreakfast : undefined,
            lunch: editHasLunch ? editAllocatedLunch : undefined,
            dinner: editHasDinner ? editAllocatedDinner : undefined
          },
          allocatedTimes: {
            breakfast: editHasBreakfast ? editAllocatedBreakfast : undefined,
            lunch: editHasLunch ? editAllocatedLunch : undefined,
            dinner: editHasDinner ? editAllocatedDinner : undefined
          }
        }
      })
      addToast('Subscription updated successfully!', 'success')
      setIsModalOpen(false)
      fetchSubscriptions(page, searchQuery, statusFilter)
      fetchStats()
    } catch (err) {
      console.error('Failed to update subscription:', err)
      addToast(err.response?.data?.error || 'Failed to update subscription.', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const getMealNameForSub = (sub) => {
    const plan = plans.find(p => p.planType === sub.planType)
    if (!plan) return "Chef's Choice"
    const totalMeals = plan.totalMeals || (plan.planType === 'weekly' ? 7 : 30)
    const dayIndex = Math.max(0, totalMeals - sub.mealsRemaining) + 1
    const schedule = plan.mealSchedules?.find(s => s.dayIndex === dayIndex)
    return schedule ? schedule.mealName : "Chef's Choice"
  }

  const getNotificationTimeText = (s) => {
    const timesList = []
    const slots = s.preferences?.mealSlots
    const parsedAllocated = parseAllocatedTimes(s.allocatedDeliveryTime, slots)
    const allocated = {
      ...parsedAllocated,
      ...(s.allocatedTimes || {})
    }
    const custom = s.preferences?.customTimes || {}
    
    if (slots) {
      const hasAnyTime = allocated.breakfast || custom.breakfast || allocated.lunch || custom.lunch || allocated.dinner || custom.dinner
      if (!hasAnyTime && s.allocatedDeliveryTime) {
        timesList.push(`at ${s.allocatedDeliveryTime}`)
      } else {
        if (slots.breakfast) timesList.push(`Breakfast at ${allocated.breakfast || custom.breakfast || 'morning'}`)
        if (slots.lunch) timesList.push(`Lunch at ${allocated.lunch || custom.lunch || 'noon'}`)
        if (slots.dinner) timesList.push(`Dinner at ${allocated.dinner || custom.dinner || 'night'}`)
      }
    } else {
      if (s.allocatedDeliveryTime) {
        timesList.push(`at ${s.allocatedDeliveryTime}`)
      } else {
        timesList.push(`in your preferred slot (${s.preferenceDeliveryTime})`)
      }
    }
    return timesList.join(', ')
  }

  const handleSendWhatsAppNotification = async (sub) => {
    const phoneNum = sub.customer?.phone || sub.contactPhone
    if (!phoneNum) {
      addToast('No contact phone number found for this subscriber.', 'error')
      return
    }

    const mealName = getMealNameForSub(sub)
    const customerName = sub.customer?.name || 'Customer'
    const timeText = getNotificationTimeText(sub)
    
    const message = `Salam ${customerName}! Today your Active Subscription Meal is: *${mealName}*. It will be delivered to you ${timeText}. Stay tuned!`

    try {
      setSendingSmsId(sub.id)
      
      await api.post('/admin/whatsapp/send-message', {
        phone: phoneNum,
        message: message
      })
      
      addToast('WhatsApp notification sent successfully!', 'success')
    } catch (err) {
      console.error('Failed to send WhatsApp message via backend, trying direct middleware...', err)
      try {
        const { whatsappService } = await import('../../services/whatsapp')
        await whatsappService.sendMessage(phoneNum, message)
        addToast('WhatsApp notification sent successfully!', 'success')
      } catch (fallbackErr) {
        console.error('Fallback failed:', fallbackErr)
        addToast('Failed to send WhatsApp notification. Make sure WhatsApp is connected.', 'error')
      }
    } finally {
      setSendingSmsId(null)
    }
  }

  const handleToggleSelectSub = (id) => {
    setSelectedSubIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSelectAllSubs = (checked) => {
    if (checked) {
      setSelectedSubIds(subscriptions.map(s => s.id))
    } else {
      setSelectedSubIds([])
    }
  }

  const handleBulkAllotTime = async () => {
    if (selectedSubIds.length === 0) {
      addToast('No subscribers selected.', 'warning')
      return
    }
    if (!bulkDeliveryTime.trim()) {
      addToast('Please enter a delivery time to allot.', 'warning')
      return
    }

    try {
      setLoading(true)
      await Promise.all(
        selectedSubIds.map(id => {
          const sub = subscriptions.find(s => s.id === id)
          if (!sub) return Promise.resolve()
          
          const mealSlots = sub.preferences?.mealSlots
          const updatePayload = {
            allocatedDeliveryTime: bulkDeliveryTime.trim()
          }
          
          if (mealSlots) {
            const allocatedTimes = { ...(sub.allocatedTimes || {}) }
            const activeKeys = Object.keys(mealSlots).filter(k => mealSlots[k])
            
            activeKeys.forEach(k => {
              allocatedTimes[k] = bulkDeliveryTime.trim()
            })
            
            updatePayload.allocatedTimes = allocatedTimes
            
            const times = []
            if (mealSlots.breakfast && allocatedTimes.breakfast) times.push(`B: ${allocatedTimes.breakfast}`)
            if (mealSlots.lunch && allocatedTimes.lunch) times.push(`L: ${allocatedTimes.lunch}`)
            if (mealSlots.dinner && allocatedTimes.dinner) times.push(`D: ${allocatedTimes.dinner}`)
            updatePayload.allocatedDeliveryTime = times.join(' | ') || bulkDeliveryTime.trim()
            
            updatePayload.preferences = {
              ...sub.preferences,
              customTimes: {
                ...sub.preferences?.customTimes,
                ...allocatedTimes
              }
            }
          }
          
          return api.put(`/admin/subscriptions/${id}`, updatePayload)
        })
      )
      addToast(`Allocated delivery time "${bulkDeliveryTime}" to ${selectedSubIds.length} subscribers!`, 'success')
      setSelectedSubIds([])
      setBulkDeliveryTime('')
      fetchSubscriptions(page, searchQuery, statusFilter)
    } catch (err) {
      console.error(err)
      addToast('Failed to allot delivery time to some subscribers.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkSendWhatsApp = async () => {
    if (selectedSubIds.length === 0) {
      addToast('No subscribers selected.', 'warning')
      return
    }

    const selectedSubs = subscriptions.filter(s => selectedSubIds.includes(s.id) && s.status === 'active')
    if (selectedSubs.length === 0) {
      addToast('No active subscribers selected to notify.', 'warning')
      return
    }

    try {
      setIsBulkSending(true)
      let successCount = 0
      
      for (const sub of selectedSubs) {
        try {
          const phoneNum = sub.customer?.phone || sub.contactPhone
          if (!phoneNum) continue
          
          const mealName = getMealNameForSub(sub)
          const customerName = sub.customer?.name || 'Customer'
          const timeText = getNotificationTimeText(sub)
          
          const message = `Salam ${customerName}! Today your Active Subscription Meal is: *${mealName}*. It will be delivered to you ${timeText}. Stay tuned!`
          
          try {
            await api.post('/admin/whatsapp/send-message', {
              phone: phoneNum,
              message: message
            })
          } catch (apiErr) {
            const { whatsappService } = await import('../../services/whatsapp')
            await whatsappService.sendMessage(phoneNum, message)
          }
          
          successCount++
        } catch (subErr) {
          console.error(`Failed to send SMS to subscriber ${sub.id}:`, subErr)
        }
      }
      
      addToast(`Sent WhatsApp notifications to ${successCount} active subscribers!`, 'success')
      setSelectedSubIds([])
    } catch (err) {
      console.error(err)
      addToast('Failed to send bulk notifications.', 'error')
    } finally {
      setIsBulkSending(false)
    }
  }

  const handleExportPDF = async () => {
    if (subscriptions.length === 0) {
      addToast('No subscriptions to export.', 'warning')
      return
    }

    const { jsPDF, autoTable } = await loadPdfLibs()
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.setTextColor(2, 48, 32)
    doc.text("Home Tiffin - Subscribers Directory", 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on: ${formatDateTime(new Date())}`, 14, 26)
    doc.text(`Total Subscribers: ${subscriptions.length}`, 14, 32)

    const headers = [['Subscriber/Company', 'Contact Phone', 'Plan Type', 'Price', 'Meals Left', 'End Date', 'Type', 'Status']]
    const body = subscriptions.map(sub => {
      const customer = sub.customer || {}
      return [
        sub.isCompany ? sub.companyName : (customer.name || 'N/A'),
        sub.isCompany ? sub.contactPhone : (customer.phone || 'N/A'),
        sub.planType.toUpperCase(),
        `PKR ${sub.price}`,
        String(sub.mealsRemaining),
        formatDate(sub.endDate),
        sub.isCompany ? 'CORPORATE' : 'INDIVIDUAL',
        sub.status.toUpperCase()
      ]
    })

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 38,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 26 },
        2: { cellWidth: 20 },
        3: { cellWidth: 22 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 16 }
      }
    })

    doc.save(`Subscribers_Directory_${new Date().toISOString().slice(0, 10)}.pdf`)
    addToast('Subscribers directory list exported as PDF successfully!', 'success')
  }

  const handleApprovePending = async (sub) => {
    try {
      setLoading(true)
      const matchingPlan = plans.find(p => p.planType === sub.planType)
      const mealsQuota = matchingPlan ? matchingPlan.totalMeals : (sub.planType === 'weekly' ? 6 : 24)

      await api.put(`/admin/subscriptions/${sub.id}`, {
        status: 'active',
        mealsRemaining: mealsQuota
      })
      addToast('Subscription approved and activated successfully!', 'success')
      fetchSubscriptions(page, searchQuery, statusFilter)
      fetchStats()
    } catch (err) {
      console.error(err)
      addToast(err.response?.data?.error || 'Failed to approve subscription.', 'error')
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <Badge variant="success">Active</Badge>
      case 'pending': return <Badge variant="warning">Pending Verification</Badge>
      case 'paused': return <Badge variant="warning">Paused</Badge>
      case 'cancelled': return <Badge variant="danger">Cancelled</Badge>
      default: return <Badge variant="primary">{status}</Badge>
    }
  }

  // Summary stats from the server-fetched stats state
  const activeCount  = stats.active
  const pendingCount = stats.pending
  const pausedCount  = stats.paused
  const totalRevenue = subscriptions.reduce((acc, s) => acc + (s.price || 0), 0)

  const filteredSubs = subscriptions  // already server-filtered

  return (
    <div className="flex flex-col gap-8 text-left w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Subscriptions Management</h1>
          <p className="text-sm text-gray-500">
            {activeTab === 'directory'
              ? 'Monitor all customer meal plans, delivery quotas, and active statuses.'
              : 'Configure pricing, meal counts, and validity days for weekly and monthly plans.'
            }
          </p>
        </div>

        {/* Filters */}
        {activeTab === 'directory' && (
          <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-white border border-emerald-100 hover:bg-emerald-50 text-primary text-xs font-bold rounded-2xl transition-all shadow-subtle cursor-pointer flex items-center gap-2 shrink-0 h-[38px]"
            >
              <Download className="w-4 h-4 text-primary" />
              Export PDF
            </button>
            {/* Search input */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-emerald-100 shadow-subtle w-full sm:w-auto">
              <Search className="w-4 h-4 text-primary shrink-0" />
              <input
                type="text"
                placeholder="Search subscriber…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(searchInput)
                    fetchSubscriptions(1, searchInput, statusFilter)
                    setPage(1)
                  }
                }}
                className="text-xs font-semibold text-text-dark bg-transparent focus:outline-none placeholder-gray-400 w-36"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); setSearchQuery(''); fetchSubscriptions(1, '', statusFilter); setPage(1) }} className="cursor-pointer text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Status filter */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-emerald-100 shadow-subtle w-fit shrink-0">
              <Sliders className="w-4 h-4 text-primary" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); fetchSubscriptions(1, searchQuery, e.target.value); setPage(1) }}
                className="text-xs font-semibold text-text-dark bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Verification</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-emerald-50 w-full -mt-2">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'directory'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-400 hover:text-text-dark'
          }`}
        >
          Subscribers Directory
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'pricing'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-400 hover:text-text-dark'
          }`}
        >
          Plan Pricing Settings
        </button>
      </div>

      {activeTab === 'directory' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="flex items-center gap-4 hover:translate-y-0" hoverable={false}>
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Active Plans</p>
                <p className="text-xl font-black text-text-dark">{loading ? '...' : activeCount}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 hover:translate-y-0" hoverable={false}>
              <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-500 animate-pulse">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Pending Approval</p>
                <p className="text-xl font-black text-text-dark">{loading ? '...' : pendingCount}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 hover:translate-y-0" hoverable={false}>
              <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
                <Pause className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Paused Plans</p>
                <p className="text-xl font-black text-text-dark">{loading ? '...' : pausedCount}</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4 hover:translate-y-0" hoverable={false}>
              <div className="p-3.5 rounded-2xl bg-primary/10 text-primary">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Total Value</p>
                <p className="text-xl font-black text-text-dark">{loading ? '...' : `PKR ${totalRevenue.toLocaleString()}`}</p>
              </div>
            </Card>
          </div>

          {/* Main List */}
          <Card className="p-8 hover:translate-y-0" hoverable={false}>
            <div className="flex items-center justify-between border-b border-emerald-50 pb-3 mb-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={subscriptions.length > 0 && selectedSubIds.length === subscriptions.length}
                  onChange={(e) => handleSelectAllSubs(e.target.checked)}
                  className="rounded border-emerald-205 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <h3 className="font-bold text-text-dark text-base">Subscriber Directories</h3>
              </div>
              <button onClick={() => fetchSubscriptions(page, searchQuery, statusFilter)} className="p-1.5 rounded-xl hover:bg-emerald-50 text-primary transition-all cursor-pointer">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col gap-4 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-emerald-50 rounded-2xl bg-white">
                    <div className="flex flex-col gap-2">
                      <div className="h-4 w-40 bg-gray-200 rounded-lg"></div>
                      <div className="h-3 w-48 bg-gray-100 rounded-lg"></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-4 w-16 bg-gray-200 rounded-lg"></div>
                      <div className="h-4 w-24 bg-gray-100 rounded-lg"></div>
                      <div className="h-8 w-8 bg-gray-100 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredSubs.map((sub) => {
                  return (
                    <Card
                      key={sub.id}
                      className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border border-emerald-50 bg-white hover:translate-y-0 ${
                        activeActionDropdownId === sub.id ? 'z-[60]' : 'z-10'
                      }`}
                      hoverable={false}
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0 w-full sm:w-auto flex-1 text-left">
                        <input
                          type="checkbox"
                          checked={selectedSubIds.includes(sub.id)}
                          onChange={() => handleToggleSelectSub(sub.id)}
                          className="rounded border-emerald-200 text-primary focus:ring-primary w-4 h-4 cursor-pointer shrink-0 mt-1 sm:mt-0"
                        />
                        <div className="flex flex-col gap-1.5 text-left min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap text-left">
                            <span className="text-sm font-bold text-text-dark">
                              {sub.customer?.name || 'Unknown User'}
                            </span>
                            <Badge variant={sub.planType === 'weekly' ? 'primary' : 'accent'}>
                              {sub.planType.toUpperCase()}
                            </Badge>
                            {getStatusBadge(sub.status)}
                            {sub.status === 'pending' && sub.paymentScreenshotUrl && (
                              <button
                                onClick={() => setViewScreenshotUrl(sub.paymentScreenshotUrl)}
                                className="text-xs font-black text-primary hover:text-emerald-700 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100"
                              >
                                <Eye className="w-3 h-3" />
                                View Receipt Proof
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-semibold truncate text-left">
                            Email: {sub.customer?.email} | Contact: {sub.customer?.phone || 'No phone'}
                          </p>
                          <div className="text-[10px] text-gray-455 font-bold flex flex-wrap gap-1.5 items-center mt-1 text-left">
                            <span>Slots:</span>
                            {(() => {
                              const elements = []
                              const slots = sub.preferences?.mealSlots
                              const parsedAllocated = parseAllocatedTimes(sub.allocatedDeliveryTime, slots)
                              const allocated = {
                                ...parsedAllocated,
                                ...(sub.preferences?.allocatedTimes || sub.allocatedTimes || {})
                              }
                              const custom = sub.preferences?.customTimes || {}
                              
                              if (slots) {
                                if (slots.breakfast) {
                                  elements.push(
                                    <span key="b" className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-0.5">
                                      B: {allocated.breakfast || custom.breakfast || 'Not Set'}
                                    </span>
                                  )
                                }
                                if (slots.lunch) {
                                  elements.push(
                                    <span key="l" className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-150 flex items-center gap-0.5">
                                      L: {allocated.lunch || custom.lunch || 'Not Set'}
                                    </span>
                                  )
                                }
                                if (slots.dinner) {
                                  elements.push(
                                    <span key="d" className="bg-indigo-50 text-indigo-850 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-0.5">
                                      D: {allocated.dinner || custom.dinner || 'Not Set'}
                                    </span>
                                  )
                                }
                              } else {
                                // Fallback
                                if (sub.allocatedDeliveryTime) {
                                  elements.push(
                                    <span key="legacy" className="bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 flex items-center gap-0.5">
                                      <Clock className="w-3 h-3" /> {sub.allocatedDeliveryTime}
                                    </span>
                                  )
                                }
                              }
                              return elements
                            })()}
                          </div>
                          <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 mt-1 text-left">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            <span>Duration: {formatDate(sub.startDate)} &rarr; {formatDate(sub.endDate)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2.5 shrink-0 relative">
                        {/* Send Menu WhatsApp SMS Button */}
                        {sub.status === 'active' && (
                          <button
                            onClick={() => handleSendWhatsAppNotification(sub)}
                            disabled={sendingSmsId === sub.id}
                            className="p-2.5 rounded-xl hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-all border border-emerald-100 cursor-pointer flex items-center justify-center bg-white shadow-sm disabled:opacity-50"
                            title="Send Menu WhatsApp SMS"
                          >
                            {sendingSmsId === sub.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {/* View Details Eye Icon Button */}
                        <button
                          onClick={() => handleEditClick(sub)}
                          className="p-2.5 rounded-xl hover:bg-emerald-50 text-gray-400 hover:text-primary transition-all border border-emerald-100 cursor-pointer flex items-center justify-center bg-white shadow-sm"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* 3-Dot Dropdown Actions Menu */}
                        <div className="relative action-dropdown-container shrink-0">
                          <button
                            onClick={() => setActiveActionDropdownId(activeActionDropdownId === sub.id ? null : sub.id)}
                            className="p-2.5 rounded-xl hover:bg-emerald-50 text-gray-400 hover:text-primary transition-all border border-emerald-100 hover:border-emerald-250 cursor-pointer flex items-center justify-center bg-white shadow-sm"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeActionDropdownId === sub.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-emerald-100 rounded-2xl shadow-lg z-[999] py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                              {sub.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => {
                                      handleApprovePending(sub)
                                      setActiveActionDropdownId(null)
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2 cursor-pointer"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    Approve Payment
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleQuickStatusUpdate(sub, 'cancelled')
                                      setActiveActionDropdownId(null)
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 cursor-pointer animate-pulse"
                                  >
                                    <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    Cancel Payment
                                  </button>
                                </>
                              )}

                              {sub.status === 'active' && (
                                <button
                                  onClick={() => {
                                    handleQuickStatusUpdate(sub, 'paused')
                                    setActiveActionDropdownId(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <Pause className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  Pause Plan
                                </button>
                              )}

                              {sub.status === 'paused' && (
                                <button
                                  onClick={() => {
                                    handleQuickStatusUpdate(sub, 'active')
                                    setActiveActionDropdownId(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <Play className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  Activate Plan
                                </button>
                              )}

                              {sub.status !== 'cancelled' && (
                                <button
                                  onClick={() => {
                                    handleQuickStatusUpdate(sub, 'cancelled')
                                    setActiveActionDropdownId(null)
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border-t border-emerald-50 mt-1 pt-2 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  Cancel Plan
                                </button>
                              )}

                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
                {filteredSubs.length === 0 && (
                  <p className="text-gray-450 py-12 text-center text-sm font-medium">No subscriptions found.</p>
                )}

                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={totalSubs}
                  limit={limit}
                  onPageChange={(pg) => { setPage(pg); fetchSubscriptions(pg, searchQuery, statusFilter) }}
                  onLimitChange={(newLimit) => { setLimit(newLimit); fetchSubscriptions(1, searchQuery, statusFilter, newLimit); setPage(1) }}
                />
              </div>
            )}
          </Card>

          {/* Sticky Bulk Action Bar */}
          {selectedSubIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
              <div className="bg-[#0d3320] border border-emerald-800 rounded-3xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-white">
                  <span className="bg-emerald-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-full">
                    {selectedSubIds.length}
                  </span>
                  <span className="text-xs font-bold">subscribers selected</span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2 bg-emerald-950/60 rounded-2xl px-3 py-1.5 border border-emerald-800/80 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="e.g. 1:45 PM"
                      value={bulkDeliveryTime}
                      onChange={(e) => setBulkDeliveryTime(e.target.value)}
                      className="bg-transparent text-xs font-bold text-white placeholder-emerald-700/80 focus:outline-none w-24 sm:w-28"
                    />
                    <button
                      onClick={handleBulkAllotTime}
                      disabled={loading}
                      className="bg-primary hover:bg-emerald-600 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      Allot Time
                    </button>
                  </div>
                  
                  <button
                    onClick={handleBulkSendWhatsApp}
                    disabled={isBulkSending}
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white text-xs font-black uppercase px-5 py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isBulkSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending SMS...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Send Menu SMS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <Card className="p-8 hover:translate-y-0" hoverable={false}>
          <div className="flex items-center justify-between border-b border-emerald-50 pb-3 mb-6">
            <h3 className="font-bold text-text-dark text-base">Plan Pricing Configuration</h3>
            <button onClick={fetchPlans} className="p-1.5 rounded-xl hover:bg-emerald-50 text-primary transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {plansLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan) => {
                const isWeekly = plan.planType === 'weekly'
                const isSaving = savingPlans[plan.id]
                return (
                  <Card key={plan.id} className="p-6 border border-emerald-100 bg-white rounded-3xl" hoverable={false}>
                    <div className="flex items-center gap-3.5 mb-5 pb-3 border-b border-gray-100">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                        isWeekly 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : plan.planType === 'monthly'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isWeekly ? 'W' : plan.planType === 'monthly' ? 'M' : 'C'}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-text-dark text-base capitalize">
                          {plan.planType === 'company' ? 'Company Plan' : `${plan.planType} Plan`}
                        </h4>
                        <p className="text-xs text-gray-450 font-semibold text-left">
                          {plan.planType === 'company' 
                            ? 'Define single meal pricing for corporate subscriptions' 
                            : 'Define flat pricing structure and parameters'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1.5 block">
                          {plan.planType === 'company' ? 'Price Per Single Meal (PKR)' : 'Price (PKR)'}
                        </label>
                        <Input
                          type="number"
                          value={plan.price}
                          onChange={(e) => handlePlanChange(plan.id, 'price', e.target.value)}
                          placeholder={plan.planType === 'company' ? 'e.g. 300' : 'e.g. 1800'}
                          className="w-full font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1.5 block">Discount (PKR)</label>
                        <Input
                          type="number"
                          value={plan.discount || 0}
                          onChange={(e) => handlePlanChange(plan.id, 'discount', e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1.5 block">Total Meals Quota</label>
                        <Input
                          type="number"
                          value={plan.totalMeals}
                          onChange={(e) => handlePlanChange(plan.id, 'totalMeals', e.target.value)}
                          placeholder="e.g. 6"
                          className="w-full font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1.5 block">Validity (Days)</label>
                        <Input
                          type="number"
                          value={plan.validityDays}
                          onChange={(e) => handlePlanChange(plan.id, 'validityDays', e.target.value)}
                          placeholder="e.g. 7"
                          className="w-full font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2.5 mt-2 border-t border-emerald-50/50 pt-4">
                        <div>
                          <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-1 block">
                            {plan.planType === 'company' ? 'B Meal Price' : 'Breakfast Price'}
                          </label>
                          <Input
                            type="number"
                            value={plan.breakfastPrice || ''}
                            onChange={(e) => handlePlanChange(plan.id, 'breakfastPrice', e.target.value)}
                            placeholder="B Price"
                            className="w-full font-semibold text-xs py-1.5 px-2.5"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-1 block">
                            {plan.planType === 'company' ? 'L Meal Price' : 'Lunch Price'}
                          </label>
                          <Input
                            type="number"
                            value={plan.lunchPrice || ''}
                            onChange={(e) => handlePlanChange(plan.id, 'lunchPrice', e.target.value)}
                            placeholder="L Price"
                            className="w-full font-semibold text-xs py-1.5 px-2.5"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-1 block">
                            {plan.planType === 'company' ? 'D Meal Price' : 'Dinner Price'}
                          </label>
                          <Input
                            type="number"
                            value={plan.dinnerPrice || ''}
                            onChange={(e) => handlePlanChange(plan.id, 'dinnerPrice', e.target.value)}
                            placeholder="D Price"
                            className="w-full font-semibold text-xs py-1.5 px-2.5"
                          />
                        </div>
                      </div>
                      
                      <Button
                        variant="primary"
                        onClick={() => handleSavePlanConfig(plan)}
                        isLoading={isSaving}
                        className="mt-4 w-full rounded-2xl py-3.5 font-bold shadow-subtle text-xs"
                      >
                        Save Configuration
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Card>

        {/* Plan Menu Schedules Section */}
        <Card className="p-8 hover:translate-y-0" hoverable={false}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-50 pb-3 mb-6 gap-3">
            <div>
              <h3 className="font-bold text-text-dark text-base">Plan Menu Schedules</h3>
              <p className="text-xs text-gray-500 mt-1">Configure day-by-day menu list served to subscribers</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50/50 p-1 rounded-2xl border border-emerald-100/50">
              <button
                type="button"
                onClick={() => setScheduleActiveTab('weekly')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  scheduleActiveTab === 'weekly'
                    ? 'bg-primary text-white shadow-subtle'
                    : 'text-gray-450 hover:text-text-dark'
                }`}
              >
                Weekly Plan
              </button>
              <button
                type="button"
                onClick={() => setScheduleActiveTab('monthly')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  scheduleActiveTab === 'monthly'
                    ? 'bg-primary text-white shadow-subtle'
                    : 'text-gray-450 hover:text-text-dark'
                }`}
              >
                Monthly Plan
              </button>
            </div>
          </div>

          {plansLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div>
              {(() => {
                const currentPlan = plans.find(p => p.planType === scheduleActiveTab)
                if (!currentPlan) return <p className="text-sm text-gray-500 text-center py-4">No plan configured.</p>

                const scheduleList = scheduleData[currentPlan.id] || []
                const isSaving = savingSchedule[currentPlan.id]
                const isWeekly = scheduleActiveTab === 'weekly'

                // If monthly plan, render subtabs for Days 1-10, 11-20, 21-30
                const filteredList = isWeekly
                  ? scheduleList
                  : scheduleList.filter(item => {
                      if (monthlySubTab === 1) return item.dayIndex >= 1 && item.dayIndex <= 10
                      if (monthlySubTab === 2) return item.dayIndex >= 11 && item.dayIndex <= 20
                      if (monthlySubTab === 3) return item.dayIndex >= 21 && item.dayIndex <= 30
                      return true
                    })

                return (
                  <div className="flex flex-col gap-6">
                    {!isWeekly && (
                      <div className="flex items-center gap-2 bg-emerald-50/50 p-1.5 rounded-2xl border border-emerald-100/50 w-fit">
                        <button
                          type="button"
                          onClick={() => setMonthlySubTab(1)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            monthlySubTab === 1 ? 'bg-white text-primary shadow-subtle' : 'text-gray-450 hover:text-text-dark'
                          }`}
                        >
                          Days 1 - 10
                        </button>
                        <button
                          type="button"
                          onClick={() => setMonthlySubTab(2)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            monthlySubTab === 2 ? 'bg-white text-primary shadow-subtle' : 'text-gray-450 hover:text-text-dark'
                          }`}
                        >
                          Days 11 - 20
                        </button>
                        <button
                          type="button"
                          onClick={() => setMonthlySubTab(3)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            monthlySubTab === 3 ? 'bg-white text-primary shadow-subtle' : 'text-gray-450 hover:text-text-dark'
                          }`}
                        >
                          Days 21 - 30
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredList.map((item) => {
                        const dayLabel = isWeekly 
                          ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][item.dayIndex - 1] || `Day ${item.dayIndex}`
                          : `Day ${item.dayIndex}`;

                        const renderMealInput = (category, label, icon) => {
                          const mealObj = item[category] || { name: '', description: '' };
                          const isDropdownActive = activeDropdown && 
                            activeDropdown.planId === currentPlan.id && 
                            activeDropdown.dayIndex === item.dayIndex && 
                            activeDropdown.category === category;
                          
                          const queryValue = mealObj.name || '';
                          const matchingMeals = meals.filter(m =>
                            m.name.toLowerCase().includes(queryValue.toLowerCase())
                          );

                          return (
                            <div className="flex flex-col gap-1 text-left">
                              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                                <span>{icon}</span> <span>{label}</span>
                              </span>
                              <div className="relative flex flex-col gap-1.5">
                                {/* Meal Name Input */}
                                <Input
                                  type="text"
                                  value={mealObj.name}
                                  onChange={(e) => handleScheduleMealSlotChange(currentPlan.id, item.dayIndex, category, 'name', e.target.value)}
                                  onFocus={() => setActiveDropdown({ planId: currentPlan.id, dayIndex: item.dayIndex, category })}
                                  onBlur={() => setTimeout(() => setActiveDropdown(null), 250)}
                                  placeholder={`Select or type ${label} item...`}
                                  className="w-full text-xs font-bold py-2 border-emerald-100 bg-[#F9FBF9]/30 focus:bg-white rounded-xl"
                                />
                                {/* Meal Description Input */}
                                <Input
                                  type="text"
                                  value={mealObj.description}
                                  onChange={(e) => handleScheduleMealSlotChange(currentPlan.id, item.dayIndex, category, 'description', e.target.value)}
                                  placeholder="Description (optional - auto if blank)..."
                                  className="w-full text-[10px] py-1 border-gray-100 bg-gray-50/20 text-gray-500 rounded-lg placeholder-gray-350"
                                />

                                {isDropdownActive && matchingMeals.length > 0 && (
                                  <div className="absolute z-[99] left-0 right-0 top-10 max-h-48 overflow-y-auto bg-white border border-emerald-100 rounded-xl shadow-lg">
                                    {matchingMeals.map(m => (
                                      <div
                                        key={m.id}
                                        onMouseDown={() => {
                                          handleScheduleMealSlotChange(currentPlan.id, item.dayIndex, category, 'name', m.name);
                                          handleScheduleMealSlotChange(currentPlan.id, item.dayIndex, category, 'description', m.description);
                                        }}
                                        className="px-3.5 py-2 text-[11px] font-bold hover:bg-emerald-50 text-text-dark cursor-pointer flex justify-between items-center transition-colors border-b border-emerald-50/50 last:border-0"
                                      >
                                        <span>{m.name}</span>
                                        <Badge variant="primary" className="text-[9px] px-1.5 py-0">
                                          {m.category}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        };

                        return (
                          <div key={item.dayIndex} className="relative flex flex-col gap-3.5 p-5 rounded-3xl border border-emerald-100/70 bg-[#F9FBF9]/20 shadow-sm hover:shadow-md transition-all">
                            <span className="text-sm font-black text-emerald-800 uppercase tracking-tight">{dayLabel}</span>
                            <div className="flex flex-col gap-3.5 mt-1">
                              {renderMealInput('breakfast', 'Breakfast', '🍳')}
                              {renderMealInput('lunch', 'Lunch', '☀️')}
                              {renderMealInput('dinner', 'Dinner', '🌙')}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button
                        variant="primary"
                        onClick={() => handleSaveSchedule(currentPlan.id)}
                        isLoading={isSaving}
                        className="px-6 py-3 rounded-2xl font-bold text-xs shadow-subtle w-full sm:w-auto"
                      >
                        Save {scheduleActiveTab.toUpperCase()} Meal Schedule
                      </Button>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </Card>
      </>
    )}

      {/* Details View Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Subscriber Details"
      >
        {selectedSub && (() => {
          const selectedSubMatchingPlan = plans.find(p => p.planType === selectedSub.planType)
          const selectedSubTotalMeals = selectedSubMatchingPlan ? selectedSubMatchingPlan.totalMeals : (selectedSub.planType === 'weekly' ? 6 : 24)
          const selectedSubMealsSent = Math.max(0, selectedSubTotalMeals - selectedSub.mealsRemaining)

          return (
            <div className="flex flex-col gap-6 text-left text-sm max-h-[75vh] overflow-y-auto pr-1">
              <div className="flex justify-between items-center border-b border-emerald-50 pb-2">
                <div>
                  <h4 className="font-black text-text-dark text-base">Subscriber Information</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Plan Type: {selectedSub.planType}</p>
                </div>
                <Badge variant={selectedSub.planType === 'weekly' ? 'primary' : 'accent'}>
                  {selectedSub.planType.toUpperCase()} PLAN
                </Badge>
              </div>

              {/* Customer Details Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/20 p-4.5 rounded-2xl border border-emerald-100/50">
                <div className="flex flex-col gap-2.5">
                  <p className="text-[10px] font-black text-primary uppercase tracking-wider">Customer Profile</p>
                  
                  <div className="flex items-center gap-2 text-text-dark text-xs">
                    <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold">{selectedSub.customer?.name || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-text-dark text-xs">
                    <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold truncate">{selectedSub.customer?.email || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-text-dark text-xs">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{selectedSub.customer?.phone || 'No Phone Number'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-black text-primary uppercase tracking-wider">Meal Tracker & Quota</p>
                  
                  <div className="grid grid-cols-2 gap-2.5 text-center">
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-sm">
                      <p className="text-[9px] text-gray-400 font-extrabold uppercase">Delivered</p>
                      <p className="text-sm font-black text-emerald-600 mt-0.5">{selectedSubMealsSent} Sent</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-sm">
                      <p className="text-[9px] text-gray-400 font-extrabold uppercase">Remaining</p>
                      <p className="text-sm font-black text-primary mt-0.5">{selectedSub.mealsRemaining} Left</p>
                    </div>
                  </div>

                  <div className="text-[9px] text-gray-500 font-semibold text-center bg-white/50 rounded-lg py-1 border border-emerald-50">
                    Total Plan Quota: {selectedSubTotalMeals} Meals
                  </div>
                </div>
              </div>

              {selectedSub.status === 'pending' && selectedSub.paymentScreenshotUrl && (
                <div className="border border-emerald-100 rounded-2xl p-4 bg-emerald-50/20 flex flex-col gap-2">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Payment Screenshot Receipt</p>
                  <div className="max-w-xs overflow-hidden rounded-xl border border-emerald-100 bg-white">
                    <img
                      src={selectedSub.paymentScreenshotUrl}
                      alt="Receipt verification"
                      className="w-full h-auto object-cover max-h-[200px] cursor-pointer"
                      onClick={() => setViewScreenshotUrl(selectedSub.paymentScreenshotUrl)}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-semibold">Click image to expand view</p>
                </div>
              )}

              {/* Editable Subscription Configuration Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/10 p-4.5 rounded-2xl border border-emerald-50/50 mt-1">
                <div>
                  <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block mb-1">Plan Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full text-xs font-bold bg-white border border-emerald-100 rounded-xl px-3 py-2 text-text-dark focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block mb-1">Meals Remaining</label>
                  <input
                    type="number"
                    value={editMeals}
                    onChange={(e) => setEditMeals(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-white border border-emerald-100 rounded-xl px-3 py-2 text-text-dark focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block mb-1">Preferred Menu Type</label>
                  <select
                    value={editMealCategory}
                    onChange={(e) => setEditMealCategory(e.target.value)}
                    className="w-full text-xs font-bold bg-white border border-emerald-100 rounded-xl px-3 py-2 text-text-dark focus:outline-none"
                  >
                    <option value="balanced">Balanced</option>
                    <option value="diet">Diet</option>
                    <option value="keto">Keto</option>
                    <option value="high-protein">High Protein</option>
                  </select>
                </div>

                <div className="sm:col-span-2 text-left">
                  <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block mb-2">Preferred Delivery Slots</label>
                  <div className="flex gap-4 flex-wrap">
                    <label className="flex items-center gap-2 text-xs font-bold text-text-dark cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editHasBreakfast}
                        onChange={(e) => setEditHasBreakfast(e.target.checked)}
                        className="rounded border-emerald-200 text-primary focus:ring-primary w-4 h-4"
                      />
                      🍳 Breakfast
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-text-dark cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editHasLunch}
                        onChange={(e) => setEditHasLunch(e.target.checked)}
                        className="rounded border-emerald-200 text-primary focus:ring-primary w-4 h-4"
                      />
                      ☀️ Lunch
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-text-dark cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editHasDinner}
                        onChange={(e) => setEditHasDinner(e.target.checked)}
                        className="rounded border-emerald-200 text-primary focus:ring-primary w-4 h-4"
                      />
                      🌙 Dinner
                    </label>
                  </div>
                </div>

                {editHasBreakfast && (
                  <div className="sm:col-span-2 text-left">
                    <label className="text-[10px] text-gray-450 font-extrabold uppercase tracking-wider block mb-1">
                      🍳 Breakfast Delivery Time (User Pref: {selectedSub.preferences?.customTimes?.breakfast || 'None'})
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 8:15 AM"
                      value={editAllocatedBreakfast}
                      onChange={(e) => setEditAllocatedBreakfast(e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-emerald-100 rounded-xl px-3 py-2 text-text-dark focus:outline-none"
                    />
                  </div>
                )}
                {editHasLunch && (
                  <div className="sm:col-span-2 text-left">
                    <label className="text-[10px] text-gray-455 font-extrabold uppercase tracking-wider block mb-1">
                      ☀️ Lunch Delivery Time (User Pref: {selectedSub.preferences?.customTimes?.lunch || 'None'})
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1:30 PM"
                      value={editAllocatedLunch}
                      onChange={(e) => setEditAllocatedLunch(e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-emerald-100 rounded-xl px-3 py-2 text-text-dark focus:outline-none"
                    />
                  </div>
                )}
                {editHasDinner && (
                  <div className="sm:col-span-2 text-left">
                    <label className="text-[10px] text-gray-450 font-extrabold uppercase tracking-wider block mb-1">
                      🌙 Dinner Delivery Time (User Pref: {selectedSub.preferences?.customTimes?.dinner || 'None'})
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 8:00 PM"
                      value={editAllocatedDinner}
                      onChange={(e) => setEditAllocatedDinner(e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-emerald-100 rounded-xl px-3 py-2 text-text-dark focus:outline-none"
                    />
                  </div>
                )}

                <div className="sm:col-span-2 text-left">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Plan Duration Range</span>
                  <span className="text-xs font-bold text-text-dark mt-1 block">
                    {formatDate(selectedSub.startDate)} &rarr; {formatDate(selectedSub.endDate)}
                  </span>
                </div>
              </div>

              <div className="flex mt-4 justify-between items-center gap-3">
                {selectedSub.status === 'active' && (
                  <Button
                    variant="outline"
                    onClick={() => handleSendWhatsAppNotification(selectedSub)}
                    isLoading={sendingSmsId === selectedSub.id}
                    className="rounded-xl px-4 py-2.5 text-xs font-bold border-emerald-600 text-emerald-800 hover:bg-emerald-50 flex items-center gap-1.5 shadow-sm"
                  >
                    <Mail className="w-4 h-4 text-emerald-800" /> Send Menu SMS
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="rounded-xl px-4 py-2.5 text-xs font-bold">
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleUpdateSubscription}
                    isLoading={updating}
                    className="rounded-xl px-5 py-2.5 text-xs font-bold shadow-subtle bg-primary text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>

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

      {/* Pause Animation Overlay */}
      {isPausingId && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center flex flex-col items-center shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-amber-50/50 rounded-full flex items-center justify-center mb-6 border-2 border-amber-100 relative">
              <Truck className="w-10 h-10 text-amber-500 animate-bounce relative z-10" />
              <div className="absolute inset-0 border-4 border-amber-200 rounded-full animate-ping opacity-20"></div>
            </div>
            <h3 className="text-xl font-black text-text-dark mb-2">Pausing Plan...</h3>
            <p className="text-sm text-gray-500 font-semibold leading-relaxed">
              Updating subscription and notifying the customer via WhatsApp.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
