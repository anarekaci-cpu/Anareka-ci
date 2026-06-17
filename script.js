/* =====================================================
   ANAREKA-CI — SCRIPT UNIQUE OPTIMISÉ
   Chargé avec <script src="script.js" defer></script>
   ===================================================== */

(function() {
  // ---------- ÉLÉMENTS DU DOM (attendre qu'il soit prêt) ----------
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function() {
    initNavigation();
    initBackToTop();
    initReveal();
    initCounter();
    initLightbox();
    initTrainDuplication();
    initFloatingButton();
    initAdhesionForm();
  });

  // ---------- NAVIGATION (scroll + menu mobile) ----------
  function initNavigation() {
    const nav = document.getElementById('mainNav');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!nav || !toggle || !links) return;

    // Changement de style au scroll
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    });

    // Menu hamburger
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', open);
    });

    // Fermer le menu après un clic sur un lien
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  // ---------- RETOUR EN HAUT ----------
  function initBackToTop() {
    const btn = document.getElementById('backTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('show', window.scrollY > 300);
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---------- RÉVÉLATION AU DÉFILEMENT ----------
  function initReveal() {
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

  // ---------- COMPTEUR DE CHIFFRES ----------
  function initCounter() {
    function animate(el) {
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const dur = 1800;
      const start = performance.now();

      function run(now) {
        const p = Math.min((now - start) / dur, 1);
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

  // ---------- LIGHTBOX ----------
  function initLightbox() {
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightboxImg');
    const lbCap = document.getElementById('lightboxCap');
    const overlay = document.getElementById('lightboxOverlay');
    const closeBtn = document.getElementById('lightboxClose');
    if (!lb || !lbImg || !lbCap) return;

    function open(src, cap) {
      lbImg.src = src;
      lbCap.textContent = cap;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      lb.classList.remove('open');
      document.body.style.overflow = '';
      lbImg.src = '';
    }

    document.querySelectorAll('.train-card').forEach(card => {
      card.addEventListener('click', () => open(card.dataset.src, card.dataset.cap));
    });

    overlay.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  // ---------- DUPLICATION DES TRAINS (au lieu du HTML doublé) ----------
  function initTrainDuplication() {
    document.querySelectorAll('.train-track').forEach(track => {
      const cards = [...track.children];
      cards.forEach(card => track.appendChild(card.cloneNode(true)));
    });
  }

  // ---------- BOUTON FLOTTANT ----------
  function initFloatingButton() {
    const btn = document.getElementById('btnFloat');
    if (!btn) return;
    btn.style.opacity = '0';
    window.addEventListener('scroll', () => {
      const visible = window.scrollY > 200;
      btn.style.opacity = visible ? '1' : '0';
      btn.style.pointerEvents = visible ? 'auto' : 'none';
    });
  }

  // ---------- FORMULAIRE ADHÉSION ----------
  function initAdhesionForm() {
    const form = document.getElementById('adhesionForm');
    const success = document.getElementById('formSuccess');
    if (!form) return;

    const FORM_ENDPOINT = 'https://formspree.io/f/xbdezwjg';
    const CONTACT_EMAIL = 'anarekaci@gmail.com';

    function afficherSucces(message) {
      const p = success.querySelector('p');
      if (message && p) p.textContent = message;
      form.style.display = 'none';
      success.style.display = 'block';
    }

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const btn = form.querySelector('.form-submit');
      const label = btn?.querySelector('span');
      const texteInitial = label ? label.textContent : '';
      if (btn) btn.disabled = true;
      if (label) label.textContent = 'Envoi en cours...';

      const data = new FormData(form);

      // Essai d'envoi automatique
      if (FORM_ENDPOINT) {
        try {
          const res = await fetch(FORM_ENDPOINT, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: data
          });
          if (res.ok) {
            afficherSucces();
            return;
          }
          throw new Error('HTTP ' + res.status);
        } catch (err) {
          console.warn('Envoi automatique échoué, fallback mailto.', err);
        }
      }

      // Fallback : ouverture du client mail
      const champs = {
        'Nom'              : data.get('nom'),
        'Téléphone'        : data.get('tel'),
        'E-mail'           : data.get('email'),
        'Ville / Quartier' : data.get('ville'),
        'Type d\'activité' : data.get('activite'),
        'Établissement'    : data.get('etablissement'),
        'Message'          : data.get('message')
      };
      let corps = "Demande d'adhésion ANAREKA-CI\n\n";
      for (const [cle, val] of Object.entries(champs)) {
        corps += cle + ' : ' + (val || '—') + '\n';
      }
      const lien = 'mailto:' + CONTACT_EMAIL
        + '?subject=' + encodeURIComponent("Demande d'adhésion — " + (data.get('nom') || ''))
        + '&body='    + encodeURIComponent(corps);
      window.location.href = lien;

      afficherSucces("Votre messagerie va s'ouvrir avec votre demande pré-remplie. Cliquez sur « Envoyer » pour finaliser votre adhésion.");

      if (btn) btn.disabled = false;
      if (label) label.textContent = texteInitial;
    });
  }

})();
