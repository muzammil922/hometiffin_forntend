import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useToastStore } from '../../store/toastStore'
import { ChefHat, RefreshCw, Clock, Coffee, Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'

export default function WeeklyMenu() {
  const { addToast } = useToastStore()
  const [weeklyMenu, setWeeklyMenu] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('lunch') // default category tab

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
    fetchWeeklyMenu()
  }, [])

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
          {/* Category Tabs Selection */}
          <div className="flex gap-2 border-b border-emerald-50 pb-2 overflow-x-auto scrollbar-none">
            {['breakfast', 'lunch', 'dinner'].map((tab) => {
              const active = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-extrabold capitalize transition-all cursor-pointer border ${
                    active
                      ? 'bg-primary text-text-light border-primary shadow-subtle'
                      : 'bg-white text-gray-500 border-emerald-50/60 hover:bg-emerald-50/20 hover:text-primary'
                  }`}
                >
                  {categoryIcons[tab]}
                  {tab}
                </button>
              )
            })}
          </div>

          {/* Menu Schedule List */}
          {weeklyMenu ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {days.map((day, idx) => {
                const meal = getMealForDay(activeTab, idx)
                return (
                  <Card 
                    key={day} 
                    className="border border-emerald-50 bg-white p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md"
                    hoverable={true}
                  >
                    <div className="flex justify-between items-start mb-4 border-b border-emerald-50/50 pb-3">
                      <h3 className="font-black text-base text-emerald-800 uppercase tracking-tight">{day}</h3>
                      <Badge variant="primary" className="text-[10px] font-black uppercase tracking-wider">
                        {activeTab}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-2">
                      <h4 className="font-extrabold text-text-dark text-lg leading-tight">
                        {meal.name}
                      </h4>
                      {meal.description && (
                        <p className="text-xs text-gray-550 font-semibold leading-relaxed mt-1">
                          {meal.description}
                        </p>
                      )}
                    </div>

                    {/* Delivery Timing info badge */}
                    <div className="mt-6 pt-3 border-t border-emerald-50/30 flex items-center gap-1.5 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {activeTab === 'breakfast' && '7:00 AM – 11:00 AM'}
                        {activeTab === 'lunch' && '12:00 PM – 3:00 PM'}
                        {activeTab === 'dinner' && '7:00 PM – 10:00 PM'}
                      </span>
                    </div>

                    {/* Subtle decoration element */}
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-primary/5 blur-md" />
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
