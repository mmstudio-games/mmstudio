import { createQuadProgram, GLSL_NOISE } from './gl-quad'

/**
 * 「砚台折光镜」：一枚贴在纸面上的圆形墨镜。镜内是水面下的汤底（一张预先画好的贴图），
 * 中间放大、边缘急折并带色散；按住时液面荡开波纹。镜外透明，露出上面的纸。
 */
const FRAGMENT = `#version 300 es
precision highp float;
out vec4 outColor;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uLens;
uniform float uR;
uniform float uTime;
uniform float uPress;
uniform float uRipple;
uniform float uAlpha;
uniform float uDpr;
${GLSL_NOISE}
vec3 tex(vec2 px) {
  return texture(uTex, clamp(px / uRes, vec2(0.0), vec2(1.0))).rgb;
}
void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 d = frag - uLens;
  float dist = length(d);
  float rr = dist / uR;
  if (rr > 1.4 || uAlpha <= 0.0) {
    outColor = vec4(0.0);
    return;
  }
  float aa = 1.5 * uDpr / uR;
  vec2 ds = frag - (uLens + vec2(uR * 0.05, -uR * 0.09));
  float shadow = (1.0 - smoothstep(0.9, 1.32, length(ds) / uR)) * 0.26;
  float inside = 1.0 - smoothstep(1.0 - aa, 1.0, rr);
  vec2 dir = dist > 0.0 ? d / dist : vec2(0.0);

  float k = mix(0.7, 1.0, rr * rr) + 0.26 * pow(rr, 6.0);
  vec2 wobble = (vec2(noise(frag * 0.012 / uDpr + uTime * 0.6), noise(frag * 0.012 / uDpr - uTime * 0.5 + 7.1)) - 0.5) * 5.0 * uDpr * (1.0 + uPress * 1.5);
  float ripple = 0.0;
  if (uRipple < 3.0) {
    float front = uRipple * uR * 1.5;
    float ring = sin((dist - front) * 0.085 / uDpr) * exp(-abs(dist - front) / (uR * 0.28));
    ripple = ring * exp(-uRipple * 1.3) * 9.0 * uDpr;
  }
  vec2 offset = wobble + dir * ripple;
  float disp = 0.016 + 0.06 * pow(rr, 4.0);
  vec3 color;
  color.r = tex(uLens + d * k * (1.0 + disp) + offset).r;
  color.g = tex(uLens + d * k + offset).g;
  color.b = tex(uLens + d * k * (1.0 - disp) + offset).b;

  color *= 1.0 - smoothstep(0.7, 1.0, rr) * 0.5;
  float rim = smoothstep(0.95, 0.982, rr) * (1.0 - smoothstep(0.982, 1.0, rr));
  color += rim * vec3(0.95, 0.93, 0.88) * 0.6;
  vec2 hl = d / uR - vec2(-0.36, 0.42);
  color += exp(-dot(hl, hl) * 14.0) * 0.2;
  float caustic = pow(noise(frag * 0.03 / uDpr + uTime * 0.4), 6.0) * 0.18 * (1.0 - rr);
  color += caustic;

  float alpha = inside + shadow * (1.0 - inside);
  outColor = vec4(color * inside, alpha) * uAlpha;
}`

export function createLensGlass(canvas: HTMLCanvasElement) {
  const quad = createQuadProgram(canvas, FRAGMENT)
  const { gl } = quad
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  let ready = false

  return {
    fit: () => quad.fit(2),
    get dpr() {
      return quad.dpr
    },
    upload(source: HTMLCanvasElement) {
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
      ready = true
    },
    /** 坐标与半径为 CSS 像素，原点在左上。 */
    render(x: number, y: number, r: number, time: number, press: number, ripple: number, alpha: number) {
      quad.fit(2)
      const dpr = quad.dpr
      quad.begin()
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      quad.i('uTex', 0)
      quad.f('uRes', canvas.width, canvas.height)
      quad.f('uLens', x * dpr, canvas.height - y * dpr)
      quad.f('uR', Math.max(1, r * dpr))
      quad.f('uTime', time)
      quad.f('uPress', press)
      quad.f('uRipple', ripple)
      quad.f('uAlpha', ready ? alpha : 0)
      quad.f('uDpr', dpr)
      quad.draw()
    },
    dispose() {
      gl.deleteTexture(texture)
      quad.dispose()
    },
  }
}

export type LensGlass = ReturnType<typeof createLensGlass>
