// Interacciones del sitio (sin dependencias).
(function () {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* Consulta por WhatsApp */
  $('#consult-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const d = new FormData(this);
    const who = d.get('profesional') === '5492604410045' ? 'Juan' : 'José Luis';
    const det = d.get('detalle').trim();
    const msg = `Hola ${who}, soy ${d.get('nombre').trim()}. Quiero consultar por: ${d.get('caso')}.\nUbicación de la propiedad: ${d.get('ubicacion').trim()}.${det ? '\nDetalle: ' + det : ''}\nMe gustaría recibir asesoramiento para conocer los próximos pasos.`;
    window.open('https://wa.me/' + d.get('profesional') + '?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
  });

  /* Título palabra por palabra */
  $$('.split').forEach(el => {
    let k = 0;
    const wrap = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.textContent = part; i.style.setProperty('--k', k++);
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(el);
  });
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('ready')));

  /* Aparición al hacer scroll */
  if ('IntersectionObserver' in window && !reduce) {
    const obs = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach(el => obs.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('visible'));

  /* Scroll: barra de progreso, header, botón flotante, línea del proceso, parallax */
  const progress = $('.progress'), header = $('.header'), fab = $('.fab');
  const stepsBox = $('.steps'), line = $('.steps-line');
  const track = $('.gallery-track');
  let lastY = scrollY, ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY, max = root.scrollHeight - innerHeight;
    progress.style.width = (max > 0 ? y / max * 100 : 0) + '%';
    header.classList.toggle('scrolled', y > 40);
    header.classList.toggle('hide', y > lastY && y > innerHeight * 0.9 && !document.body.classList.contains('menu-open'));
    lastY = y;
    fab.classList.toggle('show', y > innerHeight * 0.7);
    if (stepsBox) {
      const r = stepsBox.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
      line.style.setProperty('--fill', (f * 100).toFixed(1) + '%');
    }
    parallax();
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);

  /* Galería: parallax interno, arrastre y flechas */
  const cards = $$('.card-img');
  function parallax() {
    if (reduce) return;
    const vw = innerWidth;
    cards.forEach(c => {
      const r = c.getBoundingClientRect();
      if (r.right < 0 || r.left > vw) return;
      const t = ((r.left + r.width / 2) / vw - 0.5); // -0.5 … 0.5
      c.style.setProperty('--shift', (-8 - t * 10).toFixed(2) + '%');
    });
  }
  if (track) {
    track.addEventListener('scroll', () => requestAnimationFrame(parallax), { passive: true });
    const step = () => (cards[0]?.getBoundingClientRect().width || 400) + 22;
    $('.gnav.next').addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    $('.gnav.prev').addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    let down = false, sx = 0, sl = 0, moved = 0;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; sx = e.clientX; sl = track.scrollLeft;
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 5) track.classList.add('drag');
      track.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => {
      if (!down) return; down = false;
      setTimeout(() => track.classList.remove('drag'), 0);
    });
    track.addEventListener('click', e => { if (moved > 5) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  /* Lightbox */
  const lb = $('.lightbox'), lbImg = $('.lightbox img');
  $$('.card-img button').forEach(b => b.addEventListener('click', () => {
    lbImg.src = b.dataset.full; lbImg.alt = $('img', b).alt; lb.hidden = false; $('.lb-close').focus();
  }));
  const closeLb = () => { lb.hidden = true; lbImg.removeAttribute('src'); };
  lb.addEventListener('click', e => { if (e.target !== lbImg) closeLb(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  /* Menú mobile */
  const menuBtn = $('.menu-btn');
  menuBtn.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  $$('.nav a').forEach(a => a.addEventListener('click', () => {
    document.body.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));

  /* Inclinación 3D de tarjetas y botones magnéticos (solo con mouse) */
  if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    $$('.tilt').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-6px)`;
      });
      c.addEventListener('pointerleave', () => { c.style.transform = ''; });
    });
    $$('.magnetic').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  onScroll();
})();
