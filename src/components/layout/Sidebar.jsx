import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ShoppingBag,
  CalendarDays,
  CreditCard,
  MapPin,
  Bell,
  LogOut,
  User,
  ChefHat,
  MessageSquare,
  Smartphone,
  Users,
  Image,
  Menu,
  X,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import AnimatedLogo from '../shared/AnimatedLogo'

export default function Sidebar({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const getMenuItems = () => {
    if (user?.role === 'admin') {
      return [
        { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Manage Orders', path: '/dashboard/orders', icon: ShoppingBag },
        { name: 'Manage Subscriptions', path: '/dashboard/subscriptions', icon: CalendarDays },
        { name: 'Manage Users', path: '/dashboard/users', icon: Users },
        { name: 'Manage Meals', path: '/dashboard/meals', icon: ChefHat },
        { name: 'Manage Banners', path: '/dashboard/banners', icon: Image },
        { name: 'Payments Verification', path: '/dashboard/payments', icon: CreditCard },
        { name: 'Rider Payments', path: '/dashboard/rider-payments', icon: CreditCard },
        { name: 'Message Templates', path: '/dashboard/templates', icon: MessageSquare },
        { name: 'Evolution WhatsApp', path: '/dashboard/whatsapp', icon: Smartphone },
        { name: 'Rider Accounts', path: '/dashboard/riders', icon: User },
        { name: 'Complaints & Refunds', path: '/dashboard/complaints', icon: AlertCircle },
      ]
    } else if (user?.role === 'management') {
      const allowed = user?.allowedPages || []
      const items = []
      if (allowed.includes('Overview')) items.push({ name: 'Overview', path: '/dashboard', icon: LayoutDashboard })
      if (allowed.includes('Manage Orders')) items.push({ name: 'Manage Orders', path: '/dashboard/orders', icon: ShoppingBag })
      if (allowed.includes('Manage Subscriptions')) items.push({ name: 'Manage Subscriptions', path: '/dashboard/subscriptions', icon: CalendarDays })
      if (allowed.includes('Manage Users')) items.push({ name: 'Manage Users', path: '/dashboard/users', icon: Users })
      if (allowed.includes('Manage Meals')) items.push({ name: 'Manage Meals', path: '/dashboard/meals', icon: ChefHat })
      if (allowed.includes('Manage Banners')) items.push({ name: 'Manage Banners', path: '/dashboard/banners', icon: Image })
      if (allowed.includes('Payments Verification')) items.push({ name: 'Payments Verification', path: '/dashboard/payments', icon: CreditCard })
      if (allowed.includes('Message Templates')) items.push({ name: 'Message Templates', path: '/dashboard/templates', icon: MessageSquare })
      if (allowed.includes('Evolution WhatsApp')) items.push({ name: 'Evolution WhatsApp', path: '/dashboard/whatsapp', icon: Smartphone })
      return items
    } else if (user?.role === 'rider') {
      return [
        { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        { name: 'My Earnings', path: '/dashboard/my-earnings', icon: CreditCard },
        { name: 'GPS Tracker', path: '/dashboard/tracking', icon: MapPin },
      ]
    } else {
      return [
        { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        { name: 'My Orders', path: '/dashboard/orders', icon: ShoppingBag },
        { name: 'Subscription', path: '/dashboard/subscription', icon: CalendarDays },
        { name: 'Weekly Menu', path: '/dashboard/weekly-menu', icon: ChefHat },
        { name: 'Payments', path: '/dashboard/payments', icon: CreditCard },
        { name: 'Live Tracking', path: '/dashboard/tracking', icon: MapPin },
        { name: 'Notifications', path: '/dashboard/notifications', icon: Bell },
        { name: 'Complaints & Refunds', path: '/dashboard/complaints', icon: AlertCircle },
      ]
    }
  }

  const menuItems = getMenuItems()

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Bottom nav: 4 main tabs for regular user
  const bottomNavItems = (!user?.role || user?.role === 'user')
    ? [
      { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Orders', path: '/dashboard/orders', icon: ShoppingBag },
      { name: 'Payments', path: '/dashboard/payments', icon: CreditCard },
      { name: 'Subscription', path: '/dashboard/subscription', icon: CalendarDays },
    ]
    : menuItems.slice(0, 4)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    // Dark bg shows behind the pushed content on mobile
    <div className="fixed inset-0 bg-[#0d3320] flex flex-col md:flex-row overflow-hidden">

      {/* ══════════════════════════════════════
          DESKTOP SIDEBAR (white, left)
      ══════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-emerald-100 p-6 shadow-subtle h-full shrink-0">
        <div className="mb-8 text-left">
          <Link to="/" className="text-xl font-black tracking-tight text-primary flex items-center gap-2">
            <AnimatedLogo className="h-7" />
            Home Tiffin
          </Link>
          <span className="text-[10px] bg-accent px-2 py-0.5 rounded-full font-bold text-text-dark mt-2 inline-block">
            Dashboard
          </span>
        </div>

        <div className="flex items-center gap-3 p-3 bg-background rounded-2xl border border-emerald-50/50 mb-8 text-left">
          <div className="w-10 h-10 rounded-full bg-primary text-text-light flex items-center justify-center font-bold text-sm shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-text-dark truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 text-left flex-1 overflow-y-auto scrollbar-none">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${active ? 'bg-primary text-text-light shadow-subtle' : 'text-primary/75 hover:bg-accent-light'
                  }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-2xl text-sm font-semibold cursor-pointer transition-all mt-4"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </aside>

      {/* ══════════════════════════════════════
          MOBILE: DARK DRAWER (slides from left)
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop - click outside to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40"
              onClick={() => setDrawerOpen(false)}
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-[72vw] max-w-[280px] z-50 flex flex-col bg-transparent py-6 shadow-none h-full"
            >
              {/* Header - only logo, no X button */}
              <div className="flex items-center px-5 pb-4 shrink-0">
                <Link to="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2.5">
                  <AnimatedLogo className="h-7" />
                  <span className="text-white font-black text-base">Home Tiffin</span>
                </Link>
              </div>

              {/* Nav - scrollable middle block */}
              <nav className="flex-1 overflow-y-auto flex flex-col gap-4 px-3 mt-6 scrollbar-none">
                {menuItems.map((item, i) => {
                  const Icon = item.icon
                  const active = isActive(item.path)
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i, duration: 0.22 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setDrawerOpen(false)}
                        className={`flex items-center gap-3 py-2.5 rounded-r-xl rounded-l-none text-sm font-semibold transition-all w-fit relative ${active
                          ? 'bg-transparent text-white pl-3 pr-4 border-l-4 border-white'
                          : 'text-white/65 hover:text-white hover:bg-white/8 pl-4 pr-4'
                          }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-white/40'}`} />
                        <span>{item.name}</span>
                        {active && <span className="ml-4 w-2 h-2 rounded-full bg-white opacity-80 shrink-0" />}
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>

              {/* Logout */}
              <div className="px-5 mt-auto pt-4 shrink-0">
                <button
                  onClick={() => { handleLogout(); setDrawerOpen(false) }}
                  className="w-fit flex items-center gap-3 pl-4 pr-4 py-2.5 bg-accent/20 text-rose-400 hover:bg-accent/30 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          MOBILE: CONTENT WRAPPER
          Scales & slides RIGHT when drawer opens
          giving the "screen pushed back" effect
      ══════════════════════════════════════ */}
      <div
        className="md:contents"
        style={drawerOpen
          ? {
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            transform: 'scale(0.80) translateX(min(90vw, 375px))',
            transformOrigin: 'left center',
            borderRadius: '22px',
            overflow: 'hidden',
            zIndex: 40,
            pointerEvents: 'none',
            boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
            transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          }
          : {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
            transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          }
        }
      >
        {/* Mobile Top Bar */}
        <div className="md:hidden w-full bg-white border-b border-emerald-100 px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setDrawerOpen(prev => !prev)}
            className="p-2 text-primary hover:bg-emerald-50 rounded-xl cursor-pointer shrink-0 pointer-events-auto"
            aria-label="Toggle Menu"
          >
            {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/" className="text-base font-black tracking-tight text-primary flex items-center gap-2 flex-1">
            <AnimatedLogo className="h-6" />
            Home Tiffin
          </Link>
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 md:pb-10 bg-background"
          style={drawerOpen ? { paddingBottom: '0' } : { paddingBottom: '80px' }}
        >
          {children}
        </main>

        {/* Mobile Bottom Navigation (4 tabs) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-emerald-100 flex items-center justify-between py-2.5 z-30 shadow-[0_-2px_16px_rgba(0,0,0,0.07)]">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all ${active ? 'text-primary' : 'text-gray-400'
                  }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-emerald-50' : ''}`}>
                  <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-gray-400'}`} />
                </div>
                <span className={`text-xs font-bold text-center ${active ? 'text-primary' : 'text-gray-400'}`}>
                  {item.name.replace('My ', '')}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

    </div>
  )
}
