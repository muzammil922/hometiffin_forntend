import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  OverviewSkeleton,
  AdminOverviewSkeleton,
  RiderOverviewSkeleton,
  CustomerOrdersSkeleton,
  AdminOrdersSkeleton,
  SubscriptionSkeleton,
  CustomerPaymentsSkeleton,
  AdminPaymentsSkeleton,
  TrackingSkeleton,
  RiderTrackerSkeleton,
  NotificationsSkeleton,
  ComplaintsSkeleton,
  MealsManagerSkeleton,
  SubscriptionsManagerSkeleton,
  UsersManagerSkeleton,
  BannersManagerSkeleton,
  TemplatesCustomizerSkeleton,
  WhatsAppConnectorSkeleton,
  RiderRegistrySkeleton,
  EarningsTableSkeleton,
} from './dashboardSkeletons'

function getOverviewSkeleton(role) {
  if (role === 'admin' || role === 'management') return <AdminOverviewSkeleton />
  if (role === 'rider') return <RiderOverviewSkeleton />
  return <OverviewSkeleton />
}

export default function DashboardRouteSkeleton() {
  const { pathname } = useLocation()
  const role = useAuthStore((s) => s.user?.role)
  const isAdmin = role === 'admin'
  const isManagement = role === 'management'

  switch (pathname) {
    case '/dashboard':
    case '/dashboard/overview':
      return getOverviewSkeleton(role)

    case '/dashboard/orders':
      return isAdmin ? <AdminOrdersSkeleton /> : <CustomerOrdersSkeleton />

    case '/dashboard/subscription':
      return <SubscriptionSkeleton />

    case '/dashboard/payments':
      return isAdmin || isManagement ? <AdminPaymentsSkeleton /> : <CustomerPaymentsSkeleton />

    case '/dashboard/tracking':
      return role === 'rider' ? <RiderTrackerSkeleton /> : <TrackingSkeleton />

    case '/dashboard/notifications':
      return <NotificationsSkeleton />

    case '/dashboard/complaints':
      return <ComplaintsSkeleton isAdmin={isAdmin} />

    case '/dashboard/meals':
      return <MealsManagerSkeleton />

    case '/dashboard/subscriptions':
      return <SubscriptionsManagerSkeleton />

    case '/dashboard/users':
      return <UsersManagerSkeleton />

    case '/dashboard/banners':
      return <BannersManagerSkeleton />

    case '/dashboard/templates':
      return <TemplatesCustomizerSkeleton />

    case '/dashboard/whatsapp':
      return <WhatsAppConnectorSkeleton />

    case '/dashboard/riders':
      return <RiderRegistrySkeleton />

    case '/dashboard/my-earnings':
    case '/dashboard/rider-payments':
      return <EarningsTableSkeleton />

    default:
      return getOverviewSkeleton(role)
  }
}
