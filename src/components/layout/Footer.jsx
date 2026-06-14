import React from 'react'
import { Link } from 'react-router-dom'
import { Phone, Mail } from 'lucide-react'

export default function Footer({ collapsible = false }) {
  const footerClasses = collapsible
    ? "relative bg-primary text-text-light px-6 py-4 hover:py-12 mt-auto border-t border-primary-dark transition-all duration-700 ease-in-out max-h-[68px] hover:max-h-[600px] overflow-hidden group/footer text-left cursor-pointer"
    : "bg-primary text-text-light px-6 py-12 mt-auto border-t border-primary-dark text-left"

  return (
    <footer className={footerClasses}>
      {collapsible && (
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto h-9 opacity-100 group-hover/footer:opacity-0 group-hover/footer:pointer-events-none transition-opacity duration-300">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-white">🍱 Home Tiffin</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-semibold text-accent-light leading-none">
              ⚡ Order fresh home-cooked tiffins! Hot, healthy, and hygienic meals delivered daily across Karachi.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#menu-list" className="bg-accent text-primary px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-white transition-all shadow-sm">
              Order Now
            </a>
            <span className="text-[9px] text-accent-light/50 font-bold uppercase tracking-wider animate-pulse hidden sm:inline-block">
              Hover to expand info ↓
            </span>
          </div>
        </div>
      )}

      {/* Main Footer content wrapper */}
      <div className={`transition-all duration-500 ${collapsible ? 'opacity-0 group-hover/footer:opacity-100 pointer-events-none group-hover/footer:pointer-events-auto mt-0 group-hover/footer:-mt-9' : ''}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand/Logo column */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="text-2xl font-bold tracking-tight text-white flex items-center">
              🍱 Home Tiffin
            </Link>
            <p className="text-sm text-accent-light leading-relaxed">
              Ghar ka khana, aapke darwaze tak. Karachi's premium daily home-cooked meal and tiffin service.
            </p>
          </div>

          {/* Links Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-base font-bold text-white mb-1">Quick Links</h4>
            <Link to="/" className="text-sm text-accent-light hover:text-white transition-all">Home</Link>
            <Link to="/menu" className="text-sm text-accent-light hover:text-white transition-all">Meal Menu</Link>
            <Link to="/#pricing" className="text-sm text-accent-light hover:text-white transition-all">Pricing Plans</Link>
            <Link to="/#about" className="text-sm text-accent-light hover:text-white transition-all">About Us</Link>
          </div>

          {/* Contact info column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-base font-bold text-white mb-1">Contact Us</h4>
            <div className="flex items-center gap-2 text-sm text-accent-light">
              <Phone className="w-4 h-4" />
              <span>+92 300 0000000</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-accent-light">
              <Mail className="w-4 h-4" />
              <span>info@hometiffin.pk</span>
            </div>
            <span className="text-xs text-accent-light/75"> Karachi delivery coverage zones.</span>
          </div>

          {/* Social media column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-base font-bold text-white mb-1">Follow Our Journey</h4>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 bg-primary-dark hover:bg-accent text-white hover:text-text-dark rounded-xl transition-all" aria-label="Follow us on Instagram">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a href="#" className="p-2 bg-primary-dark hover:bg-accent text-white hover:text-text-dark rounded-xl transition-all" aria-label="Follow us on Facebook">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="#" className="p-2 bg-primary-dark hover:bg-accent text-white hover:text-text-dark rounded-xl transition-all" aria-label="Follow us on Twitter">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-primary-dark/50 text-center text-xs text-accent-light/60">
          © 2024 Home Tiffin. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
