/* Marci Metzger Homes footer-smoke.js. Footer glow (<mm-smoke>). */
(function () {
  if (customElements.get('mm-smoke')) return;
  class MMSmoke extends HTMLElement {
    connectedCallback() {
      Object.assign(this.style, { display: 'block', position: 'absolute', top: 'auto', right: '0', bottom: '0', left: '0', height: '360px', overflow: 'hidden', pointerEvents: 'none', WebkitMaskImage: 'linear-gradient(0deg,#000 0%,#000 55%,transparent 100%)', maskImage: 'linear-gradient(0deg,#000 0%,#000 55%,transparent 100%)' });
      this.setAttribute('aria-hidden', 'true');
      this.whenWorthStarting();
    }
    disconnectedCallback() {
      this.dead = true;
      this.gate && this.gate.disconnect();
      cancelAnimationFrame(this.raf);
      this.io && this.io.disconnect();
      this.ro && this.ro.disconnect();
      if (this.renderer) { this.renderer.dispose(); this.renderer.domElement.remove(); }
    }
    whenWorthStarting() {
      const conn = navigator.connection || {};
      const lite = window.matchMedia('(max-width: 767.98px), (prefers-reduced-motion: reduce)').matches || conn.saveData || /2g/.test(conn.effectiveType || '');
      if (lite) { this.classList.add('is-static'); return; }
      const start = () => { if (this.started || this.dead) return; this.started = true; (window.requestIdleCallback || setTimeout)(() => this.init(), { timeout: 1500 }); };
      const watch = () => {
        if (!('IntersectionObserver' in window)) { start(); return; }
        this.gate = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { this.gate.disconnect(); start(); } }, { rootMargin: '200px' });
        this.gate.observe(this);
      };
      if (document.readyState === 'complete') watch(); else window.addEventListener('load', watch, { once: true });
    }
    async init() {
      let THREE;
      try { THREE = await import('./vendor/three.module.min.js'); } catch (e) { return; }
      if (this.dead) return;
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.setClearColor(0x000000, 0);
      Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
      this.appendChild(renderer.domElement);
      this.renderer = renderer;
      const scene = new THREE.Scene(), camera = new THREE.Camera();
      const C = hex => { const v = parseInt(hex.slice(1), 16); return new THREE.Vector3((v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255); };
      const uniforms = {
        uTime: { value: 0 }, uAspect: { value: 1 },
        uLight: { value: C('#F0D3CC') }, uTint: { value: C('#B4838D') }, uDeep: { value: C('#7A5866') }, uStrength: { value: 1.0 }, uH: { value: 360 }, uBg: { value: C('#161616') }
      };
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        uniforms, transparent: true, depthWrite: false, depthTest: false,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: `
          precision mediump float;
          uniform float uTime, uAspect, uStrength, uH; uniform vec3 uLight, uTint, uDeep, uBg; varying vec2 vUv;
          float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
          float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 r = mat2(0.8, 0.6, -0.6, 0.8); for (int i = 0; i < 5; i++){ v += a * n(p); p = r * p * 2.02; a *= 0.5; } return v; }
          void main(){
            vec2 uv = vec2(vUv.x * uAspect, vUv.y);
            float t = uTime * 0.07;
            vec2 q = vec2(fbm(uv * 1.4 + vec2(t, 0.0)), fbm(uv * 1.4 + vec2(-t * 0.7, t * 0.4) + 5.2));
            float s = fbm(uv * 2.0 + q * 1.6 + vec2(t * 1.3, -t * 0.3));
            float edge = 0.42 + 0.10 * sin(vUv.x * 5.0 + uTime * 0.28) + 0.06 * sin(vUv.x * 11.0 - uTime * 0.4) + (s - 0.5) * 0.18;
            float body = 1.0 - smoothstep(edge - 0.22, edge, uv.y);
            float smoke = 0.55 + 0.45 * smoothstep(0.3, 0.8, s);
            float gx = 0.5 + 0.5 * sin(vUv.x * 3.1 + uTime * 0.12);
            vec3 col = mix(uDeep, uTint, gx);
            float alpha = clamp(body * smoke * 0.75, 0.0, 0.9) * uStrength;
            gl_FragColor = vec4(col * alpha, alpha);
          }`
      }));
      quad.frustumCulled = false;
      scene.add(quad);
      const size = () => {
        const w = Math.max(1, this.clientWidth), h = Math.max(1, this.clientHeight);
        renderer.setSize(w, h, false);
        uniforms.uAspect.value = w / h; uniforms.uH.value = h;
        if (reduce || !this.running) renderer.render(scene, camera);
      };
      this.ro = new ResizeObserver(size);
      this.ro.observe(this);
      size();
      if (reduce) { uniforms.uTime.value = 8; renderer.render(scene, camera); return; }
      const t0 = performance.now();
      const tick = () => {
        if (this.dead || !this.running) return;
        uniforms.uTime.value = (performance.now() - t0) / 1000;
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
  customElements.define('mm-smoke', MMSmoke);
})();
