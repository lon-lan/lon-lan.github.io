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
// enters the viewport (wall headers, clip tiles, about section)
const revealEls = document.querySelectorAll('.reveal');

// Clip tiles carry a staggered reveal delay; once the reveal is done,
// mark them settled so hover transitions respond instantly
function settleClipTile(el) {
  if (!el.classList.contains('clip-tile')) return;
  el.addEventListener('transitionend', () => el.classList.add('is-settled'), { once: true });
}

if ('IntersectionObserver' in window && revealEls.length) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          settleClipTile(entry.target);
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => {
    el.classList.add('is-visible');
    if (el.classList.contains('clip-tile')) el.classList.add('is-settled');
  });
}

// Video walls (UGC, podcast, real estate) — muted preview on hover
// (desktop), tap opens a modal with sound (works for touch devices too,
// where hover doesn't apply)
const clipTiles = document.querySelectorAll('.clip-tile');
const clipModal = document.getElementById('clipModal');
const clipModalVideo = document.getElementById('clipModalVideo');
const clipModalTitle = document.getElementById('clipModalTitle');
const clipModalClose = clipModal ? clipModal.querySelector('.clip-modal-close') : null;
const canHover = window.matchMedia('(hover: hover)').matches;
let lastFocusedTile = null;

function pauseAllClipTiles() {
  clipTiles.forEach((tile) => {
    const v = tile.querySelector('video');
    if (v) { v.pause(); v.currentTime = 0; }
  });
}

function openClipModal(tile) {
  pauseAllClipTiles();
  lastFocusedTile = tile;
  clipModalVideo.src = tile.dataset.video;
  clipModalTitle.textContent = tile.dataset.title || '';
  clipModal.hidden = false;
  document.body.style.overflow = 'hidden';
  clipModalVideo.muted = false;
  clipModalVideo.play().catch(() => {});
  if (clipModalClose) clipModalClose.focus();
}

function closeClipModal() {
  clipModalVideo.pause();
  clipModalVideo.removeAttribute('src');
  clipModalVideo.load();
  clipModal.hidden = true;
  document.body.style.overflow = '';
  if (lastFocusedTile) lastFocusedTile.focus();
}

if (clipTiles.length && clipModal) {
  clipTiles.forEach((tile) => {
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

    tile.addEventListener('click', () => openClipModal(tile));
  });

  clipModal.querySelectorAll('[data-clip-close]').forEach((el) => {
    el.addEventListener('click', closeClipModal);
  });

  document.addEventListener('keydown', (e) => {
    if (clipModal.hidden) return;
    if (e.key === 'Escape') closeClipModal();
    // Keep keyboard focus inside the dialog: only the close button and
    // the video controls are focusable
    if (e.key === 'Tab') {
      const focusables = [clipModalClose, clipModalVideo];
      const i = focusables.indexOf(document.activeElement);
      if (i === -1) { e.preventDefault(); clipModalClose.focus(); return; }
      const next = e.shiftKey ? (i + focusables.length - 1) % focusables.length : (i + 1) % focusables.length;
      e.preventDefault();
      focusables[next].focus();
    }
  });
}
