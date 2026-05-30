"use client";

import { Effect, EffectComposer, EffectPass, RenderPass } from "postprocessing";
import { useEffect, useRef, type CSSProperties } from "react";
import * as THREE from "three";
import "./PixelBlast.css";

type PixelBlastVariant = "square" | "circle" | "triangle" | "diamond";

interface TouchPoint {
  x: number;
  y: number;
  age: number;
  force: number;
  vx: number;
  vy: number;
}

interface TouchTexture {
  texture: THREE.Texture;
  addTouch: (norm: { x: number; y: number }) => void;
  update: () => void;
  radiusScale: number;
}

interface PixelBlastProps {
  variant?: PixelBlastVariant;
  pixelSize?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
  antialias?: boolean;
  patternScale?: number;
  patternDensity?: number;
  liquid?: boolean;
  liquidStrength?: number;
  liquidRadius?: number;
  pixelSizeJitter?: number;
  enableRipples?: boolean;
  rippleIntensityScale?: number;
  rippleThickness?: number;
  rippleSpeed?: number;
  liquidWobbleSpeed?: number;
  autoPauseOffscreen?: boolean;
  speed?: number;
  transparent?: boolean;
  edgeFade?: number;
  noiseAmount?: number;
}

interface PixelBlastState {
  renderer: THREE.WebGLRenderer;
  material: THREE.ShaderMaterial;
  uniforms: PixelBlastUniforms;
  resizeObserver: ResizeObserver;
  raf: number;
  quad: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  clickIx: number;
  composer?: EffectComposer;
  touch?: TouchTexture;
  liquidEffect?: Effect;
}

interface PixelBlastUniforms {
  [key: string]: THREE.IUniform;
  uResolution: { value: THREE.Vector2 };
  uTime: { value: number };
  uColor: { value: THREE.Color };
  uClickPos: { value: THREE.Vector2[] };
  uClickTimes: { value: Float32Array };
  uShapeType: { value: number };
  uPixelSize: { value: number };
  uScale: { value: number };
  uDensity: { value: number };
  uPixelJitter: { value: number };
  uEnableRipples: { value: number };
  uRippleSpeed: { value: number };
  uRippleThickness: { value: number };
  uRippleIntensity: { value: number };
  uEdgeFade: { value: number };
}

const SHAPE_MAP: Record<PixelBlastVariant, number> = {
  square: 0,
  circle: 1,
  triangle: 2,
  diamond: 3,
};

const MAX_CLICKS = 10;

const VERTEX_SRC = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SRC = `
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uPixelJitter;
uniform int   uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uEdgeFade;
uniform int   uShapeType;

const int SHAPE_CIRCLE = 1;
const int SHAPE_TRIANGLE = 2;
const int SHAPE_DIAMOND = 3;
const int MAX_CLICKS = 10;

uniform vec2  uClickPos[MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

float Bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2. + a.y * a.y * .75);
}

#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

float hash11(float n) {
  return fract(sin(n) * 43758.5453);
}

float vnoise(vec3 p) {
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n100 = hash11(dot(ip + vec3(1.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n010 = hash11(dot(ip + vec3(0.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n110 = hash11(dot(ip + vec3(1.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n001 = hash11(dot(ip + vec3(0.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n101 = hash11(dot(ip + vec3(1.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n011 = hash11(dot(ip + vec3(0.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  float n111 = hash11(dot(ip + vec3(1.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  vec3 w = fp * fp * fp * (fp * (fp * 6.0 - 15.0) + 10.0);
  float x00 = mix(n000, n100, w.x);
  float x10 = mix(n010, n110, w.x);
  float x01 = mix(n001, n101, w.x);
  float x11 = mix(n011, n111, w.x);
  float y0 = mix(x00, x10, w.y);
  float y1 = mix(x01, x11, w.y);
  return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t) {
  vec3 p = vec3(uv * uScale, t);
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  for (int i = 0; i < 5; ++i) {
    sum += amp * vnoise(p * freq);
    freq *= 1.25;
    amp *= 1.0;
  }
  return sum * 0.5 + 0.5;
}

float maskCircle(vec2 p, float cov) {
  float r = sqrt(cov) * .25;
  float d = length(p - 0.5) - r;
  float aa = 0.5 * fwidth(d);
  return cov * (1.0 - smoothstep(-aa, aa, d * 2.0));
}

float maskTriangle(vec2 p, vec2 id, float cov) {
  bool flip = mod(id.x + id.y, 2.0) > 0.5;
  if (flip) p.x = 1.0 - p.x;
  float r = sqrt(cov);
  float d = p.y - r * (1.0 - p.x);
  float aa = fwidth(d);
  return cov * clamp(0.5 - d / aa, 0.0, 1.0);
}

float maskDiamond(vec2 p, float cov) {
  float r = sqrt(cov) * 0.564;
  return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

void main() {
  float pixelSize = uPixelSize;
  vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;
  float aspectRatio = uResolution.x / uResolution.y;
  vec2 pixelId = floor(fragCoord / pixelSize);
  vec2 pixelUV = fract(fragCoord / pixelSize);
  float cellPixelSize = 8.0 * pixelSize;
  vec2 cellId = floor(fragCoord / cellPixelSize);
  vec2 cellCoord = cellId * cellPixelSize;
  vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);
  float base = fbm2(uv, uTime * 0.05);
  base = base * 0.5 - 0.65;
  float feed = base + (uDensity - 0.5) * 0.3;

  if (uEnableRipples == 1) {
    for (int i = 0; i < MAX_CLICKS; ++i) {
      vec2 pos = uClickPos[i];
      if (pos.x < 0.0) continue;
      vec2 cuv = (((pos - uResolution * .5 - cellPixelSize * .5) / uResolution)) * vec2(aspectRatio, 1.0);
      float t = max(uTime - uClickTimes[i], 0.0);
      float r = distance(uv, cuv);
      float ring = exp(-pow((r - uRippleSpeed * t) / uRippleThickness, 2.0));
      float atten = exp(-1.0 * t) * exp(-10.0 * r);
      feed = max(feed, ring * atten * uRippleIntensity);
    }
  }

  float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);
  float h = fract(sin(dot(floor(fragCoord / uPixelSize), vec2(127.1, 311.7))) * 43758.5453);
  float coverage = bw * (1.0 + (h - 0.5) * uPixelJitter);
  float mask;

  if (uShapeType == SHAPE_CIRCLE) mask = maskCircle(pixelUV, coverage);
  else if (uShapeType == SHAPE_TRIANGLE) mask = maskTriangle(pixelUV, pixelId, coverage);
  else if (uShapeType == SHAPE_DIAMOND) mask = maskDiamond(pixelUV, coverage);
  else mask = coverage;

  if (uEdgeFade > 0.0) {
    vec2 norm = gl_FragCoord.xy / uResolution;
    float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
    mask *= smoothstep(0.0, uEdgeFade, edge);
  }

  vec3 srgbColor = mix(
    uColor * 12.92,
    1.055 * pow(uColor, vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, uColor)
  );

  fragColor = vec4(srgbColor, mask);
}
`;

function createTouchTexture(): TouchTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("2D context not available");
  }

  const texture = new THREE.Texture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const trail: TouchPoint[] = [];
  let last: { x: number; y: number } | null = null;
  const maxAge = 64;
  let radius = 0.1 * size;
  const speed = 1 / maxAge;

  const clear = () => {
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const drawPoint = (point: TouchPoint) => {
    const position = { x: point.x * size, y: (1 - point.y) * size };
    let intensity = 1;
    const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2);
    const easeOutQuad = (t: number) => -t * (t - 2);

    if (point.age < maxAge * 0.3) intensity = easeOutSine(point.age / (maxAge * 0.3));
    else intensity = easeOutQuad(1 - (point.age - maxAge * 0.3) / (maxAge * 0.7)) || 0;

    intensity *= point.force;
    const color = `${((point.vx + 1) / 2) * 255}, ${((point.vy + 1) / 2) * 255}, ${intensity * 255}`;
    const offset = size * 5;
    context.shadowOffsetX = offset;
    context.shadowOffsetY = offset;
    context.shadowBlur = radius;
    context.shadowColor = `rgba(${color},${0.22 * intensity})`;
    context.beginPath();
    context.fillStyle = "rgba(255,0,0,1)";
    context.arc(position.x - offset, position.y - offset, radius, 0, Math.PI * 2);
    context.fill();
  };

  return {
    texture,
    addTouch(norm) {
      let force = 0;
      let vx = 0;
      let vy = 0;

      if (last) {
        const dx = norm.x - last.x;
        const dy = norm.y - last.y;
        if (dx === 0 && dy === 0) return;
        const distanceSquared = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSquared);
        vx = dx / (distance || 1);
        vy = dy / (distance || 1);
        force = Math.min(distanceSquared * 10000, 1);
      }

      last = { x: norm.x, y: norm.y };
      trail.push({ x: norm.x, y: norm.y, age: 0, force, vx, vy });
    },
    update() {
      clear();

      for (let index = trail.length - 1; index >= 0; index--) {
        const point = trail[index];
        const force = point.force * speed * (1 - point.age / maxAge);
        point.x += point.vx * force;
        point.y += point.vy * force;
        point.age++;
        if (point.age > maxAge) trail.splice(index, 1);
      }

      trail.forEach(drawPoint);
      texture.needsUpdate = true;
    },
    set radiusScale(value: number) {
      radius = 0.1 * size * value;
    },
    get radiusScale() {
      return radius / (0.1 * size);
    },
  };
}

function createLiquidEffect(texture: THREE.Texture, opts: { strength: number; freq: number }) {
  const fragment = `
    uniform sampler2D uTexture;
    uniform float uStrength;
    uniform float uTime;
    uniform float uFreq;

    void mainUv(inout vec2 uv) {
      vec4 tex = texture2D(uTexture, uv);
      float vx = tex.r * 2.0 - 1.0;
      float vy = tex.g * 2.0 - 1.0;
      float intensity = tex.b;
      float wave = 0.5 + 0.5 * sin(uTime * uFreq + intensity * 6.2831853);
      uv += vec2(vx, vy) * uStrength * intensity * wave;
    }
  `;

  return new Effect("LiquidEffect", fragment, {
    uniforms: new Map<string, THREE.Uniform<unknown>>([
      ["uTexture", new THREE.Uniform(texture)],
      ["uStrength", new THREE.Uniform(opts.strength)],
      ["uTime", new THREE.Uniform(0)],
      ["uFreq", new THREE.Uniform(opts.freq)],
    ]),
  });
}

export default function PixelBlast({
  variant = "square",
  pixelSize = 3,
  color = "#B497CF",
  className,
  style,
  antialias = true,
  patternScale = 2,
  patternDensity = 1,
  liquid = false,
  liquidStrength = 0.1,
  liquidRadius = 1,
  pixelSizeJitter = 0,
  enableRipples = true,
  rippleIntensityScale = 1,
  rippleThickness = 0.1,
  rippleSpeed = 0.3,
  liquidWobbleSpeed = 4.5,
  autoPauseOffscreen = true,
  speed = 0.5,
  transparent = true,
  edgeFade = 0.5,
  noiseAmount = 0,
}: PixelBlastProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const visibilityRef = useRef({ visible: true });
  const speedRef = useRef(speed);
  const stateRef = useRef<PixelBlastState | null>(null);
  const previousConfigRef = useRef<{ antialias: boolean; liquid: boolean; noiseAmount: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    speedRef.current = speed;
    const config = { antialias, liquid, noiseAmount };
    const mustReinit =
      !stateRef.current ||
      !previousConfigRef.current ||
      previousConfigRef.current.antialias !== config.antialias ||
      previousConfigRef.current.liquid !== config.liquid ||
      previousConfigRef.current.noiseAmount !== config.noiseAmount;

    const dispose = () => {
      const state = stateRef.current;
      if (!state) return;
      state.resizeObserver.disconnect();
      cancelAnimationFrame(state.raf);
      state.quad.geometry.dispose();
      state.material.dispose();
      state.composer?.dispose();
      state.renderer.dispose();
      state.renderer.forceContextLoss();
      if (state.renderer.domElement.parentElement === container) {
        container.removeChild(state.renderer.domElement);
      }
      stateRef.current = null;
    };

    if (mustReinit) {
      dispose();

      const canvas = document.createElement("canvas");
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias,
        alpha: true,
        powerPreference: "high-performance",
      });

      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if (transparent) renderer.setClearAlpha(0);
      else renderer.setClearColor(0x000000, 1);
      container.appendChild(renderer.domElement);

      const uniforms: PixelBlastUniforms = {
        uResolution: { value: new THREE.Vector2(0, 0) },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uClickPos: { value: Array.from({ length: MAX_CLICKS }, () => new THREE.Vector2(-1, -1)) },
        uClickTimes: { value: new Float32Array(MAX_CLICKS) },
        uShapeType: { value: SHAPE_MAP[variant] ?? 0 },
        uPixelSize: { value: pixelSize * renderer.getPixelRatio() },
        uScale: { value: patternScale },
        uDensity: { value: patternDensity },
        uPixelJitter: { value: pixelSizeJitter },
        uEnableRipples: { value: enableRipples ? 1 : 0 },
        uRippleSpeed: { value: rippleSpeed },
        uRippleThickness: { value: rippleThickness },
        uRippleIntensity: { value: rippleIntensityScale },
        uEdgeFade: { value: edgeFade },
      };

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SRC,
        fragmentShader: FRAGMENT_SRC,
        uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        glslVersion: THREE.GLSL3,
      });
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(quad);

      const setSize = () => {
        const width = container.clientWidth || 1;
        const height = container.clientHeight || 1;
        renderer.setSize(width, height, false);
        uniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
        stateRef.current?.composer?.setSize(renderer.domElement.width, renderer.domElement.height);
        uniforms.uPixelSize.value = pixelSize * renderer.getPixelRatio();
      };

      const resizeObserver = new ResizeObserver(setSize);
      resizeObserver.observe(container);
      setSize();

      let composer: EffectComposer | undefined;
      let touch: TouchTexture | undefined;
      let liquidEffect: Effect | undefined;

      if (liquid) {
        touch = createTouchTexture();
        touch.radiusScale = liquidRadius;
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        liquidEffect = createLiquidEffect(touch.texture, {
          strength: liquidStrength,
          freq: liquidWobbleSpeed,
        });
        const effectPass = new EffectPass(camera, liquidEffect);
        effectPass.renderToScreen = true;
        composer.addPass(effectPass);
      }

      if (noiseAmount > 0) {
        if (!composer) {
          composer = new EffectComposer(renderer);
          composer.addPass(new RenderPass(scene, camera));
        }

        const noiseEffect = new Effect(
          "NoiseEffect",
          `
          uniform float uTime;
          uniform float uAmount;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
          void mainUv(inout vec2 uv){}
          void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){
            float n = hash(floor(uv * vec2(1920.0,1080.0)) + floor(uTime * 60.0));
            float g = (n - 0.5) * uAmount;
            outputColor = inputColor + vec4(vec3(g),0.0);
          }
          `,
          {
            uniforms: new Map<string, THREE.Uniform<unknown>>([
              ["uTime", new THREE.Uniform(0)],
              ["uAmount", new THREE.Uniform(noiseAmount)],
            ]),
          },
        );
        const noisePass = new EffectPass(camera, noiseEffect);
        noisePass.renderToScreen = true;
        composer.passes.forEach((pass) => {
          pass.renderToScreen = false;
        });
        composer.addPass(noisePass);
      }

      composer?.setSize(renderer.domElement.width, renderer.domElement.height);

      const randomFloat = () => {
        if (window.crypto?.getRandomValues) {
          const values = new Uint32Array(1);
          window.crypto.getRandomValues(values);
          return values[0] / 0xffffffff;
        }
        return Math.random();
      };

      const timeOffset = randomFloat() * 1000;
      const clock = new THREE.Clock();

      const mapToPixels = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        const scaleX = renderer.domElement.width / rect.width;
        const scaleY = renderer.domElement.height / rect.height;

        return {
          fx: (event.clientX - rect.left) * scaleX,
          fy: (rect.height - (event.clientY - rect.top)) * scaleY,
          width: renderer.domElement.width,
          height: renderer.domElement.height,
        };
      };

      const onPointerDown = (event: PointerEvent) => {
        const { fx, fy } = mapToPixels(event);
        const state = stateRef.current;
        if (!state) return;
        const index = state.clickIx;
        uniforms.uClickPos.value[index].set(fx, fy);
        uniforms.uClickTimes.value[index] = uniforms.uTime.value;
        state.clickIx = (index + 1) % MAX_CLICKS;
      };

      const onPointerMove = (event: PointerEvent) => {
        if (!touch) return;
        const { fx, fy, width, height } = mapToPixels(event);
        touch.addTouch({ x: fx / width, y: fy / height });
      };

      renderer.domElement.addEventListener("pointerdown", onPointerDown, { passive: true });
      renderer.domElement.addEventListener("pointermove", onPointerMove, { passive: true });

      let raf = 0;
      const animate = () => {
        if (autoPauseOffscreen && !visibilityRef.current.visible) {
          raf = requestAnimationFrame(animate);
          return;
        }

        uniforms.uTime.value = timeOffset + clock.getElapsedTime() * speedRef.current;
        const liquidTime = liquidEffect?.uniforms.get("uTime");
        if (liquidTime) liquidTime.value = uniforms.uTime.value;

        if (composer) {
          touch?.update();
          composer.passes.forEach((pass) => {
            const effects = (pass as { effects?: Effect[] }).effects;
            effects?.forEach((effect) => {
              const timeUniform = effect.uniforms?.get("uTime");
              if (timeUniform) timeUniform.value = uniforms.uTime.value;
            });
          });
          composer.render();
        } else {
          renderer.render(scene, camera);
        }

        raf = requestAnimationFrame(animate);
        const state = stateRef.current;
        if (state) state.raf = raf;
      };

      raf = requestAnimationFrame(animate);
      stateRef.current = {
        renderer,
        material,
        uniforms,
        resizeObserver,
        raf,
        quad,
        clickIx: 0,
        composer,
        touch,
        liquidEffect,
      };

      return () => {
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer.domElement.removeEventListener("pointermove", onPointerMove);
        dispose();
      };
    }

    const state = stateRef.current;
    if (state) {
      state.uniforms.uShapeType.value = SHAPE_MAP[variant] ?? 0;
      state.uniforms.uPixelSize.value = pixelSize * state.renderer.getPixelRatio();
      state.uniforms.uColor.value.set(color);
      state.uniforms.uScale.value = patternScale;
      state.uniforms.uDensity.value = patternDensity;
      state.uniforms.uPixelJitter.value = pixelSizeJitter;
      state.uniforms.uEnableRipples.value = enableRipples ? 1 : 0;
      state.uniforms.uRippleIntensity.value = rippleIntensityScale;
      state.uniforms.uRippleThickness.value = rippleThickness;
      state.uniforms.uRippleSpeed.value = rippleSpeed;
      state.uniforms.uEdgeFade.value = edgeFade;
      if (transparent) state.renderer.setClearAlpha(0);
      else state.renderer.setClearColor(0x000000, 1);
      const strengthUniform = state.liquidEffect?.uniforms.get("uStrength");
      if (strengthUniform) strengthUniform.value = liquidStrength;
      const frequencyUniform = state.liquidEffect?.uniforms.get("uFreq");
      if (frequencyUniform) frequencyUniform.value = liquidWobbleSpeed;
      if (state.touch) state.touch.radiusScale = liquidRadius;
    }

    previousConfigRef.current = config;
  }, [
    antialias,
    autoPauseOffscreen,
    color,
    edgeFade,
    enableRipples,
    liquid,
    liquidRadius,
    liquidStrength,
    liquidWobbleSpeed,
    noiseAmount,
    patternDensity,
    patternScale,
    pixelSize,
    pixelSizeJitter,
    rippleIntensityScale,
    rippleSpeed,
    rippleThickness,
    speed,
    transparent,
    variant,
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      visibilityRef.current.visible = entry.isIntersecting;
    });

    const container = containerRef.current;
    if (container) observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`pixel-blast-container ${className ?? ""}`}
      style={style}
      aria-label="PixelBlast interactive background"
    />
  );
}
