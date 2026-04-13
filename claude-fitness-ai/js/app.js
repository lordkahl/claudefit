/* ============================================================
   APP.JS — Core State, SPA Router, Utilities
   APEX Fitness AI Coach
   ============================================================ */

'use strict';

// ============================================================
// GLOBAL APP STATE
// ============================================================
const AppState = {
  questionnaire: {
    goal:          null,   // 'lose_weight' | 'build_muscle' | 'improve_endurance' | 'general_fitness'
    activityLevel: null,   // 'sedentary' | 'lightly_active' | 'very_active'
    equipment:     null,   // 'none' | 'home_gym' | 'full_gym'
    daysPerWeek:   3,      // 1–7, default 3
    injuries:      '',     // free text (optional)
    age:           null,   // integer 13–100
    biologicalSex: null,   // 'male' | 'female' | 'prefer_not_to_say'
  },
  selectedCoach: null,     // 'grinder' | 'pacer' | 'coach'
  user: {
    name:       '',
    email:      '',
    authMethod: null,      // 'email' | 'wallet'
  },
};

// ============================================================
// SPA ROUTER
// ============================================================
const SCREEN_ORDER = ['questionnaire', 'coaches', 'auth', 'dashboard'];
let _currentScreen = 'questionnaire';

// Screen-enter lifecycle handlers — registered by each module
const _enterHandlers = {};

/**
 * Register a callback to fire each time a screen is navigated TO.
 * @param {string}   screenId
 * @param {Function} fn
 */
function onScreenEnter(screenId, fn) {
  _enterHandlers[screenId] = fn;
}

/**
 * Navigate to a screen by id.
 * @param {string} screenId  — one of SCREEN_ORDER values
 * @param {'forward'|'backward'} [dir]
 */
function navigateTo(screenId, dir = 'forward') {
  if (screenId === _currentScreen) return;

  const fromEl = document.getElementById(`screen-${_currentScreen}`);
  const toEl   = document.getElementById(`screen-${screenId}`);
  if (!fromEl || !toEl) { console.warn(`[APEX] Screen not found: screen-${screenId}`); return; }

  // ---- Exit current screen ----
  fromEl.classList.remove('active');
  fromEl.classList.add(dir === 'forward' ? 'exit-left' : 'exit-right');

  fromEl.addEventListener('transitionend', () => {
    fromEl.classList.remove('exit-left', 'exit-right');
  }, { once: true });

  // ---- Enter new screen ----
  requestAnimationFrame(() => {
    toEl.classList.add('active');
  });

  _currentScreen = screenId;

  // ---- Fire lifecycle hook ----
  if (_enterHandlers[screenId]) {
    // Slight delay so the screen transition has started before we trigger inner animations
    setTimeout(() => _enterHandlers[screenId](), 80);
  }
}

function getCurrentScreen() { return _currentScreen; }

// ============================================================
// PERSISTENCE
// ============================================================
const STORAGE_KEY = 'apex_v1';

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState));
  } catch (e) {
    console.warn('[APEX] localStorage unavailable:', e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.keys(saved).forEach(k => {
      if (k in AppState) {
        if (typeof AppState[k] === 'object' && AppState[k] !== null) {
          Object.assign(AppState[k], saved[k]);
        } else {
          AppState[k] = saved[k];
        }
      }
    });
  } catch (e) {
    console.warn('[APEX] Could not restore state:', e);
  }
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Derive recommended coach from questionnaire answers.
 * @returns {'grinder'|'pacer'|'coach'}
 */
function deriveRecommendedCoach() {
  const { goal, activityLevel } = AppState.questionnaire;
  if (goal === 'build_muscle')        return 'grinder';
  if (goal === 'improve_endurance')   return 'pacer';
  if (goal === 'lose_weight') {
    return activityLevel === 'very_active' ? 'pacer' : 'coach';
  }
  return 'coach'; // general_fitness or fallback
}

/** Clamp a number between min and max */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
});
