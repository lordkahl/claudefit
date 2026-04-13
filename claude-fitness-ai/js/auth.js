/* ============================================================
   AUTH.JS — Screen 3: Sign Up (Email + Wallet)
   ============================================================ */

'use strict';

// ============================================================
// CONSTANTS
// ============================================================
const COACH_LABELS = {
  grinder: 'The Grinder',
  pacer:   'The Pacer',
  coach:   'The Coach',
};

// Simulated wallet addresses for the placeholder flow
const MOCK_WALLETS = [
  '0x4aF3…d19C',
  '0x7B2e…88aA',
  '0xC3d1…f047',
  '0x91bE…3C5f',
];

// Inline SVG for password-visibility toggle
const SVG_EYE = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
  <ellipse cx="8" cy="8" rx="6.5" ry="4.5" stroke="currentColor" stroke-width="1.3"/>
  <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.3"/>
</svg>`;

const SVG_EYE_OFF = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
  <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M6.3 3.6A6.8 6.8 0 0 1 8 3.5c3.5 0 6 4.5 6 4.5s-.8 1.6-2.3 2.9M4.3 5.3C3 6.3 2 8 2 8s2.5 4.5 6 4.5c1.1 0 2.1-.3 3-.9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
</svg>`;

// ============================================================
// INIT — runs once on DOMContentLoaded
// ============================================================
function initAuth() {
  onScreenEnter('auth', _onEnter);

  // Back button → coaches
  const backBtn = document.getElementById('auth-btn-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('coaches', 'backward'));
  }

  _bindEmailForm();
  _bindWalletButtons();
}

// ============================================================
// SCREEN ENTER LIFECYCLE
// ============================================================
function _onEnter() {
  // ---- Update coach pill ----
  const pillName = document.getElementById('auth-coach-name');
  if (pillName) {
    pillName.textContent = COACH_LABELS[AppState.selectedCoach] ?? 'Your Coach';
  }

  // ---- Reset wallet section ----
  _resetWalletUI();

  // ---- Reset email form to pristine state ----
  _resetEmailForm();
}

// ============================================================
// EMAIL FORM
// ============================================================
function _bindEmailForm() {
  const nameEl  = document.getElementById('field-name');
  const emailEl = document.getElementById('field-email');
  const passEl  = document.getElementById('field-password');
  const submitEl = document.getElementById('email-submit');
  const toggleEl = document.getElementById('pw-toggle');
  const form     = document.getElementById('email-form');

  if (!form) return;

  // ---- Real-time validation as user types ----
  nameEl?.addEventListener('input',  () => { _checkName(nameEl, false);  _syncSubmit(); });
  emailEl?.addEventListener('input', () => { _checkEmail(emailEl, false); _syncSubmit(); });
  passEl?.addEventListener('input',  () => {
    _checkPass(passEl, false);
    _renderStrength(passEl.value);
    _syncSubmit();
  });

  // ---- Blur → show errors if invalid ----
  nameEl?.addEventListener('blur',  () => _checkName(nameEl, true));
  emailEl?.addEventListener('blur', () => _checkEmail(emailEl, true));
  passEl?.addEventListener('blur',  () => _checkPass(passEl, true));

  // ---- Password show/hide toggle ----
  if (toggleEl && passEl) {
    toggleEl.innerHTML = SVG_EYE;
    toggleEl.addEventListener('click', () => {
      const showing = passEl.type === 'text';
      passEl.type = showing ? 'password' : 'text';
      toggleEl.innerHTML = showing ? SVG_EYE : SVG_EYE_OFF;
      toggleEl.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  }

  // ---- Form submit ----
  form.addEventListener('submit', e => {
    e.preventDefault();
    // Run full validation with errors visible
    const ok = _checkName(nameEl, true) && _checkEmail(emailEl, true) && _checkPass(passEl, true);
    if (!ok) return;
    _submitEmail(nameEl.value.trim(), emailEl.value.trim());
  });
}

// ---- Validators ----
function _checkName(el, showErr) {
  const val = el?.value.trim() ?? '';
  const errEl = document.getElementById('err-name');
  const ok = val.length >= 2;
  _setFieldState(el, ok, showErr ? (ok ? '' : 'Name must be at least 2 characters') : '', errEl);
  return ok;
}

function _checkEmail(el, showErr) {
  const val = el?.value.trim() ?? '';
  const re  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const ok  = re.test(val);
  const errEl = document.getElementById('err-email');
  _setFieldState(el, ok, showErr ? (ok ? '' : 'Please enter a valid email address') : '', errEl);
  return ok;
}

function _checkPass(el, showErr) {
  const val = el?.value ?? '';
  const ok  = val.length >= 8;
  const errEl = document.getElementById('err-pass');
  _setFieldState(el, ok, showErr ? (ok ? '' : 'Password must be at least 8 characters') : '', errEl);
  return ok;
}

function _setFieldState(el, ok, errMsg, errEl) {
  if (!el) return;
  const hasValue = el.value.length > 0;
  el.classList.toggle('is-error', !ok && hasValue);
  el.classList.toggle('is-valid', ok);
  if (errEl) errEl.textContent = errMsg;
}

function _syncSubmit() {
  const submitEl = document.getElementById('email-submit');
  if (!submitEl) return;
  const nameOk  = (document.getElementById('field-name')?.value.trim().length  ?? 0) >= 2;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(document.getElementById('field-email')?.value.trim() ?? '');
  const passOk  = (document.getElementById('field-password')?.value.length ?? 0) >= 8;
  submitEl.disabled = !(nameOk && emailOk && passOk);
}

// ---- Password strength indicator ----
function _renderStrength(password) {
  const segs = document.querySelectorAll('.pw-seg');
  if (!segs.length) return;

  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[0-9!@#$%^&*_\-]/.test(password)) score++;

  const levelClass = ['', 'weak', 'ok', 'strong'];

  segs.forEach((seg, i) => {
    seg.classList.remove('weak', 'ok', 'strong');
    if (i < score) seg.classList.add(levelClass[score]);
  });
}

// ---- Submit flow ----
function _submitEmail(name, email) {
  const submitEl = document.getElementById('email-submit');
  if (!submitEl) return;

  submitEl.classList.add('is-loading');
  submitEl.innerHTML = `Creating account\u2026`;

  AppState.user.name       = name;
  AppState.user.email      = email;
  AppState.user.authMethod = 'email';
  saveState();

  setTimeout(() => {
    submitEl.innerHTML = `Account created ✓`;
    setTimeout(() => navigateTo('dashboard'), 520);
  }, 950);
}

// ---- Reset email form (on re-enter) ----
function _resetEmailForm() {
  const form = document.getElementById('email-form');
  if (!form) return;

  form.reset();

  ['field-name', 'field-email', 'field-password'].forEach(id => {
    const el = document.getElementById(id);
    el?.classList.remove('is-error', 'is-valid');
  });

  ['err-name', 'err-email', 'err-pass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });

  // Reset password type to hidden
  const passEl = document.getElementById('field-password');
  const toggleEl = document.getElementById('pw-toggle');
  if (passEl) passEl.type = 'password';
  if (toggleEl) {
    toggleEl.innerHTML = SVG_EYE;
    toggleEl.setAttribute('aria-label', 'Show password');
  }

  // Reset strength segments
  document.querySelectorAll('.pw-seg').forEach(s => s.classList.remove('weak', 'ok', 'strong'));

  // Reset submit button
  const submitEl = document.getElementById('email-submit');
  if (submitEl) {
    submitEl.disabled = true;
    submitEl.classList.remove('is-loading');
    submitEl.innerHTML = `Create Account
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.6"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
  }
}

// ============================================================
// WALLET FLOW
// ============================================================
function _bindWalletButtons() {
  document.querySelectorAll('.wallet-btn').forEach(btn => {
    btn.addEventListener('click', () => _connectWallet(btn.dataset.wallet));
  });
}

function _connectWallet(walletType) {
  // Disable all wallet buttons and show connecting state on the clicked one
  document.querySelectorAll('.wallet-btn').forEach(btn => {
    btn.classList.add('is-connecting');
    btn.disabled = true;
  });

  const clicked = document.querySelector(`.wallet-btn[data-wallet="${walletType}"]`);
  if (clicked) {
    const nameEl = clicked.querySelector('.wallet-btn-name');
    if (nameEl) nameEl.textContent = 'Connecting\u2026';
  }

  // Simulate async wallet handshake
  setTimeout(() => {
    const mockAddr = MOCK_WALLETS[Math.floor(Math.random() * MOCK_WALLETS.length)];

    // Persist
    AppState.user.authMethod    = 'wallet';
    AppState.user.walletAddress = mockAddr;
    AppState.user.walletType    = walletType;
    saveState();

    // Show connected UI
    const optionsEl   = document.getElementById('wallet-options');
    const connectedEl = document.getElementById('wallet-connected');
    const addrEl      = document.getElementById('wc-address');

    if (optionsEl)   optionsEl.hidden   = true;
    if (connectedEl) connectedEl.hidden = false;
    if (addrEl)      addrEl.textContent = mockAddr;

    // Navigate to dashboard after a moment
    setTimeout(() => navigateTo('dashboard'), 1100);
  }, 1650);
}

function _resetWalletUI() {
  const optionsEl   = document.getElementById('wallet-options');
  const connectedEl = document.getElementById('wallet-connected');

  if (optionsEl)   optionsEl.hidden   = false;
  if (connectedEl) connectedEl.hidden = true;

  document.querySelectorAll('.wallet-btn').forEach(btn => {
    btn.classList.remove('is-connecting');
    btn.disabled = false;
  });

  // Reset button labels
  const wcName  = document.querySelector('.wc-btn  .wallet-btn-name');
  const prvName = document.querySelector('.prv-btn .wallet-btn-name');
  if (wcName)  wcName.textContent  = 'WalletConnect';
  if (prvName) prvName.textContent = 'Privy';
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', initAuth);
