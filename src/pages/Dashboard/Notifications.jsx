import React, { useState } from 'react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Bell, Mail, Phone, Check } from 'lucide-react'

const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'WhatsApp', title: 'Tiffin Dispatched!', message: 'Hi! Your homestyle Lunch tiffin has been picked up by rider Shahrukh and is on its way to your destination.', time: '10 mins ago', read: false },
  { id: '2', type: 'Email', title: 'Weekly Invoice Reciept', message: 'Hello! Your transaction invoice of PKR 1,600 has been paid successfully for renewal.', time: '2 hours ago', read: true },
  { id: '3', type: 'Push', title: 'Subscription Renewed', message: 'Assalam-o-Alaikum! Your Weekly plan has renewed successfully. Check details inside dashboard.', time: '1 day ago', read: true },
  { id: '4', type: 'WhatsApp', title: 'Welcome to Home Tiffin', message: 'Assalam-o-Alaikum! Welcome to Home Tiffin. Thank you for connecting with us.', time: '5 days ago', read: true }
]

export default function Notifications() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [filter, setFilter] = useState('All')

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const getIcon = (type) => {
    switch (type) {
      case 'WhatsApp': return <Phone className="w-5 h-5 text-emerald-600" />
      case 'Email': return <Mail className="w-5 h-5 text-sky-600" />
      default: return <Bell className="w-5 h-5 text-amber-600" />
    }
  }

  const getBg = (type) => {
    switch (type) {
      case 'WhatsApp': return 'bg-emerald-50 border-emerald-100'
      case 'Email': return 'bg-sky-50 border-sky-100'
      default: return 'bg-amber-50 border-amber-100'
    }
  }

  const filteredNotifications = filter === 'All' 
    ? notifications 
    : notifications.filter(n => n.type === filter)

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Notifications History</h1>
          <p className="text-sm text-gray-500">View alert histories dispatched by SMS, WhatsApp, or email notifications.</p>
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 w-fit shrink-0"
        >
          <Check className="w-4 h-4" /> Mark All as Read
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl border border-emerald-100 shadow-subtle w-fit">
        {['All', 'WhatsApp', 'Email', 'Push'].map((t) => (
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

      {/* Alert List */}
      <div className="flex flex-col gap-4">
        {filteredNotifications.map((notif) => (
          <Card 
            key={notif.id} 
            className={`flex items-start gap-4 p-5 hover:translate-y-0 relative border-l-4 ${
              !notif.read ? 'border-l-primary bg-emerald-50/10' : 'border-l-gray-200'
            }`}
            hoverable={false}
          >
            <div className={`p-3 rounded-2xl border ${getBg(notif.type)} shrink-0`}>
              {getIcon(notif.type)}
            </div>

            <div className="flex-1 text-left">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h3 className="font-bold text-text-dark text-sm">{notif.title}</h3>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold">
                  <span>{notif.time}</span>
                  {!notif.read && <Badge variant="accent">New</Badge>}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{notif.message}</p>
              <span className="text-[10px] text-gray-400 font-bold bg-background px-2 py-0.5 rounded-md mt-3 inline-block">
                Channel: {notif.type}
              </span>
            </div>
          </Card>
        ))}
        {filteredNotifications.length === 0 && (
          <p className="text-gray-400 py-12 text-center text-sm font-medium">No notification logs found for channel: {filter}.</p>
        )}
      </div>
    </div>
  )
}
