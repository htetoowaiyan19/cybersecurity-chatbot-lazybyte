import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { setActiveNavLink } from './active-link.js';

const supabase = createClient(
  'https://edlavribkdaozwinzdpa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbGF2cmlia2Rhb3p3aW56ZHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODY1NDIsImV4cCI6MjA2NTY2MjU0Mn0.zdu2lOsCW4P5EbgadZ13Y55pTT_Le0YBklG17rlmIgQ'
);

let session = null;

async function checkSession() {
  const { data } = await supabase.auth.getSession();
  session = data.session;
}

const routes = {
  '#dashboard': () => session ? 'pages/dashboard/' : 'pages/login/',
  '#about': () => 'pages/about/',
  '#terms': () => 'pages/terms/',
  '#quiz': () => 'pages/quiz/',
  '#aichatbot': () => 'pages/aichatbot/',
  '#login': () => 'pages/login/',
  '#signup': () => 'pages/signup/',
};

async function loadComponent(id, path) {
  try {
    const res = await fetch(path);
    const html = await res.text();
    document.getElementById(id).innerHTML = html;
  } catch (err) {
    document.getElementById(id).innerHTML = `<div class="text-center text-danger mt-5">Failed to load ${path}</div>`;
  }
}

async function renderNavbar() {
  const navbarHTML = session
    ? await fetch('HTMLComponents/navbar_loggedin.html').then(res => res.text())
    : await fetch('HTMLComponents/navbar_loggedout.html').then(res => res.text());

  document.getElementById('navbar').innerHTML = navbarHTML;

  if (session) {
    const name = session.user.user_metadata?.name || 'User';
    const nameSpan = document.getElementById('userNameDisplay');
    if (nameSpan) nameSpan.textContent = name;

    const heading = document.getElementById('userNameHeading');
    if (heading) heading.textContent = name;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        session = null;
        await renderNavbar();
        window.location.hash = '#login';
      });
    }
  } else {
    setupModalOpeners();
  }

  setActiveNavLink();
}

function setupModalOpeners() {
  const loginLink = document.getElementById('openLoginModal');
  const signupLink = document.getElementById('openSignupModal');

  if (loginLink) {
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      const loginModalEl = document.getElementById('loginModal');
      if (loginModalEl) {
        const modal = new bootstrap.Modal(loginModalEl);
        modal.show();
      }
    });
  }

  if (signupLink) {
    signupLink.addEventListener('click', (e) => {
      e.preventDefault();
      const signupModalEl = document.getElementById('signupModal');
      if (signupModalEl) {
        const modal = new bootstrap.Modal(signupModalEl);
        modal.show();
      }
    });
  }
}

async function attachAuthHandlers() {
  const loginForm = document.querySelector('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.querySelector('#loginEmail').value;
      const password = document.querySelector('#loginPassword').value;

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert('Login failed: ' + error.message);
      } else {
        const loginModalEl = document.getElementById('loginModal');
        if (loginModalEl) {
          const modal = bootstrap.Modal.getInstance(loginModalEl);
          if (modal) modal.hide();
        }

        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

        session = data.session;

        await renderNavbar();

        window.location.hash = '#dashboard';
      }
    });
  }

  const signupForm = document.querySelector('#signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const password = document.getElementById('signupPassword').value;
      const passwordConfirm = document.getElementById('signupPasswordConfirm').value;

      if (password !== passwordConfirm) {
        alert("Passwords do not match.");
        return;
      }

      const email = document.querySelector('#signupEmail').value;
      const name = document.querySelector('#signupName').value;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (error) {
        alert('Sign up failed: ' + error.message);
      } else {
        alert('Account created! Please log in.');
        window.location.hash = '#login';
      }
    });

    // Password strength and matching handlers
    const updatePasswordStrength = (password) => {
      const strengthBar = document.getElementById('passwordStrengthBar');
      const strengthText = document.getElementById('passwordStrengthText');
      let score = 0;
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
      if (/\d/.test(password)) score++;
      if (/[\W_]/.test(password)) score++;

      let width = (score / 5) * 100;
      let color = 'bg-danger';
      let text = 'Weak';

      if (score <= 2) {
        color = 'bg-danger'; text = 'Weak';
      } else if (score <= 4) {
        color = 'bg-warning'; text = 'Medium';
      } else {
        color = 'bg-success'; text = 'Strong';
      }

      strengthBar.style.width = width + '%';
      strengthBar.className = 'progress-bar ' + color;
      strengthText.textContent = text;
    };

    const checkPasswordMatch = () => {
      const password = document.getElementById('signupPassword').value;
      const confirm = document.getElementById('signupPasswordConfirm').value;
      const message = document.getElementById('passwordMatchMessage');

      if (!confirm) {
        message.textContent = '';
        return false;
      }

      if (password === confirm) {
        message.textContent = 'Passwords match ✔️';
        message.style.color = 'green';
        return true;
      } else {
        message.textContent = 'Passwords do not match ❌';
        message.style.color = 'red';
        return false;
      }
    };

    document.getElementById('signupPassword').addEventListener('input', (e) => {
      updatePasswordStrength(e.target.value);
      checkPasswordMatch();
    });
    document.getElementById('signupPasswordConfirm').addEventListener('input', checkPasswordMatch);
  }
}

function attachTermsToggleListeners() {
  const termsNav = document.querySelector('.terms-nav');
  if (!termsNav) return;

  // Initially collapse all nested sublists
  termsNav.querySelectorAll('ul ul').forEach(subUl => {
    subUl.style.display = 'none';
  });

  // Setup toggling behavior on parent items
  termsNav.querySelectorAll('li.parent-item > .label').forEach(label => {
    label.style.cursor = 'pointer';

    label.addEventListener('click', () => {
      const parentLi = label.parentElement;
      const sublist = parentLi.querySelector('ul');
      if (!sublist) return;

      const isVisible = sublist.style.display !== 'none';
      sublist.style.display = isVisible ? 'none' : 'block';

      label.classList.toggle('expanded', !isVisible);
    });
  });
}

function attachTermsScrollSync() {
  const navItems = document.querySelectorAll('.terms-nav li[data-id]');
  const contentSections = document.querySelectorAll('.terms-content article, .terms-content section[id]');
  const termsContent = document.querySelector('.terms-content');
  if (!termsContent) return;

  navItems.forEach(navItem => {
    navItem.addEventListener('click', () => {
      const id = navItem.getAttribute('data-id');
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      navItems.forEach(item => item.classList.remove('active'));
      navItem.classList.add('active');
    });
  });

  function onScroll() {
    let scrollPos = termsContent.scrollTop;
    let currentId = null;

    contentSections.forEach(section => {
      if (section.offsetTop - 10 <= scrollPos) {
        currentId = section.id;
      }
    });

    if (currentId) {
      navItems.forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-id') === currentId);
      });
    }
  }

  termsContent.addEventListener('scroll', onScroll);
}

// Then, after you load your terms component dynamically:
async function renderPage() {
  const hash = window.location.hash || '#dashboard';
  const pathResolver = routes[hash];
  const path = pathResolver ? pathResolver() : 'pages/login/';
  await loadComponent('app', path);

  await attachAuthHandlers();
  setActiveNavLink();

  if (hash === '#terms') {
    attachTermsToggleListeners();
    attachTermsScrollSync();
  }

  if (session && window.location.hash === '#dashboard') {
    const heading = document.getElementById('userNameHeading');
    if (heading) heading.textContent = session.user.user_metadata?.name || 'User';
  }
}

async function renderApp() {
  await checkSession();
  await renderNavbar();
  await loadComponent('footer', 'HTMLComponents/footer.html');
  await renderPage();
}

window.addEventListener('DOMContentLoaded', renderApp);
window.addEventListener('hashchange', renderPage);