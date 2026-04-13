/* ============================================================
   QUESTIONNAIRE.JS — Screen 1: Multi-step Onboarding Form
   ============================================================ */

'use strict';

// ============================================================
// CONFIG — Steps definition
// ============================================================
const STEPS = [
  {
    key:      'goal',
    type:     'options',
    required: true,
  },
  {
    key:      'activityLevel',
    type:     'options',
    required: true,
  },
  {
    key:      'equipment',
    type:     'options',
    required: true,
  },
  {
    key:      'daysPerWeek',
    type:     'days',
    required: true,   // always has default (3)
  },
  {
    key:      'injuries',
    type:     'textarea',
    required: false,  // optional — can skip
  },
  {
    key:      'age',
    type:     'number',
    required: true,
  },
  {
    key:      'biologicalSex',
    type:     'options',
    required: true,
  },
];

const TOTAL_STEPS = STEPS.length; // 7

// ============================================================
// DOM REFS (populated on DOMContentLoaded)
// ============================================================
let _stepEls    = [];
let _progressBar;
let _stepCount;
let _btnBack;
let _btnNext;
let _currentStep = 0;

// ============================================================
// INIT
// ============================================================
function initQuestionnaire() {
  const screen = document.getElementById('screen-questionnaire');
  if (!screen) return;

  _stepEls     = Array.from(screen.querySelectorAll('.q-step'));
  _progressBar = screen.querySelector('#q-progress-bar');
  _stepCount   = screen.querySelector('#q-step-count');
  _btnBack     = screen.querySelector('#btn-back');
  _btnNext     = screen.querySelector('#btn-next');

  if (!_stepEls.length) return;

  // ---- Bind option card clicks ----
  screen.querySelectorAll('.q-option').forEach(opt => {
    opt.addEventListener('click', () => _handleOptionClick(opt));
  });

  // ---- Days picker ----
  _initDaysPicker(screen);

  // ---- Textarea (injuries) ----
  _initTextarea(screen);

  // ---- Age number input ----
  _initAgeInput(screen);

  // ---- Nav buttons ----
  _btnBack.addEventListener('click', _goBack);
  _btnNext.addEventListener('click', _goNext);

  // ---- Keyboard shortcuts ----
  document.addEventListener('keydown', _handleKeydown);

  // ---- Restore any saved answers into UI ----
  _restoreAnswers();

  // ---- Initialise display ----
  _updateProgress();
  _updateNavState();
}

// ============================================================
// OPTION CARDS — Steps 1, 2, 3, 7
// ============================================================
function _handleOptionClick(optEl) {
  const stepEl = optEl.closest('.q-step');
  const stepIdx = parseInt(stepEl.dataset.step, 10);

  // Deselect siblings
  stepEl.querySelectorAll('.q-option').forEach(o => o.classList.remove('selected'));
  optEl.classList.add('selected');

  // Persist
  AppState.questionnaire[STEPS[stepIdx].key] = optEl.dataset.value;
  saveState();

  // Enable Next immediately
  _btnNext.disabled = false;

  // Auto-advance after brief pause (feels snappy but deliberate)
  setTimeout(() => {
    if (_currentStep < TOTAL_STEPS - 1) {
      _goNext();
    } else {
      _finishQuestionnaire();
    }
  }, 320);
}

// ============================================================
// DAYS PICKER — Step 4 (index 3)
// ============================================================
function _initDaysPicker(screen) {
  const dayBtns  = screen.querySelectorAll('.day-btn');
  const numEl    = screen.querySelector('#days-number');

  // Default = 3 (already in AppState)
  _highlightDay(dayBtns, AppState.questionnaire.daysPerWeek);

  dayBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const day = parseInt(btn.dataset.day, 10);

      _highlightDay(dayBtns, day);
      AppState.questionnaire.daysPerWeek = day;
      saveState();

      // Animate the big number
      if (numEl) {
        numEl.classList.add('bump');
        numEl.textContent = day;
        setTimeout(() => numEl.classList.remove('bump'), 200);
      }
    });
  });
}

function _highlightDay(btns, active) {
  btns.forEach(b => {
    b.classList.toggle('selected', parseInt(b.dataset.day, 10) === active);
  });
}

// ============================================================
// TEXTAREA — Step 5 (index 4)
// ============================================================
function _initTextarea(screen) {
  const ta       = screen.querySelector('#injuries-input');
  const countEl  = screen.querySelector('#q-char-count');
  const MAX      = 300;

  if (!ta) return;

  ta.addEventListener('input', () => {
    if (ta.value.length > MAX) ta.value = ta.value.slice(0, MAX);
    const len = ta.value.length;
    if (countEl) countEl.textContent = len;
    AppState.questionnaire.injuries = ta.value;
    saveState();
  });
}

// ============================================================
// AGE INPUT — Step 6 (index 5)
// ============================================================
function _initAgeInput(screen) {
  const input = screen.querySelector('#age-input');
  if (!input) return;

  const validate = () => {
    const raw = input.value.trim();
    if (raw === '') {
      AppState.questionnaire.age = null;
      _btnNext.disabled = (_currentStep === 5);
      return;
    }
    const val = clamp(parseInt(raw, 10), 13, 100);
    if (!isNaN(val)) {
      input.value = val;
      AppState.questionnaire.age = val;
      saveState();
      if (_currentStep === 5) _btnNext.disabled = false;
    }
  };

  input.addEventListener('input',  validate);
  input.addEventListener('change', validate);
}

// ============================================================
// NAVIGATION
// ============================================================
function _goNext() {
  if (_currentStep === TOTAL_STEPS - 1) {
    _finishQuestionnaire();
    return;
  }
  _goToStep(_currentStep + 1, 'forward');
}

function _goBack() {
  if (_currentStep > 0) _goToStep(_currentStep - 1, 'backward');
}

/**
 * Animate from currentStep → targetStep.
 * direction: 'forward' | 'backward'
 */
function _goToStep(target, direction) {
  const outgoing = _stepEls[_currentStep];
  const incoming = _stepEls[target];
  if (!outgoing || !incoming) return;

  // ---- Outgoing: slide out ----
  outgoing.classList.remove('active');
  outgoing.classList.add(direction === 'forward' ? 'exit-left' : 'exit-right');

  // Clean up outgoing classes after animation
  const clearOut = () => {
    outgoing.classList.remove('exit-left', 'exit-right');
    outgoing.removeEventListener('transitionend', clearOut);
  };
  outgoing.addEventListener('transitionend', clearOut, { once: true });

  // ---- Incoming: snap to start position without transition, then animate in ----
  incoming.style.transition = 'none';
  incoming.style.opacity    = '0';
  incoming.style.transform  = direction === 'forward' ? 'translateX(100%)' : 'translateX(-100%)';

  // Double rAF ensures the browser has painted the "off-screen" state
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      incoming.style.transition = '';
      incoming.style.opacity    = '';
      incoming.style.transform  = '';
      incoming.classList.add('active');
    });
  });

  _currentStep = target;
  _updateProgress();
  _updateNavState();
}

// ============================================================
// PROGRESS + NAV STATE
// ============================================================
function _updateProgress() {
  const pct = (((_currentStep + 1) / TOTAL_STEPS) * 100).toFixed(2);
  if (_progressBar)  _progressBar.style.width = `${pct}%`;
  if (_stepCount)    _stepCount.textContent    = `${_currentStep + 1} / ${TOTAL_STEPS}`;
}

function _updateNavState() {
  // Back visibility
  if (_btnBack) {
    _btnBack.style.visibility = _currentStep === 0 ? 'hidden' : 'visible';
  }

  // Next label
  if (_btnNext) {
    const isLast = _currentStep === TOTAL_STEPS - 1;
    _btnNext.innerHTML = isLast
      ? `Finish ${_chevronRight()}`
      : `Continue ${_chevronRight()}`;
    _btnNext.disabled = !_isCurrentStepAnswered();
  }
}

function _isCurrentStepAnswered() {
  const step = STEPS[_currentStep];
  if (!step.required) return true;            // optional steps always pass
  if (step.type === 'days') return true;       // days always has default

  const val = AppState.questionnaire[step.key];
  if (step.type === 'number') return val !== null && val !== undefined;
  if (step.type === 'options') return val !== null && val !== undefined;
  return true;
}

function _chevronRight() {
  return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.6"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

// ============================================================
// KEYBOARD SUPPORT
// ============================================================
function _handleKeydown(e) {
  if (getCurrentScreen() !== 'questionnaire') return;

  if (e.key === 'Enter' && !_btnNext.disabled) {
    // Don't fire on textarea
    if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') return;
    e.preventDefault();
    _goNext();
  }
}

// ============================================================
// RESTORE saved answers into UI on page load
// ============================================================
function _restoreAnswers() {
  const q = AppState.questionnaire;

  // Option selections
  document.querySelectorAll('.q-option').forEach(opt => {
    const stepEl  = opt.closest('.q-step');
    const stepIdx = parseInt(stepEl.dataset.step, 10);
    const key     = STEPS[stepIdx]?.key;
    if (key && q[key] === opt.dataset.value) {
      opt.classList.add('selected');
    }
  });

  // Days picker
  const dayBtns = document.querySelectorAll('.day-btn');
  _highlightDay(dayBtns, q.daysPerWeek);
  const numEl = document.querySelector('#days-number');
  if (numEl) numEl.textContent = q.daysPerWeek;

  // Textarea
  const ta = document.querySelector('#injuries-input');
  if (ta && q.injuries) {
    ta.value = q.injuries;
    const countEl = document.querySelector('#q-char-count');
    if (countEl) countEl.textContent = q.injuries.length;
  }

  // Age
  const ageInput = document.querySelector('#age-input');
  if (ageInput && q.age) ageInput.value = q.age;
}

// ============================================================
// COMPLETE QUESTIONNAIRE → navigate to Screen 2
// ============================================================
function _finishQuestionnaire() {
  // Flash the button
  _btnNext.classList.add('completing');
  setTimeout(() => _btnNext.classList.remove('completing'), 600);

  saveState();

  setTimeout(() => {
    navigateTo('coaches');
  }, 450);
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', initQuestionnaire);
