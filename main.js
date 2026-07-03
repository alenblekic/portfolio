/* ============================================================
   ALEN BLEKIC PORTFOLIO — main.js
   Three.js hero + GSAP scroll animations + interactions
   ============================================================ */

'use strict';

/* ── GSAP Plugin Registration ─────────────────────────────── */
gsap.registerPlugin(ScrollTrigger);

/* ── Reduced motion ───────────────────────────────────────────
   Users who ask for reduced motion get a static page: every
   continuous rAF loop, infinite GSAP timeline, and auto-cycling
   interval collapses to a single resting frame. The CSS @media
   guard already neutralises CSS animations/transitions; this is
   the JS half (canvases, GSAP, setInterval) that the CSS can't
   reach. Each animation init checks this flag. ── */
const PREFERS_REDUCED_MOTION =
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Utility: wait for DOM ────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCtaPulse('featured-card', 'featured-canvas');
  initThreeHero();
  initHeroAnimation();
  initScrollAnimations();
  initProjectsScroll();
  initProjectsMobile();
  initCaseStudyModal();
  initSectionHeaderLines();
  initAboutSlideshow();
  initMobileNav();
  initPipelineAnimation();
  initAuditMockup();
  initGlobe();
  initAlenSignature();
  initSectionFlash();
  initRainGrid();
  initSaturn();
  initContactImmersive();
  initSwedenRipple();
  initCertTilt();
  initNebulaView();
});

/* ─────────────────────────────────────────────────────────────
   PERF: run an animation loop only while its target is on-screen.
   Invisible on desktop (only pauses when scrolled away); big
   CPU/battery savings on mobile where many canvases stack up.
───────────────────────────────────────────────────────── */
function animateWhenVisible(target, frame) {
  // Reduced motion: paint one resting frame, never start the loop.
  if (PREFERS_REDUCED_MOTION) { frame(); return; }
  let raf = null;
  const loop = () => { frame(); raf = requestAnimationFrame(loop); };
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { if (raf === null) raf = requestAnimationFrame(loop); }
    else if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
  }, { threshold: 0 });
  io.observe(target);
}

/* ─────────────────────────────────────────────────────────────
   CERTIFICATE CARD 3D TILT (follows cursor)
───────────────────────────────────────────────────────── */
function initCertTilt() {
  const MAX = 9; // max tilt in degrees
  document.querySelectorAll('.cert-card-v2, .stat-card, .project-mockup').forEach(card => {
    const spotlight = card.classList.contains('stat-card') || card.classList.contains('cert-card-v2') || card.classList.contains('project-mockup');
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width  - 0.5; // -0.5 left → 0.5 right
      const py = (e.clientY - r.top)  / r.height - 0.5; // -0.5 top  → 0.5 bottom
      card.classList.add('tilting'); // drop transform transition while tracking
      card.style.transform =
        `rotateX(${(-py * MAX).toFixed(2)}deg) rotateY(${(px * MAX).toFixed(2)}deg) translateZ(6px)`;
      if (spotlight) {
        card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
        card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
      }
    });
    card.addEventListener('mouseleave', () => {
      card.classList.remove('tilting'); // re-enable smooth settle
      card.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0)';
    });
  });

  /* Spotlight only (no tilt) — education + experience cards */
  document.querySelectorAll('.edu-card, .timeline-content').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);

    // Active link tracking
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) {
        current = sec.id;
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }, { passive: true });
}

/* ─────────────────────────────────────────────────────────────
   LIVE CLOCK
───────────────────────────────────────────────────────── */
function initClock() {
  const digital = document.getElementById('clock-digital');
  const dateEl  = document.getElementById('clock-date');
  const ticks   = document.querySelector('.clock-ticks');
  const hHour   = document.querySelector('.hand-hour');
  const hMin    = document.querySelector('.hand-min');
  const hSec    = document.querySelector('.hand-sec');

  /* Build tick marks once */
  if (ticks && !ticks.childElementCount) {
    const NS = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < 60; i++) {
      const major = i % 5 === 0;
      const ang = (i / 60) * Math.PI * 2;
      const r1 = major ? 78 : 82;
      const r2 = 88;
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', 100 + r1 * Math.sin(ang));
      line.setAttribute('y1', 100 - r1 * Math.cos(ang));
      line.setAttribute('x2', 100 + r2 * Math.sin(ang));
      line.setAttribute('y2', 100 - r2 * Math.cos(ang));
      if (major) line.classList.add('major');
      ticks.appendChild(line);
    }
  }

  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  /* Local-time location label — derived from the browser timezone (no permission) */
  const zoneEl = document.getElementById('clock-zone');
  if (zoneEl) {
    let place = 'Stockholm, Europe';
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g. "Europe/Stockholm"
      if (tz && tz.includes('/')) {
        const parts = tz.split('/');
        const city  = parts[parts.length - 1].replace(/_/g, ' ');
        place = `${city}, ${parts[0]}`;
      }
    } catch (_) {}
    zoneEl.textContent = `Local Time — ${place}`;
  }

  function tick() {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();

    if (digital) {
      digital.textContent =
        `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
    if (dateEl) {
      dateEl.textContent =
        `${DAYS[now.getDay()]} ${String(now.getDate()).padStart(2,'0')} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    }

    /* Analog hands (smooth) */
    const secDeg  = s * 6;
    const minDeg  = m * 6 + s * 0.1;
    const hourDeg = (h % 12) * 30 + m * 0.5;
    if (hSec)  hSec.setAttribute('transform',  `rotate(${secDeg} 100 100)`);
    if (hMin)  hMin.setAttribute('transform',  `rotate(${minDeg} 100 100)`);
    if (hHour) hHour.setAttribute('transform', `rotate(${hourDeg} 100 100)`);
  }
  tick();
  setInterval(tick, 1000);
}

/* ─────────────────────────────────────────────────────────────
   READY-TO-BUILD CTA — reactive particle/grid animation
───────────────────────────────────────────────────────── */
function initCtaPulse(cardId = 'cta-card', canvasId = 'cta-canvas') {
  const card   = document.getElementById(cardId);
  const canvas = document.getElementById(canvasId);
  if (!card || !canvas) return;
  const ctx = canvas.getContext('2d');

  let w = 0, h = 0;
  let mouse = { x: -999, y: -999, active: false };
  let hover = 0; // 0→1 eased hover intensity

  function resize() {
    const rect = card.getBoundingClientRect();
    w = canvas.width  = rect.width;
    h = canvas.height = rect.height;
  }

  /* Floating nodes that link up when near each other / the cursor */
  const NODES = 16;
  const nodes = Array.from({ length: NODES }, () => ({
    x: Math.random(),         // stored 0–1, scaled at draw
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0006,
    vy: (Math.random() - 0.5) * 0.0006,
  }));

  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });
  card.addEventListener('mouseenter', () => { mouse.active = true; });
  card.addEventListener('mouseleave', () => { mouse.active = false; mouse.x = mouse.y = -999; });

  function draw() {
    if (!w) { resize(); return; }
    ctx.clearRect(0, 0, w, h);

    hover += ((mouse.active ? 1 : 0) - hover) * 0.06;
    const speed = 1 + hover * 2.2;

    const pts = nodes.map(n => {
      n.x += n.vx * speed; n.y += n.vy * speed;
      if (n.x < 0 || n.x > 1) n.vx *= -1;
      if (n.y < 0 || n.y > 1) n.vy *= -1;
      n.x = Math.max(0, Math.min(1, n.x));
      n.y = Math.max(0, Math.min(1, n.y));
      return { x: n.x * w, y: n.y * h };
    });

    /* Links between nearby nodes */
    const LINK = 70 + hover * 40;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < LINK) {
          const a = (1 - d / LINK) * (0.12 + hover * 0.22);
          ctx.strokeStyle = `rgba(217,119,87,${a})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }

    /* Links + glow toward cursor */
    pts.forEach(p => {
      if (mouse.active) {
        const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (d < 110) {
          const a = (1 - d / 110) * 0.5;
          ctx.strokeStyle = `rgba(240,160,130,${a})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6 + hover * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(217,119,87,${0.4 + hover * 0.4})`;
      ctx.fill();
    });
  }

  new ResizeObserver(resize).observe(card);
  resize();
  animateWhenVisible(card, draw);
}

/* ─────────────────────────────────────────────────────────────
   HERO BACKGROUND — WebGL2 coral nebula shader
───────────────────────────────────────────────────────── */
function initThreeHero() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl2');
  if (!gl) return; // no WebGL2 → dark hero (body bg + scrim show through)

  const isMobile = window.innerWidth < 768;

  const vertSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){ gl_Position = position; }`;

  /* Fractal-noise nebula by Matthias Hurrle (@atzedent), recoloured into the
     portfolio's coral palette: warm coral cloud base, coral→warm-highlight
     light points, coral dust, and a faint warm floor so it blends with
     #0a0a0a. Structure (rnd/noise/fbm/clouds) is unchanged. */
  const fragSrc = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
float rnd(vec2 p){ p=fract(p*vec2(12.9898,78.233)); p+=dot(p,p+34.56); return fract(p.x*p.y); }
float noise(in vec2 p){ vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  float a=rnd(i),b=rnd(i+vec2(1,0)),c=rnd(i+vec2(0,1)),d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }
float fbm(vec2 p){ float t=.0,a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for(int i=0;i<5;i++){ t+=a*noise(p); p*=2.*m; a*=.5; } return t; }
float clouds(vec2 p){ float d=1.,t=.0;
  for(float i=.0;i<3.;i++){ float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p); t=mix(t,d,a); d=a; p*=2./(i+1.); } return t; }
void main(void){
  vec2 uv=(FC-.5*R)/MN, st=uv*vec2(2,1);
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.5,-st.y));
  uv*=1.-.3*(sin(T*.2)*.5+.5);
  for(float i=1.;i<12.;i++){
    uv+=.1*cos(i*vec2(.1+.01*i,.8)+i*i+T*.5+.1*uv.x);
    vec2 p=uv;
    float d=length(p);
    vec3 glow=mix(vec3(.95,.52,.38),vec3(1.,.83,.62),.5+.5*sin(i*1.7));
    col+=.00125/d*glow;
    float b=noise(i+p+bg*1.731);
    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)))*vec3(.92,.52,.38);
    col=mix(col,bg*vec3(.24,.132,.096),d);
  }
  col+=vec3(.016,.014,.012);
  O=vec4(col,1);
}`;

  function compile(type, src){
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uRes  = gl.getUniformLocation(prog, 'resolution');
  const uTime = gl.getUniformLocation(prog, 'time');

  /* Render below native resolution — the fbm noise is GPU-heavy and the nebula
     is soft, so a lower buffer looks identical at hero scale for far less cost.
     Phones get the deepest cut. */
  const resScale = isMobile ? 0.5 : 0.75;
  function resize(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * resScale;
    canvas.width  = Math.max(1, Math.floor(window.innerWidth  * dpr));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  const SPEED = 0.5; // calm drift (lower = slower)
  let t = 0;
  function animate(){
    t += 0.016 * SPEED;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  animate(); // immediate first frame (no black flash before the loop starts)
  animateWhenVisible(canvas, animate);
}

/* ─────────────────────────────────────────────────────────────
   HERO TEXT ANIMATION (typewriter + fade-ins)
───────────────────────────────────────────────────────── */
function initHeroAnimation() {
  const typeTarget  = document.getElementById('typewriter');
  const cursorBlink = document.getElementById('cursor-blink');
  const subtitle    = document.getElementById('hero-subtitle');
  const location    = document.getElementById('hero-location');
  const cta         = document.getElementById('hero-cta');

  if (!typeTarget) return;

  const NAME = 'Alen';

  // Reduced motion: show the finished hero instantly, no typing or stagger.
  if (PREFERS_REDUCED_MOTION) {
    typeTarget.textContent = NAME;
    if (cursorBlink) { cursorBlink.style.animation = 'none'; cursorBlink.style.opacity = '0'; }
    gsap.set([subtitle, location, cta], { opacity: 1, y: 0 });
    return;
  }

  // Name: smooth character stagger (each letter eases up + fades in).
  typeTarget.innerHTML = NAME
    .split('')
    .map(ch => `<span class="hero-char" style="display:inline-block">${ch}</span>`)
    .join('');
  const chars = typeTarget.querySelectorAll('.hero-char');
  gsap.set(chars, { opacity: 0, y: 16 });

  // Subtitle: typed out character-by-character once the name lands. Fast
  // (~26ms/char) so it stays snappy, with a blinking cursor while it types.
  const SUBTITLE = subtitle.textContent;
  // Reserve the line's height before emptying it, so clearing the text doesn't
  // collapse the subtitle and shove the (vertically-centred) name upward when
  // typing starts.
  subtitle.style.minHeight = subtitle.offsetHeight + 'px';
  subtitle.textContent = '';

  function typeSubtitle() {
    gsap.set(subtitle, { opacity: 1, y: 0 });
    const cur = document.createElement('span');
    cur.className = 'cursor-blink';
    cur.textContent = '|';
    subtitle.appendChild(cur);

    let i = 0;
    (function step() {
      if (i < SUBTITLE.length) {
        cur.insertAdjacentText('beforebegin', SUBTITLE[i++]);
        setTimeout(step, 16);
      } else {
        cur.style.animation = 'none';
        gsap.to(cur, { opacity: 0, duration: 0.35, ease: 'power2.out', onComplete: () => cur.remove() });
        gsap.to(location, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
        gsap.to(cta,      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.15 });
      }
    })();
  }

  gsap.timeline({ delay: 0.3 })
    .to(chars, {
      opacity: 1, y: 0,
      duration: 0.5, ease: 'power3.out', stagger: 0.07,
      // The instant the last letter ("n") lands, fade the name cursor and
      // start typing the subtitle immediately — no pause in between.
      onComplete: () => {
        cursorBlink.style.animation = 'none'; // stop the infinite CSS blink so the fade shows
        gsap.to(cursorBlink, { opacity: 0, duration: 0.2, ease: 'power2.out' });
        typeSubtitle();
      },
    });
}

/* ─────────────────────────────────────────────────────────────
   GSAP SCROLL ANIMATIONS
───────────────────────────────────────────────────────── */
function initScrollAnimations() {

  // Reduced motion: reveal everything up-front instead of animating on scroll.
  // .fade-up and .skill-bubble are hidden in CSS (opacity:0), so they must be
  // shown explicitly or reduced-motion users would see blank sections.
  if (PREFERS_REDUCED_MOTION) {
    gsap.set([
      '.fade-up', '.about-visual', '.about-content', '.stat-card', '.section-title',
      '.timeline-item', '.edu-card', '.cert-card-v2', '.contact-heading',
    ].join(', '), { opacity: 1, x: 0, y: 0 });
    document.querySelectorAll('.skill-bubble').forEach(b => b.classList.add('visible'));
    return;
  }

  /* Generic fade-up on all .fade-up elements */
  gsap.utils.toArray('.fade-up').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 28 },
      {
        opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
      }
    );
  });

  /* About section */
  gsap.fromTo('.about-visual',
    { opacity: 0, x: -40 },
    { opacity: 1, x: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.about-section', start: 'top 75%' }
    }
  );
  gsap.fromTo('.about-content',
    { opacity: 0, x: 40 },
    { opacity: 1, x: 0, duration: 1, ease: 'power3.out', delay: 0.15,
      scrollTrigger: { trigger: '.about-section', start: 'top 75%' }
    }
  );
  gsap.utils.toArray('.stat-card').forEach((card, i) => {
    gsap.fromTo(card,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.4)', delay: i * 0.12,
        scrollTrigger: { trigger: card, start: 'top 90%' }
      }
    );
  });

  /* Toolkit bubbles staggered reveal */
  const allBubbles = document.querySelectorAll('.skill-bubble');
  ScrollTrigger.create({
    trigger: '.toolkit-circle',
    start: 'top 80%',
    onEnter: () => {
      allBubbles.forEach((b, i) => {
        setTimeout(() => {
          b.style.transition = `opacity 0.45s ease ${i * 40}ms, transform 0.45s cubic-bezier(0.34,1.56,0.64,1) ${i * 40}ms, color var(--transition), border-color var(--transition), box-shadow var(--transition)`;
          b.classList.add('visible');
        }, i * 40);
      });
    }
  });

  /* Section titles */
  gsap.utils.toArray('.section-title').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      }
    );
  });

  /* Timeline items stagger */
  gsap.utils.toArray('.timeline-item').forEach((item, i) => {
    gsap.fromTo(item,
      { opacity: 0, x: -24 },
      { opacity: 1, x: 0, duration: 0.75, ease: 'power3.out', delay: i * 0.1,
        scrollTrigger: { trigger: item, start: 'top 85%' }
      }
    );
  });

  /* Education card */
  const eduCard = document.querySelector('.edu-card');
  if (eduCard) {
    gsap.fromTo(eduCard,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: eduCard, start: 'top 85%' }
      }
    );
  }

  /* Cert cards */
  document.querySelectorAll('.cert-card-v2').forEach((certCard, i) => {
    gsap.fromTo(certCard,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', delay: i * 0.12,
        scrollTrigger: { trigger: certCard, start: 'top 90%' }
      }
    );
  });

  /* Contact heading */
  const contactHeading = document.querySelector('.contact-heading');
  if (contactHeading) {
    gsap.fromTo(contactHeading,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: contactHeading, start: 'top 85%' }
      }
    );
  }

  /* Contact sub + button */
  gsap.utils.toArray('.contact-sub, .contact-inner .btn-primary').forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: i * 0.15 + 0.2,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      }
    );
  });

  /* Section labels */
  gsap.utils.toArray('.section-label').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, x: -10 },
      { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      }
    );
  });
}

/* ─────────────────────────────────────────────────────────────
   PROJECTS STICKY SCROLL
───────────────────────────────────────────────────────── */
const PROJECTS = [
  {
    counter: '01 / 04',
    name: 'Auditly Pro — AI-Powered Website Audit Tool',
    desc: 'Full-stack AI web app that scrapes any landing page and returns a scored audit across Conversion, SEO, and UX, plus the 5 highest-impact fixes referencing the real page content. Hybrid engine: deterministic SEO checks + Claude judgment, streamed live progress, Redis-cached shareable reports, with SSRF guards and per-IP rate limiting.',
    tags: ['Next.js 15', 'TypeScript', 'Claude', 'Firecrawl', 'Redis', 'Vercel'],
    link: 'https://auditly-pro.vercel.app/',
    caseStudy: true,
    accent: '#F5A623', accent2: '#E8623C',
  },
  {
    counter: '02 / 04',
    name: 'Voiceflow Lead Capture &amp; Automation Agent',
    desc: 'Full conversational AI agent that captures structured lead data and triggers multi-step workflows via Make.com API integration. Built conditional logic for data validation, email capture, and automated follow-up processes.',
    tags: ['Voiceflow', 'Make.com'],
    caseStudy: true,
    accent: '#4F8DFF', accent2: '#6C5CE7',
  },
  {
    counter: '03 / 04',
    name: 'AI Customer Support Automation Agent',
    desc: 'AI customer support workflow agent handling user queries, delivering contextual responses, and triggering backend automation via Make.com. Implemented conditional refund workflow with data routing into Airtable for ticket processing.',
    tags: ['Voiceflow', 'Make.com', 'Airtable'],
    caseStudy: true,
    accent: '#2DD4BF', accent2: '#22D3EE',
  },
  {
    counter: '04 / 04',
    name: 'AI Product Recommendation Agent <span style="font-size:0.8em;opacity:0.7">(Perfume Brand)</span>',
    desc: 'Intent-based product recommendation logic with category recognition (e.g. "club", "date night") to dynamically suggest relevant products. API-based email capture and automated data routing via Make.com; structured support intake routed into Airtable.',
    tags: ['Voiceflow', 'Make.com', 'Airtable'],
    caseStudy: true,
    accent: '#E879C9', accent2: '#C084FC',
  },
];

/* Apply a project's accent as CSS custom properties on an element so its
   mockup and overlay theme off var(--accent) / var(--accent-2). */
function applyAccent(el, p) {
  if (!el || !p || !p.accent) return;
  el.style.setProperty('--accent', p.accent);
  el.style.setProperty('--accent-2', p.accent2 || p.accent);
}

/* ─────────────────────────────────────────────────────────────
   CASE STUDIES — deep-dive content for each project, rendered into
   the shared #cs-modal by renderCaseStudy(). Same index order as
   PROJECTS. Auditly (0) keeps its original copy verbatim and is the
   only one with live + code CTAs; the automation agents are demo
   builds with no external links.
───────────────────────────────────────────────────────── */
const CASE_STUDIES = [
  {
    eyebrow: 'Case Study · Featured Project',
    title: 'Auditly Pro',
    lead: 'An LLM is great at <em>judgment</em> and unreliable at <em>facts</em>. So I split the audit engine in two: deterministic code measures everything that has a right answer, and the model only weighs in where opinion is the point. Here\'s how it\'s built — and why.',
    flowHead: 'Architecture',
    flowSub: 'One request, streamed end to end inside Vercel\'s 60s function window.',
    flow: [
      { label: 'URL in' },
      { label: 'Validate + SSRF guard' },
      { label: 'Cache check', sub: 'Redis' },
      { label: 'Scrape', sub: 'Firecrawl' },
      { label: 'Analyze', sub: 'SEO checks ∥ LLM judgment', cls: 'cs-node-split' },
      { label: 'Store', sub: 'Redis · 24h TTL' },
      { label: 'Shareable report', cls: 'cs-node-end' },
    ],
    decisionsHead: 'Engineering decisions',
    decisions: [
      { h: 'Hybrid scoring', p: 'SEO is graded by deterministic code — titles, headings, alt text, canonical tags, HTTPS — because those are facts with a correct answer. The LLM is reserved for conversion and UX, where judgment is the whole point. This keeps scores reproducible and kills hallucinated metrics.' },
      { h: 'Streamed progress (NDJSON)', p: 'Audits take 20–40s, and a silent 40-second request feels broken (and risks Vercel\'s 60s timeout). The endpoint streams <code>scraping → analyzing → done</code> events as NDJSON, so the UI shows live progress instead of a frozen spinner.' },
      { h: 'Redis caching', p: 'Reports are cached in Upstash Redis with a 24h TTL and served from a stable <code>/report/[id]</code> URL. Repeat views and shares skip a full re-scrape + re-analysis — saving both latency and API cost.' },
      { h: 'Security hardening', p: 'The app fetches arbitrary user-supplied URLs — textbook SSRF territory — so requests pass an SSRF guard before any fetch. Add per-IP rate limiting to curb abuse and Zod schema validation on every input boundary, and the public endpoint stays safe to expose.' },
      { h: 'Provider abstraction', p: 'The AI engine is swappable between Groq, Gemini, and Claude via a single environment variable. No vendor lock-in — I can route around cost, rate limits, or outages without touching application code.' },
      { h: 'Print-to-PDF, not Chromium', p: 'PDF export uses a browser-native print stylesheet instead of bundling serverless Chromium. It drops a heavyweight, slow-cold-start dependency while still producing a clean, shareable document.' },
    ],
    tradeoffHead: 'Trade-offs &amp; scope',
    tradeoff: 'Shipped as a demo MVP: single-page analysis only, and the LLM portion is as good as the model behind it. Multi-page crawling and historical report tracking are the obvious next steps — deliberately cut to ship something real and focused first.',
    cta: {
      live: 'https://auditly-pro.vercel.app/',
      code: 'https://github.com/alenblekic/ai-website-audit-agent',
    },
  },
  {
    eyebrow: 'Case Study · Conversational AI + Automation',
    title: 'Lead Capture &amp; Automation Agent',
    lead: 'A landing-page visitor is only a lead if their details actually reach your team. This agent turns a chat into structured, validated lead data and hands it straight to an automation pipeline, so nothing gets retyped or lost.',
    flowHead: 'How it works',
    flowSub: 'A short conversation, validated inline, then routed downstream automatically.',
    flow: [
      { label: 'Voiceflow', sub: 'conversation' },
      { label: 'Validate', sub: 'name · email' },
      { label: 'Make.com', sub: 'scenario' },
      { label: 'Email / CRM', cls: 'cs-node-end' },
    ],
    decisionsHead: 'Build decisions',
    decisions: [
      { h: 'Conversational capture', p: 'Instead of a static form, the agent asks for one field at a time in plain language. It keeps the visitor engaged and lets the bot confirm or re-ask when an answer looks off.' },
      { h: 'Validate before routing', p: 'Name and email are checked inside Voiceflow before anything fires, so malformed input never reaches the automation and the downstream data stays clean.' },
      { h: 'Make.com as the hand-off', p: 'A single Make.com scenario receives the captured fields over a webhook and fans them out to email and follow-up steps. The bot stays focused on the conversation; the scenario owns the plumbing.' },
      { h: 'Graceful fallbacks', p: 'If a step has no clear answer, the agent re-prompts rather than dead-ending, so a half-finished chat still has a chance to convert.' },
    ],
    tradeoffHead: 'Scope',
    tradeoff: 'Built as a focused demo on a no-code stack (Voiceflow plus Make.com) to ship a working flow quickly. It covers one capture-and-route path rather than a full multi-channel CRM integration.',
  },
  {
    eyebrow: 'Case Study · Conversational AI + Automation',
    title: 'Customer Support Automation Agent',
    lead: 'Support volume is mostly repetitive: status checks, refunds, simple routing. This agent handles the common cases in chat and turns each request into a tracked ticket, so the team only sees what genuinely needs a human.',
    flowHead: 'How it works',
    flowSub: 'Understand the request, branch on intent, then route a structured ticket.',
    flow: [
      { label: 'Voiceflow', sub: 'intent' },
      { label: 'Logic', sub: 'branch' },
      { label: 'Make.com', sub: 'scenario' },
      { label: 'Airtable', sub: 'ticket', cls: 'cs-node-end' },
    ],
    decisionsHead: 'Build decisions',
    decisions: [
      { h: 'Intent handling', p: 'The agent classifies what the user wants (refund, status, general query) up front and responds in context rather than with a generic menu.' },
      { h: 'Conditional refund branch', p: 'A refund request follows its own path: confirm the order, acknowledge in chat, then trigger the refund workflow. Other intents skip that branch entirely.' },
      { h: 'Structured ticket schema', p: 'Every routed request lands in Airtable with consistent fields (type, order, status), so tickets stay filterable and nothing is buried in a chat log.' },
      { h: 'Status routing', p: 'Make.com sits between the bot and Airtable, writing the record and leaving room to add notifications or escalation later without touching the conversation design.' },
    ],
    tradeoffHead: 'Scope',
    tradeoff: 'A demo build on Voiceflow, Make.com, and Airtable. It models one support flow end to end rather than a full help desk, and the refund step is wired as a workflow trigger rather than a real payment integration.',
  },
  {
    eyebrow: 'Case Study · Conversational AI + Automation',
    title: 'Product Recommendation Agent',
    lead: 'Shoppers rarely know the product name; they know the occasion. This agent reads intent like "date night" or "club", suggests matching products, and captures interested buyers into a list for follow-up.',
    flowHead: 'How it works',
    flowSub: 'Read the intent, match a product, then capture and route the lead.',
    flow: [
      { label: 'Intent', sub: 'occasion' },
      { label: 'Match', sub: 'category' },
      { label: 'Make.com', sub: 'scenario' },
      { label: 'Airtable', sub: 'subscriber', cls: 'cs-node-end' },
    ],
    decisionsHead: 'Build decisions',
    decisions: [
      { h: 'Intent to category mapping', p: 'Free-text answers like "something romantic" map to product categories, so the recommendation feels like a conversation with a shop assistant rather than a search box.' },
      { h: 'Recommendation rules', p: 'Each category points to a small curated set of products with a short reason, which keeps suggestions confident and on-brand instead of overwhelming.' },
      { h: 'Email capture and routing', p: 'When a shopper likes a pick, the agent offers a discount in exchange for an email and routes it through Make.com into Airtable for the marketing list.' },
      { h: 'Repeat-prompt handling', p: 'The agent offers another recommendation and only moves to capture once the shopper is happy, so it never feels pushy.' },
    ],
    tradeoffHead: 'Scope',
    tradeoff: 'A demo on Voiceflow, Make.com, and Airtable using a sample perfume catalogue. It shows the recommend-and-capture loop rather than a live store integration or real inventory.',
  },
];

/* Build the inner HTML for the case-study modal from a CASE_STUDIES entry,
   reusing the existing cs-* classes so no project needs bespoke markup. */
function renderCaseStudy(cs) {
  const flowHTML = cs.flow.map((n, i) => {
    const sub  = n.sub ? `<small>${n.sub}</small>` : '';
    const cls  = n.cls ? ` ${n.cls}` : '';
    const node = `<span class="cs-node${cls}">${n.label}${sub}</span>`;
    return i < cs.flow.length - 1 ? `${node}<span class="cs-arrow">→</span>` : node;
  }).join('');

  const decisionsHTML = cs.decisions
    .map(d => `<div class="cs-decision"><h4>${d.h}</h4><p>${d.p}</p></div>`)
    .join('');

  let ctaHTML = '';
  if (cs.cta) {
    const liveSvg = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const ghSvg   = '<svg class="cs-gh-ico" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>';
    ctaHTML = `<div class="cs-cta">
        <a class="project-link" href="${cs.cta.live}" target="_blank" rel="noopener noreferrer"><span>View Live</span>${liveSvg}</a>
        <a class="project-link cs-link-ghost" href="${cs.cta.code}" target="_blank" rel="noopener noreferrer">${ghSvg}<span>View Code</span></a>
      </div>`;
  }

  return `
    <p class="cs-eyebrow">${cs.eyebrow}</p>
    <h2 class="cs-title" id="cs-title">${cs.title}</h2>
    <p class="cs-lead">${cs.lead}</p>
    <h3 class="cs-h3">${cs.flowHead}</h3>
    <p class="cs-sub">${cs.flowSub}</p>
    <div class="cs-flow">${flowHTML}</div>
    <h3 class="cs-h3">${cs.decisionsHead}</h3>
    <div class="cs-decisions">${decisionsHTML}</div>
    <h3 class="cs-h3">${cs.tradeoffHead}</h3>
    <p class="cs-tradeoff">${cs.tradeoff}</p>
    ${ctaHTML}`;
}

/* Official brand icons for the tech tags (Simple Icons + Firecrawl's own
   flame). Rendered in currentColor so they match the coral tag text.
   Voiceflow has no official SVG icon, so it renders as text only. */
const TAG_ICONS = {
  'Next.js 15': { vb: '0 0 24 24', d: 'M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z' },
  'TypeScript': { vb: '0 0 24 24', d: 'M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z' },
  'Claude': { vb: '0 0 24 24', d: 'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z' },
  'Firecrawl': { vb: '0 0 50 72', d: 'M41.715 23.193c-2.762.82-4.844 2.675-6.37 4.69-.327.432-1.01.107-.88-.423 2.92-12.007-.937-21.986-12.961-26.898a.803.803 0 0 0-1.085.937c5.47 21.961-17.537 20.109-14.63 45.005.05.427-.43.72-.78.47-1.09-.782-2.307-2.415-3.142-3.562a.502.502 0 0 0-.887.16c-.665 2.404-.98 4.67-.98 6.92 0 8.749 4.497 16.45 11.304 20.915.39.255.89-.11.758-.557a13.5 13.5 0 0 1-.563-3.697c0-.788.05-1.593.173-2.343.285-1.885.94-3.68 2.04-5.314 3.772-5.663 11.334-11.132 10.127-18.56-.078-.47.477-.78.827-.457 5.328 4.868 6.383 11.415 5.508 17.287-.075.51.564.782.887.382a11.6 11.6 0 0 1 2.892-2.587c.27-.168.63-.04.733.26.602 1.752 1.497 3.397 2.342 5.042a13.46 13.46 0 0 1 .905 9.982.502.502 0 0 0 .755.57C45.5 66.95 50 59.248 50 50.494c0-3.043-.532-6.025-1.54-8.82-2.112-5.862-7.472-10.264-6.117-17.904.065-.365-.273-.682-.628-.577' },
  'Redis': { vb: '0 0 24 24', d: 'M22.71 13.145c-1.66 2.092-3.452 4.483-7.038 4.483-3.203 0-4.397-2.825-4.48-5.12.701 1.484 2.073 2.685 4.214 2.63 4.117-.133 6.94-3.852 6.94-7.239 0-4.05-3.022-6.972-8.268-6.972-3.752 0-8.4 1.428-11.455 3.685C2.59 6.937 3.885 9.958 4.35 9.626c2.648-1.904 4.748-3.13 6.784-3.744C8.12 9.244.886 17.05 0 18.425c.1 1.261 1.66 4.648 2.424 4.648.232 0 .431-.133.664-.365a100.49 100.49 0 0 0 5.54-6.765c.222 3.104 1.748 6.898 6.014 6.898 3.819 0 7.604-2.756 9.33-8.965.2-.764-.73-1.361-1.261-.73zm-4.349-5.013c0 1.959-1.926 2.922-3.685 2.922-.941 0-1.664-.247-2.235-.568 1.051-1.592 2.092-3.225 3.21-4.973 1.972.334 2.71 1.43 2.71 2.619z' },
  'Vercel': { vb: '0 0 24 24', d: 'm12 1.608 12 20.784H0Z' },
  'Make.com': { vb: '0 0 24 24', d: 'M13.38 3.498c-.27 0-.511.19-.566.465L9.85 18.986a.578.578 0 0 0 .453.678l4.095.826a.58.58 0 0 0 .682-.455l2.963-15.021a.578.578 0 0 0-.453-.678l-4.096-.826a.589.589 0 0 0-.113-.012zm-5.876.098a.576.576 0 0 0-.516.318L.062 17.697a.575.575 0 0 0 .256.774l3.733 1.877a.578.578 0 0 0 .775-.258l6.926-13.781a.577.577 0 0 0-.256-.776L7.762 3.658a.571.571 0 0 0-.258-.062zm11.74.115a.576.576 0 0 0-.576.576v15.426c0 .318.258.578.576.578h4.178a.58.58 0 0 0 .578-.578V4.287a.578.578 0 0 0-.578-.576Z' },
  'Airtable': { vb: '0 0 24 24', d: 'M11.992 1.966c-.434 0-.87.086-1.28.257L1.779 5.917c-.503.208-.49.908.012 1.116l8.982 3.558a3.266 3.266 0 0 0 2.454 0l8.982-3.558c.503-.196.503-.908.012-1.116l-8.957-3.694a3.255 3.255 0 0 0-1.272-.257zM23.4 8.056a.589.589 0 0 0-.222.045l-10.012 3.877a.612.612 0 0 0-.38.564v8.896a.6.6 0 0 0 .821.552L23.62 18.1a.583.583 0 0 0 .38-.551V8.653a.6.6 0 0 0-.6-.596zM.676 8.095a.644.644 0 0 0-.48.19C.086 8.396 0 8.53 0 8.69v8.355c0 .442.515.737.908.54l6.27-3.006.307-.147 2.969-1.436c.466-.22.43-.908-.061-1.092L.883 8.138a.57.57 0 0 0-.207-.044z' },
  'Voiceflow': { vb: '0 0 24.5 18.4', d: 'M20.2134 12.1919C20.3748 11.2353 20.4536 10.2074 20.4536 9.18316C20.4536 8.15905 20.3748 7.13105 20.2134 6.17439C21.7629 6.40328 22.9559 7.66383 22.9559 9.18316C22.9559 10.7026 21.7629 11.9632 20.2134 12.1919ZM18.7391 12.0306C17.7374 11.7831 13.637 9.37072 13.4494 9.26572V9.10061C13.637 8.99561 17.7374 6.58339 18.7391 6.33572C18.8779 7.15361 18.968 8.10272 18.968 9.18316C18.968 10.2636 18.8779 11.2128 18.7391 12.0306ZM17.3398 15.3883C17.2348 15.4596 17.1072 15.4446 16.9909 15.3845C16.3719 15.0506 14.1172 11.5279 14.1172 11.4078L14.226 11.2916C14.9013 11.7605 16.6158 12.9273 18.3978 13.4749C18.0713 14.5142 17.6699 15.1669 17.3398 15.3883ZM16.9909 2.98183C17.1072 2.92183 17.2348 2.90683 17.3398 2.97805C17.6699 3.19939 18.0713 3.85217 18.3978 4.89139C16.6158 5.43917 14.9013 6.60583 14.226 7.07483L14.1172 6.9585C14.1172 6.8385 16.3719 3.31572 16.9909 2.98183ZM10.9959 9.26572C10.8083 9.37072 6.70789 11.7831 5.70622 12.0306C5.56733 11.2128 5.47733 10.2636 5.47733 9.18316C5.47733 8.10272 5.56733 7.15361 5.70622 6.33572C6.70789 6.58339 10.8083 8.99561 10.9959 9.10061V9.26572ZM7.45444 15.3845C7.33811 15.4446 7.21055 15.4596 7.10555 15.3883C6.77533 15.1669 6.374 14.5142 6.04755 13.4749C7.82955 12.9273 9.544 11.7605 10.2193 11.2916L10.3281 11.4078C10.3281 11.5279 8.07344 15.0506 7.45444 15.3845ZM7.10555 2.97805C7.21055 2.90683 7.33811 2.92183 7.45444 2.98183C8.07344 3.31572 10.3281 6.8385 10.3281 6.9585L10.2193 7.07483C9.544 6.60583 7.82955 5.43917 6.04755 4.89139C6.374 3.85217 6.77533 3.19939 7.10555 2.97805ZM4.23178 12.1919C2.68244 11.9632 1.48944 10.7026 1.48944 9.18316C1.48944 7.66383 2.68244 6.40328 4.23178 6.17439C4.07044 7.13105 3.99167 8.15905 3.99167 9.18316C3.99167 10.2074 4.07044 11.2353 4.23178 12.1919ZM19.8759 4.65505C19.3243 2.75672 18.3978 1.40239 17.1072 1.40239C15.3852 1.40239 13.0254 6.23817 13.0254 6.23817L12.8717 6.20439L12.913 5.6605C12.9199 5.55628 12.9268 5.34261 12.9338 5.07339C12.9674 3.77161 12.953 2.46917 12.8943 1.16839L12.8433 0.0351646C12.8423 0.0151646 12.8259 -0.000613893 12.8058 -0.000613893H11.6394C11.6194 -0.000613893 11.6029 0.0151646 11.602 0.0351646L11.551 1.16839C11.4923 2.46917 11.4779 3.77161 11.5116 5.07339C11.5184 5.34261 11.5254 5.55628 11.5323 5.6605L11.5737 6.20439L11.4198 6.23817C11.4198 6.23817 9.06011 1.40239 7.33811 1.40239C6.04756 1.40239 5.12089 2.75672 4.56944 4.65505C2.03711 4.73761 0 6.73339 0 9.18316C0 11.6329 2.03711 13.6288 4.56944 13.7114C5.12089 15.6096 6.04756 16.9639 7.33811 16.9639C9.06011 16.9639 11.4198 12.1282 11.4198 12.1282L11.5737 12.1619L11.5323 12.7059C11.5254 12.8102 11.5184 13.0237 11.5116 13.2931C11.4779 14.5947 11.4923 15.8973 11.551 17.1981L11.602 18.3312C11.6029 18.3513 11.6194 18.3671 11.6394 18.3671H12.8058C12.8259 18.3671 12.8423 18.3513 12.8433 18.3312L12.8943 17.1981C12.953 15.8973 12.9674 14.5947 12.9338 13.2931C12.9268 13.0237 12.9199 12.8102 12.913 12.7059L12.8717 12.1619L13.0254 12.1282C13.0254 12.1282 15.3852 16.9639 17.1072 16.9639C18.3978 16.9639 19.3243 15.6096 19.8759 13.7114C22.4082 13.6288 24.4452 11.6329 24.4452 9.18316C24.4452 6.73339 22.4082 4.73761 19.8759 4.65505Z' },
};

/* Real brand colours (white for marks that are monochrome black/white). */
const TAG_COLORS = {
  'Next.js 15': '#ffffff',
  'TypeScript': '#3178C6',
  'Claude':     '#D97757',
  'Firecrawl':  '#FA5D19',
  'Redis':      '#FF4438',
  'Vercel':     '#ffffff',
  'Make.com':   '#6D00CC',
  'Airtable':   '#18BFFF',
  'Voiceflow':  '#ffffff',
};

function tagHTML(name) {
  const ic = TAG_ICONS[name];
  const color = TAG_COLORS[name] || 'currentColor';
  const svg = ic
    ? `<svg class="tag-ico" viewBox="${ic.vb}" fill="currentColor" style="color:${color}" aria-hidden="true"><path d="${ic.d}"/></svg>`
    : '';
  return `<span class="tag">${svg}${name}</span>`;
}

/* Shared inline icons for project action buttons (live link + case study). */
const PROJ_LIVE_SVG = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const PROJ_CS_SVG   = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function projectActionsHTML(p, i) {
  let inner = '';
  if (p.link)      inner += `<a class="project-link" href="${p.link}" target="_blank" rel="noopener noreferrer"><span>View Live</span>${PROJ_LIVE_SVG}</a>`;
  if (p.caseStudy) inner += `<button class="project-casestudy" type="button" data-index="${i}" aria-haspopup="dialog" aria-controls="cs-modal"><span>Case Study</span>${PROJ_CS_SVG}</button>`;
  return inner ? `<div class="project-actions">${inner}</div>` : '';
}

/* ─────────────────────────────────────────────────────────────
   PROJECTS — CINEMATIC SCROLL-EXPANSION (desktop, motion)
   The stage pins; one project at a time, its mockup expands from a
   small frame toward full-bleed with a slower parallax glow behind,
   then its overlay copy reveals, then it hands off to the next.
   Mobile and reduced-motion bail here and use the stacked cards
   built by initProjectsMobile instead.
───────────────────────────────────────────────────────── */
function initProjectsScroll() {
  if (window.innerWidth < 960 || PREFERS_REDUCED_MOTION) return;

  const stage  = document.querySelector('.projects-stage');
  const blocks = gsap.utils.toArray('.projects-scroll .project-visual-block');
  if (!stage || !blocks.length) return;

  // Build each layer: a parallax .stage-glow behind, the mockup wrapped in a
  // scalable .stage-media (so the cursor-tilt transform on .project-mockup
  // never fights the GSAP scale), and an injected .stage-overlay of copy.
  const media = [], glows = [], overlays = [];
  blocks.forEach((block, i) => {
    const p = PROJECTS[i] || {};
    const mockup = block.querySelector('.project-mockup');

    applyAccent(block, p);

    const glow = document.createElement('div');
    glow.className = 'stage-glow';
    glow.innerHTML = '<i></i><i></i><i></i>'; /* mesh blobs */
    block.prepend(glow);

    const wrap = document.createElement('div');
    wrap.className = 'stage-media';
    if (mockup) { mockup.parentNode.insertBefore(wrap, mockup); wrap.appendChild(mockup); }

    const overlay = document.createElement('div');
    overlay.className = 'stage-overlay';
    overlay.innerHTML =
      `<div class="project-counter">${p.counter || ''}</div>` +
      `<h3 class="project-name">${p.name || ''}</h3>` +
      `<p class="project-desc">${p.desc || ''}</p>` +
      `<div class="project-tags">${(p.tags || []).map(tagHTML).join('')}</div>` +
      projectActionsHTML(p, i);
    block.appendChild(overlay);

    media.push(wrap); glows.push(glow); overlays.push(overlay);
  });

  stage.classList.add('cinematic');

  // Center scroll rail: a coral→accent fill + comet head that glide down the
  // gutter with scroll. Positions are GSAP-eased off the pinned timeline so the
  // rail feels smooth rather than snapping frame-to-frame.
  const rail      = document.getElementById('proj-rail');
  const railFill  = document.getElementById('proj-rail-fill');
  const railComet = document.getElementById('proj-rail-comet');
  let   railH     = rail ? rail.offsetHeight : 300;
  const fillTo  = railFill  ? gsap.quickTo(railFill,  'scaleY', { duration: 0.5, ease: 'power3' }) : null;
  const cometTo = railComet ? gsap.quickTo(railComet, 'y',      { duration: 0.5, ease: 'power3' }) : null;

  const nodes = gsap.utils.toArray('.proj-progress-node');
  function setActive(idx) {
    if (PROJECTS[idx]) applyAccent(stage, PROJECTS[idx]); // rail inherits active accent
    nodes.forEach((n, i) => {
      n.classList.toggle('active', i <= idx);
      n.classList.toggle('current', i === idx);
    });
    blocks.forEach((b, i) => b.classList.toggle('is-active', i === idx));
    playProjectTL(idx); // run only the active project's mockup loop
  }

  // Resting state: project 1 visible but small (ready to expand), rest hidden.
  blocks.forEach((b, i) => gsap.set(b, { autoAlpha: i === 0 ? 1 : 0 }));
  media.forEach(m  => gsap.set(m, { scale: 0.6, transformOrigin: '50% 50%' }));
  glows.forEach(g  => gsap.set(g, { scale: 0.7, opacity: 0.22 }));
  overlays.forEach(o => gsap.set(o, { autoAlpha: 0, y: 36 }));
  setActive(0);

  // One scrubbed timeline. Each project owns a 1-unit beat at integer position
  // i: expand + parallax glow + overlay reveal, then (all but the last) contract
  // and fade as the next takes over. Beats at integer times let us map the
  // progress dots straight off tl.time().
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.projects-stage',
      start: 'top top',
      end: () => '+=' + (blocks.length * Math.max(window.innerHeight, 620)),
      scrub: true,
      pin: '.projects-stage',
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh: () => { if (rail) railH = rail.offsetHeight; },
      onUpdate: () => {
        const p = tl.progress();
        setActive(Math.min(blocks.length - 1, Math.max(0, Math.floor(tl.time()))));
        if (fillTo)  fillTo(p);
        if (cometTo) cometTo(p * railH);
      },
    },
  });

  blocks.forEach((b, i) => {
    const m = media[i], g = glows[i], o = overlays[i];
    tl.to(b, { autoAlpha: 1, duration: 0.18 }, i)
      .fromTo(m, { scale: 0.6 }, { scale: 1, duration: 0.5, ease: 'power2.out' }, i)
      .fromTo(g, { scale: 0.7, opacity: 0.22 }, { scale: 1.08, opacity: 0.5, duration: 0.5 }, i)
      .fromTo(o, { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.32, ease: 'power3.out' }, i + 0.28);
    if (i < blocks.length - 1) {
      tl.to(o, { autoAlpha: 0, y: -24, duration: 0.18, ease: 'power2.in' }, i + 0.78)
        .to(m, { scale: 1.12, duration: 0.22, ease: 'power2.in' }, i + 0.78)
        .to(g, { opacity: 0.15, duration: 0.22 }, i + 0.78)
        .to(b, { autoAlpha: 0, duration: 0.20, ease: 'power2.in' }, i + 0.80);
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   PROJECTS — MOBILE INFO CARDS
   On desktop, the sticky panel swaps project copy as you scroll.
   Below 960px that scroll behaviour is disabled (initProjectsScroll
   bails), so the sticky panel can only ever show project 01 and
   projects 02–04 would render as bare mockups with no name, desc,
   tags or links. Here we hide the sticky panel (CSS) and inject a
   per-project info card under each mockup so every project carries
   its own copy. Desktop never runs this.
───────────────────────────────────────────────────────── */
function initProjectsMobile() {
  // Runs for narrow viewports OR reduced-motion (the cinematic stage bails in
  // both cases). Renders each project as a stacked card under its mockup.
  if (window.innerWidth >= 960 && !PREFERS_REDUCED_MOTION) return;

  const scrollEl = document.querySelector('.projects-scroll');
  if (!scrollEl || scrollEl.dataset.mobileBuilt) return;
  const blocks = scrollEl.querySelectorAll('.project-visual-block');
  if (!blocks.length) return;

  blocks.forEach((block, i) => {
    const p = PROJECTS[i];
    if (!p) return;
    applyAccent(block, p);

    const card = document.createElement('div');
    card.className = 'pm-info';
    card.innerHTML =
      `<div class="project-counter">${p.counter}</div>` +
      `<h3 class="project-name">${p.name}</h3>` +
      `<p class="project-desc">${p.desc}</p>` +
      `<div class="project-tags">${p.tags.map(tagHTML).join('')}</div>` +
      projectActionsHTML(p, i);
    block.appendChild(card);
  });

  scrollEl.dataset.mobileBuilt = '1';
}

/* ─────────────────────────────────────────────────────────────
   CASE STUDY MODAL (Auditly Pro deep-dive)
───────────────────────────────────────────────────────── */
function initCaseStudyModal() {
  const modal = document.getElementById('cs-modal');
  // Every Case Study trigger: the hero card button plus the per-project buttons
  // injected into the cinematic overlays (desktop) or the stacked cards (mobile).
  // They all carry class .project-casestudy and a data-index. Runs after the
  // project init functions, so the injected buttons already exist.
  const openBtns = [...document.querySelectorAll('.project-casestudy')];
  if (!modal || !openBtns.length) return;

  const scrollEl = modal.querySelector('.cs-scroll');
  let lastFocus = null;

  function open(index) {
    const cs = CASE_STUDIES[index] || CASE_STUDIES[0];
    if (scrollEl && cs) {
      scrollEl.innerHTML = renderCaseStudy(cs);
      modal.setAttribute('aria-labelledby', 'cs-title');
    }
    lastFocus = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cs-open');
    if (scrollEl) scrollEl.scrollTop = 0;

    // Staggered reveal of the freshly rendered sections.
    if (scrollEl && !PREFERS_REDUCED_MOTION) {
      gsap.fromTo(scrollEl.children,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.34, ease: 'power3.out', stagger: 0.05, overwrite: true }
      );
    }

    const closeBtn = modal.querySelector('.cs-close');
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cs-open');
    if (lastFocus) lastFocus.focus();
  }

  openBtns.forEach(btn => btn.addEventListener('click', () => {
    open(parseInt(btn.dataset.index, 10) || 0);
  }));
  modal.querySelectorAll('[data-cs-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
}

/* ─────────────────────────────────────────────────────────────
   PIPELINE NODE ANIMATION (cycling active state)
───────────────────────────────────────────────────────── */
/* Registry of per-project mockup timelines so the cinematic stage plays only
   the active project's animation and pauses the rest (one loop at a time). */
const projectTL = {};
let activeProjectIdx = -1;
function registerProjectTL(index, tl) {
  projectTL[index] = tl;
  const cinematic = document.querySelector('.projects-stage.cinematic');
  // Non-cinematic (mobile/reduced bail) → every mockup just plays. Cinematic →
  // only project 0 starts; the rest wait for playProjectTL to activate them.
  if (!cinematic || index === 0) tl.play(0); else tl.pause(0);
}
function playProjectTL(index) {
  if (index === activeProjectIdx) return; // only act when the active project changes
  activeProjectIdx = index;
  Object.keys(projectTL).forEach(k => {
    const tl = projectTL[k];
    if (+k === index) tl.restart(); else tl.pause();
  });
}
/* Glossy sheen-sweep layer (prepended so the real last-child keeps its bottom
   rounding; the streak itself loops via CSS). */
function addSheen(mockup) {
  if (mockup.querySelector('.mockup-sheen')) return;
  const sheen = document.createElement('div');
  sheen.className = 'mockup-sheen';
  sheen.innerHTML = '<span></span>';
  mockup.prepend(sheen);
}

/* ─────────────────────────────────────────────────────────────
   CHAT MOCKUPS (02–04) — GSAP loop: staggered message reveal, then
   a pulse travels down the pipeline lighting nodes in sequence.
───────────────────────────────────────────────────────── */
function initPipelineAnimation() {
  document.querySelectorAll('.chat-mockup').forEach(mockup => {
    const block = mockup.closest('.project-visual-block');
    const index = block ? +block.dataset.project : 0;
    addSheen(mockup);

    const msgs   = gsap.utils.toArray(mockup.querySelectorAll('.chat-msg'));
    const flow   = mockup.querySelector('.pipeline-flow');
    const nodes  = flow ? gsap.utils.toArray(flow.querySelectorAll('.pipeline-node')) : [];
    const arrows = flow ? gsap.utils.toArray(flow.querySelectorAll('.pipeline-arrow')) : [];

    // Reduced motion: show the finished conversation + lit last node, no loop.
    if (PREFERS_REDUCED_MOTION) {
      msgs.forEach(m => gsap.set(m, { opacity: 1, y: 0 }));
      if (nodes.length) nodes[nodes.length - 1].classList.add('active');
      return;
    }

    let pulse = null;
    if (flow) { pulse = document.createElement('div'); pulse.className = 'pipeline-pulse'; flow.appendChild(pulse); }

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.1, paused: true });

    tl.set(msgs, { opacity: 0, y: 14 })
      .add(() => {
        nodes.forEach(n => n.classList.remove('active'));
        arrows.forEach(a => a.classList.remove('lit'));
        if (pulse) gsap.set(pulse, { opacity: 0 });
      }, 0)
      .to(msgs, { opacity: 1, y: 0, duration: 0.4, stagger: 0.55, ease: 'power3.out' }, 0.2);

    const pStart = 0.2 + msgs.length * 0.55 + 0.3;
    if (nodes.length && pulse) {
      tl.set(pulse, { opacity: 1, left: () => nodes[0].offsetLeft + nodes[0].offsetWidth / 2 }, pStart);
      nodes.forEach((node, n) => {
        const at = pStart + n * 0.5;
        tl.add(() => {
          nodes.forEach(x => x.classList.remove('active'));
          node.classList.add('active');
          if (arrows[n - 1]) arrows[n - 1].classList.add('lit');
        }, at);
        tl.to(pulse, { left: () => node.offsetLeft + node.offsetWidth / 2, duration: 0.45, ease: 'power1.inOut' }, at);
      });
      tl.to(pulse, { opacity: 0, duration: 0.3 }, pStart + nodes.length * 0.5);
    }

    registerProjectTL(index, tl);
  });
}

/* ─────────────────────────────────────────────────────────────
   AUDITLY MOCKUP — animated "thinking" audit process
   Cycles: scrape → analyze → SEO checks → report, then fills
   the Conversion / SEO / UX score bars, holds, and loops.
───────────────────────────────────────────────────────── */
function initAuditMockup() {
  const mockup = document.querySelector('.audit-mockup');
  if (!mockup) return;
  const block = mockup.closest('.project-visual-block');
  const index = block ? +block.dataset.project : 0;
  addSheen(mockup);

  const stagesWrap = mockup.querySelector('.audit-stages');
  const stages = gsap.utils.toArray(mockup.querySelectorAll('.audit-stage'));
  const scoresWrap = mockup.querySelector('.audit-scores');
  const bars = gsap.utils.toArray(mockup.querySelectorAll('.audit-score-fill'));
  const nums = gsap.utils.toArray(mockup.querySelectorAll('.audit-score-num'));
  const runBtn = mockup.querySelector('.audit-run');
  if (!stages.length || !scoresWrap) return;

  const targets = bars.map(b => +(b.dataset.score || 0));

  // Reduced motion: render the finished report statically, skip the cycle.
  if (PREFERS_REDUCED_MOTION) {
    stages.forEach(s => { s.classList.remove('active'); s.classList.add('done'); });
    if (runBtn) runBtn.classList.remove('running');
    scoresWrap.classList.add('show');
    bars.forEach((b, i) => { b.style.width = targets[i] + '%'; });
    nums.forEach((n, i) => { n.textContent = targets[i]; });
    return;
  }

  // Scan-line that sweeps the stage list while the audit "thinks".
  let scan = mockup.querySelector('.audit-scan');
  if (!scan && stagesWrap) { scan = document.createElement('div'); scan.className = 'audit-scan'; stagesWrap.appendChild(scan); }

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6, paused: true });

  // Reset to a clean "before audit" state at the top of every loop.
  tl.add(() => {
    stages.forEach(s => s.classList.remove('active', 'done'));
    scoresWrap.classList.remove('show');
    bars.forEach(b => { b.style.width = '0%'; });
    nums.forEach(n => { n.textContent = '0'; });
    if (runBtn) runBtn.classList.add('running');
    if (scan) gsap.set(scan, { opacity: 0, top: 0 });
  }, 0);

  // Scan sweep down the stage list.
  if (scan && stagesWrap) {
    tl.fromTo(scan, { opacity: 0, top: 0 }, { opacity: 0.9, duration: 0.25 }, 0.1)
      .to(scan, { top: () => Math.max(0, stagesWrap.offsetHeight - 38), duration: stages.length * 0.7, ease: 'none' }, 0.15)
      .to(scan, { opacity: 0, duration: 0.3 }, '>-0.1');
  }

  // Stages tick: spinner active, then checked done.
  stages.forEach((stage, i) => {
    const t = 0.3 + i * 0.7;
    tl.add(() => { stages.forEach(s => s.classList.remove('active')); stage.classList.add('active'); }, t)
      .add(() => { stage.classList.remove('active'); stage.classList.add('done'); }, t + 0.62);
  });

  // Reveal scores, then fill bars while the numbers count up.
  const afterStages = 0.3 + stages.length * 0.7 + 0.2;
  tl.add(() => { if (runBtn) runBtn.classList.remove('running'); scoresWrap.classList.add('show'); }, afterStages);
  bars.forEach((bar, i) => {
    const prox = { w: 0 };
    tl.to(prox, {
      w: targets[i], duration: 0.95, ease: 'power2.out',
      onUpdate: () => { bar.style.width = prox.w + '%'; if (nums[i]) nums[i].textContent = Math.round(prox.w); },
    }, afterStages + 0.1 + i * 0.18);
  });

  registerProjectTL(index, tl);
}

/* ─────────────────────────────────────────────────────────────
   INTERACTIVE GLOBE (Three.js)
───────────────────────────────────────────────────────── */
function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const SIZE = 300;
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.z = 2.8;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(SIZE, SIZE);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  /* Dark globe body — opaque so it occludes the back-side dots and reads
     as a solid sphere. Colour sits just above the page background. */
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.985, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x0d0a09 })
  ));

  /* Soft coral atmosphere rim glow */
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.14, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xD97757, transparent: true, opacity: 0.10, side: THREE.BackSide })
  ));
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.04, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x4a221a, transparent: true, opacity: 0.14, side: THREE.BackSide })
  ));

  /* Globe group — continent dots added here once loaded */
  const globeGroup = new THREE.Group();
  globeGroup.rotation.y = -1.81;  // face Europe toward the viewer
  globeGroup.rotation.x = 0.5;    // tilt north up so Sweden sits in view
  scene.add(globeGroup);

  /* Convert lat/lon → 3D point on unit sphere */
  function ll2v(lon, lat, r) {
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  /* Point-in-polygon (ray casting) on geographic lon/lat */
  function pointInRing(lon, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      if (((yi > lat) !== (yj > lat)) &&
          (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  function isLand(lon, lat, rings) {
    for (const R of rings) {
      if (lon < R.minLon || lon > R.maxLon || lat < R.minLat || lat > R.maxLat) continue;
      if (pointInRing(lon, lat, R.ring)) return true;
    }
    return false;
  }

  /* Materials: coral continent dots + a bright pulsing Sweden cluster */
  const landMat   = new THREE.PointsMaterial({ color: 0xD97757, size: 0.024, transparent: true, opacity: 0.92, sizeAttenuation: true });
  const swedenMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.034, transparent: true, opacity: 1, sizeAttenuation: true });

  function vertsToPoints(verts, mat) {
    const pos = new Float32Array(verts.length * 3);
    verts.forEach((v, i) => { pos[i*3] = v.x; pos[i*3+1] = v.y; pos[i*3+2] = v.z; });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(geo, mat);
  }

  /* Banded lat/lon grid (rows scaled by cos(lat) for even spacing); keep the
     dots that fall on land, with the Sweden region split out for emphasis. */
  function buildDots(landRings) {
    const land = [], sweden = [];
    const LAT_STEP = 2.6, LON_BASE = 150;
    for (let lat = -88; lat <= 88; lat += LAT_STEP) {
      const cosL = Math.cos(lat * Math.PI / 180);
      const n = Math.max(1, Math.round(LON_BASE * cosL));
      for (let k = 0; k < n; k++) {
        const lon = -180 + (360 * k / n);
        if (landRings && !isLand(lon, lat, landRings)) continue;
        const v = ll2v(lon, lat, 1.0);
        if (landRings && lon >= 11 && lon <= 19 && lat >= 55 && lat <= 66) sweden.push(v);
        else land.push(v);
      }
    }
    globeGroup.add(vertsToPoints(land, landMat));
    if (sweden.length) globeGroup.add(vertsToPoints(sweden, swedenMat));
  }

  /* Fetch world landmasses, derive the bounding-boxed land rings, build dots */
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(r => r.json())
    .then(world => {
      const countries = topojson.feature(world, world.objects.countries);
      const landRings = [];
      countries.features.forEach(f => {
        const g = f.geometry;
        if (!g) return;
        const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
        polys.forEach(poly => {
          const ring = poly[0];
          if (!ring || ring.length < 4) return;
          let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
          for (const c of ring) {
            if (c[0] < minLon) minLon = c[0];
            if (c[0] > maxLon) maxLon = c[0];
            if (c[1] < minLat) minLat = c[1];
            if (c[1] > maxLat) maxLat = c[1];
          }
          landRings.push({ ring, minLon, maxLon, minLat, maxLat });
        });
      });
      buildDots(landRings);
    })
    .catch(() => buildDots(null)); /* fallback: full dotted sphere */

  /* Drag interaction — no auto-rotation; only spins when the user drags,
     with a little inertia after release. */
  let isDragging = false;
  let prevX = 0, prevY = 0, velX = 0;
  canvas.style.cursor = 'grab';

  canvas.addEventListener('pointerdown', e => {
    isDragging = true;
    prevX = e.clientX; prevY = e.clientY; velX = 0;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', e => {
    if (!isDragging) return;
    const dx = e.clientX - prevX;
    velX = dx;
    globeGroup.rotation.y += dx * 0.012; // horizontal spin only — no vertical tilt
    prevX = e.clientX; prevY = e.clientY;
  });
  canvas.addEventListener('pointerup', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
  });

  /* Animate — apply release inertia + pulse the Sweden cluster */
  const globeClock = new THREE.Clock();
  function animate() {
    const t = globeClock.getElapsedTime();

    if (!isDragging) {
      globeGroup.rotation.y += velX * 0.003;
      velX *= 0.92;
    }

    swedenMat.opacity = 0.7 + Math.sin(t * 2.0) * 0.3;

    renderer.render(scene, camera);
  }
  animateWhenVisible(canvas, animate);
}

function initSwedenRipple() {
  const svg = document.querySelector('.sweden-svg');
  if (!svg) return;

  svg.style.cursor = 'pointer';

  svg.addEventListener('click', e => {
    /* Convert screen coords → SVG viewBox coords */
    const pt  = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    /* Spawn 3 rings with staggered delays (skipped under reduced motion;
       the static dot below still gives click feedback) */
    if (!PREFERS_REDUCED_MOTION) [0, 180, 360].forEach(delay => {
      setTimeout(() => {
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('cx', svgP.x);
        ring.setAttribute('cy', svgP.y);
        ring.setAttribute('r', '3');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', '#D97757');
        ring.setAttribute('stroke-width', '2.5');
        ring.setAttribute('opacity', '0.75');
        ring.style.pointerEvents = 'none';
        svg.appendChild(ring);

        const MAX_R   = 38;
        const FRAMES  = 45;
        let   frame   = 0;

        const step = () => {
          frame++;
          const p       = frame / FRAMES;          // 0 → 1
          const eased   = 1 - Math.pow(1 - p, 2); // ease-out quad
          const r       = 3 + eased * (MAX_R - 3);
          const opacity = 0.75 * (1 - p);
          const sw      = 2.5 - p * 2;             // stroke thins as it expands

          ring.setAttribute('r',            r);
          ring.setAttribute('opacity',      Math.max(0, opacity));
          ring.setAttribute('stroke-width', Math.max(0.3, sw));

          if (frame < FRAMES) requestAnimationFrame(step);
          else ring.remove();
        };

        requestAnimationFrame(step);
      }, delay);
    });

    /* Small persistent dot at click point, fades after 600ms */
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', svgP.x);
    dot.setAttribute('cy', svgP.y);
    dot.setAttribute('r', '2.5');
    dot.setAttribute('fill', '#D97757');
    dot.setAttribute('opacity', '0.9');
    dot.style.pointerEvents = 'none';
    svg.appendChild(dot);
    setTimeout(() => {
      let op = 0.9;
      const fade = () => {
        op -= 0.06;
        dot.setAttribute('opacity', Math.max(0, op));
        if (op > 0) requestAnimationFrame(fade);
        else dot.remove();
      };
      requestAnimationFrame(fade);
    }, 500);
  });
}

/* ─────────────────────────────────────────────────────────────
   COPY EMAIL TO CLIPBOARD
───────────────────────────────────────────────────────── */
function copyEmail(btn) {
  navigator.clipboard.writeText('alenblekic2@gmail.com').then(() => {
    btn.classList.add('copied');
    btn.disabled = true;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.disabled = false;
    }, 2200);
  });
}

/* ─────────────────────────────────────────────────────────────
   MOBILE NAV TOGGLE
───────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────
   ALEN SIGNATURE DRAW ANIMATION
───────────────────────────────────────────────────────── */
function initAlenSignature() {
  const textEl = document.querySelector('.sig-text');
  if (!textEl || typeof gsap === 'undefined') return;

  const LEN = 8000; // safely exceeds the ALEN outline path length
  gsap.set(textEl, { strokeDasharray: LEN, strokeDashoffset: LEN });

  // Reduced motion: show the finished signature, skip the draw/erase loop.
  if (PREFERS_REDUCED_MOTION) {
    gsap.set(textEl, { strokeDasharray: 'none', strokeDashoffset: 0 });
    return;
  }

  function runCycle() {
    gsap.set(textEl, { strokeDasharray: LEN, strokeDashoffset: LEN });
    const tl = gsap.timeline({ onComplete: () => gsap.delayedCall(2.2, runCycle) });
    // Draw the outline on, then drop the dash so the resting state is a
    // complete, gap-free outline (no segment clipped mid-letter).
    tl.to(textEl, {
      strokeDashoffset: 0, duration: 4.2, ease: 'power2.inOut',
      onComplete: () => gsap.set(textEl, { strokeDasharray: 'none' }),
    });
    // Hold, then restore the dash and erase it back out.
    tl.add(() => gsap.set(textEl, { strokeDasharray: LEN, strokeDashoffset: 0 }), '+=2.2');
    tl.to(textEl, { strokeDashoffset: LEN, duration: 3.0, ease: 'power2.inOut' });
  }

  ScrollTrigger.create({
    trigger: '.signature-section',
    start: 'top 90%',
    onEnter: runCycle,
    once: true,
  });
}

/* ─────────────────────────────────────────────────────────────
   SECTION FLASH LINE
───────────────────────────────────────────────────────── */
function initSectionFlash() {
  const flash = document.getElementById('section-flash');
  if (!flash || typeof gsap === 'undefined') return;

  // Reduced motion: no sweeping flash on section changes.
  if (PREFERS_REDUCED_MOTION) return;

  let isAnimating = false;

  function triggerFlash() {
    if (isAnimating) return;
    isAnimating = true;

    gsap.set(flash, { x: -260, opacity: 1 });
    gsap.to(flash, {
      x: window.innerWidth + 260,
      duration: 1.8,
      ease: 'none',
      onComplete: () => {
        gsap.set(flash, { opacity: 0 });
        isAnimating = false;
      }
    });
  }

  document.querySelectorAll('section[id]').forEach(section => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      onEnter:     triggerFlash,
      onEnterBack: triggerFlash,
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   DIGITAL RAIN GRID
───────────────────────────────────────────────────────── */
function initRainGrid() {
  const canvas = document.getElementById('rain-grid-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const CELL = 18;
  const GAP  = 2;
  const STEP = CELL + GAP;

  let W, H, COLS, ROWS;
  let cells = [];       // flat array of cell objects
  let mouse = { x: -999, y: -999 };
  let pulses = [];      // { cx, cy, r, strength, born }
  let waves  = [];      // diagonal sweeps { progress, axis, dir, strength }
  let raf;

  /* ── Cell factory ─────────────────────────────────────── */
  function makeCell(col, row) {
    return {
      col, row,
      x: col * STEP + STEP / 2,
      y: row * STEP + STEP / 2,
      base:     0.03 + Math.random() * 0.06,   // resting brightness
      bright:   0,                               // added brightness
      target:   0,
      phase:    Math.random() * Math.PI * 2,    // for organic drift
      speed:    0.004 + Math.random() * 0.008,
      size:     Math.floor(Math.random() * 3),  // 0=dot 1=small 2=med square
      layer:    Math.random(),                   // 0=back 1=front (depth)
    };
  }

  /* ── Setup / resize ───────────────────────────────────── */
  function setup() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width  || canvas.parentElement.offsetWidth  || 400;
    H = rect.height || canvas.parentElement.offsetHeight || 600;
    canvas.width  = W;
    canvas.height = H;
    COLS = Math.ceil(W / STEP) + 1;
    ROWS = Math.ceil(H / STEP) + 1;
    cells = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        cells.push(makeCell(c, r));
  }

  /* ── Emit a radial pulse at grid coords ───────────────── */
  function emitPulse(px, py, strength = 1) {
    const cx = Math.round(px / STEP);
    const cy = Math.round(py / STEP);
    pulses.push({ cx, cy, r: 0, strength, born: performance.now() });
  }

  /* ── Random idle pulses ───────────────────────────────── */
  function randomPulse() {
    if (Math.random() < 0.4) {
      emitPulse(
        Math.random() * W,
        Math.random() * H,
        0.3 + Math.random() * 0.5
      );
    }
    setTimeout(randomPulse, 1800 + Math.random() * 3000);
  }

  /* ── Diagonal wave sweep ──────────────────────────────── */
  function randomWave() {
    waves.push({
      progress: 0,
      dir: Math.random() < 0.5 ? 1 : -1,
      strength: 0.25 + Math.random() * 0.35,
    });
    setTimeout(randomWave, 5000 + Math.random() * 8000);
  }

  /* ── Main draw loop ───────────────────────────────────── */
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);

    const now = ts || performance.now();

    /* Advance pulses */
    pulses = pulses.filter(p => {
      p.r += 0.22;
      return p.r < Math.max(COLS, ROWS) * 1.5 && now - p.born < 4000;
    });

    /* Advance waves */
    waves = waves.filter(w => {
      w.progress += 0.008;
      return w.progress < 1.6;
    });

    /* Draw cells */
    for (const c of cells) {
      c.phase += c.speed;
      const organicDrift = (Math.sin(c.phase) * 0.5 + 0.5) * 0.05;

      /* Pulse contribution */
      let pulseAdd = 0;
      for (const p of pulses) {
        const dist = Math.hypot(c.col - p.cx, c.row - p.cy);
        const ring = Math.abs(dist - p.r);
        if (ring < 2.2) {
          pulseAdd += p.strength * (1 - ring / 2.2) * (1 - p.r / (COLS * 1.5));
        }
      }

      /* Wave contribution */
      let waveAdd = 0;
      for (const w of waves) {
        const diag = (c.col + c.row) / (COLS + ROWS);
        const diff = Math.abs(diag - w.progress);
        if (diff < 0.06) {
          waveAdd += w.strength * (1 - diff / 0.06);
        }
      }

      /* Mouse proximity */
      const mdx = c.x - mouse.x;
      const mdy = c.y - mouse.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      const mouseAdd = mdist < 90 ? (1 - mdist / 90) * 0.45 : 0;

      /* Depth parallax offset */
      const parallaxX = (mouse.x / (W || 1) - 0.5) * (c.layer - 0.5) * 6;
      const parallaxY = (mouse.y / (H || 1) - 0.5) * (c.layer - 0.5) * 6;

      const total = Math.min(1, c.base + organicDrift + pulseAdd + waveAdd + mouseAdd);
      const depthScale = 0.6 + c.layer * 0.7;

      const halfSize = ((c.size === 0 ? 1 : c.size === 1 ? 2.5 : 4) * depthScale) / 2;

      /* Tint: brighter cells shift toward Claude orange (217,119,87) */
      const r = Math.round(30 + total * 187);
      const g = Math.round(12 + total * 107);
      const b = Math.round(8  + total * 79);
      const a = Math.min(0.85, total * depthScale);

      ctx.globalAlpha = a;
      ctx.fillStyle = `rgb(${r},${g},${b})`;

      if (c.size === 0) {
        ctx.beginPath();
        ctx.arc(c.x + parallaxX, c.y + parallaxY, halfSize, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(
          c.x + parallaxX - halfSize,
          c.y + parallaxY - halfSize,
          halfSize * 2, halfSize * 2
        );
      }
    }

    ctx.globalAlpha = 1;
  }

  /* ── Mouse tracking ───────────────────────────────────── */
  const expSection = document.querySelector('.experience-section');
  if (expSection) {
    expSection.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });
    expSection.addEventListener('mouseleave', () => {
      mouse.x = -999; mouse.y = -999;
    });
  }

  /* ── Card hover → localized pulse ───────────────────────── */
  document.querySelectorAll('.experience-section .timeline-content').forEach((card, i) => {
    card.addEventListener('mouseenter', () => {
      const rect  = canvas.getBoundingClientRect();
      const cRect = card.getBoundingClientRect();
      const py    = cRect.top + cRect.height / 2 - rect.top;
      emitPulse(W * 0.5, py, 0.8);
    });
  });

  /* ── ScrollTrigger: card enters viewport → pulse ──────── */
  document.querySelectorAll('.experience-section .timeline-item').forEach((item, i) => {
    ScrollTrigger.create({
      trigger: item,
      start: 'top 65%',
      onEnter: () => {
        const rect  = canvas.getBoundingClientRect();
        const iRect = item.getBoundingClientRect();
        const py    = iRect.top + iRect.height / 2 - rect.top;
        setTimeout(() => emitPulse(0, Math.max(0, py), 0.6 + i * 0.1), 80);
      },
    });
  });

  /* ── Resize ───────────────────────────────────────────── */
  const ro = new ResizeObserver(() => { setup(); });
  ro.observe(canvas.parentElement);

  /* ── Boot ─────────────────────────────────────────────── */
  setup();
  setTimeout(randomPulse, 1200);
  setTimeout(randomWave,  3000);
  animateWhenVisible(canvas.parentElement, draw);
}




/* ── Section Header Lines — full viewport width ───────────── */
function initSectionHeaderLines() {
  function setWidths() {
    document.querySelectorAll('.sh-line').forEach(line => {
      const rect = line.getBoundingClientRect();
      const remaining = window.innerWidth - rect.left;
      line.style.width = remaining + 'px';
      line.style.flex = 'none';
    });
  }
  setWidths();
  window.addEventListener('resize', setWidths);
}

/* ── About Slideshow ──────────────────────────────────────── */
function initAboutSlideshow() {
  const slides = document.querySelectorAll('.slide');
  const bar    = document.querySelector('.slideshow-progress-bar');
  if (!slides.length) return;

  let current = 0;
  const total = slides.length;

  function goTo(n) {
    const prev = slides[current];
    prev.classList.remove('active');
    prev.classList.add('leaving');
    prev.addEventListener('animationend', () => prev.classList.remove('leaving'), { once: true });

    current = (n + total) % total;
    slides[current].classList.add('active');
    if (bar) {
      bar.classList.remove('pulse');
      void bar.offsetWidth; // reflow to restart animation
      bar.classList.add('pulse');
    }
  }

  // Reduced motion: hold on the first slide, no auto-advance.
  if (PREFERS_REDUCED_MOTION) return;

  setInterval(() => goTo(current + 1), 3000);
}

function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links  = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    const isOpen = links.classList.contains('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close on link click
  links.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
    });
  });
}

/* ── Saturn ───────────────────────────────────────────────── */
function initSaturn() {
  const canvas = document.getElementById('saturn-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* internal resolution; display size is responsive via CSS */
  const SIZE = 560;
  canvas.width  = SIZE;
  canvas.height = SIZE;

  const CX = SIZE / 2, CY = SIZE / 2 + 55, R = 92;
  const TILT = 0.36; /* ring y-compression — viewing angle ~21° */

  /* ── Comets on wide orbits outside the rings ── */
  const COMETS = [
    { a: R * 2.62, angle: Math.random() * Math.PI * 2, speed:  0.0042, rgb: '217,119,87',  size: 2.6 },
    { a: R * 2.88, angle: Math.random() * Math.PI * 2, speed: -0.0026, rgb: '185,212,255', size: 2.0 },
  ];

  /* ── Small moon transiting between the A ring and the comet orbits ── */
  const MOON = { a: R * 2.48, angle: Math.random() * Math.PI * 2, speed: 0.0056, r: 5 };

  /* ── Ring grains: individually orbiting particles that make the rings sparkle ── */
  const RING_TONES = ['255,244,220', '228,208,170', '198,176,138'];
  const ringGrains = Array.from({ length: 620 }, () => {
    const rr = R * (1.24 + Math.random() * 1.04); /* C ring → A ring outer */
    const inGap = rr > R * 1.96 && rr < R * 2.05; /* Cassini Division is sparse */
    return {
      r: rr,
      angle: Math.random() * Math.PI * 2,
      speed: 0.0038 * Math.sqrt((R * 1.7) / rr), /* Kepler-ish: outer grains lag */
      size: Math.random() * 1.05 + 0.35,
      tone: RING_TONES[(Math.random() * RING_TONES.length) | 0],
      base: (inGap ? 0.10 : 0.55) * (0.5 + Math.random() * 0.5),
      tw: Math.random() * Math.PI * 2,
      ts: 0.03 + Math.random() * 0.05,
    };
  });

  /* ── Ring definitions (inner radius, outer radius, rgb, alpha) ── */
  /* Cassini palette: D faint, C brown, B bright cream, Cassini gap dark, A gold, F thin */
  const RINGS = [
    { r1: R*1.11, r2: R*1.24, rgb:'155,138,108', a:0.14 }, // D ring
    { r1: R*1.24, r2: R*1.52, rgb:'138,118,88',  a:0.42 }, // C ring
    { r1: R*1.52, r2: R*1.74, rgb:'228,212,182', a:0.82 }, // B ring inner
    { r1: R*1.74, r2: R*1.96, rgb:'250,240,218', a:0.95 }, // B ring bright
    { r1: R*1.96, r2: R*2.05, rgb:'12,10,6',     a:0.88 }, // Cassini Division
    { r1: R*2.05, r2: R*2.18, rgb:'198,175,138', a:0.75 }, // A ring inner
    { r1: R*2.18, r2: R*2.28, rgb:'215,192,155', a:0.65 }, // A ring outer
    { r1: R*2.34, r2: R*2.37, rgb:'235,225,205', a:0.42 }, // F ring
  ];

  /* ── Saturn globe bands (soft, golden-tan tones) ── */
  const bands = [
    { color: '#22180a', y: 0.00, h: 0.07 },
    { color: '#5e4820', y: 0.07, h: 0.06 },
    { color: '#c8b878', y: 0.13, h: 0.08 },
    { color: '#a89060', y: 0.21, h: 0.06 },
    { color: '#ddd0a0', y: 0.27, h: 0.08 },
    { color: '#b8a270', y: 0.35, h: 0.05 },
    { color: '#eae0b8', y: 0.40, h: 0.09 },
    { color: '#d2c090', y: 0.49, h: 0.06 },
    { color: '#eae0b8', y: 0.55, h: 0.07 },
    { color: '#b8a270', y: 0.62, h: 0.05 },
    { color: '#ddd0a0', y: 0.67, h: 0.07 },
    { color: '#a89060', y: 0.74, h: 0.06 },
    { color: '#c8b878', y: 0.80, h: 0.07 },
    { color: '#5e4820', y: 0.87, h: 0.07 },
    { color: '#22180a', y: 0.94, h: 0.06 },
  ];

  /* ── Star factory ── */
  function makeStar(anywhere) {
    let x, y;
    if (anywhere) {
      x = Math.random() * SIZE;
      y = Math.random() * SIZE;
    } else {
      const angle = Math.random() * Math.PI * 2;
      const minD  = R * 2.6;
      const maxD  = SIZE * 0.70;
      const dist  = minD + Math.pow(Math.random(), 1.5) * (maxD - minD);
      x = CX + Math.cos(angle) * dist;
      y = CY + Math.sin(angle) * dist * 0.55; /* squash for elliptical galaxy look */
    }
    const rnd = Math.random();
    const color = rnd < 0.13 ? [255, 190, 110]  // warm gold
                : rnd < 0.23 ? [180, 210, 255]   // blue-white
                : rnd < 0.30 ? [255, 245, 160]   // yellow
                : rnd < 0.35 ? [217, 119, 87]    // portfolio red
                :              [255, 255, 255];   // white
    return {
      x, y,
      r: Math.random() * 1.65 + 0.12,
      alpha: Math.random() * 0.80 + 0.20,
      ts: Math.random() * 0.04 + 0.005,
      to: Math.random() * Math.PI * 2,
      color,
      glint: Math.random() > 0.70,
    };
  }

  const bgStars   = Array.from({ length: 320 }, () => makeStar(true));
  const ringStars = Array.from({ length: 200 }, () => makeStar(false));
  /* Foreground stars pass right through the planet & rings */
  const fgStars   = Array.from({ length: 65 }, () => {
    const s = makeStar(true);
    s.x = CX + (Math.random() - 0.5) * R * 5.0;
    s.y = CY + (Math.random() - 0.5) * R * 2.8;
    s.alpha *= 0.45;
    return s;
  });

  /* ── Nebula wisps ── */
  const nebulae = [
    { x: CX-170, y: CY-100, rx:120, ry:55, rot:-0.35, r:0,  g:35, b:90, a:0.042 },
    { x: CX+150, y: CY+110, rx:100, ry:50, rot: 0.55, r:90, g:28, b:0,  a:0.048 },
    { x: CX+70,  y: CY-160, rx:80,  ry:38, rot:-0.20, r:55, g:0,  b:95, a:0.032 },
    { x: CX-100, y: CY+155, rx:95,  ry:42, rot: 0.65, r:85, g:30, b:5,  a:0.038 },
    { x: CX,     y: CY,     rx:230, ry:130,rot: 0,    r:28, g:18, b:8,  a:0.020 },
  ];

  /* ── Full-section starfield canvas ── */
  const bgCanvas = document.getElementById('contact-starfield');
  let bgCtx = null;
  if (bgCanvas) {
    const section = document.getElementById('contact');
    const resizeBg = () => {
      bgCanvas.width  = section.offsetWidth;
      bgCanvas.height = section.offsetHeight;
    };
    resizeBg();
    new ResizeObserver(resizeBg).observe(section);
    bgCtx = bgCanvas.getContext('2d');
  }

  /* Extra stars spread across the whole section */
  const sectionStars = Array.from({ length: 420 }, () => {
    const rnd = Math.random();
    const color = rnd < 0.13 ? [255, 190, 110]
                : rnd < 0.23 ? [180, 210, 255]
                : rnd < 0.30 ? [255, 245, 160]
                : rnd < 0.35 ? [217, 119, 87]
                :              [255, 255, 255];
    return {
      x: Math.random(), /* stored as 0–1 fraction, scaled at draw time */
      y: Math.random(),
      r: Math.random() * 1.55 + 0.10,
      alpha: Math.random() * 0.75 + 0.20,
      ts: Math.random() * 0.04 + 0.005,
      to: Math.random() * Math.PI * 2,
      color,
      glint: Math.random() > 0.78,
    };
  });

  const sectionNebulae = [
    { fx:0.12, fy:0.18, rx:160, ry:72,  rot:-0.30, r:0,  g:30, b:90, a:0.038 },
    { fx:0.80, fy:0.75, rx:140, ry:60,  rot: 0.50, r:85, g:25, b:0,  a:0.042 },
    { fx:0.55, fy:0.10, rx:110, ry:48,  rot:-0.18, r:50, g:0,  b:90, a:0.030 },
    { fx:0.25, fy:0.82, rx:120, ry:52,  rot: 0.62, r:80, g:28, b:5,  a:0.036 },
    { fx:0.88, fy:0.22, rx:100, ry:44,  rot:-0.40, r:0,  g:20, b:80, a:0.028 },
    { fx:0.42, fy:0.55, rx:200, ry:90,  rot: 0.10, r:25, g:15, b:8,  a:0.018 },
  ];

  function drawSectionStarfield(tick) {
    if (!bgCtx) return;
    const W = bgCanvas.width, H = bgCanvas.height;
    bgCtx.clearRect(0, 0, W, H);

    /* nebula wisps */
    sectionNebulae.forEach(n => {
      const nx = n.fx * W, ny = n.fy * H;
      bgCtx.save();
      bgCtx.translate(nx, ny);
      bgCtx.rotate(n.rot);
      const g = bgCtx.createRadialGradient(0, 0, 0, 0, 0, Math.max(n.rx, n.ry));
      g.addColorStop(0,   `rgba(${n.r},${n.g},${n.b},${n.a})`);
      g.addColorStop(0.5, `rgba(${n.r},${n.g},${n.b},${n.a*0.35})`);
      g.addColorStop(1,   'rgba(0,0,0,0)');
      bgCtx.scale(1, n.ry / n.rx);
      bgCtx.beginPath();
      bgCtx.arc(0, 0, n.rx, 0, Math.PI * 2);
      bgCtx.fillStyle = g;
      bgCtx.fill();
      bgCtx.restore();
    });

    /* stars */
    sectionStars.forEach(s => {
      const a = s.alpha * (0.50 + 0.50 * Math.sin(tick * s.ts + s.to));
      const [r, g, b] = s.color;
      const sx = s.x * W, sy = s.y * H;
      bgCtx.beginPath();
      bgCtx.arc(sx, sy, s.r, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(${r},${g},${b},${a})`;
      bgCtx.fill();
      if (s.glint && s.r > 0.9) {
        bgCtx.strokeStyle = `rgba(${r},${g},${b},${a * 0.30})`;
        bgCtx.lineWidth = 0.5;
        bgCtx.beginPath();
        bgCtx.moveTo(sx - s.r*3.5, sy); bgCtx.lineTo(sx + s.r*3.5, sy);
        bgCtx.moveTo(sx, sy - s.r*3.5); bgCtx.lineTo(sx, sy + s.r*3.5);
        bgCtx.stroke();
      }
    });
  }

  let offset = 0, hovered = false, hoverP = 0, t = 0;

  canvas.addEventListener('mouseenter', () => { hovered = true; });
  canvas.addEventListener('mouseleave', () => { hovered = false; });

  function drawNebulae() {
    nebulae.forEach(n => {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate(n.rot);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(n.rx, n.ry));
      g.addColorStop(0,   `rgba(${n.r},${n.g},${n.b},${n.a})`);
      g.addColorStop(0.5, `rgba(${n.r},${n.g},${n.b},${n.a*0.38})`);
      g.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.scale(1, n.ry / n.rx);
      ctx.beginPath();
      ctx.arc(0, 0, n.rx, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    });
  }

  function drawStars(stars, tick) {
    stars.forEach(s => {
      const a = s.alpha * (0.52 + 0.48 * Math.sin(tick * s.ts + s.to));
      const [r, g, b] = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fill();
      if (s.glint && s.r > 0.85) {
        ctx.strokeStyle = `rgba(${r},${g},${b},${a * 0.32})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(s.x - s.r*3.5, s.y); ctx.lineTo(s.x + s.r*3.5, s.y);
        ctx.moveTo(s.x, s.y - s.r*3.5); ctx.lineTo(s.x, s.y + s.r*3.5);
        ctx.stroke();
      }
    });
  }

  /* Draw one ring half: startA→endA going clockwise */
  function strokeRing(ring, startA, endA) {
    const steps = Math.max(4, Math.ceil((ring.r2 - ring.r1) / 2));
    for (let i = 0; i < steps; i++) {
      const frac = i / steps;
      const r    = ring.r1 + frac * (ring.r2 - ring.r1);
      /* slight brightness gradient: brighter in the middle of each band */
      const brt  = 1 - Math.abs(frac - 0.5) * 0.45;
      ctx.beginPath();
      ctx.ellipse(CX, CY, r, r * TILT, 0, startA, endA);
      ctx.strokeStyle = `rgba(${ring.rgb},${ring.a * brt})`;
      ctx.lineWidth = 2.8;
      ctx.stroke();
    }
  }

  function drawRingsHalf(startA, endA) {
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(offset * 0.0018); /* spin angle tied to band scroll */
    ctx.translate(-CX, -CY);
    RINGS.forEach(ring => strokeRing(ring, startA, endA));
    ctx.restore();
  }

  /* ── Comet orbit hairlines ── */
  function drawOrbitLines() {
    COMETS.forEach(c => {
      ctx.beginPath();
      ctx.ellipse(CX, CY, c.a, c.a * TILT, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  /* Draw comets in the given half. front=true → lower arc (sin > 0). */
  function drawComets(front) {
    COMETS.forEach(c => {
      const inFront = Math.sin(c.angle) > 0;
      if (inFront !== front) return;
      const x = CX + Math.cos(c.angle) * c.a;
      const y = CY + Math.sin(c.angle) * c.a * TILT;
      /* trail: fading dots along the orbit behind the comet */
      const dir = c.speed >= 0 ? 1 : -1;
      for (let k = 1; k <= 9; k++) {
        const ta = c.angle - dir * k * 0.045;
        const tx = CX + Math.cos(ta) * c.a;
        const ty = CY + Math.sin(ta) * c.a * TILT;
        ctx.beginPath();
        ctx.arc(tx, ty, c.size * (1 - k / 11), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.rgb},${0.34 * (1 - k / 10)})`;
        ctx.fill();
      }
      /* glowing head */
      const g = ctx.createRadialGradient(x, y, 0, x, y, c.size * 5);
      g.addColorStop(0, `rgba(${c.rgb},0.9)`);
      g.addColorStop(0.35, `rgba(${c.rgb},0.28)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(x, y, c.size * 5, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, c.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fill();
    });
  }

  /* Ring grains in the given half. front=true → lower arc (sin > 0). */
  function drawRingGrains(front, tick) {
    ringGrains.forEach(gr => {
      const inFront = Math.sin(gr.angle) > 0;
      if (inFront !== front) return;
      const x = CX + Math.cos(gr.angle) * gr.r;
      const y = CY + Math.sin(gr.angle) * gr.r * TILT;
      const a = gr.base * (0.55 + 0.45 * Math.sin(tick * gr.ts + gr.tw));
      ctx.beginPath();
      ctx.arc(x, y, gr.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${gr.tone},${a})`;
      ctx.fill();
    });
  }

  /* Moon with simple day-side shading, occluded by the globe like the comets */
  function drawMoon(front) {
    const inFront = Math.sin(MOON.angle) > 0;
    if (inFront !== front) return;
    const x = CX + Math.cos(MOON.angle) * MOON.a;
    const y = CY + Math.sin(MOON.angle) * MOON.a * TILT;
    const g = ctx.createRadialGradient(x - MOON.r * 0.4, y - MOON.r * 0.4, 0, x, y, MOON.r);
    g.addColorStop(0, 'rgba(225,220,210,0.95)');
    g.addColorStop(0.65, 'rgba(168,162,150,0.9)');
    g.addColorStop(1, 'rgba(88,84,76,0.85)');
    ctx.beginPath();
    ctx.arc(x, y, MOON.r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    /* faint craters */
    ctx.fillStyle = 'rgba(60,56,50,0.35)';
    ctx.beginPath(); ctx.arc(x + 1.4, y + 0.8, 1.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 1.6, y - 1.2, 0.8, 0, Math.PI * 2); ctx.fill();
  }

  /* ── Meteors streaking across the section starfield ── */
  const meteors = [];
  let meteorCountdown = 140; /* first one arrives quickly */
  function updateMeteors() {
    if (!bgCtx) return;
    const W = bgCanvas.width, H = bgCanvas.height;
    if (--meteorCountdown <= 0) {
      meteorCountdown = 260 + Math.random() * 420; /* every ~4–11s */
      const fromLeft = Math.random() < 0.5;
      meteors.push({
        x: fromLeft ? Math.random() * W * 0.35 : W * 0.55 + Math.random() * W * 0.4,
        y: Math.random() * H * 0.45,
        vx: (fromLeft ? 1 : -1) * (7 + Math.random() * 6),
        vy: 3.5 + Math.random() * 2.5,
        life: 1,
        decay: 0.012 + Math.random() * 0.008,
        coral: Math.random() < 0.25,
      });
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy; m.life -= m.decay;
      if (m.life <= 0 || m.y > H + 40) { meteors.splice(i, 1); continue; }
      const tailX = m.x - m.vx * 11, tailY = m.y - m.vy * 11;
      const grad = bgCtx.createLinearGradient(m.x, m.y, tailX, tailY);
      const rgb = m.coral ? '255,170,130' : '235,242,255';
      grad.addColorStop(0, `rgba(${rgb},${0.85 * m.life})`);
      grad.addColorStop(1, `rgba(${rgb},0)`);
      bgCtx.strokeStyle = grad;
      bgCtx.lineWidth = 1.6;
      bgCtx.lineCap = 'round';
      bgCtx.beginPath();
      bgCtx.moveTo(m.x, m.y);
      bgCtx.lineTo(tailX, tailY);
      bgCtx.stroke();
      /* bright head */
      bgCtx.beginPath();
      bgCtx.arc(m.x, m.y, 1.4, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(255,255,255,${0.9 * m.life})`;
      bgCtx.fill();
    }
  }

  function drawGlobe() {
    /* 1. Clip to sphere */
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#22180a';
    ctx.fillRect(CX - R, CY - R, R * 2, R * 2);

    /* 2. Bands with gentle wave at edges */
    bands.forEach((b, i) => {
      const yTop = CY - R + b.y * R * 2;
      const h    = b.h * R * 2;
      const spd  = 0.5 + i * 0.04;
      const sx   = ((offset * spd) % (R * 2)) - R;
      for (let dx = -1; dx <= 1; dx++) {
        const x0 = CX - R + sx + dx * R * 2;
        ctx.fillStyle = b.color;
        ctx.fillRect(x0, yTop, R * 2, h);
        const w = Math.sin(t * 0.38 + i * 1.6 + dx * 2.1) * 3.5;
        ctx.fillRect(x0, yTop + h + w - 3, R * 2, 5.5);
        /* faint cloud wisps */
        if (i % 3 === 0) {
          ctx.fillStyle = 'rgba(255,248,220,0.04)';
          const wx = x0 + R + Math.sin(t * 0.28 + i) * 20;
          ctx.beginPath();
          ctx.ellipse(wx, yTop + h * 0.5, 30, h * 0.28, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    /* 2b. Storm spot — a coral-tinted oval drifting with its band */
    const stormBandY = CY - R + 0.63 * R * 2;
    const stormDrift = ((offset * 0.42) % (R * 2.6)) - R * 0.3;
    [0, -R * 2.6].forEach(wrapDx => {
      const sx = CX - R + stormDrift + wrapDx;
      const sy = stormBandY + Math.sin(t * 0.5) * 1.5;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(-0.06);
      const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, 24);
      sg.addColorStop(0,   'rgba(190,84,52,0.55)');
      sg.addColorStop(0.5, 'rgba(217,119,87,0.30)');
      sg.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.scale(1, 0.42);
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fillStyle = sg;
      ctx.fill();
      /* darker eye of the storm */
      ctx.beginPath();
      ctx.arc(2, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(120,48,28,0.40)';
      ctx.fill();
      ctx.restore();
    });

    /* 3. Ring shadow across globe — dark horizontal band */
    const sh = ctx.createLinearGradient(CX, CY - R * 0.18, CX, CY + R * 0.18);
    sh.addColorStop(0,   'rgba(8,5,2,0)');
    sh.addColorStop(0.30,'rgba(8,5,2,0.48)');
    sh.addColorStop(0.50,'rgba(8,5,2,0.62)');
    sh.addColorStop(0.70,'rgba(8,5,2,0.48)');
    sh.addColorStop(1,   'rgba(8,5,2,0)');
    ctx.fillStyle = sh;
    ctx.fillRect(CX - R, CY - R * 0.18, R * 2, R * 0.36);

    ctx.restore();

    /* 4. Specular highlight top-left */
    const spec = ctx.createRadialGradient(CX - R*0.34, CY - R*0.34, 0, CX, CY, R*0.92);
    spec.addColorStop(0,   'rgba(255,248,220,0.22)');
    spec.addColorStop(0.38,'rgba(255,235,190,0.07)');
    spec.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fillStyle = spec; ctx.fill();

    /* 5. Limb darkening */
    const limb = ctx.createRadialGradient(CX, CY, R * 0.50, CX, CY, R);
    limb.addColorStop(0,   'rgba(0,0,0,0)');
    limb.addColorStop(0.62,'rgba(0,0,0,0.07)');
    limb.addColorStop(1,   'rgba(0,0,0,0.78)');
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fillStyle = limb; ctx.fill();

    /* 5b. Coral rim light on the left limb — lit from the direction of the copy */
    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.clip();
    const rim = ctx.createRadialGradient(CX - R * 1.55, CY + R * 0.15, R * 0.4, CX - R * 1.55, CY + R * 0.15, R * 2.2);
    rim.addColorStop(0,    'rgba(217,119,87,0.42)');
    rim.addColorStop(0.45, 'rgba(217,119,87,0.14)');
    rim.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = rim;
    ctx.fillRect(CX - R, CY - R, R * 2, R * 2);
    ctx.restore();
    /* thin coral atmosphere arc just outside the lit limb */
    ctx.beginPath();
    ctx.arc(CX, CY, R + 1.5, Math.PI * 0.62, Math.PI * 1.38);
    ctx.strokeStyle = 'rgba(217,119,87,0.35)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* 6. Constant atmosphere glow (no hover change) */
    const glow = ctx.createRadialGradient(CX, CY, R - 2, CX, CY, R + 32);
    glow.addColorStop(0,   'rgba(215,188,130,0.11)');
    glow.addColorStop(0.4, 'rgba(160,128,72,0.05)');
    glow.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(CX, CY, R + 32, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();
  }

  // Reduced motion: paint Saturn once and stop — no orbit, no drifting stars.
  if (PREFERS_REDUCED_MOTION) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    drawSectionStarfield(0);
    drawNebulae();
    drawStars(bgStars, 0);
    drawStars(ringStars, 0);
    drawOrbitLines();
    drawComets(false);
    drawMoon(false);
    drawRingsHalf(Math.PI, Math.PI * 2);
    drawRingGrains(false, 0);
    drawGlobe();
    drawRingsHalf(0, Math.PI);
    drawRingGrains(true, 0);
    drawComets(true);
    drawMoon(true);
    drawStars(fgStars, 0);
    return;
  }

  let raf;
  function loop() {
    t      += 0.016;
    hoverP += hovered ? (1 - hoverP) * 0.06 : (0 - hoverP) * 0.04;
    offset += 0.12 + hoverP * 3.5;

    ctx.clearRect(0, 0, SIZE, SIZE);
    drawSectionStarfield(t * 60);
    updateMeteors();

    /* render order: nebulae → bg stars → ring stars → orbits →
       back (comets, moon, rings, grains) → globe →
       front (rings, grains, comets, moon) → fg stars */
    drawNebulae();
    drawStars(bgStars,   t * 60);
    drawStars(ringStars, t * 60);
    drawOrbitLines();
    const speedBoost = 1 + hoverP * 2.5;
    COMETS.forEach(c => { c.angle += c.speed * speedBoost; });
    MOON.angle += MOON.speed * speedBoost;
    ringGrains.forEach(gr => { gr.angle += gr.speed * speedBoost; });
    drawComets(false);                   /* upper arc — behind globe */
    drawMoon(false);
    drawRingsHalf(Math.PI, Math.PI * 2); /* back half — above globe */
    drawRingGrains(false, t * 60);
    drawGlobe();
    drawRingsHalf(0, Math.PI);           /* front half — below globe */
    drawRingGrains(true, t * 60);
    drawComets(true);                    /* lower arc — in front */
    drawMoon(true);
    drawStars(fgStars,   t * 60);        /* pierce through everything */

    raf = requestAnimationFrame(loop);
  }

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { if (!raf) loop(); }
    else { cancelAnimationFrame(raf); raf = null; }
  }, { threshold: 0.1 });
  obs.observe(canvas);
}

/* ── Contact finale extras: planet levitation + magnetic CTA ── */
function initContactImmersive() {
  if (typeof gsap === 'undefined' || PREFERS_REDUCED_MOTION) return;
  const hoverFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Slow levitation — the planet gently floats in place */
  const planetWrap = document.querySelector('.contact-planet-wrap');
  if (planetWrap) {
    gsap.to(planetWrap, { y: 14, duration: 4.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  /* Magnetic CTA: pulls toward the cursor, springs home on leave */
  const btn = document.getElementById('copy-email-btn');
  if (btn && hoverFine) {
    const bx = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
    const by = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      bx((e.clientX - (r.left + r.width / 2)) * 0.3);
      by((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    btn.addEventListener('mouseleave', () => { bx(0); by(0); });
  }
}

/* ─────────────────────────────────────────────────────────────
   NEBULA VIEW — immersive warp tunnel overlay.
   Gesture-stepped navigation: no native scroll in tunnel mode (no
   ScrollTrigger either — the overlay is hidden at init and global
   refreshes would fight its measurements). Wheel flicks / swipes /
   arrow keys request discrete warp jumps; a GSAP tween drives the
   virtual position between stops, so input jitter never reaches the
   cards. The .nv-stage is a full-viewport 3D stage whose .nv-items
   fly at the camera over a zoom-parallax 3D starfield canvas.
───────────────────────────────────────────────────────── */
function initNebulaView() {
  const overlay = document.getElementById('nebula-view');
  const openBtn = document.getElementById('nv-open');
  if (!overlay || !openBtn) return;

  const canvas = overlay.querySelector('.nv-canvas');
  const ctx = canvas.getContext('2d');
  const stage = overlay.querySelector('.nv-stage');
  const scrollEl = overlay.querySelector('.nv-scroll'); // scrolls only in .nv-static mode
  const loader = overlay.querySelector('.nv-loader');
  const closeBtn = overlay.querySelector('.nv-close');
  const items = [...overlay.querySelectorAll('.nv-item')];
  const hasGsap = typeof gsap !== 'undefined';
  const hoverFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isSmall = window.matchMedia('(max-width: 680px)').matches;

  let isOpen = false;
  let rafId = null;
  let seenOnce = false;
  let lastFocus = null;
  let vw = 0, vh = 1;
  const pos = { p: 0 };   // virtual position in sections — the only motion source
  let curIdx = 0;         // current stop index
  let acc = 0;            // wheel gesture accumulator
  let warpLock = 0;       // input swallowed until this timestamp (ms)
  let lastWheelT = 0;
  let touchY = null, touchLastY = null;
  let prevPx = 0;
  let vel = 0;            // px/frame — drives the star warp streaks
  const intro = { v: 0 }; // extra progress offset for the entry fly-in
  const mouse = { tx: 0, ty: 0, x: 0, y: 0 };

  if (PREFERS_REDUCED_MOTION) overlay.classList.add('nv-static');

  /* ── Canvas: pre-rendered cloud sprites + layered star field ── */
  function makeCloudSprite(r, g, b) {
    const size = 384;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const cc = c.getContext('2d');
    const grad = cc.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
    grad.addColorStop(0.4, `rgba(${r},${g},${b},0.35)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    cc.fillStyle = grad;
    cc.fillRect(0, 0, size, size);
    return c;
  }
  /* Cool-dominant nebula: deep space blues with coral as the minority accent */
  const sprites = [
    makeCloudSprite(60, 80, 170),   // deep indigo
    makeCloudSprite(35, 45, 110),   // cold violet-blue
    makeCloudSprite(90, 140, 200),  // cyan haze
    makeCloudSprite(217, 119, 87),  // coral accent
  ];
  /* Clouds orbit the screen center as you travel (ring placement) */
  const CLOUDS = (isSmall ? 4 : 7);
  const clouds = Array.from({ length: CLOUDS }, (_, i) => ({
    sprite: sprites[i % 4],
    ang: Math.random() * Math.PI * 2,   // position on the ring
    dist: 0.15 + Math.random() * 0.6,   // ring radius (fraction of focal)
    scale: 1.2 + Math.random() * 2,
    spin: 0.08 + Math.random() * 0.12,  // orbit per unit of travel
    drift: 0.015 + Math.random() * 0.035,
    depth: 0.2 + Math.random() * 0.5,
    alpha: 0.06 + Math.random() * 0.09,
  }));
  /* True 3D starfield: z shrinks as you scroll forward (zoom parallax) */
  const STARS = isSmall ? 380 : 900;
  const heroGlow = makeCloudSprite(200, 215, 255); // soft halo under hero stars
  const coreGlow = makeCloudSprite(217, 119, 87);  // velocity-reactive tunnel core
  const stars = Array.from({ length: STARS }, () => {
    const hero = Math.random() < 0.06;
    const cr = Math.random();
    return {
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: 0.06 + Math.random() * 1.0,
      r: hero ? 1.4 + Math.random() * 0.9 : 0.3 + Math.random() * 1.0,
      ts: 0.5 + Math.random() * 1.6,
      to: Math.random() * Math.PI * 2,
      sp: 0.6 + Math.random(), // differential depth speed
      col: cr < 0.12 ? '#E8A188' : cr < 0.4 ? '#BFD4FF' : '#FFFFFF',
      hero,
      px: null, py: null, // previous projected position (warp streaks)
    };
  });
  let meteors = [];
  let nextMeteor = 0;
  let burst = null;   // { born } — light-gate fired when crossing into a section
  let lastStop = 0;   // Math.round(P), tracked in loop()

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2);
    canvas.width = overlay.clientWidth * dpr;
    canvas.height = overlay.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawFrame(t) {
    const W = overlay.clientWidth, H = overlay.clientHeight;
    const cx = W / 2, cy = H / 2;
    const f = Math.min(W, H) * 0.5; // focal length for star projection
    const P = pos.p + intro.v;
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    ctx.clearRect(0, 0, W, H);

    for (const cl of clouds) {
      const a = cl.ang + P * cl.spin + t * cl.drift;
      const d = cl.dist * f * 1.6;
      const size = cl.scale * Math.min(W, H) * (0.7 + P * cl.depth * 0.02);
      const x = cx + Math.cos(a) * d + mouse.x * cl.depth * 50 - size / 2;
      const y = cy + Math.sin(a) * d * 0.7 + mouse.y * cl.depth * 36 - size / 2;
      ctx.globalAlpha = cl.alpha;
      ctx.drawImage(cl.sprite, x, y, size, size);
    }

    /* Light-gate burst (section crossings) + velocity core glow */
    let burstK = 0;
    if (burst) {
      const age = t - burst.born;
      if (age > 0.7) burst = null;
      else burstK = 1 - age / 0.7;
    }
    const coreA = Math.min(0.16, Math.abs(vel) * 0.0025) + burstK * 0.22;
    if (coreA > 0.005) {
      const cs = Math.min(W, H) * 0.95;
      ctx.globalAlpha = coreA;
      ctx.drawImage(coreGlow, cx - cs / 2, cy - cs / 2, cs, cs);
    }
    if (burst) {
      const k = 1 - Math.pow(1 - (t - burst.born) / 0.7, 3); // ease-out expansion
      const rr = k * Math.min(W, H) * 0.75;
      ctx.strokeStyle = '#E8A188';
      ctx.globalAlpha = burstK * 0.25;
      ctx.lineWidth = 14;
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = burstK * 0.6;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
    }

    const warping = Math.abs(vel) > 8;
    const roll = P * 0.06 + t * 0.004; // slow idle revolve, rolls with travel
    const rollC = Math.cos(roll), rollS = Math.sin(roll);
    for (const s of stars) {
      s.z -= (vel * 0.00045 + 0.00028 + burstK * 0.004) * s.sp;
      if (s.z < 0.06) { s.z += 1.06; s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.px = null; }
      else if (s.z > 1.12) { s.z -= 1.06; s.px = null; }
      const rx = s.x * rollC - s.y * rollS;
      const ry = s.x * rollS + s.y * rollC;
      const par = 1 - s.z; // nearer stars react more to the mouse
      const sx = cx + (rx / s.z) * f + mouse.x * 24 * par;
      const sy = cy + (ry / s.z) * f + mouse.y * 18 * par;
      if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) { s.px = sx; s.py = sy; continue; }
      const tw = 0.5 + 0.5 * Math.sin(t * s.ts + s.to);
      const size = Math.min(3, (s.r / s.z) * 0.9);
      ctx.globalAlpha = (0.25 + tw * 0.75) * Math.min(1, (1.15 - s.z) * 2.5);
      const col = s.col;
      if (warping && s.px !== null) {
        ctx.strokeStyle = col;
        ctx.lineWidth = Math.max(0.6, size * 0.8);
        ctx.beginPath();
        ctx.moveTo(s.px, s.py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      } else {
        if (s.hero) { // soft halo under the star, at a fraction of its alpha
          const g = size * 8;
          const keep = ctx.globalAlpha;
          ctx.globalAlpha = keep * 0.35;
          ctx.drawImage(heroGlow, sx - g / 2, sy - g / 2, g, g);
          ctx.globalAlpha = keep;
        }
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
        if (size > 1.4 && tw > 0.92) { // glint cross on the brightest
          ctx.globalAlpha = (tw - 0.92) * 6;
          ctx.fillRect(sx - size * 4, sy - 0.4, size * 8, 0.8);
          ctx.fillRect(sx - 0.4, sy - size * 4, 0.8, size * 8);
        }
      }
      s.px = sx; s.py = sy;
    }

    if (!PREFERS_REDUCED_MOTION) {
      if (t > nextMeteor) {
        const spawn = () => ({
          x: Math.random() * W * 0.7 + W * 0.15,
          y: Math.random() * H * 0.3,
          vx: 320 + Math.random() * 200,
          vy: 160 + Math.random() * 120,
          born: t,
        });
        meteors.push(spawn());
        if (Math.random() < 0.3) { // occasional twin, slightly delayed
          const twin = spawn();
          twin.born = t + 0.08;
          meteors.push(twin);
        }
        nextMeteor = t + 2.5 + Math.random() * 4;
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        const age = t - m.born;
        if (age > 0.7) { meteors.splice(i, 1); continue; }
        if (age < 0) continue;
        const mx = m.x + m.vx * age;
        const my = m.y + m.vy * age;
        const fade = 1 - age / 0.7;
        const grad = ctx.createLinearGradient(mx, my, mx - m.vx * 0.18, my - m.vy * 0.18);
        grad.addColorStop(0, `rgba(210,225,255,${0.9 * fade})`);
        grad.addColorStop(1, 'rgba(210,225,255,0)');
        ctx.globalAlpha = 1;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx - m.vx * 0.18, my - m.vy * 0.18);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ── The tunnel: cards fly straight at the camera for travel offset t ──
     t < 0: approaching from deep space · t = 0: front and center · t > 0:
     flying past the camera. A dwell plateau around t=0 slows the motion
     ~6x so each card hangs readably at center before whipping away. Each
     card drifts in from its own slight side offset, converging dead-ahead. */
  function tunnelPos(i, P) {
    const t = P - i;
    const td = t - Math.max(-0.28, Math.min(0.28, t)) * 0.85;
    const far = Math.min(Math.max(0, -td), 2) / 2; // 0 at center → 1 deep ahead
    return {
      td,
      x: Math.sin(i * 2.1) * vw * 0.09 * far,
      y: Math.cos(i * 1.3) * vh * 0.05 * far,
      z: Math.min(td < 0 ? td * 1500 : td * 1600, 1000),
    };
  }

  let railDots = [];
  let railActive = -1;
  function layoutItems() {
    if (PREFERS_REDUCED_MOTION || !vh) return;
    const P = pos.p + intro.v;
    items.forEach((item, i) => {
      const pos = tunnelPos(i, P);
      const td = pos.td;
      let o;
      if (td < -1.9) o = Math.max(0, (td + 2.6) / 0.7);
      else if (td > 0.35) o = Math.max(0, 1 - (td - 0.35) / 0.4);
      else o = 1;
      if (o <= 0.01) {
        item.style.visibility = 'hidden';
        item.style.pointerEvents = 'none';
        item.classList.remove('nv-front');
        return;
      }
      item.style.visibility = 'visible';
      item.style.opacity = o.toFixed(3);
      item.style.zIndex = String(2000 + Math.round(td * 100));
      item.style.pointerEvents = Math.abs(td) < 0.6 ? 'auto' : 'none';
      item.classList.toggle('nv-front', Math.abs(td) < 0.12);
      item.style.transform =
        `translate(-50%, -50%) translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, ${pos.z.toFixed(1)}px)`;
    });
    /* Progress rail: light the dot for the nearest stop */
    const active = Math.max(0, Math.min(items.length - 1, Math.round(P)));
    if (active !== railActive && railDots.length) {
      if (railDots[railActive]) railDots[railActive].classList.remove('on');
      railDots[active].classList.add('on');
      railActive = active;
    }
  }

  function loop(now) {
    const t = now / 1000;
    const px = pos.p * vh; // velocity in px/frame keeps the canvas effect scales
    vel = px - prevPx;
    prevPx = px;
    /* Fire the light-gate when the nearest stop changes (not during the intro) */
    const stop = Math.round(pos.p + intro.v);
    if (stop !== lastStop) {
      if (intro.v === 0) burst = { born: t };
      lastStop = stop;
    }
    drawFrame(t);
    /* Camera parallax: the whole tunnel leans with the (smoothed) mouse */
    if (stage) stage.style.perspectiveOrigin =
      (50 + mouse.x * 4).toFixed(2) + '% ' + (50 + mouse.y * 3).toFixed(2) + '%';
    layoutItems();
    rafId = requestAnimationFrame(loop);
  }

  /* ── Build dynamic items once (projects from PROJECTS[], chips cloned) ── */
  function buildItems() {
    if (overlay.dataset.built) return;
    overlay.dataset.built = '1';

    if (typeof PROJECTS !== 'undefined') {
      overlay.querySelectorAll('.nv-item-project').forEach(item => {
        const p = PROJECTS[parseInt(item.dataset.project, 10) || 0];
        const holder = item.querySelector('.nv-item-card');
        if (!p || !holder) return;
        holder.classList.add('nv-card');
        applyAccent(holder, p);
        const tags = (typeof tagHTML === 'function')
          ? p.tags.map(tagHTML).join('')
          : p.tags.map(tg => `<span class="tag">${tg}</span>`).join('');
        holder.innerHTML =
          `<span class="nv-card-counter">${p.counter}</span>` +
          `<h4 class="nv-card-name">${p.name}</h4>` +
          `<p class="nv-card-desc">${p.desc}</p>` +
          `<div class="nv-card-tags">${tags}</div>`;
      });
    }

    /* Toolkit constellation: 4 featured "core" tools with brand glows in a
       center row, every other chip drifting around them as a star cloud.
       Both tiers start scattered and assemble when the item hits .nv-front. */
    const constellation = overlay.querySelector('.nv-constellation');
    if (constellation) {
      const CORE_TOOLS = {
        'Make.com':    { glow: '#6D5EF6', role: 'Automation' },
        'Voiceflow':   { glow: '#3D82E2', role: 'AI Agents' },
        'Claude Code': { glow: '#D97757', role: 'AI Coding' },
        'Vercel':      { glow: '#FFFFFF', role: 'Deployment' },
      };
      const core = document.createElement('div');
      core.className = 'nv-core';
      const cloud = document.createElement('div');
      cloud.className = 'nv-cloud';
      const scatter = (el, delayMs) => {
        const sign = () => (Math.random() < 0.5 ? -1 : 1);
        el.style.setProperty('--sx', (sign() * (60 + Math.random() * 80)).toFixed(0) + 'px');
        el.style.setProperty('--sy', (sign() * (40 + Math.random() * 60)).toFixed(0) + 'px');
        el.style.setProperty('--sr', (sign() * (14 + Math.random() * 12)).toFixed(0) + 'deg');
        el.style.setProperty('--sd', delayMs + 'ms');
      };
      let coreCount = 0, cloudCount = 0;
      document.querySelectorAll('.toolkit-bubbles .skill-bubble').forEach(b => {
        const toolName = b.textContent.trim();
        const featured = CORE_TOOLS[toolName];
        if (featured) {
          const tool = document.createElement('div');
          tool.className = 'nv-core-tool';
          tool.style.setProperty('--glow', featured.glow);
          const ico = b.querySelector('.skill-ico');
          if (ico) tool.appendChild(ico.cloneNode(true));
          const nameEl = document.createElement('span');
          nameEl.className = 'nv-core-name';
          nameEl.textContent = toolName;
          const roleEl = document.createElement('span');
          roleEl.className = 'nv-core-role';
          roleEl.textContent = featured.role;
          tool.append(nameEl, roleEl);
          scatter(tool, coreCount * 90);
          core.appendChild(tool);
          coreCount++;
          return;
        }
        const chip = document.createElement('span');
        chip.className = 'nv-chip';
        chip.style.setProperty('--fx', (Math.random() * 28 - 14).toFixed(1) + 'px');
        chip.style.setProperty('--fy', (-8 - Math.random() * 14).toFixed(1) + 'px');
        chip.style.setProperty('--fdur', (4.5 + Math.random() * 4).toFixed(1) + 's');
        chip.style.setProperty('--fdelay', (-Math.random() * 4).toFixed(1) + 's');
        const inner = document.createElement('span');
        inner.className = 'nv-chip-in';
        scatter(inner, 320 + cloudCount * 35);
        const clone = b.cloneNode(true);
        clone.classList.add('visible');   // main-page reveal state must not leak in
        clone.style.transition = '';       // nor its inline stagger transition
        inner.appendChild(clone);
        chip.appendChild(inner);
        cloud.appendChild(chip);
        cloudCount++;
      });
      constellation.append(core, cloud);
    }

    /* Wrap the big name's letters for the hover scatter */
    const name = overlay.querySelector('.nv-name');
    if (name) {
      name.innerHTML = name.textContent.split('')
        .map(ch => `<span class="nv-letter">${ch}</span>`).join('');
    }

    /* Progress rail: one clickable dot per stop (labels are aria-only) */
    const rail = document.createElement('div');
    rail.className = 'nv-rail';
    rail.setAttribute('aria-label', 'Sections');
    railDots = items.map((item, i) => {
      let label = 'Section ' + (i + 1);
      if (item.classList.contains('nv-item-name')) label = 'Alen';
      else if (item.classList.contains('nv-item-about')) label = 'About';
      else if (item.classList.contains('nv-item-toolkit')) label = 'Toolkit';
      else if (item.classList.contains('nv-item-certs')) label = 'Certifications';
      else if (item.classList.contains('nv-item-contact')) label = 'Contact';
      else if (item.classList.contains('nv-item-project') && typeof PROJECTS !== 'undefined') {
        const p = PROJECTS[parseInt(item.dataset.project, 10) || 0];
        if (p) { // PROJECTS[].name may contain HTML; aria-labels need plain text
          const tmp = document.createElement('div');
          tmp.innerHTML = p.name;
          label = tmp.textContent.trim();
        }
      }
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'nv-rail-dot';
      dot.setAttribute('aria-label', label);
      dot.addEventListener('click', () => warpTo(i));
      rail.appendChild(dot);
      return dot;
    });
    overlay.appendChild(rail);

    setupHover();
  }

  /* ── Hover micro-interactions (pointer devices only) ── */
  function makeMagnetic(el, strength = 0.3) {
    if (!hasGsap || !hoverFine || PREFERS_REDUCED_MOTION) return;
    const qx = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      qx((e.clientX - (r.left + r.width / 2)) * strength);
      qy((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('mouseleave', () => { qx(0); qy(0); });
  }

  function makeTilt(el, max = 8) {
    if (!hasGsap || !hoverFine || PREFERS_REDUCED_MOTION) return;
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power2.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power2.out' });
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * max * 2);
      rx(-((e.clientY - r.top) / r.height - 0.5) * max * 2);
    });
    el.addEventListener('mouseleave', () => { rx(0); ry(0); });
  }

  function setupHover() {
    if (!hasGsap || !hoverFine || PREFERS_REDUCED_MOTION) return;
    overlay.querySelectorAll('.nv-card, .nv-cert').forEach(el => makeTilt(el));
    overlay.querySelectorAll('.nv-cta, .nv-close').forEach(el => makeMagnetic(el));

    /* ALEN letters scatter away from the cursor, spring back on leave */
    const name = overlay.querySelector('.nv-name');
    const letters = [...overlay.querySelectorAll('.nv-letter')];
    if (name && letters.length) {
      const setters = letters.map(l => ({
        x: gsap.quickTo(l, 'x', { duration: 0.4, ease: 'power3' }),
        y: gsap.quickTo(l, 'y', { duration: 0.4, ease: 'power3' }),
        el: l,
      }));
      name.addEventListener('mousemove', e => {
        setters.forEach(s => {
          const r = s.el.getBoundingClientRect();
          const dx = r.left + r.width / 2 - e.clientX;
          const dy = r.top + r.height / 2 - e.clientY;
          const d = Math.hypot(dx, dy);
          if (d < 120 && d > 0) {
            const f = ((120 - d) / 120) * 18;
            s.x((dx / d) * f);
            s.y((dy / d) * f);
            s.el.classList.add('flare');
          } else {
            s.x(0); s.y(0);
            s.el.classList.remove('flare');
          }
        });
      });
      name.addEventListener('mouseleave', () => {
        setters.forEach(s => { s.x(0); s.y(0); s.el.classList.remove('flare'); });
      });
    }
  }

  /* ── Loading bar → reveal ── */
  function runLoader(onDone) {
    if (!hasGsap || PREFERS_REDUCED_MOTION) {
      loader.style.display = 'none';
      onDone();
      return;
    }
    loader.style.display = '';
    loader.style.opacity = '1';
    loader.style.pointerEvents = 'auto';
    const fill = loader.querySelector('.nv-loader-fill');
    const pct = loader.querySelector('.nv-loader-pct');
    const state = { v: 0 };
    gsap.set(fill, { scaleX: 0 });
    const dur = seenOnce ? 0.7 : 1.4;
    gsap.to(state, {
      v: 100,
      duration: dur,
      ease: 'steps(14)',
      onUpdate: () => {
        gsap.set(fill, { scaleX: state.v / 100 });
        if (pct) pct.textContent = Math.round(state.v) + '%';
      },
      onComplete: () => {
        gsap.to(loader, {
          opacity: 0,
          duration: 0.45,
          ease: 'power2.inOut',
          onComplete: () => {
            loader.style.pointerEvents = 'none';
            loader.style.display = 'none';
          },
        });
        onDone();
      },
    });
    gsap.to(fill, { opacity: 0.75, duration: 0.07, repeat: 15, yoyo: true, ease: 'none' });
    seenOnce = true;
  }

  function reveal() {
    scrollEl.scrollTop = 0;
    pos.p = 0; curIdx = 0; acc = 0; prevPx = 0;
    warpLock = performance.now() + 1400; // no jumping mid-intro
    if (hasGsap && !PREFERS_REDUCED_MOTION) {
      /* The name card itself flies in from deep space on entry */
      intro.v = -1.6;
      gsap.to(intro, { v: 0, duration: 1.2, ease: 'power3.out', onUpdate: layoutItems });
    } else {
      intro.v = 0;
      layoutItems();
    }
  }

  /* ── Measurement + listeners bound only while open ── */
  function measure() {
    vw = overlay.clientWidth;
    vh = overlay.clientHeight || 1;
  }

  /* ── Gesture-stepped navigation: input never drives position directly ──
     A wheel flick / swipe / arrow key requests one discrete warp jump;
     warpTo tweens the virtual position, so erratic deltas from a buggy
     wheel cannot jitter the tunnel and every journey docks dead-center
     on a card. warpLock swallows inertia tails and repeat events. */
  function warpTo(idx) {
    idx = Math.max(0, Math.min(items.length - 1, idx));
    if (idx === curIdx && pos.p === idx) return;
    curIdx = idx;
    const dist = Math.abs(pos.p - idx);
    const dur = Math.min(0.9 + 0.25 * dist, 1.8); // rail jumps fly farther, a bit longer
    warpLock = performance.now() + dur * 850 + 120;
    if (hasGsap && !PREFERS_REDUCED_MOTION) {
      gsap.killTweensOf(pos);
      gsap.to(pos, { p: idx, duration: dur, ease: 'power2.inOut', onUpdate: layoutItems });
    } else {
      pos.p = idx;
      layoutItems();
    }
  }
  function onWheel(e) {
    if (overlay.classList.contains('nv-static')) return; // native column scroll
    e.preventDefault();
    const now = performance.now();
    if (now < warpLock) return;
    if (now - lastWheelT > 200) acc = 0; // stale gesture, restart accumulator
    lastWheelT = now;
    acc += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * vh : e.deltaY;
    if (Math.abs(acc) > 60) {
      warpTo(curIdx + Math.sign(acc));
      acc = 0;
    }
  }
  function onTouchStart(e) {
    touchY = touchLastY = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (overlay.classList.contains('nv-static')) return;
    e.preventDefault();
    touchLastY = e.touches[0].clientY;
  }
  function onTouchEnd() {
    if (touchY === null || overlay.classList.contains('nv-static')) { touchY = null; return; }
    const dy = touchY - touchLastY; // positive = swiped up = travel forward
    touchY = null;
    if (Math.abs(dy) > 50 && performance.now() >= warpLock) warpTo(curIdx + Math.sign(dy));
  }
  function onMouse(e) {
    mouse.tx = (e.clientX / overlay.clientWidth) * 2 - 1;
    mouse.ty = (e.clientY / overlay.clientHeight) * 2 - 1;
  }
  function onResize() {
    sizeCanvas();
    measure();
    layoutItems();
  }
  function onKeydown(e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { close(); return; }
    if (!overlay.classList.contains('nv-static')) {
      const step =
        (e.key === 'ArrowDown' || e.key === 'PageDown') ? 1 :
        (e.key === 'ArrowUp' || e.key === 'PageUp') ? -1 : 0;
      if (step) {
        e.preventDefault();
        if (performance.now() >= warpLock) warpTo(curIdx + step);
        return;
      }
      if (e.key === 'Home') { e.preventDefault(); warpTo(0); return; }
      if (e.key === 'End') { e.preventDefault(); warpTo(items.length - 1); return; }
    }
    if (e.key === 'Tab') { // minimal focus trap: the overlay covers the whole app
      const focusables = [...overlay.querySelectorAll('button, a[href], [tabindex="0"]')]
        .filter(el => el.offsetParent !== null || el === scrollEl);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    buildItems();
    lastFocus = document.activeElement;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('nv-open');
    sizeCanvas();
    measure();
    scrollEl.scrollTop = 0; // static-mode column starts at the top
    pos.p = 0; curIdx = 0; acc = 0; prevPx = 0;
    layoutItems();

    overlay.addEventListener('wheel', onWheel, { passive: false });
    overlay.addEventListener('touchstart', onTouchStart, { passive: true });
    overlay.addEventListener('touchmove', onTouchMove, { passive: false });
    overlay.addEventListener('touchend', onTouchEnd);
    window.addEventListener('resize', onResize);
    if (hoverFine) overlay.addEventListener('mousemove', onMouse);
    document.addEventListener('keydown', onKeydown);

    if (PREFERS_REDUCED_MOTION) {
      drawFrame(0); // one static paint, no loop
    } else if (rafId === null) {
      rafId = requestAnimationFrame(loop);
    }
    runLoader(reveal);
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nv-open');
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    if (hasGsap) gsap.killTweensOf(pos);
    overlay.removeEventListener('wheel', onWheel);
    overlay.removeEventListener('touchstart', onTouchStart);
    overlay.removeEventListener('touchmove', onTouchMove);
    overlay.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('resize', onResize);
    overlay.removeEventListener('mousemove', onMouse);
    document.removeEventListener('keydown', onKeydown);
    if (lastFocus) lastFocus.focus();
  }

  openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  makeMagnetic(openBtn, 0.25);
}
