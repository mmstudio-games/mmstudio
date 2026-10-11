import {
  DepthTexture,
  HalfFloatType,
  LinearFilter,
  Matrix4,
  Mesh,
  MeshNormalMaterial,
  NearestFilter,
  OrthographicCamera,
  type PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  UnsignedIntType,
  Vector2,
  Vector3,
  type WebGLRenderer,
  WebGLRenderTarget,
} from 'three'

const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

/**
 * 把打好光的画面换成套色木刻：亮度决定刻痕宽度，刻痕按世界坐标贴在物体表面，
 * 受光处轮廓留黑棱，背光处轮廓刻细白线，红色材质印第二块朱红版。
 */
const FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform mat4 uProjInv;
uniform mat4 uViewInv;
uniform vec2 uRes;
uniform float uNear;
uniform float uFar;
uniform float uPxPerM;
uniform float uSpacing;
uniform float uGain;
uniform vec3 uCam;
uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uRed;

float hash1(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash1(i), hash1(i + vec2(1, 0)), u.x), mix(hash1(i + vec2(0, 1)), hash1(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.3; a *= 0.5; }
  return s;
}

vec3 worldAt(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  vec4 view = uProjInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  view /= view.w;
  return (uViewInv * view).xyz;
}
float linDepth(vec2 uv) {
  float z = texture2D(tDepth, uv).x * 2.0 - 1.0;
  return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear));
}
vec3 normalAt(vec2 uv) {
  vec3 n = texture2D(tNormal, uv).xyz * 2.0 - 1.0;
  return normalize((uViewInv * vec4(n, 0.0)).xyz);
}

// 一组刻痕。q 是表面坐标（米），刻痕沿 q.x 走。返回 1 表示这里被刻掉、露出纸。
float strokes(vec2 q, float tone, float density, float lodBlend) {
  float warp = (fbm(q * vec2(0.35, 1.3)) - 0.5) * 1.1 + (vnoise(q * vec2(1.7, 6.0)) - 0.5) * 0.22;
  float s = q.y * density + warp;
  float idx = floor(s);
  float t = abs(fract(s) - 0.5) * 2.0;
  // 档位过渡：隔行刻痕渐细，另一半渐粗，露纸面积不变
  float wscale = mix(1.0 + lodBlend, 1.0 - lodBlend, mod(idx, 2.0));
  // 每一刀沿走向有粗细起伏，暗处会断开
  float along = q.x * 0.55 + hash1(vec2(idx, 3.7)) * 40.0;
  float swell = vnoise(vec2(along, idx * 1.37));
  float broken = smoothstep(0.18, 0.3, vnoise(vec2(along * 0.6 + 9.0, idx * 2.11)));
  float width = tone * wscale * (0.55 + 0.9 * swell) * mix(1.0, broken, 0.55 * (1.0 - tone));
  float aa = fwidth(s) * 1.4;
  return 1.0 - smoothstep(width - aa, width + aa, t);
}

void main() {
  vec2 uv = vUv;
  vec2 px = 1.0 / uRes;
  float depth = texture2D(tDepth, uv).x;
  vec3 col = texture2D(tColor, uv).rgb;
  vec3 p = worldAt(uv);
  vec3 n = normalAt(uv);
  float dist = length(p - uCam);

  float lumRaw = dot(col, vec3(0.299, 0.587, 0.114));
  float lum = lumRaw * uGain;
  // 第二块版：明显偏红的表面印朱红
  float redness = clamp((col.r - max(col.g, col.b)) / max(col.r, 1e-3), 0.0, 1.0);
  float accent = smoothstep(0.35, 0.6, redness);
  lum = mix(lum, max(col.r, lum) * 1.6, accent);

  // 高光有肩部不至于整片铲净，暗部拖长，角落里仍能落几刀
  float tone = 1.0 - exp(-lum * 2.2);
  tone = smoothstep(0.015, 0.95, pow(tone, 0.72));

  // 按朝向选取表面坐标，三个朝向各用一个刻痕方向
  vec3 an = abs(n);
  vec2 q; float ang;
  if (an.y > an.x && an.y > an.z) { q = p.xz; ang = 0.42; }
  else if (an.x > an.z) { q = p.zy; ang = 0.28; }
  else { q = p.xy; ang = 1.44; }
  float ca = cos(ang), sa = sin(ang);
  q = mat2(ca, -sa, sa, ca) * q;

  // 按距离分档，让屏幕上的刻痕间距大致不变
  float want = uPxPerM / (max(dist, 0.3) * uSpacing);
  float lod = log2(256.0 / want);
  float fl = floor(lod);
  float cut = strokes(q, tone, 256.0 * exp2(-fl), smoothstep(0.15, 0.85, lod - fl));
  cut = max(cut, smoothstep(0.93, 0.995, tone));
  cut *= smoothstep(0.02, 0.07, tone);

  // 轮廓：深度或朝向突变处
  float d0 = linDepth(uv);
  float dx = abs(linDepth(uv + vec2(px.x, 0.0)) - linDepth(uv - vec2(px.x, 0.0)));
  float dy = abs(linDepth(uv + vec2(0.0, px.y)) - linDepth(uv - vec2(0.0, px.y)));
  float de = smoothstep(0.02, 0.06, (dx + dy) / max(d0, 0.5));
  vec3 nx = normalAt(uv + vec2(px.x, 0.0)), ny = normalAt(uv + vec2(0.0, px.y));
  float ne = smoothstep(0.25, 0.6, length(n - nx) + length(n - ny));
  float edge = max(de, ne);
  float lit = smoothstep(0.1, 0.24, tone);
  float seen = smoothstep(0.0025, 0.012, lumRaw);
  cut = mix(max(cut, edge * seen * 0.999), cut * (1.0 - edge), lit);

  if (depth > 0.99999) cut = 0.0;

  // 铲净处的残刀与墨面的针孔
  vec2 sp = gl_FragCoord.xy;
  float grainHi = hash1(floor(sp * 0.75) + 13.0);
  float fibre = fbm(sp * vec2(0.012, 0.11));
  float chatter = step(0.972, vnoise(sp * vec2(0.9, 0.14) + 40.0) * (0.72 + 0.56 * fibre));
  cut = mix(cut, cut * (1.0 - chatter), 0.9);
  float pinhole = step(0.9988, grainHi) * step(0.56, fibre);
  float paperShow = clamp(cut + pinhole * 0.9, 0.0, 1.0);

  vec3 paper = uPaper * (0.94 + 0.08 * fbm(sp * 0.035)) * (0.985 + 0.03 * grainHi);
  vec3 ink = uInk * (0.85 + 0.5 * fbm(sp * 0.02 + 5.0));
  vec3 red = uRed * (0.9 + 0.25 * fbm(sp * 0.03 + 9.0));
  gl_FragColor = vec4(mix(ink, mix(paper, red, accent), paperShow), 1.0);
}
`

export type WoodcutPass = ReturnType<typeof createWoodcutPass>

/** 两遍场景渲染（受光色与法线）加一遍全屏着色。颜色直接按显示色给出，不再做色彩空间转换。 */
export function createWoodcutPass(renderer: WebGLRenderer) {
  const depthTexture = new DepthTexture(2, 2)
  depthTexture.type = UnsignedIntType
  const color = new WebGLRenderTarget(2, 2, {
    depthTexture,
    type: HalfFloatType,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
  })
  const normal = new WebGLRenderTarget(2, 2, { minFilter: NearestFilter, magFilter: NearestFilter })
  const normalMaterial = new MeshNormalMaterial()
  const uniforms = {
    tColor: { value: color.texture },
    tDepth: { value: depthTexture },
    tNormal: { value: normal.texture },
    uProjInv: { value: new Matrix4() },
    uViewInv: { value: new Matrix4() },
    uRes: { value: new Vector2(2, 2) },
    uNear: { value: 0.1 },
    uFar: { value: 60 },
    uPxPerM: { value: 1300 },
    uSpacing: { value: 11 },
    uGain: { value: 1 },
    uCam: { value: new Vector3() },
    uPaper: { value: new Vector3(0.902, 0.812, 0.667) },
    uInk: { value: new Vector3(0.071, 0.051, 0.035) },
    uRed: { value: new Vector3(0.62, 0.15, 0.1) },
  }
  const material = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms,
    depthTest: false,
    depthWrite: false,
  })
  const quad = new Mesh(new PlaneGeometry(2, 2), material)
  quad.frustumCulled = false
  const postScene = new Scene()
  postScene.add(quad)
  const postCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

  return {
    uniforms,
    setSize(width: number, height: number) {
      color.setSize(width, height)
      normal.setSize(width, height)
      uniforms.uRes.value.set(width, height)
    },
    render(scene: Scene, camera: PerspectiveCamera) {
      renderer.setRenderTarget(color)
      renderer.render(scene, camera)

      // 法线这一遍不需要投影贴图
      const shadows = renderer.shadowMap.autoUpdate
      const needs = renderer.shadowMap.needsUpdate
      renderer.shadowMap.autoUpdate = false
      renderer.shadowMap.needsUpdate = false
      const background = scene.background
      scene.overrideMaterial = normalMaterial
      scene.background = null
      renderer.setRenderTarget(normal)
      renderer.setClearColor(0x8080ff, 1)
      renderer.clear()
      renderer.render(scene, camera)
      scene.overrideMaterial = null
      scene.background = background
      renderer.shadowMap.autoUpdate = shadows
      renderer.shadowMap.needsUpdate = needs

      uniforms.uProjInv.value.copy(camera.projectionMatrixInverse)
      uniforms.uViewInv.value.copy(camera.matrixWorld)
      uniforms.uNear.value = camera.near
      uniforms.uFar.value = camera.far
      uniforms.uPxPerM.value = uniforms.uRes.value.y / 2 / Math.tan((camera.fov * Math.PI) / 360)
      camera.getWorldPosition(uniforms.uCam.value)
      renderer.setRenderTarget(null)
      renderer.render(postScene, postCamera)
    },
    dispose() {
      color.dispose()
      normal.dispose()
      depthTexture.dispose()
      normalMaterial.dispose()
      material.dispose()
      quad.geometry.dispose()
    },
  }
}
