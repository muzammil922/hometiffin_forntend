import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, ChefHat } from 'lucide-react'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import api from '../services/api'
import AnimatedLogo from '../components/shared/AnimatedLogo'
import SEO from '../components/shared/SEO'

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
})

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const { addToast } = useToastStore()

  const [showPassword, setShowPassword] = useState(false)
  const [isOtpFlow, setIsOtpFlow] = useState(false)
  const [otpStep, setOtpStep] = useState(1) // 1: Send OTP, 2: Verify OTP
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resendingOtp, setResendingOtp] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const lastCheckoutEmail = localStorage.getItem('last_checkout_email') || ''

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: lastCheckoutEmail,
      password: ''
    }
  })

  const handleEmailLogin = async (data) => {
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password
      })
      
      const { user, token } = response.data
      login(user, token)
      addToast('Logged in successfully!', 'success')
      navigate(from, { replace: true })
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Login failed. Please check your credentials.'
      addToast(errMsg, 'error')
    }
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!/^((\+92)|(0092)|(03))\d{9}$/.test(phoneNumber)) {
      addToast('Please enter a valid Pakistan mobile number', 'warning')
      return
    }
    
    try {
      setSendingOtp(true)
      const res = await api.post('/auth/send-otp', { phone: phoneNumber })
      addToast(res.data.message || 'OTP Sent successfully!', 'success')
      setOtpStep(2)
    } catch (err) {
      console.error(err)
      const errMsg = err.response?.data?.error || 'Failed to send OTP. Please try again.'
      addToast(errMsg, 'error')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendingOtp) return
    try {
      setResendingOtp(true)
      const res = await api.post('/auth/send-otp', { phone: phoneNumber })
      addToast(res.data.message || 'OTP Resent successfully!', 'success')
    } catch (err) {
      console.error(err)
      const errMsg = err.response?.data?.error || 'Failed to resend OTP.'
      addToast(errMsg, 'error')
    } finally {
      setResendingOtp(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otpCode.length !== 6) {
      addToast('Please enter a valid 6-digit OTP code', 'warning')
      return
    }
    if (verifyingOtp) return
    
    try {
      setVerifyingOtp(true)
      const response = await api.post('/auth/otp-login', {
        phone: phoneNumber,
        otpCode: otpCode
      })
      const { user, token } = response.data
      login(user, token)
      addToast('Phone authenticated successfully!', 'success')
      navigate(from, { replace: true })
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Phone authentication failed.'
      addToast(errMsg, 'error')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const response = await api.post('/auth/google', {
        email: 'google.user@gmail.com',
        name: 'Google Auth User',
        token: 'google_oauth_token_abcde'
      })
      
      const { user, token } = response.data
      login(user, token)
      addToast('Connected with Google!', 'success')
      navigate(from, { replace: true })
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Google login failed.'
      addToast(errMsg, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F5] bg-gradient-to-tr from-accent/20 via-background to-emerald-50/30 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <SEO 
        title="Login to Your Account"
        description="Log in to your Home Tiffin account to manage your daily meal subscriptions, track your rider, and see order histories."
        keywords="home tiffin login, sign in tiffin karachi"
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
            <h2 className="text-3xl font-black text-primary tracking-tight">Login</h2>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-gray-50 border border-emerald-100 p-1 rounded-2xl mb-1">
            <button
              type="button"
              onClick={() => setIsOtpFlow(false)}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                !isOtpFlow ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-primary'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setIsOtpFlow(true)}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                isOtpFlow ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-primary'
              }`}
            >
              Phone OTP
            </button>
          </div>

          {/* Forms */}
          {!isOtpFlow ? (
            /* Email Password Flow */
            <form onSubmit={handleSubmit(handleEmailLogin)} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Email Address</label>
                <Input
                  placeholder="usernamew@gmail.com"
                  error={errors.email}
                  {...register('email')}
                  className="rounded-2xl border-emerald-100/80 focus:border-primary focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <div className="relative">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Password</label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  error={errors.password}
                  {...register('password')}
                  className="rounded-2xl border-emerald-100/80 focus:border-primary focus:ring-2 focus:ring-accent/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[38px] text-gray-400 hover:text-text-dark cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-end text-xs mt-1">
                <a href="#" className="text-primary hover:underline font-extrabold">Forgot Password?</a>
              </div>

              <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full py-3.5 mt-2 rounded-2xl font-bold bg-primary text-white hover:bg-primary-dark transition-all">
                Sign in
              </Button>
            </form>
          ) : (
            /* Phone OTP Flow */
            <div className="flex flex-col gap-4">
              {otpStep === 1 ? (
                <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Mobile Number</label>
                    <Input
                      placeholder="e.g. 03001234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="rounded-2xl border-emerald-100/80 focus:border-primary focus:ring-2 focus:ring-accent/40"
                    />
                  </div>
                   <Button type="submit" variant="primary" isLoading={sendingOtp} className="w-full py-3.5 mt-2 rounded-2xl font-bold">
                    Send 6-Digit OTP
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Enter Verification Code</label>
                    <Input
                      placeholder="e.g. 123456"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="rounded-2xl border-emerald-100/80 focus:border-primary focus:ring-2 focus:ring-accent/40"
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1 font-bold">
                    <button type="button" onClick={() => setOtpStep(1)} className="text-primary hover:underline">
                      Change Number
                    </button>
                    <button type="button" onClick={handleResendOtp} className="text-primary hover:underline cursor-pointer">
                      Resend Code
                    </button>
                  </div>
                  <Button type="submit" variant="primary" isLoading={verifyingOtp} className="w-full py-3.5 mt-2 rounded-2xl font-bold">
                    Verify & Log In
                  </Button>
                </form>
              )}
            </div>
          )}

          <p className="text-center text-xs text-gray-500 mt-2 font-semibold">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-extrabold">
              Register here
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
