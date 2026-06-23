import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { formatDate, formatDateTime } from '../../services/dateFormatter'
import { AlertCircle, HelpCircle, FileText, CheckCircle2, XCircle, Clock, ArrowRight, CornerDownRight, HeartHandshake, ShieldAlert, CreditCard } from 'lucide-react'

export default function ComplaintsManager() {
  const { addToast } = useToastStore()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  // Tabs
  const [activeTab, setActiveTab] = useState('complaints') // 'complaints' or 'refunds'
  const [complaintFilter, setComplaintFilter] = useState('all') // 'all', 'user', 'rider' (for admin)

  // Lists
  const [complaints, setComplaints] = useState([])
  const [refundRequests, setRefundRequests] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="flex flex-col gap-8 text-left w-full pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Complaints & Refunds</h1>
          <p className="text-sm text-gray-500 font-medium">
            {isAdmin 
              ? 'Review and manage issues, user disputes, rider complaints, and billing refunds.'
              : 'Submit and check status of service complaints or refund requests.'}
          </p>
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsComplaintModalOpen(true)}
              className="rounded-2xl font-bold px-4 py-2.5 flex items-center gap-2 border-emerald-100 hover:bg-emerald-50 text-xs text-primary cursor-pointer"
            >
              <AlertCircle className="w-4 h-4" /> File a Complaint
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRefundModalOpen(true)}
              className="rounded-2xl font-bold px-4 py-2.5 flex items-center gap-2 bg-primary text-white text-xs cursor-pointer shadow-subtle"
            >
              <HeartHandshake className="w-4 h-4" /> Request Refund
            </Button>
          </div>
        )}
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
        <div className="flex flex-col gap-5 w-full">
          {activeTab === 'complaints' ? (
            filteredComplaints.length > 0 ? (
              filteredComplaints.map((comp) => (
                <Card key={comp.id} className="p-6 bg-white border border-emerald-100/80 shadow-sm rounded-3xl hover:translate-y-0 transition-all duration-200" hoverable={false}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0 border border-rose-100/50">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-800 leading-tight">{comp.reason}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Complaint Ticket</p>
                        </div>
                        <div className="flex gap-2 ml-auto sm:ml-0">
                          <Badge variant={comp.type === 'rider' ? 'warning' : 'primary'} className="uppercase text-[9px] font-extrabold tracking-wider">
                            {comp.type === 'rider' ? 'Rider' : 'User'}
                          </Badge>
                          <Badge variant={comp.status === 'resolved' ? 'success' : 'primary'} className="text-[9px] font-extrabold uppercase">
                            {comp.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Complaint Details Container */}
                      <div className="mt-5 bg-slate-50/60 border border-slate-100 rounded-3xl p-5 text-xs font-semibold text-gray-655 flex flex-col gap-2.5">
                        <div>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Details / Description</span>
                          <p className="text-slate-700 leading-relaxed font-semibold">"{comp.description}"</p>
                        </div>
                        
                        <div className="border-t border-gray-150/60 pt-3.5 mt-2 flex flex-col gap-2.5 text-[11px] text-gray-500">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px] w-20 shrink-0">Reporter:</span>
                            <span className="font-bold text-gray-600">{comp.reporter?.name} ({comp.reporter?.phone || 'No phone'}) — <span className="capitalize font-extrabold text-primary">{comp.reporter?.role}</span></span>
                          </div>
                          {comp.reportedUser && (
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px] w-20 shrink-0">Against:</span>
                              <span className="font-bold text-gray-600">{comp.reportedUser?.name} ({comp.reportedUser?.phone || 'No phone'}) — <span className="capitalize font-extrabold text-primary">{comp.reportedUser?.role}</span></span>
                            </div>
                          )}
                          {comp.orderNumber && (
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px] w-20 shrink-0">Order:</span>
                              <Badge variant="primary" className="text-[10px] font-black">{comp.orderNumber}</Badge>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px] w-20 shrink-0">Filed On:</span>
                            <span className="flex items-center gap-1.5 font-bold text-gray-405">
                              <Clock className="w-3.5 h-3.5 text-gray-300" /> {formatDateTime(comp.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin Resolution Action */}
                    {isAdmin && comp.status !== 'resolved' && (
                      <div className="shrink-0 self-end sm:self-auto border-t sm:border-t-0 border-emerald-50/55 pt-3 sm:pt-0 w-full sm:w-auto">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleResolveComplaint(comp.id)}
                          className="rounded-xl px-4 py-2.5 font-bold bg-primary hover:bg-primary/95 text-white flex items-center justify-center gap-1.5 w-full cursor-pointer text-xs shadow-subtle"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center text-gray-400 font-medium" hoverable={false}>
                No complaints recorded in the system. Everything looks peaceful!
              </Card>
            )
          ) : (
            // Refund Requests
            refundRequests.length > 0 ? (
              refundRequests.map((refund) => (
                <Card key={refund.id} className="p-6 bg-white border border-emerald-100/80 shadow-sm rounded-3xl hover:translate-y-0 transition-all duration-200" hoverable={false}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center shrink-0 border border-emerald-100/50">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-primary leading-tight">PKR {refund.amount.toLocaleString()}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Refund Request</p>
                        </div>
                        <div className="flex gap-2 ml-auto sm:ml-0">
                          <Badge variant={
                            refund.status === 'approved' ? 'success' :
                            refund.status === 'rejected' ? 'danger' : 'primary'
                          } className="uppercase text-[9px] font-extrabold tracking-wider">
                            {refund.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Refund Details Container */}
                      <div className="mt-5 bg-slate-50/60 border border-slate-100 rounded-3xl p-5 text-xs font-semibold text-gray-655 flex flex-col gap-2.5">
                        <div>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Reason for Refund</span>
                          <p className="text-slate-700 leading-relaxed font-semibold">"{refund.reason}"</p>
                        </div>
                        
                        <div className="border-t border-gray-150/60 pt-3.5 mt-2 flex flex-col gap-2.5 text-[11px] text-gray-500">
                          {isAdmin && (
                            <div className="flex items-start gap-2">
                              <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px] w-20 shrink-0 mt-0.5">User Details:</span>
                              <span className="font-bold text-gray-600">
                                {refund.user?.name} ({refund.user?.email}) — Phone: {refund.user?.phone || 'N/A'}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px] w-20 shrink-0">Type:</span>
                            <span className="font-bold text-gray-500">
                              {refund.orderId ? 'Order Refund request' : 'Subscription Refund request'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px] w-20 shrink-0">Submitted:</span>
                            <span className="flex items-center gap-1.5 font-bold text-gray-405">
                              <Clock className="w-3.5 h-3.5 text-gray-300" /> {formatDateTime(refund.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin Action for Refund Approvals */}
                    {isAdmin && refund.status === 'pending' && (
                      <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end sm:self-auto border-t sm:border-t-0 border-emerald-50/55 pt-3 sm:pt-0 w-full sm:w-auto">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleResolveRefund(refund.id, 'approved')}
                          className="rounded-xl px-4 py-2.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 w-full cursor-pointer text-xs shadow-subtle"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveRefund(refund.id, 'rejected')}
                          className="rounded-xl px-4 py-2.5 font-bold border-rose-100 hover:bg-rose-50 text-rose-600 flex items-center justify-center gap-1.5 w-full cursor-pointer text-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center text-gray-400 font-medium" hoverable={false}>
                No refund requests logged.
              </Card>
            )
          )}
        </div>
      )}

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
