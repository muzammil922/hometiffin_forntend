import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ShoppingCart, User, ChefHat } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'
import Button from '../ui/Button'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated, user } = useAuthStore()
  const { getTotalItems } = useCartStore()

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Menu', path: '/menu' },
    { name: 'Pricing', path: '/#pricing' },
    { name: 'About', path: '/#about' },
    { name: 'Contact', path: '/#contact' },
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
          <Link to="/cart" className="relative p-2 hover:bg-accent-light rounded-xl transition-all cursor-pointer">
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

        {/* Mobile Hamburger Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-primary hover:bg-accent-light rounded-xl cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden absolute top-[73px] left-0 right-0 bg-background border-b border-accent px-6 py-6 flex flex-col gap-6 shadow-card transition-all">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`text-base font-semibold tracking-wide hover:text-primary py-2 border-b border-accent/10 ${
                  isActive(link.path) ? 'text-primary' : 'text-primary/75'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <Link
              to="/cart"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-3 border border-accent rounded-2xl hover:bg-accent-light transition-all"
            >
              <span className="font-semibold text-primary">View Cart</span>
              <div className="flex items-center gap-2 text-primary">
                <ShoppingCart className="w-5 h-5" />
                <span className="bg-primary text-text-light text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {getTotalItems()}
                </span>
              </div>
            </Link>
            
            {isAuthenticated ? (
              <Link to="/dashboard" onClick={() => setIsOpen(false)} className="w-full">
                <Button variant="secondary" className="w-full">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)} className="w-full">
                  <Button variant="ghost" className="w-full">Login</Button>
                </Link>
                <Link to="/menu" onClick={() => setIsOpen(false)} className="w-full">
                  <Button variant="primary" className="w-full">Order Now</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
