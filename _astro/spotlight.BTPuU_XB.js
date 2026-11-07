function e(e,t){let n=e.querySelector(`[data-spotlight-canvas]`),r=n?.getContext(`webgl2`,{premultipliedAlpha:!0,antialias:!1,alpha:!0});if(!n||!r)return;let i=(e,t)=>{let n=r.createShader(e);if(r.shaderSource(n,t),r.compileShader(n),!r.getShaderParameter(n,r.COMPILE_STATUS))throw Error(r.getShaderInfoLog(n)??`shader`);return n},a=r.createProgram();try{if(r.attachShader(a,i(r.VERTEX_SHADER,`#version 300 es
in vec2 p;
out vec2 vUv;
void main() { vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`)),r.attachShader(a,i(r.FRAGMENT_SHADER,`#version 300 es
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
    vec3 c = fi < 0.5 ? vec3(1.0, 0.24, 0.5) : (fi < 1.5 ? vec3(0.55, 0.36, 0.96) : vec3(1.0, 0.55, 0.2));
    col += c * b * (0.3 + 0.7 * haze) * 0.55;
  }
  float cx = aspect * (0.5 + uAim.x * 0.18);
  col += vec3(1.0, 0.36, 0.45) * exp(-pow((uv.y - 0.0) * 5.0, 2.0)) * exp(-pow((uv.x - cx) / aspect * 2.4, 2.0)) * 0.22;
  vec2 g = uv * 70.0;
  vec2 id = floor(g);
  float h = hash(id);
  float sparkle = step(0.986, h) * smoothstep(0.45, 0.0, length(fract(g) - 0.5)) * (0.5 + 0.5 * sin(t * 2.0 + h * 50.0));
  col += sparkle * vec3(1.0, 0.9, 0.95) * clamp((col.r + col.b) * 3.0, 0.0, 1.0);
  col *= uOn;
  o = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));
}`)),r.linkProgram(a),!r.getProgramParameter(a,r.LINK_STATUS))throw Error(r.getProgramInfoLog(a)??`link`)}catch(e){console.warn(`[spotlight] disabled:`,e);return}r.useProgram(a);let o=r.createBuffer();r.bindBuffer(r.ARRAY_BUFFER,o),r.bufferData(r.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),r.STATIC_DRAW);let s=r.getAttribLocation(a,`p`);r.enableVertexAttribArray(s),r.vertexAttribPointer(s,2,r.FLOAT,!1,0,0);let c=r.getUniformLocation(a,`uRes`),l=r.getUniformLocation(a,`uTime`),u=r.getUniformLocation(a,`uAim`),d=r.getUniformLocation(a,`uOn`),f=.5,p=()=>{let i=Math.max(1,Math.round(e.clientWidth*f)),a=Math.max(1,Math.round(e.clientHeight*f));n.width=i,n.height=a,r.viewport(0,0,i,a),r.uniform2f(c,i,a),t&&y(8)},m=0,h=0,g=0,_=performance.now(),v=_,y=e=>{r.uniform1f(l,e),r.uniform2f(u,m,0),r.uniform1f(d,t?1:g),r.drawArrays(r.TRIANGLES,0,3)};if(!t){let t=t=>{let n=e.getBoundingClientRect();t.clientY<n.top||t.clientY>n.bottom||(h=Math.max(-1,Math.min(1,(t.clientX-n.left)/n.width*2-1)))};e.addEventListener(`pointermove`,t,{passive:!0}),e.addEventListener(`pointerdown`,t,{passive:!0}),e.addEventListener(`pointerleave`,()=>h=0)}let b=0,x=!1,S=e=>{let t=Math.min(.05,(e-v)/1e3);v=e,m+=(h-m)*(1-Math.exp(-t*2.5)),g=Math.min(1,g+t/1.2),y((e-_)/1e3),b=requestAnimationFrame(S)},C=()=>{cancelAnimationFrame(b),x&&!document.hidden&&!t&&(v=performance.now(),b=requestAnimationFrame(S))};p(),new ResizeObserver(p).observe(e),new IntersectionObserver(([e])=>{x=e.isIntersecting,C()}).observe(e),document.addEventListener(`visibilitychange`,C),t&&y(8),n.classList.remove(`opacity-0`)}export{e as mountSpotlight};