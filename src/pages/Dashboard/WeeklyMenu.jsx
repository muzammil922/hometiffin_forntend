import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'
import { ChefHat, RefreshCw, Clock, Coffee, Sun, Moon, Lock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function WeeklyMenu() {
  const { addToast } = useToastStore()
  const { user, fetchProfile } = useAuthStore()
  const [weeklyMenu, setWeeklyMenu] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchWeeklyMenu = async () => {
    try {
      setLoading(true)
      const res = await api.get('/meals/weekly-menu')
      setWeeklyMenu(res.data)
    } catch (err) {
      addToast('Failed to load weekly menu.', 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchProfile()
    fetchWeeklyMenu()
  }, [])

  const isStaff = user?.role === 'admin' || user?.role === 'management'
  const activeSub = user?.subscriptions?.find(sub => sub.status === 'active')
  const hasActiveSubscription = activeSub !== undefined

  // Calculate allowed slots based on user's active subscription preferenceDeliveryTime
  const deliveryTimeStr = (activeSub?.preferenceDeliveryTime || '').toLowerCase()
  const allowedSlots = {
    breakfast: isStaff || deliveryTimeStr.includes('breakfast'),
    lunch: isStaff || deliveryTimeStr.includes('lunch'),
    dinner: isStaff || deliveryTimeStr.includes('dinner')
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const getMealForDay = (category, index) => {
    if (!weeklyMenu || !weeklyMenu[category]) return { name: 'Chef\'s Special' }
    return weeklyMenu[category][index] || { name: 'Chef\'s Special' }
  }

  const categoryIcons = {
    breakfast: <Coffee className="w-4 h-4" />,
    lunch: <Sun className="w-4 h-4" />,
    dinner: <Moon className="w-4 h-4" />
  }

  if (!loading && !isStaff && !hasActiveSubscription) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center w-full px-4 font-sans">
        <div className="p-5 bg-amber-50 text-amber-600 rounded-3xl border border-amber-100 mb-6 shrink-0 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-text-dark tracking-tight">Active Subscription Required</h2>
        <p className="text-gray-500 max-w-md mt-2 text-sm leading-relaxed font-medium">
          This weekly tiffin menu schedule is reserved exclusively for active subscribers. Please purchase a subscription plan or wait for your plan verification to view it.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 text-left w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-primary" /> Weekly Tiffin Menu
          </h1>
          <p className="text-sm text-gray-500">View our fresh, healthy home-cooked meals schedule for this week.</p>
        </div>
        {weeklyMenu && (
          <Badge variant="success" className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0">
            Active Week: {weeklyMenu.weekNumber || 1}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {weeklyMenu ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {days.map((day, idx) => {
                const breakfastMeal = weeklyMenu.breakfast[idx] || { name: 'Chef\'s Choice' }
                const lunchMeal = weeklyMenu.lunch[idx] || { name: 'Chef\'s Choice' }
                const dinnerMeal = weeklyMenu.dinner[idx] || { name: 'Chef\'s Choice' }

                return (
                  <Card 
                    key={day} 
                    className="border border-emerald-50 bg-white p-5 relative overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col gap-4"
                    hoverable={true}
                  >
                    <div className="flex justify-between items-center border-b border-emerald-50/50 pb-3">
                      <h3 className="font-black text-lg text-emerald-800 uppercase tracking-tight">{day}</h3>
                      <Badge variant="success" className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
                        Day {idx + 1}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-3.5 mt-2 flex-1 w-full">
                      {/* Breakfast Section */}
                      {allowedSlots.breakfast && (
                        <div className="border border-emerald-100 bg-emerald-50/5 rounded-xl p-3 flex flex-col gap-1.5 text-left">
                          <span className="font-extrabold text-emerald-700 block text-[9px] uppercase tracking-wider">🍳 Breakfast (7am - 11am)</span>
                          <span className="font-black text-text-dark text-sm block leading-tight">{breakfastMeal.name}</span>
                          {breakfastMeal.description && (
                            <span className="text-[11px] text-gray-500 italic mt-0.5 block leading-relaxed">{breakfastMeal.description}</span>
                          )}
                        </div>
                      )}

                      {/* Lunch Section */}
                      {allowedSlots.lunch && (
                        <div className="border border-emerald-100 bg-emerald-50/5 rounded-xl p-3 flex flex-col gap-1.5 text-left">
                          <span className="font-extrabold text-emerald-700 block text-[9px] uppercase tracking-wider">☀️ Lunch (12pm - 3pm)</span>
                          <span className="font-black text-text-dark text-sm block leading-tight">{lunchMeal.name}</span>
                          {lunchMeal.description && (
                            <span className="text-[11px] text-gray-550 italic mt-0.5 block leading-relaxed">{lunchMeal.description}</span>
                          )}
                        </div>
                      )}

                      {/* Dinner Section */}
                      {allowedSlots.dinner && (
                        <div className="border border-emerald-100 bg-emerald-50/5 rounded-xl p-3 flex flex-col gap-1.5 text-left">
                          <span className="font-extrabold text-emerald-700 block text-[9px] uppercase tracking-wider">🌙 Dinner (7pm - 10pm)</span>
                          <span className="font-black text-text-dark text-sm block leading-tight">{dinnerMeal.name}</span>
                          {dinnerMeal.description && (
                            <span className="text-[11px] text-gray-550 italic mt-1 block leading-relaxed">{dinnerMeal.description}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Subtle decoration bg element */}
                    <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-primary/5 blur-md pointer-events-none" />
                  </Card>
                )
              })}
            </motion.div>
          ) : (
            <div className="py-12 bg-white rounded-3xl border border-emerald-50 text-center text-gray-400 font-medium">
              No weekly menu details available. Please contact administrator.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
