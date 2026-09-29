const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/** 全屏极淡的动态胶片颗粒。 */
export function GrainOverlay() {
  return (
    <div
      aria-hidden
      className='pointer-events-none fixed inset-0 z-[80] overflow-hidden opacity-[.085] mix-blend-overlay'
    >
      <div className='absolute -inset-[20%] animate-grain' style={{ backgroundImage: NOISE }} />
    </div>
  )
}
