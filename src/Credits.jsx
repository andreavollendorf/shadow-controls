import { useState } from 'react'
import { createPortal } from 'react-dom'

export default function Credits() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="credits-trigger" onClick={() => setOpen(true)} aria-label="Credits">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="8" cy="4.5" r="0.75" fill="currentColor"/>
        </svg>
      </button>

      {open && createPortal(
        <div className="credits-overlay" onClick={() => setOpen(false)}>
          <div className="credits-modal" onClick={e => e.stopPropagation()}>
            <div className="credits-header">
              <span className="credits-title">Caster</span>
              <button className="credits-close" onClick={() => setOpen(false)}>x</button>
            </div>
            <div className="credits-body">
              <p className="credits-desc">
                A configurable 3D shadow and particle visualization tool.
              </p>

              <div className="credits-section">
                <span className="credits-label">Built by</span>
                <a href="https://www.andreavollendorf.com/" target="_blank" rel="noopener noreferrer">Andrea Vollendorf</a>
              </div>

              <div className="credits-section">
                <span className="credits-label">Based on</span>
                <a href="https://basement.studio/post/creating-daylight-or-the-shadows" target="_blank" rel="noopener noreferrer">Basement Studio — "Creating Daylight"</a>
                <a href="https://codesandbox.io/p/sandbox/focused-dirac-3w6cxs" target="_blank" rel="noopener noreferrer">@0xca0a (Paul Henschel) — R3F Demo</a>
              </div>

              <div className="credits-section">
                <span className="credits-label">Inspired by</span>
                <a href="https://joshpuckett.me/dialkit" target="_blank" rel="noopener noreferrer">Josh Puckett — DialKit</a>
              </div>

              <div className="credits-divider" />

              <div className="credits-section">
                <span className="credits-label">Found a bug?</span>
                <a href="mailto:andreavollendorf@gmail.com">andreavollendorf@gmail.com</a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
