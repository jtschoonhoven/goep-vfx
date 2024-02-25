import React from 'react'
import {
  Texture,
  Uniform,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three'
import { Effect } from 'postprocessing'

interface Props {
  keyRGB?: [number, number, number] // E.g. [0.0, 0.5, 1.0]
  similarity?: number
  smoothness?: number
  spill?: number
}

/**
 * Chroma key effect (AKA green screen).
 */
const VfxChromaKey = React.forwardRef<ChromaKeyEffect, Props>((props, ref) => {
  let r: number | null = null
  let g: number | null = null
  let b: number | null = null

  if (props.keyRGB) {
    r = props.keyRGB[0]
    g = props.keyRGB[1]
    b = props.keyRGB[2]
  }

  const effect = React.useMemo(
    () => new ChromaKeyEffect(props),
    [r, g, b, props.similarity, props.smoothness, props.spill]
  )
  return <primitive ref={ref} object={effect} dispose={null} />
})

export default VfxChromaKey

/**
 * Chroma key effect implementation.
 * https://docs.pmnd.rs/react-postprocessing/effects/custom-effects
 */
export class ChromaKeyEffect extends Effect {
  keyRGB: [number, number, number] // E.g. [0.0, 0.5, 1.0]
  similarity: number
  smoothness: number
  spill: number

  constructor({
    keyRGB = [0.1, 0.6, 0.1],
    similarity = 0.3,
    smoothness = 0.0,
    spill = 0.5,
  }: Props) {
    super('ChromaKey', FRAGMENT_SHADER, {
      uniforms: new Map<string, Uniform<Texture | Vector3 | number>>([
        ['keyRGB', new Uniform(new Vector3(...keyRGB))],
        ['similarity', new Uniform(similarity)],
        ['smoothness', new Uniform(smoothness)],
        ['spill', new Uniform(spill)],
      ]),
    })

    this.keyRGB = keyRGB
    this.similarity = similarity
    this.smoothness = smoothness
    this.spill = spill
  }

  update(
    _renderer: WebGLRenderer,
    _inputBuffer: WebGLRenderTarget,
    _deltaTime?: number
  ) {
    const keyRGB = this.uniforms.get('keyRGB')
    if (keyRGB) {
      keyRGB.value = new Vector3(...this.keyRGB)
    }
    const similarity = this.uniforms.get('similarity')
    if (similarity) {
      similarity.value = this.similarity
    }
    const smoothness = this.uniforms.get('smoothness')
    if (smoothness) {
      smoothness.value = this.smoothness
    }
    const spill = this.uniforms.get('spill')
    if (spill) {
      spill.value = this.spill
    }
  }
}

const FRAGMENT_SHADER = `
uniform vec3 keyRGB;
uniform float similarity;
uniform float smoothness;
uniform float spill;

void mainImage(const in vec4 inputRGBA, const in vec2 uv, out vec4 outputRGBA) {
  float Y1 = 0.299 * inputRGBA.r + 0.587 * inputRGBA.g + 0.114 * inputRGBA.b;
  float Cr1 = keyRGB.r - Y1;
  float Cb1 = keyRGB.b - Y1;

  float Y2 = 0.299 * inputRGBA.r + 0.587 * inputRGBA.g + 0.114 * inputRGBA.b;
  float Cr2 = inputRGBA.r - Y2;
  float Cb2 = inputRGBA.b - Y2;

  float blend = smoothstep(similarity, similarity + smoothness, distance(vec2(Cr2, Cb2), vec2(Cr1, Cb1)));
  outputRGBA = vec4(inputRGBA.rgb, inputRGBA.a * blend);
}
`
