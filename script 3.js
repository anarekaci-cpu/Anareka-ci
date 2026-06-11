/* ===== PARTICLES ===== */
(function(){
  const c = document.querySelector('.hero');
  if(!c) return;
  for(let i=0;i<14;i++){
    const d = document.createElement('div');
    const s = Math.random()*50+10;
    d.style.cssText = `position:absolute;border-radius:50%;width:${s}px;height:${s}px;left:${Math.random()*100}%;top:${Math.random()*100}%;background:rgba(201,168,76,0.06);animation:float ${4+Math.random()*5}s ease-in-out ${Math.random()*4}s infinite;pointer-events:none;`;
    c.appendChild(d);
  }
})();

/* ===== NAV SCROLL ===== */
const nav = document.getElementById('mainNav');
const backTop = document.getElementById('backTop');
window.addEventListener('scroll', () => {
  if(nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  if(backTop) backTop.classList.toggle('show', window.scrollY > 300);
});

/* ===== MENU MOBILE (hamburger) ===== */
(function(){
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if(!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', open);
  });

  // Refermer le menu après un clic sur un lien
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
  }));
})();

/* ===== REVEAL ===== */
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('on'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal, .reveal-l').forEach(el => obs.observe(el));

/* ===== COUNTER ===== */
function counter(el) {
  const target = parseInt(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const dur = 1800, start = performance.now();
  const run = (now) => {
    const p = Math.min((now-start)/dur, 1);
    const ease = 1 - Math.pow(1-p, 3);
    el.textContent = Math.round(target * ease) + suffix;
    if(p < 1) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}
const cObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting){
      e.target.querySelectorAll('[data-target]').forEach(el => {
        if(parseInt(el.dataset.target) !== 1996) counter(el);
      });
      cObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.chiffres').forEach(el => cObs.observe(el));

/* ===== CHARTS ===== */
(function(){
  // Si Chart.js n'a pas pu se charger, on s'arrête ici sans casser le reste du site.
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js non chargé — les graphiques sont ignorés.');
    return;
  }

  const V = '#1a3d2b', V2 = '#2d6b4f', OR = '#c9a84c', OR2 = '#e8c97a';
  Chart.defaults.font.family = "'Outfit', sans-serif";
  Chart.defaults.color = '#888';

  // Crée un graphique uniquement si le <canvas> existe, et isole les erreurs.
  function makeChart(id, config){
    const el = document.getElementById(id);
    if(!el) return;
    try { new Chart(el, config); }
    catch(err){ console.warn('Graphique "' + id + '" non rendu :', err); }
  }

  makeChart('chartEvol', {
    type: 'line',
    data: {
      labels: ['1996','1998','2000','2005','2010','2015','2020','2025','2026'],
      datasets: [{
        data: [10,15,22,35,50,65,75,90,100],
        borderColor: V, backgroundColor: 'rgba(26,61,43,0.06)',
        borderWidth: 2.5, pointBackgroundColor: [V,V,V,V,V,V,V,OR,OR2],
        pointRadius: 5, fill: true, tension: 0.4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { display: false }, x: { grid: { display: false } } }
    }
  });

  makeChart('chartMembres', {
    type: 'doughnut',
    data: {
      labels: ['Restaurateurs','Kiosques','Producteurs','Vendeurs','Gestionnaires'],
      datasets: [{ data: [35,28,18,12,7], backgroundColor: [V,OR,V2,OR2,'#5a9a78'], borderWidth: 3, borderColor: '#fff' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '62%',
      plugins: { legend: { position: 'bottom', labels: { font:{size:11}, padding:12, boxWidth:12 } } }
    }
  });

  makeChart('chartDomaines', {
    type: 'doughnut',
    data: {
      labels: ['Formation','Hygiène','Promotion','Défense','Partenariats'],
      datasets: [{ data: [30,20,20,15,15], backgroundColor: [OR,V,V2,OR2,'#5a9a78'], borderWidth: 3, borderColor: '#fff' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '62%',
      plugins: { legend: { position: 'bottom', labels: { font:{size:11}, padding:12, boxWidth:12 } } }
    }
  });

  makeChart('chartAxes', {
    type: 'bar',
    data: {
      labels: ['Structuration','Emploi jeunes/femmes','Qualité produit','Promotion','Hygiène','Partenariats'],
      datasets: [{ data: [9,8,9,7,8,7], backgroundColor: [V,OR,V,OR,V2,OR2], borderRadius: 4, borderSkipped: false }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, max: 10, grid: { color: '#f0f0f0' }, ticks: { font:{size:11} } },
        y: { grid: { display: false }, ticks: { font:{size:12} } }
      }
    }
  });
})();

/* ===== FORMULAIRE ADHÉSION ===== */
(function(){
  const form = document.getElementById('adhesionForm');
  const success = document.getElementById('formSuccess');
  if(!form) return;

  /* ----------------------------------------------------------------
     POUR RECEVOIR LES DEMANDES AUTOMATIQUEMENT (recommandé) :
     1. Crée un formulaire gratuit sur https://formspree.io
     2. Colle l'URL fournie (ex: https://formspree.io/f/abcdwxyz) ci-dessous.
     Tant que FORM_ENDPOINT est vide, le site ouvre la messagerie de
     l'utilisateur pré-remplie vers CONTACT_EMAIL (aucune donnée perdue).
  ---------------------------------------------------------------- */
  const FORM_ENDPOINT = '';
  const CONTACT_EMAIL = 'anarekaci@gmail.com';

  function afficherSucces(message){
    const p = success.querySelector('p');
    if(message && p) p.textContent = message;
    form.style.display = 'none';
    success.style.display = 'block';
  }

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const btn   = form.querySelector('.form-submit');
    const label = btn.querySelector('span');
    const texteInitial = label ? label.textContent : '';
    btn.disabled = true;
    if(label) label.textContent = 'Envoi en cours...';

    const data = new FormData(form);

    // 1) Envoi automatique si un endpoint Formspree est configuré
    if(FORM_ENDPOINT){
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: data
        });
        if(res.ok){ afficherSucces(); return; }
        throw new Error('HTTP ' + res.status);
      } catch(err){
        console.warn('Envoi automatique échoué, ouverture de la messagerie :', err);
        // on bascule sur le fallback ci-dessous
      }
    }

    // 2) Fallback universel : ouverture de la messagerie pré-remplie
    const champs = {
      'Nom'              : data.get('nom'),
      'Téléphone'        : data.get('tel'),
      'E-mail'           : data.get('email'),
      'Ville / Quartier' : data.get('ville'),
      "Type d'activité"  : data.get('activite'),
      'Établissement'    : data.get('etablissement'),
      'Message'          : data.get('message')
    };
    let corps = "Demande d'adhésion ANAREKA-CI\n\n";
    for(const [cle, val] of Object.entries(champs)){
      corps += cle + ' : ' + (val || '—') + '\n';
    }
    const lien = 'mailto:' + CONTACT_EMAIL
      + '?subject=' + encodeURIComponent("Demande d'adhésion — " + (data.get('nom') || ''))
      + '&body='    + encodeURIComponent(corps);
    window.location.href = lien;

    afficherSucces("Votre messagerie va s'ouvrir avec votre demande pré-remplie. Cliquez sur « Envoyer » pour finaliser votre adhésion.");

    // On réactive le bouton au cas où l'utilisateur revient en arrière
    btn.disabled = false;
    if(label) label.textContent = texteInitial;
  });
})();

/* ===== BOUTON FLOTTANT — masquer en haut de page ===== */
(function(){
  const btn = document.getElementById('btnFloat');
  if(!btn) return;
  window.addEventListener('scroll', () => {
    btn.style.opacity = window.scrollY > 200 ? '1' : '0';
    btn.style.pointerEvents = window.scrollY > 200 ? 'auto' : 'none';
  });
  btn.style.opacity = '0';
})();
