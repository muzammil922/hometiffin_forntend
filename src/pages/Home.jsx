import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Phone, ArrowRight, Check, Star, MapPin, BookOpen, ChefHat, Bike, Heart, Sliders, ShieldCheck, Calendar, Truck } from 'lucide-react'

import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import PWAInstallBanner from '../components/shared/PWAInstallBanner'
import { useCartStore } from '../store/cartStore'
import { useToastStore } from '../store/toastStore'
import { useReviewStore } from '../store/reviewStore'

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

const MOCK_MEALS = [
  {
    id: 'm1',
    name: 'Karachi Beef Biryani',
    category: 'Lunch',
    price: 320,
    description: 'Fragrant basmati rice layered with spicy, tender beef, potatoes, and aromatic herbs.',
    image: '/cutout_biryani.png',
    tags: ['Spicy', 'Basmati', 'Beef']
  },
  {
    id: 'm2',
    name: 'Desi Chicken Karahi',
    category: 'Dinner',
    price: 350,
    description: 'Stir-fried chicken in a rich wok-based tomato, green chili, and ginger gravy. Served with 2 Roti.',
    image: '/cutout_karahi.png',
    tags: ['Wok Cooked', 'Fresh Gravy', 'Serves 2']
  },
  {
    id: 'm3',
    name: 'Spicy Tiffin Burger',
    category: 'Lunch',
    price: 290,
    description: 'Juicy flame-grilled beef patty layered with melted cheddar cheese, fresh lettuce, tomatoes, and spicy home tiffin special burger sauce.',
    image: '/cutout_burger.png',
    tags: ['Flame Grilled', 'Cheesy', 'Beef']
  },
  {
    id: 'm4',
    name: 'Diet Special Steamed Daal Chawal',
    category: 'Lunch',
    price: 220,
    description: 'Lightly spiced brown lentils served with steamed long-grain basmati rice and fresh kachumar salad.',
    image: '/cutout_biryani.png',
    tags: ['Diet', 'Steamed', 'Light']
  }
]

export default function Home() {
  const navigate = useNavigate()
  const { addItem } = useCartStore()
  const { addToast } = useToastStore()

  // Customization modal states
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [portionSize, setPortionSize] = useState('Medium')
  const [addOns, setAddOns] = useState({ extraRoti: false, raita: false, dessert: false })
  const [customNotes, setCustomNotes] = useState('')

  // Pricing toggles
  const [isSubscription, setIsSubscription] = useState(false)
  const [activeTab, setActiveTab] = useState('All')

  // Testimonials Zustand Store hook
  const { testimonials, addReview } = useReviewStore()

  // Review modal states
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [reviewName, setReviewName] = useState('')
  const [reviewArea, setReviewArea] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewRole, setReviewRole] = useState('Weekly Subscriber')
  const [reviewOrders, setReviewOrders] = useState(1)

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (!reviewName.trim() || !reviewText.trim()) return

    const newReview = {
      name: reviewName.trim(),
      area: reviewArea.trim() || 'Karachi',
      role: reviewRole,
      orders: parseInt(reviewOrders) || 1,
      review: reviewText.trim(),
      rating: reviewRating
    }

    addReview(newReview)
    setIsReviewOpen(false)

    // Reset Form
    setReviewName('')
    setReviewArea('')
    setReviewText('')
    setReviewRating(5)
    setReviewRole('Weekly Subscriber')
    setReviewOrders(1)
  }

  // Form setup
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      mealSelection: '',
      notes: ''
    }
  })

  const handleCustomizeClick = (meal) => {
    setSelectedMeal(meal)
    setPortionSize('Medium')
    setAddOns({ extraRoti: false, raita: false, dessert: false })
    setCustomNotes('')
    setIsCustomizeOpen(true)
  }

  const handleAddCustomizedToCart = () => {
    addItem(selectedMeal, { portionSize, addOns, notes: customNotes })
    addToast(`${selectedMeal.name} added to cart!`, 'success')
    setIsCustomizeOpen(false)
  }

  const handleQuickAdd = (meal) => {
    addItem(meal)
    addToast(`${meal.name} added to cart!`, 'success')
  }

  const handleOrderSubmit = (data) => {
    // Post Order logic simulation
    addToast('Order Placed Successfully!', 'success')
    reset()
    // Open WhatsApp pre-filled text
    const message = `Hi, I would like to place an order:\n\n*Name*: ${data.fullName}\n*Phone*: ${data.phone}\n*Plan*: ${data.mealSelection}\n*Date*: ${data.deliveryDate}\n*Address*: ${data.address}\n*Notes*: ${data.notes || 'None'}`
    window.open(`https://wa.me/923000000000?text=${encodeURIComponent(message)}`, '_blank')
  }

  const filteredMeals = activeTab === 'All'
    ? MOCK_MEALS
    : MOCK_MEALS.filter(m => m.category === activeTab || (activeTab === 'Weekly Plan' && m.id === 'm1'))

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* PWA banner floating top */}
      <div className="max-w-7xl mx-auto px-6 mt-4">
        <PWAInstallBanner />
      </div>

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center bg-background py-12 md:py-20 px-6 overflow-hidden">

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 text-left flex flex-col gap-6">
            {/* Top Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/35 text-text-dark text-xs font-semibold tracking-wide w-fit border border-emerald-200/50"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Karachi's Premium Tiffin Service
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold leading-tight tracking-tight text-text-dark"
            >
              Fresh Home-Cooked<br />
              Meals,<br />
              Delivered Daily
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm md:text-base text-gray-650 leading-relaxed max-w-xl"
            >
              Subscribe to your customisable tiffin plan or order single meals from anywhere in Karachi. Prepared with love by local home chefs, packed hygienically.
            </motion.p>

            {/* Three check items below paragraph */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-6 mt-2"
            >
              {[
                '100% Hygienic',
                'Home Taste',
                'Free Delivery'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-text-dark">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-accent text-primary">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-4 mt-2"
            >
              <Button
                variant="secondary"
                onClick={() => window.open('https://wa.me/923000000000?text=Hi!%20I%20want%20to%20order%20some%20delicious%20tiffin%20meals.', '_blank')}
                className="flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Order on WhatsApp
              </Button>
              <a href="#pricing" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto justify-center border-primary/20 hover:border-primary">
                  Explore Weekly Plans
                </Button>
              </a>
            </motion.div>

            {/* Stacked avatars and description below buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center gap-3 mt-4"
            >
              <div className="flex -space-x-2">
                {[
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100',
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100'
                ].map((avatar, idx) => (
                  <img
                    key={idx}
                    src={avatar}
                    alt="Karachi professional avatar"
                    className="w-7 h-7 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 font-semibold">Join 500+ professionals who trust us daily</p>
            </motion.div>
          </div>

          {/* Right Column: Exact image display matching layout */}
          <div className="lg:col-span-5 relative flex justify-center items-center mt-12 lg:mt-0">
            {/* Background shape */}
            <div className="absolute w-[300px] h-[300px] bg-accent/25 rounded-full -z-10 blur-xl" />

            {/* Main Larger Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="w-[280px] sm:w-[350px] h-[280px] sm:h-[350px] rounded-[32px] overflow-hidden shadow-2xl relative bg-white rotate-2 z-10"
            >
              <img
                src="/hero_main_dish.png"
                alt="Karachi premium home tiffin food"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Smaller Overlapping Card on bottom-left */}
            <motion.div
              initial={{ opacity: 0, x: -30, y: 30 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute w-[130px] sm:w-[170px] h-[130px] sm:h-[170px] rounded-[28px] overflow-hidden shadow-2xl left-2 sm:-left-10 -bottom-8 -rotate-6 z-20 bg-slate-900"
            >
              <img
                src="/hero_sub_thali.png"
                alt="Traditional South Asian thali platter"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Top Right Floating Badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 right-4 sm:-right-4 bg-white/90 backdrop-blur border border-emerald-50 px-4 py-2 rounded-2xl shadow-card flex items-center gap-2 z-30"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-text-dark">🛵 Delivering in Karachi</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="py-20 px-6 max-w-7xl mx-auto text-center relative overflow-hidden">
        <h2 className="text-4xl font-bold mb-4 text-primary">How It Works</h2>
        <p className="text-gray-500 max-w-xl mx-auto mb-16 text-sm md:text-base">
          Get healthy, hygienically prepared home-cooked meals delivered straight to your door in Karachi.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 relative z-10">
          {/* Connecting Dotted Line - Desktop */}
          <div className="absolute top-[55%] left-[12%] right-[12%] h-0.5 border-t-2 border-dashed border-primary/20 z-0 hidden md:block" />

          {/* Connecting Dotted Line - Mobile */}
          <div className="absolute left-1/2 top-12 bottom-12 w-0.5 border-l-2 border-dashed border-primary/20 -translate-x-1/2 z-0 md:hidden" />

          {[
            {
              num: '01',
              title: 'Choose Plan',
              desc: 'Select from our variety of daily, weekly, or monthly subscription plans.',
              icon: BookOpen,
              isBig: true
            },
            {
              num: '02',
              title: 'Set Location',
              desc: 'Specify your office or residential address within Karachi delivery zones.',
              icon: MapPin,
              isBig: false
            },
            {
              num: '03',
              title: 'We Cook Fresh',
              desc: 'Our expert home chefs cook fresh meals daily with extreme hygiene.',
              icon: ChefHat,
              isBig: true
            },
            {
              num: '04',
              title: 'Live Track Delivery',
              desc: 'Real-time updates as our riders deliver your hot meals.',
              icon: Bike,
              isBig: false
            }
          ].map((step) => {
            const IconComponent = step.icon
            return (
              <div key={step.num} className="relative group flex flex-col items-center pt-8">
                {/* Large Background Number - moves on top on hover */}
                <span className={`absolute right-6 text-[95px] font-extrabold text-[#065f46]/[0.12] group-hover:text-primary/30 group-hover:z-20 transition-all duration-300 select-none font-sans z-0 pointer-events-none leading-none ${step.isBig ? 'top-[-36px]' : 'top-[-12px]'
                  }`}>
                  {step.num}
                </span>

                {/* Card Container */}
                <div className={`relative w-full bg-white px-6 py-10 rounded-[32px] border border-emerald-100/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center gap-5 z-10 ${step.isBig
                  ? 'md:-mt-4 shadow-lg ring-1 ring-primary/5'
                  : 'md:mt-4'
                  }`}>
                  {/* Soft Green Icon Badge */}
                  <div className="w-12 h-12 rounded-2xl bg-accent/35 text-primary flex items-center justify-center shadow-sm">
                    <IconComponent className="w-6 h-6 stroke-[2]" />
                  </div>

                  <h3 className="text-lg font-bold text-text-dark">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. MENU / MEAL PLANS */}
      <section id="menu" className="py-20 px-6 bg-white border-t border-b border-emerald-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div className="text-left">
              <h2 className="text-3xl font-bold text-primary mb-2">Our Culinary Highlights</h2>
              <p className="text-gray-500">Delicious home-cooked specials prepared with love and hygiene.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-background p-1.5 rounded-2xl border border-emerald-100">
              {['All', 'Breakfast', 'Lunch', 'Dinner', 'Weekly Plan'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-all ${activeTab === tab ? 'bg-primary text-text-light shadow-subtle' : 'text-primary/75 hover:bg-emerald-50'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-14">
            {filteredMeals.map((meal) => (
              <Card key={meal.id} className="relative flex flex-col h-full text-left justify-between mt-12 pt-16 p-6 bg-white rounded-3xl border border-emerald-100/50 shadow-md hover:shadow-lg transition-all duration-300">
                {/* Floating Centered Food Image - Larger, borderless, transparent blend */}
                <img
                  src={meal.image || '/cutout_biryani.png'}
                  alt={meal.name}
                  className="absolute -top-16 left-1/2 -translate-x-1/2 w-28 h-28 md:w-32 md:h-32 object-contain mix-blend-multiply z-20 pointer-events-none"
                />

                <div>
                  {/* Top Row: Category Badge & Customize Icon on Top Right */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-accent/25 text-primary px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wider uppercase">
                      {meal.category}
                    </span>
                    <button
                      onClick={() => handleCustomizeClick(meal)}
                      className="p-1.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-accent/20 hover:text-primary transition-all border border-gray-100 shadow-sm cursor-pointer"
                      title="Customize portion & addons"
                    >
                      <Sliders className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Meal Title */}
                  <h3 className="text-lg font-bold text-text-dark mb-1 leading-snug">{meal.name}</h3>

                  {/* Tags Row - using website background color for pills */}
                  <div className="flex flex-wrap gap-1.5 mt-3.5 mb-3">
                    {(meal.tags || ['Homestyle', 'Fresh', 'Popular']).map((tag) => (
                      <span key={tag} className="bg-background text-primary border border-emerald-200/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Description with See More */}
                  <p className="text-xs text-gray-500 leading-relaxed mb-1.5">
                    {meal.description}{' '}
                    <span className="text-primary font-bold hover:underline cursor-pointer">See more</span>
                  </p>
                </div>

                {/* Footer Row: Price, Add to Cart button */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-emerald-50">
                  <div className="text-left">
                    <span className="text-xs font-semibold text-gray-400 block leading-none mb-1">Price</span>
                    <span className="text-lg font-extrabold text-text-dark">Rs. {meal.price}</span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleQuickAdd(meal)}
                    className="rounded-xl px-6 py-2.5 font-bold text-sm shadow-md hover:shadow-lg transition-all"
                  >
                    Add to Cart
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SUBSCRIPTION PRICING */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-2 text-primary">Tiffin Programs</h2>
        <p className="text-gray-500 mb-10">Save more by subscribing to our long-term healthy meal packages.</p>

        {/* Toggle Subscription */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-semibold ${!isSubscription ? 'text-primary' : 'text-gray-400'}`}>One-time Order</span>
          <button
            onClick={() => setIsSubscription(!isSubscription)}
            className="w-14 h-8 bg-emerald-200 rounded-full p-1 transition-all cursor-pointer relative"
          >
            <div className={`w-6 h-6 bg-primary rounded-full transition-all ${isSubscription ? 'translate-x-6' : ''}`} />
          </button>
          <span className={`text-sm font-semibold ${isSubscription ? 'text-primary' : 'text-gray-400'}`}>Subscription Plan</span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Daily Tiffin', price: isSubscription ? '250 / day' : '280 / meal', desc: 'Single tiffin box delivered hot at your workplace or residency.', features: ['1 Choice of Main dish', '2 handmade fresh rotis', 'Salad & Raita included', 'Cancel/pause anytime'] },
            { title: 'Weekly Tiffin Plan', price: isSubscription ? '1,600 / week' : '1,800 / plan', desc: 'Six days of healthy home tiffins from Monday to Saturday.', recommended: true, features: ['6 tiffins per week', 'Weekly varying menu list', 'Special dessert on Saturdays', 'Pause/Resume anytime'] },
            { title: 'Monthly Tiffin Plan', price: isSubscription ? '6,200 / month' : '7,000 / plan', desc: 'Premium monthly corporate tiffin meal plan package.', features: ['24 fresh tiffin packages', 'Customize portion size daily', 'Zero delivery fee', 'Premium customer portal access'] }
          ].map((plan) => (
            <Card
              key={plan.title}
              className={`flex flex-col text-left h-full justify-between relative overflow-hidden ${plan.recommended ? 'border-primary ring-2 ring-primary/25 bg-emerald-50/20' : ''
                }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-primary text-text-light text-[10px] font-bold tracking-widest uppercase py-1 px-4 rounded-bl-2xl">
                  Best Value
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-text-dark mb-2">{plan.title}</h3>
                <p className="text-xs text-gray-500 mb-6">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-primary">PKR {plan.price}</span>
                </div>
                <ul className="flex flex-col gap-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button variant={plan.recommended ? 'primary' : 'outline'} className="w-full mt-8" onClick={() => navigate('/menu')}>
                Get Started
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="py-24 px-6 bg-gradient-to-b from-white to-background/30 border-t border-b border-emerald-50 text-center relative overflow-hidden">
        {/* Soft Background Decorative Blur Circles */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-80 h-80 rounded-full bg-emerald-50 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <span className="text-xs font-extrabold text-primary uppercase tracking-widest bg-accent/35 px-4 py-1.5 rounded-full mb-4 inline-block">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-3">
            What Our Customers Say
          </h2>
          <p className="text-sm text-gray-500 max-w-xl mx-auto mb-6 leading-relaxed">
            Discover how we deliver the warmth of home-cooked meals to students, busy professionals, and families across Karachi.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReviewOpen(true)}
            className="mb-14 border-primary text-primary hover:bg-primary hover:text-text-light rounded-xl px-5 py-2 font-bold text-xs cursor-pointer transition-all"
          >
            Write a Review
          </Button>

          <div className="flex gap-6 overflow-x-auto snap-x pb-6 text-left scrollbar-none w-full scroll-smooth">
            {testimonials.slice(0, 10).map((test, index) => (
              <motion.div
                key={test.name + index}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative flex-none w-[300px] md:w-[350px] bg-white border border-emerald-100/50 p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden snap-center"
              >
                {/* Large Background Quote Symbol */}
                <div className="absolute right-6 top-6 text-accent/15 font-serif text-8xl select-none pointer-events-none font-bold">
                  “
                </div>

                <div className="relative z-10">
                  {/* Stars Row - Real Rating Star Feeling */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4.5 h-4.5 ${i < (test.rating || 5)
                          ? 'fill-amber-400 text-amber-500 stroke-[1.5]'
                          : 'fill-gray-100 text-gray-300 stroke-[1]'
                          }`}
                      />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className="text-sm text-gray-600 italic leading-relaxed mb-6">
                    "{test.review}"
                  </p>
                </div>

                {/* Profile Section (Without initials avatar, order count at left bottom) */}
                <div className="flex items-center gap-3.5 pt-5 border-t border-emerald-50/80 relative z-10">
                  <div className="text-left w-full flex flex-col gap-1">
                    <h4 className="text-sm font-extrabold text-text-dark flex items-center gap-1.5">
                      <span>{test.name}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Verified Customer" />
                    </h4>
                    <span className="text-[10px] text-gray-400 font-bold block">{test.area} • {test.role}</span>

                    {/* Order count badge at left bottom */}
                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/60 shadow-sm uppercase tracking-wide w-fit mt-1">
                      {test.orders} {test.orders === 1 ? 'Order' : 'Orders'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* See More card if reviews exceed 10 */}
            {testimonials.length > 10 && (
              <div
                onClick={() => navigate('/reviews')}
                className="flex-none w-[300px] md:w-[350px] bg-background/50 border-2 border-dashed border-emerald-200/60 p-8 rounded-[32px] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-background/80 hover:border-primary transition-all duration-300 snap-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <ArrowRight className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="font-extrabold text-primary text-base">View All Reviews</h4>
                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                  + {testimonials.length - 10} More Feedback
                </p>
              </div>
            )}
          </div>

          {/* See More Reviews Button at the Bottom */}
          <div className="mt-10 flex justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/reviews')}
              className="border-primary text-primary hover:bg-primary hover:text-text-light rounded-xl px-7 py-2.5 font-bold text-xs cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
            >
              See More Reviews ({testimonials.length})
            </Button>
          </div>
        </div>
      </section>

      {/* 6. ABOUT US */}
      <section id="about" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          {/* Left Column: Story & Info */}
          <div className="lg:col-span-7 text-left flex flex-col gap-6">
            <div>
              <span className="text-xs font-extrabold text-primary uppercase tracking-widest bg-accent/35 px-4 py-1.5 rounded-full mb-3 inline-block">
                Our Story
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-primary leading-tight mt-1">
                Bringing Mother's Cooking <br />
                <span className="text-emerald-700">Directly to Your Table</span>
              </h2>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              In the hustle and bustle of Karachi, finding clean, hygienic, and authentic home-cooked meals can be a challenge. At Home Tiffin, we bridge the gap by connecting talented local home-chefs directly to students, working professionals, and busy families. Every dish is prepared in a clean, domestic kitchen with fresh ingredients, absolute hygiene, and the warmth of a mother’s touch.
            </p>

            {/* Core Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              {[
                {
                  icon: ChefHat,
                  title: "100+ Home Chefs",
                  desc: "Talented local home-chefs preparing authentic regional recipes."
                },
                {
                  icon: ShieldCheck,
                  title: "Strict Hygiene Checks",
                  desc: "Regular kitchen quality audit reviews and clean packaging."
                },
                {
                  icon: Calendar,
                  title: "Flexible Subscriptions",
                  desc: "Pause, skip, or customize your meals easily anytime."
                },
                {
                  icon: Truck,
                  title: "Hot Thermal Transit",
                  desc: "Insulated logistics keeping your meals fresh & hot."
                }
              ].map((pillar, index) => {
                const PillarIcon = pillar.icon;
                return (
                  <motion.div
                    key={index}
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-emerald-100/30 hover:border-emerald-100 shadow-subtle hover:shadow-md transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/30 text-primary flex items-center justify-center shrink-0">
                      <PillarIcon className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-dark text-sm">{pillar.title}</h4>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{pillar.desc}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Layered Collage Image */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Background decorative blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative w-full max-w-[420px] aspect-[4/5] rounded-[36px] overflow-hidden shadow-card border border-emerald-100 bg-gray-100 z-10"
            >
              <img
                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800"
                alt="Karachi Home Kitchen preparation"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />

              {/* Floating Badges */}
              <div className="absolute -top-1 -right-1 bg-primary text-text-light px-4 py-2 rounded-bl-[20px] rounded-tr-[35px] shadow-md border-b border-l border-primary-dark font-extrabold text-[10px] uppercase tracking-widest">
                100% Homemade
              </div>

              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md px-5 py-4 rounded-2xl shadow-lg border border-emerald-100/50 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-emerald-500 text-text-light flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  ★
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-extrabold text-gray-400 block uppercase tracking-wider">Hygienic standard</span>
                  <span className="text-xs font-extrabold text-text-dark">10,000+ Meals Served in Karachi</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* 7. CONTACT / ORDER FORM */}
      <section id="contact" className="py-24 px-6 bg-white border-t border-emerald-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-emerald-50/40 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

            {/* Left Column: Title & Delivery Zones Info */}
            <div className="lg:col-span-5 text-left flex flex-col gap-6 lg:sticky lg:top-28">
              <div>
                <span className="text-xs font-extrabold text-primary uppercase tracking-widest bg-accent/35 px-4 py-1.5 rounded-full mb-3 inline-block">
                  Quick Order
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-primary leading-tight mt-1">
                  Place Your Order <br />
                  <span className="text-emerald-700">In Seconds</span>
                </h2>
                <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                  Fill out the form to schedule tiffin deliveries. We will automatically coordinate your subscription plan or customized dishes directly on WhatsApp.
                </p>
              </div>

              {/* Verified Features */}
              <div className="flex flex-col gap-3">
                {[
                  "Fresh ingredients bought daily from local markets",
                  "Double-layered hygienic thermal packaging",
                  "Pause, change, or skip deliveries easily via WhatsApp",
                  "Dedicated rider support and real-time alerts"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-gray-600">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Delivery Zone Map Embedded */}
              <div className="mt-6 bg-background/50 border border-emerald-100/40 p-6 rounded-3xl flex flex-col gap-4 shadow-sm">
                <div>
                  <h3 className="font-bold text-text-dark text-sm flex items-center gap-2">
                    <MapPin className="w-4.5 h-4.5" />
                    Active Delivery Zones
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    DHA, Clifton, Gulshan, Johar, PECHS, and surrounding regions in Karachi. If your area is outside, WhatsApp us to verify feasibility!
                  </p>
                </div>
                <div className="w-full h-36 rounded-2xl bg-gray-200 overflow-hidden shadow-subtle border border-emerald-50 relative shrink-0">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d115833.03657375088!2d67.0142993!3d24.8607!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb33e06602d4ca7%3A0xad6a809f6e62cf0a!2sKarachi%2C%20Pakistan!5e0!3m2!1sen!2s!4v1718335000000!5m2!1sen!2s"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    title="Delivery Zones Karachi Map"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Premium Form Card */}
            <div className="lg:col-span-7 bg-white border border-emerald-100/60 p-8 rounded-[36px] shadow-card animate-fade-in">
              <h3 className="text-lg font-bold text-text-dark mb-6 border-b border-emerald-50 pb-3">Delivery Information</h3>
              <form onSubmit={handleSubmit(handleOrderSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  placeholder="Muzammil Afzal"
                  error={errors.fullName}
                  {...register('fullName')}
                />
                <Input
                  label="Phone Number"
                  placeholder="0300******"
                  error={errors.phone}
                  {...register('phone')}
                />
                <Input
                  label="Delivery Address"
                  placeholder="Full home or office address in Karachi"
                  error={errors.address}
                  {...register('address')}
                  className="md:col-span-2"
                />
                <Input
                  type="select"
                  label="Meal / Plan Selection"
                  error={errors.mealSelection}
                  {...register('mealSelection')}
                  options={[
                    { value: '', label: '-- Select Plan --' },
                    { value: 'One-Day Plan', label: 'One-Day Plan' },
                    { value: 'Weekly Subscription Plan', label: 'Weekly Subscription Plan' },
                    { value: 'Monthly Subscription Plan', label: 'Monthly Subscription Plan' }
                  ]}
                />
                <Input
                  type="date"
                  label="Delivery Start Date"
                  error={errors.deliveryDate}
                  {...register('deliveryDate')}
                />
                <Input
                  type="textarea"
                  label="Special Notes / Instructions"
                  placeholder="Any dislikes, allergens, or directions to your door"
                  error={errors.notes}
                  {...register('notes')}
                  className="md:col-span-2"
                />

                <div className="md:col-span-2 mt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    className="w-full rounded-2xl py-3.5 font-bold shadow-md hover:shadow-lg transition-all text-xs uppercase tracking-widest cursor-pointer"
                  >
                    Order via WhatsApp Form
                  </Button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </section>

      <Footer />

      {/* 8. CUSTOMIZATION MODAL */}
      <Modal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        title={`Customize: ${selectedMeal?.name}`}
      >
        {selectedMeal && (
          <div className="flex flex-col gap-6 text-left">
            <div>
              <label className="block text-sm font-semibold text-text-dark mb-2">Portion Size</label>
              <div className="grid grid-cols-3 gap-3">
                {['Small', 'Medium', 'Large'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setPortionSize(size)}
                    className={`py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${portionSize === size
                      ? 'bg-primary text-text-light border-primary shadow-subtle'
                      : 'border-emerald-100 text-primary hover:bg-emerald-50'
                      }`}
                  >
                    {size} {size === 'Small' ? '(-20%)' : size === 'Large' ? '(+30%)' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-dark mb-2">Optional Add-ons</label>
              <div className="flex flex-col gap-3">
                {[
                  { key: 'extraRoti', label: 'Extra handmade Roti (+PKR 20)' },
                  { key: 'raita', label: 'Extra mint yogurt Raita (+PKR 40)' },
                  { key: 'dessert', label: 'Include Dessert of the Day (+PKR 120)' }
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-3 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={addOns[opt.key]}
                      onChange={(e) => setAddOns({ ...addOns, [opt.key]: e.target.checked })}
                      className="w-4 h-4 border-emerald-200 text-primary focus:ring-primary rounded"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Input
              type="textarea"
              label="Portion size special instructions"
              placeholder="e.g. Less spices, no onions, etc."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
            />

            <Button variant="primary" onClick={handleAddCustomizedToCart} className="w-full mt-4">
              Add Customized Tiffin to Cart
            </Button>
          </div>
        )}
      </Modal>

      {/* 9. WRITE A REVIEW MODAL */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title="Share Your Experience"
      >
        <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4 text-left">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Your Name *</label>
            <input
              type="text"
              required
              value={reviewName}
              onChange={(e) => setReviewName(e.target.value)}
              placeholder="e.g. Ali Ahmed"
              className="w-full px-4 py-2 text-sm rounded-xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Area / Location</label>
              <input
                type="text"
                value={reviewArea}
                onChange={(e) => setReviewArea(e.target.value)}
                placeholder="e.g. DHA Phase 6"
                className="w-full px-4 py-2 text-sm rounded-xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background/30"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Tiffin Plan / Role</label>
              <select
                value={reviewRole}
                onChange={(e) => setReviewRole(e.target.value)}
                className="w-full px-4 py-2 text-sm rounded-xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background/30"
              >
                <option value="Weekly Subscriber">Weekly Subscriber</option>
                <option value="Monthly Subscriber">Monthly Subscriber</option>
                <option value="Daily Dinner Plan">Daily Dinner Plan</option>
                <option value="Office Lunch Subscriber">Office Lunch Subscriber</option>
                <option value="Guest Customer">Guest Customer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Total Orders Placed</label>
              <input
                type="number"
                min="1"
                value={reviewOrders}
                onChange={(e) => setReviewOrders(e.target.value)}
                className="w-full px-4 py-2 text-sm rounded-xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background/30"
              />
            </div>

            {/* Rating Picker */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-700 block mb-1">Rating *</label>
              <div className="flex gap-1 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${star <= reviewRating
                        ? 'fill-amber-400 text-amber-500 stroke-[1.5]'
                        : 'fill-gray-100 text-gray-300 stroke-[1]'
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Your Review *</label>
            <textarea
              required
              rows="3"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us what you liked about the taste, packaging, hygiene, or delivery..."
              className="w-full px-4 py-2 text-sm rounded-xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background/30 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReviewOpen(false)}
              className="rounded-xl px-4 py-2 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="rounded-xl px-5 py-2 text-xs font-bold cursor-pointer"
            >
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
