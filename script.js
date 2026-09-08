// Mobile nav sheet
const navToggle = document.getElementById('navToggle');
const navSheet = document.getElementById('navSheet');

if (navToggle && navSheet) {
  navToggle.addEventListener('click', () => {
    const open = navSheet.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  navSheet.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navSheet.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Scroll reveal — fade each .reveal element up once, the first time it
// enters the viewport (reel rows, about section)
const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && revealEls.length) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

// Reel accordion — only one film open at a time, video pauses when collapsed
document.querySelectorAll('.reel-item').forEach((item) => {
  const trigger = item.querySelector('.reel-trigger');
  const video = item.querySelector('video');

  trigger.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');

    document.querySelectorAll('.reel-item.is-open').forEach((openItem) => {
      if (openItem !== item) {
        openItem.classList.remove('is-open');
        openItem.querySelector('.reel-trigger').setAttribute('aria-expanded', 'false');
        const openVideo = openItem.querySelector('video');
        if (openVideo) openVideo.pause();
      }
    });

    item.classList.toggle('is-open', !isOpen);
    trigger.setAttribute('aria-expanded', String(!isOpen));
    if (isOpen && video) video.pause();
  });
});

// UGC wall — muted preview on hover (desktop), tap opens a modal
// with sound (works for touch devices too, where hover doesn't apply)
const ugcTiles = document.querySelectorAll('.ugc-tile');
const ugcModal = document.getElementById('ugcModal');
const ugcModalVideo = document.getElementById('ugcModalVideo');
const ugcModalTitle = document.getElementById('ugcModalTitle');
const canHover = window.matchMedia('(hover: hover)').matches;

function pauseAllUgcTiles() {
  ugcTiles.forEach((tile) => {
    const v = tile.querySelector('video');
    if (v) { v.pause(); v.currentTime = 0; }
  });
}

function openUgcModal(src, title) {
  pauseAllUgcTiles();
  ugcModalVideo.src = src;
  ugcModalTitle.textContent = title || '';
  ugcModal.hidden = false;
  document.body.style.overflow = 'hidden';
  ugcModalVideo.currentTime = 0;
  ugcModalVideo.muted = false;
  ugcModalVideo.play().catch(() => {});
}

function closeUgcModal() {
  ugcModalVideo.pause();
  ugcModalVideo.removeAttribute('src');
  ugcModalVideo.load();
  ugcModal.hidden = true;
  document.body.style.overflow = '';
}

if (ugcTiles.length && ugcModal) {
  ugcTiles.forEach((tile) => {
    const video = tile.querySelector('video');

    if (canHover && video) {
      tile.addEventListener('mouseenter', () => {
        video.currentTime = 0;
        video.play().catch(() => {});
      });
      tile.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
      });
    }

    tile.addEventListener('click', () => {
      openUgcModal(tile.dataset.video, tile.dataset.title);
    });
  });

  ugcModal.querySelectorAll('[data-ugc-close]').forEach((el) => {
    el.addEventListener('click', closeUgcModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !ugcModal.hidden) closeUgcModal();
  });
}
