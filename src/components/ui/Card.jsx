import React from 'react'

export default function Card({
  children,
  className = '',
  hoverable = true,
  onClick,
  id,
  ...props
}) {
  const baseStyles = 'bg-white rounded-3xl border border-emerald-100 p-6 shadow-subtle transition-all duration-300'
  const hoverStyles = hoverable ? 'hover:shadow-card hover:border-accent hover:-translate-y-1 cursor-pointer' : ''

  return (
    <div
      id={id}
      onClick={onClick}
      className={`${baseStyles} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
