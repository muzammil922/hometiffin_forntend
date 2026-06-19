import React, { useState } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useToastStore } from '../../store/toastStore'
import { UserPlus, Shield, User, ShieldCheck } from 'lucide-react'

export default function RiderRegistry() {
  const { addToast } = useToastStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('rider') // 'rider' or 'management'
  const [allowedPages, setAllowedPages] = useState([])
  const [loading, setLoading] = useState(false)

  const AVAILABLE_PAGES = [
    'Overview',
    'Manage Orders',
    'Manage Subscriptions',
    'Manage Users',
    'Manage Meals',
    'Payments Verification',
    'Message Templates',
    'Evolution WhatsApp',
  ]

  const handleTogglePage = (page) => {
    if (allowedPages.includes(page)) {
      setAllowedPages(allowedPages.filter((p) => p !== page))
    } else {
      setAllowedPages([...allowedPages, page])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !phone || !password) {
      addToast('All fields are required.', 'warning')
      return
    }

    if (role === 'management' && allowedPages.length === 0) {
      addToast('Please select at least one permission page.', 'warning')
      return
    }

    try {
      setLoading(true)
      const res = await api.post('/admin/riders', {
        name,
        email,
        phone,
        password,
        role,
        allowedPages: role === 'management' ? allowedPages : [],
      })

      addToast(
        `${role === 'management' ? 'Management sub-admin' : 'Rider'} "${res.data.name}" registered successfully!`,
        'success'
      )
      
      // Reset form
      setName('')
      setEmail('')
      setPhone('')
      setPassword('')
      setRole('rider')
      setAllowedPages([])
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to register account.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 text-left w-full max-w-xl">
      <div>
        <h1 className="text-3xl font-black text-primary tracking-tight">Account registry</h1>
        <p className="text-sm text-gray-500">
          Create new logins for drivers or dashboard management users with customized access control.
        </p>
      </div>

      <Card className="p-6 sm:p-8 bg-white border border-emerald-100 shadow-sm" hoverable={false}>
        <div className="flex items-center gap-2 text-primary font-bold mb-6">
          <UserPlus className="w-5 h-5" />
          <span>New Account Registration</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Account Type dropdown */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-bold uppercase tracking-wider text-primary/85">Account Type</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-emerald-100 bg-white text-sm font-semibold text-text-dark shadow-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              <option value="rider">Rider (Driver Mobile App)</option>
              <option value="management">Management (Dashboard Sub-Admin)</option>
            </select>
          </div>

          <Input
            label="Full Name"
            placeholder="e.g. Shahrukh Khan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. user.name@hometiffin.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Phone Number"
            placeholder="e.g. 03123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Input
            label="Default Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Conditional Multi-Select for Management role */}
          {role === 'management' && (
            <div className="flex flex-col gap-3 border-t border-emerald-50 pt-5 mt-2">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Dashboard Permissions</span>
              </div>
              <p className="text-xs text-gray-500 -mt-1.5">
                Grant custom access to sub-admin pages:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {AVAILABLE_PAGES.map((page) => {
                  const isChecked = allowedPages.includes(page)
                  return (
                    <label
                      key={page}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all cursor-pointer text-sm font-semibold select-none ${
                        isChecked
                          ? 'bg-primary/5 border-primary text-primary shadow-sm'
                          : 'bg-white border-emerald-100 hover:bg-emerald-50/20 text-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePage(page)}
                        className="w-4.5 h-4.5 rounded border-emerald-200 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                      />
                      <span>{page}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            className="w-full py-3.5 mt-2 rounded-2xl font-bold bg-primary text-white hover:bg-primary-dark transition-all"
          >
            Register {role === 'management' ? 'Management Account' : 'Rider Account'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
