import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  PMREMGenerator,
  SRGBColorSpace,
  ACESFilmicToneMapping,
  Group,
  TorusGeometry,
  MeshPhysicalMaterial,
  Mesh,
  DirectionalLight,
  PlaneGeometry,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  ShaderMaterial,
  DoubleSide,
  Vector2,
  Vector3,
  Vector4,
  MathUtils,
  SphereGeometry,
  MeshBasicMaterial,
  BackSide,
  Color,
} from 'three';

type Options = { variant: 'home' | 'page'; reduced: boolean };

// Petal palette in sRGB (the shader writes these straight to the screen)
const PETALS: [string, number][] = [
  ['#ff3d81', 0.3], // pink
  ['#ff7a2f', 0.25], // orange
  ['#ffc247', 0.18], // amber
  ['#8b5cf6', 0.15], // violet
  ['#fff1f6', 0.12], // white-hot glints
];
const hexToRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

const VERT = /* glsl */ `
attribute vec4 aSeed;
attribute vec3 aColor;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerOn;
uniform vec4 uBursts[4];
uniform vec3 uBox;
uniform float uScroll;
varying vec3 vNormal;
varying vec3 vColor;
varying vec3 vView;

mat3 rotAxis(vec3 a, float ang) {
  a = normalize(a);
  float s = sin(ang), c = cos(ang), oc = 1.0 - c;
  return mat3(
    oc*a.x*a.x + c,     oc*a.x*a.y + a.z*s, oc*a.z*a.x - a.y*s,
    oc*a.x*a.y - a.z*s, oc*a.y*a.y + c,     oc*a.y*a.z + a.x*s,
    oc*a.z*a.x + a.y*s, oc*a.y*a.z - a.x*s, oc*a.z*a.z + c);
}

void main() {
  float t = uTime;
  float speed = 0.16 + aSeed.w * 0.22;
  vec3 b;
  b.x = (aSeed.x * 2.0 - 1.0) * uBox.x;
  b.z = (aSeed.z * 2.0 - 1.0) * uBox.z;
  float fall = aSeed.y * 2.0 * uBox.y + t * speed + uScroll * 3.0;
  b.y = uBox.y - mod(fall, 2.0 * uBox.y);
  b.x += sin(t * (0.35 + aSeed.w * 0.5) + aSeed.y * 6.2831) * 0.4;
  b.z += cos(t * 0.3 + aSeed.x * 6.2831) * 0.25;

  // Petals part around the cursor / finger
  vec2 d = b.xy - uPointer;
  float dl = length(d);
  b.xy += (d / max(dl, 1e-3)) * smoothstep(1.7, 0.0, dl) * 0.85 * uPointerOn;

  // Tap bursts: a shockwave that pushes petals out, then lets them drift back
  for (int i = 0; i < 4; i++) {
    vec4 k = uBursts[i];
    float e = t - k.z;
    if (e > 0.0 && e < 5.0) {
      vec2 bd = b.xy - k.xy;
      float bl = length(bd);
      float wave = (1.0 - exp(-e * 7.0)) * exp(-e * 1.05) * k.w * smoothstep(5.0, 0.0, bl);
      b.xy += (bd / max(bl, 1e-3)) * wave * 2.0;
      b.z += wave * (aSeed.x - 0.5) * 2.5;
    }
  }

  float spin = t * (0.45 + aSeed.w * 0.9) + aSeed.x * 6.2831;
  mat3 R = rotAxis(vec3(aSeed.x - 0.5, aSeed.y - 0.5, aSeed.z - 0.3), spin);
  vec3 p = R * position * (0.7 + aSeed.w * 0.65) + b;
  vNormal = normalize(normalMatrix * (R * normal));
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
uniform vec3 uFog;
uniform float uFade;
varying vec3 vNormal;
varying vec3 vColor;
varying vec3 vView;
void main() {
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  vec3 L = normalize(vec3(0.35, 0.85, 0.55));
  float diff = 0.45 + 0.55 * max(dot(n, L), 0.0);
  float trans = 0.3 * max(dot(-n, L), 0.0);
  vec3 col = vColor * (diff + trans);
  vec3 V = normalize(-vView);
  col += pow(1.0 - abs(dot(n, V)), 2.2) * 0.35 * vec3(1.0, 0.45, 0.7);
  float fog = smoothstep(5.5, 14.0, -vView.z);
  col = mix(col, uFog, fog * 0.92);
  gl_FragColor = vec4(col, uFade);
}`;

export function mountHero(section: HTMLElement, canvas: HTMLCanvasElement, { variant, reduced }: Options) {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return; // No WebGL: the CSS glow behind the hero stays as the backdrop.
  }
  if (!renderer.capabilities.isWebGL2) {
    renderer.dispose();
    return;
  }

  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowPower = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  // Retina laptops would otherwise shade ~4M pixels a frame; 1.5x is visually indistinguishable here.
  let pixelRatio = Math.min(devicePixelRatio, lowPower ? 1 : 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.05, 100);
  const CAM_Z = 9;
  camera.position.set(0, 0, CAM_Z);

  // A tiny studio of coloured softboxes, baked into an environment map: the chrome reflects the brand palette.
  const studio = new Scene();
  studio.add(new Mesh(new SphereGeometry(20, 32, 16), new MeshBasicMaterial({ color: 0x050507, side: BackSide })));
  const softbox = (hex: number, power: number, pos: [number, number, number], size: [number, number]) => {
    const m = new Mesh(new PlaneGeometry(size[0], size[1]), new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(power), side: DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    studio.add(m);
  };
  softbox(0xff3d81, 6, [-6, 3, 4], [5, 8]);
  softbox(0xff7a2f, 5, [6, -1, 5], [4, 7]);
  softbox(0x8b5cf6, 6, [0, 7, -4], [10, 3]);
  softbox(0xffffff, 9, [2, 4, 8], [3, 2]);
  softbox(0xffc247, 4, [-3, -6, 2], [6, 2]);
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio, 0.02).texture;
  pmrem.dispose();
  const key = new DirectionalLight(0xffffff, 1.0);
  key.position.set(3, 5, 6);
  scene.add(key);

  /* Two interlocked rings: a wedding-ring motif that doubles as a stage halo */
  const R = 1.25;
  const D = R * 1.75; // offset so ring B threads through ring A near its rim, leaving A's centre clear to fly through
  const ringGeo = new TorusGeometry(R, 0.085, 48, 240);
  // Iridescent chrome: thin-film shimmer over a mirror finish
  const chrome = new MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.08, iridescence: 0.9, iridescenceIOR: 1.5, iridescenceThicknessMinimum: 180, iridescenceThicknessMaximum: 620, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4 });
  const warmChrome = new MeshPhysicalMaterial({ color: 0xffd9c2, metalness: 1, roughness: 0.18, iridescence: 0.6, iridescenceIOR: 1.4, iridescenceThicknessMinimum: 240, iridescenceThicknessMaximum: 700, clearcoat: 0.8, envMapIntensity: 1.25 });
  const ringA = new Mesh(ringGeo, chrome);
  const ringB = new Mesh(ringGeo, warmChrome);
  ringB.rotation.x = Math.PI / 2;
  ringB.position.x = D;
  const inner = new Group();
  inner.add(ringA, ringB);
  inner.position.x = -D / 2;
  const rings = new Group(); // spun by drag / auto-rotation
  rings.add(inner);
  const anchor = new Group(); // placed per layout, pulses on tap
  anchor.add(rings);
  scene.add(anchor);

  /* Petals: one instanced draw call, animated entirely on the GPU */
  const base = new PlaneGeometry(0.15, 0.25, 3, 6);
  const pos = base.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const v = (y + 0.125) / 0.25; // 0 at the base, 1 at the tip
    const w = 0.3 + 0.7 * Math.sin(Math.PI * Math.min(1, v * 0.95 + 0.05));
    const nx = x * w;
    pos.setXYZ(i, nx, y, nx * nx * 9 + Math.sin(Math.PI * v) * 0.03);
  }
  base.computeVertexNormals();
  const small = innerWidth < 640;
  const count = lowPower ? 80 : variant === 'home' ? (small ? 110 : 230) : small ? 70 : 140;
  const geo = new InstancedBufferGeometry();
  geo.index = base.index;
  geo.setAttribute('position', base.attributes.position);
  geo.setAttribute('normal', base.attributes.normal);
  geo.instanceCount = count;
  const seeds = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < 4; k++) seeds[i * 4 + k] = Math.random();
    let r = Math.random();
    const hex = PETALS.find(([, w]) => (r -= w) <= 0)?.[0] ?? PETALS[0][0];
    colors.set(hexToRgb(hex), i * 3);
  }
  geo.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 4));
  geo.setAttribute('aColor', new InstancedBufferAttribute(colors, 3));
  const uniforms = {
    uTime: { value: 0 },
    uPointer: { value: new Vector2(99, 99) },
    uPointerOn: { value: 0 },
    uBursts: { value: [0, 1, 2, 3].map(() => new Vector4(0, 0, -99, 0)) },
    uBox: { value: new Vector3(4, 3, 2.5) },
    uScroll: { value: 0 },
    uFog: { value: new Vector3(...hexToRgb('#07070a')) },
    uFade: { value: 1 },
  };
  const petalMat = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, side: DoubleSide, transparent: true, toneMapped: false });
  const petals = new Mesh(geo, petalMat);
  petals.frustumCulled = false;
  scene.add(petals);

  /* Layout */
  let halfW = 4, halfH = 3, portrait = false;
  const home = new Vector3();
  const resize = () => {
    const w = section.clientWidth;
    const h = section.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    halfH = Math.tan(MathUtils.degToRad(camera.fov / 2)) * CAM_Z;
    halfW = halfH * camera.aspect;
    portrait = camera.aspect < 0.9;
    uniforms.uBox.value.set(halfW * 1.15, halfH * 1.25, 2.6);
    if (variant === 'home') {
      if (portrait) home.set(0.34 * halfW, halfH * 0.7, 0), anchor.scale.setScalar(Math.min(0.46, halfW / 4));
      else home.set(halfW * 0.42, halfH * 0.16, 0), anchor.scale.setScalar(Math.min(1.08, halfW / 4.2));
    } else {
      if (portrait) home.set(halfW * 0.3, halfH * 0.6, 0), anchor.scale.setScalar(Math.min(0.42, halfW / 4.2));
      else home.set(halfW * 0.56, halfH * 0.12, 0), anchor.scale.setScalar(Math.min(0.85, halfW / 5));
    }
    anchor.position.copy(home);
    if (reduced) renderOnce();
  };

  /* Interaction state */
  const pointer = new Vector2(); // -1..1 inside the section
  const parallax = new Vector2();
  let pointerOn = 0;
  const spin = new Vector2(0.62, 0.78); // starting pose shows both rings as open ellipses
  const spinVel = new Vector2();
  let pulse = 0;
  let burstIdx = 0;
  let scrollP = 0;
  const clockStart = performance.now();
  const now = () => (performance.now() - clockStart) / 1000;

  const isUi = (t: EventTarget | null) => !!(t as Element | null)?.closest?.('a, button, input, textarea, select, label');
  const toWorld = (e: PointerEvent) => {
    const r = section.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    return new Vector2(pointer.x * halfW + camera.position.x, pointer.y * halfH + camera.position.y);
  };

  let dragging = false, downX = 0, downY = 0, lastX = 0, lastY = 0, downT = 0, travel = 0;
  const onMove = (e: PointerEvent) => {
    const r = section.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) {
      pointerOn = 0;
      return;
    }
    uniforms.uPointer.value.copy(toWorld(e));
    pointerOn = 1;
    if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      travel += Math.abs(dx) + Math.abs(dy);
      spinVel.y += dx * 0.0016;
      if (e.pointerType === 'mouse') spinVel.x += dy * 0.0016;
      lastX = e.clientX;
      lastY = e.clientY;
    }
  };
  const onDown = (e: PointerEvent) => {
    if (isUi(e.target) || e.button > 0) return;
    if (e.pointerType === 'mouse') e.preventDefault(); // dragging to spin must not select the hero text
    dragging = true;
    travel = 0;
    downX = lastX = e.clientX;
    downY = lastY = e.clientY;
    downT = performance.now();
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    const tap = travel < 8 && Math.hypot(e.clientX - downX, e.clientY - downY) < 8 && performance.now() - downT < 450;
    if (tap && !isUi(e.target)) {
      const w = toWorld(e);
      uniforms.uBursts.value[burstIdx++ % 4].set(w.x, w.y, uniforms.uTime.value, 1);
      pulse = 1;
      spinVel.y += (Math.random() > 0.5 ? 1 : -1) * 0.06;
    }
  };
  const onOrient = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return;
    pointer.set(MathUtils.clamp(e.gamma / 30, -1, 1), MathUtils.clamp((45 - e.beta) / 30, -1, 1));
  };

  if (!reduced) {
    section.style.touchAction = 'pan-y';
    addEventListener('pointermove', onMove, { passive: true });
    section.addEventListener('pointerdown', onDown);
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', () => (dragging = false));
    section.addEventListener('pointerleave', () => (pointerOn = 0));
    if (!matchMedia('(pointer: fine)').matches) addEventListener('deviceorientation', onOrient, { passive: true });
  }

  /* Frame */
  const target = new Vector3();
  const TAU = Math.PI * 2;
  const wrap = (a: number) => ((((a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
  // Opacity is driven here (fade-in, then fade-out on scroll), not by a CSS transition.
  canvas.style.transition = 'none';
  canvas.classList.remove('opacity-0');
  canvas.style.opacity = '0';
  let reveal = 0;
  let lastOpacity = -1;
  let last = now();
  // If frames run long (slow GPU), step the resolution down instead of stuttering.
  let slowFrames = 0, sampled = 0;
  const adapt = (rawDt: number) => {
    if (pixelRatio <= 1) return;
    sampled++;
    if (rawDt > 0.028) slowFrames++;
    if (sampled < 60) return;
    if (slowFrames > 30) {
      pixelRatio = Math.max(1, pixelRatio - 0.25);
      renderer.setPixelRatio(pixelRatio);
      resize();
    }
    slowFrames = sampled = 0;
  };
  const frame = () => {
    const t = now();
    const rawDt = t - last;
    const dt = Math.min(0.05, rawDt);
    last = t;
    if (rawDt < 0.5) adapt(rawDt);
    uniforms.uTime.value = t;

    const r = section.getBoundingClientRect();
    scrollP = MathUtils.clamp(-r.top / Math.max(1, r.height), 0, 1);
    uniforms.uScroll.value = scrollP;
    uniforms.uPointerOn.value = MathUtils.damp(uniforms.uPointerOn.value, pointerOn, 6, dt);

    // Drag inertia over a slow idle drift
    spin.x += spinVel.x;
    spin.y += spinVel.y + dt * 0.22;
    spinVel.multiplyScalar(Math.pow(0.04, dt));
    parallax.x = MathUtils.damp(parallax.x, pointer.x, 3, dt);
    parallax.y = MathUtils.damp(parallax.y, pointer.y, 3, dt);

    // On the home page, scrolling squares ring A up to the camera and flies through it
    const fly = variant === 'home' ? MathUtils.smootherstep(scrollP, 0, 0.85) : 0;
    const face = 1 - MathUtils.smoothstep(scrollP, 0, 0.45);
    rings.rotation.x = (Math.sin(spin.x) * 0.55 + 0.25 + parallax.y * 0.25) * face;
    rings.rotation.y = (wrap(spin.y) + parallax.x * 0.4) * face;
    rings.rotation.z = Math.sin(t * 0.3) * 0.08 * face;

    pulse = MathUtils.damp(pulse, 0, 5, dt);
    anchor.position.set(home.x + Math.sin(t * 0.6) * 0.04, home.y + Math.sin(t * 0.8) * 0.06, 0);
    const s = anchor.scale.x;
    rings.scale.setScalar(1 + pulse * 0.07);

    // Ring A's centre in world space is where the camera heads as you scroll
    target.set(home.x - (D / 2) * s, home.y, 0);
    camera.position.x = MathUtils.lerp(parallax.x * 0.25, target.x, fly);
    camera.position.y = MathUtils.lerp(parallax.y * 0.18, target.y, fly);
    camera.position.z = MathUtils.lerp(CAM_Z, -1.2, fly);
    uniforms.uFade.value = 1 - MathUtils.smoothstep(scrollP, 0.55, 0.9);
    reveal = Math.min(1, reveal + dt / 1.4);
    const opacity = (1 - Math.pow(1 - reveal, 3)) * (variant === 'home' ? 1 - MathUtils.smoothstep(scrollP, 0.7, 0.98) : 1);
    if (Math.abs(opacity - lastOpacity) > 0.004) {
      canvas.style.opacity = opacity.toFixed(3);
      lastOpacity = opacity;
    }

    renderer.render(scene, camera);
  };
  // Reduced motion: compute the starting pose once, render a single still frame, show it.
  const renderOnce = () => {
    frame();
    uniforms.uTime.value = 12;
    renderer.render(scene, camera);
    canvas.style.opacity = '1';
  };

  resize();
  new ResizeObserver(resize).observe(section);

  if (reduced) {
    renderOnce();
  } else {
    let visible = true;
    const run = () => renderer.setAnimationLoop(visible && !document.hidden ? frame : null);
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      run();
    }).observe(section);
    document.addEventListener('visibilitychange', run);
    frame();
    run();
  }
}
