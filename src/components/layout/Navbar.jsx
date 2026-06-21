import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ShoppingCart, User, ChefHat, Home, Utensils, DollarSign, Info, Phone as PhoneIcon, LogIn, LayoutDashboard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import Button from '../ui/Button'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated, user } = useAuthStore()
  const { getTotalItems } = useCartStore()

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Menu', path: '/menu', icon: Utensils },
    { name: 'Pricing', path: '/#pricing', icon: DollarSign },
    { name: 'About', path: '/#about', icon: Info },
    { name: 'Contact', path: '/#contact', icon: PhoneIcon },
  ]

  const isActive = (path) => {
    if (path.startsWith('/#')) {
      return location.hash === path.substring(1)
    }
    return location.pathname === path
  }

  return (
    <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-accent px-6 py-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo left */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <span className="text-2xl font-black tracking-tight text-primary flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            Home Tiffin
          </span>
        </Link>

        {/* Navigation links center (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const active = isActive(link.path)
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-semibold tracking-wide transition-all relative py-1 hover:text-primary ${
                  active ? 'text-primary' : 'text-primary/75'
                }`}
              >
                {link.name}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Buttons right (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <Link id="desktop-cart-icon" to="/cart" className="relative p-2 hover:bg-accent-light rounded-xl transition-all cursor-pointer">
            <ShoppingCart className="w-6 h-6 text-primary" />
            {getTotalItems() > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-text-light text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                {getTotalItems()}
              </span>
            )}
          </Link>
          
          {isAuthenticated ? (
            <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
              <Button variant="secondary" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/menu">
                <Button variant="primary">Order Now</Button>
              </Link>
            </>
          )}
        </div>
 
        {/* Mobile Actions Container (Cart & Hamburger) */}
        <div className="flex md:hidden items-center gap-2">
          <Link id="mobile-cart-icon" to="/cart" className="relative p-2 hover:bg-accent-light rounded-xl transition-all cursor-pointer">
            <ShoppingCart className="w-6 h-6 text-primary" />
            {getTotalItems() > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-text-light text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                {getTotalItems()}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-primary hover:bg-accent-light rounded-xl cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile full-screen animated menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden absolute top-[73px] left-0 right-0 h-[calc(100vh-73px)] z-40 bg-background/95 backdrop-blur-md flex flex-col items-start justify-start pt-8 overflow-hidden border-t border-accent/20"
          >
            
            <div className="w-full max-w-sm px-8 flex flex-col gap-2 relative z-10">
              {navLinks.map((link, i) => {
                const yOffset = 250 - (i * 80);
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-5 text-2xl font-black tracking-wide py-3 px-4 rounded-3xl transition-colors ${
                      active ? 'text-primary bg-emerald-50/50' : 'text-primary/70 hover:text-primary hover:bg-emerald-50/30'
                    }`}
                  >
                    <motion.div
                      initial={{ y: yOffset, x: 50, rotate: -360, scale: 0, opacity: 0 }}
                      animate={{ y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 }}
                      transition={{ duration: 1.5, delay: i * 0.1, ease: "backOut" }}
                      className={`p-3.5 rounded-2xl ${active ? 'bg-primary text-text-light shadow-md' : 'bg-emerald-50 text-primary shadow-subtle'}`}
                    >
                      <link.icon className="w-6 h-6" />
                    </motion.div>
                    <motion.span
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + (i * 0.1), duration: 0.6 }}
                    >
                      {link.name}
                    </motion.span>
                  </Link>
                )
              })}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="w-full px-8 flex flex-col gap-4 mt-8 relative z-10"
            >
              <Link
                to="/cart"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between p-4 border border-emerald-200 bg-white rounded-2xl hover:bg-emerald-50 transition-all shadow-sm"
              >
                <span className="font-extrabold text-primary flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5" />
                  View Cart
                </span>
                <span className="bg-primary text-text-light text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold">
                  {getTotalItems()}
                </span>
              </Link>
              
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="w-full">
                  <Button variant="secondary" className="w-full py-4 text-base flex items-center justify-center gap-2">
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <div className="flex gap-3">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1">
                    <Button variant="ghost" className="w-full py-4 text-base border border-emerald-200 flex items-center justify-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Login
                    </Button>
                  </Link>
                  <Link to="/menu" onClick={() => setIsOpen(false)} className="flex-1">
                    <Button variant="primary" className="w-full py-4 text-base">Order Now</Button>
                  </Link>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
