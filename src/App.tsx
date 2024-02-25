import React from 'react'
import Webcam from 'react-webcam'
import { Canvas, useFrame } from '@react-three/fiber'
import { useAspect, useVideoTexture } from '@react-three/drei'
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Vignette,
} from '@react-three/postprocessing'
import { BloomEffect, VignetteEffect } from 'postprocessing'

import { useInterval } from 'react-use'

type AspectRatio = [number, number]

const VIDEO_CONSTRAINTS = { facingMode: 'user' }

interface VideoProps {
  stream: MediaStream
}

const VideoMaterial = ({ stream }: VideoProps) => {
  const texture = useVideoTexture(stream)
  return <meshBasicMaterial map={texture} toneMapped={false} />
}

interface SceneProps {
  stream?: MediaStream | null
  aspect: AspectRatio
  isActive: boolean
}

const Scene = ({ stream, aspect, isActive }: SceneProps) => {
  const size = useAspect(...aspect)

  // Wait until active
  if (!stream || !isActive) {
    return <meshBasicMaterial wireframe />
  }

  return (
    <mesh scale={size}>
      <planeGeometry />
      <VideoMaterial stream={stream} />
    </mesh>
  )
}

const Vfx = () => {
  const bloomRef = React.useRef<typeof BloomEffect>(null)
  const vignetteRef = React.useRef<typeof VignetteEffect>(null)

  useFrame(() => {
    if (bloomRef.current instanceof BloomEffect) {
      bloomRef.current.intensity = Math.sin(Date.now() * 0.01)
    }
    if (vignetteRef.current instanceof VignetteEffect) {
      vignetteRef.current.offset = Math.sin(Date.now() * 0.01)
    }
  })

  return (
    <EffectComposer>
      <DepthOfField
        focusDistance={0}
        focalLength={0.02}
        bokehScale={2}
        height={480}
      />
      <Bloom
        luminanceThreshold={0}
        luminanceSmoothing={0.9}
        height={300}
        ref={bloomRef}
      />
      <Vignette eskil={false} offset={0.1} darkness={1.1} ref={vignetteRef} />
    </EffectComposer>
  )
}

const App = () => {
  const webcamRef = React.useRef<Webcam>(null)
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  const [aspect, setAspect] = React.useState<AspectRatio>([16, 9])
  const [isActive, setIsActive] = React.useState(false)

  // The only way to know when the stream is ready is to poll
  useInterval(
    () => {
      if (!stream?.active) {
        return
      }
      const video = webcamRef.current?.video
      if (!video?.videoWidth || !video?.videoHeight) {
        return
      }
      setAspect([video.videoWidth, video.videoHeight])
      setIsActive(true)
    },
    isActive ? null : 100
  )

  return (
    <div className="h-screen w-screen">
      <Canvas>
        <Scene stream={stream} aspect={aspect} isActive={isActive} />
        <Vfx />
      </Canvas>
      <Webcam
        className="hidden"
        ref={webcamRef}
        videoConstraints={VIDEO_CONSTRAINTS}
        onUserMedia={setStream}
        mirrored
      />
    </div>
  )
}

export default App
