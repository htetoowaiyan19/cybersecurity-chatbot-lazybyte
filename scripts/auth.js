import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Initialize Supabase
const supabase = createClient(
  'https://edlavribkdaozwinzdpa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbGF2cmlia2Rhb3p3aW56ZHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODY1NDIsImV4cCI6MjA2NTY2MjU0Mn0.zdu2lOsCW4P5EbgadZ13Y55pTT_Le0YBklG17rlmIgQ'
);

window.addEventListener('DOMContentLoaded', async () => {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    // User is already logged in, redirect to dashboard
    window.location.href = 'dashboard.html';
    return;
  }
  
  // Optional: Set up any UI initialization for logged out state here
});

// LOGIN handler
document.querySelector('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.querySelector('#loginEmail').value;
  const password = document.querySelector('#loginPassword').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert('Login failed: ' + error.message);
  } else {
    // Redirect to dashboard on successful login
    window.location.href = 'dashboard.html';
  }
});

// SIGNUP handler
document.querySelector('#signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const password = document.getElementById('signupPassword').value;
  const passwordConfirm = document.getElementById('signupPasswordConfirm').value;

  if (password !== passwordConfirm) {
    alert("Passwords do not match. Please fix before submitting.");
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
    alert('Account created! You can now log in.');
    const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
    signupModal.hide();
  }
});

// Password strength helper functions
function calculatePasswordStrength(password) {
  let score = 0;
  if (!password) return score;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[\W_]/.test(password)) score += 1;

  return score;
}

function updatePasswordStrength(password) {
  const strengthBar = document.getElementById('passwordStrengthBar');
  const strengthText = document.getElementById('passwordStrengthText');
  const score = calculatePasswordStrength(password);
  let width = (score / 5) * 100;
  let color = 'bg-danger';
  let text = 'Weak';

  if (score <= 2) {
    color = 'bg-danger';
    text = 'Weak';
  } else if (score === 3 || score === 4) {
    color = 'bg-warning';
    text = 'Medium';
  } else if (score === 5) {
    color = 'bg-success';
    text = 'Strong';
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

// Event listeners for password input and confirmation
document.getElementById('signupPassword').addEventListener('input', (e) => {
  updatePasswordStrength(e.target.value);
  checkPasswordMatch();
});

document.getElementById('signupPasswordConfirm').addEventListener('input', checkPasswordMatch);