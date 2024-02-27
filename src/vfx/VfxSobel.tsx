import React from 'react'
import { Effect } from 'postprocessing'
import { Uniform, Vector4, WebGLRenderTarget, WebGLRenderer } from 'three'

interface Props {
  weight?: number
  threshold?: number
  intensity?: number
  edgeRGBA?: [number, number, number, number]
  useEdgeRGBA?: boolean
  useBackgroundRGBA?: boolean
  backgroundRGBA?: [number, number, number, number]
}

/**
 * Sobel edge detection effect.
 */
const VfxSobel = React.forwardRef<SobelEffect, Props>((props, ref) => {
  let edgeR: number | null = null
  let edgeG: number | null = null
  let edgeB: number | null = null
  let edgeA: number | null = null

  if (props.edgeRGBA) {
    edgeR = props.edgeRGBA[0]
    edgeG = props.edgeRGBA[1]
    edgeB = props.edgeRGBA[2]
    edgeA = props.edgeRGBA[3]
  }

  let bgR: number | null = null
  let bgG: number | null = null
  let bgB: number | null = null
  let bgA: number | null = null

  if (props.backgroundRGBA) {
    bgR = props.backgroundRGBA[0]
    bgG = props.backgroundRGBA[1]
    bgB = props.backgroundRGBA[2]
    bgA = props.backgroundRGBA[3]
  }

  const effect = React.useMemo(
    () => new SobelEffect(props),
    [
      props.weight,
      props.threshold,
      props.intensity,
      edgeR,
      edgeG,
      edgeB,
      edgeA,
      props.useEdgeRGBA,
      bgR,
      bgG,
      bgB,
      bgA,
      props.useBackgroundRGBA,
    ]
  )
  return <primitive ref={ref} object={effect} dispose={null} />
})

export default VfxSobel

/**
 * Sobel implementation.
 * https://docs.pmnd.rs/react-postprocessing/effects/custom-effects
 */
export class SobelEffect extends Effect {
  weight: number
  threshold: number
  intensity: number
  edgeRGBA: [number, number, number, number]
  useEdgeRGBA: boolean
  backgroundRGBA: [number, number, number, number]
  useBackgroundRGBA: boolean

  constructor({
    weight = 0.5,
    threshold = 0.08,
    intensity = 0.5,
    edgeRGBA = [0, 0, 0, 1],
    useEdgeRGBA = true,
    backgroundRGBA = [0, 0, 0, 1],
    useBackgroundRGBA = false,
  }: Props) {
    super('SobelEffect', FRAGMENT_SHADER, {
      uniforms: new Map<string, Uniform<number | Vector4 | boolean>>([
        ['weight', new Uniform(weight)],
        ['threshold', new Uniform(threshold)],
        ['intensity', new Uniform(intensity)],
        [
          'edgeRGBA',
          new Uniform(
            new Vector4(edgeRGBA[0], edgeRGBA[1], edgeRGBA[2], edgeRGBA[3])
          ),
        ],
        ['useEdgeRGBA', new Uniform(useEdgeRGBA)],
        [
          'backgroundRGBA',
          new Uniform(
            new Vector4(
              backgroundRGBA[0],
              backgroundRGBA[1],
              backgroundRGBA[2],
              backgroundRGBA[3]
            )
          ),
        ],
        ['useBackgroundRGBA', new Uniform(useBackgroundRGBA)],
      ]),
    })
    this.weight = weight
    this.threshold = threshold
    this.intensity = intensity
    this.edgeRGBA = edgeRGBA
    this.useEdgeRGBA = useEdgeRGBA
    this.backgroundRGBA = backgroundRGBA
    this.useBackgroundRGBA = useBackgroundRGBA
  }

  update(
    _renderer: WebGLRenderer,
    _inputBuffer: WebGLRenderTarget,
    _deltaTime?: number
  ) {
    const weight = this.uniforms.get('weight')
    if (weight) {
      weight.value = this.weight
    }
    const threshold = this.uniforms.get('threshold')
    if (threshold) {
      threshold.value = this.threshold
    }
    const intensity = this.uniforms.get('intensity')
    if (intensity) {
      intensity.value = this.intensity
    }
    const edgeRGBA = this.uniforms.get('edgeRGBA')
    if (edgeRGBA) {
      edgeRGBA.value = new Vector4(
        this.edgeRGBA[0],
        this.edgeRGBA[1],
        this.edgeRGBA[2]
      )
    }
    const useEdgeRGBA = this.uniforms.get('useEdgeRGBA')
    if (useEdgeRGBA) {
      useEdgeRGBA.value = this.useEdgeRGBA
    }
    const backgroundRGBA = this.uniforms.get('backgroundRGBA')
    if (backgroundRGBA) {
      backgroundRGBA.value = new Vector4(
        this.backgroundRGBA[0],
        this.backgroundRGBA[1],
        this.backgroundRGBA[2]
      )
    }
    const useBackgroundRGBA = this.uniforms.get('useBackgroundRGBA')
    if (useBackgroundRGBA) {
      useBackgroundRGBA.value = this.useBackgroundRGBA
    }
  }
}

const FRAGMENT_SHADER = `
uniform float weight;
uniform float threshold;
uniform float intensity;
uniform vec4 edgeRGBA;
uniform bool useEdgeRGBA;
uniform vec4 backgroundRGBA;
uniform bool useBackgroundRGBA;

// Postprocessing expects a fragment shader named "mainImage"
// https://github.com/pmndrs/postprocessing/wiki/Custom-Effects#shader-function-signatures
void mainImage(const in vec4 inputRGBA, const in vec2 uv, out vec4 outputRGBA) {
    // Sobel kernel for horizontal and vertical edge detection
    float w = weight + 0.5;
    float kernelX[9] = float[](-1.0 * w, 0.0, 1.0 * w, -2.0 * w, 0.0, 2.0 * w, -1.0 * w, 0.0, 1.0 * w);
    float kernelY[9] = float[](-1.0 * w, -2.0 * w, -1.0 * w, 0.0, 0.0, 0.0, 1.0 * w, 2.0 * w, 1.0 * w);

    // Initialize gradient components
    float Gx = 0.0;
    float Gy = 0.0;

    // Loop through the surrounding pixels
    for(int x = -1; x <= 1; x++) {
        for(int y = -1; y <= 1; y++) {
            // Calculate the UV offset for the neighboring pixel
            vec2 offset = vec2(x, y) * texelSize;

            // Sample the neighboring pixel
            vec4 neighborPixel = texture(inputBuffer, uv + offset);

            // Convert the neighbor pixel to grayscale using luminosity method
            float neighborIntensity = dot(neighborPixel.rgb, vec3(0.299, 0.587, 0.114));

            // Accumulate the horizontal and vertical gradients
            Gx += neighborIntensity * kernelX[(x + 1) + (y + 1) * 3];
            Gy += neighborIntensity * kernelY[(x + 1) + (y + 1) * 3];
        }
    }

    // Calculate the gradient magnitude
    float G = sqrt(pow(Gx, 2.0) + pow(Gy, 2.0));

    if (G < threshold) {
      // If the magnitude (G) is below the threshold then treat as background
      if (useBackgroundRGBA) {
          // If "useBackgroundRGBA" is true then output the background color
          outputRGBA = backgroundRGBA;
        } else {
          // Otherwise output the original input
          outputRGBA = inputRGBA;
        }
      } else {
        // If the magnitude (G) is above the threshold then treat as edge
        if (useEdgeRGBA) {
          // If "useEdgeRGBA" is true then output the edge color
          if (useBackgroundRGBA) {
            // If "useBackgroundRGBA" is true then mix the edge color with the background color
            outputRGBA = mix(backgroundRGBA, edgeRGBA, G * intensity * 10.0);
          } else {
            // Otherwise mix the edge color with the input color
            outputRGBA = mix(inputRGBA, edgeRGBA, G * intensity * 10.0);
          }
        } else {
          // Otherwise output the original input
          outputRGBA = inputRGBA;
        }
    }

}
`
