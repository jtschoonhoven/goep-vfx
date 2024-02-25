import React from 'react'
import Webcam from 'react-webcam'
import { Canvas, useFrame } from '@react-three/fiber'
import { useAspect, useVideoTexture } from '@react-three/drei'
import { EffectComposer } from '@react-three/postprocessing'

import { useInterval } from 'react-use'
import VfxColorize, { ColorizeEffect } from './vfx/VfxColorize'
import VfxChromaKey from './vfx/VfxChromaKey'

type AspectRatio = [number, number]

const VIDEO_CONSTRAINTS = { facingMode: 'user' }

interface SceneProps {
  stream: MediaStream
  aspect: AspectRatio
}

const Scene: React.FC<SceneProps> = ({ stream, aspect }) => {
  const colorizeRef = React.useRef<ColorizeEffect>(null)
  const size = useAspect(...aspect)
  const videoTexture = useVideoTexture(stream)

  useFrame(() => {
    if (colorizeRef.current) {
      colorizeRef.current.r = Math.sin((Date.now() * 0.01) / 4) + 1
      colorizeRef.current.g = Math.sin((Date.now() * 0.01) / 3) + 1
      colorizeRef.current.b = Math.sin((Date.now() * 0.01) / 2) + 1
    }
  })

  return (
    <>
      <mesh scale={size}>
        <planeGeometry />
        <meshBasicMaterial map={videoTexture} toneMapped={false} />
      </mesh>

      <EffectComposer>
        <VfxColorize ref={colorizeRef} />
        <VfxChromaKey keyRGB={[1.0, 0.0, 0.0]} similarity={0.2} />
        <VfxChromaKey keyRGB={[0.0, 0.0, 1.0]} similarity={0.2} />
      </EffectComposer>
    </>
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
    <div className="h-screen w-screen" style={{ backgroundColor: 'purple' }}>
      <Canvas>
        {stream && isActive ? <Scene stream={stream} aspect={aspect} /> : null}
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
