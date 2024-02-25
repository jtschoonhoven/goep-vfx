import React from 'react'
import Webcam from 'react-webcam'
import { Canvas } from '@react-three/fiber'
import { useAspect, useVideoTexture } from '@react-three/drei'
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
      </Canvas>
      <Webcam
        style={{ display: 'none' }}
        ref={webcamRef}
        videoConstraints={VIDEO_CONSTRAINTS}
        onUserMedia={setStream}
        mirrored
      />
    </div>
  )
}

export default App
