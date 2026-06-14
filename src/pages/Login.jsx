import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Mail, Phone, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'

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

  const from = location.state?.from?.pathname || '/dashboard'

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  })

  const handleEmailLogin = (data) => {
    // Simulated token login
    const mockUser = {
      name: data.email.split('@')[0].toUpperCase(),
      email: data.email,
      phone: '03000000000',
      subscription: { plan: 'Weekly Plan', status: 'Active', renewal: '2026-06-21' }
    }
    const mockToken = 'jwt_mock_token_12345'
    
    login(mockUser, mockToken)
    addToast('Logged in successfully!', 'success')
    navigate(from, { replace: true })
  }

  const handleSendOtp = (e) => {
    e.preventDefault()
    if (!/^((\+92)|(0092)|(03))\d{9}$/.test(phoneNumber)) {
      addToast('Please enter a valid Pakistan mobile number', 'warning')
      return
    }
    addToast('OTP Sent successfully to ' + phoneNumber, 'success')
    setOtpStep(2)
  }

  const handleVerifyOtp = (e) => {
    e.preventDefault()
    if (otpCode.length !== 6) {
      addToast('Please enter a valid 6-digit OTP code', 'warning')
      return
    }
    
    const mockUser = {
      name: 'KARACHI USER',
      email: 'user@hometiffin.pk',
      phone: phoneNumber,
      subscription: { plan: 'Monthly Plan', status: 'Active', renewal: '2026-07-14' }
    }
    const mockToken = 'jwt_mock_token_54321'
    
    login(mockUser, mockToken)
    addToast('Phone authenticated successfully!', 'success')
    navigate(from, { replace: true })
  }

  const handleGoogleLogin = () => {
    const mockUser = {
      name: 'Google Auth User',
      email: 'google.user@gmail.com',
      phone: '03112223334',
      subscription: null
    }
    const mockToken = 'google_oauth_token_abcde'
    
    login(mockUser, mockToken)
    addToast('Connected with Google!', 'success')
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 shadow-card border border-emerald-100">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-primary flex justify-center items-center gap-2 mb-2">
            🍱 Home Tiffin
          </Link>
          <h2 className="text-xl font-bold text-text-dark">Welcome Back</h2>
          <p className="text-xs text-gray-500 mt-1">Please authenticate to manage tiffin subscriptions.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-background p-1 rounded-xl border border-emerald-50 mb-6">
          <button
            onClick={() => setIsOtpFlow(false)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !isOtpFlow ? 'bg-primary text-text-light' : 'text-primary/75'
            }`}
          >
            Email Login
          </button>
          <button
            onClick={() => setIsOtpFlow(true)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isOtpFlow ? 'bg-primary text-text-light' : 'text-primary/75'
            }`}
          >
            Phone (OTP)
          </button>
        </div>

        {/* Email & Password Flow */}
        {!isOtpFlow ? (
          <form onSubmit={handleSubmit(handleEmailLogin)} className="flex flex-col gap-5 text-left">
            <div className="relative">
              <Mail className="absolute left-3.5 top-[38px] w-4 h-4 text-gray-400" />
              <Input
                label="Email Address"
                placeholder="you@example.com"
                error={errors.email}
                {...register('email')}
                className="pl-6"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-[38px] w-4 h-4 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                error={errors.password}
                {...register('password')}
                className="pl-6"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-10 text-gray-400 hover:text-text-dark cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs mt-1">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input type="checkbox" className="w-4 h-4 text-primary border-emerald-100 rounded focus:ring-primary" />
                <span>Remember me</span>
              </label>
              <a href="#" className="font-semibold text-primary hover:text-primary-dark">Forgot Password?</a>
            </div>

            <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full mt-2">
              Login to Account
            </Button>
          </form>
        ) : (
          /* Phone OTP Flow */
          <div className="text-left">
            {otpStep === 1 ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-[38px] w-4 h-4 text-gray-400" />
                  <Input
                    label="Mobile Number"
                    placeholder="e.g. 03001234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-6"
                  />
                </div>
                <Button type="submit" variant="primary" className="w-full mt-2">
                  Send 6-Digit OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-[38px] w-4 h-4 text-gray-400" />
                  <Input
                    label="Enter OTP Verification Code"
                    placeholder="e.g. 123456"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="pl-6"
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <button type="button" onClick={() => setOtpStep(1)} className="text-primary font-semibold hover:underline">
                    Change Phone Number
                  </button>
                  <button type="button" onClick={() => addToast('OTP Resent!', 'info')} className="text-primary font-semibold hover:underline">
                    Resend Code
                  </button>
                </div>
                <Button type="submit" variant="primary" className="w-full mt-2">
                  Verify & Log In
                </Button>
              </form>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="relative my-8 text-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-emerald-50" />
          </div>
          <span className="relative bg-white px-4 text-xs text-gray-400 uppercase">Or continue with</span>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 border border-emerald-100 bg-white rounded-2xl hover:bg-emerald-50/50 cursor-pointer transition-all duration-200 text-sm font-semibold text-gray-700"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.555 0-6.437-2.883-6.437-6.438s2.882-6.437 6.437-6.437c1.554 0 2.98.552 4.1 1.488l3.076-3.078C18.995 1.954 15.82 1 12.24 1 5.86 1 .687 6.172.687 12.553S5.86 24 12.24 24c5.783 0 10.748-4.143 10.748-11.455 0-.74-.085-1.464-.24-2.16H12.24z"
            />
          </svg>
          Google Account
        </button>

        <p className="text-center text-xs text-gray-500 mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register here
          </Link>
        </p>
      </Card>
    </div>
  )
}
