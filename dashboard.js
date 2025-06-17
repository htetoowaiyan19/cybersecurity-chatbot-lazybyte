import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://edlavribkdaozwinzdpa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbGF2cmlia2Rhb3p3aW56ZHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODY1NDIsImV4cCI6MjA2NTY2MjU0Mn0.zdu2lOsCW4P5EbgadZ13Y55pTT_Le0YBklG17rlmIgQ'
);

// Display username in navbar
const name = sessionStorage.getItem('lazybyte_username') || 'User';
document.getElementById('userNameDisplay').innerText = name;

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  sessionStorage.clear();
  window.location.href = 'index.html';
});