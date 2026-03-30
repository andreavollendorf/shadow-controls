import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

// The full CasterScene source — kept in sync with public/CasterScene.jsx.
const COMPONENT_SOURCE = `/**
 * CasterScene — A configurable 3D shadow and particle component.
 * Zero external files. Drop into any React project.
 *
 * Usage:
 *   import CasterScene from './CasterScene'
 *   <CasterScene config={{ ...pastedJSON }} />
 *
 * Tune your config at: https://shadow-controls.vercel.app
 *
 * Credits:
 *   Based on Basement Studio's "Creating Daylight" technique
 *   and the CodeSandbox demo by @0xca0a (Paul Henschel).
 *   Tuner built by Andrea Vollendorf.
 */

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Instance, Instances, SoftShadows, PerspectiveCamera } from '@react-three/drei'
import { easing } from 'maath'

const DEFAULTS = {
  lightX: 5, lightY: 5, lightZ: 30,
  shadowOpacity: 0.3, softSize: 15, softFocus: 0, softSamples: 32,
  blindCount: 50, slatWidth: 100, slatHeight: 0.9, blindOrientation: 'horizontal',
  blindX: -10, blindY: 0, blindZ: 20, slatGap: 1,
  groupRotY: 0.5, slatRotX: 0.5, slatRotZ: -0.2,
  breatheSpeed: 0.1, breatheAmount: 0.15,
  particlesVisible: true, particleType: 'maple',
  particlesSpeed: 0.6, particlesScale: 40, particleCount: 35,
  particlesX: 0, particlesY: -8, particlesZ: 10,
  rainDropSize: 0.015, rainDropLength: 0.08, rainWind: 0.5,
  wallScale: 50, wallRotY: 0.1, wallColor: '#e8e2da',
  camFov: 75, camMouse: 0.5, camDamping: 0.5, camDistance: 5,
}

export default function CasterScene({ config = {}, style = {}, className = '' }) {
  const p = { ...DEFAULTS, ...config }
  return (
    <Canvas dpr={[1, 1.5]} shadows className={className} style={{ background: p.wallColor, ...style }}>
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight castShadow position={[p.lightX, p.lightY, p.lightZ]} intensity={1} shadow-mapSize={2048}>
        <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15, 1, 50]} />
      </directionalLight>
      <Cam fov={p.camFov} mouseFollow={p.camMouse} damping={p.camDamping} distance={p.camDistance} />
      <Blinds count={p.blindCount} slatWidth={p.slatWidth} slatHeight={p.slatHeight} slatGap={p.slatGap}
        position={[p.blindX, p.blindY, p.blindZ]} groupRotY={p.groupRotY}
        slatRotX={p.slatRotX} slatRotZ={p.slatRotZ}
        breatheSpeed={p.breatheSpeed} breatheAmount={p.breatheAmount} orientation={p.blindOrientation} />
      <mesh receiveShadow scale={p.wallScale} position={[0, 0, 0]} rotation={[0, p.wallRotY, 0]}>
        <planeGeometry /><shadowMaterial transparent opacity={p.shadowOpacity} />
      </mesh>
      {p.particlesVisible && p.particleType === 'maple' && <MapleLeaves speed={p.particlesSpeed} particleScale={p.particlesScale} pos={[p.particlesX, p.particlesY, p.particlesZ]} count={p.particleCount} />}
      {p.particlesVisible && p.particleType === 'pine' && <PineNeedles speed={p.particlesSpeed} particleScale={p.particlesScale} pos={[p.particlesX, p.particlesY, p.particlesZ]} count={p.particleCount} />}
      {p.particlesVisible && p.particleType === 'rain' && <Rain speed={p.particlesSpeed} particleScale={p.particlesScale} pos={[p.particlesX, p.particlesY, p.particlesZ]} count={p.particleCount} dropSize={p.rainDropSize} dropLength={p.rainDropLength} wind={p.rainWind} />}
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

function Blinds({ count, slatWidth, slatHeight, slatGap, position, groupRotY, slatRotX, slatRotZ, breatheSpeed, breatheAmount, orientation = 'horizontal' }) {
  const ref = useRef()
  const isVertical = orientation === 'vertical'
  useFrame((state) => {
    const t = state.clock.elapsedTime
    ref.current.children.forEach((child) => {
      if (isVertical) {
        child.rotation.y = slatRotX + Math.sin(t * breatheSpeed) * breatheAmount
        child.rotation.z = slatRotZ
        child.rotation.x = Math.sin(t * (breatheSpeed * 0.5)) * (breatheAmount * 0.3)
      } else {
        child.rotation.x = slatRotX + Math.sin(t * breatheSpeed) * breatheAmount
        child.rotation.z = slatRotZ
        child.rotation.y = Math.sin(t * (breatheSpeed * 0.5)) * (breatheAmount * 0.3)
      }
    })
  })
  const instances = useMemo(() => Array.from({ length: count }, (_, i) => i), [count])
  return (
    <group position={position} rotation={[0, groupRotY, 0]}>
      <Instances castShadow><boxGeometry /><meshBasicMaterial />
        <group ref={ref}>{instances.map((i) => (
          <Instance key={i}
            position={isVertical ? [i * slatGap, 0, 0] : [0, i * slatGap, 0]}
            scale={isVertical ? [slatHeight, slatWidth, 0.01] : [slatWidth, slatHeight, 0.01]}
            rotation={isVertical ? [0, slatRotX, 0] : [slatRotX, 0, 0]} />
        ))}</group>
      </Instances>
    </group>
  )
}

function MapleLeaves({ speed, particleScale, pos, count }) {
  const ref = useRef()
  const leafGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0.5)
    s.quadraticCurveTo(0.35, 0.2, 0.3, -0.05)
    s.quadraticCurveTo(0.25, -0.25, 0.04, -0.45)
    s.lineTo(0, -0.5)
    s.lineTo(-0.04, -0.45)
    s.quadraticCurveTo(-0.25, -0.25, -0.3, -0.05)
    s.quadraticCurveTo(-0.35, 0.2, 0, 0.5)
    return new THREE.ShapeGeometry(s)
  }, [])
  const leaves = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 14, y: Math.random() * 18, z: (Math.random() - 0.5) * 7,
    fallSpeed: 0.25 + Math.random() * 0.3, swaySpeed: 0.4 + Math.random() * 0.6,
    swayAmount: 0.15 + Math.random() * 0.3, tumbleSpeed: 0.2 + Math.random() * 0.4,
    tumblePhase: Math.random() * Math.PI * 2, rotZ: Math.random() * Math.PI * 2,
    size: 0.5 + Math.random() * 0.5,
  })), [count])
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed; const children = ref.current.children
    for (let i = 0; i < children.length; i++) {
      const l = leaves[i]; const y = ((l.y - t * l.fallSpeed) % 18 + 18) % 18 - 9
      children[i].position.set(l.x + Math.sin(t * l.swaySpeed + i * 2) * l.swayAmount, y, l.z)
      children[i].rotation.set(Math.sin(t * l.tumbleSpeed + l.tumblePhase) * 0.4, Math.cos(t * l.tumbleSpeed * 0.6 + l.tumblePhase) * 0.3, l.rotZ + t * l.tumbleSpeed * 0.5)
    }
  })
  return (
    <group position={pos} scale={particleScale * 0.05}>
      <Instances castShadow geometry={leafGeo}><meshBasicMaterial side={2} />
        <group ref={ref}>{leaves.map((l, i) => <Instance key={i} scale={[l.size, l.size, 1]} />)}</group>
      </Instances>
    </group>
  )
}

function PineNeedles({ speed, particleScale, pos, count }) {
  const ref = useRef()
  const needles = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 12, y: Math.random() * 15, z: (Math.random() - 0.5) * 6,
    rotZ: (Math.random() - 0.5) * Math.PI, rotX: (Math.random() - 0.5) * 0.5,
    fallSpeed: 0.3 + Math.random() * 0.6, swaySpeed: 0.5 + Math.random() * 1.5,
    swayAmount: 0.2 + Math.random() * 0.5, length: 0.6 + Math.random() * 0.8,
  })), [count])
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

function Rain({ speed, particleScale, pos, count, dropSize, dropLength, wind }) {
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
      const s = dropSize * 10
      children[i].scale.set(s, s * (1 + d.lengthVar * dropLength), s)
    }
  })
  return (
    <group position={pos} scale={particleScale * 0.05}>
      <Instances castShadow><sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial />
        <group ref={ref}>{drops.map((_, i) => <Instance key={i} />)}</group>
      </Instances>
    </group>
  )
}
`

function buildClaudePrompt(params) {
  return `Install the CasterScene component into my React project. Do these steps in order:

## Step 1 — Install dependencies (pinned versions required)

\`\`\`bash
npm install three@0.159.0 @react-three/fiber@8.15.12 @react-three/drei@9.106.0 maath
\`\`\`

Three.js 0.159 is required — newer versions break SoftShadows. The \`three\` package is also used directly for procedural leaf geometry.

## Step 2 — Create \`src/CasterScene.jsx\`

Write this file exactly:

\`\`\`jsx
${COMPONENT_SOURCE}
\`\`\`

## Step 3 — Use it with my config

\`\`\`jsx
import CasterScene from './CasterScene'

const casterConfig = ${JSON.stringify(params, null, 2)}

// Full-page background shadow:
<CasterScene
  config={casterConfig}
  style={{ position: 'fixed', inset: 0, zIndex: -1 }}
/>

// Or inside a container:
<div style={{ width: '100%', height: '400px' }}>
  <CasterScene config={casterConfig} />
</div>
\`\`\`

## Notes
- Single file, zero external dependencies beyond the npm packages above
- All three particle types (maple leaves, pine needles, rain) are fully procedural — no model files needed
- Supports horizontal and vertical blind orientations via the \`blindOrientation\` config key
- Config can be swapped anytime — just paste new JSON from the tuner at https://shadow-controls.vercel.app
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
                  <button className="guide-download-btn" onClick={() => downloadBlob(COMPONENT_SOURCE, 'CasterScene.jsx')}>
                    <span className="guide-download-icon">↓</span>
                    CasterScene.jsx
                    <span className="guide-download-hint">→ src/</span>
                  </button>
                </div>
              </section>

              <section className="guide-section">
                <h3>3. Use it</h3>
                <pre><code>{`import CasterScene from './CasterScene'

const casterConfig = {
  // Paste your config from the tuner
}

<CasterScene
  config={casterConfig}
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

            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
