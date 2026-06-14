import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../components/shared/ProtectedRoute'
import Home from '../pages/Home'
import Menu from '../pages/Menu'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Reviews from '../pages/Reviews'
import DashboardLayout from '../pages/Dashboard/index'
import Overview from '../pages/Dashboard/Overview'
import Orders from '../pages/Dashboard/Orders'
import Subscription from '../pages/Dashboard/Subscription'
import Payments from '../pages/Dashboard/Payments'
import Tracking from '../pages/Dashboard/Tracking'
import Notifications from '../pages/Dashboard/Notifications'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="orders" element={<Orders />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="payments" element={<Payments />} />
        <Route path="tracking" element={<Tracking />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>
  )
}
