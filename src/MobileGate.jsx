export default function MobileGate() {
  return (
    <div className="mobile-gate">
      <div className="mobile-gate-content">
        <div className="mobile-gate-icon">
          <svg width="40" height="40" viewBox="0 0 180 180" fill="none">
            <rect x="16" y="16" width="148" height="148" rx="74" fill="url(#mg)" stroke="#000" strokeWidth="16"/>
            <rect x="24" y="24" width="132" height="132" rx="66" stroke="#fff" strokeWidth="8"/>
            <defs>
              <linearGradient id="mg" x1="90" y1="24" x2="90" y2="156" gradientUnits="userSpaceOnUse">
                <stop stopColor="#E0E0E0"/>
                <stop offset="0.25" stopColor="#A8A8A8"/>
                <stop offset="0.5" stopColor="#707070"/>
                <stop offset="0.75" stopColor="#383838"/>
                <stop offset="1" stopColor="#101010"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className="mobile-gate-title">Caster</h1>
        <p className="mobile-gate-desc">
          Caster is a desktop experience for tuning 3D shadows, blinds, and particles in real time. Open this page on a computer to get started.
        </p>
        <a
          href="https://www.andreavollendorf.com/"
          className="mobile-gate-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          andreavollendorf.com
        </a>
      </div>
    </div>
  )
}
