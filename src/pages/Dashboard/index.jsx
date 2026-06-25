import React, { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/layout/Sidebar'
import DashboardRouteSkeleton from '../../components/skeletons/DashboardRouteSkeleton'

export default function DashboardLayout() {
  return (
    <Sidebar>
      <Suspense fallback={<DashboardRouteSkeleton />}>
        <Outlet />
      </Suspense>
    </Sidebar>
  )
}
