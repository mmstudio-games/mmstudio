import { createQuadProgram, GLSL_NOISE } from './gl-quad'

/**
 * 第 0 幕中央的墨团：宣纸上一滩缓慢呼吸的墨，边缘有洇开的纤维。
 * churn 让它翻涌，crack 让它裂开一道缝露出底下的红字，slam 是「是」砸下时的一下震动。
 */
const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform vec2 uRes;
uniform float uTime;
uniform float uChurn;
uniform float uCrack;
uniform float uSlam;
uniform vec2 uCrackA;
uniform vec2 uCrackB;
${GLSL_NOISE}
float segment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  float t = uTime;
  float churn = uChurn;
  float breath = 1.0 + 0.035 * sin(t * 0.7) + 0.018 * sin(t * 1.9 + 1.3);

  vec2 warp = vec2(fbm(p * 1.7 + vec2(0.0, t * 0.06 + churn * t * 0.4)), fbm(p * 1.7 + vec2(5.2, -t * 0.05 - churn * t * 0.3))) - 0.5;
  vec2 q = p + warp * (0.2 + churn * 0.55);
  vec2 radius = vec2(aspect * 0.39, 0.38) * breath * (1.0 + uSlam * 0.05);
  float r = length(q / radius);
  float edge = r - 1.0 + (fbm(q * 3.1 + t * 0.04 + churn * t * 0.5) - 0.5) * (0.55 + churn * 0.7);

  float body = smoothstep(0.04, -0.2, edge);
  float fibre = fbm(q * 15.0 + vec2(t * 0.01, 0.0));
  float bleed = smoothstep(0.2, -0.02, edge) * smoothstep(0.56, 0.78, fibre) * 0.6;
  float a = max(body, bleed);

  float grain = fbm(q * 9.0 - t * 0.02);
  float density = 0.8 + 0.2 * grain;
  density += smoothstep(-0.26, -0.03, edge) * smoothstep(0.05, -0.05, edge) * 0.14;

  if (uCrack > 0.0) {
    float d = segment(p, uCrackA, uCrackB);
    float jag = (fbm(p * 24.0) - 0.5) * 0.02;
    float width = (0.003 + 0.017 * uCrack) * (0.55 + 0.9 * noise(p * 28.0));
    float crack = 1.0 - smoothstep(width, width + 0.005, d + jag);
    a *= 1.0 - crack * min(1.0, uCrack * 1.4);
  }

  float alpha = clamp(a * density, 0.0, 1.0);
  vec3 ink = vec3(0.051, 0.043, 0.035);
  vec3 wash = vec3(0.2, 0.17, 0.14);
  vec3 color = mix(wash, ink, smoothstep(0.15, 0.85, alpha));
  outColor = vec4(color * alpha, alpha);
}`

/** 裂缝两端，单位与着色器里的 p 相同（以画布高度为 1，中心为原点，y 向上）。 */
export const CRACK = { a: [0.3, 0.2], b: [0.19, -0.3] } as const

export function createInkBlob(canvas: HTMLCanvasElement) {
  const quad = createQuadProgram(canvas, FRAGMENT)
  const state = { churn: 0, crack: 0, slam: 0 }
  const target = { crack: 0 }

  return {
    churn() {
      state.churn = 1
    },
    crack() {
      target.crack = 1
    },
    slam() {
      state.slam = 1
    },
    reset() {
      state.churn = 0
      state.crack = 0
      state.slam = 0
      target.crack = 0
    },
    render(time: number, dt: number) {
      quad.fit(1.5)
      state.churn = Math.max(0, state.churn - dt * 0.42)
      state.slam = Math.max(0, state.slam - dt * 3.2)
      state.crack += (target.crack - state.crack) * (1 - Math.exp(-dt * 2.4))
      const aspect = canvas.width / canvas.height
      quad.begin()
      quad.f('uRes', canvas.width, canvas.height)
      quad.f('uTime', time)
      quad.f('uChurn', state.churn * state.churn)
      quad.f('uCrack', state.crack)
      quad.f('uSlam', Math.sin(state.slam * Math.PI))
      quad.f('uCrackA', CRACK.a[0] * aspect, CRACK.a[1])
      quad.f('uCrackB', CRACK.b[0] * aspect, CRACK.b[1])
      quad.draw()
    },
    dispose() {
      quad.dispose()
    },
  }
}

export type InkBlob = ReturnType<typeof createInkBlob>
