// Initialize Supabase client
const supabaseUrl = 'https://edlavribkdaozwinzdpa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbGF2cmlia2Rhb3p3aW56ZHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODY1NDIsImV4cCI6MjA2NTY2MjU0Mn0.zdu2lOsCW4P5EbgadZ13Y55pTT_Le0YBklG17rlmIgQ';
const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);

// Helper to get input values
function getInputValue(id) {
  return document.getElementById(id).value.trim();
}

// Sign Up with email and password
async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    alert('Sign up error: ' + error.message);
  } else {
    alert('Sign up successful! Please check your email for confirmation.');
    // Close signup modal
    bootstrap.Modal.getInstance(document.getElementById('signupModal')).hide();
  }
}

// Login with email and password
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert('Login error: ' + error.message);
  } else {
    alert('Login successful!');
    // Close login modal
    bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
  }
}

// Sign in with Google OAuth
async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  if (error) {
    alert('Google sign-in error: ' + error.message);
  }
  // Redirect handled automatically by Supabase
}

// Setup event listeners after DOM ready
window.addEventListener('DOMContentLoaded', () => {
  // Login form submit
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = getInputValue('loginEmail');
    const password = getInputValue('loginPassword');
    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }
    await login(email, password);
  });

  // Signup form submit
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = getInputValue('signupEmail');
    const password = getInputValue('signupPassword');
    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }
    await signUp(email, password);
  });

  // Google sign-in buttons (login and signup)
  document.querySelectorAll('.btn-google-login, .btn-google-signup').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      signInWithGoogle();
    });
  });
});
