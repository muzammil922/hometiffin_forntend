import React, { useState, useEffect } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { useToastStore } from '../store/toastStore'
import { Search, Heart, Sliders } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

export default function Menu() {
  const { addToast } = useToastStore()
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAMPAIGNS.length)
    }, 6000) // Rotate every 6 seconds
    return () => clearInterval(timer)
  }, [])

  // Categories
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Customization modal states
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [portionSize, setPortionSize] = useState('Medium')
  const [addOns, setAddOns] = useState({ extraRoti: false, raita: false, dessert: false })
  const [customNotes, setCustomNotes] = useState('')

  const handleCustomizeClick = (meal) => {
    setSelectedMeal(meal)
    setPortionSize('Medium')
    setAddOns({ extraRoti: false, raita: false, dessert: false })
    setCustomNotes('')
    setIsCustomizeOpen(true)
  }

  const handleOrderMeal = (meal, customizedData = null) => {
    let message = `Hi Home Tiffin! I would like to order:\n\n*${meal.name}*\n`
    if (customizedData) {
      let addOnsStr = ''
      if (customizedData.addOns.extraRoti) addOnsStr += ' +Extra Roti'
      if (customizedData.addOns.raita) addOnsStr += ' +Raita'
      if (customizedData.addOns.dessert) addOnsStr += ' +Dessert'
      
      message += `_Portion_: ${customizedData.portionSize}${addOnsStr ? `\n_Addons_: ${addOnsStr}` : ''}\n`
      if (customizedData.notes) message += `_Note_: ${customizedData.notes}\n`
    }
    const finalPrice = customizedData 
      ? meal.price * (customizedData.portionSize === 'Small' ? 0.8 : customizedData.portionSize === 'Large' ? 1.3 : 1) + 
        (customizedData.addOns.extraRoti ? 20 : 0) + 
        (customizedData.addOns.raita ? 40 : 0) + 
        (customizedData.addOns.dessert ? 120 : 0)
      : meal.price;
    message += `*Total*: PKR ${Math.round(finalPrice)}\n\nPlease confirm my order.`
    
    window.open(`https://wa.me/923000000000?text=${encodeURIComponent(message)}`, '_blank')
    addToast(`Order request for ${meal.name} opened in WhatsApp!`, 'success')
  }

  const handleAddCustomizedToCart = () => {
    handleOrderMeal(selectedMeal, { portionSize, addOns, notes: customNotes })
    setIsCustomizeOpen(false)
  }

  const handleQuickAdd = (meal) => {
    handleOrderMeal(meal)
  }

  const filteredMeals = MENU_ITEMS.filter(meal => {
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
          {/* Decorative Background Glows */}
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
              {/* Left Column: Content */}
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
                    onClick={() => {
                      setCurrentSlide((prev) => (prev + 1) % CAMPAIGNS.length)
                    }}
                    className="border border-white/20 hover:border-white text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Next Offer
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Right Column: Image */}
              <div className="md:col-span-5 flex justify-center md:justify-end">
                <div className="relative w-full max-w-[280px] aspect-[4/3] rounded-2xl overflow-hidden shadow-card border border-emerald-800/10">
                  <img
                    src={CAMPAIGNS[currentSlide].image}
                    alt={CAMPAIGNS[currentSlide].title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  {/* Floating sale tag if it is a sale campaign */}
                  {CAMPAIGNS[currentSlide].type === 'sale_campaign' && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white font-black text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-md animate-pulse">
                      Sale 15% Off
                    </div>
                  )}
                  {/* Floating hot tag if it is a delivery campaign */}
                  {CAMPAIGNS[currentSlide].type === 'delivery_campaign' && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-white font-black text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-md">
                      On Time 🛵
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

            {/* Category selector */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {['All', 'Breakfast', 'Lunch', 'Dinner'].map(cat => {
                const isSelected = selectedCategory === cat;
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
                );
              })}
            </div>
          </div>

          {/* Menu Items List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-14">
            {filteredMeals.map((meal) => (
              <Card key={meal.id} className="relative flex flex-col text-left justify-between mt-16 pt-24 p-6 bg-white rounded-3xl border border-emerald-100/50 shadow-md hover:shadow-lg transition-all duration-300">
                {/* Floating Centered Food Image - Larger, borderless, transparent blend */}
                <img 
                  src={meal.image || '/cutout_biryani.png'} 
                  alt={meal.name}
                  className="absolute -top-20 left-1/2 -translate-x-1/2 w-36 h-36 md:w-44 md:h-44 object-contain mix-blend-multiply z-20 pointer-events-none"
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
                      <Sliders className="w-4.5 h-4.5 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Meal Title */}
                  <h3 className="text-base font-bold text-text-dark mb-1 leading-snug">{meal.name}</h3>

                  {/* Tags Row - using website background color for pills */}
                  <div className="flex flex-wrap gap-1.5 mt-3.5 mb-3">
                    {(meal.tags || ['Homestyle', 'Fresh', 'Popular']).map((tag) => (
                      <span key={tag} className="bg-emerald-50 text-emerald-800 border border-emerald-100/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
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

                {/* Footer Row: Price, Order Now button */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-emerald-50">
                  <div className="text-left">
                    <span className="text-[10px] font-semibold text-gray-400 block leading-none mb-1.5 uppercase tracking-wider">Price</span>
                    <span className="text-xl md:text-2xl font-black text-primary">Rs. {meal.price}</span>
                  </div>

                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => handleQuickAdd(meal)} 
                    className="rounded-xl px-6 py-2.5 font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    Order Now
                  </Button>
                </div>
              </Card>
            ))}
            {filteredMeals.length === 0 && (
              <p className="text-gray-400 col-span-full py-12 text-center text-sm font-medium">No tiffin meals found matching your filters.</p>
            )}
          </div>
        </div>
      </main>

      <Footer collapsible={true} />

      {/* CUSTOMIZATION MODAL */}
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
                    className={`py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                      portionSize === size 
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

            <Button variant="primary" onClick={handleAddCustomizedToCart} className="w-full mt-4 cursor-pointer">
              Order via WhatsApp
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
