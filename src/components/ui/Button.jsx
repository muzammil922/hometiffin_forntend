import React from 'react'
import { motion } from 'framer-motion'

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  id,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
  
  const variants = {
    primary: 'bg-primary text-text-light hover:bg-primary-dark shadow-subtle',
    secondary: 'bg-accent text-text-dark hover:bg-accent-light shadow-subtle',
    outline: 'border-2 border-primary text-text-dark bg-transparent hover:bg-accent-light',
    ghost: 'text-text-dark bg-transparent hover:bg-accent-light focus:ring-0 focus:ring-offset-0',
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg rounded-3xl',
  }

  return (
    <motion.button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </motion.button>
  )
}
