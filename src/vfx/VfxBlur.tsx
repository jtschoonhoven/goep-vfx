import React from 'react'
import { Uniform, WebGLRenderTarget, WebGLRenderer } from 'three'
import { BlendFunction, Effect } from 'postprocessing'

interface Props {
  radius?: number
  weight?: number
  blendFunction?: BlendFunction
}

/**
 * Colorize effect: multiply RGB channels by the given weights.
 */
const VfxBlur = React.forwardRef<BlurPassEffect, Props>((props, ref) => {
  const effect = React.useMemo(
    () => new BlurPassEffect(props),
    [props.radius, props.blendFunction]
  )
  return <primitive ref={ref} object={effect} dispose={null} />
})
export default VfxBlur

/**
 * Colorize effect implementation. Multiplies RGB channels by the given weights.
 * https://docs.pmnd.rs/react-postprocessing/effects/custom-effects
 */
export class BlurPassEffect extends Effect {
  radius: number
  weight: number

  constructor({
    radius = 1,
    weight = 1.0,
    blendFunction = BlendFunction.NORMAL,
  }: Props) {
    super('BlurEffect', FRAGMENT_SHADER, {
      blendFunction,
      uniforms: new Map<string, Uniform<number>>([
        ['radius', new Uniform(radius)],
        ['weight', new Uniform(weight)],
      ]),
    })
    this.radius = radius
    this.weight = weight
  }

  update(
    _renderer: WebGLRenderer,
    _inputBuffer: WebGLRenderTarget,
    _deltaTime?: number
  ) {
    const radius = this.uniforms.get('radius')
    if (radius) {
      radius.value = this.radius
    }
    const weight = this.uniforms.get('weight')
    if (weight) {
      weight.value = this.weight
    }
  }
}

const FRAGMENT_SHADER = `
uniform int radius;
uniform float weight;

// Postprocessing expects a fragment shader named "mainImage"
// https://github.com/pmndrs/postprocessing/wiki/Custom-Effects#shader-function-signatures
void mainImage(const in vec4 inputRGBA, const in vec2 uv, out vec4 outputRGBA) {
    if (radius == 0) {
        outputRGBA = inputRGBA;
        return;
    }
    if (weight == 0.0) {
        outputRGBA = inputRGBA;
        return;
    }
    int rad = min(radius, 12); // Limit to avoid performance issues
    float sigma = float(rad) * weight;
    float pi = 3.1415926535897932384626433832795;
    float amplitude = 1.0 / sqrt(2.0 * pi * sigma * sigma);
    vec4 sum = vec4(0.0);
    float stepX = 1.0 / resolution.x;
    float stepY = 1.0 / resolution.y;
    float weightSum = 0.0;

    for (int y = -rad; y <= rad; y++) {
        for (int x = -rad; x <= rad; x++) {
            vec2 offset = vec2(float(x) * stepX, float(y) * stepY);
            float pixelWeight = amplitude * exp(-0.5 * (dot(offset, offset)) / (sigma * sigma));
            sum += texture(inputBuffer, uv + offset) * pixelWeight;
            weightSum += pixelWeight;
        }
    }

    float originalAlpha = texture(inputBuffer, gl_FragCoord.xy / resolution.xy).a;
    outputRGBA = vec4((sum / weightSum).rgb, originalAlpha);
}
`
