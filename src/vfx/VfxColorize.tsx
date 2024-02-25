import React from 'react'
import { Uniform, Vector3, WebGLRenderTarget, WebGLRenderer } from 'three'
import { Effect } from 'postprocessing'

interface Props {
  r?: number
  g?: number
  b?: number
}

/**
 * Colorize effect: multiply RGB channels by the given weights.
 */
const VfxColorize = React.forwardRef<ColorizeEffect, Props>((props, ref) => {
  const effect = React.useMemo(
    () => new ColorizeEffect(props),
    [props.r, props.g, props.b]
  )
  return <primitive ref={ref} object={effect} dispose={null} />
})

export default VfxColorize

/**
 * Colorize effect implementation. Multiplies RGB channels by the given weights.
 * https://docs.pmnd.rs/react-postprocessing/effects/custom-effects
 */
export class ColorizeEffect extends Effect {
  r: number
  g: number
  b: number

  constructor({ r = 1, g = 1, b = 1 }: Props) {
    const initialWeights = new Vector3(r, g, b)

    super('ColorizeEffect', FRAGMENT_SHADER, {
      uniforms: new Map([['weights', new Uniform(initialWeights)]]),
    })

    this.r = r
    this.g = g
    this.b = b
  }

  update(
    _renderer: WebGLRenderer,
    _inputBuffer: WebGLRenderTarget,
    _deltaTime?: number
  ) {
    const weights = this.uniforms.get('weights')
    if (weights) {
      weights.value = new Vector3(this.r, this.g, this.b)
    }
  }
}

const FRAGMENT_SHADER = `
uniform vec3 weights;  // Variable received from javascript

// Postprocessing expects a fragment shader named "mainImage"
// https://github.com/pmndrs/postprocessing/wiki/Custom-Effects#shader-function-signatures
void mainImage(const in vec4 inputRGBA, const in vec2 uv, out vec4 outputRGBA) {
	outputRGBA = vec4(inputRGBA.rgb * weights, inputRGBA.a);
}
`
