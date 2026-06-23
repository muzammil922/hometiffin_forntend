import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useToastStore } from '../../store/toastStore'
import { LayoutDashboard, Users, ShoppingBag, CreditCard, Clock, CheckCircle2, AlertCircle, Landmark } from 'lucide-react'

export default function AdminOverview() {
  const { addToast } = useToastStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedQuotas, setExpandedQuotas] = useState(false)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/stats')
      setStats(res.data)
    } catch (err) {
      addToast('Failed to load admin dashboard statistics.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-8 text-left w-full animate-pulse pb-12">
        {/* Header skeleton */}
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded-2xl mb-2"></div>
          <div className="h-4 w-96 bg-gray-100 rounded-xl"></div>
        </div>
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-5 bg-white border border-emerald-50 rounded-3xl shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 shrink-0"></div>
              <div className="flex-1">
                <div className="h-3 w-24 bg-gray-100 rounded-lg mb-2"></div>
                <div className="h-7 w-12 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
        {/* Bottom section skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="p-6 bg-white border border-emerald-50 rounded-3xl flex flex-col gap-6">
              <div className="flex justify-between items-center pb-3 border-b border-emerald-50/50">
                <div className="h-6 w-48 bg-gray-200 rounded-lg"></div>
                <div className="h-6 w-20 bg-gray-100 rounded-full"></div>
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-b border-emerald-50/50 last:border-0 pb-4 last:pb-0 flex justify-between items-center">
                  <div>
                    <div className="h-4 w-32 bg-gray-200 rounded-lg mb-2"></div>
                    <div className="h-3 w-40 bg-gray-150 rounded-lg"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-100 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="p-6 bg-white border border-emerald-50 rounded-3xl">
              <div className="h-5 w-40 bg-gray-200 rounded-xl mb-4"></div>
              <div className="flex flex-col gap-3">
                <div className="h-12 w-full bg-gray-100 rounded-2xl"></div>
                <div className="h-12 w-full bg-gray-100 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 text-left w-full pb-12">
      <div>
        <h1 className="text-3xl font-black text-primary tracking-tight">Admin Console Overview</h1>
        <p className="text-sm text-gray-500">Real-time stats and management summary for Home Tiffin operations.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {/* Card 1: Total Orders */}
        <Card className="flex items-center gap-4 border border-emerald-50 bg-white" hoverable={false}>
          <div className="p-3.5 rounded-2xl text-emerald-600 bg-emerald-50 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-black text-text-dark">{stats?.totalOrders || 0}</p>
          </div>
        </Card>

        {/* Card 2: Total Users */}
        <Card className="flex items-center gap-4 border border-emerald-50 bg-white" hoverable={false}>
          <div className="p-3.5 rounded-2xl text-sky-600 bg-sky-50 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Total Users</p>
            <p className="text-2xl font-black text-text-dark">{stats?.totalUsers || 0}</p>
          </div>
        </Card>

        {/* Card 3: Payments Verified vs Pending */}
        <Card className="flex items-center gap-4 border border-emerald-50 bg-white" hoverable={false}>
          <div className="p-3.5 rounded-2xl text-amber-600 bg-amber-50 shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Pending Payments</p>
            <p className="text-2xl font-black text-amber-700">{stats?.pendingPayments || 0}</p>
          </div>
        </Card>

        {/* Card 4: Subscriptions Allocations */}
        <Card className="flex items-center gap-4 border border-emerald-50 bg-white" hoverable={false}>
          <div className="p-3.5 rounded-2xl text-rose-600 bg-rose-50 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Confirmed Payments</p>
            <p className="text-2xl font-black text-rose-700">{stats?.confirmedPayments || 0}</p>
          </div>
        </Card>

        {/* Card 5: COD Collections & Completed Today */}
        <Card className="flex flex-col justify-between border border-emerald-50 bg-gradient-to-br from-white to-emerald-50/5 p-4 relative overflow-hidden" hoverable={true}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl text-emerald-600 bg-emerald-50 shrink-0">
              <Landmark className="w-5.5 h-5.5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider leading-none">COD Collected</p>
              <p className="text-lg font-black text-primary mt-1">
                PKR {stats?.totalCodCollected?.toLocaleString('en-PK') || 0}
              </p>
            </div>
          </div>
          <div className="border-t border-emerald-50/50 pt-2 flex justify-between items-center text-xs mt-3">
            <div className="text-left">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block leading-none">Delivered Today:</span>
              <span className="font-extrabold text-slate-800 text-[11px] mt-0.5 block">{stats?.completedDeliveriesToday || 0}</span>
            </div>
            <Link 
              to="/dashboard/rider-payments" 
              className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 underline transition-all shrink-0"
            >
              Report →
            </Link>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500/5 blur-md"></div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Center Column: Subscription Quotas List inside single Card */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-6 border border-emerald-50 bg-white hover:translate-y-0" hoverable={false}>
            <div className="flex items-center justify-between border-b border-emerald-50 pb-4 mb-5">
              <h3 className="text-lg font-black text-text-dark tracking-tight">
                <span className="sm:hidden">Active Subscriptions</span>
                <span className="hidden sm:inline">Active Subscriptions Quota Details</span>
              </h3>
              <Badge variant="success">Active Status</Badge>
            </div>

            <div className="flex flex-col gap-4">
              {stats?.subscriptionQuotaDetails && stats.subscriptionQuotaDetails.length > 0 ? (
                <>
                  {stats.subscriptionQuotaDetails
                    .slice(0, expandedQuotas ? undefined : 5)
                    .map((sub) => (
                      <div 
                        key={sub.id} 
                        className="p-4 bg-gray-50/40 hover:bg-emerald-50/15 border border-emerald-50/60 rounded-2xl transition-all duration-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-left flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-text-dark text-sm leading-tight">{sub.customer.name}</h4>
                              <span className="text-[9px] bg-primary/10 text-primary font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                {sub.planType} Plan
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium truncate max-w-[200px] sm:max-w-xs">{sub.customer.email}</p>
                          </div>

                          <div className="flex sm:justify-end items-center border-t sm:border-t-0 border-emerald-50/50 pt-2 sm:pt-0 mt-1 sm:mt-0">
                            <div className="text-left sm:text-right w-full flex sm:flex-col justify-between items-center sm:items-end gap-1">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block sm:inline">Meals Remaining:</span>
                              <span className="text-sm font-black text-primary bg-primary/5 sm:bg-transparent px-2 sm:px-0 py-0.5 sm:py-0 rounded-lg">{sub.mealsRemaining} Left</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                  {/* Expand / Collapse Trigger & Navigation Link */}
                  {stats.subscriptionQuotaDetails.length > 5 ? (
                    <div className="flex justify-between items-center mt-2 border-t border-emerald-50 pt-4">
                      <button
                        onClick={() => setExpandedQuotas(!expandedQuotas)}
                        className="text-xs font-black text-primary hover:text-primary/85 transition-all cursor-pointer"
                      >
                        {expandedQuotas ? 'Show Less ↑' : `View More (${stats.subscriptionQuotaDetails.length - 5} more) ↓`}
                      </button>
                      <Link
                        to="/dashboard/subscriptions"
                        className="text-xs font-black text-emerald-600 hover:text-emerald-700 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Manage Subscriptions →
                      </Link>
                    </div>
                  ) : (
                    <div className="flex justify-end mt-2 border-t border-emerald-50 pt-4">
                      <Link
                        to="/dashboard/subscriptions"
                        className="text-xs font-black text-emerald-600 hover:text-emerald-700 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Manage Subscriptions →
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400 font-medium py-6 text-center">No active tiffin subscriptions currently logged.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Order Details & Time slots */}
        <div className="flex flex-col gap-6">
          <Card className="p-6 border border-emerald-100 bg-white" hoverable={false}>
            <h3 className="font-extrabold text-text-dark text-base pb-3 border-b border-emerald-50">Delivery Slot Allocations</h3>
            
            <div className="flex flex-col gap-4 mt-4 text-xs font-semibold text-gray-600">
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-emerald-50">
                <span className="text-text-dark font-extrabold">Lunch Subscriptions</span>
                <Badge variant="primary" className="text-sm font-black">{stats?.deliveryTimeSlots?.lunch || 0}</Badge>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-emerald-50">
                <span className="text-text-dark font-extrabold">Dinner Subscriptions</span>
                <Badge variant="accent" className="text-sm font-black">{stats?.deliveryTimeSlots?.dinner || 0}</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-emerald-100 bg-emerald-50/20 flex flex-col gap-3" hoverable={false}>
            <div className="flex items-center gap-2 text-primary">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-extrabold text-sm leading-none">Orders segmentation</h4>
            </div>
            <div className="text-xs text-gray-650 flex flex-col gap-2 mt-2 leading-relaxed">
              <div className="flex justify-between">
                <span>One-Time Orders:</span>
                <span className="font-bold text-text-dark">{stats?.oneTimeOrdersCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Subscription Orders:</span>
                <span className="font-bold text-text-dark">{stats?.subscriptionOrdersCount || 0}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
