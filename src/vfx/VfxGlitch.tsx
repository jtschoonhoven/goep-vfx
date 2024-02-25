import React from 'react'

import { Glitch } from '@react-three/postprocessing'
import { GlitchMode, GlitchEffect } from 'postprocessing'
import { Vector2 } from 'three'

interface Props {
  delaySecondsMin?: number
  delaySecondsMax?: number
  strengthPctMin?: number
  strengthPctMax?: number
}

/**
 * Glitch effect.
 * https://docs.pmnd.rs/react-postprocessing/effects/glitch
 */
const VfxGlitch = React.forwardRef<GlitchEffect, Props>(
  (
    {
      delaySecondsMin = 0.5,
      delaySecondsMax = 1.0,
      strengthPctMin = 0,
      strengthPctMax = 1,
    },
    ref
  ) => {
    const delay = new Vector2(delaySecondsMin, delaySecondsMax)
    const strength = new Vector2(strengthPctMin, strengthPctMax)
    return (
      <Glitch
        mode={GlitchMode.SPORADIC}
        delay={delay}
        strength={strength}
        ref={ref}
      />
    )
  }
)

export default VfxGlitch
