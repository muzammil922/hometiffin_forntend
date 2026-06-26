import React, { useState, useEffect } from 'react'

export default function AnimatedLogo({ className = 'h-8', interval = 3000 }) {
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setShowAnimation((prev) => !prev)
    }, interval)
    return () => clearInterval(timer)
  }, [interval])

  return (
    <div className={`relative inline-block select-none aspect-[317/461] ${className}`}>
      {/* Primary Logo (outline / transparent version) - Always visible to prevent white flash */}
      <img
        src="/logo.svg"
        alt="Home Tiffin Logo"
        className="h-full w-full object-contain"
        style={{ pointerEvents: 'none' }}
      />
      {/* Animated Logo (filled background version) - Wipes up from the bottom */}
      <div
        className="absolute inset-0 transition-all duration-[1200ms] ease-in-out"
        style={{
          clipPath: showAnimation ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)',
          pointerEvents: 'none',
        }}
      >
        <img
          src="/logo animation.svg"
          alt="Home Tiffin Logo Animated"
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  )
}
