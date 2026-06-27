import React, { useState, useEffect } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { useToastStore } from '../store/toastStore'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import { flyToCart } from '../services/flyToCart'
import { Search, Sliders, ShoppingCart, Check, Scale, CupSoda, Cake, Salad, Clock, X } from 'lucide-react'
import { DynamicLucideIcon } from '../utils/lucideIconMap'
import { motion, AnimatePresence } from 'framer-motion'
import SEO from '../components/shared/SEO'

const renderIcon = (iconName) => (
  <DynamicLucideIcon name={iconName} className="w-3.5 h-3.5" />
)

/* ─────────────── Static Data ─────────────── */
const MENU_ITEMS = [
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
  },
  {
    id: 'm5',
    name: 'Spicy Masala Egg Omelette',
    category: 'Breakfast',
    price: 120,
    description: 'Two-egg omelette cooked with fresh green chilies, onions, coriander, and native spices. Served with paratha.',
    image: '/cutout_burger.png',
    tags: ['Spicy', 'Omelette', 'Breakfast']
  },
  {
    id: 'm6',
    name: 'Karachi Nihari Special',
    category: 'Dinner',
    price: 380,
    description: 'Slow-cooked beef stew in thick spicy gravy, garnished with ginger, lemon, and green chilies. Served with hot naan.',
    image: '/cutout_karahi.png',
    tags: ['Karachi Special', 'Slow Cooked', 'Spicy']
  }
]

const CAMPAIGNS = [
  {
    type: 'menu_info',
    badge: 'Ghar ka Khana',
    title: 'Our Premium Menu',
    desc: 'Freshly prepared home-cooked meals by local Karachi home chefs. Order your customized daily, weekly, or monthly subscription plans instantly via WhatsApp.',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=600'
  },
  {
    type: 'delivery_campaign',
    badge: 'Lightning Fast',
    title: 'Guaranteed Hot & Fresh',
    desc: 'Our dedicated riders deliver hot tiffin boxes packed in thermal bags directly to your office or doorstep across Karachi, keeping it fresh & warm.',
    image: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?q=80&w=600'
  },
  {
    type: 'sale_campaign',
    badge: 'Save Big',
    title: 'Flat 15% Off Subscriptions',
    desc: 'Healthy eating made affordable! Subscribe to any weekly tiffin program this month and enjoy a flat 15% discount on checkout.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600'
  }
]

/* ─────────────── Customization Options ─────────────── */
const WEIGHT_OPTIONS = [
  { label: '300g', multiplier: 0.75, tag: 'Light' },
  { label: '500g', multiplier: 1.0,  tag: 'Regular' },
  { label: '700g', multiplier: 1.35, tag: 'Full' },
]

const COLD_DRINKS = [
  { name: 'None',        price: 0  },
  { name: 'Pepsi / 7Up', price: 60 },
  { name: 'Doodh Patti', price: 40 },
  { name: 'Lassi',       price: 80 },
]

const MEETHA_OPTIONS = [
  { name: 'None',         price: 0  },
  { name: 'Kheer',        price: 80 },
  { name: 'Gulab Jamun',  price: 60 },
  { name: 'Sooji Halwa',  price: 70 },
]

const SALAD_OPTIONS = [
  { name: 'None',             price: 0  },
  { name: 'Kachumar Salad',   price: 30 },
  { name: 'Green Salad',      price: 40 },
  { name: 'Mint Raita',       price: 40 },
]

/* ─────────────── Option Selector Component ─────────────── */
function OptionSelector({ options, selected, onSelect, cols = 2 }) {
  return (
    <div className={`grid gap-2 mt-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map((opt) => {
        const isSelected = selected?.name === opt.name || (!selected && opt.name === 'None')
        return (
          <button
            key={opt.name}
            type="button"
            onClick={() => onSelect(opt.name === 'None' ? null : opt)}
            className={`relative flex flex-col items-start px-3 py-2.5 rounded-2xl border text-left transition-all cursor-pointer text-xs font-semibold ${
              isSelected
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-white text-gray-700 border-emerald-100 hover:border-primary/50 hover:bg-emerald-50/60'
            }`}
          >
            {isSelected && (
              <span className="absolute top-1.5 right-1.5">
                <Check className="w-3 h-3" />
              </span>
            )}
            <span>{opt.name}</span>
            {opt.price > 0 && (
              <span className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-primary'}`}>
                +Rs. {opt.price}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ─────────────── Main Component ─────────────── */
export default function Menu() {
  const { addToast } = useToastStore()
  const { addItem, fetchCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState(CAMPAIGNS)

  useEffect(() => {
    const loadMeals = async () => {
      try {
        setLoading(true)
        const res = await api.get('/meals')
        const mappedMeals = res.data.map(meal => ({
          ...meal,
          image: meal.imageUrl,
          availableDays: meal.weeklyDays
        }))
        setMeals(mappedMeals)
        if (isAuthenticated) {
          await fetchCart()
        }
      } catch (err) {
        console.error('Failed to fetch meals:', err)
        addToast('Meals loading failed!', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadMeals()
  }, [isAuthenticated])

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const res = await api.get('/campaigns')
        if (res.data && res.data.length > 0) {
          setCampaigns(res.data)
        }
      } catch (err) {
        console.error('Failed to fetch campaigns:', err)
      }
    }
    loadCampaigns()
  }, [])

  useEffect(() => {
    if (campaigns.length === 0) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % campaigns.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [campaigns])

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  // Modal state
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [weight, setWeight] = useState('500g')
  const [weightMultiplier, setWeightMultiplier] = useState(1.0)
  const [coldDrink, setColdDrink] = useState(null)   // { name, price } | null
  const [meetha, setMeetha] = useState(null)          // { name, price } | null
  const [salad, setSalad] = useState(null)            // { name, price } | null
  const [extraRoti, setExtraRoti] = useState(false)
  const [customNotes, setCustomNotes] = useState('')

  const openCustomize = (meal) => {
    setSelectedMeal(meal)
    setWeight('500g')
    setWeightMultiplier(1.0)
    setColdDrink(null)
    setMeetha(null)
    setSalad(null)
    setExtraRoti(false)
    setCustomNotes('')
    setIsCustomizeOpen(true)
  }

  const calcTotal = () => {
    if (!selectedMeal) return 0
    const base = Math.round(selectedMeal.price * weightMultiplier)
    let extras = 0
    if (coldDrink) extras += coldDrink.price
    if (meetha)    extras += meetha.price
    if (salad)     extras += salad.price
    if (extraRoti) extras += 20
    return base + extras
  }

  const handleAddToCart = (event) => {
    flyToCart(event, selectedMeal?.image || '/cutout_biryani.png', () => {
      addItem(selectedMeal, { weight, weightMultiplier, coldDrink, meetha, salad, extraRoti, notes: customNotes })
      addToast(`${selectedMeal.name} cart mein add ho gaya!`, 'success')
    })
    setIsCustomizeOpen(false)
  }

  const handleWeightSelect = (w) => {
    setWeight(w.label)
    setWeightMultiplier(w.multiplier)
  }

  // Direct add to cart with default settings (no modal)
  const handleDirectAdd = (meal, event) => {
    flyToCart(event, meal.image || '/cutout_biryani.png', () => {
      addItem(meal, {
        weight: '500g',
        weightMultiplier: 1.0,
        coldDrink: null,
        meetha: null,
        salad: null,
        extraRoti: false,
        notes: ''
      })
      addToast(`${meal.name} cart mein add ho gaya!`, 'success')
    })
  }

  const filteredMeals = meals.filter(meal => {
    const matchesCategory = selectedCategory === 'All' || meal.category === selectedCategory
    const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          meal.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Weekly Meal Menu & Subscription Plans"
        description="Explore our daily rotation of fresh home-cooked beef biryani, chicken karahi, brown diet lentils, sweet kheer, and tiffin burgers. Order a single meal or subscribe weekly!"
        keywords="home tiffin menu, beef biryani karachi, chicken karahi delivery, tiffin dishes list, daily food menu karachi, monthly tiffin price"
      />
      <Navbar />

      {/* Mobile Top Campaign Bar (One Line Alert Bar, Transitions Slide-by-Slide) */}
      {campaigns.length > 0 && (
        <div className="block md:hidden bg-primary text-white px-4 h-11 relative overflow-hidden z-25 shadow-sm border-b border-emerald-950/20">
          <div className="absolute inset-y-0 left-4 right-4 flex items-center">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex items-center justify-between w-full h-full"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  {campaigns[currentSlide].badge && (
                    <span className="bg-accent text-primary text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                      {campaigns[currentSlide].badge}
                    </span>
                  )}
                  {campaigns[currentSlide].actionIcon && (
                    <span className="text-accent shrink-0 flex items-center">
                      {renderIcon(campaigns[currentSlide].actionIcon)}
                    </span>
                  )}
                  <span className="font-extrabold text-white truncate text-[11px] sm:text-xs">
                    {campaigns[currentSlide].title}
                  </span>
                </div>
                
                {campaigns[currentSlide].actionText && (
                  <a
                    href={campaigns[currentSlide].actionLink || "#menu-list"}
                    className="bg-accent text-primary px-2.5 py-1 rounded-lg text-[9px] font-extrabold shrink-0 hover:bg-white transition-all shadow-sm flex items-center gap-1"
                  >
                    {campaigns[currentSlide].actionText}
                    {campaigns[currentSlide].actionIcon && renderIcon(campaigns[currentSlide].actionIcon)}
                  </a>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Premium Animated Header Card (Campaign Slider) - Desktop Only */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary to-emerald-900 rounded-[36px] h-[300px] lg:h-[285px] shadow-lg mb-12 border border-emerald-850/10 hidden md:block">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

          <AnimatePresence initial={false}>
            {campaigns.length > 0 && (
              <div className="absolute inset-0 flex items-center z-10">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                  className="flex items-center justify-between w-full h-full relative"
                >
                  {/* Left Text Content */}
                  <div className="w-[60%] lg:w-[50%] flex flex-col items-start gap-3.5 z-20 relative text-left pl-8 md:pl-12 pr-4">
                    <span className="text-[9px] font-bold text-accent bg-emerald-950/40 border border-accent/20 px-3.5 py-1.5 rounded-full uppercase tracking-widest">
                      {campaigns[currentSlide].badge}
                    </span>
                    <h1 className="text-3xl lg:text-5xl font-black text-text-light tracking-tight leading-tight">
                      {campaigns[currentSlide].title}
                    </h1>
                    <p className="text-xs md:text-sm text-accent-light/85 max-w-lg leading-relaxed font-medium mt-1">
                      {campaigns[currentSlide].desc}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {campaigns[currentSlide].actionText && (
                        <a
                          href={campaigns[currentSlide].actionLink || "#menu-list"}
                          className="bg-accent text-primary px-5 py-2.5 rounded-xl text-xs font-extrabold hover:bg-white transition-all shadow-sm flex items-center gap-1.5"
                        >
                          {campaigns[currentSlide].actionText}
                          {campaigns[currentSlide].actionIcon && renderIcon(campaigns[currentSlide].actionIcon)}
                        </a>
                      )}
                      <button
                        onClick={() => setCurrentSlide((prev) => (prev + 1) % campaigns.length)}
                        className="border border-white/20 hover:border-white text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        Next Offer
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Right Image Content */}
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-[45%] lg:w-[50%] h-full z-10 pointer-events-none"
                  >
                    <img
                      src={campaigns[currentSlide].image}
                      alt={campaigns[currentSlide].title}
                      className="w-full h-full object-cover select-none object-center"
                    />
                    
                    {/* Badge Badges */}
                    {campaigns[currentSlide].type === 'sale_campaign' && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white font-black text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-md animate-pulse z-20">
                        Sale 15% Off
                      </div>
                    )}
                    {campaigns[currentSlide].type === 'delivery_campaign' && (
                      <div className="absolute top-4 right-4 bg-amber-500 text-white font-black text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-md flex items-center gap-1 z-20">
                        <Clock className="w-3 h-3" />
                        On Time
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div id="menu-list" className="flex flex-col gap-8">
          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto w-full bg-white p-2 rounded-full border border-emerald-100/50 shadow-sm relative overflow-hidden h-[60px] sm:h-[68px] flex items-center">
            
            {/* Category Tabs Container */}
            <div className={`flex-1 flex items-center md:justify-center gap-2 overflow-x-auto scrollbar-none pl-14 pr-4 md:pl-4 md:pr-16 transition-opacity duration-300 w-full ${isSearchExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              {['All', 'Breakfast', 'Lunch', 'Dinner', 'Daily Special', 'Desserts', 'Beverages & Extras'].map(cat => {
                const isSelected = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 sm:py-2.5 text-xs font-bold rounded-full cursor-pointer transition-all shrink-0 ${
                      isSelected
                        ? 'bg-primary text-text-light shadow-md'
                        : 'bg-transparent text-gray-500 hover:text-primary hover:bg-emerald-50 border border-transparent'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>

            {/* Search Overlay Container */}
            <div 
              className={`absolute inset-y-2 flex items-center bg-gray-50/95 backdrop-blur-sm rounded-full border border-emerald-100 px-3 sm:px-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-10 ${
                isSearchExpanded 
                  ? 'left-2 right-2 opacity-100' 
                  : 'opacity-0 pointer-events-none left-2 right-[calc(100%-3rem)] md:left-[calc(100%-3.5rem)] md:right-2'
              }`}
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-semibold px-3 text-text-dark"
              />
              <button 
                onClick={() => {
                  setIsSearchExpanded(false)
                  setSearchQuery('') 
                }} 
                className={`p-1.5 hover:bg-gray-200 rounded-full transition-all shrink-0 cursor-pointer ${isSearchExpanded ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* The collapsed Search Icon Button */}
            <button
              onClick={() => setIsSearchExpanded(true)}
              className={`absolute flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-primary rounded-full transition-all duration-300 cursor-pointer w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] top-1/2 -translate-y-1/2 left-2 md:left-auto md:right-2 z-0 ${isSearchExpanded ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'}`}
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Menu Items List / Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 pt-10 sm:pt-14">
              {/* Skeleton meal cards */}
              {[...Array(6)].map((_, i) => (
                <div key={i} className="relative flex flex-col text-left justify-between mt-10 sm:mt-16 pt-16 sm:pt-24 p-3 sm:p-6 bg-white rounded-3xl border border-emerald-100/50 shadow-md animate-pulse">
                  {/* Floating image placeholder */}
                  <div className="absolute -top-10 sm:-top-14 left-1/2 -translate-x-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-100 border-4 border-white shadow-sm"></div>
                  
                  <div>
                    {/* Category badge + icon row */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="h-4 sm:h-5 w-12 sm:w-16 bg-gray-100 rounded-xl"></div>
                      <div className="h-6 sm:h-8 w-6 sm:w-8 bg-gray-100 rounded-xl"></div>
                    </div>

                    {/* Title */}
                    <div className="h-4 w-3/4 bg-gray-200 rounded-lg mb-2"></div>
                    <div className="h-3 w-1/2 bg-gray-100 rounded-lg mb-3"></div>

                    {/* Description lines (hidden on mobile) */}
                    <div className="hidden sm:block">
                      <div className="h-3 w-full bg-gray-100 rounded mb-1.5"></div>
                      <div className="h-3 w-5/6 bg-gray-100 rounded mb-1.5"></div>
                      <div className="h-3 w-2/3 bg-gray-100 rounded"></div>
                    </div>
                  </div>

                  {/* Footer: Price + Button */}
                  <div className="flex items-center justify-between mt-auto pt-3 sm:pt-4 border-t border-emerald-50">
                    <div>
                      <div className="h-3 w-8 bg-gray-100 rounded mb-1"></div>
                      <div className="h-5 sm:h-7 w-12 sm:w-20 bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="h-8 sm:h-10 w-12 sm:w-32 bg-primary/20 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {selectedCategory === 'All' ? (
                (() => {
                  const categories = ['Breakfast', 'Lunch', 'Dinner', 'Daily Special', 'Desserts', 'Beverages & Extras']
                  const categoriesWithMeals = categories.filter(cat => {
                    const catMeals = filteredMeals.filter(m => m.category === cat)
                    return catMeals.length > 0
                  })
                  
                  if (categoriesWithMeals.length === 0) {
                    return (
                      <p className="text-gray-400 py-12 text-center text-sm font-medium">
                        No tiffin meals found matching your filters.
                      </p>
                    )
                  }

                  return categoriesWithMeals.map(cat => (
                    <div key={cat} className="flex flex-col gap-2 mt-4">
                      <h2 className="text-lg md:text-xl font-black text-primary border-l-4 border-accent pl-3 text-left">
                        {cat}
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 pt-10 sm:pt-14 pb-4">
                        {filteredMeals.filter(m => m.category === cat).map((meal) => (
                          <Card key={meal.id} className="relative flex flex-col text-left justify-between mt-10 sm:mt-16 pt-16 sm:pt-24 p-3 sm:p-6 bg-white rounded-3xl border border-emerald-100/50 shadow-md hover:shadow-lg transition-all duration-300">
                            <img
                              src={meal.image || '/cutout_biryani.png'}
                              alt={meal.name}
                              className="absolute -top-10 sm:-top-20 left-1/2 -translate-x-1/2 w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 object-contain mix-blend-multiply z-20 pointer-events-none"
                            />

                            <div>
                              <div className="flex justify-between items-center mb-2 sm:mb-3">
                                <span className="bg-accent/25 text-primary px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase">
                                  {meal.category}
                                </span>
                                <button
                                  onClick={() => openCustomize(meal)}
                                  className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-gray-50 text-gray-500 hover:bg-accent/20 hover:text-primary transition-all border border-gray-100 shadow-sm cursor-pointer"
                                  title="Customize"
                                >
                                  <Sliders className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                                </button>
                              </div>

                              <h3 className="text-xs sm:text-sm md:text-base font-bold text-text-dark mb-1 leading-snug line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">{meal.name}</h3>

                              <div className="hidden sm:flex flex-wrap gap-1.5 mt-3.5 mb-3">
                                {(meal.tags || ['Homestyle', 'Fresh', 'Popular']).map((tag) => (
                                  <span key={tag} className="bg-emerald-50 text-emerald-800 border border-emerald-100/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                    {tag}
                                  </span>
                                ))}
                              </div>

                              <p className="hidden sm:block text-xs text-gray-500 leading-relaxed mb-1.5">
                                {meal.description}{' '}
                                <span className="text-primary font-bold hover:underline cursor-pointer">See more</span>
                              </p>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-3 sm:pt-4 border-t border-emerald-50">
                              <div className="text-left">
                                <span className="text-[8px] sm:text-[10px] font-semibold text-gray-400 block leading-none mb-1 uppercase tracking-wider">Price</span>
                                <span className="text-sm sm:text-base md:text-2xl font-black text-primary">Rs. {meal.price}</span>
                              </div>

                              <Button
                                variant="primary"
                                size="sm"
                                onClick={(e) => handleDirectAdd(meal, e)}
                                className="rounded-xl px-2.5 sm:px-6 py-2 sm:py-2.5 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Add</span>
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))
                })()
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 pt-10 sm:pt-14">
                  {filteredMeals.map((meal) => (
                    <Card key={meal.id} className="relative flex flex-col text-left justify-between mt-10 sm:mt-16 pt-16 sm:pt-24 p-3 sm:p-6 bg-white rounded-3xl border border-emerald-100/50 shadow-md hover:shadow-lg transition-all duration-300">
                      <img
                        src={meal.image || '/cutout_biryani.png'}
                        alt={meal.name}
                        className="absolute -top-10 sm:-top-20 left-1/2 -translate-x-1/2 w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 object-contain mix-blend-multiply z-20 pointer-events-none"
                      />

                      <div>
                        <div className="flex justify-between items-center mb-2 sm:mb-3">
                          <span className="bg-accent/25 text-primary px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase">
                            {meal.category}
                          </span>
                          <button
                            onClick={() => openCustomize(meal)}
                            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-gray-50 text-gray-500 hover:bg-accent/20 hover:text-primary transition-all border border-gray-100 shadow-sm cursor-pointer"
                            title="Customize"
                          >
                            <Sliders className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                          </button>
                        </div>

                        <h3 className="text-xs sm:text-sm md:text-base font-bold text-text-dark mb-1 leading-snug line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">{meal.name}</h3>

                        <div className="hidden sm:flex flex-wrap gap-1.5 mt-3.5 mb-3">
                          {(meal.tags || ['Homestyle', 'Fresh', 'Popular']).map((tag) => (
                            <span key={tag} className="bg-emerald-50 text-emerald-800 border border-emerald-100/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <p className="hidden sm:block text-xs text-gray-500 leading-relaxed mb-1.5">
                          {meal.description}{' '}
                          <span className="text-primary font-bold hover:underline cursor-pointer">See more</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-3 sm:pt-4 border-t border-emerald-50">
                        <div className="text-left">
                          <span className="text-[8px] sm:text-[10px] font-semibold text-gray-400 block leading-none mb-1 uppercase tracking-wider">Price</span>
                          <span className="text-sm sm:text-base md:text-2xl font-black text-primary">Rs. {meal.price}</span>
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => handleDirectAdd(meal, e)}
                          className="rounded-xl px-2.5 sm:px-6 py-2 sm:py-2.5 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Add</span>
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {filteredMeals.length === 0 && (
                    <p className="text-gray-400 col-span-full py-12 text-center text-sm font-medium">
                      No tiffin meals found matching your filters.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer collapsible={true} />

      {/* ─── CUSTOMIZATION MODAL ─── */}
      <Modal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        title={selectedMeal ? selectedMeal.name : ''}
      >
        {selectedMeal && (
          <div className="flex flex-col gap-5 text-left">

            {/* ── Weight / Portion ── */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-primary" />
                Weight / Portion
              </p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {WEIGHT_OPTIONS.map((w) => {
                  const isSelected = weight === w.label
                  return (
                    <button
                      key={w.label}
                      type="button"
                      onClick={() => handleWeightSelect(w)}
                      className={`flex flex-col items-center py-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-md'
                          : 'bg-white text-gray-700 border-emerald-100 hover:border-primary/50 hover:bg-emerald-50/60'
                      }`}
                    >
                      <span className="text-sm font-black">{w.label}</span>
                      <span className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                        {w.tag}
                      </span>
                      {w.multiplier !== 1 && (
                        <span className={`text-[9px] font-bold mt-0.5 ${isSelected ? 'text-emerald-200' : 'text-primary'}`}>
                          {w.multiplier < 1 ? `−${Math.round((1 - w.multiplier) * 100)}%` : `+${Math.round((w.multiplier - 1) * 100)}%`}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Cold Drink ── */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <CupSoda className="w-3.5 h-3.5 text-primary" />
                Cold Drink / Peena
              </p>
              <OptionSelector
                options={COLD_DRINKS}
                selected={coldDrink}
                onSelect={setColdDrink}
                cols={2}
              />
            </div>

            {/* ── Meetha ── */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Cake className="w-3.5 h-3.5 text-primary" />
                Meetha (Sweet)
              </p>
              <OptionSelector
                options={MEETHA_OPTIONS}
                selected={meetha}
                onSelect={setMeetha}
                cols={2}
              />
            </div>

            {/* ── Salad ── */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Salad className="w-3.5 h-3.5 text-primary" />
                Salad
              </p>
              <OptionSelector
                options={SALAD_OPTIONS}
                selected={salad}
                onSelect={setSalad}
                cols={2}
              />
            </div>

            {/* ── Extra Roti ── */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setExtraRoti(!extraRoti)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                  extraRoti ? 'bg-primary border-primary' : 'border-gray-300 bg-white'
                }`}
              >
                {extraRoti && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-gray-700 font-medium">
                Extra handmade Roti
                <span className="ml-1 text-primary font-bold text-xs">+Rs. 20</span>
              </span>
            </label>

            {/* ── Special Notes ── */}
            <Input
              type="textarea"
              label="Special Instructions (optional)"
              placeholder="e.g. Less spicy, no onions, extra sauce..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
            />

            {/* ── Price Breakdown ── */}
            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Price Breakdown</p>
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base price ({weight})</span>
                  <span className="font-bold text-text-dark">Rs. {Math.round(selectedMeal.price * weightMultiplier)}</span>
                </div>
                {coldDrink && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{coldDrink.name}</span>
                    <span className="font-bold text-emerald-600">+Rs. {coldDrink.price}</span>
                  </div>
                )}
                {meetha && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{meetha.name}</span>
                    <span className="font-bold text-emerald-600">+Rs. {meetha.price}</span>
                  </div>
                )}
                {salad && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{salad.name}</span>
                    <span className="font-bold text-emerald-600">+Rs. {salad.price}</span>
                  </div>
                )}
                {extraRoti && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Extra Roti</span>
                    <span className="font-bold text-emerald-600">+Rs. 20</span>
                  </div>
                )}
                <div className="h-px bg-emerald-100 my-1" />
                <div className="flex justify-between text-base">
                  <span className="font-black text-text-dark">Total</span>
                  <span className="font-black text-primary">Rs. {calcTotal()}</span>
                </div>
              </div>
            </div>

            {/* ── Add to Cart Button ── */}
            <Button
              variant="primary"
              onClick={(e) => handleAddToCart(e)}
              className="w-full py-3.5 rounded-2xl font-bold text-base shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
