/* ============================================================
   COACHES.JS — Screen 2: AI Coach Recommendation
   ============================================================ */

'use strict';

// ============================================================
// COACH DEFINITIONS
// ============================================================
const COACHES = {
  grinder: {
    id:        'grinder',
    name:      'The Grinder',
    specialty: 'Strength & Hypertrophy',
    blurb:     'Relentless. Direct. Zero excuses. I program you to add plates every single week and build a physique that commands respect. We lift heavy, we recover right, and we grow.',
    traits:    ['Heavy Lifting', 'Progressive Overload', 'Hypertrophy'],
    avatar:    'A',
  },
  pacer: {
    id:        'pacer',
    name:      'The Pacer',
    specialty: 'Endurance & Cardio',
    blurb:     "Steady wins the race. I build your aerobic engine through smart periodisation and strategic pacing. Whether it's your first 5K or an ultra, I'll get you there without burning out.",
    traits:    ['Cardiovascular Fitness', 'Zone 2 Training', 'Periodisation'],
    avatar:    'B',
  },
  coach: {
    id:        'coach',
    name:      'The Coach',
    specialty: 'Balanced General Fitness',
    blurb:     'The full package. I blend strength, cardio, and mobility into a sustainable program that evolves as you do. Perfect for those who want everything — and the discipline to get there.',
    traits:    ['Balanced Training', 'Mobility & Recovery', 'Long-Term Gains'],
    avatar:    'C',
  },
};

// Status messages cycled during the loading animation
const LOADING_MESSAGES = [
  'Matching you with the right coach\u2026',
  'Building your fitness profile\u2026',
  'Calibrating training intensity\u2026',
  'Almost ready\u2026',
];

// ============================================================
// MODULE STATE
// ============================================================
let _loadingTimer    = null;
let _msgTimer        = null;
let _msgIndex        = 0;

// ============================================================
// INIT — runs once on DOMContentLoaded
// ============================================================
function initCoaches() {
  // Register lifecycle hook — fired each time we navigate TO coaches
  onScreenEnter('coaches', _onEnter);

  // Back button
  const backBtn = document.getElementById('coaches-btn-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('questionnaire', 'backward'));
  }

  // "Choose" buttons on each card
  document.querySelectorAll('.coach-choose-btn').forEach(btn => {
    btn.addEventListener('click', () => _handleChoose(btn.dataset.coach));
  });
}

// ============================================================
// SCREEN ENTER LIFECYCLE
// Called ~80ms after the screen transition begins
// ============================================================
function _onEnter() {
  _reset();

  // ---- Work out the recommendation ----
  const recommended = deriveRecommendedCoach();
  AppState.selectedCoach = recommended;
  saveState();

  // ---- Update intro copy ----
  const recNameEl = document.getElementById('coaches-rec-name');
  if (recNameEl) recNameEl.textContent = COACHES[recommended]?.name ?? 'The Coach';

  // ---- Mark recommended card ----
  _applyRecommended(recommended);

  // ---- Start message cycling ----
  _startLoadingMessages();

  // ---- Schedule phase transition ----
  _loadingTimer = setTimeout(_revealCards, 2300);
}

// ============================================================
// RESET — put the screen back to loading state
// (important when user navigates back then forward again)
// ============================================================
function _reset() {
  // Clear any in-flight timers
  clearTimeout(_loadingTimer);
  clearInterval(_msgTimer);
  _msgIndex = 0;

  // Reset loading overlay
  const loadingEl = document.getElementById('coaches-loading');
  if (loadingEl) loadingEl.classList.remove('fade-out');

  // Reset sub-text
  const subEl = document.getElementById('loading-sub');
  if (subEl) {
    subEl.textContent = LOADING_MESSAGES[0];
    subEl.classList.remove('swapping');
  }

  // Reset reveal area
  const revealEl = document.getElementById('coaches-reveal');
  if (revealEl) revealEl.classList.remove('is-visible');

  // Reset cards
  document.querySelectorAll('.coach-card').forEach(card => {
    card.classList.remove('card-in', 'recommended', 'chosen');
  });
}

// ============================================================
// LOADING MESSAGE CYCLE
// ============================================================
function _startLoadingMessages() {
  const subEl = document.getElementById('loading-sub');
  if (!subEl) return;

  // Set first message immediately
  subEl.textContent = LOADING_MESSAGES[0];
  _msgIndex = 0;

  _msgTimer = setInterval(() => {
    _msgIndex = (_msgIndex + 1) % LOADING_MESSAGES.length;

    // Fade out → swap text → fade in
    subEl.classList.add('swapping');
    setTimeout(() => {
      subEl.textContent = LOADING_MESSAGES[_msgIndex];
      subEl.classList.remove('swapping');
    }, 230);
  }, 700);
}

// ============================================================
// APPLY RECOMMENDED STATE
// ============================================================
function _applyRecommended(coachId) {
  document.querySelectorAll('.coach-card').forEach(card => {
    const isRec = card.dataset.coach === coachId;
    card.classList.toggle('recommended', isRec);

    const badge = card.querySelector('.coach-badge-rec');
    if (badge) badge.hidden = !isRec;
  });
}

// ============================================================
// PHASE TRANSITION — loading → cards
// ============================================================
function _revealCards() {
  clearInterval(_msgTimer);

  // 1. Fade out the loading overlay
  const loadingEl = document.getElementById('coaches-loading');
  if (loadingEl) loadingEl.classList.add('fade-out');

  // 2. After overlay fades, show the reveal area + stagger cards
  setTimeout(() => {
    const revealEl = document.getElementById('coaches-reveal');
    if (revealEl) revealEl.classList.add('is-visible');

    // Trigger stagger entry on each card
    document.querySelectorAll('.coach-card').forEach(card => {
      card.classList.add('card-in');
    });
  }, 380);
}

// ============================================================
// CHOOSE A COACH
// ============================================================
function _handleChoose(coachId) {
  if (!coachId || !COACHES[coachId]) return;

  // Deselect all cards, select the chosen one
  document.querySelectorAll('.coach-card').forEach(card => {
    card.classList.remove('recommended', 'chosen');
    if (card.dataset.coach === coachId) {
      card.classList.add('chosen');
    }
  });

  // Persist selection
  AppState.selectedCoach = coachId;
  saveState();

  // Brief scale-up pulse on the chosen card before navigating
  const chosenCard = document.querySelector(`.coach-card[data-coach="${coachId}"]`);
  if (chosenCard) {
    chosenCard.style.transition = 'transform 0.14s var(--ease-spring), box-shadow 0.14s ease';
    chosenCard.style.transform  = 'scale(1.04)';

    setTimeout(() => {
      chosenCard.style.transform  = '';
      chosenCard.style.transition = '';
    }, 180);
  }

  // Navigate to sign-up
  setTimeout(() => navigateTo('auth'), 440);
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', initCoaches);
