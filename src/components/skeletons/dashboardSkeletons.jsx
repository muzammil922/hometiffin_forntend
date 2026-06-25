import useIsDesktop from '../../hooks/useIsDesktop'

function ResponsiveSkeleton({ desktop, mobile }) {
  const isDesktop = useIsDesktop()
  return isDesktop ? desktop : mobile
}

/* ── Shared desktop blocks ── */
function HeaderBlock({ titleW = 'w-56', descW = 'w-80' }) {
  return (
    <div>
      <div className={`h-8 sm:h-9 bg-gray-200 rounded-lg ${titleW} mb-2`} />
      <div className={`h-4 bg-gray-100 rounded-xl ${descW}`} />
    </div>
  )
}

function OrderCardSkeleton({ detailed = false }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-emerald-100/50 shadow-sm">
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-gray-200 rounded-lg" />
          <div className="h-5 w-20 bg-gray-100 rounded-full" />
        </div>
        <div className="h-3 w-full max-w-md bg-gray-100 rounded-lg" />
        {detailed && <div className="h-3 w-48 bg-gray-100 rounded-lg" />}
        <div className="h-6 w-36 bg-gray-100 rounded-xl mt-1" />
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="h-5 w-16 bg-gray-200 rounded-lg" />
        <div className="h-9 w-24 bg-gray-100 rounded-xl" />
      </div>
    </div>
  )
}

function SearchBarSkeleton() {
  return (
    <div className="flex gap-3">
      <div className="flex-1 h-12 bg-white border border-emerald-100 rounded-2xl" />
      <div className="h-12 w-24 bg-gray-200 rounded-2xl shrink-0" />
    </div>
  )
}

function StatsRowSkeleton({ count = 4, cols = 'grid-cols-2 lg:grid-cols-4' }) {
  return (
    <div className={`grid ${cols} gap-4`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="p-5 bg-white border border-emerald-50 rounded-3xl h-24 shadow-sm" />
      ))}
    </div>
  )
}

/* ── Mobile building blocks (matches app mockup style) ── */
function MobileHeroBlock() {
  return (
    <div className="sticky top-[-16px] sm:top-[-24px] z-0 bg-gradient-to-br from-[#065F46] via-[#044e39] to-emerald-950 pt-10 pb-20 px-6 rounded-b-[40px] text-white overflow-hidden">
      <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-emerald-400/10 rounded-full blur-3xl" />
      <div className="relative z-10">
        <div className="h-7 w-48 bg-white/20 rounded-xl mb-2" />
        <div className="h-3 w-56 bg-white/10 rounded-lg" />
      </div>
      <div className="relative h-44 mt-6">
        <div className="absolute top-2 left-4 right-4 h-36 bg-white/5 border border-white/10 rounded-3xl rotate-1 scale-95 opacity-60" />
        <div className="absolute top-0 left-0 right-0 h-[152px] bg-gradient-to-tr from-white/15 to-white/5 border border-white/20 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <div className="h-2.5 w-28 bg-white/20 rounded mb-2" />
              <div className="h-6 w-36 bg-white/25 rounded-lg" />
            </div>
            <div className="w-6 h-6 bg-white/20 rounded-lg shrink-0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="h-2 w-14 bg-white/15 rounded mb-1.5" />
              <div className="h-4 w-16 bg-white/25 rounded" />
            </div>
            <div>
              <div className="h-2 w-16 bg-white/15 rounded mb-1.5 ml-auto" />
              <div className="h-4 w-20 bg-white/25 rounded ml-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MobileShell({ sticky, children }) {
  return (
    <div className="md:hidden flex flex-col -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] bg-[#F4F6F5] text-left relative animate-pulse">
      <MobileHeroBlock />
      <div className="bg-white -mt-16 pt-0 px-5 pb-24 relative z-20 min-h-[55vh] shadow-card flex flex-col gap-4 rounded-t-[36px]">
        {sticky && (
          <div className="sticky top-[-16px] sm:top-[-24px] z-30 bg-white pt-8 pb-4 -mx-5 px-5 border-b border-slate-100 rounded-t-[36px]">
            {sticky}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

function MobileTabStrip({ count = 2 }) {
  return (
    <div className="flex gap-2 bg-slate-100/85 p-1 rounded-2xl border border-slate-200/50">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`flex-1 h-11 rounded-xl ${i === 0 ? 'bg-gray-200' : 'bg-transparent'}`} />
      ))}
    </div>
  )
}

function MobileFilterBar() {
  return <div className="h-11 w-full bg-slate-100/85 rounded-2xl border border-slate-200/50" />
}

function MobileOrderCards({ count = 3 }) {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex flex-col gap-3 p-4 bg-white border border-emerald-50 rounded-[28px] shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="h-5 w-24 bg-gray-200 rounded-lg" />
            <div className="h-5 w-20 bg-gray-100 rounded-full" />
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-lg" />
          <div className="h-6 w-32 bg-gray-100 rounded-xl" />
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <div className="h-2 w-16 bg-gray-100 rounded mb-1" />
              <div className="h-5 w-24 bg-gray-200 rounded-lg" />
            </div>
            <div className="w-5 h-5 bg-gray-100 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MobileInfoCard() {
  return (
    <div className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col gap-3">
      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
        <div className="h-4 w-28 bg-gray-200 rounded-lg" />
        <div className="h-6 w-14 bg-gray-100 rounded-xl" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div className="h-2 w-20 bg-gray-100 rounded mb-1" />
          <div className="h-3 w-full bg-gray-200 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

function MobileTrackingStepper() {
  return (
    <div className="p-5 bg-white border border-emerald-100 rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-3 w-16 bg-gray-100 rounded" />
      </div>
      <div className="flex justify-between px-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-gray-100" />
            <div className="h-2 w-10 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

function MobileCalendarGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-4 bg-white border border-gray-100 rounded-2xl min-h-[120px] flex flex-col justify-between">
          <div className="h-3 w-12 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

function MobileStatCards({ count = 2 }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex flex-col gap-2.5 p-4 bg-white border border-emerald-50 rounded-2xl shadow-sm">
          <div className="w-10 h-10 bg-gray-100 rounded-xl" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
          <div className="h-6 w-20 bg-gray-200 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

function MobileAdminPage({ children }) {
  return (
    <div className="md:hidden flex flex-col gap-5 text-left w-full pb-20 animate-pulse">
      {children}
    </div>
  )
}

function DesktopOnly({ children }) {
  return <div className="hidden md:block">{children}</div>
}

/* ── Overview (Customer) ── */
export function OverviewSkeleton() {
  return (
    <ResponsiveSkeleton
      desktop={
        <div className="flex flex-col gap-8 text-left w-full px-1 animate-pulse">
          <HeaderBlock titleW="w-64" descW="w-80" />
          <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-4 pb-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-5 bg-white rounded-2xl border border-gray-100 flex flex-col gap-2 shrink-0 w-[200px] sm:w-[240px] lg:w-auto">
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-6 bg-gray-200 rounded w-28 mt-1" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="p-6 bg-white rounded-2xl border border-gray-100 flex flex-col gap-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <div className="flex flex-col gap-2">
                    <div className="h-3 bg-gray-200 rounded w-20" />
                    <div className="h-6 bg-gray-200 rounded w-48" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-16 bg-gray-100 rounded-xl" />
              </div>
              <div className="p-6 bg-white rounded-2xl border border-gray-100 flex flex-col gap-4">
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-5 bg-gray-200 rounded w-40" />
                <div className="h-2 bg-gray-100 rounded-full mt-4" />
              </div>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-gray-100 flex flex-col gap-4">
              <div className="h-5 bg-gray-200 rounded w-28 pb-3 border-b border-gray-100" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="h-2.5 bg-gray-200 rounded w-20" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      }
      mobile={
        <MobileShell sticky={<div className="h-12 w-full bg-gray-200 rounded-2xl" />}>
          <MobileTrackingStepper />
          <div className="p-5 bg-[#F9FBF9] border border-emerald-50 rounded-2xl flex flex-col gap-2">
            <div className="h-3 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded-lg" />
            <div className="h-3 w-5/6 bg-gray-100 rounded-lg" />
            <div className="h-8 w-40 bg-gray-100 rounded-xl mt-2" />
          </div>
          <MobileInfoCard />
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center pb-1">
              <div className="h-4 w-32 bg-gray-200 rounded-lg" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
            <MobileOrderCards count={3} />
          </div>
        </MobileShell>
      }
    />
  )
}

/* ── Admin Overview ── */
export function AdminOverviewSkeleton() {
  return (
    <>
      <DesktopOnly>
        <div className="flex flex-col gap-8 text-left w-full animate-pulse pb-12">
          <HeaderBlock titleW="w-64" descW="w-96" />
          <StatsRowSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 p-6 bg-white border border-emerald-50 rounded-3xl flex flex-col gap-6">
              <div className="flex justify-between items-center pb-3 border-b border-emerald-50/50">
                <div className="h-6 w-48 bg-gray-200 rounded-lg" />
                <div className="h-6 w-20 bg-gray-100 rounded-full" />
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center pb-4 border-b border-emerald-50/50 last:border-0">
                  <div>
                    <div className="h-4 w-32 bg-gray-200 rounded-lg mb-2" />
                    <div className="h-3 w-40 bg-gray-100 rounded-lg" />
                  </div>
                  <div className="h-6 w-16 bg-gray-100 rounded-lg" />
                </div>
              ))}
            </div>
            <div className="p-6 bg-white border border-emerald-50 rounded-3xl flex flex-col gap-4">
              <div className="h-5 w-36 bg-gray-200 rounded-lg mb-2" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </DesktopOnly>

      <MobileAdminPage>
        <HeaderBlock titleW="w-52" descW="w-full max-w-xs" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-white border border-emerald-50 rounded-2xl h-20" />
          ))}
        </div>
        <div className="p-5 bg-white border border-emerald-50 rounded-2xl flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-emerald-50 last:border-0">
              <div className="h-4 w-32 bg-gray-200 rounded-lg" />
              <div className="h-4 w-12 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </MobileAdminPage>
    </>
  )
}

/* ── Rider Overview ── */
export function RiderOverviewSkeleton() {
  return (
    <>
      <DesktopOnly>
        <div className="flex flex-col gap-8 text-left w-full animate-pulse pb-20 max-w-6xl">
          <HeaderBlock titleW="w-64" descW="w-80" />
          <StatsRowSkeleton cols="grid-cols-2 lg:grid-cols-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-emerald-50 rounded-3xl h-80 p-5 flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-24 bg-gray-200 rounded-lg" />
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                </div>
                <div className="flex flex-col gap-3 my-4">
                  <div className="h-4 w-32 bg-gray-100 rounded-md" />
                  <div className="h-4 w-48 bg-gray-100 rounded-md" />
                  <div className="h-4 w-28 bg-gray-100 rounded-md" />
                </div>
                <div className="h-10 w-full bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </DesktopOnly>

      <MobileAdminPage>
        <HeaderBlock titleW="w-56" descW="w-full max-w-xs" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-white border border-emerald-50 rounded-2xl h-20" />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-5 bg-white border border-emerald-50 rounded-3xl h-64 flex flex-col justify-between">
              <div className="h-5 w-24 bg-gray-200 rounded-lg" />
              <div className="flex flex-col gap-2">
                <div className="h-3 w-40 bg-gray-100 rounded" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
              <div className="h-10 w-full bg-gray-200 rounded-xl" />
            </div>
          ))}
        </div>
      </MobileAdminPage>
    </>
  )
}

/* ── Orders ── */
export function CustomerOrdersSkeleton() {
  return (
    <ResponsiveSkeleton
      desktop={
        <div className="flex flex-col gap-8 text-left w-full pb-20 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <HeaderBlock titleW="w-48" descW="w-72" />
            <div className="h-10 w-36 bg-white border border-emerald-100 rounded-2xl shrink-0" />
          </div>
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
      mobile={
        <MobileShell sticky={<MobileFilterBar />}>
          <MobileOrderCards count={4} />
        </MobileShell>
      }
    />
  )
}

export function AdminOrdersSkeleton() {
  return (
    <>
      <DesktopOnly>
        <div className="flex flex-col gap-8 text-left w-full pb-20 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <HeaderBlock titleW="w-56" descW="w-96" />
            <div className="h-11 w-32 bg-white border border-emerald-100 rounded-2xl shrink-0" />
          </div>
          <div className="flex gap-2 border-b border-emerald-50 pb-px">
            <div className="h-10 w-36 bg-gray-200 rounded-t-lg" />
            <div className="h-10 w-40 bg-gray-100 rounded-t-lg" />
          </div>
          <div className="h-10 w-36 bg-white border border-emerald-100 rounded-2xl" />
          <div className="flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <OrderCardSkeleton key={i} detailed />
            ))}
          </div>
        </div>
      </DesktopOnly>

      <MobileAdminPage>
        <HeaderBlock titleW="w-48" descW="w-full" />
        <div className="flex gap-2">
          <div className="h-10 flex-1 bg-gray-200 rounded-xl" />
          <div className="h-10 flex-1 bg-gray-100 rounded-xl" />
        </div>
        <MobileFilterBar />
        <div className="h-10 w-28 bg-white border border-emerald-100 rounded-2xl" />
        <MobileOrderCards count={4} />
      </MobileAdminPage>
    </>
  )
}

/* ── Subscription ── */
export function SubscriptionSkeleton() {
  return (
    <ResponsiveSkeleton
      desktop={
        <div className="flex flex-col gap-8 text-left w-full animate-pulse">
          <HeaderBlock titleW="w-56" descW="w-80" />
          <div className="p-8 bg-white rounded-3xl border border-emerald-50 flex flex-col gap-6">
            <div className="flex justify-between gap-4 pb-6 border-b border-gray-100">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-gray-200 rounded-2xl shrink-0" />
                <div className="flex flex-col gap-2">
                  <div className="h-5 bg-gray-200 rounded-lg w-40" />
                  <div className="h-3 bg-gray-100 rounded-lg w-28" />
                </div>
              </div>
              <div className="w-24 h-10 bg-gray-200 rounded-xl shrink-0" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl" />
              ))}
            </div>
            <div className="h-32 bg-gray-100 rounded-2xl" />
          </div>
        </div>
      }
      mobile={
        <MobileShell sticky={
          <div className="flex gap-3">
            <div className="flex-1 h-11 bg-gray-200 rounded-xl" />
            <div className="flex-1 h-11 bg-gray-100 rounded-xl" />
          </div>
        }>
          <MobileCalendarGrid />
          <div className="p-4 bg-emerald-50/30 border border-emerald-100/40 rounded-2xl flex flex-col gap-2">
            <div className="h-3 w-32 bg-gray-200 rounded" />
            <div className="h-2 w-full bg-gray-100 rounded-full" />
          </div>
        </MobileShell>
      }
    />
  )
}

/* ── Payments ── */
export function CustomerPaymentsSkeleton() {
  return (
    <ResponsiveSkeleton
      desktop={
        <div className="flex flex-col gap-8 text-left w-full pb-20 animate-pulse">
          <HeaderBlock titleW="w-56" descW="w-80" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-5 bg-white border border-emerald-50 rounded-3xl shadow-sm">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl shrink-0" />
                <div className="flex-1">
                  <div className="h-3 w-32 bg-gray-100 rounded-lg mb-2" />
                  <div className="h-7 w-24 bg-gray-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-emerald-100 w-fit">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-9 w-28 bg-gray-100 rounded-xl" />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
      mobile={
        <MobileShell sticky={<MobileTabStrip count={2} />}>
          <MobileStatCards count={2} />
          <MobileOrderCards count={4} />
        </MobileShell>
      }
    />
  )
}

export function AdminPaymentsSkeleton() {
  return (
    <>
      <DesktopOnly>
        <div className="flex flex-col gap-8 text-left w-full pb-20 animate-pulse">
          <HeaderBlock titleW="w-56" descW="w-96" />
          <SearchBarSkeleton />
          <div className="p-8 bg-white border border-emerald-50 rounded-3xl">
            <div className="h-5 w-56 bg-gray-200 rounded-lg pb-3 mb-6 border-b border-emerald-50" />
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center border-b border-emerald-50 pb-3">
                  <div className="h-4 w-20 bg-gray-200 rounded-lg" />
                  <div className="h-4 w-28 bg-gray-100 rounded-lg" />
                  <div className="h-4 flex-1 bg-gray-100 rounded-lg" />
                  <div className="h-4 w-16 bg-gray-200 rounded-lg" />
                  <div className="h-5 w-20 bg-gray-100 rounded-full" />
                  <div className="h-8 w-24 bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DesktopOnly>

      <MobileAdminPage>
        <HeaderBlock titleW="w-52" descW="w-full" />
        <SearchBarSkeleton />
        <div className="p-5 bg-white border border-emerald-50 rounded-2xl flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2 py-3 border-b border-emerald-50 last:border-0">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-16 bg-gray-100 rounded-full" />
              </div>
              <div className="h-3 w-full bg-gray-100 rounded" />
              <div className="h-3 w-2/3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </MobileAdminPage>
    </>
  )
}

/* ── Tracking ── */
export function TrackingSkeleton() {
  return (
    <>
      <DesktopOnly>
        <div className="flex flex-col gap-8 text-left w-full animate-pulse pb-16">
          <HeaderBlock titleW="w-64" descW="w-96" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="w-full h-[400px] rounded-3xl bg-gray-200 border border-gray-200" />
              <div className="p-6 bg-white rounded-3xl border border-gray-200">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                    <div className="flex flex-col gap-2">
                      <div className="h-4 w-32 bg-gray-200 rounded-lg" />
                      <div className="h-3 w-24 bg-gray-100 rounded-lg" />
                    </div>
                  </div>
                  <div className="w-24 h-10 bg-gray-200 rounded-2xl" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-white rounded-3xl border border-gray-200 flex flex-col gap-6">
              <div className="h-5 w-32 bg-gray-200 rounded-lg border-b border-gray-100 pb-3" />
              <div className="h-14 bg-gray-50 rounded-2xl border border-gray-100" />
              <div className="flex flex-col gap-6 border-l-2 border-gray-100 pl-4 ml-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-gray-200 bg-white" />
                    <div className="h-3 w-20 bg-gray-200 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DesktopOnly>

      <MobileAdminPage>
        <HeaderBlock titleW="w-48" descW="w-full" />
        <div className="w-full h-56 bg-gray-200 rounded-3xl" />
        <div className="p-5 bg-white rounded-2xl border border-gray-100 flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-2xl shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-gray-100 flex flex-col gap-4">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-gray-200 shrink-0" />
              <div className="h-3 w-24 bg-gray-100 rounded flex-1" />
            </div>
          ))}
        </div>
      </MobileAdminPage>
    </>
  )
}

/* ── Rider Tracker ── */
export function RiderTrackerSkeleton() {
  return (
    <>
      <DesktopOnly>
        <div className="flex flex-col gap-8 text-left w-full animate-pulse pb-16">
          <HeaderBlock titleW="w-48" descW="w-72" />
          <div className="p-8 bg-white rounded-3xl border border-emerald-50 flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full" />
            <div className="h-6 w-48 bg-gray-200 rounded-xl" />
            <div className="h-4 w-64 bg-gray-100 rounded-lg" />
            <div className="h-12 w-full max-w-xs bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </DesktopOnly>

      <MobileAdminPage>
        <HeaderBlock titleW="w-40" descW="w-full" />
        <div className="p-8 bg-white rounded-3xl border border-emerald-50 flex flex-col items-center gap-5">
          <div className="w-20 h-20 bg-gray-200 rounded-full" />
          <div className="h-5 w-44 bg-gray-200 rounded-xl" />
          <div className="h-3 w-full max-w-xs bg-gray-100 rounded-lg" />
          <div className="h-12 w-full bg-gray-200 rounded-2xl" />
        </div>
      </MobileAdminPage>
    </>
  )
}

/* ── Notifications ── */
export function NotificationsSkeleton() {
  return (
    <>
      <DesktopOnly>
        <div className="flex flex-col gap-8 text-left w-full animate-pulse">
          <HeaderBlock titleW="w-48" descW="w-80" />
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-emerald-100 w-fit">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-9 w-20 bg-gray-100 rounded-xl" />
            ))}
          </div>
          <div className="flex flex-col items-center justify-center py-20 gap-5 bg-white rounded-3xl border border-emerald-50">
            <div className="w-20 h-20 bg-emerald-50 rounded-full" />
            <div className="h-5 w-48 bg-gray-200 rounded-lg" />
            <div className="h-4 w-72 max-w-full bg-gray-100 rounded-lg" />
          </div>
        </div>
      </DesktopOnly>

      <MobileAdminPage>
        <HeaderBlock titleW="w-40" descW="w-full" />
        <MobileTabStrip count={3} />
        <div className="flex flex-col items-center py-16 gap-4 bg-white rounded-3xl border border-emerald-50">
          <div className="w-16 h-16 bg-emerald-50 rounded-full" />
          <div className="h-4 w-40 bg-gray-200 rounded-lg" />
          <div className="h-3 w-full max-w-[260px] bg-gray-100 rounded-lg" />
        </div>
      </MobileAdminPage>
    </>
  )
}

/* ── Complaints ── */
export function ComplaintsSkeleton({ isAdmin = false }) {
  const desktop = (
    <div className="flex flex-col gap-8 text-left w-full animate-pulse pb-20">
      <HeaderBlock titleW="w-56" descW="w-96" />
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-emerald-100 w-fit">
        <div className="h-9 w-28 bg-gray-200 rounded-xl" />
        <div className="h-9 w-24 bg-gray-100 rounded-xl" />
      </div>
      {isAdmin && (
        <div className="flex gap-2 bg-emerald-50/45 p-1 rounded-2xl border border-emerald-100/50 w-fit">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-28 bg-gray-100 rounded-xl" />
          ))}
        </div>
      )}
      {!isAdmin && <div className="h-14 w-full bg-gray-200 rounded-2xl" />}
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 bg-white border border-emerald-50 rounded-3xl h-36" />
        ))}
      </div>
    </div>
  )

  if (isAdmin) {
    return (
      <ResponsiveSkeleton
        desktop={desktop}
        mobile={
          <MobileAdminPage>
            <HeaderBlock titleW="w-52" descW="w-full" />
            <MobileTabStrip count={2} />
            <MobileTabStrip count={3} />
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-5 bg-white border border-emerald-50 rounded-2xl h-32" />
              ))}
            </div>
          </MobileAdminPage>
        }
      />
    )
  }

  return (
    <ResponsiveSkeleton
      desktop={desktop}
      mobile={
        <MobileShell sticky={<MobileTabStrip count={2} />}>
          <div className="h-14 w-full bg-gray-200 rounded-2xl" />
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-5 bg-white border border-emerald-50 rounded-[28px] h-32" />
            ))}
          </div>
        </MobileShell>
      }
    />
  )
}

/* ── Meals Manager ── */
export function MealsManagerSkeleton() {
  return (
    <>
      <DesktopOnly>
        <div className="flex flex-col gap-8 text-left w-full animate-pulse pb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <HeaderBlock titleW="w-48" descW="w-80" />
            <div className="flex gap-2">
              <div className="h-11 w-32 bg-white border border-emerald-100 rounded-2xl" />
              <div className="h-11 w-36 bg-gray-200 rounded-2xl" />
            </div>
          </div>
          <SearchBarSkeleton />
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 w-20 bg-white border border-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col p-6 bg-white rounded-3xl border border-emerald-100/50 shadow-md">
                <div className="w-full h-44 bg-gray-100 rounded-2xl mb-4" />
                <div className="h-4 w-3/4 bg-gray-200 rounded-lg mb-2" />
                <div className="h-3 w-full bg-gray-100 rounded-lg mb-4" />
                <div className="flex justify-between pt-4 border-t border-emerald-50">
                  <div className="h-6 w-20 bg-gray-200 rounded-lg" />
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DesktopOnly>

      <MobileAdminPage>
        <HeaderBlock titleW="w-44" descW="w-full" />
        <SearchBarSkeleton />
        <div className="flex flex-wrap gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-16 bg-white border border-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-white rounded-2xl border border-emerald-100/50">
              <div className="w-full h-36 bg-gray-100 rounded-xl mb-3" />
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </MobileAdminPage>
    </>
  )
}

/* ── Subscriptions Manager ── */
export function SubscriptionsManagerSkeleton() {
  return (
    <>
      <DesktopOnly>
        <div className="flex flex-col gap-8 text-left w-full animate-pulse pb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <HeaderBlock titleW="w-56" descW="w-96" />
            <div className="h-11 w-32 bg-white border border-emerald-100 rounded-2xl" />
          </div>
          <SearchBarSkeleton />
          <StatsRowSkeleton count={3} cols="grid-cols-1 sm:grid-cols-3" />
          <div className="p-8 bg-white border border-emerald-50 rounded-3xl">
            <div className="h-5 w-48 bg-gray-200 rounded-lg mb-6 border-b border-emerald-50 pb-3" />
            <div className="flex flex-col gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-emerald-50 rounded-2xl">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-4 w-40 bg-gray-200 rounded-lg" />
                    <div className="h-3 w-48 bg-gray-100 rounded-lg" />
                  </div>
                  <div className="flex gap-4">
                    <div className="h-4 w-16 bg-gray-200 rounded-lg" />
                    <div className="h-8 w-8 bg-gray-100 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DesktopOnly>

      <MobileAdminPage>
        <HeaderBlock titleW="w-52" descW="w-full" />
        <SearchBarSkeleton />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-4 bg-white border border-emerald-50 rounded-2xl h-20" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-white border border-emerald-50 rounded-2xl flex flex-col gap-2">
              <div className="h-4 w-36 bg-gray-200 rounded" />
              <div className="h-3 w-full bg-gray-100 rounded" />
              <div className="flex justify-between pt-2">
                <div className="h-4 w-16 bg-gray-100 rounded" />
                <div className="h-8 w-8 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </MobileAdminPage>
    </>
  )
}

/* ── Users Manager ── */
export function UsersManagerSkeleton() {
  return (
    <>
      <DesktopOnly>
        <div className="flex flex-col gap-8 text-left w-full animate-pulse pb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <HeaderBlock titleW="w-48" descW="w-80" />
            <div className="h-11 w-32 bg-white border border-emerald-100 rounded-2xl" />
          </div>
          <StatsRowSkeleton />
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 h-12 bg-white border border-emerald-100 rounded-2xl" />
            <div className="h-12 w-24 bg-gray-200 rounded-2xl shrink-0" />
            <div className="h-12 w-36 bg-white border border-emerald-100 rounded-2xl shrink-0" />
          </div>
          <div className="p-8 bg-white border border-emerald-50 rounded-3xl">
            <div className="h-5 w-52 bg-gray-200 rounded-lg mb-6 border-b border-emerald-50 pb-3" />
            <div className="flex flex-col gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-emerald-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 shrink-0" />
                    <div className="flex flex-col gap-2">
                      <div className="h-4 w-40 bg-gray-200 rounded-lg" />
                      <div className="h-3 w-48 bg-gray-100 rounded-lg" />
                    </div>
                  </div>
                  <div className="h-4 w-24 bg-gray-100 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DesktopOnly>

      <MobileAdminPage>
        <HeaderBlock titleW="w-44" descW="w-full" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 bg-white border border-emerald-50 rounded-2xl h-16" />
          ))}
        </div>
        <SearchBarSkeleton />
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-white border border-emerald-50 rounded-2xl">
              <div className="w-11 h-11 bg-gray-100 rounded-2xl shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </MobileAdminPage>
    </>
  )
}

/* ── Banners Manager ── */
export function BannersManagerSkeleton() {
  return (
    <>
      <DesktopOnly>
        <div className="flex flex-col gap-6 text-left animate-pulse">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <HeaderBlock titleW="w-56" descW="w-80" />
            <div className="h-11 w-40 bg-gray-200 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-emerald-100/50 p-6 h-64" />
            ))}
          </div>
        </div>
      </DesktopOnly>

      <MobileAdminPage>
        <HeaderBlock titleW="w-48" descW="w-full" />
        <div className="h-11 w-full bg-gray-200 rounded-2xl" />
        <div className="flex flex-col gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-emerald-100/50 p-4 h-52" />
          ))}
        </div>
      </MobileAdminPage>
    </>
  )
}

/* ── Templates ── */
export function TemplatesCustomizerSkeleton() {
  return (
    <>
      <DesktopOnly>
        <div className="flex flex-col gap-8 text-left w-full animate-pulse">
          <HeaderBlock titleW="w-64" descW="w-96" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="flex flex-col gap-2">
              <div className="h-4 w-24 bg-gray-200 rounded-lg mb-1" />
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-12 w-full bg-gray-100 rounded-2xl" />
              ))}
            </div>
            <div className="lg:col-span-2 p-8 bg-white border border-emerald-100 rounded-3xl flex flex-col gap-5">
              <div className="flex justify-between items-center pb-4 border-b border-emerald-50">
                <div className="h-5 w-48 bg-gray-200 rounded-xl" />
                <div className="h-9 w-28 bg-gray-100 rounded-xl" />
              </div>
              <div className="h-52 w-full bg-gray-100 rounded-2xl" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-7 w-24 bg-primary/10 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </DesktopOnly>

      <MobileAdminPage>
        <HeaderBlock titleW="w-52" descW="w-full" />
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-11 w-full bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="p-5 bg-white border border-emerald-100 rounded-2xl flex flex-col gap-4">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="h-40 w-full bg-gray-100 rounded-xl" />
          <div className="flex flex-wrap gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-7 w-20 bg-primary/10 rounded-lg" />
            ))}
          </div>
        </div>
      </MobileAdminPage>
    </>
  )
}

/* ── WhatsApp Connector ── */
export function WhatsAppConnectorSkeleton() {
  return (
    <>
      <DesktopOnly>
        <div className="flex flex-col gap-8 text-left w-full animate-pulse">
          <HeaderBlock titleW="w-56" descW="w-80" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-8 bg-white border border-emerald-50 rounded-3xl flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-2xl" />
              <div className="h-5 w-40 bg-gray-200 rounded-lg" />
              <div className="h-4 w-56 bg-gray-100 rounded-lg" />
              <div className="w-64 h-64 bg-gray-100 rounded-2xl" />
            </div>
            <div className="p-8 bg-white border border-emerald-50 rounded-3xl flex flex-col gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 w-full bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </DesktopOnly>

      <MobileAdminPage>
        <HeaderBlock titleW="w-48" descW="w-full" />
        <div className="p-6 bg-white border border-emerald-50 rounded-2xl flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
          <div className="h-4 w-36 bg-gray-200 rounded" />
          <div className="w-full max-w-[220px] aspect-square bg-gray-100 rounded-2xl" />
        </div>
        <div className="p-5 bg-white border border-emerald-50 rounded-2xl flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-11 w-full bg-gray-100 rounded-xl" />
          ))}
        </div>
      </MobileAdminPage>
    </>
  )
}

/* ── Rider Registry ── */
export function RiderRegistrySkeleton() {
  return (
    <>
      <DesktopOnly>
        <div className="flex flex-col gap-8 text-left w-full animate-pulse pb-20">
          <HeaderBlock titleW="w-48" descW="w-72" />
          <div className="p-8 bg-white border border-emerald-50 rounded-3xl flex flex-col gap-5 max-w-xl">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 w-full bg-gray-100 rounded-xl" />
            ))}
            <div className="h-12 w-full bg-gray-200 rounded-2xl mt-2" />
          </div>
        </div>
      </DesktopOnly>

      <MobileAdminPage>
        <HeaderBlock titleW="w-44" descW="w-full" />
        <div className="p-5 bg-white border border-emerald-50 rounded-2xl flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 w-full bg-gray-100 rounded-xl" />
          ))}
          <div className="h-12 w-full bg-gray-200 rounded-xl" />
        </div>
      </MobileAdminPage>
    </>
  )
}

/* ── Earnings / Rider Payments ── */
export function EarningsTableSkeleton() {
  return (
    <>
      <DesktopOnly>
        <div className="flex flex-col gap-8 text-left w-full animate-pulse pb-20">
          <HeaderBlock titleW="w-48" descW="w-72" />
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 h-12 bg-white border border-emerald-100 rounded-2xl" />
            <div className="h-12 w-36 bg-white border border-emerald-100 rounded-2xl shrink-0" />
          </div>
          <div className="p-6 bg-white border border-emerald-50 rounded-3xl">
            <div className="h-5 w-40 bg-gray-200 rounded-lg mb-6" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-4 border-b border-emerald-50 last:border-0">
                <div className="h-4 w-32 bg-gray-200 rounded-lg" />
                <div className="h-4 w-20 bg-gray-100 rounded-lg" />
                <div className="h-4 w-24 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </DesktopOnly>

      <MobileAdminPage>
        <HeaderBlock titleW="w-44" descW="w-full" />
        <div className="flex flex-col gap-3">
          <div className="h-11 w-full bg-white border border-emerald-100 rounded-2xl" />
          <div className="h-11 w-full bg-white border border-emerald-100 rounded-2xl" />
        </div>
        <div className="p-5 bg-white border border-emerald-50 rounded-2xl flex flex-col gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-emerald-50 last:border-0">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </MobileAdminPage>
    </>
  )
}
