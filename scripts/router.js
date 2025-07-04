import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { setActiveNavLink } from './active-link.js';
import { loadQuizModals } from './modalLoader.js';

const supabase = createClient(
  'https://edlavribkdaozwinzdpa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbGF2cmlia2Rhb3p3aW56ZHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODY1NDIsImV4cCI6MjA2NTY2MjU0Mn0.zdu2lOsCW4P5EbgadZ13Y55pTT_Le0YBklG17rlmIgQ'
);

async function syncUserToCustomTable(supabase, user) {
  try {
    const { data, error, status } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (error && status !== 406) {
      console.error('Error checking user in users table:', error);
      return false;
    }

    if (!data) {
      const username = user.user_metadata?.name || user.email;

      const { error: insertError } = await supabase
        .from('users')
        .insert([{ id: user.id, username }]);

      if (insertError) {
        console.error('Error inserting user into users table:', insertError);
        return false;
      }
    }

    return true;
  } catch (e) {
    console.error('Exception syncing user:', e);
    return false;
  }
}

let session = null;

async function checkSession() {
  const { data } = await supabase.auth.getSession();
  session = data.session;
}

const routes = {
  '#dashboard': () => session ? 'pages/dashboard/' : 'pages/login/',
  '#about': () => 'pages/about/',
  '#terms': () => 'pages/terms/',
  '#Privacy-policy': () =>'pages/Privacy-policy',
  '#license': () => 'pages/license',
  '#quiz': () => 'pages/quiz/',
  '#scan': () => 'pages/scan/',
  '#aichatbot': () => 'pages/aichatbot/',
  '#login': () => 'pages/login/',
  '#signup': () => 'pages/signup/',
  '#contact': () => 'pages/contact/',
  '#Who-we-are': () => 'pages/Who-we-are',
  '#What-we-Do': ()=> 'pages/What-we-Do',
  '#Our-mission': ()=>'pages/Our-mission',
  '#FAQ':() =>'pages/FAQ',
  '#Scan-awareness':()=>'pages/Scan-awareness',
  '#Cyber-awareness':()=>'pages/Cyber-awareness',
  '#User-awareness':()=>'pages/User-awareness',
  '#cyber-attack':()=>'pages/cyber-attack',
  
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

let pointsSubscription = null;

function subscribeToPoints(userId) {
  if (pointsSubscription) {
    supabase.removeChannel(pointsSubscription);
    pointsSubscription = null;
  }

  pointsSubscription = supabase
    .channel('public:users')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      },
      (payload) => {
        const newPoints = payload.new.total_points;
        const el = document.getElementById('totalPointsDisplay');
        if (el) el.textContent = `Points: ${newPoints}`;
      }
    )
    .subscribe();
}

document.addEventListener('points-updated', async () => {
  if (session && session.user) {
    await updateTotalPointsDisplay(session.user.id);
  }
});

async function displayServerTime(supabase) {
  const noticeEl = document.getElementById('serverTimeNotice');
  if (!noticeEl) return;

  try {
    const { data, error } = await supabase.rpc('get_current_utc_timestamp');
    if (error || !data) {
      noticeEl.textContent = "Failed to fetch server time.";
      return;
    }

    let serverDate = new Date(data);
    let lastUpdate = Date.now();

    function updateClock() {
      const now = Date.now();
      const diff = now - lastUpdate;
      const updatedServerTime = new Date(serverDate.getTime() + diff);

      const localDate = updatedServerTime.toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      noticeEl.innerHTML = `<strong>Server Time:</strong> ${localDate}`;
    }

    updateClock();
    setInterval(updateClock, 100);

  } catch (err) {
    console.error(err);
    noticeEl.textContent = "Error loading server time.";
  }
}

async function updateTotalPointsDisplay(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('total_points')
    .eq('id', userId)
    .single();

  if (!error && data) {
    const el = document.getElementById('totalPointsDisplay');
    if (el) el.textContent = `Points: ${data.total_points || 0}`;
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

    const userId = session.user.id;
    await updateTotalPointsDisplay(userId);
    subscribeToPoints(userId);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        session = null;

        if (pointsSubscription) {
          supabase.removeChannel(pointsSubscription);
          pointsSubscription = null;
        }

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

function updatePasswordStrength(password) {
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
}

function checkPasswordMatch() {
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
        const synced = await syncUserToCustomTable(supabase, data.session.user);
        if (!synced) {
          alert('Warning: Could not sync user data properly.');
        }

        const loginModalEl = document.getElementById('loginModal');
        if (loginModalEl) {
          const modal = bootstrap.Modal.getInstance(loginModalEl);
          if (modal) modal.hide();
        }

        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

        session = data.session;

        await renderNavbar();

        window.location.hash = '#dashboard';
        await renderPage();
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

  termsNav.querySelectorAll('ul ul').forEach(subUl => {
    subUl.style.display = 'none';
  });

  termsNav.querySelectorAll('li.parent-item > .label').forEach(label => {
    label.style.cursor = 'pointer';
    label.addEventListener('click', () => {
      const sublist = label.parentElement.querySelector('ul');
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

function waitForElement(selector, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(interval);
        resolve(el);
      }
    }, 50);
    setTimeout(() => {
      clearInterval(interval);
      reject(new Error(`Timeout waiting for ${selector}`));
    }, timeout);
  });
}

async function renderPage() {
  const hash = window.location.hash || '#dashboard';
  const pathResolver = routes[hash];
  const path = pathResolver ? pathResolver() : 'pages/login/';

  await loadComponent('app', path);
  await attachAuthHandlers();
  setActiveNavLink();

  const { Leaderboard } = await import('./leaderboard.js');
  const leaderboard = new Leaderboard(supabase);

  if (hash === '#terms') {
    attachTermsToggleListeners();
    attachTermsScrollSync();
  }

  if (hash === '#quiz') {
    await waitForElement('#dailyQuizBtn');
    await loadQuizModals();
    const { QuizApp } = await import('./quiz.js');
    const quizApp = new QuizApp(supabase, session);
    displayServerTime(supabase);
  }

  if (session && hash === '#dashboard') {
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