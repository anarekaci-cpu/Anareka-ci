/* =====================================================
   ANAREKA-CI — SCRIPT v7.0
   Nouveautés v7 :
   - Lightbox focus trap complet
   - WhatsApp float disparaît près du footer
   - Validation visuelle des formulaires
   - Année dynamique footer
   ===================================================== */

(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    initNavMenu();
    initScrollEffects();
    initBackToTopClick();
    initReveal();
    initCounter();
    initTrainDuplication();
    patchAlbumCards();
    initLightbox();
    initAdhesionForm();
    initSignature();
    initFooterYear();
  });

  /* ============================================================
     MENU MOBILE
  ============================================================ */
  function initNavMenu() {
    const nav    = document.getElementById('mainNav');
    const toggle = document.getElementById('navToggle');
    const links  = document.getElementById('navLinks');
    if (!nav || !toggle || !links) return;

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

    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && links.classList.contains('open')) {
        links.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ============================================================
     SCROLL EFFECTS
  ============================================================ */
  function initScrollEffects() {
    const nav       = document.getElementById('mainNav');
    const backTop   = document.getElementById('backTop');
    const btnFloat  = document.getElementById('btnFloat');
    const whatsapp  = document.getElementById('whatsappFloat');

    if (btnFloat) {
      btnFloat.style.opacity      = '0';
      btnFloat.style.pointerEvents = 'none';
    }

    let ticking = false;
    function update() {
      const y = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      if (nav) nav.classList.toggle('scrolled', y > 60);
      if (backTop) backTop.classList.toggle('show', y > 300);
      
      if (btnFloat) {
        const vis = y > 200;
        btnFloat.style.opacity       = vis ? '1' : '0';
        btnFloat.style.pointerEvents = vis ? 'auto' : 'none';
      }

      // Masquer le WhatsApp près du footer
      if (whatsapp) {
        const nearBottom = y > docHeight - 400;
        whatsapp.style.opacity = nearBottom ? '0' : '1';
        whatsapp.style.pointerEvents = nearBottom ? 'none' : 'auto';
      }

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    update();
  }

  /* ============================================================
     RETOUR EN HAUT
  ============================================================ */
  function initBackToTopClick() {
    const btn = document.getElementById('backTop');
    if (!btn) return;
    btn.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: 'smooth' })
    );
  }

  /* ============================================================
     VIGNE + FOOTER REVEAL
  ============================================================ */
  function initSignature() {
    const foot   = document.querySelector('footer');
    const vine   = document.querySelector('.vine-divider');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !('IntersectionObserver' in window)) {
      if (vine) vine.classList.add('drawn');
      if (foot) foot.classList.add('footer-in');
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(
            entry.target === foot ? 'footer-in' : 'drawn'
          );
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    if (vine) io.observe(vine);
    if (foot) io.observe(foot);
  }

  /* ============================================================
     RÉVÉLATION AU SCROLL
  ============================================================ */
  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal, .reveal-l').forEach(el =>
        el.classList.add('on')
      );
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('on');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.reveal, .reveal-l').forEach(el =>
      observer.observe(el)
    );
  }

  /* ============================================================
     COMPTEUR HERO
  ============================================================ */
  function initCounter() {
    function animate(el) {
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      const dur    = 1800;
      const start  = performance.now();
      (function run(now) {
        const p    = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * ease) + suffix;
        if (p < 1) requestAnimationFrame(run);
      })(performance.now());
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('[data-target]').forEach(el => {
            if (el.dataset.noAnimate !== 'true') animate(el);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.chiffres').forEach(el => observer.observe(el));
  }

  /* ============================================================
     DUPLICATION DES TRAINS
  ============================================================ */
  function initTrainDuplication() {
    document.querySelectorAll('.train-track').forEach(track => {
      const cards = [...track.children];
      cards.forEach(card => track.appendChild(card.cloneNode(true)));
    });
  }

  /* ============================================================
     ALBUM PATCH
  ============================================================ */
  function patchAlbumCards() {
    function patch() {
      document.querySelectorAll('.train-card').forEach(card => {
        if (card.dataset.patched) return;
        card.dataset.patched = '1';

        const cap = card.dataset.cap || '';

        if (!card.querySelector('.card-shine')) {
          const s = document.createElement('span');
          s.className = 'card-shine';
          s.setAttribute('aria-hidden', 'true');
          card.appendChild(s);
        }

        if (!card.querySelector('.card-expand')) {
          const exp = document.createElement('span');
          exp.className = 'card-expand';
          exp.setAttribute('aria-hidden', 'true');
          exp.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
          card.appendChild(exp);
        }

        if (cap && !card.querySelector('.train-card-caption')) {
          const c = document.createElement('div');
          c.className = 'train-card-caption';
          c.setAttribute('aria-hidden', 'true');
          c.innerHTML = `<span class="card-label-text">${cap}</span>`;
          card.appendChild(c);
        }
      });
    }

    requestAnimationFrame(() => requestAnimationFrame(() => {
      patch();
      setTimeout(patch, 300);
    }));
  }

  /* ============================================================
     LIGHTBOX AVEC FOCUS TRAP
  ============================================================ */
  function initLightbox() {
    const lb       = document.getElementById('lightbox');
    const lbImg    = document.getElementById('lightboxImg');
    const lbCap    = document.getElementById('lightboxCap');
    const overlay  = document.getElementById('lightboxOverlay');
    const closeBtn = document.getElementById('lightboxClose');
    if (!lb || !lbImg || !lbCap || !overlay || !closeBtn) return;

    let lastFocused = null;

    function trapFocus(e) {
      if (e.key !== 'Tab') return;
      const focusable = lb.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    function open(src, cap, trigger) {
      if (!src) return;
      lastFocused = trigger || document.activeElement;
      
      lbImg.style.opacity = '0';
      lbImg.src = src;
      lbImg.alt = cap || '';
      lbCap.textContent = cap || '';
      
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      
      lbImg.onload = () => {
        lbImg.style.transition = 'opacity 0.3s ease';
        lbImg.style.opacity = '1';
      };
      
      closeBtn.focus();
      document.addEventListener('keydown', onEsc);
      document.addEventListener('keydown', trapFocus);
    }

    function close() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('keydown', trapFocus);
      setTimeout(() => { lbImg.src = ''; lbImg.alt = ''; }, 350);
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
      lastFocused = null;
    }

    function onEsc(e) { if (e.key === 'Escape') close(); }

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

    overlay.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
  }

  /* ============================================================
     FORMULAIRE ADHÉSION
  ============================================================ */
  function initAdhesionForm() {
    const form    = document.getElementById('adhesionForm');
    const success = document.getElementById('formSuccess');
    if (!form) return;

    const ENDPOINT     = 'https://formspree.io/f/xbdezwjg';
    const CONTACT_MAIL = 'info@anarekaci.com';

    function showSuccess(msg) {
      const p = success ? success.querySelector('p') : null;
      if (msg && p) p.textContent = msg;
      form.style.display = 'none';
      if (success) {
        success.style.display = 'block';
        success.focus && success.focus();
      }
    }

    function resetBtn() {
      const btn   = form.querySelector('.form-submit');
      const label = btn ? btn.querySelector('span:first-child') : null;
      if (btn) btn.disabled = false;
      if (label) label.textContent = "Envoyer ma demande d'adhésion";
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const honeypot = form.querySelector('[name="_gotcha"]');
      if (honeypot && honeypot.value) return;

      // Validation visuelle
      const invalidFields = form.querySelectorAll(':invalid');
      invalidFields.forEach(field => {
        field.style.borderColor = '#e74c3c';
        field.style.transition = 'border-color 0.3s ease';
        field.addEventListener('input', function resetBorder() {
          this.style.borderColor = '';
          this.removeEventListener('input', resetBorder);
        }, { once: true });
      });

      if (invalidFields.length > 0) {
        invalidFields[0].focus();
        return;
      }

      const btn   = form.querySelector('.form-submit');
      const label = btn ? btn.querySelector('span:first-child') : null;
      if (btn) btn.disabled = true;
      if (label) label.textContent = 'Envoi en cours…';

      const data = new FormData(form);

      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: data
        });
        if (res.ok) {
          showSuccess('Merci ! Votre demande a bien été envoyée.');
          form.reset();
          return;
        }
        throw new Error('HTTP ' + res.status);
      } catch (err) {
        console.warn('Formspree indisponible, repli mailto.', err);
      }

      const champs = {
        'Nom'             : data.get('prenom_nom') || '',
        'Téléphone'       : data.get('tel') || '',
        'E-mail'          : data.get('email') || '',
        'Ville / Quartier': data.get('ville') || '',
        "Type d'activité" : data.get('activite') || '',
        'Établissement'   : data.get('etablissement') || '',
        'Message'         : data.get('message') || ''
      };
      let corps = "Demande d'adhésion ANAREKA-CI\n\n";
      for (const [k, v] of Object.entries(champs)) corps += k + ' : ' + (v || '—') + '\n';

      window.location.href = 'mailto:' + CONTACT_MAIL
        + '?subject=' + encodeURIComponent("Demande d'adhésion — " + (data.get('prenom_nom') || ''))
        + '&body='    + encodeURIComponent(corps);

      showSuccess("Votre messagerie va s'ouvrir avec votre demande pré-remplie.");
      setTimeout(resetBtn, 2000);
    });
  }

  /* ============================================================
     FOOTER : ANNÉE DYNAMIQUE
  ============================================================ */
  function initFooterYear() {
    document.querySelectorAll('.footer-year').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

})();
