import { useEffect, useRef } from 'react';

export interface Palette {
  top: [number, number, number];
  mid: [number, number, number];
  bottom: [number, number, number];
}

interface Props {
  /** Target palette — the shader lerps smoothly toward it. */
  palette: Palette;
  /** Scroll container whose velocity drives the "splash" reaction. */
  scrollRef: React.RefObject<HTMLElement>;
}

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uVel;
uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uBottom;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p *= 2.02;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = gl_FragCoord.xy / uRes.xy;
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 sp = vec2(p.x * aspect, p.y);

  float t = uTime * (0.065 + uVel * 0.08);

  vec2 q = vec2(
    fbm(sp * 1.5 + vec2(t * 0.6, -t * 0.4)),
    fbm(sp * 1.6 + vec2(-t * 0.5, t * 0.7))
  );
  vec2 r = vec2(
    fbm(sp * 2.1 + q * 1.3 + vec2(t * 0.3, t * 0.2)),
    fbm(sp * 2.0 + q * 1.2 - vec2(t * 0.25, t * 0.35))
  );
  float w = fbm(sp * 1.4 + r * (0.8 + uVel * 0.15) + vec2(0.0, t * 0.15));

  // vertical gradient, folded by the fluid field
  float g = clamp(p.y + (w - 0.5) * 0.3, 0.0, 1.0);
  vec3 col = g < 0.5
    ? mix(uBottom, uMid, smoothstep(0.0, 0.5, g))
    : mix(uMid, uTop, smoothstep(0.5, 1.0, g));

  // specular crests
  float crest = pow(smoothstep(0.55, 0.95, w), 3.0);
  col += crest * (0.12 + uVel * 0.08) * vec3(1.0, 0.94, 0.85);

  // subtle vignette for text legibility
  vec2 d = p - 0.5;
  col *= 1.0 - dot(d, d) * 0.55;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return sh;
}

export function FluidBackground({ palette, scrollRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteRef = useRef(palette);
  paletteRef.current = palette;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uVel = gl.getUniformLocation(prog, 'uVel');
    const uTop = gl.getUniformLocation(prog, 'uTop');
    const uMid = gl.getUniformLocation(prog, 'uMid');
    const uBottom = gl.getUniformLocation(prog, 'uBottom');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    // scroll velocity → splash
    let vel = 0;
    let lastY = scrollRef.current?.scrollTop ?? 0;
    let lastT = performance.now();
    const onScroll = () => {
      const el = scrollRef.current;
      if (!el) return;
      const now = performance.now();
      const dt = Math.max(16, now - lastT);
      const v = (Math.abs(el.scrollTop - lastY) / dt) * 4;
      vel = Math.min(0.6, Math.max(vel, v));
      lastY = el.scrollTop;
      lastT = now;
    };
    const scroller = scrollRef.current;
    scroller?.addEventListener('scroll', onScroll, { passive: true });

    const cur: [number, number, number][] = [
      [...paletteRef.current.top],
      [...paletteRef.current.mid],
      [...paletteRef.current.bottom],
    ];

    let raf = 0;
    const start = performance.now();
    const loop = () => {
      resize();
      const target = paletteRef.current;
      const targets = [target.top, target.mid, target.bottom];
      for (let i = 0; i < 3; i++) {
        for (let c = 0; c < 3; c++) {
          cur[i][c] += (targets[i][c] - cur[i][c]) * 0.04;
        }
      }
      vel *= 0.88;
      gl.uniform1f(uVel, vel);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform3fv(uTop, cur[0]);
      gl.uniform3fv(uMid, cur[1]);
      gl.uniform3fv(uBottom, cur[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      scroller?.removeEventListener('scroll', onScroll);
    };
  }, [scrollRef]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
}
