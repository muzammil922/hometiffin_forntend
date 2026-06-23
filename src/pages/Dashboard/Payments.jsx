import React, { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { formatDate, formatDateTime } from '../../services/dateFormatter'
import { Download, CreditCard, DollarSign, CheckCircle, XCircle, Search, X, Image, Calendar, ShoppingBag, Sparkles } from 'lucide-react'

const DEFAULT_LIMIT = 20

export default function Payments() {
  const { addToast } = useToastStore()
  const { user } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const [customerTab, setCustomerTab] = useState('daily')

  // Admin-only: pagination + search
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]           = useState(0)
  const [limit, setLimit]           = useState(DEFAULT_LIMIT)
  const [searchInput, setSearchInput]   = useState('')
  const [searchQuery, setSearchQuery]   = useState('')

  const fetchOrders = useCallback(async (pg = 1, search = '', lim = limit) => {
    try {
      setLoading(true)
      if (user?.role === 'admin') {
        const params = new URLSearchParams({ page: pg, limit: lim })
        if (search) params.set('search', search)
        const res = await api.get(`/admin/payments?${params}`)
        setOrders(res.data.data)
        setTotal(res.data.total)
        setTotalPages(res.data.totalPages)
        setPage(res.data.page)
      } else {
        const res = await api.get('/orders/my-orders')
        setOrders(res.data)
        setTotal(res.data.length)
        setTotalPages(1)
        setPage(1)
      }
    } catch (err) {
      console.error('Failed to fetch payments data:', err)
      addToast('Failed to load payment records.', 'error')
    } finally {
      setLoading(false)
    }
  }, [user?.role, addToast])

  useEffect(() => {
    fetchOrders()
  }, [user?.role, fetchOrders])

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
      case 'active':    return <Badge variant="success">Active</Badge>
      case 'paused':    return <Badge variant="warning">Paused</Badge>
      case 'completed': return <Badge variant="success">Completed</Badge>
      case 'failed':    return <Badge variant="danger">Failed</Badge>
      default:          return <Badge variant="primary">Pending</Badge>
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
      case 'verified':  return <Badge variant="success">Verified</Badge>
      case 'submitted': return <Badge variant="primary">Submitted</Badge>
      case 'failed':    return <Badge variant="danger">Failed</Badge>
      default:          return <Badge variant="warning">Pending</Badge>
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
                        <td className="py-4 text-primary font-bold">PKR {pay.billingTotal}</td>
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
    <div className="flex flex-col gap-8 text-left w-full pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">Billing & Payments</h1>
          <p className="text-sm text-gray-500 font-medium">Review all payments, invoices, and spent logs.</p>
        </div>
      </div>

      {/* Spend Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-5 bg-white border border-emerald-50 rounded-3xl shadow-sm">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl shrink-0"></div>
              <div className="flex-1">
                <div className="h-3 w-32 bg-gray-100 rounded-lg mb-2"></div>
                <div className="h-7 w-24 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Daily Orders */}
          <Card className="flex items-center gap-4 border border-emerald-50 bg-white !p-5 hover:translate-y-0.5" hoverable={false}>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Daily Orders Spent</p>
              <p className="text-xl sm:text-2xl font-black text-text-dark">PKR {getDailyOrdersMonthly().toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">PKR {getDailyOrdersAllTime().toLocaleString()} All-time</p>
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
        <div className="flex gap-2 border-b border-emerald-50 pb-px">
          <button
            onClick={() => setCustomerTab('daily')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              customerTab === 'daily'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Daily Orders Payments
          </button>
          <button
            onClick={() => setCustomerTab('subscription')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              customerTab === 'subscription'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Subscription Payments
          </button>
        </div>

        {/* List Card Container */}
        <Card className="!p-4 sm:!p-8 hover:translate-y-0 border border-emerald-100" hoverable={false}>
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
              <div className="hidden md:block overflow-x-auto w-full">
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
                    {orders.map((pay) => {
                      const itemsStr = Array.isArray(pay.items)
                        ? pay.items.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ')
                        : 'Tiffin Meal'
                      return (
                        <tr key={pay.id} className="border-b border-emerald-50/50 last:border-0 font-medium">
                          <td className="py-4 text-text-dark font-bold">{pay.orderNumber}</td>
                          <td className="py-4 text-gray-500">{formatDate(pay.createdAt)}</td>
                          <td className="py-4 text-gray-700 truncate max-w-xs">{itemsStr}</td>
                          <td className="py-4 text-primary font-bold">PKR {pay.billingTotal}</td>
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
                {orders.length === 0 && (
                  <p className="text-gray-400 py-12 text-center text-sm font-medium">No transactions found.</p>
                )}
              </div>

              {/* MOBILE LIST VIEW - Daily Orders */}
              <div className="md:hidden flex flex-col gap-3">
                {orders.map((pay) => {
                  const itemsStr = Array.isArray(pay.items)
                    ? pay.items.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ')
                    : 'Tiffin Meal'

                  const isVerified = pay.paymentStatus === 'verified'
                  const isFailed   = pay.paymentStatus === 'failed'
                  const isSubmitted = pay.paymentStatus === 'submitted'

                  const accentColor = isVerified
                    ? 'bg-emerald-500'
                    : isFailed
                    ? 'bg-rose-400'
                    : isSubmitted
                    ? 'bg-blue-400'
                    : 'bg-amber-400'

                  const cardBorder = isVerified
                    ? 'border-emerald-100'
                    : isFailed
                    ? 'border-rose-100'
                    : isSubmitted
                    ? 'border-blue-100'
                    : 'border-amber-100'

                  return (
                    <div
                      key={pay.id}
                      className={`relative flex rounded-2xl border ${cardBorder} bg-white shadow-sm overflow-hidden`}
                    >
                      {/* Left accent strip */}
                      <div className={`w-1 shrink-0 ${accentColor} rounded-l-2xl`} />

                      <div className="flex-1 p-4 flex flex-col gap-3">
                        {/* Row 1: Order No + Status badges */}
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

                        {/* Row 2: Item name */}
                        <p className="text-xs font-semibold text-gray-700 leading-relaxed line-clamp-2">
                          {itemsStr}
                        </p>

                        {/* Row 3: Date pill */}
                        <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-500 px-2.5 py-1 rounded-xl border border-gray-100 text-[10.5px] font-bold w-fit">
                          <Calendar className="w-3 h-3 shrink-0" />
                          {formatDateTime(pay.createdAt)}
                        </span>

                        {/* Row 4: Amount + Invoice button */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div>
                            <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Amount Paid</p>
                            <p className="text-base font-black text-primary">PKR {pay.billingTotal.toLocaleString()}</p>
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
                {orders.length === 0 && (
                  <p className="text-gray-400 py-12 text-center text-sm font-medium">No transactions found.</p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto w-full">
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

              {/* MOBILE LIST VIEW - Subscription */}
              <div className="md:hidden flex flex-col gap-3">
                {(user?.subscriptions || []).map((sub) => {
                  const isVerified  = sub.paymentStatus === 'verified'
                  const isFailed    = sub.paymentStatus === 'failed'
                  const isSubmitted = sub.paymentStatus === 'submitted'

                  const accentColor = isVerified
                    ? 'bg-emerald-500'
                    : isFailed
                    ? 'bg-rose-400'
                    : isSubmitted
                    ? 'bg-blue-400'
                    : 'bg-amber-400'

                  const cardBorder = isVerified
                    ? 'border-emerald-100'
                    : isFailed
                    ? 'border-rose-100'
                    : isSubmitted
                    ? 'border-blue-100'
                    : 'border-amber-100'

                  return (
                    <div
                      key={sub.id}
                      className={`relative flex rounded-2xl border ${cardBorder} bg-white shadow-sm overflow-hidden`}
                    >
                      {/* Left accent strip */}
                      <div className={`w-1 shrink-0 ${accentColor} rounded-l-2xl`} />

                      <div className="flex-1 p-4 flex flex-col gap-3">
                        {/* Row 1: Plan label + Payment status */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-black text-primary bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase tracking-wider capitalize">
                            {sub.planType} Plan
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {getStatusBadge(sub.paymentStatus)}
                            {getSubscriptionStatusBadge(sub.status)}
                          </div>
                        </div>

                        {/* Row 2: Meals remaining chip */}
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-xs font-semibold text-gray-600">Meals Remaining:</span>
                          <span className="ml-auto font-black text-primary text-sm">{sub.mealsRemaining}</span>
                        </div>

                        {/* Row 3: Dates */}
                        <div className="flex flex-col gap-1.5">
                          <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-500 px-2.5 py-1 rounded-xl border border-gray-100 text-[10.5px] font-bold w-fit">
                            <Calendar className="w-3 h-3 shrink-0" />
                            Expiry: {formatDate(sub.endDate)}
                          </span>
                          {sub.isCompany && (
                            <span className="text-[10px] text-amber-600 font-black uppercase tracking-wide">
                              Company Tender · {sub.workerCount} workers
                            </span>
                          )}
                          <span className="text-[9.5px] text-gray-400 font-bold">
                            Purchased: {formatDateTime(sub.createdAt)}
                          </span>
                        </div>

                        {/* Row 4: Plan cost */}
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
                {(user?.subscriptions || []).length === 0 && (
                  <p className="text-gray-400 py-12 text-center text-sm font-medium">No subscription payments found.</p>
                )}
              </div>

              {/* ── Subscription Usage Breakdown ── */}
              {(user?.subscriptions || []).map((sub) => {
                // Filter subscription delivery orders first
                const subDeliveries = orders.filter(o => {
                  const m = (o.paymentMethod || '').toLowerCase()
                  return m.includes('subscription')
                })

                // mealsUsed now comes from backend (computed in userController)
                // fallback to subDeliveries.length * workerCount if not available
                const usedMeals   = sub.mealsUsed ?? (subDeliveries.length * (sub.workerCount ?? 1))
                const totalMeals  = sub.totalMealsInPlan ?? ((sub.mealsRemaining + subDeliveries.length) * (sub.workerCount ?? 1))
                const perMealCost = sub.price > 0 && totalMeals > 0
                  ? Math.round(sub.price / totalMeals)
                  : 0
                const usedAmount  = usedMeals * perMealCost
                const usedPercent = totalMeals > 0 ? Math.round((usedMeals / totalMeals) * 100) : 0

                return (
                  <div key={`ledger-${sub.id}`} className="mt-4 flex flex-col gap-4">

                    {/* Usage Summary Banner */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/60 to-white border border-emerald-100 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">Subscription Usage</p>
                          <p className="text-xs font-bold text-text-dark capitalize">{sub.planType} Plan · {usedMeals} of {totalMeals} meals used</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-0.5">Per Meal</p>
                          <p className="text-sm font-black text-primary">PKR {perMealCost.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-bold text-emerald-700">PKR {usedAmount.toLocaleString()} used</span>
                          <span className="text-[10px] font-bold text-gray-400">of PKR {sub.price?.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary to-emerald-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${usedPercent}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 font-semibold mt-1.5">
                          PKR {(sub.price - usedAmount).toLocaleString()} remaining in your plan
                        </p>
                      </div>
                    </div>

                    {/* Delivery Ledger */}
                    {subDeliveries.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider px-1 mb-1">Delivery Breakdown</p>

                        {/* Desktop ledger table */}
                        <div className="hidden md:block border border-emerald-100/60 rounded-2xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-emerald-50/40 border-b border-emerald-100/50">
                              <tr>
                                <th className="px-4 py-2.5 font-extrabold text-gray-400 uppercase tracking-wider">Order</th>
                                <th className="px-4 py-2.5 font-extrabold text-gray-400 uppercase tracking-wider">Meal</th>
                                <th className="px-4 py-2.5 font-extrabold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-2.5 font-extrabold text-gray-400 uppercase tracking-wider text-right">Meal Cost</th>
                                <th className="px-4 py-2.5 font-extrabold text-gray-400 uppercase tracking-wider text-right">Cumulative Used</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subDeliveries.map((o, idx) => {
                                const mealName = Array.isArray(o.items) && o.items.length > 0
                                  ? o.items.map(i => i.name).join(', ')
                                  : 'Subscription Meal'
                                const cumulative = (idx + 1) * perMealCost
                                return (
                                  <tr key={o.id} className="border-b border-emerald-50/50 last:border-0">
                                    <td className="px-4 py-3 font-bold text-primary">{o.orderNumber}</td>
                                    <td className="px-4 py-3 text-gray-700 font-semibold">{mealName}</td>
                                    <td className="px-4 py-3 text-gray-500">{formatDateTime(o.createdAt)}</td>
                                    <td className="px-4 py-3 text-right font-black text-emerald-700">PKR {perMealCost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-black text-primary">PKR {cumulative.toLocaleString()}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile ledger cards */}
                        <div className="md:hidden flex flex-col gap-2">
                          {subDeliveries.map((o, idx) => {
                            const mealName = Array.isArray(o.items) && o.items.length > 0
                              ? o.items.map(i => i.name).join(', ')
                              : 'Subscription Meal'
                            const cumulative = (idx + 1) * perMealCost
                            return (
                              <div key={o.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                {/* Meal number circle */}
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                  <span className="text-[11px] font-black text-primary">{idx + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-text-dark truncate">{mealName}</p>
                                  <p className="text-[10px] text-gray-400 font-semibold">{formatDate(o.createdAt)}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs font-black text-emerald-700">PKR {perMealCost.toLocaleString()}</p>
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
              })}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
