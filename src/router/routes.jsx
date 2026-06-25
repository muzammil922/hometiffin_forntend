import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/shared/ProtectedRoute'
import GuestRoute from '../components/shared/GuestRoute'
import PageLoader from '../components/shared/PageLoader'
import { useAuthStore } from '../store/authStore'

const Home = lazy(() => import('../pages/Home'))
const Menu = lazy(() => import('../pages/Menu'))
const Login = lazy(() => import('../pages/Login'))
const Register = lazy(() => import('../pages/Register'))
const Reviews = lazy(() => import('../pages/Reviews'))
const Cart = lazy(() => import('../pages/Cart'))
const QuickOrder = lazy(() => import('../pages/QuickOrder'))
const DashboardLayout = lazy(() => import('../pages/Dashboard/index'))
const Overview = lazy(() => import('../pages/Dashboard/Overview'))
const AdminOverview = lazy(() => import('../pages/Dashboard/AdminOverview'))
const RiderOverview = lazy(() => import('../pages/Dashboard/RiderOverview'))
const Orders = lazy(() => import('../pages/Dashboard/Orders'))
const Subscription = lazy(() => import('../pages/Dashboard/Subscription'))
const Payments = lazy(() => import('../pages/Dashboard/Payments'))
const Tracking = lazy(() => import('../pages/Dashboard/Tracking'))
const RiderTracker = lazy(() => import('../pages/Dashboard/RiderTracker'))
const Notifications = lazy(() => import('../pages/Dashboard/Notifications'))
const MealsManager = lazy(() => import('../pages/Dashboard/MealsManager'))
const TemplatesCustomizer = lazy(() => import('../pages/Dashboard/TemplatesCustomizer'))
const WhatsAppConnector = lazy(() => import('../pages/Dashboard/WhatsAppConnector'))
const RiderRegistry = lazy(() => import('../pages/Dashboard/RiderRegistry'))
const SubscriptionsManager = lazy(() => import('../pages/Dashboard/SubscriptionsManager'))
const UsersManager = lazy(() => import('../pages/Dashboard/UsersManager'))
const BannersManager = lazy(() => import('../pages/Dashboard/BannersManager'))
const ComplaintsManager = lazy(() => import('../pages/Dashboard/ComplaintsManager'))
const MyEarnings = lazy(() => import('../pages/Dashboard/MyEarnings'))
const RiderPayments = lazy(() => import('../pages/Dashboard/RiderPayments'))

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

function DashboardOverviewSelector() {
  const { user } = useAuthStore()
  if (user?.role === 'admin') return <AdminOverview />
  if (user?.role === 'rider') return <RiderOverview />
  if (user?.role === 'management') {
    const allowed = user.allowedPages || []
    if (allowed.includes('Overview')) {
      return <AdminOverview />
    }
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

function DashboardTrackingSelector() {
  const { user } = useAuthStore()
  if (user?.role === 'rider') return <RiderTracker />
  return <Tracking />
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<GuestRoute><Home /></GuestRoute>} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/quick-order" element={<QuickOrder />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverviewSelector />} />
          <Route path="overview" element={<DashboardOverviewSelector />} />
          <Route path="orders" element={<Orders />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="tracking" element={<DashboardTrackingSelector />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="complaints" element={<RoleRoute roles={['admin', 'customer']} element={<ComplaintsManager />} />} />
          <Route path="meals" element={<RoleRoute roles={['admin', 'management']} requiredPermission="Manage Meals" element={<MealsManager />} />} />
          <Route path="subscriptions" element={<RoleRoute roles={['admin', 'management']} requiredPermission="Manage Subscriptions" element={<SubscriptionsManager />} />} />
          <Route path="users" element={<RoleRoute roles={['admin', 'management']} requiredPermission="Manage Users" element={<UsersManager />} />} />
          <Route path="banners" element={<RoleRoute roles={['admin', 'management']} requiredPermission="Manage Banners" element={<BannersManager />} />} />
          <Route path="payments" element={<RoleRoute roles={['admin', 'customer', 'management']} requiredPermission="Payments Verification" element={<Payments />} />} />
          <Route path="templates" element={<RoleRoute roles={['admin', 'management']} requiredPermission="Message Templates" element={<TemplatesCustomizer />} />} />
          <Route path="whatsapp" element={<RoleRoute roles={['admin', 'management']} requiredPermission="Evolution WhatsApp" element={<WhatsAppConnector />} />} />
          <Route path="riders" element={<RoleRoute roles={['admin']} element={<RiderRegistry />} />} />
          <Route path="my-earnings" element={<RoleRoute roles={['rider']} element={<MyEarnings />} />} />
          <Route path="rider-payments" element={<RoleRoute roles={['admin']} element={<RiderPayments />} />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
