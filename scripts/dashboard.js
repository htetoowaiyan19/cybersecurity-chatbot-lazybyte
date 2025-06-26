import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://edlavribkdaozwinzdpa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbGF2cmlia2Rhb3d3aW56ZHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODY1NDIsImV4cCI6MjA2NTY2MjU0Mn0.zdu2lOsCW4P5EbgadZ13Y55pTT_Le0YBklG17rlmIgQ'
);

export async function initDashboard() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    window.location.href = 'index.html';  // or redirect to login route in SPA
    return;
  }

  // Wait for navbar to load (e.g. after renderNavbar())
  const userNameElem = document.getElementById('userNameDisplay');
  if (userNameElem) {
    userNameElem.innerText = session.user.user_metadata?.name || 'User';
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = 'index.html';  // or navigate to login route
    });
  }
}