import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { User, Mail, Phone, Lock } from 'lucide-react'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'

// Zod Registration Schema
const registerSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().regex(/^((\+92)|(0092)|(03))\d{9}$/, {
    message: 'Please enter a valid Pakistan mobile number (e.g. 03001234567)'
  }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { addToast } = useToastStore()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema)
  })

  const handleRegisterSubmit = (data) => {
    // Simulated Registration & Auto-Login
    const mockUser = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      subscription: null
    }
    const mockToken = 'jwt_mock_registered_token_123'
    
    login(mockUser, mockToken)
    addToast('Account created successfully!', 'success')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 shadow-card border border-emerald-100">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-primary flex justify-center items-center gap-2 mb-2">
            🍱 Home Tiffin
          </Link>
          <h2 className="text-xl font-bold text-text-dark">Create Account</h2>
          <p className="text-xs text-gray-500 mt-1">Register to start tiffin meal plans in Karachi.</p>
        </div>

        <form onSubmit={handleSubmit(handleRegisterSubmit)} className="flex flex-col gap-4 text-left">
          <div className="relative">
            <User className="absolute left-3.5 top-[38px] w-4 h-4 text-gray-400" />
            <Input
              label="Full Name"
              placeholder="e.g. Muzammil Khan"
              error={errors.name}
              {...register('name')}
              className="pl-6"
            />
          </div>

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
            <Phone className="absolute left-3.5 top-[38px] w-4 h-4 text-gray-400" />
            <Input
              label="Phone Number"
              placeholder="e.g. 03001234567"
              error={errors.phone}
              {...register('phone')}
              className="pl-6"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-[38px] w-4 h-4 text-gray-400" />
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              error={errors.password}
              {...register('password')}
              className="pl-6"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-[38px] w-4 h-4 text-gray-400" />
            <Input
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              error={errors.confirmPassword}
              {...register('confirmPassword')}
              className="pl-6"
            />
          </div>

          <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full mt-4">
            Register Account
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Login here
          </Link>
        </p>
      </Card>
    </div>
  )
}
