import { useState, useCallback, useRef } from 'react'
import Guide from './Guide'

// ── Slider Row ──
// Single dark pill: label left, value right. Drag anywhere to scrub.
function Slider({ label, value, min, max, step, onChange, onDragStart }) {
  const [dragging, setDragging] = useState(false)

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    onDragStart?.()
  }

  const handlePointerMove = (e) => {
    if (!dragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const raw = min + pct * (max - min)
    const snapped = Math.round(raw / step) * step
    onChange(snapped)
  }

  const handlePointerUp = () => setDragging(false)

  const pct = ((value - min) / (max - min)) * 100

  return (
    <div
      className="ctrl-row"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="ctrl-fill" style={{ transform: `scaleX(${pct / 100})` }} />
      <span className="ctrl-label">{label}</span>
      <span className="ctrl-value">{Number(value.toFixed(2))}</span>
    </div>
  )
}

// ── Folder ──
function Folder({ title, children, defaultOpen = false, hint, toggle, headerDot }) {
  const [open, setOpen] = useState(defaultOpen)
  const [showHint, setShowHint] = useState(false)
  return (
    <div className="ctrl-folder">
      <div className="ctrl-folder-header" onClick={() => setOpen(!open)}>
        <div className="ctrl-folder-title-row">
          <span>{title}</span>
          {headerDot && <span className="ctrl-folder-dot" style={{ background: headerDot }} />}
          {hint && (
            <span
              className="ctrl-hint-icon"
              onMouseEnter={(e) => { e.stopPropagation(); setShowHint(true) }}
              onMouseLeave={() => setShowHint(false)}
              onClick={(e) => e.stopPropagation()}
            >?</span>
          )}
        </div>
        <div className="ctrl-folder-right">
          {toggle && (
            <div className="ctrl-folder-toggle" onClick={(e) => e.stopPropagation()}>
              <div className="ctrl-segment-group">
                <button className={`ctrl-segment-btn ${!toggle.value ? 'active' : ''}`} onClick={() => toggle.onChange(false)}>Off</button>
                <button className={`ctrl-segment-btn ${toggle.value ? 'active' : ''}`} onClick={() => toggle.onChange(true)}>On</button>
              </div>
            </div>
          )}
          <span className="ctrl-chevron">{open ? '−' : '+'}</span>
        </div>
      </div>
      {hint && showHint && (
        <div className="ctrl-hint-tooltip">
          {hint.map((line, i) => (
            <div key={i} className="ctrl-hint-line">
              <span className="ctrl-hint-key">{line[0]}</span>
              <span className="ctrl-hint-desc">{line[1]}</span>
            </div>
          ))}
        </div>
      )}
      {open && <div className="ctrl-folder-body">{children}</div>}
    </div>
  )
}

// ── Scrub Value (drag to change an inline number) ──
function ScrubValue({ label, value, min, max, step, onChange, onDragStart }) {
  const [dragging, setDragging] = useState(false)
  const startRef = useRef({ x: 0, val: 0 })

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    startRef.current = { x: e.clientX, val: value }
    setDragging(true)
    onDragStart?.()
  }

  const handlePointerMove = (e) => {
    if (!dragging) return
    const dx = e.clientX - startRef.current.x
    const range = max - min
    const sensitivity = range / 200
    const raw = startRef.current.val + dx * sensitivity
    const clamped = Math.max(min, Math.min(max, raw))
    const snapped = Math.round(clamped / step) * step
    onChange(snapped)
  }

  const handlePointerUp = () => setDragging(false)

  return (
    <div className="blinds-scrub-value" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
      <span className="blinds-scrub-label">{label}</span>
      <span className={`blinds-scrub-num ${dragging ? 'active' : ''}`}>{Number(value.toFixed(2))}</span>
    </div>
  )
}

// ── Compact Cell (drag to scrub a grid value) ──
function CompactCell({ label, value, min, max, step, onChange, onDragStart }) {
  const [dragging, setDragging] = useState(false)
  const startRef = useRef({ x: 0, val: 0 })

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    startRef.current = { x: e.clientX, val: value }
    setDragging(true)
    onDragStart?.()
  }

  const handlePointerMove = (e) => {
    if (!dragging) return
    const dx = e.clientX - startRef.current.x
    const range = max - min
    const sensitivity = range / 200
    const raw = startRef.current.val + dx * sensitivity
    const clamped = Math.max(min, Math.min(max, raw))
    const snapped = Math.round(clamped / step) * step
    onChange(snapped)
  }

  const handlePointerUp = () => setDragging(false)

  const pct = ((value - min) / (max - min)) * 100

  return (
    <div
      className={`ctrl-cell ${dragging ? 'active' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="ctrl-cell-fill" style={{ transform: `scaleX(${pct / 100})` }} />
      <span className="ctrl-cell-label">{label}</span>
      <span className="ctrl-cell-value">{Number(value.toFixed(2))}</span>
    </div>
  )
}

// ── Blinds Section (visual manipulator + compact grid + breathe strip) ──
function BlindsSection({ params, set, snap, onBeforeChange }) {
  const isVertical = params.blindOrientation === 'vertical'
  const visibleSlats = Math.min(params.blindCount, 12)
  const widthPct = ((params.slatWidth - 10) / (200 - 10)) * 60 + 30
  const rotDeg = (params.slatRotX / 1.5) * 15

  return (
    <>
      {/* Orientation toggle */}
      <div className="blinds-orientation">
        <button
          className={`blinds-orientation-btn ${!isVertical ? 'active' : ''}`}
          onClick={() => snap('blindOrientation', 'horizontal')}
        >
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <rect y="0" width="16" height="2" rx="1" fill="currentColor"/>
            <rect y="5" width="16" height="2" rx="1" fill="currentColor"/>
            <rect y="10" width="16" height="2" rx="1" fill="currentColor"/>
          </svg>
          Horizontal
        </button>
        <button
          className={`blinds-orientation-btn ${isVertical ? 'active' : ''}`}
          onClick={() => snap('blindOrientation', 'vertical')}
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
            <rect x="0" width="2" height="16" rx="1" fill="currentColor"/>
            <rect x="5" width="2" height="16" rx="1" fill="currentColor"/>
            <rect x="10" width="2" height="16" rx="1" fill="currentColor"/>
          </svg>
          Vertical
        </button>
      </div>

      {/* Visual blind preview */}
      <div className="blinds-viz">
        <div className={`blinds-slats ${isVertical ? 'vertical' : ''}`} style={{ gap: `${Math.max(2, params.slatGap * 4)}px` }}>
          {Array.from({ length: visibleSlats }).map((_, i) => {
            const lengthPx = widthPct * 0.9
            const thickPx = Math.max(2, params.slatHeight * 3)
            const rot = `rotate(${rotDeg + (params.slatRotZ / 1.5) * 8}deg)`
            return (
              <div
                key={i}
                className="blinds-slat"
                style={isVertical ? {
                  width: `${thickPx}px`,
                  height: `${lengthPx}px`,
                  transform: rot,
                } : {
                  width: `${lengthPx}px`,
                  height: `${thickPx}px`,
                  transform: rot,
                }}
              />
            )
          })}
        </div>
        <div className="blinds-annotations">
          <ScrubValue label="Length" value={params.slatWidth} min={10} max={200} step={5} onChange={v => set('slatWidth', v)} onDragStart={onBeforeChange} />
          <ScrubValue label="Thick" value={params.slatHeight} min={0.1} max={3} step={0.1} onChange={v => set('slatHeight', v)} onDragStart={onBeforeChange} />
          <ScrubValue label="Gap" value={params.slatGap} min={0.2} max={3} step={0.05} onChange={v => set('slatGap', v)} onDragStart={onBeforeChange} />
          <ScrubValue label="Angle" value={params.slatRotX} min={-1.5} max={1.5} step={0.05} onChange={v => set('slatRotX', v)} onDragStart={onBeforeChange} />
          <ScrubValue label="Count" value={params.blindCount} min={5} max={100} step={1} onChange={v => set('blindCount', v)} onDragStart={onBeforeChange} />
        </div>
      </div>

      {/* Position grid */}
      <div className="ctrl-group-label">Position</div>
      <div className="ctrl-grid">
        <CompactCell label="X" value={params.blindX} min={-30} max={30} step={0.5} onChange={v => set('blindX', v)} onDragStart={onBeforeChange} />
        <CompactCell label="Y" value={params.blindY} min={-20} max={20} step={0.5} onChange={v => set('blindY', v)} onDragStart={onBeforeChange} />
        <CompactCell label="Z" value={params.blindZ} min={0} max={50} step={0.5} onChange={v => set('blindZ', v)} onDragStart={onBeforeChange} />
      </div>

      {/* Rotation grid */}
      <div className="ctrl-group-label">Rotation</div>
      <div className="ctrl-grid">
        <CompactCell label="Group Y" value={params.groupRotY} min={-1.5} max={1.5} step={0.05} onChange={v => set('groupRotY', v)} onDragStart={onBeforeChange} />
        <CompactCell label="Slat Z" value={params.slatRotZ} min={-1.5} max={1.5} step={0.05} onChange={v => set('slatRotZ', v)} onDragStart={onBeforeChange} />
      </div>

      {/* Breathe strip (V5 style) */}
      <div className="blinds-breathe">
        <div className="blinds-breathe-info">
          <svg className="blinds-breathe-wave" width="32" height="20" viewBox="0 0 32 20" fill="none">
            <path d="M0 10 Q8 2 16 10 Q24 18 32 10" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
          <span className="blinds-breathe-title">Breathe</span>
        </div>
        <div className="blinds-breathe-values">
          <CompactCell label="SPD" value={params.breatheSpeed} min={0} max={0.5} step={0.01} onChange={v => set('breatheSpeed', v)} onDragStart={onBeforeChange} />
          <CompactCell label="AMT" value={params.breatheAmount} min={0} max={1} step={0.01} onChange={v => set('breatheAmount', v)} onDragStart={onBeforeChange} />
        </div>
      </div>
    </>
  )
}

// ── Particles Section (Weather Station) ──
const PARTICLE_DESCS = {
  maple: ['a few stray leaves', 'gentle drift', 'autumn breeze', 'leaf storm'],
  pine: ['sparse scatter', 'soft scatter', 'steady fall', 'dense canopy'],
  rain: ['light drizzle', 'passing shower', 'steady rain', 'downpour'],
}
const PARTICLE_NAMES = { maple: 'Falling Leaves', pine: 'Pine Needles', rain: 'Rainfall' }
const PARTICLE_EMOJI = { maple: '🍂', pine: '🌲', rain: '🌧' }

function getParticleDesc(type, count, speed) {
  const descs = PARTICLE_DESCS[type] || PARTICLE_DESCS.maple
  const intensity = (count / 200) * 0.6 + (speed / 2) * 0.4
  if (intensity < 0.2) return descs[0]
  if (intensity < 0.45) return descs[1]
  if (intensity < 0.7) return descs[2]
  return descs[3]
}

function ParticlesSection({ params, set, snap, onBeforeChange }) {
  const type = params.particleType || 'maple'
  const emoji = PARTICLE_EMOJI[type] || '🍂'
  const name = PARTICLE_NAMES[type] || 'Falling Leaves'
  const desc = getParticleDesc(type, params.particleCount, params.particlesSpeed)

  if (!params.particlesVisible) return null

  return (
    <>
      {/* Weather display */}
      <div className="particles-display">
        <span className="particles-emoji">{emoji}</span>
        <span className="particles-name">{name}</span>
        <span className="particles-desc">{params.particleCount} particles · {desc}</span>
      </div>

      {/* Type switcher */}
      <div className="particles-type-bar">
        {[['maple', 'Leaves'], ['pine', 'Pine'], ['rain', 'Rain']].map(([val, label]) => (
          <button
            key={val}
            className={`particles-type-btn ${params.particleType === val ? 'active' : ''}`}
            onClick={() => snap('particleType', val)}
          >{label}</button>
        ))}
      </div>

      {/* Main sliders */}
      <Slider label="Density" value={params.particleCount} min={5} max={200} step={5} onChange={v => set('particleCount', v)} onDragStart={onBeforeChange} />
      <Slider label="Speed" value={params.particlesSpeed} min={0} max={2} step={0.05} onChange={v => set('particlesSpeed', v)} onDragStart={onBeforeChange} />
      <Slider label="Scale" value={params.particlesScale} min={5} max={100} step={1} onChange={v => set('particlesScale', v)} onDragStart={onBeforeChange} />

      {/* Rain extras */}
      {params.particleType === 'rain' && (
        <>
          <Slider label="Drop Size" value={params.rainDropSize} min={0.002} max={0.04} step={0.002} onChange={v => set('rainDropSize', v)} onDragStart={onBeforeChange} />
          <Slider label="Drop Length" value={params.rainDropLength} min={0.1} max={2} step={0.05} onChange={v => set('rainDropLength', v)} onDragStart={onBeforeChange} />
          <Slider label="Wind" value={params.rainWind} min={-3} max={3} step={0.1} onChange={v => set('rainWind', v)} onDragStart={onBeforeChange} />
        </>
      )}
    </>
  )
}

// ── Shadow Section (Appearance + Quality) ──
function ShadowSection({ params, set, onBeforeChange }) {
  return (
    <>
      <div className="ctrl-group-label">Appearance</div>

      {/* Opacity with gradient swatch */}
      <div className="shadow-icon-row">
        <div className="shadow-swatch shadow-swatch--opacity" />
        <Slider label="Opacity" value={params.shadowOpacity} min={0} max={1} step={0.01} onChange={v => set('shadowOpacity', v)} onDragStart={onBeforeChange} />
      </div>

      {/* Soft Size with blur dot */}
      <div className="shadow-icon-row">
        <div className="shadow-swatch shadow-swatch--soft">
          <div className="shadow-swatch-blur-dot" />
        </div>
        <Slider label="Soft Size" value={params.softSize} min={1} max={50} step={1} onChange={v => set('softSize', v)} onDragStart={onBeforeChange} />
      </div>

      {/* Focus with ring icon */}
      <div className="shadow-icon-row">
        <div className="shadow-swatch shadow-swatch--focus">
          <div className="shadow-swatch-ring-outer">
            <div className="shadow-swatch-ring-inner">
              <div className="shadow-swatch-ring-dot" />
            </div>
          </div>
        </div>
        <Slider label="Focus" value={params.softFocus} min={0} max={2} step={0.05} onChange={v => set('softFocus', v)} onDragStart={onBeforeChange} />
      </div>

      <div className="ctrl-group-label" style={{ paddingTop: 14 }}>Quality</div>

      {/* Samples */}
      <Slider label="Samples" value={params.softSamples} min={8} max={64} step={4} onChange={v => set('softSamples', v)} onDragStart={onBeforeChange} />
    </>
  )
}

// ── Light XY Pad + Z Slider ──
function LightPad({ params, onChange, onBeforeChange }) {
  const padRef = useRef(null)
  const zRef = useRef(null)
  const [draggingPad, setDraggingPad] = useState(false)
  const [draggingZ, setDraggingZ] = useState(false)

  const xMin = -30, xMax = 30, yMin = -30, yMax = 30, zMin = 5, zMax = 60

  const xPct = ((params.lightX - xMin) / (xMax - xMin)) * 100
  const yPct = (1 - (params.lightY - yMin) / (yMax - yMin)) * 100
  const zPct = ((params.lightZ - zMin) / (zMax - zMin)) * 100

  const updatePad = (e) => {
    const rect = padRef.current.getBoundingClientRect()
    const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    const newX = Math.round((xMin + px * (xMax - xMin)) / 0.5) * 0.5
    const newY = Math.round((yMax - py * (yMax - yMin)) / 0.5) * 0.5
    onChange({ ...params, lightX: newX, lightY: newY })
  }

  const updateZ = (e) => {
    const rect = zRef.current.getBoundingClientRect()
    const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    const newZ = Math.round((zMax - py * (zMax - zMin)) / 0.5) * 0.5
    onChange({ ...params, lightZ: newZ })
  }

  return (
    <div className="light-pad-wrap">
      {/* XY Pad */}
      <div
        ref={padRef}
        className={`light-pad ${draggingPad ? 'active' : ''}`}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDraggingPad(true); onBeforeChange?.(); updatePad(e) }}
        onPointerMove={(e) => { if (draggingPad) updatePad(e) }}
        onPointerUp={() => setDraggingPad(false)}
        onPointerCancel={() => setDraggingPad(false)}
      >
        {/* Grid lines */}
        <div className="light-pad-grid-h" />
        <div className="light-pad-grid-v" />
        {/* Axis labels */}
        <span className="light-pad-axis-label" style={{ bottom: 5, left: '50%', transform: 'translateX(-50%)' }}>X</span>
        <span className="light-pad-axis-label" style={{ left: 5, top: '50%', transform: 'translateY(-50%)' }}>Y</span>
        {/* Coordinate readout */}
        <span className="light-pad-readout">
          {Number(params.lightX.toFixed(1))}, {Number(params.lightY.toFixed(1))}
        </span>
        {/* Sun dot */}
        <div className="light-pad-sun" style={{ left: `${xPct}%`, top: `${yPct}%` }} />
      </div>

      {/* Z vertical slider */}
      <div
        ref={zRef}
        className={`light-z ${draggingZ ? 'active' : ''}`}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDraggingZ(true); onBeforeChange?.(); updateZ(e) }}
        onPointerMove={(e) => { if (draggingZ) updateZ(e) }}
        onPointerUp={() => setDraggingZ(false)}
        onPointerCancel={() => setDraggingZ(false)}
      >
        <span className="light-z-label">Z</span>
        <div className="light-z-track">
          <div className="light-z-fill" style={{ height: `${zPct}%` }} />
          <div className="light-z-thumb" style={{ bottom: `${zPct}%` }} />
        </div>
        <span className="light-z-value">{Number(params.lightZ.toFixed(1))}</span>
      </div>
    </div>
  )
}

// ── Main Panel ──
export default function Panel({ params, onChange, onBeforeChange }) {
  const set = useCallback((key, val) => {
    onChange({ ...params, [key]: val })
  }, [params, onChange])

  const snap = useCallback((key, val) => {
    onBeforeChange?.()
    set(key, val)
  }, [onBeforeChange, set])

  const [pos, setPos] = useState({ x: 16, y: 16 })
  const [dragging, setDragging] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 })

  const handleHeaderDown = (e) => {
    if (guideOpen) return
    if (e.target.closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
    setDragging(true)
  }

  const handleHeaderMove = (e) => {
    if (!dragging) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    const panelW = 300
    const panelEl = e.currentTarget.parentElement
    const panelH = panelEl ? panelEl.offsetHeight : 400
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - panelW, dragRef.current.origX - dx)),
      y: Math.max(0, Math.min(window.innerHeight - panelH, dragRef.current.origY + dy)),
    })
  }

  const handleHeaderUp = () => setDragging(false)

  return (
    <div className={`panel-root ${guideOpen ? 'panel-blocked' : ''}`} style={{ top: pos.y, right: pos.x }}>
      <div
        className={`panel-header ${dragging ? 'dragging' : ''}`}
        onPointerDown={handleHeaderDown}
        onPointerMove={handleHeaderMove}
        onPointerUp={handleHeaderUp}
        onPointerCancel={handleHeaderUp}
      >
        <span>Caster</span>
        <Guide params={params} onOpenChange={setGuideOpen} />
      </div>
      <div className="panel-body">

        <Folder title="Light" defaultOpen hint={[
          ['XY Pad', 'Drag anywhere to move the sun horizontally and vertically'],
          ['Z Slider', 'Drag up/down to set the light height — lower = softer shadows'],
        ]}>
          <LightPad params={params} onChange={onChange} onBeforeChange={onBeforeChange} />
        </Folder>

        <Folder title="Shadow" defaultOpen>
          <ShadowSection params={params} set={set} onBeforeChange={onBeforeChange} />
        </Folder>

        <Folder title="Blinds" hint={[
          ['Visualizer', 'Drag the values below the preview to adjust length, thickness, gap, angle, and count'],
          ['Position', 'Drag each cell left/right to move the blind assembly in 3D'],
          ['Rotation', 'Drag to rotate the group or individual slats'],
          ['Breathe', 'Gentle open/close animation — set speed and amount'],
        ]}>
          <BlindsSection params={params} set={set} snap={snap} onBeforeChange={onBeforeChange} />
        </Folder>

        <Folder title="Particles" toggle={{ value: params.particlesVisible, onChange: v => snap('particlesVisible', v) }}>
          <ParticlesSection params={params} set={set} snap={snap} onBeforeChange={onBeforeChange} />
        </Folder>

        <Folder title="Wall" headerDot={params.wallColor}>
          <div className="wall-color-row">
            <div className="wall-color-swatch-wrap">
              <input
                type="color"
                value={params.wallColor}
                onChange={(e) => snap('wallColor', e.target.value)}
                className="wall-color-input"
              />
            </div>
            <div className="wall-color-info">
              <span className="wall-color-hex">{params.wallColor}</span>
              <span className="wall-color-label">Scene Background</span>
            </div>
          </div>
          <div className="ctrl-grid">
            <CompactCell label="Scale" value={params.wallScale} min={10} max={100} step={1} onChange={v => set('wallScale', v)} onDragStart={onBeforeChange} />
            <CompactCell label="Rotation" value={params.wallRotY} min={-0.5} max={0.5} step={0.01} onChange={v => set('wallRotY', v)} onDragStart={onBeforeChange} />
          </div>
        </Folder>

        <Folder title="Camera">
          <div className="ctrl-grid">
            <CompactCell label="FOV" value={params.camFov} min={30} max={120} step={1} onChange={v => set('camFov', v)} onDragStart={onBeforeChange} />
            <CompactCell label="Distance" value={params.camDistance} min={1} max={20} step={0.5} onChange={v => set('camDistance', v)} onDragStart={onBeforeChange} />
          </div>
          <div className="ctrl-grid">
            <CompactCell label="Mouse" value={params.camMouse} min={0} max={2} step={0.05} onChange={v => set('camMouse', v)} onDragStart={onBeforeChange} />
            <CompactCell label="Damping" value={params.camDamping} min={0.05} max={2} step={0.05} onChange={v => set('camDamping', v)} onDragStart={onBeforeChange} />
          </div>
        </Folder>

      </div>
      <div className="panel-footer">
        <button className="ctrl-copy-btn" onClick={() => {
          const json = JSON.stringify(params, null, 2)
          navigator.clipboard.writeText(json).then(() => {
            const btn = document.querySelector('.ctrl-copy-btn')
            btn.textContent = 'Copied!'
            setTimeout(() => { btn.textContent = 'Copy Config' }, 1500)
          })
        }}>Copy Config</button>
      </div>
    </div>
  )
}
