import React, { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { formatDate, formatDateTime } from '../../services/dateFormatter'
import { formatOrderAmount } from '../../services/orderStats'
import { Download, CreditCard, DollarSign, CheckCircle, XCircle, Search, X, Image, Calendar, ShoppingBag, Sparkles, Loader2 } from 'lucide-react'

const DEFAULT_LIMIT = 20

export default function Payments() {
  const { addToast } = useToastStore()
  const { user } = useAuthStore()
  const [isPinned, setIsPinned] = useState(false)

  useEffect(() => {
    const scrollContainer = document.querySelector('main')
    if (!scrollContainer) return

    const handleScroll = () => {
      const panel = document.getElementById('payments-panel')
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

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Customer paginated states
  const [customerOrders, setCustomerOrders] = useState([])
  const [customerPage, setCustomerPage] = useState(1)
  const [hasMoreCustomerOrders, setHasMoreCustomerOrders] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [stats, setStats] = useState({ dailyMonthly: 0, dailyAllTime: 0 })

  // Customer subscription deliveries state
  const [subDeliveries, setSubDeliveries] = useState([])
  const [loadingSubDeliveries, setLoadingSubDeliveries] = useState(false)

  const [customerTab, setCustomerTab] = useState('daily')

  // Admin-only: pagination + search
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchOrders = useCallback(async (pg = 1, search = '', lim = limit) => {
    try {
      if (user?.role === 'admin') {
        setLoading(true)
        const params = new URLSearchParams({ page: pg, limit: lim })
        if (search) params.set('search', search)
        const res = await api.get(`/admin/payments?${params}`)
        setOrders(res.data.data)
        setTotal(res.data.total)
        setTotalPages(res.data.totalPages)
        setPage(res.data.page)
        setLoading(false)
      } else {
        // Customer View infinite scroll loading
        if (pg === 1) {
          setLoading(true)
        } else {
          setLoadingMore(true)
        }

        const res = await api.get(`/orders/my-orders?page=${pg}&limit=10&type=one-time`)
        const newOrders = res.data.data || []
        const totalPgs = res.data.totalPages || 1

        if (pg === 1) {
          setCustomerOrders(newOrders)
          setCustomerPage(1)
          if (res.data.stats) {
            setStats(res.data.stats)
          }
        } else {
          setCustomerOrders(prev => {
            const existingIds = new Set(prev.map(o => o.id))
            const filteredNew = newOrders.filter(o => !existingIds.has(o.id))
            return [...prev, ...filteredNew]
          })
          setCustomerPage(pg)
        }

        setHasMoreCustomerOrders(pg < totalPgs && newOrders.length > 0)
        setLoading(false)
        setLoadingMore(false)
      }
    } catch (err) {
      console.error('Failed to fetch payments data:', err)
      addToast('Failed to load payment records.', 'error')
      setLoading(false)
      setLoadingMore(false)
    }
  }, [user?.role, addToast, limit])

  const fetchSubDeliveries = useCallback(async () => {
    try {
      setLoadingSubDeliveries(true)
      const res = await api.get('/orders/my-orders?type=subscription')
      setSubDeliveries(res.data || [])
    } catch (err) {
      console.error('Failed to fetch subscription deliveries:', err)
    } finally {
      setLoadingSubDeliveries(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders(1)
  }, [user?.role, fetchOrders])

  // Fetch subscription deliveries when switching to subscription tab
  useEffect(() => {
    if (user?.role !== 'admin' && customerTab === 'subscription') {
      fetchSubDeliveries()
    }
  }, [customerTab, user?.role, fetchSubDeliveries])

  // Infinite Scroll listener for Daily Payments
  useEffect(() => {
    if (user?.role === 'admin') return
    if (customerTab !== 'daily') return

    const handleScroll = () => {
      if (loading || loadingMore || !hasMoreCustomerOrders) return

      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop

      if (documentHeight - windowHeight - scrollTop < 150) {
        fetchOrders(customerPage + 1)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [user?.role, customerTab, loading, loadingMore, hasMoreCustomerOrders, customerPage, fetchOrders])

  useEffect(() => {
    if (user && user.role !== 'admin') {
      useAuthStore.getState().fetchProfile()
    }
  }, [])

  // Admin: confirm payment
  const handleConfirmPayment = async (orderId) => {
    try {
      await api.put(`/admin/confirm-payment/${orderId}`)
      addToast('Payment confirmed successfully!', 'success')
      fetchOrders(page, searchQuery)
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to confirm payment.', 'error')
    }
  }

  // Admin: cancel payment
  const handleCancelPayment = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this payment?')) return
    try {
      await api.put(`/admin/subscriptions/${orderId}`, { paymentStatus: 'pending' })
      addToast('Payment cancelled.', 'success')
      fetchOrders(page, searchQuery)
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to cancel payment.', 'error')
    }
  }

  const applySearch = () => {
    setSearchQuery(searchInput)
    fetchOrders(1, searchInput)
    setPage(1)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    fetchOrders(1, '')
    setPage(1)
  }

  // ─── Customer helpers ──
  const activeSub = user?.subscriptions?.find(sub => sub.status === 'active')

  const dailyStats = stats

  const getDailyOrdersMonthly = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    return orders
      .filter(o => {
        const d = new Date(o.createdAt)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && o.paymentStatus === 'verified'
      })
      .reduce((sum, o) => sum + o.billingTotal, 0)
  }

  const getDailyOrdersAllTime = () => {
    return orders
      .filter(o => o.paymentStatus === 'verified')
      .reduce((sum, o) => sum + o.billingTotal, 0)
  }

  const getSubMonthlySpend = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    return (user?.subscriptions || [])
      .filter(s => {
        const d = new Date(s.createdAt)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && s.paymentStatus === 'verified'
      })
      .reduce((sum, s) => sum + (s.price || 0), 0)
  }

  const getSubAllTime = () => {
    return (user?.subscriptions || [])
      .filter(s => s.paymentStatus === 'verified')
      .reduce((sum, s) => sum + (s.price || 0), 0)
  }

  const getSubscriptionStatusBadge = (status) => {
    switch (status) {
      case 'active': return <Badge variant="success">Active</Badge>
      case 'paused': return <Badge variant="warning">Paused</Badge>
      case 'completed': return <Badge variant="success">Completed</Badge>
      case 'failed': return <Badge variant="danger">Failed</Badge>
      default: return <Badge variant="primary">Pending</Badge>
    }
  }

  const handleDownloadInvoice = (order) => {
    addToast(`Downloading Invoice Receipt ${order.orderNumber}...`, 'info')
    const itemsListHtml = Array.isArray(order.items)
      ? order.items.map(i => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0;">${i.name} (Qty: ${i.quantity})</td>
            <td style="padding: 10px 0; text-align: right;">PKR ${i.price * i.quantity}</td>
          </tr>
        `).join('')
      : ''
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head><title>Invoice - ${order.orderNumber}</title>
          <style>body{font-family:sans-serif;padding:40px;color:#333;}.receipt{max-width:600px;margin:auto;border:1px solid #eee;padding:30px;border-radius:10px;}.header{text-align:center;border-bottom:2px solid #065F46;padding-bottom:20px;}.details{margin:30px 0;line-height:1.6;font-size:14px;}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:14px;}.total{font-size:20px;font-weight:bold;color:#065F46;margin-top:30px;text-align:right;}</style>
        </head>
        <body>
          <div class="receipt">
            <div class="header"><h2 style="margin:0;color:#065F46;">HOME TIFFIN INVOICE</h2><p style="margin:5px 0 0 0;font-size:12px;color:#666;">Ghar ka khana, aapke darwaze tak</p></div>
            <div class="details">
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Customer Name:</strong> ${order.customerName}</p>
              <p><strong>Date:</strong> ${formatDateTime(order.createdAt)}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
              <p><strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}</p>
            </div>
            <h4 style="border-bottom:1px solid #065F46;padding-bottom:5px;margin-bottom:10px;">ORDER ITEMS</h4>
            <table>${itemsListHtml}
              <tr><td style="padding:10px 0;font-weight:bold;">Subtotal</td><td style="padding:10px 0;text-align:right;font-weight:bold;">PKR ${order.billingSubtotal}</td></tr>
              <tr><td style="padding:5px 0;">Delivery Fee</td><td style="padding:5px 0;text-align:right;">PKR ${order.billingDeliveryFee}</td></tr>
              <tr><td style="padding:5px 0;">GST Tax (5%)</td><td style="padding:5px 0;text-align:right;">PKR ${order.billingTax}</td></tr>
            </table>
            <div class="total">Total Paid: PKR ${order.billingTotal}</div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified': return <Badge variant="success">Verified</Badge>
      case 'submitted': return <Badge variant="primary">Submitted</Badge>
      case 'failed': return <Badge variant="danger">Failed</Badge>
      default: return <Badge variant="warning">Pending</Badge>
    }
  }

  const formatPaymentMethod = (method = '') => {
    const m = method.toLowerCase()
    if (m.includes('subscription') || m === 'subscription_delivery') return 'Sub-D'
    if (m === 'cash on delivery' || m === 'cod') return 'COD'
    return method
  }

  if (user?.role === 'admin') {
    return (
      <div className="flex flex-col gap-8 text-left w-full pb-20">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Payment Verification</h1>
          <p className="text-sm text-gray-500">Review and verify customer payment screenshots submitted for Bank Transfer orders.</p>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2.5 bg-white px-4 py-3 rounded-2xl border border-emerald-100 shadow-subtle">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by order number, customer name or phone…"
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
          <button onClick={applySearch} className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-2xl hover:bg-primary/90 transition-all cursor-pointer">
            Search
          </button>
        </div>

        {/* Payments table */}
        <Card className="p-8 hover:translate-y-0" hoverable={false}>
          <h3 className="font-bold text-text-dark text-base border-b border-emerald-50 pb-3 mb-6">Payment Screenshot Submissions</h3>

          {loading ? (
            <div className="flex flex-col gap-3 animate-pulse py-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center border-b border-emerald-50 pb-3">
                  <div className="h-4 w-20 bg-gray-200 rounded-lg"></div>
                  <div className="h-4 w-28 bg-gray-100 rounded-lg"></div>
                  <div className="h-4 w-40 bg-gray-100 rounded-lg flex-1"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded-lg"></div>
                  <div className="h-5 w-20 bg-gray-100 rounded-full"></div>
                  <div className="h-8 w-24 bg-gray-100 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-emerald-50 text-gray-400 font-semibold">
                      <th className="pb-3 text-xs uppercase tracking-wider">Order No</th>
                      <th className="pb-3 text-xs uppercase tracking-wider">Date</th>
                      <th className="pb-3 text-xs uppercase tracking-wider">Customer</th>
                      <th className="pb-3 text-xs uppercase tracking-wider">Amount</th>
                      <th className="pb-3 text-xs uppercase tracking-wider">Status</th>
                      <th className="pb-3 text-xs uppercase tracking-wider">Screenshot</th>
                      <th className="pb-3 text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((pay) => (
                      <tr key={pay.id} className="border-b border-emerald-50/50 last:border-0 font-medium">
                        <td className="py-4 text-text-dark font-bold">{pay.orderNumber}</td>
                        <td className="py-4 text-gray-500">{formatDate(pay.updatedAt)}</td>
                        <td className="py-4 text-gray-700">
                          <p className="font-semibold">{pay.customerName}</p>
                          <p className="text-[10px] text-gray-400">{pay.customerPhone || '—'}</p>
                        </td>
                        <td className="py-4 text-primary font-bold">PKR {formatOrderAmount(pay.billingTotal)}</td>
                        <td className="py-4">{getStatusBadge(pay.paymentStatus)}</td>
                        <td className="py-4">
                          {pay.paymentScreenshotUrl ? (
                            <a href={pay.paymentScreenshotUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                              <Image className="w-3.5 h-3.5" /> View
                            </a>
                          ) : <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {pay.paymentStatus !== 'verified' && (
                              <button
                                onClick={() => handleConfirmPayment(pay.id)}
                                className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-all cursor-pointer border border-emerald-200"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Verify
                              </button>
                            )}
                            {pay.paymentStatus === 'submitted' && (
                              <button
                                onClick={() => handleCancelPayment(pay.id)}
                                className="flex items-center gap-1 text-xs bg-rose-50 text-rose-700 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-all cursor-pointer border border-rose-200"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.length === 0 && (
                  <p className="text-gray-400 py-12 text-center text-sm font-medium">No payment submissions found.</p>
                )}
              </div>
              <Pagination
                page={page} totalPages={totalPages} total={total} limit={limit}
                onPageChange={(pg) => { setPage(pg); fetchOrders(pg, searchQuery) }}
                onLimitChange={(newLimit) => { setLimit(newLimit); fetchOrders(1, searchQuery, newLimit); setPage(1) }}
              />
            </>
          )}
        </Card>
      </div>
    )
  }

  // ─── CUSTOMER VIEW ──────────────────────────────────────────
  return (
    <div className="w-full">
      {/* ─── DESKTOP VIEW ─── */}
      <div className="hidden md:flex flex-col gap-8 text-left w-full pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tight">Billing & Payments</h1>
            <p className="text-sm text-gray-550 font-medium">Review all payments, invoices, and spent logs.</p>
          </div>
        </div>

        {/* Spend Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-3 gap-6 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-5 bg-white border border-emerald-50 rounded-3xl shadow-sm">
                <div className="w-14 h-14 bg-gray-105 rounded-2xl shrink-0"></div>
                <div className="flex-1">
                  <div className="h-3 w-32 bg-gray-100 rounded-lg mb-2"></div>
                  <div className="h-7 w-24 bg-gray-205 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Daily Orders */}
            <Card className="flex items-center gap-4 border border-emerald-50 bg-white !p-5 hover:translate-y-0.5" hoverable={false}>
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Daily Orders Spent</p>
                <p className="text-xl sm:text-2xl font-black text-text-dark">PKR {dailyStats.dailyMonthly.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">PKR {dailyStats.dailyAllTime.toLocaleString()} All-time</p>
              </div>
            </Card>

            {/* Card 2: Subscription Payments */}
            <Card className="flex items-center gap-4 border border-emerald-50 bg-white !p-5 hover:translate-y-0.5" hoverable={false}>
              <div className="p-3.5 bg-amber-50 text-amber-650 rounded-2xl shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Spent on Subscriptions</p>
                <p className="text-xl sm:text-2xl font-black text-text-dark">PKR {getSubMonthlySpend().toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">PKR {getSubAllTime().toLocaleString()} All-time</p>
              </div>
            </Card>

            {/* Card 3: Active Subscription Plan */}
            <Card className="flex items-center gap-4 border border-emerald-50 bg-white !p-5 hover:translate-y-0.5 sm:col-span-2 lg:col-span-1" hoverable={false}>
              <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Active Subscription Price</p>
                {activeSub ? (
                  <>
                    <p className="text-xl sm:text-2xl font-black text-rose-700">
                      PKR {activeSub.price?.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-rose-600 font-extrabold uppercase mt-0.5">
                      {activeSub.planType.toUpperCase()} PLAN ACTIVE
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl sm:text-2xl font-black text-gray-400">N/A</p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">No Active Subscription</p>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Transaction & Subscription Payment Logs */}
        <div className="flex flex-col gap-6">
          {/* Tab switchers */}
          <div className="flex gap-2 border-b border-emerald-50 pb-px overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button
              onClick={() => setCustomerTab('daily')}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${customerTab === 'daily'
                  ? 'border-primary text-primary font-black'
                  : 'border-transparent text-gray-400 hover:text-gray-650'
                }`}
            >
              Daily Payments
            </button>
            <button
              onClick={() => setCustomerTab('subscription')}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${customerTab === 'subscription'
                  ? 'border-primary text-primary font-black'
                  : 'border-transparent text-gray-400 hover:text-gray-650'
                }`}
            >
              Sub Payments
            </button>
          </div>

          {/* List Card Container */}
          <Card className="!p-8 hover:translate-y-0 border border-emerald-100" hoverable={false}>
            {loading ? (
              <div className="flex flex-col gap-3 animate-pulse py-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 items-center border-b border-emerald-50 pb-3">
                    <div className="h-4 w-20 bg-gray-200 rounded-lg"></div>
                    <div className="h-4 w-24 bg-gray-100 rounded-lg"></div>
                    <div className="h-4 w-40 bg-gray-100 rounded-lg flex-1"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded-lg"></div>
                    <div className="h-5 w-20 bg-gray-100 rounded-full"></div>
                    <div className="h-5 w-16 bg-gray-100 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : customerTab === 'daily' ? (
              <>
                {/* DESKTOP TABLE VIEW */}
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-emerald-50 text-gray-400 font-semibold">
                        <th className="pb-3 text-xs uppercase tracking-wider">Order No</th>
                        <th className="pb-3 text-xs uppercase tracking-wider">Date</th>
                        <th className="pb-3 text-xs uppercase tracking-wider">Meal Items</th>
                        <th className="pb-3 text-xs uppercase tracking-wider">Amount</th>
                        <th className="pb-3 text-xs uppercase tracking-wider">Method</th>
                        <th className="pb-3 text-xs uppercase tracking-wider">Status</th>
                        <th className="pb-3 text-xs uppercase tracking-wider text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerOrders.map((pay) => {
                        const itemsStr = Array.isArray(pay.items)
                          ? pay.items.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ')
                          : 'Tiffin Meal'
                        return (
                          <tr key={pay.id} className="border-b border-emerald-50/50 last:border-0 font-medium">
                            <td className="py-4 text-text-dark font-bold">{pay.orderNumber}</td>
                            <td className="py-4 text-gray-500">{formatDate(pay.createdAt)}</td>
                            <td className="py-4 text-gray-700 truncate max-w-xs">{itemsStr}</td>
                            <td className="py-4 text-primary font-bold">PKR {formatOrderAmount(pay.billingTotal)}</td>
                            <td className="py-4"><Badge variant="primary">{formatPaymentMethod(pay.paymentMethod)}</Badge></td>
                            <td className="py-4">{getStatusBadge(pay.paymentStatus)}</td>
                            <td className="py-4 text-right">
                              <button onClick={() => handleDownloadInvoice(pay)} className="p-1.5 rounded-xl hover:bg-accent-light text-primary transition-all cursor-pointer" aria-label="Download Invoice">
                                <Download className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {customerOrders.length === 0 && (
                    <p className="text-gray-400 py-12 text-center text-sm font-medium">No transactions found.</p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* DESKTOP TABLE VIEW */}
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-emerald-50 text-gray-400 font-semibold">
                        <th className="pb-3 text-xs uppercase tracking-wider">Plan Type</th>
                        <th className="pb-3 text-xs uppercase tracking-wider">Date Purchased</th>
                        <th className="pb-3 text-xs uppercase tracking-wider">Details</th>
                        <th className="pb-3 text-xs uppercase tracking-wider">Amount</th>
                        <th className="pb-3 text-xs uppercase tracking-wider">Payment Status</th>
                        <th className="pb-3 text-xs uppercase tracking-wider text-right">Plan Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(user?.subscriptions || []).map((sub) => {
                        return (
                          <tr key={sub.id} className="border-b border-emerald-50/50 last:border-0 font-medium">
                            <td className="py-4 text-text-dark font-bold capitalize">
                              {sub.planType} Subscription {sub.isCompany && <span className="text-[10px] text-amber-600 block">(Company Tender)</span>}
                            </td>
                            <td className="py-4 text-gray-500">{formatDate(sub.createdAt)}</td>
                            <td className="py-4 text-gray-700 text-xs">
                              <p className="font-semibold">Meals Remaining: {sub.mealsRemaining}</p>
                              <p className="text-[10px] text-gray-400 font-medium">Expiry: {formatDate(sub.endDate)}</p>
                            </td>
                            <td className="py-4 text-primary font-bold">PKR {sub.price?.toLocaleString()}</td>
                            <td className="py-4">{getStatusBadge(sub.paymentStatus)}</td>
                            <td className="py-4 text-right">{getSubscriptionStatusBadge(sub.status)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {(user?.subscriptions || []).length === 0 && (
                    <p className="text-gray-400 py-12 text-center text-sm font-medium">No subscription payments found.</p>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
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
              <h1 className="text-2xl font-black tracking-tight">Billing & Payments</h1>
              <p className="text-xs text-emerald-200/80 font-medium mt-1">Review all payments, invoices, and spent logs</p>
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
                    {customerTab === 'daily' ? 'Daily Ledger Card' : 'Subscription Ledger Card'}
                  </p>
                  <h2 className="text-lg font-black mt-0.5 tracking-tight">
                    {customerTab === 'daily' ? 'Daily Spent Details' : 'Subscription Spent Details'}
                  </h2>
                </div>
                <CreditCard className="w-6 h-6 text-emerald-300" />
              </div>

              <div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] text-emerald-300/80 font-extrabold uppercase tracking-widest">Monthly Spent</p>
                    <p className="text-2xl font-black tracking-tight">
                      PKR {customerTab === 'daily' ? dailyStats.dailyMonthly.toLocaleString() : getSubMonthlySpend().toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-emerald-300/80 font-extrabold uppercase tracking-widest">All-time Spent</p>
                    <p className="text-sm font-bold">
                      PKR {customerTab === 'daily' ? dailyStats.dailyAllTime.toLocaleString() : getSubAllTime().toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* White Panel */}
        <div 
          id="payments-panel"
          style={{ 
            borderTopLeftRadius: '36px', 
            borderTopRightRadius: '36px' 
          }}
          className="bg-white -mt-16 pt-0 px-5 pb-24 relative z-20 min-h-screen shadow-card flex flex-col gap-6 text-left transition-all duration-300"
        >
          <div 
            style={{ 
              borderTopLeftRadius: '36px', 
              borderTopRightRadius: '36px' 
            }}
            className="sticky top-[-16px] sm:top-[-24px] z-30 bg-white pt-8 pb-4 flex flex-col gap-4 -mx-5 px-5 border-b border-slate-100 transition-all duration-300"
          >
            {/* Tab Switcher inside the white panel */}
            <div className="flex gap-2 bg-slate-100/85 p-1 rounded-2xl border border-slate-200/50">
              <button
                onClick={() => setCustomerTab('daily')}
                className={`flex-1 py-3 text-center text-xs font-black rounded-xl transition-all duration-200 cursor-pointer border-none ${
                  customerTab === 'daily'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Daily Payments
              </button>
              <button
                onClick={() => setCustomerTab('subscription')}
                className={`flex-1 py-3 text-center text-xs font-black rounded-xl transition-all duration-200 cursor-pointer border-none ${
                  customerTab === 'subscription'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Sub Payments
              </button>
            </div>
          </div>

          {/* Card Stats */}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 animate-pulse">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex flex-col items-start gap-2.5 p-4 bg-white border border-emerald-50 rounded-2xl shadow-sm">
                  <div className="w-10 h-10 bg-gray-105 rounded-xl shrink-0"></div>
                  <div className="h-2.5 w-16 bg-gray-105 rounded-lg mb-2"></div>
                  <div className="h-5 w-20 bg-gray-205 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Card 1: Daily Orders */}
              <Card className="flex flex-col items-start gap-2.5 border border-emerald-50 bg-white !p-4 hover:translate-y-0.5" hoverable={false}>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="w-full">
                  <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider leading-none mb-1">This Month</p>
                  <p className="text-base font-black text-text-dark whitespace-nowrap">PKR {dailyStats.dailyMonthly.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1">PKR {dailyStats.dailyAllTime.toLocaleString()} all-time</p>
                </div>
              </Card>

              {/* Card 3: Active Subscription Plan */}
              <Card className="flex flex-col items-start gap-2.5 border border-emerald-50 bg-white !p-4 hover:translate-y-0.5" hoverable={false}>
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="w-full">
                  <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider leading-none mb-1">Active Sub</p>
                  {activeSub ? (
                    <p className="text-base font-black text-rose-700 whitespace-nowrap">
                      PKR {activeSub.price?.toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-base font-black text-gray-400 whitespace-nowrap">N/A</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Section Header */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mt-2">
            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">
              {customerTab === 'daily' ? 'Daily History' : 'Sub Receipts'}
            </h3>
            <span className="text-[10px] font-black text-gray-450 uppercase tracking-wider">
              {customerTab === 'daily' ? `${customerOrders.length} Logged` : `${(user?.subscriptions || []).length} Plans`}
            </span>
          </div>

          {/* Mobile Lists */}
          {customerTab === 'daily' ? (
            <div className="flex flex-col gap-3">
              {customerOrders.map((pay) => {
                const itemsStr = Array.isArray(pay.items)
                  ? pay.items.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ')
                  : 'Tiffin Meal'

                const isVerified = pay.paymentStatus === 'verified'
                const isFailed = pay.paymentStatus === 'failed'
                const isSubmitted = pay.paymentStatus === 'submitted'

                const accentColor = isVerified ? 'bg-emerald-500' : isFailed ? 'bg-rose-400' : isSubmitted ? 'bg-blue-400' : 'bg-amber-400'
                const cardBorder = isVerified ? 'border-emerald-100' : isFailed ? 'border-rose-100' : isSubmitted ? 'border-blue-100' : 'border-amber-100'

                return (
                  <div key={pay.id} className={`relative flex rounded-2xl border ${cardBorder} bg-white shadow-sm overflow-hidden`}>
                    <div className={`w-1 shrink-0 ${accentColor} rounded-l-2xl`} />
                    <div className="flex-1 p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black text-primary bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase tracking-wider">
                          {pay.orderNumber}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="primary" className="text-[9px] font-bold capitalize">
                            {formatPaymentMethod(pay.paymentMethod)}
                          </Badge>
                          {getStatusBadge(pay.paymentStatus)}
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-gray-700 leading-relaxed line-clamp-2">{itemsStr}</p>
                      <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-500 px-2.5 py-1 rounded-xl border border-gray-100 text-[10.5px] font-bold w-fit">
                        <Calendar className="w-3 h-3 shrink-0" />
                        {formatDateTime(pay.createdAt)}
                      </span>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div>
                          <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Amount Paid</p>
                          <p className="text-base font-black text-primary">PKR {formatOrderAmount(pay.billingTotal)}</p>
                        </div>
                        <button
                          onClick={() => handleDownloadInvoice(pay)}
                          className="flex items-center gap-1.5 text-xs font-black text-white bg-primary px-3.5 py-2 rounded-xl hover:bg-primary/90 transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {customerOrders.length === 0 && <p className="text-gray-400 py-12 text-center text-sm font-medium">No transactions found.</p>}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                {(user?.subscriptions || []).map((sub) => {
                  const isVerified = sub.paymentStatus === 'verified'
                  const isFailed = sub.paymentStatus === 'failed'
                  const isSubmitted = sub.paymentStatus === 'submitted'

                  const accentColor = isVerified ? 'bg-emerald-500' : isFailed ? 'bg-rose-400' : isSubmitted ? 'bg-blue-400' : 'bg-amber-400'
                  const cardBorder = isVerified ? 'border-emerald-100' : isFailed ? 'border-rose-100' : isSubmitted ? 'border-blue-100' : 'border-amber-100'

                  return (
                    <div key={sub.id} className={`relative flex rounded-2xl border ${cardBorder} bg-white shadow-sm overflow-hidden`}>
                      <div className={`w-1 shrink-0 ${accentColor} rounded-l-2xl`} />
                      <div className="flex-1 p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-black text-primary bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase tracking-wider capitalize">
                            {sub.planType} Plan
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {getStatusBadge(sub.paymentStatus)}
                            {getSubscriptionStatusBadge(sub.status)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-xs font-semibold text-gray-600">Meals Remaining:</span>
                          <span className="ml-auto font-black text-primary text-sm">{sub.mealsRemaining}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-500 px-2.5 py-1 rounded-xl border border-gray-100 text-[10.5px] font-bold w-fit">
                            <Calendar className="w-3 h-3 shrink-0" />
                            Expiry: {formatDate(sub.endDate)}
                          </span>
                          {sub.isCompany && <span className="text-[10px] text-amber-600 font-black uppercase tracking-wide">Company Tender · {sub.workerCount} workers</span>}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div>
                            <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Plan Cost</p>
                            <p className="text-base font-black text-primary">PKR {sub.price?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Breakdown */}
              {loadingSubDeliveries ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
              ) : (user?.subscriptions || []).length > 0 && (
                (user?.subscriptions || []).map((sub) => {
                  const subDeliveriesFiltered = subDeliveries.filter(o => (o.paymentMethod || '').toLowerCase().includes('subscription'))
                  const usedMeals = sub.mealsUsed ?? (subDeliveriesFiltered.length * (sub.workerCount ?? 1))
                  const totalMeals = sub.totalMealsInPlan ?? ((sub.mealsRemaining + subDeliveriesFiltered.length) * (sub.workerCount ?? 1))
                  const perMealCost = sub.price > 0 && totalMeals > 0 ? Math.round(sub.price / totalMeals) : 0
                  const usedAmount = usedMeals * perMealCost
                  const usedPercent = totalMeals > 0 ? Math.round((usedMeals / totalMeals) * 100) : 0

                  return (
                    <div key={`ledger-${sub.id}`} className="mt-2 flex flex-col gap-4">
                      <div className="p-4 bg-gradient-to-r from-emerald-50/60 to-white border border-emerald-100 rounded-2xl flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">Subscription Usage</p>
                            <p className="text-xs font-bold text-text-dark">{usedMeals} of {totalMeals} Received</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">Per Meal</p>
                            <p className="text-sm font-black text-primary">PKR {perMealCost.toLocaleString()}</p>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold text-emerald-700">PKR {usedAmount.toLocaleString()} used</span>
                            <span className="text-[10px] font-bold text-gray-400">of PKR {sub.price?.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-primary to-emerald-400 h-full rounded-full" style={{ width: `${usedPercent}%` }} />
                          </div>
                        </div>
                      </div>

                      {subDeliveriesFiltered.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider px-1">Delivery Breakdown</p>
                          <div className="flex flex-col gap-2">
                            {subDeliveriesFiltered.map((o, idx) => {
                              const mealName = Array.isArray(o.items) && o.items.length > 0 ? o.items.map(i => i.name).join(', ') : 'Subscription Meal'
                              const cumulative = (idx + 1) * perMealCost
                              return (
                                <div key={o.id} className="flex items-center gap-3 p-3 bg-white border border-gray-150 rounded-xl shadow-sm">
                                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                    <span className="text-[11px] font-black text-primary">{idx + 1}</span>
                                  </div>
                                  <div className="flex-1 min-w-0 text-left">
                                    <p className="text-xs font-bold text-text-dark truncate">{mealName}</p>
                                    <p className="text-[10px] text-gray-400 font-semibold">{formatDate(o.createdAt)}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-xs font-black text-emerald-700 font-sans">PKR {perMealCost.toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-400 font-bold">Total: PKR {cumulative.toLocaleString()}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
