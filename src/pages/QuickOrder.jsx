import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ChefHat, ArrowLeft } from 'lucide-react'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { useToastStore } from '../store/toastStore'

// Zod Validation Schema for Order/Contact form
const orderSchema = z.object({
  fullName: z.string().min(3, { message: 'Full name must be at least 3 characters' }),
  phone: z.string().regex(/^((\+92)|(0092)|(03))\d{9}$/, {
    message: 'Please enter a valid Pakistan phone number (e.g., 03001234567)'
  }),
  address: z.string().min(10, { message: 'Address must be at least 10 characters long' }),
  mealSelection: z.string().min(1, { message: 'Please select a meal/plan' }),
  deliveryDate: z.string().min(1, { message: 'Please select a delivery date' }),
  notes: z.string().optional()
})

export default function QuickOrder() {
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      mealSelection: '',
      notes: ''
    }
  })

  const handleOrderSubmit = (data) => {
    addToast('Order Placed Successfully!', 'success')
    
    // Open WhatsApp pre-filled text
    const message = `Hi, I would like to place an order:\n\n*Name*: ${data.fullName}\n*Phone*: ${data.phone}\n*Plan*: ${data.mealSelection}\n*Date*: ${data.deliveryDate}\n*Address*: ${data.address}\n*Notes*: ${data.notes || 'None'}`
    window.open(`https://wa.me/923113840943?text=${encodeURIComponent(message)}`, '_blank')
    
    reset()
    // Go back to the homepage at the contact/order section
    navigate('/#contact')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow bg-[#F4F6F5] bg-gradient-to-tr from-accent/20 via-background to-emerald-50/30 py-12 px-6 flex items-center justify-center relative overflow-hidden">
        
        {/* Floating background blur spheres */}
        <div className="bg-primary/5 absolute top-10 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="bg-accent/15 absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl w-full relative z-10">
          {/* Back button */}
          <button
            onClick={() => navigate('/#contact')}
            className="flex items-center gap-2 text-primary font-bold text-sm mb-6 hover:text-emerald-700 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </button>

          {/* Form Card */}
          <div className="bg-white border border-emerald-100/60 p-8 rounded-[36px] shadow-card">
            <div className="flex items-center gap-2 mb-6">
              <ChefHat className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-primary">Delivery Information</h2>
                <p className="text-xs text-gray-400 mt-0.5">Please provide your delivery details to place the order.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleOrderSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Full Name</label>
                <Input
                  placeholder="e.g. Muzammil Afzal"
                  error={errors.fullName}
                  {...register('fullName')}
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

              <div className="md:col-span-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Delivery Address</label>
                <Input
                  placeholder="Full home or office address in Karachi"
                  error={errors.address}
                  {...register('address')}
                  className="rounded-2xl border-emerald-100/80 focus:border-primary focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Meal / Plan Selection</label>
                <Input
                  type="select"
                  error={errors.mealSelection}
                  {...register('mealSelection')}
                  className="rounded-2xl border-emerald-100/80 focus:border-primary focus:ring-2 focus:ring-accent/40"
                  options={[
                    { value: '', label: '-- Select Plan --' },
                    { value: 'One-Day Plan', label: 'One-Day Plan' },
                    { value: 'Weekly Subscription Plan', label: 'Weekly Subscription Plan' },
                    { value: 'Monthly Subscription Plan', label: 'Monthly Subscription Plan' }
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Delivery Start Date</label>
                <Input
                  type="date"
                  error={errors.deliveryDate}
                  {...register('deliveryDate')}
                  className="rounded-2xl border-emerald-100/80 focus:border-primary focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Special Notes (Optional)</label>
                <Input
                  type="textarea"
                  placeholder="Any dislikes, allergens, or directions to your door"
                  error={errors.notes}
                  {...register('notes')}
                  className="rounded-2xl border-emerald-100/80 focus:border-primary focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  className="w-full rounded-2xl py-3.5 mt-2 font-bold shadow-md hover:shadow-lg transition-all text-xs uppercase tracking-widest cursor-pointer"
                >
                  Order Now
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
