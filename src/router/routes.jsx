import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/shared/ProtectedRoute'
import { useAuthStore } from '../store/authStore'
import Home from '../pages/Home'
import Menu from '../pages/Menu'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Reviews from '../pages/Reviews'
import Cart from '../pages/Cart'
import QuickOrder from '../pages/QuickOrder'
import DashboardLayout from '../pages/Dashboard/index'
import Overview from '../pages/Dashboard/Overview'
import AdminOverview from '../pages/Dashboard/AdminOverview'
import RiderOverview from '../pages/Dashboard/RiderOverview'
import Orders from '../pages/Dashboard/Orders'
import Subscription from '../pages/Dashboard/Subscription'
import Payments from '../pages/Dashboard/Payments'
import Tracking from '../pages/Dashboard/Tracking'
import RiderTracker from '../pages/Dashboard/RiderTracker'
import Notifications from '../pages/Dashboard/Notifications'
import MealsManager from '../pages/Dashboard/MealsManager'
import TemplatesCustomizer from '../pages/Dashboard/TemplatesCustomizer'
import WhatsAppConnector from '../pages/Dashboard/WhatsAppConnector'
import RiderRegistry from '../pages/Dashboard/RiderRegistry'
import SubscriptionsManager from '../pages/Dashboard/SubscriptionsManager'
import UsersManager from '../pages/Dashboard/UsersManager'
import BannersManager from '../pages/Dashboard/BannersManager'

// Role guard for sub-routes with permission check
function RoleRoute({ roles, element, requiredPermission }) {
  const { user } = useAuthStore()
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  if (user.role === 'management' && requiredPermission) {
    const allowed = user.allowedPages || []
    if (!allowed.includes(requiredPermission)) {
      return <Navigate to="/dashboard" replace />
    }
  }
  return element
}

// Select Overview panel dynamically depending on user role
function DashboardOverviewSelector() {
  const { user } = useAuthStore()
  if (user?.role === 'admin') return <AdminOverview />
  if (user?.role === 'rider') return <RiderOverview />
  if (user?.role === 'management') {
    const allowed = user.allowedPages || []
    if (allowed.includes('Overview')) {
      return <AdminOverview />
    }
    // Redirect to the first permitted page
    const firstAllowed = allowed.find((p) => p !== 'Overview')
    if (firstAllowed) {
      const pathMap = {
        'Manage Orders': '/dashboard/orders',
        'Manage Subscriptions': '/dashboard/subscriptions',
        'Manage Users': '/dashboard/users',
        'Manage Meals': '/dashboard/meals',
        'Payments Verification': '/dashboard/payments',
        'Message Templates': '/dashboard/templates',
        'Evolution WhatsApp': '/dashboard/whatsapp',
      }
      const targetPath = pathMap[firstAllowed]
      if (targetPath) {
        return <Navigate to={targetPath} replace />
      }
    }
    return (
      <div className="p-6 bg-white border border-rose-100 text-rose-600 rounded-2xl">
        Access Denied: No dashboard permissions assigned. Please contact the administrator.
      </div>
    )
  }
  return <Overview />
}

// Select Tracking panel dynamically depending on user role
function DashboardTrackingSelector() {
  const { user } = useAuthStore()
  if (user?.role === 'rider') return <RiderTracker />
  return <Tracking />
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/quick-order" element={<QuickOrder />} />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardOverviewSelector />} />
        <Route path="orders" element={<Orders />} />
        <Route path="subscription" element={<Subscription />} />
        
        {/* Dynamic tracking page depending on role */}
        <Route path="tracking" element={<DashboardTrackingSelector />} />
        <Route path="notifications" element={<Notifications />} />
        
        {/* Admin / Sub-admin Protected Routes */}
        <Route path="meals" element={<RoleRoute roles={['admin', 'management']} requiredPermission="Manage Meals" element={<MealsManager />} />} />
        <Route path="subscriptions" element={<RoleRoute roles={['admin', 'management']} requiredPermission="Manage Subscriptions" element={<SubscriptionsManager />} />} />
        <Route path="users" element={<RoleRoute roles={['admin', 'management']} requiredPermission="Manage Users" element={<UsersManager />} />} />
        <Route path="banners" element={<RoleRoute roles={['admin', 'management']} requiredPermission="Manage Banners" element={<BannersManager />} />} />
        <Route path="payments" element={<RoleRoute roles={['admin', 'customer', 'management']} requiredPermission="Payments Verification" element={<Payments />} />} />
        <Route path="templates" element={<RoleRoute roles={['admin', 'management']} requiredPermission="Message Templates" element={<TemplatesCustomizer />} />} />
        <Route path="whatsapp" element={<RoleRoute roles={['admin', 'management']} requiredPermission="Evolution WhatsApp" element={<WhatsAppConnector />} />} />
        <Route path="riders" element={<RoleRoute roles={['admin']} element={<RiderRegistry />} />} />
      </Route>
    </Routes>
  )
}
