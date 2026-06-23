import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { formatDate, formatDateTime } from '../../services/dateFormatter'
import { AlertCircle, HelpCircle, FileText, CheckCircle2, XCircle, Clock, ArrowRight, CornerDownRight, HeartHandshake, ShieldAlert, CreditCard, Calendar, User, ShoppingBag, Tag, ChevronRight } from 'lucide-react'

export default function ComplaintsManager() {
  const { addToast } = useToastStore()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const [isPinned, setIsPinned] = useState(false)

  useEffect(() => {
    const scrollContainer = document.querySelector('main')
    if (!scrollContainer) return

    const handleScroll = () => {
      const panel = document.getElementById('complaints-panel')
      if (panel) {
        const rect = panel.getBoundingClientRect()
        // Top bar is approx 50px high. Pin when top is <= 56px and scrolled.
        setIsPinned(scrollContainer.scrollTop > 50 && rect.top <= 56)

        // Mobile lazy loading scroll check
        const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100
        if (isNearBottom) {
          setMobileVisibleCount(prev => prev + 10)
        }
      } else {
        setIsPinned(false)
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    // Run after a short delay to ensure DOM is rendered
    const timer = setTimeout(handleScroll, 100)

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      clearTimeout(timer)
    }
  }, [])


  // Tabs
  const [activeTab, setActiveTab] = useState('complaints') // 'complaints' or 'refunds'
  const [complaintFilter, setComplaintFilter] = useState('all') // 'all', 'user', 'rider' (for admin)

  // Lists
  const [complaints, setComplaints] = useState([])
  const [refundRequests, setRefundRequests] = useState([])
  const [loading, setLoading] = useState(true)

  // Pagination & Mobile Lazy Load States
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const [mobileVisibleCount, setMobileVisibleCount] = useState(10)

  // Reset pagination/scroll counts when tab/filter changes
  useEffect(() => {
    setCurrentPage(1)
    setMobileVisibleCount(10)
  }, [activeTab, complaintFilter])

  // Dropdown options for filing
  const [myOrders, setMyOrders] = useState([])
  const [mySubscriptions, setMySubscriptions] = useState([])

  // Modal States
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false)
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Forms
  const [complaintForm, setComplaintForm] = useState({
    reason: '',
    description: '',
    orderId: ''
  })
  const [refundForm, setRefundForm] = useState({
    orderId: '',
    subscriptionId: '',
    amount: '',
    reason: ''
  })

  // Load Data
  const fetchData = async () => {
    try {
      setLoading(true)
      if (isAdmin) {
        // Fetch all complaints and refund requests for admin
        const [compRes, refRes] = await Promise.all([
          api.get('/complaints/admin'),
          api.get('/complaints/admin/refund')
        ])
        setComplaints(compRes.data)
        setRefundRequests(refRes.data)
      } else {
        // Fetch customer's own complaints and refunds
        const [compRes, refRes, orderRes] = await Promise.all([
          api.get('/complaints/my'),
          api.get('/complaints/refund/my'),
          api.get('/orders/my-orders')
        ])
        setComplaints(compRes.data)
        setRefundRequests(refRes.data)
        setMyOrders(orderRes.data)
        
        // Extract subscriptions from user profile
        setMySubscriptions(user?.subscriptions || [])
      }
    } catch (err) {
      console.error(err)
      addToast('Failed to load complaints or refund data.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Admin action: resolve complaint
  const handleResolveComplaint = async (complaintId) => {
    try {
      await api.put(`/complaints/admin/${complaintId}`, { status: 'resolved' })
      addToast('Complaint marked as resolved!', 'success')
      fetchData()
    } catch (err) {
      addToast('Failed to update complaint status.', 'error')
    }
  }

  // Admin action: resolve refund (approve/reject)
  const handleResolveRefund = async (refundId, status) => {
    try {
      await api.put(`/complaints/admin/refund/${refundId}`, { status })
      addToast(`Refund request ${status} successfully!`, 'success')
      fetchData()
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update refund status.', 'error')
    }
  }

  // Submit User Complaint
  const handleComplaintSubmit = async (e) => {
    e.preventDefault()
    if (!complaintForm.reason || !complaintForm.description) {
      addToast('Please enter a reason and description.', 'warning')
      return
    }
    try {
      setSubmitting(true)
      await api.post('/complaints', {
        type: 'user',
        reason: complaintForm.reason,
        description: complaintForm.description,
        orderId: complaintForm.orderId || null
      })
      addToast('Complaint submitted to admin successfully. We will contact you soon.', 'success')
      setIsComplaintModalOpen(false)
      setComplaintForm({ reason: '', description: '', orderId: '' })
      fetchData()
    } catch (err) {
      addToast('Failed to submit complaint.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Submit User Refund Request
  const handleRefundSubmit = async (e) => {
    e.preventDefault()
    if (!refundForm.amount || !refundForm.reason) {
      addToast('Please enter refund amount and reason.', 'warning')
      return
    }
    try {
      setSubmitting(true)
      await api.post('/complaints/refund', {
        orderId: refundForm.orderId || null,
        subscriptionId: refundForm.subscriptionId || null,
        amount: refundForm.amount,
        reason: refundForm.reason
      })
      addToast('Refund request submitted successfully.', 'success')
      setIsRefundModalOpen(false)
      setRefundForm({ orderId: '', subscriptionId: '', amount: '', reason: '' })
      fetchData()
    } catch (err) {
      addToast('Failed to submit refund request.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Auto-fill amount when order/subscription is selected
  const handleSelectRefundOrder = (orderId) => {
    setRefundForm(prev => ({ ...prev, orderId, subscriptionId: '' }))
    if (orderId) {
      const selected = myOrders.find(o => o.id === orderId)
      if (selected) {
        setRefundForm(prev => ({ ...prev, amount: String(selected.billingTotal) }))
      }
    }
  }

  const handleSelectRefundSubscription = (subscriptionId) => {
    setRefundForm(prev => ({ ...prev, subscriptionId, orderId: '' }))
    if (subscriptionId) {
      const selected = mySubscriptions.find(s => s.id === subscriptionId)
      if (selected) {
        setRefundForm(prev => ({ ...prev, amount: String(selected.price) }))
      }
    }
  }

  // Filter complaints based on Tab selection (for Admin)
  const filteredComplaints = complaints.filter(comp => {
    if (isAdmin && complaintFilter !== 'all') {
      return comp.type === complaintFilter
    }
    return true
  })

  const totalComplaintPages = Math.ceil(filteredComplaints.length / itemsPerPage)
  const totalRefundPages = Math.ceil(refundRequests.length / itemsPerPage)

  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const paginatedRefunds = refundRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const renderPagination = (totalPages, currentPage, onPageChange) => {
    if (totalPages <= 1) return null

    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8 py-4 w-full">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200 ${
            currentPage === 1
              ? 'border-slate-100 text-slate-300 cursor-not-allowed'
              : 'border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-300 cursor-pointer'
          }`}
        >
          <span className="sr-only">Previous</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-10 h-10 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              currentPage === p
                ? 'bg-primary text-white shadow-sm border border-primary'
                : 'border border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200 ${
            currentPage === totalPages
              ? 'border-slate-100 text-slate-300 cursor-not-allowed'
              : 'border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-300 cursor-pointer'
          }`}
        >
          <span className="sr-only">Next</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* ─── DESKTOP VIEW ─── */}
      <div className="hidden md:flex flex-col gap-8 text-left w-full pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tight">Complaints & Refunds</h1>
            <p className="text-sm text-gray-500 font-medium">
              {isAdmin 
                ? 'Review and manage issues, user disputes, rider complaints, and billing refunds.'
                : 'Submit and check status of service complaints or refund requests.'}
            </p>
          </div>
        </div>

        {/* Main Tab Switcher */}
        <div className="w-full flex border-b border-emerald-100/80 mb-2">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex-1 py-3.5 text-center text-sm font-extrabold border-b-2 transition-all duration-200 cursor-pointer ${
              activeTab === 'complaints'
                ? 'border-primary text-primary bg-emerald-50/30 rounded-t-2xl'
                : 'border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50/30 rounded-t-2xl'
            }`}
          >
            Complaints ({filteredComplaints.length})
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`flex-1 py-3.5 text-center text-sm font-extrabold border-b-2 transition-all duration-200 cursor-pointer ${
              activeTab === 'refunds'
                ? 'border-primary text-primary bg-emerald-50/30 rounded-t-2xl'
                : 'border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50/30 rounded-t-2xl'
            }`}
          >
            Refund Requests ({refundRequests.length})
          </button>
        </div>

        {/* Action Button - Customer only */}
        {!isAdmin && (
          <div className="w-full">
            {activeTab === 'complaints' ? (
              <motion.button
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsComplaintModalOpen(true)}
                className="w-full bg-gradient-to-r from-[#046a38] to-primary hover:from-[#03522c] hover:to-emerald-800 text-white font-extrabold text-xs py-4 px-6 rounded-2xl shadow-subtle flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer transition-all duration-300 border-none"
              >
                <AlertCircle className="w-4 h-4 text-white animate-pulse" />
                File a New Complaint
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsRefundModalOpen(true)}
                className="w-full bg-gradient-to-r from-[#046a38] to-primary hover:from-[#03522c] hover:to-emerald-800 text-white font-extrabold text-xs py-4 px-6 rounded-2xl shadow-subtle flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer transition-all duration-300 border-none"
              >
                <HeartHandshake className="w-4 h-4 text-white" />
                Request a New Refund
              </motion.button>
            )}
          </div>
        )}

        {/* Admin Specific Complaint Sub-tabs */}
        {isAdmin && activeTab === 'complaints' && (
          <div className="flex gap-2.5 bg-emerald-50/45 p-1 rounded-2xl border border-emerald-100/50 w-fit">
            <button
              onClick={() => setComplaintFilter('all')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                complaintFilter === 'all'
                  ? 'bg-primary text-white shadow-subtle'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-emerald-50/30'
              }`}
            >
              All Complaints
            </button>
            <button
              onClick={() => setComplaintFilter('user')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                complaintFilter === 'user'
                  ? 'bg-primary text-white shadow-subtle'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-emerald-50/30'
              }`}
            >
              User Complaints
            </button>
            <button
              onClick={() => setComplaintFilter('rider')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                complaintFilter === 'rider'
                  ? 'bg-primary text-white shadow-subtle'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-emerald-50/30'
              }`}
            >
              Rider Complaints
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6 bg-white border border-emerald-50 rounded-3xl h-36"></div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full">
            {activeTab === 'complaints' ? (
              filteredComplaints.length > 0 ? (
                <>
                  <Card className="!p-6 border border-emerald-100 shadow-sm" hoverable={false}>
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-emerald-50 text-gray-400 font-semibold">
                            <th className="pb-3 text-xs uppercase tracking-wider">Ticket / Order No</th>
                            <th className="pb-3 text-xs uppercase tracking-wider">Date</th>
                            <th className="pb-3 text-xs uppercase tracking-wider">Type</th>
                            <th className="pb-3 text-xs uppercase tracking-wider">Reason</th>
                            <th className="pb-3 text-xs uppercase tracking-wider">Description</th>
                            <th className="pb-3 text-xs uppercase tracking-wider">Status</th>
                            {isAdmin && <th className="pb-3 text-xs uppercase tracking-wider text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedComplaints.map((comp) => {
                            const isResolved = comp.status === 'resolved'
                            const statusStyle = isResolved 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/50' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200/50'
                            return (
                              <tr key={comp.id} className="border-b border-emerald-50/50 last:border-0 font-medium">
                                <td className="py-4 font-bold text-text-dark">
                                  <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
                                    {comp.orderNumber || 'General'}
                                  </span>
                                </td>
                                <td className="py-4 text-gray-500 whitespace-nowrap">{formatDate(comp.createdAt)}</td>
                                <td className="py-4">
                                  <span className="text-xs font-semibold text-slate-500 capitalize">
                                    {comp.type === 'rider' ? 'Rider' : 'User'}
                                  </span>
                                </td>
                                <td className="py-4 text-slate-700 font-semibold">{comp.reason}</td>
                                <td className="py-4 text-slate-600 max-w-xs truncate" title={comp.description}>
                                  {comp.description}
                                </td>
                                <td className="py-4 whitespace-nowrap">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${statusStyle}`}>
                                    {isResolved ? 'Resolved' : comp.status}
                                  </span>
                                </td>
                                {isAdmin && (
                                  <td className="py-4 text-right">
                                    {!isResolved && (
                                      <button
                                        onClick={() => handleResolveComplaint(comp.id)}
                                        className="bg-primary hover:bg-[#046a38] text-white font-extrabold text-[10px] px-3.5 py-2 rounded-xl shadow-sm border-none cursor-pointer uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                                        <span>Resolve</span>
                                      </button>
                                    )}
                                  </td>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                  {renderPagination(totalComplaintPages, currentPage, setCurrentPage)}
                </>
              ) : (
                <Card className="p-8 text-center text-gray-400 font-medium" hoverable={false}>
                  No complaints recorded in the system. Everything looks peaceful!
                </Card>
              )
            ) : (
              // Refund Requests
              refundRequests.length > 0 ? (
                <>
                  <Card className="!p-6 border border-emerald-100 shadow-sm" hoverable={false}>
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-emerald-50 text-gray-400 font-semibold">
                            <th className="pb-3 text-xs uppercase tracking-wider">Refund / Ref ID</th>
                            <th className="pb-3 text-xs uppercase tracking-wider">Date</th>
                            <th className="pb-3 text-xs uppercase tracking-wider">Type</th>
                            <th className="pb-3 text-xs uppercase tracking-wider">Amount</th>
                            <th className="pb-3 text-xs uppercase tracking-wider">Reason</th>
                            <th className="pb-3 text-xs uppercase tracking-wider">Status</th>
                            {isAdmin && <th className="pb-3 text-xs uppercase tracking-wider text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRefunds.map((refund) => {
                            const isApproved = refund.status === 'approved'
                            const isRejected = refund.status === 'rejected'
                            const isPending = refund.status === 'pending'
                            const statusStyle = isApproved 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/50' 
                              : isRejected 
                                ? 'bg-rose-100 text-rose-800 border border-rose-200/50' 
                                : 'bg-amber-100 text-amber-800 border border-amber-200/50'
                            return (
                              <tr key={refund.id} className="border-b border-emerald-50/50 last:border-0 font-medium">
                                <td className="py-4 font-bold text-text-dark">
                                  <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-xs truncate max-w-[120px] inline-block" title={refund.orderId || refund.subscriptionId}>
                                    {refund.orderId ? `Order: ${refund.orderId.substring(0, 8)}...` : `Sub: ${refund.subscriptionId ? refund.subscriptionId.substring(0, 8) : 'N/A'}...`}
                                  </span>
                                </td>
                                <td className="py-4 text-gray-500 whitespace-nowrap">{formatDate(refund.createdAt)}</td>
                                <td className="py-4">
                                  <span className="text-xs font-semibold text-slate-550 capitalize">
                                    {refund.orderId ? 'Order' : 'Subscription'}
                                  </span>
                                </td>
                                <td className="py-4 text-primary font-bold">PKR {refund.amount.toLocaleString()}</td>
                                <td className="py-4 text-slate-600 max-w-xs truncate" title={refund.reason}>
                                  {refund.reason}
                                </td>
                                <td className="py-4 whitespace-nowrap">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${statusStyle}`}>
                                    {refund.status}
                                  </span>
                                </td>
                                {isAdmin && isPending && (
                                  <td className="py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleResolveRefund(refund.id, 'approved')}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-xl border-none cursor-pointer uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                      </button>
                                      <button
                                        onClick={() => handleResolveRefund(refund.id, 'rejected')}
                                        className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-xl border-none cursor-pointer uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200"
                                      >
                                        <XCircle className="w-3.5 h-3.5" /> Reject
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                  {renderPagination(totalRefundPages, currentPage, setCurrentPage)}
                </>
              ) : (
                <Card className="p-8 text-center text-gray-400 font-medium" hoverable={false}>
                  No refund requests logged.
                </Card>
              )
            )}
          </div>
        )}
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
              <h1 className="text-2xl font-black tracking-tight">Complaints & Refunds</h1>
              <p className="text-xs text-emerald-200/80 font-medium mt-1">Manage and track your tickets</p>
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
                    {activeTab === 'complaints' ? 'Support Ticket Card' : 'Refund Ledger Card'}
                  </p>
                  <h2 className="text-lg font-black mt-0.5 tracking-tight">
                    {activeTab === 'complaints' ? 'Complaints Manager' : 'Refund Requests'}
                  </h2>
                </div>
                {activeTab === 'complaints' ? (
                  <AlertCircle className="w-6 h-6 text-emerald-300 animate-pulse" />
                ) : (
                  <CreditCard className="w-6 h-6 text-emerald-300" />
                )}
              </div>

              <div>
                {activeTab === 'complaints' ? (
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] text-emerald-300/80 font-extrabold uppercase tracking-widest">Active Tickets</p>
                      <p className="text-2xl font-black tracking-tight">{complaints.filter(c => c.status !== 'resolved').length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-emerald-300/80 font-extrabold uppercase tracking-widest">Total Filed</p>
                      <p className="text-sm font-bold">{complaints.length}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] text-emerald-300/80 font-extrabold uppercase tracking-widest">Total Approved</p>
                      <p className="text-2xl font-black tracking-tight">
                        PKR {refundRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-emerald-300/80 font-extrabold uppercase tracking-widest">Pending</p>
                      <p className="text-sm font-bold">
                        {refundRequests.filter(r => r.status === 'pending').length} Requests
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div 
          id="complaints-panel"
          style={{ 
            borderTopLeftRadius: isPinned ? '0px' : '36px', 
            borderTopRightRadius: isPinned ? '0px' : '36px' 
          }}
          className="bg-white -mt-16 pt-0 px-5 pb-24 relative z-20 min-h-screen shadow-card flex flex-col gap-6 text-left transition-all duration-300"
        >
          <div 
            style={{ 
              borderTopLeftRadius: isPinned ? '0px' : '36px', 
              borderTopRightRadius: isPinned ? '0px' : '36px' 
            }}
            className="sticky top-[-16px] sm:top-[-24px] z-30 bg-white pt-8 pb-4 flex flex-col gap-6 -mx-5 px-5 border-b border-slate-100 transition-all duration-300"
          >
            {/* Tab Switcher inside the white panel */}
            <div className="flex gap-2 bg-slate-100/85 p-1 rounded-2xl border border-slate-200/50">
              <button
                onClick={() => setActiveTab('complaints')}
                className={`flex-1 py-3 text-center text-xs font-black rounded-xl transition-all duration-200 cursor-pointer border-none ${
                  activeTab === 'complaints'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Complaints ({filteredComplaints.length})
              </button>
              <button
                onClick={() => setActiveTab('refunds')}
                className={`flex-1 py-3 text-center text-xs font-black rounded-xl transition-all duration-200 cursor-pointer border-none ${
                  activeTab === 'refunds'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Refunds ({refundRequests.length})
              </button>
            </div>

            {/* Dynamic CTA Button */}
            {!isAdmin && (
              <div>
                {activeTab === 'complaints' ? (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsComplaintModalOpen(true)}
                    className="w-full bg-gradient-to-r from-[#046a38] to-primary text-white font-extrabold text-xs py-4 px-6 rounded-2xl shadow-subtle flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer border-none"
                  >
                    <AlertCircle className="w-4 h-4 text-white animate-pulse" />
                    File a New Complaint
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsRefundModalOpen(true)}
                    className="w-full bg-gradient-to-r from-[#046a38] to-primary text-white font-extrabold text-xs py-4 px-6 rounded-2xl shadow-subtle flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer border-none"
                  >
                    <HeartHandshake className="w-4 h-4 text-white" />
                    Request a New Refund
                  </motion.button>
                )}
              </div>
            )}
          </div>

          {/* Section Header */}
          <div className="flex justify-between items-center mt-2 border-b border-slate-100 pb-2">
            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">
              {activeTab === 'complaints' ? 'My Tickets' : 'Refund Ledger'}
            </h3>
            <span className="text-[10px] font-black text-gray-450 uppercase tracking-wider">
              {activeTab === 'complaints' ? `${filteredComplaints.length} Filed` : `${refundRequests.length} Requests`}
            </span>
          </div>

          {/* Sleek List Container (Mockup Style) */}
          {loading ? (
            <div className="flex flex-col gap-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-150 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {activeTab === 'complaints' ? (
                filteredComplaints.length > 0 ? (
                  filteredComplaints.slice(0, mobileVisibleCount).map((comp) => {
                    const isResolved = comp.status === 'resolved'
                    const themeBorder = isResolved ? 'border-emerald-200' : 'border-amber-200'
                    const iconStyle = isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    const statusStyle = isResolved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/50' : 'bg-amber-100 text-amber-800 border border-amber-200/50'
                    return (
                      <div
                        key={comp.id}
                        className={`relative flex flex-col rounded-[28px] border ${themeBorder} bg-slate-50/70 shadow-sm p-5 w-full text-left gap-4`}
                      >
                        {/* Top Row */}
                        <div className="flex items-center justify-between w-full gap-3">
                          <div className="flex items-center gap-3">
                            {/* Left: rounded-2xl icon container */}
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${iconStyle}`}>
                              <AlertCircle className="w-6 h-6" />
                            </div>

                            {/* Middle: Category and Reason Pill */}
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {comp.type === 'rider' ? 'Rider Complaint' : 'User Complaint'}
                              </span>
                              <div className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit mt-1 shadow-sm">
                                {comp.reason}
                              </div>
                            </div>
                          </div>

                          {/* Right: Status Pill */}
                          <div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${statusStyle}`}>
                              {isResolved ? 'Resolved' : comp.status}
                            </span>
                          </div>
                        </div>

                        {/* Middle: Premium Quote Box containing Description */}
                        <div className="relative bg-white border border-slate-100 rounded-2xl p-5 text-xs text-slate-700 flex flex-col gap-2 shadow-sm overflow-hidden group">
                          {/* Quote content */}
                          <div className="pl-1 flex flex-col relative z-10">
                            <span className="absolute -top-4 -left-1.5 text-emerald-250/40 text-4xl font-serif select-none pointer-events-none">“</span>
                            <p className="leading-relaxed font-medium pt-2 text-slate-600">
                              {comp.description}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="flex justify-between items-center w-full mt-1">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-[10px] font-black text-slate-800 uppercase tracking-wider">
                            Order: {comp.orderNumber || 'General'}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${
                            isResolved 
                              ? 'bg-emerald-100/80 border-emerald-250 text-emerald-800' 
                              : 'bg-amber-100/80 border-amber-250 text-amber-800'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(comp.createdAt)}</span>
                          </span>
                        </div>

                        {/* Admin Actions */}
                        {isAdmin && !isResolved && (
                          <div className="w-full flex flex-col">
                            <div className="border-t border-slate-200 my-2.5" />
                            <div className="flex justify-end w-full">
                              <button
                                onClick={() => handleResolveComplaint(comp.id)}
                                className="bg-primary hover:bg-[#046a38] text-white font-extrabold text-[10px] px-4.5 py-2.5 rounded-xl shadow-sm border-none cursor-pointer uppercase tracking-wider flex items-center gap-1 transition-all duration-200"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Mark Resolved</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="p-8 text-center text-gray-400 text-xs font-semibold bg-slate-50 rounded-2xl">
                    No complaints recorded in the system.
                  </div>
                )
              ) : (
                refundRequests.length > 0 ? (
                  refundRequests.slice(0, mobileVisibleCount).map((refund) => {
                    const isApproved = refund.status === 'approved'
                    const isRejected = refund.status === 'rejected'
                    const isPending = refund.status === 'pending'
                    const themeBorder = isApproved 
                      ? 'border-emerald-250' 
                      : isRejected 
                        ? 'border-rose-250' 
                        : 'border-amber-250'
                    const iconStyle = isApproved 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : isRejected 
                        ? 'bg-rose-100 text-rose-800' 
                        : 'bg-amber-100 text-amber-800'
                    const statusStyle = isApproved 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/50' 
                      : isRejected 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200/50' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200/50'
                    return (
                      <div
                        key={refund.id}
                        className={`relative flex flex-col rounded-[28px] border ${themeBorder} bg-slate-50/70 shadow-sm p-5 w-full text-left gap-4`}
                      >
                        {/* Top Row */}
                        <div className="flex items-center justify-between w-full gap-3">
                          <div className="flex items-center gap-3">
                            {/* Left: rounded-2xl icon container */}
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${iconStyle}`}>
                              <CreditCard className="w-6 h-6" />
                            </div>

                            {/* Middle: Category and Refund Amount Pill */}
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-555 uppercase tracking-wider">
                                {refund.orderId ? 'Order Refund' : 'Subscription Refund'}
                              </span>
                              <div className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit mt-1 shadow-sm">
                                PKR {refund.amount.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Right: Status Pill */}
                          <div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${statusStyle}`}>
                              {refund.status}
                            </span>
                          </div>
                        </div>

                        {/* Middle: Premium Quote Box containing Description */}
                        <div className="relative bg-white border border-slate-100 rounded-2xl p-5 text-xs text-slate-700 flex flex-col gap-2 shadow-sm overflow-hidden group">
                          {/* Quote content */}
                          <div className="pl-1 flex flex-col relative z-10">
                            <span className="absolute -top-4 -left-1.5 text-emerald-250/40 text-4xl font-serif select-none pointer-events-none">“</span>
                            <p className="leading-relaxed font-medium pt-2 text-slate-600">
                              {refund.reason}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="flex justify-between items-center w-full mt-1">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-[10px] font-black text-slate-800 uppercase tracking-wider">
                            {refund.orderId ? `Order: ${refund.orderId.substring(0, 8)}...` : `Sub: ${refund.subscriptionId ? refund.subscriptionId.substring(0, 8) : 'N/A'}...`}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${
                            isApproved 
                              ? 'bg-emerald-100/80 border-emerald-250 text-emerald-800' 
                              : isRejected 
                                ? 'bg-rose-100/80 border-rose-250 text-rose-800' 
                                : 'bg-amber-100/80 border-amber-250 text-amber-800'
                          }`}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(refund.createdAt)}</span>
                          </span>
                        </div>

                        {/* Admin Actions */}
                        {isAdmin && isPending && (
                          <div className="w-full flex flex-col">
                            <div className="border-t border-slate-200 my-2.5" />
                            <div className="flex justify-end gap-2.5 w-full">
                              <button
                                onClick={() => handleResolveRefund(refund.id, 'approved')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-4.5 py-2.5 rounded-xl border-none cursor-pointer uppercase tracking-wider flex items-center gap-1 transition-all duration-200"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleResolveRefund(refund.id, 'rejected')}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] px-4.5 py-2.5 rounded-xl border-none cursor-pointer uppercase tracking-wider flex items-center gap-1 transition-all duration-200"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="p-8 text-center text-gray-400 text-xs font-semibold bg-slate-50 rounded-2xl">
                    No refund requests logged.
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── FILE COMPLAINT MODAL (User only) ─── */}
      <Modal isOpen={isComplaintModalOpen} onClose={() => setIsComplaintModalOpen(false)} title="File a Complaint">
        <form onSubmit={handleComplaintSubmit} className="flex flex-col gap-4">
          <Input 
            label="Subject / Reason *" 
            placeholder="e.g. Late delivery / Wrong food item" 
            value={complaintForm.reason} 
            onChange={(e) => setComplaintForm(prev => ({ ...prev, reason: e.target.value }))} 
            required 
          />
          
          <Input 
            label="Detailed Description *" 
            type="textarea"
            placeholder="Describe the issue in detail..." 
            value={complaintForm.description} 
            onChange={(e) => setComplaintForm(prev => ({ ...prev, description: e.target.value }))} 
            required 
          />

          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 block">Associated Order (Optional)</label>
            <select
              value={complaintForm.orderId}
              onChange={(e) => setComplaintForm(prev => ({ ...prev, orderId: e.target.value }))}
              className="w-full text-xs font-bold text-text-dark bg-white border border-gray-200 rounded-xl px-4.5 py-3.5 focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">No associated order</option>
              {myOrders.map(o => (
                <option key={o.id} value={o.id}>{o.orderNumber} - {formatDate(o.createdAt)} (PKR {o.billingTotal})</option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="primary" isLoading={submitting} className="w-full py-3.5 mt-2 rounded-2xl font-bold bg-primary text-white cursor-pointer">
            Submit Complaint
          </Button>
        </form>
      </Modal>

      {/* ─── REQUEST REFUND MODAL (User only) ─── */}
      <Modal isOpen={isRefundModalOpen} onClose={() => setIsRefundModalOpen(false)} title="Request a Refund">
        <form onSubmit={handleRefundSubmit} className="flex flex-col gap-4">
          
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 block">Select Order OR Subscription *</label>
            <div className="flex flex-col gap-2.5">
              <select
                value={refundForm.orderId}
                onChange={(e) => handleSelectRefundOrder(e.target.value)}
                className="w-full text-xs font-bold text-text-dark bg-white border border-gray-200 rounded-xl px-4.5 py-3.5 focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="">-- Choose Order (One-Time) --</option>
                {myOrders.map(o => (
                  <option key={o.id} value={o.id}>{o.orderNumber} - {formatDate(o.createdAt)} (PKR {o.billingTotal})</option>
                ))}
              </select>

              <select
                value={refundForm.subscriptionId}
                onChange={(e) => handleSelectRefundSubscription(e.target.value)}
                className="w-full text-xs font-bold text-text-dark bg-white border border-gray-200 rounded-xl px-4.5 py-3.5 focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="">-- Choose Subscription --</option>
                {mySubscriptions.map(s => (
                  <option key={s.id} value={s.id}>{s.planType.toUpperCase()} Plan - {formatDate(s.createdAt)} (PKR {s.price})</option>
                ))}
              </select>
            </div>
          </div>

          <Input 
            label="Refund Amount (PKR) *" 
            type="number"
            placeholder="e.g. 500" 
            value={refundForm.amount} 
            onChange={(e) => setRefundForm(prev => ({ ...prev, amount: e.target.value }))} 
            required 
          />
          
          <Input 
            label="Reason for Refund *" 
            type="textarea"
            placeholder="State the reason why you are requesting a refund..." 
            value={refundForm.reason} 
            onChange={(e) => setRefundForm(prev => ({ ...prev, reason: e.target.value }))} 
            required 
          />

          <Button type="submit" variant="primary" isLoading={submitting} className="w-full py-3.5 mt-2 rounded-2xl font-bold bg-primary text-white cursor-pointer">
            Submit Refund Request
          </Button>
        </form>
      </Modal>

    </div>
  )
}
