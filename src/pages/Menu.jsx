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
import { Search, Sliders, ShoppingCart, Check, Scale, CupSoda, Cake, Salad, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAMPAIGNS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleAddToCart = () => {
    addItem(selectedMeal, { weight, weightMultiplier, coldDrink, meetha, salad, extraRoti, notes: customNotes })
    addToast(`${selectedMeal.name} cart mein add ho gaya!`, 'success')
    setIsCustomizeOpen(false)
  }

  const handleWeightSelect = (w) => {
    setWeight(w.label)
    setWeightMultiplier(w.multiplier)
  }

  // Direct add to cart with default settings (no modal)
  const handleDirectAdd = (meal) => {
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
  }

  const filteredMeals = meals.filter(meal => {
    const matchesCategory = selectedCategory === 'All' || meal.category === selectedCategory
    const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          meal.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Premium Animated Header Card (Campaign Slider) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary to-emerald-900 rounded-[36px] h-[460px] sm:h-[380px] md:h-[300px] lg:h-[285px] shadow-lg mb-12 border border-emerald-850/10">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

          <AnimatePresence initial={false}>
            <div className="absolute inset-0 flex items-center px-8 md:px-12 z-10">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center w-full"
              >
                <div className="md:col-span-7 flex flex-col items-start gap-3.5">
                  <span className="text-[9px] font-bold text-accent bg-emerald-950/40 border border-accent/20 px-3.5 py-1.5 rounded-full uppercase tracking-widest">
                    {CAMPAIGNS[currentSlide].badge}
                  </span>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-text-light tracking-tight leading-tight">
                    {CAMPAIGNS[currentSlide].title}
                  </h1>
                  <p className="text-xs md:text-sm text-accent-light/85 max-w-lg leading-relaxed font-medium mt-1">
                    {CAMPAIGNS[currentSlide].desc}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <a
                      href="#menu-list"
                      className="bg-accent text-primary px-5 py-2.5 rounded-xl text-xs font-extrabold hover:bg-white transition-all shadow-sm"
                    >
                      Explore Subscriptions
                    </a>
                    <button
                      onClick={() => setCurrentSlide((prev) => (prev + 1) % CAMPAIGNS.length)}
                      className="border border-white/20 hover:border-white text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      Next Offer
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="md:col-span-5 flex justify-center md:justify-end">
                  <div className="relative w-full max-w-[280px] aspect-[4/3] rounded-2xl overflow-hidden shadow-card border border-emerald-800/10">
                    <img
                      src={CAMPAIGNS[currentSlide].image}
                      alt={CAMPAIGNS[currentSlide].title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    {CAMPAIGNS[currentSlide].type === 'sale_campaign' && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white font-black text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-md animate-pulse">
                        Sale 15% Off
                      </div>
                    )}
                    {CAMPAIGNS[currentSlide].type === 'delivery_campaign' && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white font-black text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-md flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        On Time
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </AnimatePresence>
        </div>

        <div id="menu-list" className="flex flex-col gap-8">
          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto w-full flex flex-col md:flex-row gap-5 justify-between items-center bg-white p-5 md:px-6 rounded-[28px] border border-emerald-100/50 shadow-sm">
            <div className="relative w-full md:flex-1 max-w-md">
              <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search home-cooked dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-emerald-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-gray-50/50 placeholder-gray-400"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {['All', 'Breakfast', 'Lunch', 'Dinner'].map(cat => {
                const isSelected = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary text-text-light shadow-md'
                        : 'text-gray-650 hover:bg-emerald-50 bg-white border border-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-14">
            {loading ? (
              // Skeleton meal cards
              [...Array(6)].map((_, i) => (
                <div key={i} className="relative flex flex-col text-left justify-between mt-16 pt-24 p-6 bg-white rounded-3xl border border-emerald-100/50 shadow-md animate-pulse">
                  {/* Floating image placeholder */}
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-sm"></div>
                  
                  <div>
                    {/* Category badge + icon row */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="h-5 w-16 bg-gray-100 rounded-xl"></div>
                      <div className="h-8 w-8 bg-gray-100 rounded-xl"></div>
                    </div>

                    {/* Title */}
                    <div className="h-5 w-3/4 bg-gray-200 rounded-lg mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-100 rounded-lg mb-3"></div>

                    {/* Tags */}
                    <div className="flex gap-1.5 mb-3">
                      <div className="h-4 w-14 bg-emerald-100 rounded-full"></div>
                      <div className="h-4 w-12 bg-emerald-100 rounded-full"></div>
                      <div className="h-4 w-16 bg-emerald-100 rounded-full"></div>
                    </div>

                    {/* Description lines */}
                    <div className="h-3 w-full bg-gray-100 rounded mb-1.5"></div>
                    <div className="h-3 w-5/6 bg-gray-100 rounded mb-1.5"></div>
                    <div className="h-3 w-2/3 bg-gray-100 rounded"></div>
                  </div>

                  {/* Footer: Price + Button */}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-emerald-50">
                    <div>
                      <div className="h-3 w-10 bg-gray-100 rounded mb-1"></div>
                      <div className="h-7 w-20 bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="h-10 w-32 bg-primary/20 rounded-xl"></div>
                  </div>
                </div>
              ))
            ) : (
              <>
                {filteredMeals.map((meal) => (
                  <Card key={meal.id} className="relative flex flex-col text-left justify-between mt-16 pt-24 p-6 bg-white rounded-3xl border border-emerald-100/50 shadow-md hover:shadow-lg transition-all duration-300">
                    <img
                      src={meal.image || '/cutout_biryani.png'}
                      alt={meal.name}
                      className="absolute -top-20 left-1/2 -translate-x-1/2 w-36 h-36 md:w-44 md:h-44 object-contain mix-blend-multiply z-20 pointer-events-none"
                    />

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-accent/25 text-primary px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wider uppercase">
                          {meal.category}
                        </span>
                        <button
                          onClick={() => openCustomize(meal)}
                          className="p-1.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-accent/20 hover:text-primary transition-all border border-gray-100 shadow-sm cursor-pointer"
                          title="Customize"
                        >
                          <Sliders className="w-4.5 h-4.5 stroke-[2.5]" />
                        </button>
                      </div>

                      <h3 className="text-base font-bold text-text-dark mb-1 leading-snug">{meal.name}</h3>

                      <div className="flex flex-wrap gap-1.5 mt-3.5 mb-3">
                        {(meal.tags || ['Homestyle', 'Fresh', 'Popular']).map((tag) => (
                          <span key={tag} className="bg-emerald-50 text-emerald-800 border border-emerald-100/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-gray-500 leading-relaxed mb-1.5">
                        {meal.description}{' '}
                        <span className="text-primary font-bold hover:underline cursor-pointer">See more</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-emerald-50">
                      <div className="text-left">
                        <span className="text-[10px] font-semibold text-gray-400 block leading-none mb-1.5 uppercase tracking-wider">Price</span>
                        <span className="text-xl md:text-2xl font-black text-primary">Rs. {meal.price}</span>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDirectAdd(meal)}
                        className="rounded-xl px-6 py-2.5 font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </Button>
                    </div>
                  </Card>
                ))}
                {filteredMeals.length === 0 && (
                  <p className="text-gray-400 col-span-full py-12 text-center text-sm font-medium">
                    No tiffin meals found matching your filters.
                  </p>
                )}
              </>
            )}
          </div>
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
              onClick={handleAddToCart}
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
