import React, { useState } from 'react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToastStore } from '../../store/toastStore'
import { Calendar, ToggleLeft, ToggleRight, X, Play } from 'lucide-react'

export default function Subscription() {
  const { addToast } = useToastStore()
  const [isActive, setIsActive] = useState(true)
  
  // Weekly days preference state
  const [deliveryDays, setDeliveryDays] = useState({
    Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true, Sunday: false
  })

  // Dislike preferences
  const [preferences, setPreferences] = useState({
    spicy: false,
    beef: false,
    mutton: false,
    onions: false,
    oil: true
  })

  const toggleDay = (day) => {
    setDeliveryDays({ ...deliveryDays, [day]: !deliveryDays[day] })
  }

  const togglePreference = (pref) => {
    setPreferences({ ...preferences, [pref]: !preferences[pref] })
  }

  const handleStatusToggle = () => {
    setIsActive(!isActive)
    addToast(isActive ? 'Subscription plan paused successfully!' : 'Subscription plan resumed!', 'success')
  }

  const handleSavePref = () => {
    addToast('Preferences saved successfully!', 'success')
  }

  return (
    <div className="flex flex-col gap-8 text-left">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Subscription Management</h1>
        <p className="text-sm text-gray-500">Configure your daily meal preferences and schedule routines.</p>
      </div>

      {/* Plan Card */}
      <Card className="p-8 hover:translate-y-0" hoverable={false}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-emerald-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-text-dark text-base">Weekly Tiffin Plan</h3>
              <p className="text-xs text-gray-500 mt-0.5">Renews on: 2026-06-21 (PKR 1,600 / week)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={isActive ? 'success' : 'warning'}>
              {isActive ? 'Active' : 'Paused'}
            </Badge>
            <Button
              variant={isActive ? 'outline' : 'primary'}
              size="sm"
              onClick={handleStatusToggle}
              className="flex items-center gap-1.5"
            >
              {isActive ? (
                <>
                  <X className="w-4 h-4" /> Pause Plan
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Resume Plan
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Calendar Day Preferences */}
        <div className="pt-6">
          <h4 className="text-sm font-semibold text-text-dark mb-4">Delivery Schedule</h4>
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
            {Object.keys(deliveryDays).map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`py-3 rounded-2xl border text-center font-semibold text-xs transition-all cursor-pointer ${
                  deliveryDays[day]
                    ? 'bg-primary text-text-light border-primary shadow-subtle'
                    : 'border-emerald-100 text-primary hover:bg-emerald-50'
                }`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Preferences Section */}
      <Card className="p-8 hover:translate-y-0" hoverable={false}>
        <h3 className="font-bold text-text-dark text-base pb-3 border-b border-emerald-50 mb-6">Meal Dietary Preferences</h3>
        
        <div className="flex flex-col gap-4 max-w-md">
          {[
            { key: 'spicy', label: 'Prefer less spices / green chilies' },
            { key: 'beef', label: 'Exclude Beef items from tiffins' },
            { key: 'mutton', label: 'Exclude Mutton items from tiffins' },
            { key: 'onions', label: 'No onion garnish' },
            { key: 'oil', label: 'Low cholesterol oil only' }
          ].map((pref) => (
            <label key={pref.key} className="flex items-center justify-between cursor-pointer py-1.5 border-b border-emerald-50/50 last:border-0">
              <span className="text-sm text-gray-700 font-medium">{pref.label}</span>
              <button 
                type="button"
                onClick={() => togglePreference(pref.key)}
                className="text-primary hover:scale-105 transition-all cursor-pointer"
              >
                {preferences[pref.key] ? (
                  <ToggleRight className="w-8 h-8 text-primary" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-300" />
                )}
              </button>
            </label>
          ))}

          <Button variant="primary" onClick={handleSavePref} className="w-fit mt-6 px-8">
            Save Preference Configurations
          </Button>
        </div>
      </Card>
    </div>
  )
}
