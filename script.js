(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Mouse-follow glow ---------------- */
  const hero = document.querySelector('.hero');
  if (hero && !prefersReducedMotion) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--glow-x', `${e.clientX - rect.left}px`);
      hero.style.setProperty('--glow-y', `${e.clientY - rect.top}px`);
    });
  }

  /* ---------------- Rotating role word ---------------- */
  const ROLES = ['AI Engineer', 'Machine Learning', 'Data Scientist', 'Full Stack Developer'];
  const ROLE_INTERVAL_MS = 2400;
  const roleWordEl = document.getElementById('role-word');

  if (roleWordEl && ROLES.length > 1 && !prefersReducedMotion) {
    let index = 0;
    setInterval(() => {
      roleWordEl.classList.add('is-leaving');
      window.setTimeout(() => {
        index = (index + 1) % ROLES.length;
        roleWordEl.textContent = ROLES[index];
        roleWordEl.classList.remove('is-leaving');
      }, 380); // matches slideOut animation duration
    }, ROLE_INTERVAL_MS);
  }
  // Under reduced motion, the word stays on "AI Engineer" (the HTML default) —
  // the screen-reader-only #role-word-sr string already lists every role once.

  /* ---------------- Neural field (canvas node graph) ---------------- */
  function createNeuralField(canvas, wrapper, { nodeCount = 36, accentColor = '#3B82F6' } = {}) {
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let mouseX = 0;
    let mouseY = 0;
    let rafId = 0;
    let nodes = [];

    function seedNodes() {
      nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.4 + 1,
      }));
    }

    function resize() {
      const rect = wrapper.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedNodes();
    }

    function drawStaticFrame() {
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 0.85;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = '#E5E7EB';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function frame() {
      ctx.clearRect(0, 0, width, height);
      const parallaxX = (mouseX - width / 2) * 0.02;
      const parallaxY = (mouseY - height / 2) * 0.02;

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }

      const maxDist = 130;
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            ctx.globalAlpha = (1 - dist / maxDist) * 0.35;
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x + parallaxX, a.y + parallaxY);
            ctx.lineTo(b.x + parallaxX, b.y + parallaxY);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 0.85;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x + parallaxX, n.y + parallaxY, n.r, 0, Math.PI * 2);
        ctx.fillStyle = '#E5E7EB';
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(frame);
    }

    function handleMouseMove(e) {
      const rect = wrapper.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    resize();

    if (prefersReducedMotion) {
      // One static frame, no listeners, no rAF loop — no motion at all.
      drawStaticFrame();
    } else {
      wrapper.addEventListener('mousemove', handleMouseMove);
      rafId = requestAnimationFrame(frame);
    }

    return () => {
      ro.disconnect();
      wrapper.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }

  createNeuralField(
    document.getElementById('neural-field'),
    document.querySelector('.hero__field--desktop'),
    { nodeCount: 40 }
  );
  createNeuralField(
    document.getElementById('neural-field-mobile'),
    document.querySelector('.hero__field--mobile'),
    { nodeCount: 20 }
  );

  /* ---------------- Nav: scrolled state + mobile menu ---------------- */
  const nav = document.getElementById('site-nav');
  const navToggle = document.getElementById('nav-toggle');
  const navMobile = document.getElementById('nav-mobile');

  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMobile.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    // Close the mobile menu after a link inside it is used.
    navMobile.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navMobile.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  /* ---------------- Scroll reveal (About/Skills/Projects/Experience/Contact) ---------------- */
  const revealEls = document.querySelectorAll('.io-reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    // No motion requested, or no observer support: just show everything.
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    revealEls.forEach((el) => {
      const delay = el.dataset.delay;
      if (delay) el.style.setProperty('--reveal-delay', `${delay}s`);
    });

    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------------- About: animated stat counters ---------------- */
  const statEls = document.querySelectorAll('.stat__number');

  function animateCount(el) {
    const target = Number(el.dataset.countTo || '0');
    const suffix = el.dataset.suffix || '';

    if (prefersReducedMotion) {
      el.textContent = `${target}${suffix}`;
      return;
    }

    const duration = 900;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (statEls.length) {
    if (!('IntersectionObserver' in window)) {
      statEls.forEach(animateCount);
    } else {
      const statIo = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      statEls.forEach((el) => statIo.observe(el));
    }
  }

  /* ---------------- Projects: category filter ---------------- */
  const filterChips = document.querySelectorAll('.filter-chip');
  const projectCards = document.querySelectorAll('.project-card');
  const projectsEmpty = document.getElementById('projects-empty');

  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');

      const filter = chip.dataset.filter;
      let visibleCount = 0;

      projectCards.forEach((card) => {
        const matches = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !matches);
        if (matches) visibleCount += 1;
      });

      if (projectsEmpty) projectsEmpty.hidden = visibleCount > 0;
    });
  });

  /* ---------------- Contact form: client-side validation + demo submit ---------------- */
  const contactForm = document.getElementById('contact-form');

  if (contactForm) {
    const fields = ['name', 'email', 'subject', 'message'];
    const submitBtn = contactForm.querySelector('.contact-form__submit');
    const submitLabel = contactForm.querySelector('.contact-form__submit-label');
    const statusEl = document.getElementById('form-status');

    function setFieldError(field, message) {
      const row = document.getElementById(field).closest('.form-row');
      const errorEl = document.getElementById(`${field}-error`);
      row.classList.toggle('has-error', Boolean(message));
      errorEl.textContent = message || '';
    }

    function validate() {
      let valid = true;
      const values = {};

      fields.forEach((field) => {
        const input = document.getElementById(field);
        values[field] = input.value.trim();

        if (!values[field]) {
          setFieldError(field, 'This field is required.');
          valid = false;
        } else if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[field])) {
          setFieldError(field, 'Enter a valid email address.');
          valid = false;
        } else {
          setFieldError(field, '');
        }
      });

      return { valid, values };
    }

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const { valid, values } = validate();

      statusEl.textContent = '';
      statusEl.classList.remove('is-success', 'is-error');

      if (!valid) {
        statusEl.textContent = 'Please fix the highlighted fields.';
        statusEl.classList.add('is-error');
        return;
      }

      // No backend is wired up here. Plug in your own send step —
      // e.g. EmailJS, Formspree, or a fetch() to your own API route —
      // using `values` (name, email, subject, message) as the payload.
      submitBtn.disabled = true;
      submitLabel.textContent = 'Sending…';

      window.setTimeout(() => {
        submitBtn.disabled = false;
        submitLabel.textContent = 'Send message';
        statusEl.textContent = `Thanks, ${values.name.split(' ')[0]} — this demo form isn't connected to a backend yet, but your message would be on its way.`;
        statusEl.classList.add('is-success');
        contactForm.reset();
      }, 900);
    });
  }

  /* ---------------- Footer: back-to-top + year ---------------- */
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  const yearEl = document.getElementById('copyright-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
