/* Marci Metzger Homes: light-beam.js. Three.js light beam on the Listings, Let's Move and About Us dark bands. */
(function () {
  if (customElements.get('mm-light-beam')) return;
  const BEAM = `
    uniform vec2 uOrigin; uniform float uAngle; uniform float uSpread; uniform float uAspect;
    float beam(vec2 p) {
      vec2 d = p - uOrigin; d.x *= uAspect;
      float dist = length(d);
      float a = atan(d.y, d.x);
      float diff = abs(mod(a - uAngle + 3.14159265, 6.2831853) - 3.14159265);
      float core = 1.0 - smoothstep(0.0, uSpread, diff);
      return core * core * exp(-dist * 0.6);
    }`;
  class MMLightBeam extends HTMLElement {
    connectedCallback() {
      Object.assign(this.style, { display: 'block', position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' });
      this.setAttribute('aria-hidden', 'true');
      this.init();
    }
    disconnectedCallback() {
      this.dead = true;
      cancelAnimationFrame(this.raf);
      this.io && this.io.disconnect();
      this.ro && this.ro.disconnect();
      if (this.renderer) { this.renderer.dispose(); this.renderer.domElement.remove(); }
    }
    async init() {
      let THREE;
      try { THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'); } catch (e) { return; }
      if (this.dead) return;
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(dpr);
      renderer.setClearColor(0x000000, 0);
      Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
      this.appendChild(renderer.domElement);
      this.renderer = renderer;
      THREE.ColorManagement.enabled = false;
      const scene = new THREE.Scene();
      const camera = new THREE.Camera();
      const uniforms = {
        uTime: { value: 0 }, uOrigin: { value: new THREE.Vector2(0.06, 1.18) }, uAngle: { value: -0.95 },
        uSpread: { value: 0.3 }, uAspect: { value: 1 }, uDpr: { value: dpr },
        uBeam: { value: new THREE.Color('#E9D6CF') }, uMote: { value: new THREE.Color('#FFF4EE') }
      };
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        uniforms, transparent: true, depthWrite: false, depthTest: false,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: BEAM + `
          uniform vec3 uBeam; varying vec2 vUv;
          void main(){ float b = beam(vUv) * 0.34; gl_FragColor = vec4(uBeam * b, b); }`
      }));
      quad.frustumCulled = false;
      scene.add(quad);
      const small = this.clientWidth < 640;
      const N = small ? 140 : 280;
      const pos = new Float32Array(N * 3), seed = new Float32Array(N);
      for (let i = 0; i < N; i++) { pos[i * 3] = Math.random(); pos[i * 3 + 1] = Math.random(); seed[i] = Math.random(); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
      const motes = new THREE.Points(g, new THREE.ShaderMaterial({
        uniforms, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
        vertexShader: BEAM + `
          uniform float uTime; uniform float uDpr; attribute float aSeed; varying float vA;
          void main(){
            vec2 p = position.xy;
            p.x += uTime * (0.004 + 0.006 * aSeed) + sin(uTime * 0.21 + aSeed * 40.0) * 0.012;
            p.y += uTime * (0.002 + 0.004 * aSeed) + cos(uTime * 0.17 + aSeed * 30.0) * 0.012;
            p = fract(p);
            float b = beam(p);
            vA = 0.05 + b * 1.6;
            gl_PointSize = (1.2 + 2.6 * aSeed) * uDpr * (0.8 + b * 1.4);
            gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 uMote; varying float vA;
          void main(){ float r = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, r) * min(vA, 1.0); gl_FragColor = vec4(uMote * a, a); }`
      }));
      motes.frustumCulled = false;
      scene.add(motes);
      const size = () => {
        const w = Math.max(1, this.clientWidth), h = Math.max(1, this.clientHeight);
        renderer.setSize(w, h, false);
        uniforms.uAspect.value = w / h;
        if (reduce || !this.running) renderer.render(scene, camera);
      };
      this.ro = new ResizeObserver(size);
      this.ro.observe(this);
      size();
      if (reduce) { renderer.render(scene, camera); return; }
      const t0 = performance.now();
      const tick = () => {
        if (this.dead || !this.running) return;
        const t = (performance.now() - t0) / 1000;
        uniforms.uTime.value = t;
        uniforms.uAngle.value = -0.95 + Math.sin(t * 0.18) * 0.24;
        renderer.render(scene, camera);
        this.raf = requestAnimationFrame(tick);
      };
      this.io = new IntersectionObserver(([e]) => {
        const was = this.running;
        this.running = e.isIntersecting;
        if (this.running && !was) this.raf = requestAnimationFrame(tick);
      });
      this.io.observe(this);
    }
  }
  customElements.define('mm-light-beam', MMLightBeam);
})();
