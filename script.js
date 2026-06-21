/* =====================================================
   ANAREKA-CI ��� SCRIPT UNIQUE OPTIMISÉ
   Chargé avec <script src="script.js" defer></script>
   ===================================================== */

(function() {
  'use strict';

  // ---------- ÉLÉMENTS DU DOM (attendre qu'il soit prêt) ----------
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
    const links = document.getElementById('navLinks');
    
    if (!nav || !toggle || !links) return;

    // Changement de style au scroll
    window.addEventListener('scroll', debounce(() => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, 10));

    // Menu hamburger
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', String(open));
    });

    // Fermer le menu après un clic sur un lien
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Fermer le menu si on clique en dehors
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && links.classList.contains('open')) {
        links.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
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

    window.addEventListener('scroll', debounce(() => {
      btn.classList.toggle('show', window.scrollY > 300);
    }, 10));

    update();
  }

  /* ---------- RETOUR EN HAUT ---------- */
  function initBackToTopClick() {
    const btn = document.getElementById('backTop');
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.preventDefault();
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
            // CORRECTION : ne pas animer "1996" (data-no-animate="true")
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
    const closeBtn = document.getElementById('lightboxClose');
    
    if (!lb || !lbImg || !lbCap || !overlay || !closeBtn) return;

    function open(src, cap) {
      if (!src) return;
      lbImg.src = src;
      lbImg.alt = cap;
      lbCap.textContent = cap;
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }

    function close() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lbImg.src = '';
      lbImg.alt = '';
      document.removeEventListener('keydown', handleEscape);
    }

    function handleEscape(e) {
      if (e.key === 'Escape') close();
    }

    document.querySelectorAll('.train-card').forEach(card => {
      card.addEventListener('click', () => {
        const src = card.dataset.src;
        const cap = card.dataset.cap || '';
        open(src, cap);
      });
      card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const src = card.dataset.src;
          const cap = card.dataset.cap || '';
          open(src, cap);
        }
      });
    });

    overlay.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
  }

  // ---------- DUPLICATION DES TRAINS (au lieu du HTML doublé) ----------
  function initTrainDuplication() {
    document.querySelectorAll('.train-track').forEach(track => {
      const cards = [...track.children];
      cards.forEach(card => {
        const clone = card.cloneNode(true);
        track.appendChild(clone);
      });
    });

  // ---------- BOUTON FLOTTANT ----------
  function initFloatingButton() {
    const btn = document.getElementById('btnFloat');
    if (!btn) return;
    
    btn.style.opacity = '0';
    window.addEventListener('scroll', debounce(() => {
      const visible = window.scrollY > 200;
      btn.style.opacity = visible ? '1' : '0';
      btn.style.pointerEvents = visible ? 'auto' : 'none';
    }, 10));
  }

  /* ---------- FORMULAIRE ADHÉSION ---------- */
  function initAdhesionForm() {
    const form    = document.getElementById('adhesionForm');
    const success = document.getElementById('formSuccess');
    
    if (!form) return;

    const FORM_ENDPOINT  = 'https://formspree.io/f/xbdezwjg';
    const CONTACT_EMAIL  = 'info@anarekaci.com';

    function afficherSucces(message) {
      if (success) {
        const p = success.querySelector('p');
        if (message && p) p.textContent = message;
        form.style.display = 'none';
        success.style.display = 'block';
      }
    }

    function resetForm() {
      const btn = form.querySelector('.form-submit');
      const label = btn?.querySelector('span');
      const texteInitial = label ? label.textContent : 'Envoyer ma demande d\'adhésion';
      
      if (btn) {
        btn.disabled = false;
        if (label) label.textContent = texteInitial;
      }
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      
      const btn = form.querySelector('.form-submit');
      const label = btn?.querySelector('span');
      const texteInitial = label ? label.textContent : 'Envoyer ma demande d\'adhésion';
      
      // Désactiver le bouton et afficher "Envoi en cours..."
      if (btn) btn.disabled = true;
      if (label) label.textContent = 'Envoi en cours...';

      const data = new FormData(form);

      // Essai d'envoi automatique via Formspree
      if (FORM_ENDPOINT) {
        try {
          const res = await fetch(FORM_ENDPOINT, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: data
          });
          
          if (res.ok) {
            afficherSucces('Merci ! Votre demande a été envoyée avec succès.');
            form.reset();
            return;
          }
          
          throw new Error('HTTP ' + res.status);
        } catch (err) {
          console.warn('Envoi automatique échoué, fallback mailto.', err);
        }
        throw new Error('HTTP ' + res.status);
      } catch (err) {
        console.warn('Formspree indisponible, repli sur mailto.', err);
      }

      // Fallback : ouverture du client mail avec pré-remplissage
      const champs = {
        'Nom'              : data.get('nom') || '',
        'Téléphone'        : data.get('tel') || '',
        'E-mail'           : data.get('email') || '',
        'Ville / Quartier' : data.get('ville') || '',
        'Type d\'activité' : data.get('activite') || '',
        'Établissement'    : data.get('etablissement') || '',
        'Message'          : data.get('message') || ''
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
      
      // Réactiver le bouton après délai
      setTimeout(resetForm, 2000);
    });
  }

  // ---------- CHARGEMENT PARESSEUX DE CHART.JS ----------
  function lazyLoadCharts() {
    const section = document.getElementById('donnees');
    if (!section) return;

    let loaded = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !loaded) {
          loaded = true;
          observer.unobserve(section);
          loadChartJsThenInit();
        }
      });
    }, { threshold: 0.1 });

    observer.observe(section);

    function loadChartJsThenInit() {
      if (typeof Chart !== 'undefined') {
        initCharts();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      script.async = true;
      script.onload = initCharts;
      script.onerror = () => console.warn('Chart.js n\'a pas pu être chargé.');
      document.head.appendChild(script);
    }

    function initCharts() {
      if (typeof Chart === 'undefined') return;

      Chart.defaults.font.family = "'Outfit', sans-serif";
      Chart.defaults.color = '#888';

      const V = '#1a3d2b', V2 = '#2d6b4f', OR = '#c9a84c', OR2 = '#e8c97a';

      function makeChart(id, config) {
        const el = document.getElementById(id);
        if (!el) return;
        try {
          new Chart(el, config);
        } catch (err) {
          console.warn('Graphique ' + id + ' non rendu :', err);
        }
      }

      // Graphique 1 : Évolution
      makeChart('chartEvol', {
        type: 'line',
        data: {
          labels: ['1996','1998','2000','2005','2010','2015','2020','2025','2026'],
          datasets: [{
            label: 'Croissance',
            data: [10,15,22,35,50,65,75,90,100],
            borderColor: V,
            backgroundColor: 'rgba(26,61,43,0.06)',
            borderWidth: 2.5,
            pointBackgroundColor: [V,V,V,V,V,V,V,OR,OR2],
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            filler: { propagate: true }
          },
          scales: {
            y: { display: false, beginAtZero: true },
            x: { grid: { display: false } }
          }
        }
      });

      // Graphique 2 : Composition des membres
      makeChart('chartMembres', {
        type: 'doughnut',
        data: {
          labels: ['Restaurateurs','Kiosques','Producteurs','Vendeurs','Gestionnaires'],
          datasets: [{
            data: [35,28,18,12,7],
            backgroundColor: [V,OR,V2,OR2,'#5a9a78'],
            borderWidth: 3,
            borderColor: '#fff',
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 11 },
                padding: 12,
                boxWidth: 12,
                usePointStyle: true
              }
            }
          }
        }
      });

      // Graphique 3 : Domaines d'intervention
      makeChart('chartDomaines', {
        type: 'doughnut',
        data: {
          labels: ['Formation','Hygiène','Promotion','Défense','Partenariats'],
          datasets: [{
            data: [30,20,20,15,15],
            backgroundColor: [OR,V,V2,OR2,'#5a9a78'],
            borderWidth: 3,
            borderColor: '#fff',
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 11 },
                padding: 12,
                boxWidth: 12,
                usePointStyle: true
              }
            }
          }
        }
      });

      // Graphique 4 : Axes stratégiques
      makeChart('chartAxes', {
        type: 'bar',
        data: {
          labels: ['Structuration','Emploi jeunes/femmes','Qualité produit','Promotion','Hygiène','Partenariats'],
          datasets: [{
            label: 'Importance (/10)',
            data: [9,8,9,7,8,7],
            backgroundColor: [V,OR,V,OR,V2,OR2],
            borderRadius: 4,
            borderSkipped: false,
            borderWidth: 0
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 10,
              grid: { color: '#f0f0f0', drawBorder: false },
              ticks: { font: { size: 11 } }
            },
            y: {
              grid: { display: false },
              ticks: { font: { size: 12 } }
            }
          }
        }
      });
    }
  }

  // ---------- UTILITAIRE : DEBOUNCE ----------
  function debounce(func, delay) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, delay);
    };
  }

})();
