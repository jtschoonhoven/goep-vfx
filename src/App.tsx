import React from 'react'
import Webcam from 'react-webcam'
import { Canvas, useFrame } from '@react-three/fiber'
import { useAspect, useVideoTexture } from '@react-three/drei'
import { EffectComposer } from '@react-three/postprocessing'

import { useInterval } from 'react-use'
import VfxColorize, { ColorizeEffect } from './vfx/VfxColorize'

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
  const colorizeRef = React.useRef<ColorizeEffect>(null)

  useFrame(() => {
    if (colorizeRef.current) {
      colorizeRef.current.r = Math.sin((Date.now() * 0.01) / 4) + 1
      colorizeRef.current.g = Math.sin((Date.now() * 0.01) / 3) + 1
      colorizeRef.current.b = Math.sin((Date.now() * 0.01) / 2) + 1
    }
  })

  return (
    <EffectComposer>
      <VfxColorize ref={colorizeRef} />
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
    isActive ? null : 100 // Stop polling once active
  )

  return (
    <div className="h-screen w-screen">
      <Canvas>
        <Scene stream={stream} aspect={aspect} isActive={isActive} />
        <Vfx />
      </Canvas>
      <Webcam
        // Webcam is mounted but hidden so we can pass the stream to the scene
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
