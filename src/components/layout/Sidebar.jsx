import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBag,
  CalendarDays,
  CreditCard,
  MapPin,
  Bell,
  LogOut,
  User
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function Sidebar({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Orders', path: '/dashboard/orders', icon: ShoppingBag },
    { name: 'Subscription', path: '/dashboard/subscription', icon: CalendarDays },
    { name: 'Payments', path: '/dashboard/payments', icon: CreditCard },
    { name: 'Live Tracking', path: '/dashboard/tracking', icon: MapPin },
    { name: 'Notifications', path: '/dashboard/notifications', icon: Bell },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-emerald-100 p-6 shadow-subtle min-h-screen sticky top-0">
        <div className="mb-8 text-left">
          <Link to="/" className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
            🍱 Home Tiffin
          </Link>
          <span className="text-[10px] bg-accent px-2 py-0.5 rounded-full font-bold text-text-dark mt-2 inline-block">
            Dashboard
          </span>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 p-3 bg-background rounded-2xl border border-emerald-50/50 mb-8 text-left">
          <div className="w-10 h-10 rounded-full bg-primary text-text-light flex items-center justify-center font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-text-dark truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || 'user@email.com'}</p>
          </div>
        </div>

        {/* Menu items */}
        <nav className="flex flex-col gap-2 text-left flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-primary text-text-light shadow-subtle'
                    : 'text-primary/75 hover:bg-accent-light'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-2xl text-sm font-semibold cursor-pointer transition-all mt-auto"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </aside>

      {/* Top Navigation Bar - Mobile */}
      <div className="md:hidden w-full bg-white border-b border-emerald-100 px-6 py-4 flex items-center justify-between shadow-subtle">
        <Link to="/" className="text-lg font-bold tracking-tight text-primary">
          🍱 Home Tiffin
        </Link>
        <button
          onClick={handleLogout}
          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full pb-24 md:pb-10">
        {children}
      </main>

      {/* Bottom Tab Bar Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-emerald-100 flex items-center justify-around py-3 z-30 shadow-card">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center gap-1 ${
                active ? 'text-primary' : 'text-primary/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{item.name.replace('My ', '')}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
