import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Initialize Supabase
const supabase = createClient(
  'https://edlavribkdaozwinzdpa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbGF2cmlia2Rhb3p3aW56ZHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODY1NDIsImV4cCI6MjA2NTY2MjU0Mn0.zdu2lOsCW4P5EbgadZ13Y55pTT_Le0YBklG17rlmIgQ'
);

// LOGIN handler
document.querySelector('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.querySelector('#loginEmail').value;
  const password = document.querySelector('#loginPassword').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert('Login failed: ' + error.message);
  } else {
    // Store user data temporarily in session storage
    const userName = data.user.user_metadata?.name || 'User';
    sessionStorage.setItem('lazybyte_username', userName);

    // Redirect to dashboard
    window.location.href = 'dashboard.html';
  }
});

// SIGNUP handler
document.querySelector('#signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.querySelector('#signupEmail').value;
  const password = document.querySelector('#signupPassword').value;
  const name = document.querySelector('#signupName').value;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });

  if (error) {
    alert('Sign up failed: ' + error.message);
  } else {
    alert('Account created! You can now log in.');
    // Close signup modal
    const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
    signupModal.hide();
  }
});