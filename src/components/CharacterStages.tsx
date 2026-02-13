// Custom SVG icons for character stages

interface StageIconProps {
  size?: number
  className?: string
}

// Stage 1: Яйцо (бирюзовое с узором)
export function EggIcon({ size = 48, className = '' }: StageIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <ellipse cx="24" cy="26" rx="14" ry="18" fill="url(#eggGradient)" />
      <ellipse cx="24" cy="26" rx="14" ry="18" fill="none" stroke="#7dd3fc" strokeWidth="2" />
      {/* Spots */}
      <circle cx="18" cy="20" r="3" fill="#a5f3fc" opacity="0.6" />
      <circle cx="28" cy="30" r="2.5" fill="#a5f3fc" opacity="0.6" />
      <circle cx="22" cy="36" r="2" fill="#a5f3fc" opacity="0.6" />
      {/* Shine */}
      <ellipse cx="18" cy="18" rx="3" ry="4" fill="white" opacity="0.4" />
      <defs>
        <linearGradient id="eggGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Stage 2: Маленькая гусеница (зелёная, 3 сегмента)
export function SmallCaterpillarIcon({ size = 48, className = '' }: StageIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      {/* Body segments */}
      <circle cx="14" cy="28" r="7" fill="#4ade80" stroke="#22c55e" strokeWidth="1.5" />
      <circle cx="24" cy="26" r="8" fill="#4ade80" stroke="#22c55e" strokeWidth="1.5" />
      <circle cx="34" cy="28" r="7" fill="#4ade80" stroke="#22c55e" strokeWidth="1.5" />
      {/* Head */}
      <circle cx="40" cy="24" r="6" fill="#86efac" stroke="#22c55e" strokeWidth="1.5" />
      {/* Eyes */}
      <circle cx="38" cy="22" r="2" fill="white" />
      <circle cx="42" cy="22" r="2" fill="white" />
      <circle cx="38" cy="22" r="1" fill="#1e293b" />
      <circle cx="42" cy="22" r="1" fill="#1e293b" />
      {/* Antennae */}
      <path d="M38 18 Q36 12 34 14" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M42 18 Q44 12 46 14" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <circle cx="44" cy="26" r="1.5" fill="#fda4af" opacity="0.6" />
    </svg>
  )
}

// Stage 3: Средняя гусеница (5 сегментов, толще)
export function MediumCaterpillarIcon({ size = 48, className = '' }: StageIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      {/* Body segments */}
      <circle cx="6" cy="30" r="5" fill="#4ade80" stroke="#16a34a" strokeWidth="1.5" />
      <circle cx="14" cy="28" r="6" fill="#4ade80" stroke="#16a34a" strokeWidth="1.5" />
      <circle cx="23" cy="26" r="7" fill="#4ade80" stroke="#16a34a" strokeWidth="1.5" />
      <circle cx="32" cy="26" r="7" fill="#4ade80" stroke="#16a34a" strokeWidth="1.5" />
      <circle cx="40" cy="28" r="6" fill="#4ade80" stroke="#16a34a" strokeWidth="1.5" />
      {/* Head */}
      <circle cx="46" cy="22" r="5" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" />
      {/* Eyes */}
      <circle cx="44" cy="20" r="2" fill="white" />
      <circle cx="48" cy="20" r="1.5" fill="white" />
      <circle cx="44" cy="20" r="1" fill="#1e293b" />
      <circle cx="48" cy="20" r="0.8" fill="#1e293b" />
      {/* Antennae */}
      <path d="M44 16 Q42 10 40 12" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M48 16 Q50 10 52 12" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Pattern on segments */}
      <circle cx="23" cy="24" r="2" fill="#86efac" opacity="0.7" />
      <circle cx="32" cy="24" r="2" fill="#86efac" opacity="0.7" />
      {/* Smile */}
      <path d="M44 24 Q46 26 48 24" stroke="#16a34a" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// Stage 4: Большая гусеница (7 сегментов, мощная)
export function LargeCaterpillarIcon({ size = 48, className = '' }: StageIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 48" className={className}>
      {/* Body segments with gradient */}
      <circle cx="4" cy="32" r="4" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
      <circle cx="11" cy="30" r="5" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
      <circle cx="19" cy="28" r="6" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
      <circle cx="28" cy="26" r="7" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
      <circle cx="37" cy="26" r="7" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
      <circle cx="45" cy="28" r="6" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
      <circle cx="52" cy="30" r="5" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
      {/* Head */}
      <circle cx="58" cy="24" r="6" fill="#4ade80" stroke="#15803d" strokeWidth="2" />
      {/* Eyes */}
      <circle cx="56" cy="22" r="2.5" fill="white" />
      <circle cx="61" cy="22" r="2.5" fill="white" />
      <circle cx="56" cy="22" r="1.2" fill="#1e293b" />
      <circle cx="61" cy="22" r="1.2" fill="#1e293b" />
      {/* Strong eyebrows */}
      <path d="M54 19 L57 20" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M63 19 L60 20" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
      {/* Antennae with bulbs */}
      <path d="M55 17 Q53 10 50 11" stroke="#15803d" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M61 17 Q63 10 66 11" stroke="#15803d" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="11" r="2" fill="#fbbf24" />
      <circle cx="66" cy="11" r="2" fill="#fbbf24" />
      {/* Pattern */}
      <circle cx="28" cy="24" r="2.5" fill="#86efac" />
      <circle cx="37" cy="24" r="2.5" fill="#86efac" />
      {/* Confident smile */}
      <path d="M56 27 Q59 30 62 27" stroke="#15803d" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// Stage 5: Куколка/Кокон
export function ChrysalisIcon({ size = 48, className = '' }: StageIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      {/* Cocoon body */}
      <ellipse cx="24" cy="28" rx="10" ry="16" fill="url(#chrysalisGradient)" />
      <ellipse cx="24" cy="28" rx="10" ry="16" fill="none" stroke="#a78bfa" strokeWidth="2" />
      {/* Texture lines */}
      <path d="M16 20 Q24 18 32 20" stroke="#8b5cf6" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M15 26 Q24 24 33 26" stroke="#8b5cf6" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M15 32 Q24 30 33 32" stroke="#8b5cf6" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M16 38 Q24 36 32 38" stroke="#8b5cf6" strokeWidth="1" fill="none" opacity="0.5" />
      {/* Glow effect */}
      <ellipse cx="24" cy="28" rx="6" ry="10" fill="#c4b5fd" opacity="0.3" />
      {/* Attachment point */}
      <path d="M24 12 L24 8" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="6" r="3" fill="#a78bfa" />
      {/* Sparkles */}
      <circle cx="18" cy="24" r="1" fill="white" opacity="0.8" />
      <circle cx="28" cy="32" r="1.5" fill="white" opacity="0.6" />
      <defs>
        <linearGradient id="chrysalisGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Stage 6: Бабочка!
export function ButterflyIcon({ size = 48, className = '' }: StageIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      {/* Upper wings */}
      <path d="M24 24 Q8 8 4 20 Q6 28 24 24" fill="url(#wingGradient1)" stroke="#f472b6" strokeWidth="1" />
      <path d="M24 24 Q40 8 44 20 Q42 28 24 24" fill="url(#wingGradient1)" stroke="#f472b6" strokeWidth="1" />
      {/* Lower wings */}
      <path d="M24 24 Q10 32 8 40 Q16 44 24 28" fill="url(#wingGradient2)" stroke="#f472b6" strokeWidth="1" />
      <path d="M24 24 Q38 32 40 40 Q32 44 24 28" fill="url(#wingGradient2)" stroke="#f472b6" strokeWidth="1" />
      {/* Wing patterns */}
      <circle cx="12" cy="18" r="4" fill="#fef3c7" opacity="0.8" />
      <circle cx="36" cy="18" r="4" fill="#fef3c7" opacity="0.8" />
      <circle cx="12" cy="18" r="2" fill="#f472b6" opacity="0.6" />
      <circle cx="36" cy="18" r="2" fill="#f472b6" opacity="0.6" />
      <circle cx="14" cy="36" r="2.5" fill="#fef3c7" opacity="0.7" />
      <circle cx="34" cy="36" r="2.5" fill="#fef3c7" opacity="0.7" />
      {/* Body */}
      <ellipse cx="24" cy="26" rx="3" ry="10" fill="#1e293b" />
      {/* Head */}
      <circle cx="24" cy="14" r="4" fill="#1e293b" />
      {/* Eyes */}
      <circle cx="22" cy="13" r="1.5" fill="white" />
      <circle cx="26" cy="13" r="1.5" fill="white" />
      <circle cx="22" cy="13" r="0.7" fill="#1e293b" />
      <circle cx="26" cy="13" r="0.7" fill="#1e293b" />
      {/* Antennae */}
      <path d="M22 10 Q20 4 18 6" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M26 10 Q28 4 30 6" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="18" cy="6" r="1.5" fill="#fbbf24" />
      <circle cx="30" cy="6" r="1.5" fill="#fbbf24" />
      <defs>
        <linearGradient id="wingGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f9a8d4" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
        <linearGradient id="wingGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Export all stages
export const STAGE_ICONS = {
  egg: EggIcon,
  caterpillar_1: SmallCaterpillarIcon,
  caterpillar_2: MediumCaterpillarIcon,
  caterpillar_3: LargeCaterpillarIcon,
  chrysalis: ChrysalisIcon,
  butterfly: ButterflyIcon,
}
