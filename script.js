/* ===== PARTICLES ===== */
(function(){
  const c = document.getElementById('particles');
  if(!c) return;
  for(let i=0;i<18;i++){
    const d = document.createElement('div');
    d.className = 'particle';
    const s = Math.random()*40+10;
    d.style.cssText = `width:${s}px;height:${s}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*4}s;animation-duration:${3+Math.random()*4}s;opacity:${Math.random()*.5+.1}`;
    c.appendChild(d);
  }
})();

/* ===== NAV SCROLL + BACK TO TOP ===== */
const nav     = document.getElementById('mainNav');
const backTop = document.getElementById('backTop');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
  backTop.classList.toggle('show', window.scrollY > 300);
});

/* ===== REVEAL ON SCROLL ===== */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal, .reveal-left').forEach(el => observer.observe(el));

/* ===== COUNTER ANIMATION ===== */
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const dur = 1800;
  const startTime = performance.now();
  function step(now) {
    const p    = Math.min((now - startTime) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * ease) + suffix;
    if(p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting){
      e.target.querySelectorAll('[data-target]').forEach(el => animateCounter(el));
      counterObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.chiffres-band').forEach(el => counterObs.observe(el));

/* ===== CHARTS ===== */
const V = '#1a3d2b', V2 = '#2d6b4f', OR = '#b8860b', OR2 = '#c8960f', OR3 = '#f0c040';
Chart.defaults.font.family = "'Source Sans 3', sans-serif";
Chart.defaults.color = '#666';

new Chart(document.getElementById('chartEvol'), {
  type: 'line',
  data: {
    labels: ['1996','1998','2000','2005','2010','2015','2020','2025','2026'],
    datasets: [{
      label: 'Développement',
      data: [10,15,22,35,50,65,75,90,100],
      borderColor: V, backgroundColor: 'rgba(26,61,43,0.07)',
      borderWidth: 2.5,
      pointBackgroundColor: [V,V,V,V,V,V,V,OR,OR3],
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
    labels: ['Restaurateurs','Kiosques fixes','Producteurs','Vendeurs','Gestionnaires'],
    datasets: [{ data: [35,28,18,12,7], backgroundColor: [V,OR,V2,OR2,OR3], borderWidth: 3, borderColor: '#fff' }]
  },
  options: {
    responsive: true, maintainAspectRatio: false, cutout: '62%',
    plugins: { legend: { position: 'bottom', labels: { font:{size:11}, padding:12, boxWidth:12 } } }
  }
});

new Chart(document.getElementById('chartDomaines'), {
  type: 'doughnut',
  data: {
    labels: ['Formation','Hygiène','Promotion','Défense droits','Partenariats'],
    datasets: [{ data: [30,20,20,15,15], backgroundColor: [OR,V,V2,OR2,OR3], borderWidth: 3, borderColor: '#fff' }]
  },
  options: {
    responsive: true, maintainAspectRatio: false, cutout: '62%',
    plugins: { legend: { position: 'bottom', labels: { font:{size:11}, padding:12, boxWidth:12 } } }
  }
});

new Chart(document.getElementById('chartAxes'), {
  type: 'bar',
  data: {
    labels: ['Structuration filière','Emploi jeunes & femmes','Qualité produit','Promotion nationale','Hygiène & salubrité','Partenariats'],
    datasets: [{
      data: [9,8,9,7,8,7],
      backgroundColor: [V,OR,V,OR,V2,OR2],
      borderRadius: 4, borderSkipped: false
    }]
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
