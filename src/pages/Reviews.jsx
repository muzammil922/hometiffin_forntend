import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, MessageSquare, Plus, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { useReviewStore } from '../store/reviewStore'

export default function Reviews() {
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

  // Calculate rating stats
  const totalReviews = testimonials.length
  const avgRating = totalReviews > 0 
    ? (testimonials.reduce((sum, item) => sum + (item.rating || 5), 0) / totalReviews).toFixed(1)
    : '5.0'

  return (
    <div className="min-h-screen bg-background/20 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Section Header with Stats */}
        <div className="bg-white border border-emerald-100/50 rounded-[32px] p-8 md:p-12 shadow-sm mb-12 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          {/* Decorative blur layer */}
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
          
          <div className="text-center md:text-left relative z-10">
            <span className="text-xs font-extrabold text-primary uppercase tracking-widest bg-accent/35 px-4 py-1.5 rounded-full mb-3 inline-block">
              All Testimonials
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-3">
              What Our Customers Say
            </h1>
            <p className="text-sm text-gray-500 max-w-xl leading-relaxed">
              Read transparent feedback from Karachiites who love our hygienic, warm, home-cooked food. Join the Home Tiffin family today!
            </p>
          </div>

          {/* Average Rating Block */}
          <div className="flex flex-col items-center shrink-0 bg-background/50 border border-emerald-100/40 p-6 rounded-3xl min-w-[200px] text-center relative z-10">
            <span className="text-4xl font-extrabold text-primary mb-1">{avgRating}</span>
            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${
                    i < Math.round(parseFloat(avgRating)) 
                      ? 'fill-amber-400 text-amber-500 stroke-[1.5]' 
                      : 'fill-gray-100 text-gray-300 stroke-[1]'
                  }`} 
                />
              ))}
            </div>
            <span className="text-xs text-gray-400 font-bold">{totalReviews} Reviews & Ratings</span>
            
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsReviewOpen(true)}
              className="mt-4 rounded-xl px-5 py-2.5 font-bold text-xs shadow-sm w-full cursor-pointer"
            >
              Write a Review
            </Button>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((test, index) => (
            <motion.div 
              key={test.name + index} 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.4) }}
              whileHover={{ y: -6, scale: 1.01 }}
              className="relative bg-white border border-emerald-100/50 p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              {/* Decorative quotation background */}
              <div className="absolute right-6 top-6 text-accent/15 font-serif text-8xl select-none pointer-events-none font-bold">
                “
              </div>

              <div className="relative z-10">
                {/* Star rating - realistic gold stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4.5 h-4.5 ${
                        i < (test.rating || 5) 
                          ? 'fill-amber-400 text-amber-500 stroke-[1.5]' 
                          : 'fill-gray-100 text-gray-300 stroke-[1]'
                      }`} 
                    />
                  ))}
                </div>

                <p className="text-sm text-gray-600 italic leading-relaxed mb-6">
                  "{test.review}"
                </p>
              </div>

              {/* Profile details - order count at left bottom */}
              <div className="flex items-center gap-3.5 pt-5 border-t border-emerald-50/80 relative z-10">
                <div className="text-left w-full flex flex-col gap-1">
                  <h4 className="text-sm font-extrabold text-text-dark flex items-center gap-1.5 flex-wrap">
                    <span>{test.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Verified Customer" />
                  </h4>
                  <span className="text-[10px] text-gray-400 font-bold block">{test.area} • {test.role}</span>
                  
                  {/* Order count at bottom left */}
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/60 shadow-sm uppercase tracking-wide w-fit mt-1">
                    {test.orders} {test.orders === 1 ? 'Order' : 'Orders'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <Footer />

      {/* WRITE A REVIEW MODAL */}
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
                      className={`w-5 h-5 ${
                        star <= reviewRating 
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
