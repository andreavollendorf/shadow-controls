/**
 * ShadowScene — A configurable 3D shadow component.
 *
 * Drop this into any React project to add realistic, soft window-blind
 * shadows with optional falling particles (leaves, pine needles, rain).
 *
 * Usage:
 *   import ShadowScene from './ShadowScene'
 *
 *   <ShadowScene config={{ ...pastedJSON }} />
 *
 * Tune your config at: [your deployed tuner URL]
 *
 * Credits:
 *   Based on Basement Studio's "Creating Daylight" technique
 *   and the CodeSandbox demo by @0xca0a (Paul Henschel).
 *   Tuner built by Andrea Vollendorf.
 */

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Instance, Instances, SoftShadows, PerspectiveCamera, useGLTF, useAnimations } from '@react-three/drei'
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
    <Canvas
      dpr={[1, 1.5]}
      shadows
      className={className}
      style={{ background: p.wallColor, ...style }}
    >
      <ambientLight intensity={p.ambientIntensity} />
      <directionalLight
        castShadow
        position={[p.lightX, p.lightY, p.lightZ]}
        intensity={p.lightIntensity}
        shadow-mapSize={2048}
      >
        <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15, 1, 50]} />
      </directionalLight>

      <Cam fov={p.camFov} mouseFollow={p.camMouse} damping={p.camDamping} distance={p.camDistance} />

      <Blinds
        count={p.blindCount} slatWidth={p.slatWidth} slatHeight={p.slatHeight}
        position={[p.blindX, p.blindY, p.blindZ]}
        groupRotY={p.groupRotY} slatRotX={p.slatRotX} slatRotZ={p.slatRotZ}
        breatheSpeed={p.breatheSpeed} breatheAmount={p.breatheAmount}
      />

      <mesh receiveShadow scale={p.wallScale} position={[0, 0, 0]} rotation={[0, p.wallRotY, 0]}>
        <planeGeometry />
        <shadowMaterial transparent opacity={p.shadowOpacity} />
      </mesh>

      {p.particlesVisible && p.particleType === 'maple' && (
        <MapleLeaves speed={p.particlesSpeed} particleScale={p.particlesScale} pos={[p.particlesX, p.particlesY, p.particlesZ]} />
      )}
      {p.particlesVisible && p.particleType === 'pine' && (
        <PineNeedles speed={p.particlesSpeed} particleScale={p.particlesScale} pos={[p.particlesX, p.particlesY, p.particlesZ]} />
      )}
      {p.particlesVisible && p.particleType === 'rain' && (
        <Rain speed={p.particlesSpeed} particleScale={p.particlesScale} pos={[p.particlesX, p.particlesY, p.particlesZ]}
          dropSize={p.rainDropSize} dropLength={p.rainDropLength} wind={p.rainWind} count={p.rainCount} />
      )}

      <SoftShadows size={p.softSize} focus={p.softFocus} samples={p.softSamples} />
    </Canvas>
  )
}

function Cam({ fov, mouseFollow, damping, distance }) {
  const ref = useRef()
  useFrame((state, delta) => {
    easing.damp3(ref.current.position, [state.pointer.x * mouseFollow, state.pointer.y * mouseFollow, distance], damping, delta)
    ref.current.lookAt(0, 0, -100)
    ref.current.updateProjectionMatrix()
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
      <Instances castShadow>
        <boxGeometry />
        <meshBasicMaterial />
        <group ref={ref}>
          {instances.map((i) => (
            <Instance key={i} position={[0, i, 0]} scale={[slatWidth, slatHeight, 0.01]} rotation={[slatRotX, 0, 0]} />
          ))}
        </group>
        <Instance position={[18, count / 2, 0]} scale={[0.2, count, 0.01]} />
      </Instances>
    </group>
  )
}

function MapleLeaves({ speed, particleScale, pos }) {
  const group = useRef()
  const [ready, setReady] = useState(false)
  const data = useGLTF('/falling_leaves-transformed.glb', undefined, undefined, (err) => {
    console.warn('Maple leaves model not found — skipping. Add falling_leaves-transformed.glb to public/ to enable.')
  })

  const { actions, mixer } = useAnimations(data?.animations || [], group)

  useEffect(() => {
    if (data?.nodes && actions?.idle) {
      mixer.timeScale = speed
      actions.idle.play()
      setReady(true)
    }
  }, [speed, actions, mixer, data])

  if (!ready || !data?.nodes) return null

  return (
    <group ref={group} position={pos} scale={particleScale} dispose={null}>
      <group name="Sketchfab_Scene">
        <primitive object={data.nodes.GLTF_created_0_rootJoint} />
        {Object.entries(data.nodes).filter(([n]) => n.startsWith('Object_')).map(([name, node]) => (
          <skinnedMesh key={name} castShadow geometry={node.geometry} material={data.materials.material_0} skeleton={node.skeleton} />
        ))}
      </group>
    </group>
  )
}

function PineNeedles({ speed, particleScale, pos }) {
  const COUNT = 60
  const ref = useRef()
  const needles = useMemo(() => Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 12, y: Math.random() * 15, z: (Math.random() - 0.5) * 6,
    rotZ: (Math.random() - 0.5) * Math.PI, rotX: (Math.random() - 0.5) * 0.5,
    fallSpeed: 0.3 + Math.random() * 0.6, swaySpeed: 0.5 + Math.random() * 1.5,
    swayAmount: 0.2 + Math.random() * 0.5, length: 0.6 + Math.random() * 0.8,
  })), [])
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed
    const children = ref.current.children
    for (let i = 0; i < children.length; i++) {
      const n = needles[i]
      const y = ((n.y - t * n.fallSpeed) % 15 + 15) % 15 - 7.5
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
    const t = state.clock.elapsedTime * speed
    const children = ref.current.children
    for (let i = 0; i < Math.min(children.length, drops.length); i++) {
      const d = drops[i]
      const y = ((d.y - t * d.fallSpeed) % 20 + 20) % 20 - 10
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
}

// Preload is optional — if the file doesn't exist, maple leaves are skipped gracefully
try { useGLTF.preload('/falling_leaves-transformed.glb') } catch (e) {}
