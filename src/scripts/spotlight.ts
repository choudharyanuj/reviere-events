// Volumetric stage spotlights for the dark sections. A single full-screen fragment shader on raw WebGL2
// (no three.js), rendered at half resolution because the beams are soft. Beams drift on their own
// and lean toward the pointer, or toward a tap on touch screens.

const VS = `#version 300 es
in vec2 p;
out vec2 vUv;
void main() { vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uAim;
uniform float uOn;

float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
float beam(vec2 uv, vec2 src, float ang, float width) {
  vec2 d = uv - src;
  float len = length(d);
  float a = atan(d.x, -d.y);
  float cone = smoothstep(width, width * 0.1, abs(a - ang));
  return cone * smoothstep(1.9, 0.1, len) * smoothstep(0.0, 0.25, len);
}
void main() {
  float aspect = uRes.x / uRes.y;
  vec2 uv = vec2(vUv.x * aspect, vUv.y);
  float t = uTime;
  float haze = fbm(uv * 2.6 + vec2(t * 0.04, -t * 0.07));
  vec3 col = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 src = vec2(aspect * (0.16 + 0.34 * fi), 1.15);
    float sweep = sin(t * 0.33 + fi * 2.2) * 0.22;
    float ang = (1.0 - fi) * 0.32 + sweep + uAim.x * (0.42 - abs(fi - 1.0) * 0.12);
    float b = beam(uv, src, ang, 0.15 + 0.03 * sin(t * 0.5 + fi));
    vec3 c = mix(vec3(0.88, 0.78, 0.58), vec3(0.9, 0.62, 0.26), fi * 0.45);
    col += c * b * (0.3 + 0.7 * haze) * 0.5;
  }
  float cx = aspect * (0.5 + uAim.x * 0.18);
  col += vec3(0.86, 0.7, 0.45) * exp(-pow((uv.y - 0.0) * 5.0, 2.0)) * exp(-pow((uv.x - cx) / aspect * 2.4, 2.0)) * 0.22;
  vec2 g = uv * 70.0;
  vec2 id = floor(g);
  float h = hash(id);
  float sparkle = step(0.986, h) * smoothstep(0.45, 0.0, length(fract(g) - 0.5)) * (0.5 + 0.5 * sin(t * 2.0 + h * 50.0));
  col += sparkle * vec3(1.0, 0.92, 0.75) * clamp(col.r * 4.0, 0.0, 1.0);
  col *= uOn;
  o = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));
}`;

export function mountSpotlight(section: HTMLElement, reduced: boolean) {
  const canvas = section.querySelector<HTMLCanvasElement>('[data-spotlight-canvas]');
  const gl = canvas?.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!canvas || !gl) return;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const prog = gl.createProgram()!;
  try {
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
  } catch (err) {
    console.warn('[spotlight] disabled:', err);
    return;
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uAim = gl.getUniformLocation(prog, 'uAim');
  const uOn = gl.getUniformLocation(prog, 'uOn');

  const SCALE = 0.5;
  const resize = () => {
    const w = Math.max(1, Math.round(section.clientWidth * SCALE));
    const h = Math.max(1, Math.round(section.clientHeight * SCALE));
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
    if (reduced) draw(8);
  };

  let aim = 0, aimTarget = 0, on = 0;
  const start = performance.now();
  let last = start;
  const draw = (t: number) => {
    gl.uniform1f(uTime, t);
    gl.uniform2f(uAim, aim, 0);
    gl.uniform1f(uOn, reduced ? 1 : on);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  if (!reduced) {
    const point = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      aimTarget = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    };
    section.addEventListener('pointermove', point, { passive: true });
    section.addEventListener('pointerdown', point, { passive: true });
    section.addEventListener('pointerleave', () => (aimTarget = 0));
  }

  let raf = 0;
  let visible = false;
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    aim += (aimTarget - aim) * (1 - Math.exp(-dt * 2.5));
    on = Math.min(1, on + dt / 1.2);
    draw((now - start) / 1000);
    raf = requestAnimationFrame(loop);
  };
  const run = () => {
    cancelAnimationFrame(raf);
    if (visible && !document.hidden && !reduced) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };

  resize();
  new ResizeObserver(resize).observe(section);
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    run();
  }).observe(section);
  document.addEventListener('visibilitychange', run);
  if (reduced) draw(8);
  canvas.classList.remove('opacity-0');
}
