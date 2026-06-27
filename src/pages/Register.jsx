import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ChefHat } from 'lucide-react'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import api from '../services/api'
import AnimatedLogo from '../components/shared/AnimatedLogo'
import SEO from '../components/shared/SEO'

// Zod Registration Schema
const registerSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().regex(/^((\+92)|(0092)|(03))\d{9}$/, {
    message: 'Please enter a valid Pakistan mobile number (e.g. 03001234567)'
  }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
})

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { addToast } = useToastStore()

  const lastCheckoutEmail = localStorage.getItem('last_checkout_email') || ''
  const accounts = JSON.parse(localStorage.getItem('hometiffin_accounts')) || {}
  const guestInfo = accounts[lastCheckoutEmail.toLowerCase()] || {}

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: lastCheckoutEmail,
      name: guestInfo.name || '',
      phone: guestInfo.phone || '',
      password: ''
    }
  })

  const handleRegisterSubmit = async (data) => {
    try {
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password
      })
      
      const { user, token } = response.data
      login(user, token)
      addToast('Account created successfully!', 'success')
      navigate('/dashboard')
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Registration failed. Please try again.'
      addToast(errMsg, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F5] bg-gradient-to-tr from-accent/20 via-background to-emerald-50/30 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <SEO 
        title="Create an Account"
        description="Sign up for a Home Tiffin account to start ordering fresh home-cooked meals and subscribing weekly or monthly in Karachi."
        keywords="home tiffin register, create account tiffin karachi"
      />
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      {/* Floating background blur spheres */}
      <div className="bg-primary/5 absolute top-10 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse" />
      <div className="bg-accent/15 absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl" />
      <div className="bg-emerald-200/10 absolute top-1/2 left-1/3 w-80 h-80 rounded-full blur-3xl" />
      
      {/* ── MAIN GLASS CONTAINER ── */}
      <div className="bg-transparent md:bg-white/25 md:backdrop-blur-xl border border-transparent md:border-white/40 md:rounded-[32px] shadow-none md:shadow-2xl py-2 px-0 sm:p-8 md:p-10 max-w-5xl w-full flex flex-col md:flex-row items-center gap-8 md:gap-10 min-h-[580px] z-10">
        
        {/* ── LEFT SIDE: Image Panel (Desktop Only) ── */}
        <div className="hidden md:flex md:w-[54%] flex-col items-center justify-center relative select-none">
          {/* Decorative floating leaves */}
          <div className="absolute top-6 right-12 w-6 h-6 text-emerald-400 opacity-60 animate-bounce" style={{ animationDelay: '0.3s' }}>🍃</div>
          <div className="absolute bottom-12 left-8 w-8 h-8 text-emerald-300 opacity-55 animate-bounce" style={{ animationDelay: '1.1s' }}>🍃</div>
          <div className="absolute top-1/2 left-4 w-5 h-5 text-emerald-500 opacity-40 animate-pulse">🍃</div>
          <div className="absolute bottom-8 right-16 w-6 h-6 text-emerald-400 opacity-50 animate-pulse" style={{ animationDelay: '0.7s' }}>🍃</div>
          
          {/* Main 3D Food Illustration (floating) */}
          <img
            src="/tiffin_3d.png"
            alt="Premium Home Tiffin Meal"
            className="w-full max-w-[380px] object-contain drop-shadow-2xl animate-float"
          />
        </div>

        {/* ── RIGHT SIDE: Form Card (Embedded) ── */}
        <div className="w-full md:w-[46%] bg-transparent md:bg-white md:rounded-3xl p-2 md:p-8 shadow-none md:shadow-card flex flex-col gap-5 text-left border border-transparent md:border-emerald-50/50">
          {/* Logo Header */}
          <div className="flex items-center gap-1.5 text-primary text-xs font-black tracking-wider uppercase mb-1">
            <AnimatedLogo className="h-7" />
            <span>Home Tiffin</span>
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black text-primary tracking-tight">Register</h2>
          </div>

          <form onSubmit={handleSubmit(handleRegisterSubmit)} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Full Name</label>
              <Input
                placeholder="e.g. Muzammil Khan"
                error={errors.name}
                {...register('name')}
                className="rounded-2xl border-emerald-100/80 focus:border-primary focus:ring-2 focus:ring-accent/40"
              />
            </div>

            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Email Address</label>
              <Input
                placeholder="you@example.com"
                error={errors.email}
                {...register('email')}
                className="rounded-2xl border-emerald-100/80 focus:border-primary focus:ring-2 focus:ring-accent/40"
              />
            </div>

            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Phone Number</label>
              <Input
                placeholder="e.g. 03001234567"
                error={errors.phone}
                {...register('phone')}
                className="rounded-2xl border-emerald-100/80 focus:border-primary focus:ring-2 focus:ring-accent/40"
              />
            </div>

            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                error={errors.password}
                {...register('password')}
                className="rounded-2xl border-emerald-100/80 focus:border-primary focus:ring-2 focus:ring-accent/40"
              />
            </div>



            <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full py-3.5 mt-2 rounded-2xl font-bold bg-primary text-white hover:bg-primary-dark transition-all">
              Register Account
            </Button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-2 font-semibold">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-extrabold">
              Login here
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
