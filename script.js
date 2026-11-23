const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Footer year + hero stats, so the numbers never drift from the page
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const filmsEl = document.querySelector('[data-stat="films"]');
const wallsEl = document.querySelector('[data-stat="walls"]');
if (filmsEl) filmsEl.textContent = document.querySelectorAll('.clip-tile').length;
if (wallsEl) wallsEl.textContent = document.querySelectorAll('.wall').length;

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

// Highlight the nav link of the section currently in view
if ('IntersectionObserver' in window && navSheet) {
  const navLinks = new Map();
  navSheet.querySelectorAll('a[href^="#"]').forEach((a) => {
    navLinks.set(a.getAttribute('href').slice(1), a);
  });

  const setCurrent = (id) => {
    navLinks.forEach((a, key) => {
      if (key === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setCurrent(entry.target.id);
        else if (navLinks.get(entry.target.id)?.hasAttribute('aria-current')) setCurrent(null);
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  navLinks.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) sectionObserver.observe(section);
  });
}

// Scroll reveal — fade each .reveal element up once, the first time it
// enters the viewport (wall headers, clip tiles, services, about, contact)
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

// Hero reel — loops muted while on screen; paused for reduced motion
const reel = document.querySelector('.reel');
const reelVideo = reel ? reel.querySelector('video') : null;
let reelOnScreen = false;

function syncReel() {
  if (!reelVideo || prefersReducedMotion) return;
  if (reelOnScreen && clipModal.hidden) reelVideo.play().catch(() => {});
  else reelVideo.pause();
}

// Video walls (UGC, podcast, real estate) — muted preview on hover
// (desktop), tap opens a modal with sound (works for touch devices too,
// where hover doesn't apply). The hero reel opens the same modal.
const clipTiles = document.querySelectorAll('.clip-tile');
const clipModal = document.getElementById('clipModal');
const clipModalVideo = document.getElementById('clipModalVideo');
const clipModalTitle = document.getElementById('clipModalTitle');
const clipModalNav = document.getElementById('clipModalNav');
const clipModalCount = document.getElementById('clipModalCount');
const clipPrev = document.getElementById('clipPrev');
const clipNext = document.getElementById('clipNext');
const clipModalClose = clipModal ? clipModal.querySelector('.clip-modal-close') : null;
const canHover = window.matchMedia('(hover: hover)').matches;
let lastFocusedTile = null;
let currentGroup = [];
let currentIndex = 0;

if ('IntersectionObserver' in window && reel) {
  new IntersectionObserver((entries) => {
    reelOnScreen = entries[0].isIntersecting;
    syncReel();
  }).observe(reel);
}

function pauseAllClipTiles() {
  clipTiles.forEach((tile) => {
    const v = tile.querySelector('video');
    if (v) { v.pause(); v.currentTime = 0; }
  });
}

// The clips a trigger can step through: its own wall, or just itself
function groupFor(trigger) {
  const grid = trigger.closest('.clip-grid');
  return grid ? Array.from(grid.querySelectorAll('.clip-tile')) : [trigger];
}

function showClip(index) {
  const group = currentGroup;
  currentIndex = (index + group.length) % group.length;
  const tile = group[currentIndex];
  const label = (tile.closest('[data-label]') || tile).dataset.label || '';

  clipModalVideo.src = tile.dataset.video;
  clipModalTitle.textContent = tile.dataset.title || '';
  clipModalNav.hidden = group.length < 2;
  clipModalCount.textContent = group.length > 1
    ? `${label} · ${currentIndex + 1} / ${group.length}`
    : '';
  clipModalVideo.muted = false;
  clipModalVideo.play().catch(() => {});
}

function openClipModal(trigger) {
  pauseAllClipTiles();
  lastFocusedTile = trigger;
  currentGroup = groupFor(trigger);
  clipModal.hidden = false;
  document.body.style.overflow = 'hidden';
  showClip(Math.max(0, currentGroup.indexOf(trigger)));
  syncReel();
  if (clipModalClose) clipModalClose.focus();
}

function closeClipModal() {
  clipModalVideo.pause();
  clipModalVideo.removeAttribute('src');
  clipModalVideo.load();
  clipModal.hidden = true;
  document.body.style.overflow = '';
  syncReel();
  if (lastFocusedTile) lastFocusedTile.focus();
}

if (clipModal) {
  const triggers = [...clipTiles, ...(reel ? [reel] : [])];

  triggers.forEach((trigger) => {
    const video = trigger.querySelector('video');

    // Hover preview is for wall tiles only; the reel loops on its own
    if (canHover && video && trigger.classList.contains('clip-tile')) {
      trigger.addEventListener('mouseenter', () => {
        video.currentTime = 0;
        video.play().catch(() => {});
      });
      trigger.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
      });
    }

    trigger.addEventListener('click', () => openClipModal(trigger));
  });

  clipModal.querySelectorAll('[data-clip-close]').forEach((el) => {
    el.addEventListener('click', closeClipModal);
  });

  clipPrev.addEventListener('click', () => showClip(currentIndex - 1));
  clipNext.addEventListener('click', () => showClip(currentIndex + 1));

  document.addEventListener('keydown', (e) => {
    if (clipModal.hidden) return;
    if (e.key === 'Escape') closeClipModal();
    if (currentGroup.length > 1 && document.activeElement !== clipModalVideo) {
      if (e.key === 'ArrowLeft') showClip(currentIndex - 1);
      if (e.key === 'ArrowRight') showClip(currentIndex + 1);
    }
    // Keep keyboard focus inside the dialog: close, prev/next and the
    // video controls are the only focusable things
    if (e.key === 'Tab') {
      const focusables = [clipModalClose, clipModalVideo];
      if (!clipModalNav.hidden) focusables.splice(1, 0, clipPrev, clipNext);
      const i = focusables.indexOf(document.activeElement);
      if (i === -1) { e.preventDefault(); clipModalClose.focus(); return; }
      const next = e.shiftKey ? (i + focusables.length - 1) % focusables.length : (i + 1) % focusables.length;
      e.preventDefault();
      focusables[next].focus();
    }
  });
}
