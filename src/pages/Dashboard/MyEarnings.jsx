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
    // Need to trigger fetch with clean parameters immediately
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
    <div className="flex flex-col gap-8 text-left w-full pb-20 max-w-6xl">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Earnings & Deliveries</h1>
        <p className="text-sm text-gray-500 font-medium">View your completed deliveries count and Cash on Delivery collections.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <Card className="p-6 border border-emerald-50 bg-gradient-to-br from-white to-emerald-50/10 shadow-sm relative overflow-hidden" hoverable={true}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Deliveries Completed</p>
              <h3 className="text-3xl font-black text-slate-800 mt-1">{stats.totalDeliveries}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center font-bold">
              <Truck className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-primary/5 blur-md"></div>
        </Card>

        <Card className="p-6 border border-emerald-50 bg-gradient-to-br from-white to-emerald-50/10 shadow-sm relative overflow-hidden" hoverable={true}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total COD Cash Collected</p>
              <h3 className="text-3xl font-black text-primary mt-1">PKR {stats.totalCodCollected.toLocaleString('en-PK')}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Landmark className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-emerald-500/5 blur-md"></div>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="p-6 border border-emerald-50/80 bg-white shadow-sm" hoverable={false}>
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
              className="py-2 px-5 rounded-xl font-bold cursor-pointer text-xs"
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="py-2 px-6 rounded-xl font-bold bg-primary text-white cursor-pointer shadow-subtle text-xs"
            >
              Apply Filters
            </Button>
          </div>
        </form>
      </Card>

      {/* Table Card */}
      <Card className="p-0 border border-emerald-50/80 bg-white shadow-sm overflow-hidden rounded-3xl" hoverable={false}>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
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
                  <td colSpan="6" className="py-12 text-center text-gray-450 font-semibold flex items-center justify-center gap-2">
                    <Package className="w-5 h-5 text-gray-300" />
                    No deliveries found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden divide-y divide-emerald-50/60 bg-white">
          {loading ? (
            <div className="py-10 text-center text-gray-400 font-medium text-xs">
              Loading earnings details...
            </div>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="p-5 flex flex-col gap-3 hover:bg-slate-50/40 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-900 text-sm">{order.orderNumber}</span>
                  <Badge variant="success">Delivered</Badge>
                </div>
                
                <div className="text-xs text-gray-600 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Customer:</span>
                    <span className="font-extrabold text-slate-800">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px] shrink-0 mt-0.5">Meals:</span>
                    <span className="font-semibold text-slate-700 text-right leading-relaxed">
                      {Array.isArray(order.items)
                        ? order.items.map((i) => `${i.name} x${i.quantity}`).join(', ')
                        : 'Meal'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Amount:</span>
                    <span className="font-black text-primary">
                      {order.paymentMethod?.toLowerCase() === 'cod' || order.paymentMethod?.toLowerCase() === 'cash on delivery' 
                        ? `PKR ${order.codAmountCollected.toLocaleString('en-PK')}` 
                        : 'Non-COD'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Date:</span>
                    <span className="text-gray-500 font-bold">{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-450 font-semibold flex items-center justify-center gap-2 text-xs">
              <Package className="w-5 h-5 text-gray-300" />
              No deliveries found matching filters.
            </div>
          )}
        </div>

        {/* Pagination Row */}
        {totalPages > 1 && (
          <div className="px-6 py-4.5 bg-emerald-50/5 border-t border-emerald-50/50 flex justify-between items-center">
            <span className="text-xs text-gray-500 font-bold">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="py-1.5 px-3 rounded-lg flex items-center gap-1 font-bold text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                className="py-1.5 px-3 rounded-lg flex items-center gap-1 font-bold text-xs"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
