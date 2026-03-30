import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

// The full ShadowScene source, embedded so the Claude Code prompt is self-contained.
// This is read at build time — keep it in sync with ShadowScene.jsx.
const COMPONENT_SOURCE = `/**
 * ShadowScene — A configurable 3D shadow component.
 * Zero external files. Drop into any React project.
 *
 * Usage:
 *   import ShadowScene from './ShadowScene'
 *   <ShadowScene config={{ ...pastedJSON }} />
 *
 * Credits:
 *   Based on Basement Studio's "Creating Daylight" technique
 *   and the CodeSandbox demo by @0xca0a (Paul Henschel).
 *   Tuner built by Andrea Vollendorf.
 */

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Instance, Instances, SoftShadows, PerspectiveCamera } from '@react-three/drei'
import { easing } from 'maath'

const DEFAULTS = {
  lightX: 5, lightY: 5, lightZ: 30, lightIntensity: 1,
  ambientIntensity: Math.PI / 2,
  shadowOpacity: 0.3, softSize: 15, softFocus: 0, softSamples: 32,
  blindCount: 50, slatWidth: 100, slatHeight: 0.9,
  blindX: -10, blindY: 0, blindZ: 20,
  groupRotY: 0.5, slatRotX: 0.5, slatRotZ: -0.2,
  breatheSpeed: 0.1, breatheAmount: 0.15,
  particlesVisible: true, particleType: 'maple',
  particlesSpeed: 0.2, particlesScale: 40,
  particlesX: 0, particlesY: -8, particlesZ: 10,
  rainDropSize: 0.008, rainDropLength: 0.4, rainWind: 0.5, rainCount: 120,
  wallScale: 50, wallRotY: 0.1, wallColor: '#e8e2da',
  camFov: 75, camMouse: 0.5, camDamping: 0.5, camDistance: 5,
}

export default function ShadowScene({ config = {}, style = {}, className = '' }) {
  const p = { ...DEFAULTS, ...config }
  return (
    <Canvas dpr={[1, 1.5]} shadows className={className} style={{ background: p.wallColor, ...style }}>
      <ambientLight intensity={p.ambientIntensity} />
      <directionalLight castShadow position={[p.lightX, p.lightY, p.lightZ]} intensity={p.lightIntensity} shadow-mapSize={2048}>
        <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15, 1, 50]} />
      </directionalLight>
      <Cam fov={p.camFov} mouseFollow={p.camMouse} damping={p.camDamping} distance={p.camDistance} />
      <Blinds count={p.blindCount} slatWidth={p.slatWidth} slatHeight={p.slatHeight}
        position={[p.blindX, p.blindY, p.blindZ]} groupRotY={p.groupRotY}
        slatRotX={p.slatRotX} slatRotZ={p.slatRotZ}
        breatheSpeed={p.breatheSpeed} breatheAmount={p.breatheAmount} />
      <mesh receiveShadow scale={p.wallScale} position={[0, 0, 0]} rotation={[0, p.wallRotY, 0]}>
        <planeGeometry /><shadowMaterial transparent opacity={p.shadowOpacity} />
      </mesh>
      {p.particlesVisible && p.particleType === 'maple' && <MapleLeaves speed={p.particlesSpeed} particleScale={p.particlesScale} pos={[p.particlesX, p.particlesY, p.particlesZ]} />}
      {p.particlesVisible && p.particleType === 'pine' && <PineNeedles speed={p.particlesSpeed} particleScale={p.particlesScale} pos={[p.particlesX, p.particlesY, p.particlesZ]} />}
      {p.particlesVisible && p.particleType === 'rain' && <Rain speed={p.particlesSpeed} particleScale={p.particlesScale} pos={[p.particlesX, p.particlesY, p.particlesZ]} dropSize={p.rainDropSize} dropLength={p.rainDropLength} wind={p.rainWind} count={p.rainCount} />}
      <SoftShadows size={p.softSize} focus={p.softFocus} samples={p.softSamples} />
    </Canvas>
  )
}

function Cam({ fov, mouseFollow, damping, distance }) {
  const ref = useRef()
  useFrame((state, delta) => {
    easing.damp3(ref.current.position, [state.pointer.x * mouseFollow, state.pointer.y * mouseFollow, distance], damping, delta)
    ref.current.lookAt(0, 0, -100); ref.current.updateProjectionMatrix()
  })
  return <PerspectiveCamera makeDefault ref={ref} position={[0, 0, distance]} fov={fov} />
}

function Blinds({ count, slatWidth, slatHeight, position, groupRotY, slatRotX, slatRotZ, breatheSpeed, breatheAmount }) {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    ref.current.children.forEach((child) => {
      child.rotation.x = slatRotX + Math.sin(t * breatheSpeed) * breatheAmount
      child.rotation.z = slatRotZ
      child.rotation.y = Math.sin(t * (breatheSpeed * 0.5)) * (breatheAmount * 0.3)
    })
  })
  const instances = useMemo(() => Array.from({ length: count }, (_, i) => i), [count])
  return (
    <group position={position} rotation={[0, groupRotY, 0]}>
      <Instances castShadow><boxGeometry /><meshBasicMaterial />
        <group ref={ref}>{instances.map((i) => <Instance key={i} position={[0, i, 0]} scale={[slatWidth, slatHeight, 0.01]} rotation={[slatRotX, 0, 0]} />)}</group>
        <Instance position={[18, count / 2, 0]} scale={[0.2, count, 0.01]} />
      </Instances>
    </group>
  )
}

function MapleLeaves({ speed, particleScale, pos }) {
  const COUNT = 35; const ref = useRef()
  const leaves = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 14, y: Math.random() * 18, z: (Math.random() - 0.5) * 7,
    fallSpeed: 0.15 + Math.random() * 0.35, swaySpeed: 0.3 + Math.random() * 0.8,
    swayAmount: 0.5 + Math.random() * 1.5, tumbleSpeed: 0.4 + Math.random() * 1.2,
    tumblePhase: Math.random() * Math.PI * 2, rotZ: (Math.random() - 0.5) * Math.PI,
    size: 0.6 + Math.random() * 0.6,
  })), [])
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed; const children = ref.current.children
    for (let i = 0; i < children.length; i++) {
      const l = leaves[i]; const y = ((l.y - t * l.fallSpeed) % 18 + 18) % 18 - 9
      children[i].position.set(l.x + Math.sin(t * l.swaySpeed + i * 2) * l.swayAmount, y, l.z)
      children[i].rotation.set(Math.sin(t * l.tumbleSpeed + l.tumblePhase) * 1.2, Math.cos(t * l.tumbleSpeed * 0.7 + l.tumblePhase) * 0.8, l.rotZ + Math.sin(t * 0.2 + i) * 0.3)
    }
  })
  return (
    <group position={pos} scale={particleScale * 0.05}>
      <Instances castShadow><planeGeometry args={[1, 0.8]} /><meshBasicMaterial side={2} />
        <group ref={ref}>{leaves.map((l, i) => <Instance key={i} scale={[l.size, l.size, 1]} />)}</group>
      </Instances>
    </group>
  )
}

function PineNeedles({ speed, particleScale, pos }) {
  const COUNT = 60; const ref = useRef()
  const needles = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 12, y: Math.random() * 15, z: (Math.random() - 0.5) * 6,
    rotZ: (Math.random() - 0.5) * Math.PI, rotX: (Math.random() - 0.5) * 0.5,
    fallSpeed: 0.3 + Math.random() * 0.6, swaySpeed: 0.5 + Math.random() * 1.5,
    swayAmount: 0.2 + Math.random() * 0.5, length: 0.6 + Math.random() * 0.8,
  })), [])
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed; const children = ref.current.children
    for (let i = 0; i < children.length; i++) {
      const n = needles[i]; const y = ((n.y - t * n.fallSpeed) % 15 + 15) % 15 - 7.5
      children[i].position.set(n.x + Math.sin(t * n.swaySpeed + i) * n.swayAmount, y, n.z)
      children[i].rotation.set(n.rotX, 0, n.rotZ + Math.sin(t * 0.3 + i) * 0.2)
    }
  })
  return (
    <group position={pos} scale={particleScale * 0.05}>
      <Instances castShadow><boxGeometry args={[0.04, 1, 0.015]} /><meshBasicMaterial />
        <group ref={ref}>{needles.map((n, i) => <Instance key={i} scale={[1, n.length, 1]} />)}</group>
      </Instances>
    </group>
  )
}

function Rain({ speed, particleScale, pos, dropSize, dropLength, wind, count }) {
  const ref = useRef()
  const drops = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 18, y: Math.random() * 20, z: (Math.random() - 0.5) * 10,
    fallSpeed: 2 + Math.random() * 3, lengthVar: 0.7 + Math.random() * 0.6,
  })), [count])
  const windAngle = Math.atan2(wind, 5)
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed; const children = ref.current.children
    for (let i = 0; i < Math.min(children.length, drops.length); i++) {
      const d = drops[i]; const y = ((d.y - t * d.fallSpeed) % 20 + 20) % 20 - 10
      children[i].position.set(d.x + wind * (d.y - y) * 0.05, y, d.z)
      children[i].rotation.set(0, 0, -windAngle)
      children[i].scale.set(1, d.lengthVar * dropLength / 0.4, 1)
    }
  })
  return (
    <group position={pos} scale={particleScale * 0.05}>
      <Instances castShadow><cylinderGeometry args={[dropSize, dropSize, 1, 4]} /><meshBasicMaterial />
        <group ref={ref}>{drops.map((_, i) => <Instance key={i} />)}</group>
      </Instances>
    </group>
  )
}`

function buildClaudePrompt(params) {
  return `Install the ShadowScene shadow component into my React project. Do these steps in order:

## Step 1 — Install dependencies (pinned versions required)

\`\`\`bash
npm install three@0.159.0 @react-three/fiber@8.15.12 @react-three/drei@9.106.0 maath
\`\`\`

Three.js 0.159 is required — newer versions break SoftShadows.

## Step 2 — Create \`src/ShadowScene.jsx\`

Write this file exactly:

\`\`\`jsx
${COMPONENT_SOURCE}
\`\`\`

## Step 3 — Use it with my config

\`\`\`jsx
import ShadowScene from './ShadowScene'

const shadowConfig = ${JSON.stringify(params, null, 2)}

// Full-page background shadow:
<ShadowScene
  config={shadowConfig}
  style={{ position: 'fixed', inset: 0, zIndex: -1 }}
/>

// Or inside a container:
<div style={{ width: '100%', height: '400px' }}>
  <ShadowScene config={shadowConfig} />
</div>
\`\`\`

## Notes
- Single file, zero external dependencies beyond the npm packages above
- All three particle types (maple leaves, pine needles, rain) are fully procedural — no model files needed
- Config can be swapped anytime — just paste new JSON from the tuner
- Credits: Based on Basement Studio's "Creating Daylight" and @0xca0a's R3F demo. Tuner by Andrea Vollendorf.
`
}

function downloadBlob(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function Guide({ params, onOpenChange }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const setGuideOpen = (v) => {
    setOpen(v)
    onOpenChange?.(v)
  }

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setGuideOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const handleClaudeCopy = () => {
    const prompt = buildClaudePrompt(params)
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <button className="guide-trigger" onClick={() => setGuideOpen(true)}>Quick Start</button>

      {open && createPortal(
        <div className="guide-overlay" onClick={() => setGuideOpen(false)}>
          <div className="guide-modal" onClick={e => e.stopPropagation()}>
            <div className="guide-header">
              <h2>Quick Start</h2>
              <button className="guide-close" onClick={() => setGuideOpen(false)}>×</button>
            </div>

            <div className="guide-body">

              <section className="guide-section guide-claude-section">
                <div className="guide-claude-card">
                  <div className="guide-claude-header">
                    <span className="guide-claude-badge">Recommended</span>
                    <h3>Use with Claude Code</h3>
                    <p>Copy a single prompt, paste it into Claude Code, and it handles everything — deps, files, config. No external downloads needed.</p>
                  </div>
                  <button className="guide-claude-btn" onClick={handleClaudeCopy}>
                    {copied ? 'Copied!' : 'Copy Claude Code Prompt'}
                  </button>
                  <p className="guide-claude-note">
                    Includes your current config. Re-copy after making changes.
                  </p>
                </div>
              </section>

              <div className="guide-divider">
                <span>or install manually</span>
              </div>

              <section className="guide-section">
                <h3>1. Install dependencies</h3>
                <pre><code>npm install three@0.159.0 @react-three/fiber@8.15.12 @react-three/drei@9.106.0 maath</code></pre>
              </section>

              <section className="guide-section">
                <h3>2. Add the component to your project</h3>
                <p>
                  Download the component file and drop it into your <code>src/</code> folder. That's it — no other files needed.
                </p>
                <div className="guide-downloads">
                  <button className="guide-download-btn" onClick={() => downloadBlob(COMPONENT_SOURCE, 'ShadowScene.jsx')}>
                    <span className="guide-download-icon">↓</span>
                    ShadowScene.jsx
                    <span className="guide-download-hint">→ src/</span>
                  </button>
                </div>
              </section>

              <section className="guide-section">
                <h3>3. Use it</h3>
                <pre><code>{`import ShadowScene from './ShadowScene'

const shadowConfig = {
  // Paste your config from the tuner
}

<ShadowScene
  config={shadowConfig}
  style={{ position: 'fixed', inset: 0, zIndex: -1 }}
/>`}</code></pre>
              </section>

              <section className="guide-section">
                <h3>4. Change it later</h3>
                <p>
                  Come back anytime, tweak the shadow, hit <strong>Copy Config</strong>,
                  and paste over the old JSON. The component stays the same.
                </p>
              </section>

              <section className="guide-section guide-credits">
                <h3>Credits & Attribution</h3>
                <p>
                  Built by{' '}
                  <a href="https://www.andreavollendorf.com/" target="_blank" rel="noopener noreferrer">Andrea Vollendorf</a>
                  {' '}as a configurable wrapper around techniques published by:
                </p>
                <ul>
                  <li>
                    <a href="https://basement.studio/post/creating-daylight-or-the-shadows" target="_blank" rel="noopener noreferrer">
                      Basement Studio — "Creating Daylight, or The Shadows"
                    </a>
                    <span>The rendering technique behind Daylight Computer's shadow effect</span>
                  </li>
                  <li>
                    <a href="https://codesandbox.io/p/sandbox/focused-dirac-3w6cxs" target="_blank" rel="noopener noreferrer">
                      @0xca0a (Paul Henschel) — CodeSandbox Demo
                    </a>
                    <span>The React Three Fiber implementation this component is based on</span>
                  </li>
                  <li>
                    <a href="https://joshpuckett.me/dialkit" target="_blank" rel="noopener noreferrer">
                      Josh Puckett — DialKit
                    </a>
                    <span>Inspiration for the side panel fine-tuning controls</span>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
