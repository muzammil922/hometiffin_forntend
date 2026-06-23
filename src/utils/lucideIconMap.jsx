import {
  ArrowRight,
  ShoppingCart,
  Compass,
  Sparkles,
  Gift,
  Clock,
  Salad,
  Heart,
  Info,
} from 'lucide-react'

export const LUCIDE_ICON_MAP = {
  ArrowRight,
  ShoppingCart,
  Compass,
  Sparkles,
  Gift,
  Clock,
  Salad,
  Heart,
  Info,
}

export function DynamicLucideIcon({ name, className }) {
  const Icon = LUCIDE_ICON_MAP[name] || ArrowRight
  return <Icon className={className} />
}
