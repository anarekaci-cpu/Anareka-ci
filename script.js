/* =====================================================
   ANAREKA-CI — SCRIPT v5.1 (corrigé & optimisé)
   Corrections v5.1 :
   - backTop : <button> au lieu de <a> (accessibilité)
   - e.preventDefault() retiré du backTop (button n'en a pas besoin)
   ===================================================== */

(function () {

  document.documentElement.classList.add('js');

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    initNavMenu();
    initTrainDuplication();
    initLightbox();
    initReveal();
    initCounter();
    initAdhesionForm();
    initScrollEffects();
    initBackToTopClick();
    initSignature();
  });

  /* ---------- MENU MOBILE ---------- */
  function initNavMenu() {
    const toggle = document.getElementById('navToggle');
    const links  = document.getElementById('navLinks');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', String(open));
    });

    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ---------- SCROLL (un seul listener) ---------- */
  function initScrollEffects() {
    const nav      = document.getElementById('mainNav');
    const backTop  = document.getElementById('backTop');
    const btnFloat = document.getElementById('btnFloat');

    if (btnFloat) {
      btnFloat.style.opacity = '0';
      btnFloat.style.pointerEvents = 'none';
    }

    let ticking = false;
    function update() {
      const y = window.scrollY;
      if (nav)      nav.classList.toggle('scrolled', y > 60);
      if (backTop)  backTop.classList.toggle('show', y > 300);
      if (btnFloat) {
        const vis = y > 200;
        btnFloat.style.opacity       = vis ? '1' : '0';
        btnFloat.style.pointerEvents = vis ? 'auto' : 'none';
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    update();
  }

  /* ---------- RETOUR EN HAUT ---------- */
  function initBackToTopClick() {
    const btn = document.getElementById('backTop');
    if (!btn) return;
    // CORRECTION v5.1 : c'est maintenant un <button>, pas de e.preventDefault() nécessaire
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- VIGNE + FOOTER ---------- */
  function initSignature() {
    const foot = document.querySelector('footer');
    const vine = document.querySelector('.vine-divider');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !('IntersectionObserver' in window)) {
      if (vine) vine.classList.add('drawn');
      if (foot) foot.classList.add('footer-in');
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(entry.target === foot ? 'footer-in' : 'drawn');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });

    if (vine) io.observe(vine);
    if (foot) io.observe(foot);
  }

  /* ---------- RÉVÉLATION AU SCROLL ---------- */
  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal, .reveal-l').forEach(el => el.classList.add('on'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('on');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal, .reveal-l').forEach(el => observer.observe(el));
  }

  /* ---------- COMPTEUR DE CHIFFRES ---------- */
  function initCounter() {
    function animate(el) {
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1800;
      const start = performance.now();
      function run(now) {
        const p    = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * ease) + suffix;
        if (p < 1) requestAnimationFrame(run);
      }
      requestAnimationFrame(run);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('[data-target]').forEach(el => {
            if (el.dataset.noAnimate === 'true') return;
            animate(el);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.chiffres').forEach(el => observer.observe(el));
  }

  /* ---------- DUPLICATION DES TRAINS ---------- */
  function initTrainDuplication() {
    document.querySelectorAll('.train-track').forEach(track => {
      const cards = [...track.children];
      cards.forEach(card => track.appendChild(card.cloneNode(true)));
    });
  }

  /* ---------- LIGHTBOX (délégation + clavier + accessibilité) ---------- */
  function initLightbox() {
    const lb      = document.getElementById('lightbox');
    const lbImg   = document.getElementById('lightboxImg');
    const lbCap   = document.getElementById('lightboxCap');
    const overlay = document.getElementById('lightboxOverlay');
    const closeBtn= document.getElementById('lightboxClose');
    if (!lb || !lbImg || !lbCap) return;

    let lastFocused = null;

    function open(src, cap, trigger) {
      if (!src) return;
      lastFocused = trigger || null;
      lbImg.src          = src;
      lbImg.alt          = cap || '';
      lbCap.textContent  = cap || '';
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      setTimeout(() => { lbImg.src = ''; }, 350);
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
      lastFocused = null;
    }

    document.addEventListener('click', e => {
      const card = e.target.closest('.train-card');
      if (card) open(card.dataset.src, card.dataset.cap, card);
    });

    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const active = document.activeElement;
      if (active && active.classList.contains('train-card')) {
        e.preventDefault();
        open(active.dataset.src, active.dataset.cap, active);
      }
    });

    if (overlay)  overlay.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && lb.classList.contains('open')) close();
    });
  }

  /* ---------- FORMULAIRE ADHÉSION ---------- */
  function initAdhesionForm() {
    const form    = document.getElementById('adhesionForm');
    const success = document.getElementById('formSuccess');
    if (!form) return;

    const FORM_ENDPOINT  = 'https://formspree.io/f/xbdezwjg';
    const CONTACT_EMAIL  = 'info@anarekaci.com';

    function showSuccess(msg) {
      const p = success ? success.querySelector('p') : null;
      if (msg && p) p.textContent = msg;
      form.style.display = 'none';
      if (success) {
        success.style.display = 'block';
        success.setAttribute('role', 'alert');
        success.focus && success.focus();
      }
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const honeypot = form.querySelector('[name="_gotcha"]');
      if (honeypot && honeypot.value) return;

      const btn   = form.querySelector('.form-submit');
      const label = btn ? btn.querySelector('span:first-child') : null;
      const texteInitial = label ? label.textContent : '';

      if (btn)   btn.disabled = true;
      if (label) label.textContent = 'Envoi en cours…';

      const data = new FormData(form);

      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: data
        });
        if (res.ok) {
          showSuccess();
          return;
        }
        throw new Error('HTTP ' + res.status);
      } catch (err) {
        console.warn('Formspree indisponible, repli sur mailto.', err);
      }

      const champs = {
        'Nom'             : data.get('nom'),
        'Téléphone'       : data.get('tel'),
        'E-mail'          : data.get('email'),
        'Ville / Quartier': data.get('ville'),
        "Type d'activité" : data.get('activite'),
        'Établissement'   : data.get('etablissement'),
        'Message'         : data.get('message')
      };
      let corps = "Demande d'adhésion ANAREKA-CI\n\n";
      for (const [cle, val] of Object.entries(champs)) {
        corps += cle + ' : ' + (val || '—') + '\n';
      }
      const lien = 'mailto:' + CONTACT_EMAIL
        + '?subject=' + encodeURIComponent("Demande d'adhésion — " + (data.get('nom') || ''))
        + '&body='    + encodeURIComponent(corps);
      window.location.href = lien;

      showSuccess("Votre messagerie va s'ouvrir avec votre demande pré-remplie. Cliquez sur « Envoyer » pour finaliser votre adhésion.");
      if (btn)   btn.disabled = false;
      if (label) label.textContent = texteInitial;
    });
  }

})();
