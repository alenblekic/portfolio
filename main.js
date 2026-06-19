/* ============================================================
   ALEN BLEKIC PORTFOLIO — main.js
   Three.js hero + GSAP scroll animations + interactions
   ============================================================ */

'use strict';

/* ── GSAP Plugin Registration ─────────────────────────────── */
gsap.registerPlugin(ScrollTrigger);

/* ── Utility: wait for DOM ────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initClock();
  initCtaPulse();
  initCtaPulse('clock-card', 'clock-canvas');
  initThreeHero();
  initHeroAnimation();
  initScrollAnimations();
  initProjectsScroll();
  initCaseStudyModal();
  initSectionHeaderLines();
  initAboutSlideshow();
  initMobileNav();
  initPipelineAnimation();
  initAuditMockup();
  initGlobe();
  initSwedenParticles();
  initToolkitParticles();
  initAlenSignature();
  initSectionFlash();
  initRainGrid();
  initSaturn();
  initSwedenRipple();
  initCertTilt();
});

/* ─────────────────────────────────────────────────────────────
   PERF: run an animation loop only while its target is on-screen.
   Invisible on desktop (only pauses when scrolled away); big
   CPU/battery savings on mobile where many canvases stack up.
───────────────────────────────────────────────────────── */
function animateWhenVisible(target, frame) {
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
   THREE.JS HERO
───────────────────────────────────────────────────────── */
function initThreeHero() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const isMobile = window.innerWidth < 768;

  /* Scene */
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  /* Main wireframe icosahedron */
  const geoIco    = new THREE.IcosahedronGeometry(1.4, 1);
  const matWire   = new THREE.MeshBasicMaterial({
    color: 0xD97757,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
  });
  const ico = new THREE.Mesh(geoIco, matWire);
  scene.add(ico);

  /* Inner solid icosahedron for depth */
  const geoInner  = new THREE.IcosahedronGeometry(0.85, 0);
  const matInner  = new THREE.MeshBasicMaterial({
    color: 0xB85C3E,
    wireframe: true,
    transparent: true,
    opacity: 0.25,
  });
  const inner = new THREE.Mesh(geoInner, matInner);
  scene.add(inner);

  /* Extra nested wireframe shell (mid layer) */
  const geoMid = new THREE.IcosahedronGeometry(1.12, 1);
  const matMid = new THREE.MeshBasicMaterial({
    color: 0xE8957A, wireframe: true, transparent: true, opacity: 0.18,
  });
  const mid = new THREE.Mesh(geoMid, matMid);
  scene.add(mid);

  /* Bright additive core */
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xFFB599, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false })
  );
  scene.add(core);

  /* Breathing particle shell hugging the sphere (fibonacci distribution) */
  const SHELL = isMobile ? 400 : 1600;
  const shellPos   = new Float32Array(SHELL * 3);
  const shellDir   = [];
  const shellPhase = new Float32Array(SHELL);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < SHELL; i++) {
    const y   = 1 - (i / (SHELL - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th  = golden * i;
    const dir = new THREE.Vector3(Math.cos(th) * rad, y, Math.sin(th) * rad);
    shellDir.push(dir);
    shellPhase[i] = Math.random() * Math.PI * 2;
    shellPos[i*3] = dir.x * 1.55; shellPos[i*3+1] = dir.y * 1.55; shellPos[i*3+2] = dir.z * 1.55;
  }
  const shellGeo = new THREE.BufferGeometry();
  shellGeo.setAttribute('position', new THREE.BufferAttribute(shellPos, 3));
  const shellMat = new THREE.PointsMaterial({
    color: 0xFFB599, size: 0.03, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const shell = new THREE.Points(shellGeo, shellMat);
  scene.add(shell);

  /* Background star/dust field (denser) */
  const FIELD = isMobile ? 140 : 650;
  const posArr = new Float32Array(FIELD * 3);
  for (let i = 0; i < FIELD; i++) {
    posArr[i * 3]     = (Math.random() - 0.5) * 22;
    posArr[i * 3 + 1] = (Math.random() - 0.5) * 22;
    posArr[i * 3 + 2] = (Math.random() - 0.5) * 14;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xD97757, size: 0.055, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  /* Orbiting particle rings at different tilts */
  function makeRing(count, radius, tilt, color, size) {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      arr[i*3]   = Math.cos(a) * radius;
      arr[i*3+1] = (Math.random() - 0.5) * 0.08;
      arr[i*3+2] = Math.sin(a) * radius;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const m = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false });
    const grp = new THREE.Group();
    grp.add(new THREE.Points(g, m));
    grp.rotation.x = tilt;
    scene.add(grp);
    return grp;
  }
  const ring1 = makeRing(isMobile ? 140 : 320, 2.05, 1.15, 0xD97757, 0.03);
  const ring2 = makeRing(isMobile ? 100 : 240, 2.5,  -0.6, 0xE8957A, 0.026);

  /* Subtle ambient glow sphere */
  const glowGeo = new THREE.SphereGeometry(2, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x2E1810, transparent: true, opacity: 0.18,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  scene.add(glow);

  /* Mouse tracking */
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  if (!isMobile) {
    window.addEventListener('mousemove', e => {
      targetX = (e.clientX / window.innerWidth  - 0.5) * 1.4;
      targetY = (e.clientY / window.innerHeight - 0.5) * 1.0;
    });
  }

  /* Resize */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* Animate */
  const clock3 = new THREE.Clock();
  function animate() {
    const t = clock3.getElapsedTime();

    currentX += (targetX - currentX) * 0.05;
    currentY += (targetY - currentY) * 0.05;

    /* Nested shells rotating against each other + mouse parallax */
    ico.rotation.x = t * 0.18 + currentY * 0.6;
    ico.rotation.y = t * 0.22 + currentX * 0.6;
    mid.rotation.x = t * 0.26 + currentY * 0.5;
    mid.rotation.y = -t * 0.20 + currentX * 0.5;
    inner.rotation.x = -t * 0.14 + currentY * 0.4;
    inner.rotation.y = -t * 0.17 + currentX * 0.4;

    /* Breathing particle shell */
    const sp = shellGeo.attributes.position.array;
    const breath = 1 + Math.sin(t * 0.8) * 0.05;
    for (let i = 0; i < SHELL; i++) {
      const d = shellDir[i];
      const r = (1.5 + Math.sin(t * 1.6 + shellPhase[i]) * 0.08) * breath;
      sp[i*3] = d.x * r; sp[i*3+1] = d.y * r; sp[i*3+2] = d.z * r;
    }
    shellGeo.attributes.position.needsUpdate = true;
    shell.rotation.y = t * 0.06 + currentX * 0.5;
    shell.rotation.x = currentY * 0.5;
    shellMat.opacity = 0.7 + Math.sin(t * 1.1) * 0.18;

    /* Pulsing core */
    const pulse = 1 + Math.sin(t * 2.2) * 0.18;
    core.scale.setScalar(pulse);
    core.material.opacity = 0.22 + Math.sin(t * 2.2) * 0.12;

    /* Orbiting rings */
    ring1.rotation.z = t * 0.32;
    ring1.rotation.y = t * 0.1 + currentX * 0.3;
    ring2.rotation.z = -t * 0.24;
    ring2.rotation.y = -t * 0.08 + currentX * 0.3;

    /* Twinkling field */
    particles.rotation.y = t * 0.04 + currentX * 0.2;
    particles.rotation.x = Math.sin(t * 0.1) * 0.1 + currentY * 0.2;
    particleMat.opacity = 0.4 + Math.sin(t * 1.3) * 0.2;

    renderer.render(scene, camera);
  }
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
  let i = 0;

  function type() {
    if (i < NAME.length) {
      typeTarget.textContent += NAME[i];
      i++;
      setTimeout(type, 130);
    } else {
      // Blink briefly then fade cursor out
      setTimeout(() => {
        gsap.to(cursorBlink, { opacity: 0, duration: 0.5, ease: 'power2.out' });
        // Reveal remaining hero elements
        gsap.to(subtitle, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 });
        gsap.to(location, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.35 });
        gsap.to(cta,      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.55 });
      }, 800);
    }
  }

  setTimeout(type, 600);
}

/* ─────────────────────────────────────────────────────────────
   GSAP SCROLL ANIMATIONS
───────────────────────────────────────────────────────── */
function initScrollAnimations() {

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
  },
  {
    counter: '02 / 04',
    name: 'Voiceflow Lead Capture &amp; Automation Agent',
    desc: 'Full conversational AI agent that captures structured lead data and triggers multi-step workflows via Make.com API integration. Built conditional logic for data validation, email capture, and automated follow-up processes.',
    tags: ['Voiceflow', 'Make.com'],
  },
  {
    counter: '03 / 04',
    name: 'AI Customer Support Automation Agent',
    desc: 'AI customer support workflow agent handling user queries, delivering contextual responses, and triggering backend automation via Make.com. Implemented conditional refund workflow with data routing into Airtable for ticket processing.',
    tags: ['Voiceflow', 'Make.com', 'Airtable'],
  },
  {
    counter: '04 / 04',
    name: 'AI Product Recommendation Agent <span style="font-size:0.8em;opacity:0.7">(Perfume Brand)</span>',
    desc: 'Intent-based product recommendation logic with category recognition (e.g. "club", "date night") to dynamically suggest relevant products. API-based email capture and automated data routing via Make.com; structured support intake routed into Airtable.',
    tags: ['Voiceflow', 'Make.com', 'Airtable'],
  },
];

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

function initProjectsScroll() {
  if (window.innerWidth < 960) return; // sticky only on desktop

  const blocks    = document.querySelectorAll('.project-visual-block');
  const infoEl    = document.getElementById('project-info');
  const counterEl = document.getElementById('project-counter');
  const nameEl    = document.getElementById('project-name');
  const descEl    = document.getElementById('project-desc');
  const tagsEl    = document.getElementById('project-tags');
  const linkEl    = document.getElementById('project-link');
  const csEl      = document.getElementById('project-casestudy');
  const railFill  = document.getElementById('proj-rail-fill');
  const railNodes = Array.from(document.querySelectorAll('.proj-rail-node'));

  if (!blocks.length || !infoEl) return;

  let activeIndex = 0;

  function updateNodes(index) {
    railNodes.forEach((n, i) => {
      n.classList.toggle('active', i <= index);
      n.classList.toggle('current', i === index);
    });
  }
  updateNodes(0);

  // Glowing fill + comet head glide along the scroll. `scrub: 1` adds ~1s of
  // smoothing so the fill eases in/out and slides to catch up rather than
  // tracking the scroll position instantly.
  const scrollEl = document.querySelector('.projects-scroll');
  if (railFill && scrollEl) {
    gsap.fromTo(railFill,
      { height: '0%' },
      {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: scrollEl,
          start: 'top center',
          end: 'bottom center',
          scrub: 1,
        },
      }
    );
  }

  function applyLink(p) {
    if (linkEl) {
      if (p.link) {
        linkEl.href = p.link;
        linkEl.style.display = 'inline-flex';
      } else {
        linkEl.removeAttribute('href');
        linkEl.style.display = 'none';
      }
    }
    if (csEl) csEl.style.display = p.caseStudy ? 'inline-flex' : 'none';
  }

  function updateInfo(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    const p = PROJECTS[index];

    gsap.to(infoEl, {
      opacity: 0, y: 12, duration: 0.25, ease: 'power2.in',
      onComplete: () => {
        counterEl.textContent = p.counter;
        nameEl.innerHTML      = p.name;
        descEl.textContent    = p.desc;
        tagsEl.innerHTML      = p.tags.map(tagHTML).join('');
        applyLink(p);
        updateNodes(index);
        gsap.to(infoEl, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' });
      }
    });
  }

  blocks.forEach((block, i) => {
    ScrollTrigger.create({
      trigger: block,
      start: 'top center',
      end: 'bottom center',
      onEnter:     () => updateInfo(i),
      onEnterBack: () => updateInfo(i),
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   CASE STUDY MODAL (Auditly Pro deep-dive)
───────────────────────────────────────────────────────── */
function initCaseStudyModal() {
  const modal = document.getElementById('cs-modal');
  const openBtn = document.getElementById('project-casestudy');
  if (!modal || !openBtn) return;

  const scrollEl = modal.querySelector('.cs-scroll');
  let lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cs-open');
    if (scrollEl) scrollEl.scrollTop = 0;
    const closeBtn = modal.querySelector('.cs-close');
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cs-open');
    if (lastFocus) lastFocus.focus();
  }

  openBtn.addEventListener('click', open);
  modal.querySelectorAll('[data-cs-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
}

/* ─────────────────────────────────────────────────────────────
   PIPELINE NODE ANIMATION (cycling active state)
───────────────────────────────────────────────────────── */
function initPipelineAnimation() {
  document.querySelectorAll('.pipeline-flow').forEach(flow => {
    const nodes = flow.querySelectorAll('.pipeline-node');
    if (!nodes.length) return;

    let current = 0;
    setInterval(() => {
      nodes.forEach(n => n.classList.remove('active'));
      current = (current + 1) % nodes.length;
      nodes[current].classList.add('active');
    }, 900);
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

  const stages = Array.from(mockup.querySelectorAll('.audit-stage'));
  const scoresWrap = mockup.querySelector('.audit-scores');
  const bars = Array.from(mockup.querySelectorAll('.audit-score-fill'));
  const runBtn = mockup.querySelector('.audit-run');
  if (!stages.length || !scoresWrap) return;

  let timers = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const after = (ms, fn) => timers.push(setTimeout(fn, ms));

  function reset() {
    stages.forEach(s => s.classList.remove('active', 'done'));
    scoresWrap.classList.remove('show');
    bars.forEach(b => { b.style.width = '0%'; });
    if (runBtn) runBtn.classList.remove('running');
  }

  function runCycle() {
    reset();
    if (runBtn) runBtn.classList.add('running');

    let t = 500;
    stages.forEach((stage, i) => {
      after(t, () => {
        stages.forEach(s => s.classList.remove('active'));
        stage.classList.add('active');
      });
      after(t + 850, () => {
        stage.classList.remove('active');
        stage.classList.add('done');
      });
      t += 1000;
    });

    // Reveal + fill score bars after all stages complete
    after(t + 200, () => {
      if (runBtn) runBtn.classList.remove('running');
      scoresWrap.classList.add('show');
      bars.forEach((b, i) => {
        after(i * 220, () => { b.style.width = (b.dataset.score || 0) + '%'; });
      });
    });

    // Hold the finished report, then loop
    after(t + 4200, runCycle);
  }

  runCycle();
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

  svg.style.cursor = 'crosshair';

  svg.addEventListener('click', e => {
    /* Convert screen coords → SVG viewBox coords */
    const pt  = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    /* Spawn 3 rings with staggered delays */
    [0, 180, 360].forEach(delay => {
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

function initSwedenParticles() {
  const wrap = document.querySelector('.sweden-map-wrap');
  const svgEl = document.querySelector('.sweden-svg');
  if (!wrap || !svgEl) return;

  /* Create canvas overlay on top of the SVG */
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
  wrap.style.position = 'relative';
  wrap.appendChild(canvas);

  const PARTICLE_COUNT = 14;
  const RED = 'rgba(217,119,87,';

  /* Each particle travels vertically within the map bounds */
  function makeParticle(w, h) {
    const x = w * (0.08 + Math.random() * 0.84);
    const goingUp = Math.random() < 0.5;
    return {
      x,
      y: goingUp ? h * (0.3 + Math.random() * 0.65) : h * (0.05 + Math.random() * 0.35),
      vy: goingUp ? -(0.06 + Math.random() * 0.14) : (0.06 + Math.random() * 0.14),
      size: 0.9 + Math.random() * 1.2,
      alpha: 0.15 + Math.random() * 0.55,
      alphaDir: Math.random() < 0.5 ? 1 : -1,
    };
  }

  let particles = [];
  let raf;
  let w = 0, h = 0;

  function resize() {
    const rect = svgEl.getBoundingClientRect();
    w = rect.width  || wrap.offsetWidth;
    h = rect.height || wrap.offsetHeight;
    canvas.width  = w;
    canvas.height = h;
    if (!particles.length) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = makeParticle(w, h);
        p.y = Math.random() * h; // scatter initially
        particles.push(p);
      }
    }
  }

  function draw() {
    if (!w || !h) { resize(); return; }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.y += p.vy;
      p.alpha += p.alphaDir * 0.008;
      if (p.alpha > 0.75) { p.alpha = 0.75; p.alphaDir = -1; }
      if (p.alpha < 0.05) { p.alpha = 0.05; p.alphaDir =  1; }

      /* Reset when particle exits top or bottom */
      if (p.vy < 0 && p.y < -4)  { Object.assign(p, makeParticle(w, h)); p.vy = -(0.06 + Math.random() * 0.14); p.y = h + 2; }
      if (p.vy > 0 && p.y > h+4) { Object.assign(p, makeParticle(w, h)); p.vy =   0.06 + Math.random() * 0.14;  p.y = -2; }

      /* Draw glowing dot */
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
      grad.addColorStop(0,   RED + p.alpha + ')');
      grad.addColorStop(0.5, RED + (p.alpha * 0.4) + ')');
      grad.addColorStop(1,   RED + '0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  /* Use ResizeObserver to handle the SVG sizing correctly */
  const ro = new ResizeObserver(() => resize());
  ro.observe(wrap);
  resize();
  animateWhenVisible(wrap, draw);
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
   TOOLKIT CIRCLE PARTICLES
───────────────────────────────────────────────────────── */
function initToolkitParticles() {
  const circle = document.querySelector('.toolkit-circle');
  if (!circle) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;border-radius:50%;z-index:0;';
  circle.style.position = 'relative';
  circle.appendChild(canvas);

  const PARTICLE_COUNT = 18;
  const RED = 'rgba(217,119,87,';
  let w = 0, h = 0, cx = 0, cy = 0, rad = 0;
  let particles = [];

  function makeParticle() {
    // Random angle for x position, drift vertically
    const angle = Math.random() * Math.PI * 2;
    const dist  = Math.random() * rad * 0.88;
    const goUp  = Math.random() < 0.5;
    return {
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vy: goUp ? -(0.05 + Math.random() * 0.12) : (0.05 + Math.random() * 0.12),
      size: 1.0 + Math.random() * 1.4,
      alpha: 0.1 + Math.random() * 0.5,
      alphaDir: Math.random() < 0.5 ? 1 : -1,
    };
  }

  function resize() {
    const rect = circle.getBoundingClientRect();
    w = rect.width  || circle.offsetWidth;
    h = rect.height || circle.offsetHeight;
    canvas.width  = w;
    canvas.height = h;
    cx  = w / 2;
    cy  = h / 2;
    rad = Math.min(w, h) / 2;
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(makeParticle());
    }
  }

  function inCircle(x, y) {
    const dx = x - cx, dy = y - cy;
    return dx * dx + dy * dy <= rad * rad * 0.92;
  }

  function draw() {
    if (!w) { resize(); return; }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 0.96, 0, Math.PI * 2);
    ctx.clip();

    for (const p of particles) {
      p.y += p.vy;
      p.alpha += p.alphaDir * 0.006;
      if (p.alpha > 0.65) { p.alpha = 0.65; p.alphaDir = -1; }
      if (p.alpha < 0.04) { p.alpha = 0.04; p.alphaDir =  1; }

      // Reset particle when it exits the circle vertically
      if (!inCircle(p.x, p.y)) {
        const np = makeParticle();
        // Spawn at bottom if going up, top if going down
        np.y  = p.vy < 0 ? cy + rad * 0.85 : cy - rad * 0.85;
        Object.assign(p, np);
      }

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.8);
      grad.addColorStop(0,   RED + p.alpha + ')');
      grad.addColorStop(0.5, RED + (p.alpha * 0.35) + ')');
      grad.addColorStop(1,   RED + '0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.restore();
  }

  new ResizeObserver(() => resize()).observe(circle);
  resize();
  animateWhenVisible(circle, draw);
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

  const SIZE = 500;
  canvas.width  = SIZE;
  canvas.height = SIZE;
  canvas.style.width  = SIZE + 'px';
  canvas.style.height = SIZE + 'px';

  const CX = SIZE / 2, CY = SIZE / 2 + 55, R = 88;
  const TILT = 0.36; /* ring y-compression — viewing angle ~21° */

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

    /* 6. Constant atmosphere glow (no hover change) */
    const glow = ctx.createRadialGradient(CX, CY, R - 2, CX, CY, R + 32);
    glow.addColorStop(0,   'rgba(215,188,130,0.11)');
    glow.addColorStop(0.4, 'rgba(160,128,72,0.05)');
    glow.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(CX, CY, R + 32, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();
  }

  let raf;
  function loop() {
    t      += 0.016;
    hoverP += hovered ? (1 - hoverP) * 0.06 : (0 - hoverP) * 0.04;
    offset += 0.12 + hoverP * 3.5;

    ctx.clearRect(0, 0, SIZE, SIZE);
    drawSectionStarfield(t * 60);

    /* render order: nebulae → bg stars → ring stars →
       back rings → globe → front rings → fg stars (pierce everything) */
    drawNebulae();
    drawStars(bgStars,   t * 60);
    drawStars(ringStars, t * 60);
    drawRingsHalf(Math.PI, Math.PI * 2); /* back half — above globe */
    drawGlobe();
    drawRingsHalf(0, Math.PI);           /* front half — below globe */
    drawStars(fgStars,   t * 60);        /* pierce through everything */

    raf = requestAnimationFrame(loop);
  }

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { if (!raf) loop(); }
    else { cancelAnimationFrame(raf); raf = null; }
  }, { threshold: 0.1 });
  obs.observe(canvas);
}
