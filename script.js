/* =====================================================
   ANAREKA-CI — SCRIPT v6.0
   Fusion de script.js v5.2 + album-patch.js
   Nouveautés v6 :
   - Album patch intégré (shine, expand, caption)
   - Footer : animation des stats au scroll
   - Footer : année dynamique
   - Footer : typing effect sur le slogan
   - Smooth reveal amélioré
===================================================== */

(function () {
  'use strict';

  /* ---- utilitaire DOMReady ---- */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ---- debounce ---- */
  function debounce(func, delay) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => func(...args), delay);
    };
  }

  ready(function () {
    initNavMenu();
    initScrollEffects();
    initBackToTopClick();
    initReveal();
    initCounter();
    initTrainDuplication();   // doit être AVANT patchAlbumCards
    patchAlbumCards();
    initLightbox();
    initAdhesionForm();
    initSignature();
    initFooterYear();
    initFooterStats();
    lazyLoadCharts();
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
    const nav      = document.getElementById('mainNav');
    const backTop  = document.getElementById('backTop');
    const btnFloat = document.getElementById('btnFloat');

    if (btnFloat) {
      btnFloat.style.opacity      = '0';
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
     DUPLICATION DES TRAINS (défilement infini)
  ============================================================ */
  function initTrainDuplication() {
    document.querySelectorAll('.train-track').forEach(track => {
      const cards = [...track.children];
      cards.forEach(card => track.appendChild(card.cloneNode(true)));
    });
  }

  /* ============================================================
     ALBUM PATCH : shine · expand · caption structurée
  ============================================================ */
  function patchAlbumCards() {
    function patch() {
      document.querySelectorAll('.train-card').forEach(card => {
        if (card.dataset.patched) return;
        card.dataset.patched = '1';

        const cap = card.dataset.cap || '';

        /* shine */
        if (!card.querySelector('.card-shine')) {
          const s = document.createElement('span');
          s.className = 'card-shine';
          s.setAttribute('aria-hidden', 'true');
          card.appendChild(s);
        }

        /* icône expand */
        if (!card.querySelector('.card-expand')) {
          const exp = document.createElement('span');
          exp.className = 'card-expand';
          exp.setAttribute('aria-hidden', 'true');
          exp.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 3 21 3 21 9"/>
            <polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/>
            <line x1="3" y1="21" x2="10" y2="14"/>
          </svg>`;
          card.appendChild(exp);
        }

        /* caption */
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
      setTimeout(patch, 300); // re-patch après duplication tardive
    }));
  }

  /* ============================================================
     LIGHTBOX
  ============================================================ */
  function initLightbox() {
    const lb       = document.getElementById('lightbox');
    const lbImg    = document.getElementById('lightboxImg');
    const lbCap    = document.getElementById('lightboxCap');
    const overlay  = document.getElementById('lightboxOverlay');
    const closeBtn = document.getElementById('lightboxClose');
    if (!lb || !lbImg || !lbCap || !overlay || !closeBtn) return;

    let lastFocused = null;

    function open(src, cap, trigger) {
      if (!src) return;
      lastFocused = trigger || document.activeElement;
      lbImg.src          = src;
      lbImg.alt          = cap || '';
      lbCap.textContent  = cap || '';
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
      document.addEventListener('keydown', onEsc);
    }

    function close() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onEsc);
      setTimeout(() => { lbImg.src = ''; lbImg.alt = ''; }, 350);
      if (lastFocused && typeof lastFocused.focus === 'function')
        lastFocused.focus();
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
        if (res.ok) { showSuccess('Merci ! Votre demande a bien été envoyée.'); form.reset(); return; }
        throw new Error('HTTP ' + res.status);
      } catch (err) {
        console.warn('Formspree indisponible, repli mailto.', err);
      }

      const champs = {
        'Nom'             : data.get('nom') || '',
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
        + '?subject=' + encodeURIComponent("Demande d'adhésion — " + (data.get('nom') || ''))
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

  /* ============================================================
     FOOTER STATS : compteur au scroll
  ============================================================ */
  function initFooterStats() {
    const stats = document.querySelectorAll('.ftr-stat-num[data-to]');
    if (!stats.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el  = entry.target;
        const to  = parseInt(el.dataset.to, 10);
        const sfx = el.dataset.suffix || '';
        const dur = 1400;
        const t0  = performance.now();
        observer.unobserve(el);
        (function run(now) {
          const p    = Math.min((now - t0) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * ease) + sfx;
          if (p < 1) requestAnimationFrame(run);
        })(performance.now());
      });
    }, { threshold: 0.6 });

    stats.forEach(el => observer.observe(el));
  }

  /* ============================================================
     LAZY LOAD CHART.JS (section #donnees optionnelle)
  ============================================================ */
  function lazyLoadCharts() {
    const section = document.getElementById('donnees');
    if (!section) return;

    let loaded = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !loaded) {
          loaded = true;
          observer.unobserve(section);
          loadChartJs();
        }
      });
    }, { threshold: 0.1 });

    observer.observe(section);

    function loadChartJs() {
      if (typeof Chart !== 'undefined') { initCharts(); return; }
      const s = document.createElement('script');
      s.src   = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      s.async = true;
      s.onload  = initCharts;
      s.onerror = () => console.warn("Chart.js n'a pas pu être chargé.");
      document.head.appendChild(s);
    }

    function initCharts() {
      if (typeof Chart === 'undefined') return;
      Chart.defaults.font.family = "'Outfit', sans-serif";
      Chart.defaults.color = '#888';

      const V  = '#1a3d2b', V2 = '#2d6b4f',
            OR = '#c9a84c', OR2 = '#e8c97a';

      function mk(id, cfg) {
        const el = document.getElementById(id);
        if (!el) return;
        try { new Chart(el, cfg); } catch(e) { console.warn(id, e); }
      }

      mk('chartEvol', {
        type: 'line',
        data: {
          labels: ['1996','1998','2000','2005','2010','2015','2020','2025','2026'],
          datasets: [{ label:'Croissance', data:[10,15,22,35,50,65,75,90,100],
            borderColor:V, backgroundColor:'rgba(26,61,43,0.06)',
            borderWidth:2.5, pointBackgroundColor:[V,V,V,V,V,V,V,OR,OR2],
            pointRadius:5, pointHoverRadius:7, fill:true, tension:0.4 }]
        },
        options:{ responsive:true, maintainAspectRatio:false,
          interaction:{ mode:'index', intersect:false },
          plugins:{ legend:{display:false} },
          scales:{ y:{display:false,beginAtZero:true}, x:{grid:{display:false}} } }
      });

      mk('chartMembres', {
        type:'doughnut',
        data:{ labels:['Restaurateurs','Kiosques','Producteurs','Vendeurs','Gestionnaires'],
          datasets:[{ data:[35,28,18,12,7],
            backgroundColor:[V,OR,V2,OR2,'#5a9a78'],
            borderWidth:3, borderColor:'#fff', borderRadius:8 }] },
        options:{ responsive:true, maintainAspectRatio:false, cutout:'62%',
          plugins:{ legend:{ position:'bottom', labels:{font:{size:11},padding:12,boxWidth:12,usePointStyle:true} } } }
      });

      mk('chartDomaines', {
        type:'doughnut',
        data:{ labels:['Formation','Hygiène','Promotion','Défense','Partenariats'],
          datasets:[{ data:[30,20,20,15,15],
            backgroundColor:[OR,V,V2,OR2,'#5a9a78'],
            borderWidth:3, borderColor:'#fff', borderRadius:8 }] },
        options:{ responsive:true, maintainAspectRatio:false, cutout:'62%',
          plugins:{ legend:{ position:'bottom', labels:{font:{size:11},padding:12,boxWidth:12,usePointStyle:true} } } }
      });

      mk('chartAxes', {
        type:'bar',
        data:{
          labels:['Structuration','Emploi jeunes/femmes','Qualité produit','Promotion','Hygiène','Partenariats'],
          datasets:[{ label:'Importance (/10)', data:[9,8,9,7,8,7],
            backgroundColor:[V,OR,V,OR,V2,OR2],
            borderRadius:4, borderSkipped:false, borderWidth:0 }]
        },
        options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{display:false} },
          scales:{
            x:{ beginAtZero:true, max:10, grid:{color:'#f0f0f0',drawBorder:false}, ticks:{font:{size:11}} },
            y:{ grid:{display:false}, ticks:{font:{size:12}} }
          } }
      });
    }
  }

})();
