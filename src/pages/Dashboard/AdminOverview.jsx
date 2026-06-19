import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useToastStore } from '../../store/toastStore'
import { LayoutDashboard, Users, ShoppingBag, CreditCard, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AdminOverview() {
  const { addToast } = useToastStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

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
      <div className="flex flex-col gap-8 text-left w-full animate-pulse">
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
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="h-5 w-48 bg-gray-200 rounded-xl"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-5 bg-white border border-emerald-50 rounded-3xl">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="h-4 w-32 bg-gray-200 rounded-lg mb-2"></div>
                    <div className="h-3 w-40 bg-gray-100 rounded-lg"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-100 rounded-full"></div>
                </div>
              </div>
            ))}
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
    <div className="flex flex-col gap-8 text-left w-full">
      <div>
        <h1 className="text-3xl font-black text-primary tracking-tight">Admin Console Overview</h1>
        <p className="text-sm text-gray-500">Real-time stats and management summary for Home Tiffin operations.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Orders */}
        <Card className="flex items-center gap-4 border border-emerald-50 bg-white" hoverable={false}>
          <div className="p-3.5 rounded-2xl text-emerald-600 bg-emerald-50">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-black text-text-dark">{stats?.totalOrders || 0}</p>
          </div>
        </Card>

        {/* Card 2: Total Users */}
        <Card className="flex items-center gap-4 border border-emerald-50 bg-white" hoverable={false}>
          <div className="p-3.5 rounded-2xl text-sky-600 bg-sky-50">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Total Users</p>
            <p className="text-2xl font-black text-text-dark">{stats?.totalUsers || 0}</p>
          </div>
        </Card>

        {/* Card 3: Payments Verified vs Pending */}
        <Card className="flex items-center gap-4 border border-emerald-50 bg-white" hoverable={false}>
          <div className="p-3.5 rounded-2xl text-amber-600 bg-amber-50">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Pending Payments</p>
            <p className="text-2xl font-black text-amber-700">{stats?.pendingPayments || 0}</p>
          </div>
        </Card>

        {/* Card 4: Subscriptions Allocations */}
        <Card className="flex items-center gap-4 border border-emerald-50 bg-white" hoverable={false}>
          <div className="p-3.5 rounded-2xl text-rose-600 bg-rose-50">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Confirmed Payments</p>
            <p className="text-2xl font-black text-rose-700">{stats?.confirmedPayments || 0}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Center Column: Subscription Quotas List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-text-dark tracking-tight">Active Subscriptions Quota Details</h3>
            <Badge variant="success">Active Status</Badge>
          </div>

          <div className="flex flex-col gap-4">
            {stats?.subscriptionQuotaDetails && stats.subscriptionQuotaDetails.length > 0 ? (
              stats.subscriptionQuotaDetails.map((sub) => (
                <Card key={sub.id} className="p-5 border border-emerald-50 bg-white" hoverable={false}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-left">
                      <h4 className="font-bold text-text-dark text-sm">{sub.customer.name}</h4>
                      <p className="text-xs text-gray-500">{sub.customer.email}</p>
                      <span className="text-[10px] mt-1.5 inline-block bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase">
                        {sub.planType} Plan
                      </span>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Meals Remaining</span>
                        <span className="text-base font-black text-primary">{sub.mealsRemaining} Meals left</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-sm text-gray-400 font-medium py-6 text-center">No active tiffin subscriptions currently logged.</p>
            )}
          </div>
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
