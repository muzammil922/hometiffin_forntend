import React, { useState } from 'react'
import Card from '../../components/ui/Card'
import { Bell, Phone, MessageCircle, Info } from 'lucide-react'

export default function Notifications() {
  const [filter, setFilter] = useState('All')

  return (
    <div className="flex flex-col gap-8 text-left w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Notifications</h1>
          <p className="text-sm text-gray-500">Your WhatsApp order alerts and delivery updates will appear here.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl border border-emerald-100 shadow-subtle w-fit">
        {['All', 'WhatsApp', 'System'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-all ${
              filter === t ? 'bg-primary text-text-light shadow-subtle' : 'text-primary/75 hover:bg-emerald-50 bg-transparent'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Empty State */}
      <Card className="flex flex-col items-center justify-center py-20 gap-5 text-center" hoverable={false}>
        <div className="p-5 bg-emerald-50 rounded-full text-primary">
          <Bell className="w-10 h-10" />
        </div>
        <div className="max-w-sm">
          <h3 className="text-base font-black text-text-dark">No Notifications Yet</h3>
          <p className="text-sm text-gray-500 mt-2 font-medium leading-relaxed">
            When you place an order or your delivery is on the way, you'll receive WhatsApp alerts and they'll also appear here.
          </p>
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <div className="flex items-center gap-2 text-xs font-semibold bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2 rounded-full">
            <Phone className="w-3.5 h-3.5" />
            WhatsApp Order Alerts
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold bg-sky-50 border border-sky-100 text-sky-700 px-4 py-2 rounded-full">
            <MessageCircle className="w-3.5 h-3.5" />
            Rider Dispatch Messages
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold bg-amber-50 border border-amber-100 text-amber-700 px-4 py-2 rounded-full">
            <Info className="w-3.5 h-3.5" />
            Subscription Reminders
          </div>
        </div>
      </Card>
    </div>
  )
}
