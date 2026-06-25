import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToastStore } from '../../store/toastStore'
import { Landmark, Calendar, Search, Truck, ArrowLeft, ArrowRight, Package } from 'lucide-react'

export default function MyEarnings() {
  const { addToast } = useToastStore()
  
  // Data states
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalDeliveries: 0, totalCodCollected: 0 })
  const [orders, setOrders] = useState([])
  
  // Filter states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isPinned, setIsPinned] = useState(false)

  const fetchEarningsData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/rider/earnings', {
        params: {
          page,
          limit: 10,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: search?.trim() || undefined
        }
      })
      
      setStats({
        totalDeliveries: res.data.totalDeliveries,
        totalCodCollected: res.data.totalCodCollected
      })
      setOrders(res.data.orders)
      setTotalPages(res.data.pagination.totalPages)
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to load earnings data.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEarningsData()
  }, [page])

  useEffect(() => {
    const scrollContainer = document.querySelector('main')
    if (!scrollContainer) return

    const handleScroll = () => {
      const panel = document.getElementById('earnings-panel')
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

  const handleFilterSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchEarningsData()
  }

  const handleResetFilters = () => {
    setStartDate('')
    setEndDate('')
    setSearch('')
    setPage(1)
    setTimeout(() => {
      fetchEarningsData()
    }, 0)
  }

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="w-full">
      {/* ─── DESKTOP VIEW ─── */}
      <div className="hidden md:flex flex-col gap-8 text-left w-full pb-20 px-1 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tight">My Earnings & Deliveries</h1>
            <p className="text-sm text-gray-555 font-medium">View your completed deliveries count and Cash on Delivery collections.</p>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {/* Card 1: Deliveries */}
          <Card className="flex items-center gap-4 border border-emerald-50 bg-white !p-5 hover:translate-y-0.5 duration-300" hoverable={false}>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Total Deliveries Completed</p>
              <p className="text-2xl font-black text-text-dark mt-1">{stats.totalDeliveries}</p>
            </div>
          </Card>

          {/* Card 2: COD Cash */}
          <Card className="flex items-center gap-4 border border-emerald-50 bg-white !p-5 hover:translate-y-0.5 duration-300" hoverable={false}>
            <div className="p-3.5 bg-amber-50 text-amber-650 rounded-2xl shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Total COD Cash Collected</p>
              <p className="text-2xl font-black text-primary mt-1">PKR {stats.totalCodCollected.toLocaleString('en-PK')}</p>
            </div>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="p-6 border border-emerald-50 bg-white shadow-sm" hoverable={false}>
          <form onSubmit={handleFilterSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Input
                label="Search"
                placeholder="Search Customer or Order ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end mt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                className="py-2.5 px-5 rounded-xl font-bold cursor-pointer text-xs"
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                className="py-2.5 px-6 rounded-xl font-bold bg-primary text-white cursor-pointer shadow-subtle text-xs"
              >
                Apply Filters
              </Button>
            </div>
          </form>
        </Card>

        {/* Table Card */}
        <Card className="p-0 border border-emerald-50 bg-white shadow-sm overflow-hidden rounded-3xl" hoverable={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/15 border-b border-emerald-50/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4.5 px-6">Order ID</th>
                  <th className="py-4.5 px-6">Customer</th>
                  <th className="py-4.5 px-6">Meal details</th>
                  <th className="py-4.5 px-6">Amount Collected</th>
                  <th className="py-4.5 px-6">Date</th>
                  <th className="py-4.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-slate-700 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-gray-400 font-medium">
                      Loading earnings details...
                    </td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 px-6 font-extrabold text-slate-900">{order.orderNumber}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">{order.customerName}</td>
                      <td className="py-4 px-6 font-medium text-gray-500 max-w-xs truncate">
                        {Array.isArray(order.items)
                          ? order.items.map((i) => `${i.name} x${i.quantity}`).join(', ')
                          : 'Meal'}
                      </td>
                      <td className="py-4 px-6 font-black text-primary">
                        {order.paymentMethod?.toLowerCase() === 'cod' || order.paymentMethod?.toLowerCase() === 'cash on delivery' 
                          ? `PKR ${order.codAmountCollected.toLocaleString('en-PK')}` 
                          : <span className="text-gray-400 font-semibold">Non-COD</span>
                        }
                      </td>
                      <td className="py-4 px-6 text-gray-500 font-semibold">{formatDate(order.createdAt)}</td>
                      <td className="py-4 px-6">
                        <Badge variant="success">Delivered</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-450 font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <Package className="w-5 h-5 text-gray-300" />
                        No deliveries found matching filters.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Row */}
          {totalPages > 1 && (
            <div className="px-6 py-4.5 bg-emerald-50/5 border-t border-emerald-50/50 flex justify-between items-center">
              <span className="text-xs text-gray-550 font-bold">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className="py-1.5 px-3 rounded-lg flex items-center gap-1 font-bold text-xs cursor-pointer text-gray-655"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  className="py-1.5 px-3 rounded-lg flex items-center gap-1 font-bold text-xs cursor-pointer text-gray-655"
                >
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
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
              <h1 className="text-2xl font-black tracking-tight">My Earnings</h1>
              <p className="text-xs text-emerald-200/80 font-medium mt-1">Review deliveries and COD collections</p>
            </div>
          </div>

          {/* Card Stack representation */}
          <div className="relative h-44 mt-2 select-none">
            {/* Background card */}
            <div className="absolute top-2 left-4 right-4 h-36 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm z-0 transform rotate-1 scale-95 opacity-60" />
            
            {/* Main card */}
            <div className="absolute top-0 left-0 right-0 h-38 bg-gradient-to-tr from-white/15 to-white/5 border border-white/20 rounded-3xl backdrop-blur-lg shadow-xl p-5 flex flex-col justify-between z-10 text-left">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-emerald-200/80 font-extrabold uppercase tracking-wider">Earnings Ledger Card</p>
                  <h2 className="text-lg font-black mt-0.5 tracking-tight">Delivery Ledger</h2>
                </div>
                <Landmark className="w-6 h-6 text-emerald-300" />
              </div>

              <div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] text-emerald-300/80 font-extrabold uppercase tracking-widest">Total COD Collected</p>
                    <p className="text-2xl font-black tracking-tight">
                      PKR {stats.totalCodCollected.toLocaleString('en-PK')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-emerald-300/80 font-extrabold uppercase tracking-widest">Completed Deliveries</p>
                    <p className="text-sm font-bold">{stats.totalDeliveries} Deliveries</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* White Panel */}
        <div 
          id="earnings-panel"
          style={{ 
            borderTopLeftRadius: '36px', 
            borderTopRightRadius: '36px' 
          }}
          className="bg-white -mt-16 pt-0 px-5 pb-24 relative z-20 min-h-screen shadow-card flex flex-col gap-6 text-left transition-all duration-300"
        >
          {/* Sticky Filters Container inside panel */}
          <div
            style={{ 
              borderTopLeftRadius: '36px', 
              borderTopRightRadius: '36px' 
            }}
            className="sticky top-[-16px] sm:top-[-24px] z-30 bg-white pt-8 pb-4 flex flex-col gap-4 -mx-5 px-5 border-b border-slate-100 transition-all duration-300"
          >
            <div className="flex justify-between items-center w-full">
              <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Filters & History</h3>
              <span className="text-[10px] font-black text-gray-450 uppercase tracking-wider">
                {orders.length} Deliveries Loaded
              </span>
            </div>
          </div>

          {/* Compact filters for mobile */}
          <Card className="p-4 border border-emerald-50/80 bg-white shadow-sm flex flex-col gap-3" hoverable={false}>
            <div className="grid grid-cols-2 gap-3.5">
              <Input
                label="Start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Input
              placeholder="Search Customer or Order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-2 justify-end mt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                className="py-2 px-4 rounded-xl font-bold cursor-pointer text-xs flex-1"
              >
                Reset
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={fetchEarningsData}
                isLoading={loading}
                className="py-2 px-4 rounded-xl font-bold bg-primary text-white cursor-pointer shadow-subtle text-xs flex-1"
              >
                Apply
              </Button>
            </div>
          </Card>

          {/* List display */}
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="py-10 text-center text-gray-400 font-medium text-xs">
                Loading earnings details...
              </div>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <Card key={order.id} className="p-5 flex flex-col gap-3 border border-emerald-100 bg-white hover:translate-y-0.5" hoverable={false}>
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-900 text-sm">{order.orderNumber}</span>
                    <Badge variant="success">Delivered</Badge>
                  </div>
                  
                  <div className="text-xs text-gray-655 flex flex-col gap-2 font-semibold font-sans">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-455 font-bold uppercase tracking-wider text-[9px]">Customer:</span>
                      <span className="font-extrabold text-slate-800">{order.customerName}</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-gray-455 font-bold uppercase tracking-wider text-[9px] shrink-0 mt-0.5">Meals:</span>
                      <span className="font-semibold text-slate-700 text-right leading-relaxed">
                        {Array.isArray(order.items)
                          ? order.items.map((i) => `${i.name} x${i.quantity}`).join(', ')
                          : 'Meal'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-455 font-bold uppercase tracking-wider text-[9px]">Amount:</span>
                      <span className="font-black text-primary">
                        {order.paymentMethod?.toLowerCase() === 'cod' || order.paymentMethod?.toLowerCase() === 'cash on delivery' 
                          ? `PKR ${order.codAmountCollected.toLocaleString('en-PK')}` 
                          : 'Non-COD'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-455 font-bold uppercase tracking-wider text-[9px]">Date:</span>
                      <span className="text-gray-500 font-bold">{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="py-12 text-center text-gray-450 font-semibold flex items-center justify-center gap-2 text-xs border border-gray-150 rounded-2xl">
                <Package className="w-5 h-5 text-gray-300" />
                No deliveries found matching filters.
              </div>
            )}
          </div>

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="py-4.5 border-t border-slate-100 flex justify-between items-center w-full">
              <span className="text-xs text-gray-500 font-bold">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className="py-1.5 px-3 rounded-lg flex items-center gap-1 font-bold text-xs cursor-pointer text-gray-655"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Prev
                </Button>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  className="py-1.5 px-3 rounded-lg flex items-center gap-1 font-bold text-xs cursor-pointer text-gray-655"
                >
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
