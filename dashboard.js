import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://edlavribkdaozwinzdpa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbGF2cmlia2Rhb3d3aW56ZHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODY1NDIsImV4cCI6MjA2NTY2MjU0Mn0.zdu2lOsCW4P5EbgadZ13Y55pTT_Le0YBklG17rlmIgQ'
);

window.addEventListener('DOMContentLoaded', async () => {
  // Get current session
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error || !session) {
    // Not logged in, redirect to login page
    window.location.href = 'index.html';
    return;
  }

  // Get username from session metadata
  const userName = session.user.user_metadata?.name || 'User';

  // Display username in navbar
  document.getElementById('userNameDisplay').innerText = userName;
});

// Logout button
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
});