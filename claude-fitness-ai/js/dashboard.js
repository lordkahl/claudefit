/* ============================================================
   DASHBOARD.JS — Screen 4: Main Dashboard
   ============================================================ */

'use strict';

// ============================================================
// CONSTANTS
// ============================================================
const DASH_COACH_LABELS = {
  grinder: 'The Grinder',
  pacer:   'The Pacer',
  coach:   'The Coach',
};

const DASH_COACH_AVATARS = {
  grinder: 'A',
  pacer:   'B',
  coach:   'C',
};

const VIEW_TITLES = {
  home:      'Home',
  program:   'My Program',
  progress:  'Progress',
  nutrition: 'Nutrition',
  chat:      'Chat with Coach',
};

// ============================================================
// INIT
// ============================================================
function initDashboard() {
  onScreenEnter('dashboard', _onEnter);

  const hamburger = document.getElementById('dash-hamburger');
  const overlay   = document.getElementById('dash-overlay');

  if (hamburger) hamburger.addEventListener('click', _openSidebar);
  if (overlay)   overlay.addEventListener('click',   _closeSidebar);

  document.querySelectorAll('.dash-nav-item').forEach(btn => {
    btn.addEventListener('click', () => _setActiveView(btn.dataset.view));
  });

  document.querySelectorAll('.dash-bottom-nav-item').forEach(btn => {
    btn.addEventListener('click', () => _setActiveView(btn.dataset.view));
  });
}

// ============================================================
// SCREEN ENTER
// ============================================================
function _onEnter() {
  _populateUser();
  _populateGreeting();
  _closeSidebar();
  _setActiveView('home', false);
}

// ============================================================
// POPULATE FROM APPSTATE
// ============================================================
function _populateUser() {
  const name  = (AppState.user && AppState.user.name) || 'Athlete';
  const coach = AppState.selectedCoach || 'coach';

  const sidebarNameEl  = document.getElementById('dash-user-name');
  const sidebarCoachEl = document.getElementById('dash-user-coach-label');
  if (sidebarNameEl)  sidebarNameEl.textContent  = name;
  if (sidebarCoachEl) sidebarCoachEl.textContent  = DASH_COACH_LABELS[coach] || 'Your Coach';

  const initials = _makeInitials(name);
  ['dash-topbar-initials', 'dash-avatar-initials'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = initials;
  });

  var coachLetterEl = document.getElementById('dash-coach-avatar-letter');
  var coachTagEl    = document.getElementById('dash-coach-tag-label');
  if (coachLetterEl) coachLetterEl.textContent = DASH_COACH_AVATARS[coach] || 'C';
  if (coachTagEl)    coachTagEl.textContent     = DASH_COACH_LABELS[coach]  || 'Your Coach';

  var screenEl = document.getElementById('screen-dashboard');
  if (screenEl) screenEl.dataset.activeCoach = coach;
}

function _populateGreeting() {
  var name      = (AppState.user && AppState.user.name) || 'Athlete';
  var firstName = name.trim().split(/\s+/)[0] || 'Athlete';

  var hour = new Date().getHours();
  var eyebrow = 'Good evening';
  if (hour >= 5  && hour < 12) eyebrow = 'Good morning';
  else if (hour >= 12 && hour < 17) eyebrow = 'Good afternoon';

  var eyebrowEl = document.getElementById('dash-greeting-time');
  var nameEl    = document.getElementById('dash-greeting-name');
  if (eyebrowEl) eyebrowEl.textContent = eyebrow;
  if (nameEl)    nameEl.textContent    = 'Welcome back, ' + firstName + '.';
}

function _makeInitials(name) {
  var parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ============================================================
// NAV / VIEW SWITCHING
// ============================================================
function _setActiveView(viewId, updateTopbar) {
  if (\!viewId) return;
  if (updateTopbar === undefined) updateTopbar = true;

  document.querySelectorAll('.dash-nav-item').forEach(function(btn) {
    var isActive = btn.dataset.view === viewId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  document.querySelectorAll('.dash-bottom-nav-item').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.view === viewId);
  });

  if (updateTopbar) {
    var titleEl = document.getElementById('dash-topbar-title');
    if (titleEl) titleEl.textContent = VIEW_TITLES[viewId] || 'Dashboard';
  }

  _closeSidebar();
}

// ============================================================
// SIDEBAR DRAWER
// ============================================================
function _openSidebar() {
  var sidebar = document.getElementById('dash-sidebar');
  var overlay = document.getElementById('dash-overlay');
  if (sidebar) sidebar.classList.add('is-open');
  if (overlay) overlay.classList.add('visible');
}

function _closeSidebar() {
  var sidebar = document.getElementById('dash-sidebar');
  var overlay = document.getElementById('dash-overlay');
  if (sidebar) sidebar.classList.remove('is-open');
  if (overlay) overlay.classList.remove('visible');
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', initDashboard);
