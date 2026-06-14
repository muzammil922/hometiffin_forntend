import { create } from 'zustand'

export const useReviewStore = create((set) => ({
  testimonials: [
    { 
      name: 'Kashif Ali', 
      area: 'Gulshan, Karachi', 
      role: 'Weekly Subscriber',
      orders: 24,
      review: 'The biryani tastes exactly like home. Extremely hygienic packing, non-greasy food, and very prompt delivery.',
      rating: 5
    },
    { 
      name: 'Ayesha Khan', 
      area: 'Clifton, Karachi', 
      role: 'Office Lunch Subscriber',
      orders: 18,
      review: 'Subscribed to the monthly tiffin plan for my office lunches. Absolutely convenient, delicious, and way cleaner than restaurant food.',
      rating: 5
    },
    { 
      name: 'Zohaib Ahmed', 
      area: 'DHA, Karachi', 
      role: 'Daily Dinner Plan',
      orders: 31,
      review: 'Real homemade flavors. The portion size of the Beef Biryani and Karahi is more than enough for dinner. Highly recommended!',
      rating: 5
    }
  ],
  addReview: (review) => set((state) => ({
    testimonials: [review, ...state.testimonials]
  }))
}))
