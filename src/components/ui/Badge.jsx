import React from 'react'

export default function Badge({
  children,
  variant = 'primary', // 'primary' | 'accent' | 'success' | 'warning' | 'danger'
  className = '',
  id,
  ...props
}) {
  const baseStyles = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border'
  
  const variants = {
    primary: 'bg-primary/10 border-primary/20 text-text-dark',
    accent: 'bg-accent border-accent/30 text-text-dark',
    success: 'bg-emerald-100 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-100 border-amber-200 text-amber-800',
    danger: 'bg-rose-100 border-rose-200 text-rose-800',
  }

  return (
    <span
      id={id}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
