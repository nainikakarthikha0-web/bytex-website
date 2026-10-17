(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const glow = document.querySelector('.cursor-glow');
  const canvas = document.getElementById('particles');
  const ctx = canvas ? canvas.getContext('2d') : null;

  // Mobile navigation
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  // Current year
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Reveal elements gently as they enter the viewport
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // Active navigation section
  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  const sections = [...document.querySelectorAll('main section[id]')];
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id));
        }
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    sections.forEach(section => sectionObserver.observe(section));
  }

  // Cursor glow follows mouse on devices that actually have a mouse/trackpad.
  if (finePointer && glow && !reduceMotion) {
    document.body.classList.add('pointer-ready');
    let glowX = window.innerWidth / 2, glowY = window.innerHeight / 2;
    let targetX = glowX, targetY = glowY;
    window.addEventListener('pointermove', event => {
      targetX = event.clientX;
      targetY = event.clientY;
    }, { passive: true });
    const moveGlow = () => {
      glowX += (targetX - glowX) * 0.14;
      glowY += (targetY - glowY) * 0.14;
      glow.style.transform = `translate(${glowX - 190}px, ${glowY - 190}px)`;
      requestAnimationFrame(moveGlow);
    };
    requestAnimationFrame(moveGlow);
  }

  // Lightweight particle field. It is decorative and does not intercept clicks.
  if (canvas && ctx && finePointer && !reduceMotion) {
    let width = 0, height = 0, particles = [], mouse = { x: -1000, y: -1000 };
    const countForWidth = () => Math.min(58, Math.max(24, Math.floor(window.innerWidth / 23)));
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: countForWidth() }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
        r: Math.random() * 1.4 + .5
      }));
    }
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener('pointerleave', () => { mouse.x = -1000; mouse.y = -1000; });
    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, dist = Math.hypot(dx, dy);
        if (dist < 115 && dist > 0) {
          p.x += (dx / dist) * .45;
          p.y += (dy / dist) * .45;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(141,255,178,.6)';
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j], dd = Math.hypot(p.x - q.x, p.y - q.y);
          if (dd < 105) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(100,230,145,${(1 - dd / 105) * .12})`;
            ctx.lineWidth = .7; ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    resize(); draw();
  }

  // Gentle 3D tilt on cards. Disabled on touch screens and reduced-motion settings.
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const max = card.classList.contains('hero-visual') ? 3 : 5;
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateY(-2px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  // Small looping terminal word animation
  const typing = document.querySelector('[data-typing]');
  if (typing && !reduceMotion) {
    const words = typing.dataset.typing.split('|');
    let wordIndex = 0, charIndex = words[0].length, deleting = true;
    function typeLoop() {
      const current = words[wordIndex];
      if (deleting) {
        charIndex--;
        typing.textContent = current.slice(0, Math.max(0, charIndex));
        if (charIndex <= 0) { deleting = false; wordIndex = (wordIndex + 1) % words.length; }
        setTimeout(typeLoop, 65);
      } else {
        const next = words[wordIndex];
        charIndex++;
        typing.textContent = next.slice(0, charIndex);
        if (charIndex >= next.length) { deleting = true; setTimeout(typeLoop, 950); }
        else setTimeout(typeLoop, 95);
      }
    }
    setTimeout(typeLoop, 1400);
  }
})();
