// Lightweight pure-white morning mist atmosphere shader (shared design system)
(function initMist() {
  const canvas = document.getElementById("mist-canvas");
  if (!canvas) return;
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
  if (!gl) return;

  const VS = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() {
      vUv = aPos * 0.5 + 0.5;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  const FS = `
    precision mediump float;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uScroll;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
      for (int i = 0; i < 4; i++) { v += a * noise(p); p = r * p * 2.02; a *= 0.5; }
      return v;
    }
    float ridge(float x, float baseY, float amp, float freq, float phase, float soft, float y) {
      float h = baseY + sin(x * freq + phase) * amp
        + sin(x * freq * 2.3 - phase * 0.7) * (amp * 0.42)
        + (noise(vec2(x * freq * 1.4, phase)) - 0.5) * (amp * 0.55);
      return smoothstep(h + soft, h - soft, y);
    }
    void main() {
      vec2 uv = vUv;
      float aspect = uResolution.x / max(uResolution.y, 1.0);
      vec2 p = vec2(uv.x * aspect, uv.y);
      vec2 drift = (uMouse - 0.5) * 0.04;
      float s = uScroll * 0.00014;

      float rFar  = ridge(p.x + drift.x * 0.35, 0.56 - s * 0.4, 0.095, 1.45, 0.9, 0.14, uv.y);
      float rMid  = ridge(p.x + drift.x * 0.7,  0.40 - s * 0.7, 0.085, 1.85, 2.7, 0.12, uv.y);
      float rNear = ridge(p.x + drift.x * 1.1,  0.24 - s * 1.0, 0.075, 1.30, 4.4, 0.11, uv.y);

      float t = uTime * 0.04;
      float m = mix(
        fbm(vec2(p.x * 1.35 + t, p.y * 1.9 - t * 0.35) + drift * 1.3),
        fbm(vec2(p.x * 2.1 - t * 0.7, p.y * 2.4 + t * 0.2)),
        0.45
      );
      float wash = smoothstep(0.95, 0.12, uv.y);

      vec3 col = vec3(0.984, 0.984, 0.977);
      col = mix(col, vec3(0.922, 0.930, 0.924), rFar * 0.46);
      col = mix(col, vec3(0.878, 0.890, 0.884), rMid * 0.50);
      col = mix(col, vec3(0.835, 0.848, 0.842), rNear * 0.40);
      col = mix(col, vec3(0.992, 0.993, 0.990), smoothstep(0.32, 0.82, m) * 0.75 * wash);
      col += (hash(gl_FragCoord.xy + fract(uTime) * 10.0) - 0.5) * 0.01;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  }

  const vs = compile(gl.VERTEX_SHADER, VS);
  const fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  let mouse = [0.5, 0.5];
  let targetMouse = [0.5, 0.5];
  const start = performance.now();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    canvas.width = Math.max(1, Math.floor(window.innerWidth * 0.6));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * 0.6));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (e) => {
    targetMouse = [e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight];
  });

  const uRes = gl.getUniformLocation(prog, "uResolution");
  const uTime = gl.getUniformLocation(prog, "uTime");
  const uMouse = gl.getUniformLocation(prog, "uMouse");
  const uScroll = gl.getUniformLocation(prog, "uScroll");

  function tick() {
    requestAnimationFrame(tick);
    mouse[0] += (targetMouse[0] - mouse[0]) * 0.04;
    mouse[1] += (targetMouse[1] - mouse[1]) * 0.04;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, reduced ? 0 : (performance.now() - start) * 0.001);
    gl.uniform2f(uMouse, mouse[0], mouse[1]);
    gl.uniform1f(uScroll, window.scrollY);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  tick();
})();
