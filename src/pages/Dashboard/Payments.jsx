import React, { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { Download, CreditCard, DollarSign, CheckCircle, XCircle, Search, X, Image } from 'lucide-react'

const DEFAULT_LIMIT = 20

export default function Payments() {
  const { addToast } = useToastStore()
  const { user } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

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
  }, [user, addToast])

  useEffect(() => {
    fetchOrders()
  }, [user])

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

  // ── Customer helpers ──
  const getMonthlySpend = () => {
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

  const getPaymentMode = () => {
    if (orders.length === 0) return 'N/A'
    return orders[0].paymentMethod
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
              <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
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

  // ─── ADMIN VIEW ──────────────────────────────────────────────
  if (user?.role === 'admin') {
    return (
      <div className="flex flex-col gap-8 text-left w-full">
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
                        <td className="py-4 text-gray-500">{new Date(pay.updatedAt).toLocaleDateString()}</td>
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
    <div className="flex flex-col gap-8 text-left w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Billing & Payments</h1>
        <p className="text-sm text-gray-500">Review all payments, invoices, and spent logs.</p>
      </div>

      {/* Spend Stats */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-5 bg-white border border-emerald-50 rounded-3xl shadow-sm">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl shrink-0"></div>
              <div>
                <div className="h-3 w-32 bg-gray-100 rounded-lg mb-2"></div>
                <div className="h-7 w-24 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="flex items-center gap-4 hover:translate-y-0" hoverable={false}>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-gray-400 font-semibold">Total Spent This Month</p>
              <p className="text-2xl font-bold text-text-dark">PKR {getMonthlySpend()}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 hover:translate-y-0" hoverable={false}>
            <div className="p-3.5 bg-sky-50 text-sky-600 rounded-2xl"><CreditCard className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-gray-400 font-semibold">Active Payment Mode</p>
              <p className="text-lg font-bold text-text-dark">{getPaymentMode()}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Payment History */}
      <Card className="p-8 hover:translate-y-0" hoverable={false}>
        <h3 className="font-bold text-text-dark text-base border-b border-emerald-50 pb-3 mb-6">Transaction Logs</h3>
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
                <div className="h-6 w-6 bg-gray-100 rounded-lg ml-auto"></div>
              </div>
            ))}
          </div>
        ) : (
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
                {orders.map((pay) => {
                  const itemsStr = Array.isArray(pay.items)
                    ? pay.items.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ')
                    : 'Tiffin Meal'
                  return (
                    <tr key={pay.id} className="border-b border-emerald-50/50 last:border-0 font-medium">
                      <td className="py-4 text-text-dark font-bold">{pay.orderNumber}</td>
                      <td className="py-4 text-gray-500">{new Date(pay.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 text-gray-700 truncate max-w-xs">{itemsStr}</td>
                      <td className="py-4 text-primary font-bold">PKR {pay.billingTotal}</td>
                      <td className="py-4"><Badge variant="primary">{pay.paymentMethod}</Badge></td>
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
        )}
      </Card>
    </div>
  )
}
