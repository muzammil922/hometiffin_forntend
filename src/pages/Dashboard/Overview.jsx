import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Calendar, CreditCard, ShoppingBag, Clock } from 'lucide-react'

export default function Overview() {
  const { user } = useAuthStore()

  // Simulated countdown timer for next tiffin delivery
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 34, seconds: 12 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        } else {
          clearInterval(timer)
          return { hours: 0, minutes: 0, seconds: 0 }
        }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatNumber = (num) => String(num).padStart(2, '0')

  const quickStats = [
    { name: 'Active Plan', value: user?.subscription?.plan || 'Weekly Plan', icon: Calendar, color: 'text-emerald-600 bg-emerald-50' },
    { name: 'Total Orders', value: '18', icon: ShoppingBag, color: 'text-sky-600 bg-sky-50' },
    { name: 'This Month Spend', value: 'PKR 4,800', icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="flex flex-col gap-8 text-left">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Assalam-o-Alaikum, {user?.name || 'User'}!</h1>
        <p className="text-sm text-gray-500">Here is your Home Tiffin overview for today.</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name} className="flex items-center gap-4 hover:translate-y-0" hoverable={false}>
              <div className={`p-3.5 rounded-2xl ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold">{stat.name}</p>
                <p className="text-lg font-bold text-text-dark">{stat.value}</p>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Next Delivery Countdown */}
        <Card className="flex flex-col gap-6 text-center justify-center p-8">
          <div>
            <Clock className="w-10 h-10 text-primary mx-auto mb-2" />
            <h3 className="font-bold text-text-dark text-base">Next Tiffin Delivery</h3>
            <p className="text-xs text-gray-500 mt-1">Expected arrival by 1:30 PM (Lunch session)</p>
          </div>
          
          <div className="flex justify-center gap-4">
            {[
              { label: 'Hours', val: timeLeft.hours },
              { label: 'Min', val: timeLeft.minutes },
              { label: 'Sec', val: timeLeft.seconds }
            ].map(col => (
              <div key={col.label} className="bg-background rounded-2xl border border-emerald-100 p-4 w-20 shadow-subtle">
                <span className="text-2xl font-bold text-primary block">
                  {formatNumber(col.val)}
                </span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{col.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Subscription details */}
        <Card className="flex flex-col gap-4 text-left p-8">
          <h3 className="font-bold text-text-dark text-base border-b border-emerald-50 pb-3">Active Subscription</h3>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-sm font-semibold text-text-dark">{user?.subscription?.plan || 'Weekly Tiffin Plan'}</p>
              <p className="text-xs text-gray-500 mt-0.5">Renews on: {user?.subscription?.renewal || '2026-06-21'}</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <div className="mt-4 bg-background p-4 rounded-2xl border border-emerald-50 text-xs text-gray-600 leading-relaxed">
            Your delivery address is currently set to your configured <strong>Home Address</strong>. If you want to change today's delivery destination, please update it under the Subscription preference tab.
          </div>
        </Card>
      </div>
    </div>
  )
}
