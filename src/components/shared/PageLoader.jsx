export default function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF8E7]">
      <div
        className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin"
        role="status"
        aria-label="Loading page"
      />
    </div>
  )
}
