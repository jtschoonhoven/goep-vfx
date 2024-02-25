import React from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { BloomEffect } from 'postprocessing'

export const Vfx = () => {
  const bloomRef = React.useRef<typeof BloomEffect>(null)

  useFrame(() => {
    if (bloomRef.current instanceof BloomEffect) {
      bloomRef.current.intensity = Math.sin((Date.now() * 0.01) / 4)
    }
  })

  return (
    <EffectComposer>
      <MyCustomEffect param={0.1} />
      <Bloom
        luminanceThreshold={0}
        luminanceSmoothing={0.9}
        height={300}
        ref={bloomRef}
      />
    </EffectComposer>
  )
}
