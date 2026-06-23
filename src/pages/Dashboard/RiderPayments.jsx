import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToastStore } from '../../store/toastStore'
import { Landmark, Calendar, Search, Truck, ArrowLeft, ArrowRight, Package, ChevronDown, ChevronUp } from 'lucide-react'

export default function RiderPayments() {
  const { addToast } = useToastStore()

  // Main data states
  const [loading, setLoading] = useState(true)
  const [riders, setRiders] = useState([])
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [period, setPeriod] = useState('All Time') // 'Daily', 'Monthly', 'All Time'
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Expansion state: Map of riderId -> boolean
  const [expandedRiderId, setExpandedRiderId] = useState(null)
  const [breakdownLoading, setBreakdownLoading] = useState(false)
  const [breakdownOrders, setBreakdownOrders] = useState([])
  const [breakdownPage, setBreakdownPage] = useState(1)
  const [breakdownTotalPages, setBreakdownTotalPages] = useState(1)

  const fetchRiderPayments = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/rider-payments', {
        params: {
          page,
          limit: 10,
          search: search?.trim() || undefined,
          startDate: period === 'All Time' && startDate ? startDate : undefined,
          endDate: period === 'All Time' && endDate ? endDate : undefined,
          period: period !== 'All Time' ? period : undefined
        }
      })
      setRiders(res.data.data)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to load rider payments.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRiderPayments()
  }, [page, period])

  const handleFilterSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchRiderPayments()
  }

  const handleResetFilters = () => {
    setSearch('')
    setStartDate('')
    setEndDate('')
    setPeriod('All Time')
    setPage(1)
    setTimeout(() => {
      fetchRiderPayments()
    }, 0)
  }

  // Toggle expansion of a row and fetch details
  const handleToggleExpand = async (riderId) => {
    if (expandedRiderId === riderId) {
      setExpandedRiderId(null)
      setBreakdownOrders([])
      return
    }

    setExpandedRiderId(riderId)
    setBreakdownPage(1)
    fetchRiderBreakdown(riderId, 1)
  }

  const fetchRiderBreakdown = async (riderId, targetPage) => {
    try {
      setBreakdownLoading(true)
      const res = await api.get(`/admin/rider-payments/${riderId}/orders`, {
        params: {
          page: targetPage,
          limit: 5
        }
      })
      setBreakdownOrders(res.data.data)
      setBreakdownTotalPages(res.data.totalPages)
    } catch (err) {
      addToast('Failed to load rider breakdown.', 'error')
    } finally {
      setBreakdownLoading(false)
    }
  }

  // Handle page change inside breakdown
  const handleBreakdownPageChange = (targetPage) => {
    setBreakdownPage(targetPage)
    fetchRiderBreakdown(expandedRiderId, targetPage)
  }

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
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Rider Payments Report</h1>
        <p className="text-sm text-gray-500 font-medium">Track Cash On Delivery collections and completed deliveries breakdown per rider.</p>
      </div>

      {/* Segmented Period Tabs */}
      <div className="bg-emerald-50/50 p-1.5 rounded-2xl flex border border-emerald-100/50 w-full md:w-auto shadow-sm self-start">
        {['Daily', 'Monthly', 'All Time'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setPeriod(tab)
              setPage(1)
              setExpandedRiderId(null)
              setBreakdownOrders([])
            }}
            className={`py-2 px-6 rounded-xl font-extrabold text-xs cursor-pointer transition-all duration-200 ${
              period === tab
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters Card */}
      <Card className="p-6 border border-emerald-50/80 bg-white shadow-sm" hoverable={false}>
        <form onSubmit={handleFilterSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Rider Name Search"
              placeholder="Search rider name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {period === 'All Time' && (
              <>
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
              </>
            )}
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
                <th className="py-4.5 px-6 w-12"></th>
                <th className="py-4.5 px-6">Rider Name</th>
                <th className="py-4.5 px-6">Phone Number</th>
                <th className="py-4.5 px-6">Total Deliveries</th>
                <th className="py-4.5 px-6">Total COD Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-slate-700 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-400 font-medium">
                    Loading payments list...
                  </td>
                </tr>
              ) : riders.length > 0 ? (
                riders.map((rider) => (
                  <React.Fragment key={rider.id}>
                    <tr 
                      className={`hover:bg-slate-50/40 transition-colors cursor-pointer ${
                        expandedRiderId === rider.id ? 'bg-emerald-50/10' : ''
                      }`}
                      onClick={() => handleToggleExpand(rider.id)}
                    >
                      <td className="py-4 px-6 text-center">
                        {expandedRiderId === rider.id ? (
                          <ChevronUp className="w-4.5 h-4.5 text-primary shrink-0" />
                        ) : (
                          <ChevronDown className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                        )}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-slate-900">{rider.name}</td>
                      <td className="py-4 px-6 font-semibold text-gray-500">{rider.phone || '-'}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">{rider.totalDeliveries}</td>
                      <td className="py-4 px-6 font-black text-primary">PKR {rider.totalCodCollected.toLocaleString('en-PK')}</td>
                    </tr>
                    {expandedRiderId === rider.id && (
                      <tr>
                        <td colSpan="5" className="bg-slate-50/50 p-6 border-b border-emerald-50/30">
                          <div className="flex flex-col gap-4 text-left">
                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                              {rider.name}'s Delivery Breakdown
                            </h4>
                            
                            <div className="border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-xs">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="py-3 px-4">Order ID</th>
                                    <th className="py-3 px-4">Customer</th>
                                    <th className="py-3 px-4">Meal Details</th>
                                    <th className="py-3 px-4">COD Cash Collected</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-slate-750">
                                  {breakdownLoading ? (
                                    <tr>
                                      <td colSpan="6" className="py-6 text-center text-gray-400 font-medium">
                                        Loading breakdown details...
                                      </td>
                                    </tr>
                                  ) : breakdownOrders.length > 0 ? (
                                    breakdownOrders.map((order) => (
                                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4 font-bold text-slate-800">{order.orderNumber}</td>
                                        <td className="py-3 px-4 font-semibold text-slate-750">{order.customerName}</td>
                                        <td className="py-3 px-4 font-medium text-gray-500 max-w-xs truncate">
                                          {Array.isArray(order.items)
                                            ? order.items.map((i) => `${i.name} x${i.quantity}`).join(', ')
                                            : 'Meal'}
                                        </td>
                                        <td className="py-3 px-4 font-black text-primary">
                                          {order.paymentMethod?.toLowerCase() === 'cod' || order.paymentMethod?.toLowerCase() === 'cash on delivery' 
                                            ? `PKR ${order.codAmountCollected.toLocaleString('en-PK')}` 
                                            : <span className="text-gray-400 font-semibold">Non-COD</span>
                                          }
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 font-semibold">{formatDate(order.createdAt)}</td>
                                        <td className="py-3 px-4">
                                          <Badge variant="success">Delivered</Badge>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="6" className="py-6 text-center text-gray-400 font-semibold">
                                        No delivered orders found for this rider.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                              
                              {/* Breakdown Pagination */}
                              {!breakdownLoading && breakdownTotalPages > 1 && (
                                <div className="px-4 py-3 bg-slate-50/30 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-500">
                                  <span>
                                    Page {breakdownPage} of {breakdownTotalPages}
                                  </span>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      disabled={breakdownPage === 1}
                                      onClick={() => handleBreakdownPageChange(breakdownPage - 1)}
                                      className="py-1 px-2.5 rounded font-bold text-[10px]"
                                    >
                                      Prev
                                    </Button>
                                    <Button
                                      variant="outline"
                                      disabled={breakdownPage === breakdownTotalPages}
                                      onClick={() => handleBreakdownPageChange(breakdownPage + 1)}
                                      className="py-1 px-2.5 rounded font-bold text-[10px]"
                                    >
                                      Next
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-450 font-semibold">
                    <Package className="w-5 h-5 text-gray-300 inline-block mr-2" />
                    No riders found matching search.
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
              Loading payments list...
            </div>
          ) : riders.length > 0 ? (
            riders.map((rider) => (
              <div key={rider.id} className="p-5 flex flex-col gap-3">
                {/* Rider Summary Card */}
                <div 
                  className="flex justify-between items-center cursor-pointer select-none"
                  onClick={() => handleToggleExpand(rider.id)}
                >
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{rider.name}</h4>
                    <p className="text-xs text-gray-400 font-bold mt-0.5">{rider.phone || '-'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedRiderId === rider.id ? (
                      <ChevronUp className="w-5 h-5 text-primary shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px] block">Total Deliveries</span>
                    <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{rider.totalDeliveries}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px] block">Total COD Collected</span>
                    <span className="font-black text-primary text-sm mt-0.5 block">PKR {rider.totalCodCollected.toLocaleString('en-PK')}</span>
                  </div>
                </div>

                {/* Expanded Order Breakdown for Mobile */}
                {expandedRiderId === rider.id && (
                  <div className="mt-2 pt-4 border-t border-dashed border-gray-150 flex flex-col gap-3">
                    <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                      Delivery Breakdown
                    </h5>

                    {breakdownLoading ? (
                      <div className="py-6 text-center text-gray-400 font-medium text-xs">
                        Loading breakdown details...
                      </div>
                    ) : breakdownOrders.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {breakdownOrders.map((order) => (
                          <div 
                            key={order.id} 
                            className="bg-white border border-emerald-50/80 p-4 rounded-2xl flex flex-col gap-2.5 shadow-sm text-xs"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-slate-900">{order.orderNumber}</span>
                              <Badge variant="success">Delivered</Badge>
                            </div>
                            
                            <div className="text-gray-600 flex flex-col gap-1.5">
                              <div className="flex justify-between">
                                <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Customer:</span>
                                <span className="font-extrabold text-slate-800">{order.customerName}</span>
                              </div>
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px] shrink-0 mt-0.5">Meal Details:</span>
                                <span className="font-semibold text-slate-700 text-right leading-relaxed">
                                  {Array.isArray(order.items)
                                    ? order.items.map((i) => `${i.name} x${i.quantity}`).join(', ')
                                    : 'Meal'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">COD Cash Collected:</span>
                                <span className="font-black text-primary">
                                  {order.paymentMethod?.toLowerCase() === 'cod' || order.paymentMethod?.toLowerCase() === 'cash on delivery' 
                                    ? `PKR ${order.codAmountCollected.toLocaleString('en-PK')}` 
                                    : 'Non-COD'
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Date:</span>
                                <span className="text-gray-500 font-bold">{formatDate(order.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Breakdown Pagination for Mobile */}
                        {breakdownTotalPages > 1 && (
                          <div className="flex justify-between items-center py-2 text-[10px] text-gray-500 font-bold">
                            <span>Page {breakdownPage} of {breakdownTotalPages}</span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                disabled={breakdownPage === 1}
                                onClick={() => handleBreakdownPageChange(breakdownPage - 1)}
                                className="py-1 px-2.5 rounded font-bold text-[9px]"
                              >
                                Prev
                              </Button>
                              <Button
                                variant="outline"
                                disabled={breakdownPage === breakdownTotalPages}
                                onClick={() => handleBreakdownPageChange(breakdownPage + 1)}
                                className="py-1 px-2.5 rounded font-bold text-[9px]"
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-gray-400 font-semibold text-xs">
                        No delivered orders found for this rider.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-455 font-semibold flex items-center justify-center gap-2 text-xs">
              <Package className="w-5 h-5 text-gray-300" />
              No riders found matching search.
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
