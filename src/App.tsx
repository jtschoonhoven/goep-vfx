import React from 'react'
import Webcam from 'react-webcam'
import { Canvas, useFrame } from '@react-three/fiber'
import { useAspect, useVideoTexture } from '@react-three/drei'
import { EffectComposer } from '@react-three/postprocessing'

import { useInterval } from 'react-use'
import VfxChromaKey from './vfx/VfxChromaKey'
import VfxSobel, { SobelEffect } from './vfx/VfxSobel'
import VfxContrast from './vfx/VfxContrast'
import VfxBlur from './vfx/VfxBlur'
import midi from './utils/midi'

type AspectRatio = [number, number]

const VIDEO_CONSTRAINTS = { facingMode: 'user' }

interface SceneProps {
  stream: MediaStream
  aspect: AspectRatio
}

const Scene: React.FC<SceneProps> = ({ stream, aspect }) => {
  const sobeleRef = React.useRef<SobelEffect>(null)
  const size = useAspect(...aspect)
  const videoTexture = useVideoTexture(stream)

  useFrame(() => {
    if (sobeleRef.current) {
      sobeleRef.current.edgeRGBA = [
        Math.sin(Date.now() * 0.0011) + 1.2,
        Math.cos(Date.now() * 0.0012) + 1.2,
        Math.sin(Date.now() * 0.0013) + 1.2,
        1,
      ]
    }
  })

  return (
    <>
      <mesh scale={size}>
        <planeGeometry />
        <meshBasicMaterial map={videoTexture} toneMapped={false} />
      </mesh>

      <EffectComposer>
        <VfxBlur radius={7} />
        <VfxContrast brightness={0.0} contrast={0.2} />
        <VfxChromaKey keyRGB={[1.0, 1.0, 1.0]} similarity={0.1} />
        <VfxSobel
          weight={0.1}
          threshold={0.1}
          intensity={0.1}
          useEdgeRGBA={true}
          useBackgroundRGBA={true}
          ref={sobeleRef}
        />
      </EffectComposer>
    </>
  )
}

const App = () => {
  const webcamRef = React.useRef<Webcam>(null)
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  const [aspect, setAspect] = React.useState<AspectRatio>([16, 9])
  const [isActive, setIsActive] = React.useState(false)

  const { midiError } = midi.useMidi({ defaultChannel: 0 })
  midiError && console.error(midiError)

  // useInterval(() => midiCc({ code: 126 }), 400)
  // useInterval(() => midiCc({ code: 127 }), 400)

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
    <div
      className="h-screen w-screen"
      style={{
        background:
          'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 20px 20px',
      }}
    >
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
