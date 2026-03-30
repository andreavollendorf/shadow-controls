import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Instance, Instances, SoftShadows, PerspectiveCamera } from '@react-three/drei'
import { easing } from 'maath'
import Panel from './Panel'

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
  ditherAmount: 0.04, ditherFrequency: 0.65,
  wallScale: 50, wallRotY: 0.1, wallColor: '#e8e2da',
  camFov: 75, camMouse: 0.5, camDamping: 0.5, camDistance: 5,
}

export default function App() {
  const [p, setP] = useState(DEFAULTS)
  const historyRef = useRef([])
  const paramsRef = useRef(p)
  paramsRef.current = p

  const snapshot = useCallback(() => {
    historyRef.current.push(paramsRef.current)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        const history = historyRef.current
        if (history.length > 0) {
          setP(history.pop())
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [])

  return (
    <>
      <Panel params={p} onChange={setP} onBeforeChange={snapshot} />
      <div className="dither-overlay" style={{ opacity: p.ditherAmount }}>
        <svg width="100%" height="100%">
          <filter id="dither-live">
            <feTurbulence type="fractalNoise" baseFrequency={p.ditherFrequency} numOctaves="3" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#dither-live)" />
        </svg>
      </div>
      <Canvas dpr={[1, 1.5]} shadows style={{ background: p.wallColor }}>
        <ambientLight intensity={Math.PI / 2} />
        <directionalLight
          castShadow
          position={[p.lightX, p.lightY, p.lightZ]}
          intensity={1}
          shadow-mapSize={2048}
        >
          <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15, 1, 50]} />
        </directionalLight>

        <Cam fov={p.camFov} mouseFollow={p.camMouse} damping={p.camDamping} distance={p.camDistance} />

        <Blinds
          count={p.blindCount}
          slatWidth={p.slatWidth}
          slatHeight={p.slatHeight}
          slatGap={p.slatGap}
          position={[p.blindX, p.blindY, p.blindZ]}
          groupRotY={p.groupRotY}
          slatRotX={p.slatRotX}
          slatRotZ={p.slatRotZ}
          breatheSpeed={p.breatheSpeed}
          breatheAmount={p.breatheAmount}
          orientation={p.blindOrientation}
        />

        <mesh receiveShadow scale={p.wallScale} position={[0, 0, 0]} rotation={[0, p.wallRotY, 0]}>
          <planeGeometry />
          <shadowMaterial transparent opacity={p.shadowOpacity} />
        </mesh>

        {p.particlesVisible && p.particleType === 'maple' && (
          <MapleLeaves speed={p.particlesSpeed} particleScale={p.particlesScale}
            pos={[p.particlesX, p.particlesY, p.particlesZ]} count={p.particleCount} />
        )}
        {p.particlesVisible && p.particleType === 'pine' && (
          <PineNeedles speed={p.particlesSpeed} particleScale={p.particlesScale}
            pos={[p.particlesX, p.particlesY, p.particlesZ]} count={p.particleCount} />
        )}
        {p.particlesVisible && p.particleType === 'rain' && (
          <Rain speed={p.particlesSpeed} particleScale={p.particlesScale}
            pos={[p.particlesX, p.particlesY, p.particlesZ]} count={p.particleCount}
            dropSize={p.rainDropSize} dropLength={p.rainDropLength} wind={p.rainWind} />
        )}

        <SoftShadows size={p.softSize} focus={p.softFocus} samples={p.softSamples} />
      </Canvas>
    </>
  )
}

function Cam({ fov, mouseFollow, damping, distance }) {
  const ref = useRef()
  useFrame((state, delta) => {
    easing.damp3(
      ref.current.position,
      [state.pointer.x * mouseFollow, state.pointer.y * mouseFollow, distance],
      damping, delta
    )
    ref.current.lookAt(0, 0, -100)
    ref.current.updateProjectionMatrix()
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
      <Instances castShadow>
        <boxGeometry />
        <meshBasicMaterial />
        <group ref={ref}>
          {instances.map((i) => (
            <Instance
              key={i}
              position={isVertical ? [i * slatGap, 0, 0] : [0, i * slatGap, 0]}
              scale={isVertical ? [slatHeight, slatWidth, 0.01] : [slatWidth, slatHeight, 0.01]}
              rotation={isVertical ? [0, slatRotX, 0] : [slatRotX, 0, 0]}
            />
          ))}
        </group>
      </Instances>
    </group>
  )
}

// ── Leaves (procedural — proper leaf shape, gravity-dominant fall) ──
function MapleLeaves({ speed, particleScale, pos, count }) {
  const ref = useRef()

  const leafGeo = useMemo(() => {
    // Convex teardrop leaf — pointed tip, wide rounded body, tapered stem.
    // Convex = no shadow artifacts. Reads as "leaf" at shadow scale.
    const s = new THREE.Shape()
    s.moveTo(0, 0.5)          // tip
    s.quadraticCurveTo(0.35, 0.2, 0.3, -0.05)   // right upper curve
    s.quadraticCurveTo(0.25, -0.25, 0.04, -0.45) // right lower taper
    s.lineTo(0, -0.5)                              // stem point
    s.lineTo(-0.04, -0.45)                          // left of stem
    s.quadraticCurveTo(-0.25, -0.25, -0.3, -0.05) // left lower taper
    s.quadraticCurveTo(-0.35, 0.2, 0, 0.5)        // left upper curve
    return new THREE.ShapeGeometry(s)
  }, [])

  const leaves = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 14,
    y: Math.random() * 18,
    z: (Math.random() - 0.5) * 7,
    fallSpeed: 0.25 + Math.random() * 0.3,
    swaySpeed: 0.4 + Math.random() * 0.6,
    swayAmount: 0.15 + Math.random() * 0.3,
    tumbleSpeed: 0.2 + Math.random() * 0.4,
    tumblePhase: Math.random() * Math.PI * 2,
    rotZ: Math.random() * Math.PI * 2,
    size: 0.5 + Math.random() * 0.5,
  })), [count])

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed
    const children = ref.current.children
    for (let i = 0; i < children.length; i++) {
      const l = leaves[i]
      const y = ((l.y - t * l.fallSpeed) % 18 + 18) % 18 - 9
      const sway = Math.sin(t * l.swaySpeed + i * 2) * l.swayAmount
      children[i].position.set(l.x + sway, y, l.z)
      const tiltX = Math.sin(t * l.tumbleSpeed + l.tumblePhase) * 0.4
      const tiltY = Math.cos(t * l.tumbleSpeed * 0.6 + l.tumblePhase) * 0.3
      const spin = l.rotZ + t * l.tumbleSpeed * 0.5
      children[i].rotation.set(tiltX, tiltY, spin)
    }
  })

  return (
    <group position={pos} scale={particleScale * 0.05}>
      <Instances castShadow geometry={leafGeo}>
        <meshBasicMaterial side={2} />
        <group ref={ref}>
          {leaves.map((l, i) => (
            <Instance key={i} scale={[l.size, l.size, 1]} />
          ))}
        </group>
      </Instances>
    </group>
  )
}

// ── Pine Needles (procedural instanced thin boxes) ──
function PineNeedles({ speed, particleScale, pos, count }) {
  const COUNT = count
  const ref = useRef()

  const needles = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      x: (Math.random() - 0.5) * 12,
      y: Math.random() * 15,
      z: (Math.random() - 0.5) * 6,
      rotZ: (Math.random() - 0.5) * Math.PI,
      rotX: (Math.random() - 0.5) * 0.5,
      fallSpeed: 0.3 + Math.random() * 0.6,
      swaySpeed: 0.5 + Math.random() * 1.5,
      swayAmount: 0.2 + Math.random() * 0.5,
      length: 0.6 + Math.random() * 0.8,
    }))
  }, [COUNT])

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed
    const children = ref.current.children
    for (let i = 0; i < children.length; i++) {
      const n = needles[i]
      const y = ((n.y - t * n.fallSpeed) % 15 + 15) % 15 - 7.5
      const sway = Math.sin(t * n.swaySpeed + i) * n.swayAmount
      children[i].position.set(n.x + sway, y, n.z)
      children[i].rotation.set(n.rotX, 0, n.rotZ + Math.sin(t * 0.3 + i) * 0.2)
    }
  })

  return (
    <group position={pos} scale={particleScale * 0.05}>
      <Instances castShadow>
        <boxGeometry args={[0.04, 1, 0.015]} />
        <meshBasicMaterial />
        <group ref={ref}>
          {needles.map((n, i) => (
            <Instance key={i} scale={[1, n.length, 1]} />
          ))}
        </group>
      </Instances>
    </group>
  )
}

// ── Rain (procedural instanced cylinders with wind) ──
function Rain({ speed, particleScale, pos, count, dropSize, dropLength, wind }) {
  const ref = useRef()

  const drops = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 18,
      y: Math.random() * 20,
      z: (Math.random() - 0.5) * 10,
      fallSpeed: 2 + Math.random() * 3,
      lengthVar: 0.7 + Math.random() * 0.6, // multiplied by dropLength
    }))
  }, [count])

  // Wind tilts the rain — angle from vertical
  const windAngle = Math.atan2(wind, 5) // radians

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed
    const children = ref.current.children
    for (let i = 0; i < Math.min(children.length, drops.length); i++) {
      const d = drops[i]
      const y = ((d.y - t * d.fallSpeed) % 20 + 20) % 20 - 10
      const xDrift = wind * (d.y - y) * 0.05 // accumulate horizontal drift based on fall distance
      children[i].position.set(d.x + xDrift, y, d.z)
      children[i].rotation.set(0, 0, -windAngle)
      const s = dropSize * 10
      children[i].scale.set(s, s * (1 + d.lengthVar * dropLength), s)
    }
  })

  return (
    <group position={pos} scale={particleScale * 0.05}>
      <Instances castShadow>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial />
        <group ref={ref}>
          {drops.map((_, i) => (
            <Instance key={i} />
          ))}
        </group>
      </Instances>
    </group>
  )
}

