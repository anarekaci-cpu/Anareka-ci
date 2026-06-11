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
  nav.classList.toggle('scrolled', window.scrollY > 60);
  backTop.classList.toggle('show', window.scrollY > 300);
});

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
const V = '#1a3d2b', V2 = '#2d6b4f', OR = '#c9a84c', OR2 = '#e8c97a';
Chart.defaults.font.family = "'Outfit', sans-serif";
Chart.defaults.color = '#888';

new Chart(document.getElementById('chartEvol'), {
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

new Chart(document.getElementById('chartMembres'), {
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

new Chart(document.getElementById('chartDomaines'), {
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

new Chart(document.getElementById('chartAxes'), {
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

/* ===== CARROUSEL ÉVÉNEMENTS ===== */
(function(){
  const track   = document.getElementById('carrouselTrack');
  const slides  = document.querySelectorAll('.carr-slide');
  const dots    = document.querySelectorAll('.carr-dot');
  const thumbs  = document.querySelectorAll('.carr-thumb');
  const btnPrev = document.getElementById('carrPrev');
  const btnNext = document.getElementById('carrNext');
  const counter = document.getElementById('carrCurrent');
  if(!track) return;

  let current = 0;
  let timer;
  const total = slides.length;

  function goTo(n) {
    // Wrap around
    current = (n + total) % total;

    // Déplacer le track
    track.style.transform = `translateX(-${current * 100}%)`;

    // Activer slide
    slides.forEach((s,i) => s.classList.toggle('active', i === current));

    // Dots
    dots.forEach((d,i) => d.classList.toggle('active', i === current));

    // Thumbs
    thumbs.forEach((t,i) => t.classList.toggle('active', i === current));

    // Compteur
    counter.textContent = current + 1;

    // Scroll thumb visible
    if(thumbs[current]) {
      thumbs[current].scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
    }

    resetTimer();
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 5000);
  }

  // Init
  slides[0].classList.add('active');
  thumbs[0].classList.add('active');

  // Boutons
  btnPrev.addEventListener('click', () => goTo(current - 1));
  btnNext.addEventListener('click', () => goTo(current + 1));

  // Dots
  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.i)));

  // Thumbs
  thumbs.forEach(t => t.addEventListener('click', () => goTo(+t.dataset.i)));

  // Swipe tactile
  let startX = 0;
  track.addEventListener('touchstart', e => startX = e.touches[0].clientX, {passive:true});
  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if(Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
  });

  // Pause au survol
  track.closest('.carrousel-wrap').addEventListener('mouseenter', () => clearInterval(timer));
  track.closest('.carrousel-wrap').addEventListener('mouseleave', () => resetTimer());

  // Clavier
  document.addEventListener('keydown', e => {
    if(e.key === 'ArrowLeft')  goTo(current - 1);
    if(e.key === 'ArrowRight') goTo(current + 1);
  });

  resetTimer();
})();
