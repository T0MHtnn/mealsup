import { useUiStore, resolveIsDark } from '@/store/uiStore'

interface LogoProps {
  /** 'default' = adapts to light/dark theme. 'reversed' = always white, for a primary/colored background. */
  variant?: 'default' | 'reversed'
  iconOnly?: boolean
  size?: number
  className?: string
}

export default function Logo({ variant = 'default', iconOnly = false, size = 40, className = '' }: LogoProps) {
  const theme = useUiStore((state) => state.theme)
  const isDark = variant === 'reversed' ? true : typeof window !== 'undefined' && resolveIsDark(theme)

  if (iconOnly) {
    return <img src="/brand/icon.png" alt="MealsUp" width={size} height={size} className={className} />
  }

  const src = isDark ? '/brand/logo-reversed.png' : '/brand/logo.png'
  return <img src={src} alt="MealsUp" style={{ height: size }} className={className} />
}
