import { cn } from "@/lib/utils";

export interface HeroCharacterProps {
  className?: string;
}

export function HeroCharacter({ className }: HeroCharacterProps) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[4/5] w-full max-w-[280px] xs:max-w-[300px] md:max-w-[360px] lg:max-w-[400px]",
        className,
      )}
    >
      <svg
        viewBox="0 0 420 540"
        role="img"
        aria-label="Stylized illustration of Nida Asghar, an AI engineer, holding a glowing staff"
        className="h-full w-full"
      >
        <defs>
          <radialGradient id="platformGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#050816" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hairShade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1233" />
            <stop offset="45%" stopColor="#2a1848" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
          <linearGradient id="hoodieShade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1b2340" />
            <stop offset="100%" stopColor="#0b1020" />
          </linearGradient>
          <linearGradient id="skinShade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8c4a8" />
            <stop offset="100%" stopColor="#c99574" />
          </linearGradient>
          <linearGradient id="staffShade" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <radialGradient id="crystalGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="40%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#38BDF8" />
          </radialGradient>
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse cx="210" cy="500" rx="150" ry="28" fill="url(#platformGlow)" />
        <ellipse
          cx="210"
          cy="500"
          rx="92"
          ry="12"
          fill="none"
          stroke="#8B5CF6"
          strokeOpacity="0.35"
        />

        <path
          d="M118 248 C110 200 128 150 168 128 C150 188 146 250 152 318 L200 330 L268 318 C274 248 268 186 250 128 C292 148 314 204 304 256 C318 300 300 360 276 400 L210 428 L148 400 C124 358 112 302 118 248 Z"
          fill="url(#hoodieShade)"
          stroke="#38BDF8"
          strokeOpacity="0.18"
        />
        <path
          d="M186 318 L210 338 L236 318"
          fill="none"
          stroke="#8B5CF6"
          strokeOpacity="0.45"
          strokeWidth="2"
        />

        <path
          d="M146 168 C132 120 168 72 214 78 C248 58 304 78 312 128 C330 164 318 206 300 230 C288 168 270 126 238 112 C220 168 214 214 220 258 C198 264 176 258 164 236 C150 214 148 188 146 168 Z"
          fill="url(#hairShade)"
        />
        <path
          d="M168 86 C188 70 236 66 262 90 C230 88 200 98 176 118"
          fill="#3b1d6e"
        />

        <ellipse cx="214" cy="168" rx="38" ry="46" fill="url(#skinShade)" />
        <path
          d="M190 154 C198 150 206 152 210 158"
          fill="none"
          stroke="#2b1c14"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M224 154 C230 150 238 152 240 158"
          fill="none"
          stroke="#2b1c14"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="200" cy="164" r="3.2" fill="#1e293b" />
        <circle cx="230" cy="164" r="3.2" fill="#1e293b" />
        <path
          d="M206 184 C212 188 220 188 226 184"
          fill="none"
          stroke="#8b5a3c"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        <path
          d="M268 250 C286 236 312 248 318 274 C296 270 278 278 268 292 Z"
          fill="url(#skinShade)"
        />

        <g filter="url(#softGlow)">
          <rect
            x="312"
            y="168"
            width="8"
            height="190"
            rx="4"
            fill="url(#staffShade)"
            transform="rotate(12 316 263)"
          />
          <polygon
            points="328,148 348,176 328,198 308,176"
            fill="url(#crystalGlow)"
          />
        </g>

        <circle cx="118" cy="210" r="3" fill="#38BDF8" opacity="0.8" />
        <circle cx="332" cy="230" r="2.4" fill="#8B5CF6" opacity="0.85" />
        <circle cx="96" cy="320" r="2" fill="#38BDF8" opacity="0.55" />
        <circle cx="348" cy="310" r="2.6" fill="#c4b5fd" opacity="0.7" />
        <circle cx="150" cy="430" r="2" fill="#8B5CF6" opacity="0.5" />
        <circle cx="280" cy="446" r="2.2" fill="#38BDF8" opacity="0.45" />
      </svg>
    </div>
  );
}
