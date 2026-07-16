/* ===== MOBILE SIDEBAR TOGGLE ===== */
const hamburger = document.getElementById('hamburger');
const sidebar   = document.getElementById('sidebar');
const overlay   = document.getElementById('overlay');

hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
});
overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
});

/* ===== SMOOTH SCROLL + CLOSE MENU ===== */
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });
});

/* ===== ACTIVE NAV ON SCROLL ===== */
const sections  = document.querySelectorAll('.section');
const navLinks  = document.querySelectorAll('.nav-link');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(l => l.classList.remove('active'));
      const active = document.querySelector(`.nav-link[data-section="${id}"]`);
      if (active) active.classList.add('active');
      
      // Update 3D Cube Rotation
      updateCubeRotation(id);
    }
  });
}, { threshold: 0.35, rootMargin: '-10% 0px -10% 0px' });

/* ===== 3D CUBE LOGIC ===== */
const scInner = document.getElementById('sc-inner');
const scGlow = document.getElementById('sc-glow');

const cubeRotations = {
  'home':         { x: 0,   y: 0,    color: '#67e8f9' },
  'about':        { x: 0,   y: -90,  color: '#a78bfa' },
  'resume':       { x: 0,   y: -180, color: '#34d399' },
  'portfolio':    { x: 0,   y: 90,   color: '#fde68a' },
  'testimonials': { x: -90, y: 0,    color: '#f87171' },
  'contact':      { x: 90,  y: 0,    color: '#fb923c' }
};

function updateCubeRotation(sectionId) {
  if (!scInner || !cubeRotations[sectionId]) return;
  const rot = cubeRotations[sectionId];
  scInner.style.transform = `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;
  if(scGlow) {
    scGlow.style.background = `radial-gradient(circle, ${rot.color}44 0%, transparent 70%)`;
  }
}


/* ===== SCROLL REVEAL + RING ANIMATION ===== */
function revealSection(section) {
  if (section.classList.contains('animate-in')) return;
  section.classList.add('animate-in');

  /* Animate skill rings */
  section.querySelectorAll('.skill-ring-card').forEach(card => {
    const pct = parseInt(card.dataset.percent || 0);
    const circumference = 251.2;
    const offset = circumference - (pct / 100) * circumference;
    card.querySelectorAll('.ring-fill').forEach(ring => {
      ring.style.strokeDashoffset = offset;
    });
  });

  /* Stagger children */
  const cards = section.querySelectorAll(
    '.stat-card, .port-card, .testi-card, .timeline-item, .cert-pill, .contact-item, .hl-item'
  );
  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 100 + i * 80);
  });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      revealSection(entry.target);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

sections.forEach(section => {
  observer.observe(section);
  revealObserver.observe(section);
});

/* Trigger immediately for any section visible on load */
window.addEventListener('load', () => {
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      revealSection(section);
    }
  });
});


/* ===== COUNTERS ANIMATION ===== */
function animateCount(el, target, suffix = '') {
  let start = 0;
  const duration = 1800;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const nums = entry.target.querySelectorAll('.stat-num');
      const data = [
        { val: 5,  suffix: '+' },
        { val: 7,  suffix: '+' },
        { val: 2,  suffix: '+' },
        { val: 1,  suffix: '' },
      ];
      nums.forEach((el, i) => {
        if (data[i]) animateCount(el, data[i].val, data[i].suffix);
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const statsGrid = document.querySelector('.stats-grid');
if (statsGrid) statsObserver.observe(statsGrid);

/* ===== PORTFOLIO FILTER ===== */
const filterBtns = document.querySelectorAll('.filter-btn');
const portCards  = document.querySelectorAll('.port-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    portCards.forEach((card, i) => {
      const match = filter === 'all' || card.dataset.cat === filter;
      if (match) {
        card.style.display = 'block';
        setTimeout(() => {
          card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0) scale(1)';
        }, i * 60);
      } else {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px) scale(0.9)';
        setTimeout(() => { card.style.display = 'none'; }, 300);
      }
    });
  });
});

/* ===== CONTACT FORM (EmailJS) ===== */
// ── HOW TO ACTIVATE ──────────────────────────────────────────────────────────
// 1. Create a free account at https://www.emailjs.com
// 2. Add an Email Service (Gmail recommended) → copy your Service ID
// 3. Create an Email Template with variables: {{from_name}}, {{from_email}},
//    {{subject}}, {{message}} → copy your Template ID
// 4. Go to Account → copy your Public Key
// 5. Replace the three placeholder strings below with your real IDs
// ─────────────────────────────────────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';   // e.g. 'abc123XYZ'
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // e.g. 'service_xxxxxx'
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // e.g. 'template_xxxxxx'

if (typeof emailjs !== 'undefined') {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const original = btn.innerHTML;

    // Guard: prompt setup if still using placeholder keys
    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
      btn.innerHTML = '<i class="fas fa-triangle-exclamation"></i> EmailJS not configured';
      btn.style.background = '#f97316';
      setTimeout(() => { btn.innerHTML = original; btn.style.background = ''; }, 3000);
      return;
    }

    // Loading state
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SENDING…';
    btn.disabled = true;

    const formData = new FormData(contactForm);
    const templateParams = {
      from_name:  formData.get('name')    || contactForm.querySelector('input[type="text"]').value,
      from_email: formData.get('email')   || contactForm.querySelector('input[type="email"]').value,
      subject:    formData.get('subject') || contactForm.querySelectorAll('input[type="text"]')[1]?.value || 'Portfolio Inquiry',
      message:    formData.get('message') || contactForm.querySelector('textarea').value,
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
      btn.innerHTML = '<i class="fas fa-check"></i> MESSAGE SENT!';
      btn.style.background = '#22c55e';
      btn.style.color = '#fff';
      contactForm.reset();
      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
      }, 4000);
    } catch (err) {
      console.error('EmailJS error:', err);
      btn.innerHTML = '<i class="fas fa-times"></i> FAILED — TRY AGAIN';
      btn.style.background = '#ef4444';
      btn.style.color = '#fff';
      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
      }, 4000);
    }
  });
}


/* ===== TYPING EFFECT (hero name) ===== */
const heroName = document.querySelector('.hero-name .accent');
if (heroName) {
  const text = heroName.textContent.trim();
  heroName.textContent = '';
  heroName.style.borderRight = '3px solid var(--accent)';
  let i = 0;
  const typeInterval = setInterval(() => {
    heroName.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(typeInterval);
      /* blink cursor then remove */
      let blinks = 0;
      const blinkInterval = setInterval(() => {
        heroName.style.borderRight = blinks % 2 === 0 ? '3px solid transparent' : '3px solid var(--accent)';
        blinks++;
        if (blinks > 6) {
          clearInterval(blinkInterval);
          heroName.style.borderRight = 'none';
        }
      }, 400);
    }
  }, 100);
}

/* ===== CURSOR DOT ===== */
const dots = document.querySelectorAll('.dot');
let currentDot = 1;
setInterval(() => {
  dots.forEach((d, idx) => {
    d.classList.toggle('active', idx === currentDot);
  });
  currentDot = (currentDot + 1) % dots.length;
}, 1800);

/* ===== MAGNETIC BUTTON EFFECT ===== */
document.querySelectorAll('.btn-primary').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.05)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

/* ===== TILT EFFECT ON CARDS ===== */
document.querySelectorAll('.testi-card, .stat-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-5px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ===== SCROLL PARALLAX (Cards & Text) ===== */
const parallaxElements = document.querySelectorAll('[data-scroll-speed]');

let scrollY = window.scrollY;
let targetScrollY = scrollY;
const winW = window.innerWidth;
const winH = window.innerHeight;

window.addEventListener('scroll', () => {
  targetScrollY = window.scrollY;
});

function animateParallax() {
  scrollY += (targetScrollY - scrollY) * 0.08;

  if (winW > 768) {
    parallaxElements.forEach(el => {
      const speed = parseFloat(el.getAttribute('data-scroll-speed')) || 0;
      const rect = el.getBoundingClientRect();
      const elCenterY = rect.top + rect.height / 2;
      const viewCenterY = winH / 2;
      const offset = (elCenterY - viewCenterY) * speed;
      
      if(el.closest('#home')) {
         el.style.transform = `translateY(${scrollY * speed * -1}px)`;
      } else {
         el.style.transform = `translateY(${offset}px)`;
      }
    });
  } else {
    parallaxElements.forEach(el => el.style.transform = 'none');
  }

  requestAnimationFrame(animateParallax);
}
requestAnimationFrame(animateParallax);

/* ===== PARTICLE CANVAS ===== */
(function createParticles() {
  const canvas = document.createElement('canvas');
  canvas.id = 'particles';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.4';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.speedY = (Math.random() - 0.5) * 0.5;
      this.opacity = Math.random() * 0.5 + 0.1;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 197, 24, ${this.opacity})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < 50; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => { p.update(); p.draw(); });
    /* draw connections */
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(245, 197, 24, ${0.08 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
})();

/* ===== SMOOTH SECTION TITLE UNDERLINE ANIMATION ===== */
document.querySelectorAll('.section-title').forEach(title => {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        title.style.setProperty('--underline-w', '60px');
        title.classList.add('title-visible');
        obs.unobserve(title);
      }
    });
  }, { threshold: 0.5 });
  obs.observe(title);
});

/* ===== NAV LINK HOVER SOUND EFFECT (visual) ===== */
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('mouseenter', () => {
    link.style.paddingLeft = '2rem';
    link.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
  });
  link.addEventListener('mouseleave', () => {
    link.style.paddingLeft = '';
  });
});
