import React, { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Pagination from '../../components/ui/Pagination'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { formatDate, formatDateTime } from '../../services/dateFormatter'
import { Calendar, Filter, Eye, Upload, AlertCircle, CheckCircle, User, Search, X, Truck, Phone, Mail, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'


const DEFAULT_LIMIT = 20

export default function Orders() {
  const { addToast } = useToastStore()
  const { user } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [uploading, setUploading] = useState(false)
  const [riders, setRiders] = useState([])
  const [updatingStatus, setUpdatingStatus] = useState(false)
  
  // Sub-tabs (Admin only): 'one-time' vs 'subscription'
  const [activeTab, setActiveTab] = useState('one-time')
  const [subActiveTab, setSubActiveTab] = useState('individual') // 'individual' vs 'company'
  const [subStats, setSubStats] = useState({
    individualCount: 0,
    companyCount: 0,
    companyWorkersCount: 0
  })

  // Pagination + search (admin only)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [generatingOrders, setGeneratingOrders] = useState(false)

  const handleGenerateDailyDeliveries = async () => {
    try {
      setGeneratingOrders(true)
      const res = await api.post('/admin/subscriptions/generate-today-orders')
      addToast(res.data.message || 'Daily orders generated successfully!', 'success')
      // Refresh statistics and list
      fetchActiveSubsCount()
      fetchOrders(1, searchQuery, statusFilter, limit, activeTab, subActiveTab)
    } catch (err) {
      console.error('Failed to generate daily orders:', err)
      addToast(err.response?.data?.error || 'Failed to generate today\'s subscription orders.', 'error')
    } finally {
      setGeneratingOrders(false)
    }
  }

  const handleExportPDF = () => {
    if (orders.length === 0) {
      addToast('No data to export.', 'warning')
      return
    }

    const doc = new jsPDF()

    if (activeTab === 'one-time') {
      doc.setFontSize(18)
      doc.setTextColor(2, 48, 32)
      doc.text("Home Tiffin - One-Time Orders", 14, 20)

      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated on: ${formatDateTime(new Date())}`, 14, 26)
      doc.text(`Total Orders: ${orders.length}`, 14, 32)

      const headers = [['Order No', 'Customer Name', 'Phone', 'Items', 'Total Price', 'Status', 'Date']]
      const body = orders.map(order => {
        const itemsStr = Array.isArray(order.items)
          ? order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')
          : 'Tiffin Order'
        return [
          order.orderNumber,
          order.customerName,
          order.customerPhone || 'N/A',
          itemsStr,
          `PKR ${order.billingTotal}`,
          order.status.toUpperCase(),
          formatDate(order.createdAt)
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
          0: { cellWidth: 20 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 55 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 18 }
        }
      })

      doc.save(`One_Time_Orders_${new Date().toISOString().slice(0, 10)}.pdf`)
      addToast('One-time orders exported as PDF successfully!', 'success')
    } else {
      // Subscription Deliveries
      doc.setFontSize(18)
      doc.setTextColor(2, 48, 32)
      doc.text("Home Tiffin - Subscription Deliveries", 14, 20)

      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated on: ${formatDateTime(new Date())}`, 14, 26)
      doc.text(`Total Active Subscriptions: ${orders.length}`, 14, 32)

      const headers = [['Subscriber/Company', 'Phone', 'Type', 'Delivery Time', 'Category', 'Worker Count', 'Meals Remaining', 'Expiry']]
      const body = orders.map(sub => {
        const customer = sub.customer || {}
        return [
          sub.isCompany ? sub.companyName : (customer.name || 'N/A'),
          sub.isCompany ? sub.contactPhone : (customer.phone || 'N/A'),
          sub.planType.toUpperCase(),
          sub.preferenceDeliveryTime?.toUpperCase() || 'LUNCH',
          sub.preferenceMealCategory || 'Balanced',
          String(sub.workerCount || 1),
          String(sub.mealsRemaining),
          formatDate(sub.endDate)
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
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
          4: { cellWidth: 22 },
          5: { cellWidth: 18 },
          6: { cellWidth: 22 },
          7: { cellWidth: 20 }
        }
      })

      doc.save(`Subscription_Deliveries_${new Date().toISOString().slice(0, 10)}.pdf`)
      addToast('Subscription deliveries list exported as PDF successfully!', 'success')
    }
  }

  const fetchActiveSubsCount = useCallback(async () => {
    try {
      const res = await api.get('/admin/subscriptions/stats')
      setSubStats(res.data)
    } catch (err) {
      console.error('Failed to load subscription stats:', err)
    }
  }, [])

  const fetchOrders = useCallback(async (pg = 1, search = '', status = '', lim = limit, currentTab = activeTab, currentSubTab = subActiveTab) => {
    try {
      setLoading(true)
      if (user?.role === 'admin') {
        if (currentTab === 'one-time') {
          const params = new URLSearchParams({ page: pg, limit: lim, type: 'one-time' })
          if (search) params.set('search', search)
          if (status) params.set('status', status)
          const res = await api.get(`/admin/orders?${params}`)
          setOrders(res.data.data)
          setTotal(res.data.total)
          setTotalPages(res.data.totalPages)
          setPage(res.data.page)
        } else {
          // Fetch active subscription deliveries (filtered by type: individual vs company)
          const params = new URLSearchParams({ page: pg, limit: lim, status: 'active', type: currentSubTab })
          if (search) params.set('search', search)
          const res = await api.get(`/admin/subscriptions?${params}`)
          setOrders(res.data.data)
          setTotal(res.data.total)
          setTotalPages(res.data.totalPages)
          setPage(res.data.page)
        }
      } else {
        const res = await api.get('/orders/my-orders')
        setOrders(res.data)
        setTotal(res.data.length)
        setTotalPages(1)
        setPage(1)
      }
    } catch (err) {
      console.error('Failed to load orders:', err)
      addToast('Failed to retrieve orders list.', 'error')
    } finally {
      setLoading(false)
    }
  }, [user, addToast, limit, activeTab, subActiveTab])

  const fetchRiders = async () => {
    if (user?.role !== 'admin') return
    try {
      const res = await api.get('/admin/riders')
      setRiders(res.data)
    } catch (err) {
      console.error('Failed to load riders list:', err)
    }
  }

  const handleUpdateOrder = async (orderId, newStatus, newRiderId) => {
    try {
      setUpdatingStatus(true)
      const res = await api.put(`/orders/${orderId}/status`, {
        status: newStatus,
        riderId: newRiderId || null
      })
      addToast('Order updated successfully!', 'success')
      setSelectedOrder(res.data)
      fetchOrders(page, searchQuery, statusFilter)
    } catch (err) {
      console.error('Failed to update order status:', err)
      addToast(err.response?.data?.error || 'Failed to update order.', 'error')
    } finally {
      setUpdatingStatus(false)
    }
  }

  useEffect(() => {
    fetchOrders(1, '', '', limit, activeTab)
    fetchRiders()
    if (user?.role === 'admin') {
      fetchActiveSubsCount()
    }
  }, [user, fetchActiveSubsCount])

  // Apply filters/search – reset to page 1
  const applySearch = () => {
    setSearchQuery(searchInput)
    fetchOrders(1, searchInput, statusFilter)
    setPage(1)
  }

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val)
    fetchOrders(1, searchQuery, val)
    setPage(1)
  }

  const handlePageChange = (pg) => {
    setPage(pg)
    fetchOrders(pg, searchQuery, statusFilter)
  }

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit)
    fetchOrders(1, searchQuery, statusFilter, newLimit)
    setPage(1)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    fetchOrders(1, '', statusFilter)
    setPage(1)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchInput('')
    setSearchQuery('')
    setStatusFilter('')
    setPage(1)
    fetchOrders(1, '', '', limit, tab, subActiveTab)
  }

  const handleSubTabChange = (subTab) => {
    setSubActiveTab(subTab)
    setSearchInput('')
    setSearchQuery('')
    setPage(1)
    fetchOrders(1, '', '', limit, activeTab, subTab)
  }

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const getBadgeVariant = (status) => {
    switch (status) {
      case 'Delivered': return 'success'
      case 'Preparing': return 'warning'
      case 'Picked Up': return 'accent'
      case 'Nearby': return 'accent'
      default: return 'primary'
    }
  }

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('screenshot', file)
    try {
      setUploading(true)
      const res = await api.post(`/orders/${selectedOrder.id}/screenshot`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      addToast('Payment proof screenshot uploaded!', 'success')
      setSelectedOrder(res.data.order)
      fetchOrders(page, searchQuery, statusFilter)
    } catch (err) {
      console.error('Upload error:', err)
      addToast(err.response?.data?.error || 'Screenshot upload failed.', 'error')
    } finally {
      setUploading(false)
    }
  }

  // Address helper for Subscription Cards
  const getAddressString = (customer) => {
    if (!customer) return 'No address provided'
    if (customer.savedAddresses) {
      try {
        const addrs = typeof customer.savedAddresses === 'string'
          ? JSON.parse(customer.savedAddresses)
          : customer.savedAddresses
        if (Array.isArray(addrs) && addrs.length > 0) {
          const def = addrs.find((a) => a.isDefault || a.default) || addrs[0]
          return def.address || def.street || 'No address specified'
        }
      } catch (e) {
        console.error(e)
      }
    }
    return 'No address provided'
  }

  // Client side filtering for customers
  const displayedOrders = user?.role === 'admin'
    ? orders
    : (statusFilter ? orders.filter(o => o.status === statusFilter) : orders)

  return (
    <div className="flex flex-col gap-8 text-left w-full pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">
            {user?.role === 'admin' ? 'All Customer Orders' : 'My Orders'}
          </h1>
          <p className="text-sm text-gray-500">
            {user?.role === 'admin'
              ? 'View, track, and manage status and rider dispatches for all customer tiffins.'
              : 'Track and view history of all your tiffin requests.'}
          </p>
        </div>

        {user?.role === 'admin' && (
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleExportPDF}
              className="px-4 py-3 bg-white border border-emerald-100 hover:bg-emerald-50 text-primary text-xs font-bold rounded-2xl transition-all shadow-subtle cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-primary" />
              Export PDF
            </button>

            {activeTab === 'subscription' && (
              <button
                onClick={handleGenerateDailyDeliveries}
                disabled={generatingOrders}
                className="px-5 py-3 bg-emerald-600 text-white text-xs font-bold rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-subtle cursor-pointer flex items-center gap-2"
              >
                <Truck className="w-4 h-4 text-white" />
                {generatingOrders ? 'Generating...' : "Generate Today's Subscription Orders"}
              </button>
            )}
          </div>
        )}

        {/* Status Filter (Only on One-Time tab or Customer view) */}
        {((user?.role === 'admin' && activeTab === 'one-time') || user?.role !== 'admin') && (
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-emerald-100 shadow-subtle w-fit shrink-0">
            <Filter className="w-4 h-4 text-primary" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="text-xs font-semibold text-text-dark bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Preparing">Preparing</option>
              <option value="Picked Up">Picked Up</option>
              <option value="Nearby">Nearby</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        )}
      </div>

      {/* Sub-Tabs (Admin Only) */}
      {user?.role === 'admin' && (
        <div className="flex gap-2 border-b border-emerald-50 pb-px">
          <button
            onClick={() => handleTabChange('one-time')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'one-time'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            One-Time Orders
          </button>
          <button
            onClick={() => handleTabChange('subscription')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'subscription'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Subscription Deliveries
          </button>
        </div>
      )}

      {/* Stats Cards (Admin + Subscription Tab only) */}
      {user?.role === 'admin' && activeTab === 'subscription' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100/60 shadow-subtle text-left" hoverable={false}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-primary/85 font-extrabold uppercase tracking-wider">Individual Deliveries</p>
                <h3 className="text-3xl font-black text-primary mt-1.5">{subStats.individualCount} Persons</h3>
                <p className="text-xs text-gray-500 mt-1 font-semibold">Active single-person subscriptions today</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-50/40 to-white border border-amber-100/60 shadow-subtle text-left" hoverable={false}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider">Active Companies</p>
                <h3 className="text-3xl font-black text-amber-600 mt-1.5">{subStats.companyCount} Companies</h3>
                <p className="text-xs text-gray-500 mt-1 font-semibold">Registered company tenders active today</p>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-sky-50/40 to-white border border-sky-100/60 shadow-subtle text-left" hoverable={false}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-sky-800 font-extrabold uppercase tracking-wider">Corporate Worker Meals</p>
                <h3 className="text-3xl font-black text-sky-600 mt-1.5">{subStats.companyWorkersCount} Workers</h3>
                <p className="text-xs text-gray-500 mt-1 font-semibold">Total company meals to deliver today</p>
              </div>
              <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-sky-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Inner Sub-Tabs (Admin + Subscription Tab only) */}
      {user?.role === 'admin' && activeTab === 'subscription' && (
        <div className="flex gap-2.5 bg-emerald-50/45 p-1 rounded-2xl border border-emerald-100/50 w-fit">
          <button
            onClick={() => handleSubTabChange('individual')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              subActiveTab === 'individual'
                ? 'bg-primary text-white shadow-subtle'
                : 'text-gray-500 hover:text-gray-700 hover:bg-emerald-50/30'
            }`}
          >
            Individual Deliveries ({subStats.individualCount})
          </button>
          <button
            onClick={() => handleSubTabChange('company')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              subActiveTab === 'company'
                ? 'bg-primary text-white shadow-subtle'
                : 'text-gray-500 hover:text-gray-700 hover:bg-emerald-50/30'
            }`}
          >
            Company Subscriptions ({subStats.companyCount})
          </button>
        </div>
      )}

      {/* Search bar – admin only */}
      {user?.role === 'admin' && (
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2.5 bg-white px-4 py-3 rounded-2xl border border-emerald-100 shadow-subtle">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder={activeTab === 'one-time' ? "Search by order number, customer name or phone…" : "Search by customer name, email or phone…"}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              className="w-full text-xs font-semibold bg-transparent text-text-dark focus:outline-none placeholder-gray-400"
            />
            {searchInput && (
              <button onClick={handleClearSearch} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={applySearch}
            className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-subtle cursor-pointer"
          >
            Search
          </button>
        </div>
      )}

      {/* Main List */}
      {loading ? (
        <div className="flex flex-col gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-emerald-100/50 shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 bg-gray-200 rounded-lg"></div>
                  <div className="h-5 w-20 bg-gray-100 rounded-full"></div>
                </div>
                <div className="h-3 w-64 bg-gray-100 rounded-lg"></div>
                <div className="h-3 w-32 bg-gray-100 rounded-lg"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-5 w-16 bg-gray-200 rounded-lg"></div>
                <div className="h-9 w-24 bg-gray-100 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {user?.role === 'admin' && activeTab === 'subscription' ? (
            // Render Subscription Cards (Type aware)
            orders.map((sub) => {
              const customer = sub.customer || {}
              const totalMeals = sub.planType === 'weekly' ? 7 : 30
              const delivered = totalMeals - sub.mealsRemaining
              const address = sub.isCompany ? sub.companyAddress : getAddressString(customer)

              if (subActiveTab === 'company') {
                return (
                  <Card
                    key={sub.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-emerald-50 shadow-subtle hover:translate-y-0"
                    hoverable={false}
                  >
                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-black text-text-dark">{sub.companyName || 'Unnamed Company'}</span>
                        <Badge variant="success">Active Tender</Badge>
                        <Badge variant="primary" className="capitalize">{sub.planType} Subscription</Badge>
                        <Badge variant="accent" className="font-extrabold">{sub.workerCount} Workers</Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6 text-xs text-gray-500 font-semibold mt-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <User className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Contact: {sub.contactName || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{sub.contactPhone || 'No Phone'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate max-w-[180px]">{sub.contactEmail || 'No Email'}</span>
                        </div>
                        <div className="sm:col-span-3 flex items-center gap-1.5 min-w-0 mt-0.5">
                          <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate max-w-[500px]" title={address}>Deliver to: {address}</span>
                        </div>
                      </div>

                      {/* Preferences & Quota details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] sm:text-[11px] font-bold text-emerald-800 mt-2 bg-emerald-50/30 border border-emerald-100/35 px-3 py-2 rounded-xl w-fit">
                        <span className="bg-emerald-100/60 px-2 py-0.5 rounded-md">Slot: {sub.preferenceDeliveryTime?.toUpperCase()}</span>
                        <span className="bg-emerald-100/60 px-2 py-0.5 rounded-md">Category: {sub.preferenceMealCategory}</span>
                        <span>Daily Delivery: <span className="text-primary font-black">{sub.workerCount} Meals</span></span>
                        <span className="text-gray-300">|</span>
                        <span>Days Delivered: <span className="text-primary font-black">{delivered} Days</span></span>
                        <span className="text-gray-300">|</span>
                        <span>Days Remaining: <span className="text-primary font-black">{sub.mealsRemaining} Days Left</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 border-t md:border-t-0 border-emerald-50 pt-4 md:pt-0 shrink-0">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block font-black">Total Cost</span>
                        <span className="text-sm font-black text-primary">PKR {sub.price.toLocaleString()}</span>
                        <span className="text-[9px] text-gray-405 block font-semibold">({sub.workerCount} workers x PKR {(sub.price / sub.workerCount).toLocaleString()})</span>
                      </div>
                    </div>
                  </Card>
                )
              }

              // Individual Card (default)
              return (
                <Card
                  key={sub.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-emerald-50 shadow-subtle hover:translate-y-0"
                  hoverable={false}
                >
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-bold text-text-dark">{customer.name || 'Unnamed Subscriber'}</span>
                      <Badge variant="success">Active Plan</Badge>
                      <Badge variant="primary" className="capitalize">{sub.planType} Subscription</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6 text-xs text-gray-500 font-semibold mt-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{customer.phone || 'No Phone'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate max-w-[180px]">{customer.email || 'No Email'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate max-w-[200px]" title={address}>{address}</span>
                      </div>
                    </div>

                    {/* Preferences & Quota details */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] sm:text-[11px] font-bold text-emerald-800 mt-2 bg-emerald-50/30 border border-emerald-100/35 px-3 py-2 rounded-xl w-fit">
                      <span className="bg-emerald-100/60 px-2 py-0.5 rounded-md">Slot: {sub.preferenceDeliveryTime?.toUpperCase()}</span>
                      <span className="bg-emerald-100/60 px-2 py-0.5 rounded-md">Category: {sub.preferenceMealCategory}</span>
                      <span>Meals Delivered: <span className="text-primary font-black">{delivered} Sent</span></span>
                      <span className="text-gray-300">|</span>
                      <span>Meals Remaining: <span className="text-primary font-black">{sub.mealsRemaining} Left</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 border-t md:border-t-0 border-emerald-50 pt-4 md:pt-0 shrink-0">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Plan Price</span>
                      <span className="text-sm font-bold text-primary">PKR {sub.price.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              )
            })
          ) : (
            // Render Order Cards (One-Time)
            displayedOrders.map((order) => {
              const itemsStr = Array.isArray(order.items)
                ? order.items.map((i) => `${i.name} (Qty: ${i.quantity})`).join(', ')
                : 'Tiffin Order'
              return (
                <Card
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:translate-y-0"
                  hoverable={false}
                >
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-text-dark">{order.orderNumber}</span>
                      <Badge variant={getBadgeVariant(order.status)}>{order.status}</Badge>
                      {order.paymentStatus === 'submitted' && <Badge variant="primary">Proof Submitted</Badge>}
                      {order.paymentStatus === 'verified' && <Badge variant="success">Paid</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 font-semibold truncate max-w-md">{itemsStr}</p>
                    {user?.role === 'admin' && (
                      <p className="text-xs text-primary font-bold mt-0.5">
                        Customer: {order.customerName} ({order.customerPhone})
                      </p>
                    )}
                    <div className="flex items-center mt-1.5">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-primary px-2.5 py-1 rounded-xl border border-emerald-100/60 text-[10.5px] font-bold">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {formatDateTime(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-emerald-50 pt-4 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Total Amount</span>
                      <span className="text-sm font-bold text-primary">PKR {order.billingTotal}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)} className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      Details
                    </Button>
                  </div>
                </Card>
              )
            })
          )}

          {displayedOrders.length === 0 && (
            <p className="text-gray-400 py-12 text-center text-sm font-medium">No order logs found.</p>
          )}

          {/* Pagination – admin only */}
          {user?.role === 'admin' && (
            <Pagination
              page={page} totalPages={totalPages} total={total}
              limit={limit} onPageChange={handlePageChange} onLimitChange={handleLimitChange}
            />
          )}
        </div>
      )}

      {/* OrderDetailModal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Order Details: ${selectedOrder?.orderNumber}`}
      >
        {selectedOrder && (
          <div className="flex flex-col gap-6 text-left text-sm max-h-[75vh] overflow-y-auto pr-1">
            <div className="flex justify-between items-center border-b border-emerald-50 pb-3">
              <div>
                <p className="text-xs text-gray-400 font-semibold">Order Date</p>
                <p className="font-bold text-text-dark mt-0.5">{formatDateTime(selectedOrder.createdAt)}</p>
              </div>
              <Badge variant={getBadgeVariant(selectedOrder.status)}>{selectedOrder.status}</Badge>
            </div>

            <div>
              <p className="text-xs text-gray-400 font-semibold mb-2">Items Breakdown</p>
              <div className="bg-background rounded-2xl border border-emerald-50 p-4 flex flex-col gap-3">
                {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col border-b border-emerald-50/55 last:border-0 pb-2.5 last:pb-0">
                    <div className="flex justify-between font-semibold text-text-dark text-xs">
                      <span>{item.name} (Qty: {item.quantity})</span>
                      <span>PKR {item.price * item.quantity}</span>
                    </div>
                    {item.portion && (
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">Portion size: {item.portion}</p>
                    )}
                    {item.addons && (item.addons.coldDrink || item.addons.meetha || item.addons.salad || item.addons.extraRoti) && (
                      <p className="text-[10px] text-emerald-800 font-semibold mt-1">
                        + Addons:{' '}
                        {[item.addons.coldDrink?.name, item.addons.meetha?.name, item.addons.salad?.name, item.addons.extraRoti ? 'Extra Roti' : null].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 font-semibold">Payment Method</p>
                <p className="font-semibold text-text-dark mt-0.5">{selectedOrder.paymentMethod}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold">Total Invoice</p>
                <p className="font-bold text-primary mt-0.5">PKR {selectedOrder.billingTotal}</p>
              </div>
            </div>

            {selectedOrder.rider && (
              <div className="bg-emerald-50/20 border border-emerald-155/35 p-4 rounded-2xl flex flex-col gap-2">
                <p className="text-xs text-gray-400 font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" /> Assigned Delivery Rider
                </p>
                <div className="flex flex-col gap-1 text-xs font-semibold text-text-dark">
                  <p>Name: <span className="text-gray-500 font-medium">{selectedOrder.rider.name}</span></p>
                  <p>Phone: <span className="text-gray-500 font-medium">{selectedOrder.rider.phone || 'N/A'}</span></p>
                </div>
              </div>
            )}

            {user?.role === 'admin' && (
              <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl flex flex-col gap-2">
                <p className="text-xs text-gray-400 font-semibold">Customer Information</p>
                <div className="flex flex-col gap-1 text-xs font-semibold text-text-dark">
                  <p>Name: <span className="text-gray-500 font-medium">{selectedOrder.customerName}</span></p>
                  <p>Phone: <span className="text-gray-500 font-medium">{selectedOrder.customerPhone || 'N/A'}</span></p>
                  <p>Delivery Address: <span className="text-gray-500 font-medium">{selectedOrder.customerAddress}</span></p>
                  {selectedOrder.deliveryInstructions && (
                    <p>Instructions: <span className="text-gray-500 font-medium italic">"{selectedOrder.deliveryInstructions}"</span></p>
                  )}
                </div>
              </div>
            )}

            {user?.role === 'admin' && (
              <div className="bg-emerald-50/30 border border-emerald-100/50 p-4 rounded-2xl flex flex-col gap-3">
                <h5 className="font-bold text-text-dark text-xs">Admin Actions: Dispatch & Status</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1 block">Update Order Status</label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateOrder(selectedOrder.id, e.target.value, selectedOrder.riderId)}
                      disabled={updatingStatus}
                      className="w-full p-2.5 rounded-xl border border-emerald-150 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-semibold bg-white text-text-dark cursor-pointer"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Picked Up">Picked Up</option>
                      <option value="Nearby">Nearby</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1 block">Assign Rider</label>
                    <select
                      value={selectedOrder.riderId || ''}
                      onChange={(e) => handleUpdateOrder(selectedOrder.id, selectedOrder.status, e.target.value || null)}
                      disabled={updatingStatus}
                      className="w-full p-2.5 rounded-xl border border-emerald-155 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-semibold bg-white text-text-dark cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {riders.map((r) => (
                        <option key={r.id} value={r.id}>{r.name} ({r.phone || 'No Phone'})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {selectedOrder.paymentMethod === 'Bank Transfer' && (
              <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl flex flex-col gap-3">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-emerald-800 shrink-0" />
                  <div>
                    <h5 className="font-bold text-emerald-900 text-xs">Bank Transfer Verification</h5>
                    <p className="text-[10px] text-gray-500 leading-normal mt-0.5 font-semibold">
                      Please transfer PKR {selectedOrder.billingTotal} to Alfalah Bank (Ac: Home Tiffin, IBAN: PK12ALFH00003001234567) and upload the receipt screenshot below.
                    </p>
                  </div>
                </div>
                {selectedOrder.paymentScreenshotUrl ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 border-t border-emerald-100 pt-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Receipt screenshot has been uploaded. Status: <span className="font-bold uppercase">{selectedOrder.paymentStatus}</span></span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 border-t border-emerald-100 pt-3">
                    <input type="file" id="payment-receipt" accept="image/*" onChange={handleScreenshotUpload} className="hidden" disabled={uploading} />
                    <label htmlFor="payment-receipt" className="bg-primary hover:bg-primary/95 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      {uploading ? 'Uploading...' : 'Choose Screenshot'}
                    </label>
                    <span className="text-[10px] text-gray-400 font-medium">JPG, PNG, WEBP max 5MB</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="text-xs text-gray-400 font-semibold mb-3">Order Status Timeline</p>
              <div className="flex flex-col gap-4 border-l-2 border-emerald-100 pl-4 ml-2">
                {[
                  { label: 'Order Confirmed', active: true },
                  { label: 'Kitchen Preparing', active: ['Preparing', 'Picked Up', 'Nearby', 'Delivered'].includes(selectedOrder.status) },
                  { label: 'Out for Delivery', active: ['Picked Up', 'Nearby', 'Delivered'].includes(selectedOrder.status) },
                  { label: 'Delivered', active: selectedOrder.status === 'Delivered' }
                ].map((step, index) => (
                  <div key={index} className="relative">
                    <span className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 bg-white ${step.active ? 'border-primary bg-primary' : 'border-gray-200'}`} />
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${step.active ? 'text-text-dark' : 'text-gray-400'}`}>{step.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
