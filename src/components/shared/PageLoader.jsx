import React from 'react'
import AnimatedLogo from './AnimatedLogo'

export default function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF8E7] gap-8">
      <div className="flex flex-col items-center gap-6">
        {/* Large Logo with a faster 1.5s switch interval */}
        <AnimatedLogo className="h-28" interval={1500} />
        
        <div className="flex flex-col items-center gap-3">
          {/* Loading bar container */}
          <div className="w-56 h-1.5 bg-emerald-800/10 rounded-full overflow-hidden">
            {/* Loading bar fill */}
            <div 
              className="h-full bg-primary rounded-full"
              style={{
                animation: 'loadingFill 2s infinite cubic-bezier(0.25, 1, 0.5, 1)'
              }}
            />
          </div>
          <span className="text-xs font-black text-primary/70 tracking-widest uppercase animate-pulse">
            Loading Freshness...
          </span>
        </div>
      </div>

      <style>{`
        @keyframes loadingFill {
          0% {
            width: 0%;
            opacity: 0.8;
          }
          80% {
            width: 100%;
            opacity: 1;
          }
          100% {
            width: 100%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
