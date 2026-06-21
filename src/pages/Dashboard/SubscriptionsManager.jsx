import React, { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToastStore } from '../../store/toastStore'
import { formatDate, formatDateTime } from '../../services/dateFormatter'
import { Calendar, Users, Sliders, Edit, CheckCircle, Pause, AlertCircle, RefreshCw, XCircle, DollarSign, Eye, Loader2, Play, X, MoreVertical, Mail, Phone, User, Info, Truck, Search, Download } from 'lucide-react'
import Pagination from '../../components/ui/Pagination'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'


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
  const [savingSchedule, setSavingSchedule] = useState({})
  const [activeDropdown, setActiveDropdown] = useState(null) // { planId, dayIndex }

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
      setPlans(res.data)
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
    const totalDays = plan.totalMeals || (plan.planType === 'weekly' ? 7 : 30)
    const list = []
    for (let i = 1; i <= totalDays; i++) {
      const existing = plan.mealSchedules?.find(s => s.dayIndex === i)
      list.push({
        dayIndex: i,
        mealName: existing ? existing.mealName : '',
        mealId: existing ? existing.mealId : null
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

  useEffect(() => {
    if (plans.length > 0) {
      const initialSchedules = {}
      plans.forEach(plan => {
        initialSchedules[plan.id] = getInitializedSchedule(plan)
      })
      setScheduleData(initialSchedules)
    }
  }, [plans])

  const handleScheduleMealChange = (planId, dayIndex, mealName, mealId = null) => {
    setScheduleData(prev => {
      const currentPlanSchedule = [...(prev[planId] || [])]
      const index = currentPlanSchedule.findIndex(item => item.dayIndex === dayIndex)
      if (index > -1) {
        currentPlanSchedule[index] = { dayIndex, mealName, mealId }
      } else {
        currentPlanSchedule.push({ dayIndex, mealName, mealId })
      }
      return { ...prev, [planId]: currentPlanSchedule }
    })
  }

  const handleSaveSchedule = async (planId) => {
    try {
      setSavingSchedule(prev => ({ ...prev, [planId]: true }))
      const schedules = scheduleData[planId] || []
      
      const formattedSchedules = schedules.map(item => ({
        dayIndex: item.dayIndex,
        mealName: item.mealName.trim() || 'Chef\'s Choice',
        mealId: item.mealId
      }))

      await api.put(`/admin/plans/${planId}/schedule`, { schedules: formattedSchedules })
      addToast('Meal schedule saved successfully!', 'success')
      fetchPlans() // Refresh plans to sync mealSchedules
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
        return { ...p, [field]: value }
      }
      return p
    }))
  }

  const handleSavePlanConfig = async (plan) => {
    try {
      setSavingPlans(prev => ({ ...prev, [plan.id]: true }))
      await api.put(`/admin/plans/${plan.id}`, {
        price: Number(plan.price),
        discount: Number(plan.discount || 0),
        totalMeals: Number(plan.totalMeals),
        validityDays: Number(plan.validityDays)
      })
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
      setFilteredSubs(prev => prev.map(s => s.id === sub.id ? { ...s, status: newStatus } : s))
      
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
    setIsModalOpen(true)
  }

  const handleUpdateSubscription = async () => {
    try {
      setUpdating(true)
      const res = await api.put(`/admin/subscriptions/${selectedSub.id}`, {
        status: editStatus,
        mealsRemaining: editMeals,
        preferenceDeliveryTime: editDeliveryTime,
        preferenceMealCategory: editMealCategory
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

  const handleExportPDF = () => {
    if (subscriptions.length === 0) {
      addToast('No subscriptions to export.', 'warning')
      return
    }

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
              <h3 className="font-bold text-text-dark text-base">Subscriber Directories</h3>
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
                  const matchingPlan = plans.find(p => p.planType === sub.planType)
                  const totalMeals = matchingPlan ? matchingPlan.totalMeals : (sub.planType === 'weekly' ? 6 : 24)
                  const mealsSent = Math.max(0, totalMeals - sub.mealsRemaining)

                  return (
                    <Card
                      key={sub.id}
                      className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border border-emerald-50 bg-white hover:translate-y-0 ${
                        activeActionDropdownId === sub.id ? 'z-[60]' : 'z-10'
                      }`}
                      hoverable={false}
                    >
                      <div className="flex flex-col gap-1.5 text-left min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
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
                        <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>Duration: {formatDate(sub.startDate)} &rarr; {formatDate(sub.endDate)}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2.5 shrink-0 relative">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {plans.map((plan) => {
                const isWeekly = plan.planType === 'weekly'
                const isSaving = savingPlans[plan.id]
                return (
                  <Card key={plan.id} className="p-6 border border-emerald-100 bg-white rounded-3xl" hoverable={false}>
                    <div className="flex items-center gap-3.5 mb-5 pb-3 border-b border-gray-100">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                        isWeekly ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isWeekly ? 'W' : 'M'}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-text-dark text-base capitalize">{plan.planType} Plan</h4>
                        <p className="text-xs text-gray-450 font-semibold">Define pricing structure and parameters</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1.5 block">Price (PKR)</label>
                        <Input
                          type="number"
                          value={plan.price}
                          onChange={(e) => handlePlanChange(plan.id, 'price', e.target.value)}
                          placeholder="e.g. 1800"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredList.map((item) => {
                        const isDropdownActive = activeDropdown && activeDropdown.planId === currentPlan.id && activeDropdown.dayIndex === item.dayIndex
                        const matchingMeals = meals.filter(m =>
                          m.name.toLowerCase().includes((item.mealName || '').toLowerCase())
                        )

                        return (
                          <div key={item.dayIndex} className="relative flex flex-col gap-1.5 p-4 rounded-2xl border border-emerald-100 bg-white">
                            <span className="text-[10px] text-primary font-black uppercase tracking-wider">Day {item.dayIndex}</span>
                            <div className="relative">
                              <Input
                                type="text"
                                value={item.mealName}
                                onChange={(e) => handleScheduleMealChange(currentPlan.id, item.dayIndex, e.target.value, null)}
                                onFocus={() => setActiveDropdown({ planId: currentPlan.id, dayIndex: item.dayIndex })}
                                onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                                placeholder="Type custom meal or select catalog..."
                                className="w-full text-xs font-bold py-2"
                              />
                              {isDropdownActive && matchingMeals.length > 0 && (
                                <div className="absolute z-[99] left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-emerald-100 rounded-xl shadow-lg">
                                  {matchingMeals.map(m => (
                                    <div
                                      key={m.id}
                                      onMouseDown={() => handleScheduleMealChange(currentPlan.id, item.dayIndex, m.name, m.id)}
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
                        )
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

              {/* Read-only Subscription Configuration Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/10 p-4.5 rounded-2xl border border-emerald-50/50 mt-1">
                <div>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Plan Status</span>
                  <div className="mt-1.5 block">{getStatusBadge(selectedSub.status)}</div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Plan Duration Range</span>
                  <span className="text-xs font-bold text-text-dark mt-2 block">
                    {formatDate(selectedSub.startDate)} &rarr; {formatDate(selectedSub.endDate)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Preferred Menu Type</span>
                  <span className="text-xs font-bold text-text-dark mt-2 block capitalize">{selectedSub.preferenceMealCategory}</span>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Preferred Delivery Slot</span>
                  <span className="text-xs font-bold text-text-dark mt-2 block capitalize">{selectedSub.preferenceDeliveryTime} Slot</span>
                </div>
              </div>

              <div className="flex mt-4 justify-end">
                <Button variant="primary" onClick={() => setIsModalOpen(false)} className="rounded-xl px-6 py-2.5 text-xs font-bold shadow-subtle">
                  Close Details
                </Button>
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
