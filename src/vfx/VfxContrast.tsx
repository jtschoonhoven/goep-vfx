import React from 'react'

import { BrightnessContrast } from '@react-three/postprocessing'
import { BrightnessContrastEffect } from 'postprocessing'

interface Props {
  brightness?: number
  contrast?: number
}

/**
 * Brightness and contrast effect.
 * https://docs.pmnd.rs/react-postprocessing/effects/brightness-contrast
 */
const VfxContrast = React.forwardRef<BrightnessContrastEffect, Props>(
  ({ brightness = 0.0, contrast = 0.0 }, ref) => {
    return (
      <BrightnessContrast
        brightness={brightness}
        contrast={contrast}
        // @ts-expect-error
        ref={ref}
      />
    )
  }
)

export default VfxContrast
