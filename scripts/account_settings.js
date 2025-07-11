// account_settings.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://edlavribkdaozwinzdpa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkbGF2cmlia2Rhb3p3aW56ZHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODY1NDIsImV4cCI6MjA2NTY2MjU0Mn0.zdu2lOsCW4P5EbgadZ13Y55pTT_Le0YBklG17rlmIgQ'
);

const getSession = async () => (await supabase.auth.getSession()).data.session;

// Change Username
const changeUsername = async () => {
  const session = await getSession();
  const user = session?.user;
  const newUsername = document.getElementById('newUsername').value.trim();
  if (!newUsername || !user) return alert('Invalid input or not logged in.');

  // Update Supabase Auth metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: { name: newUsername }
  });

  if (authError) return alert('Error updating auth profile: ' + authError.message);

  // Update custom users table
  const { error: dbError } = await supabase
    .from('users')
    .update({ username: newUsername })
    .eq('id', user.id);

  if (dbError) return alert('Error updating username in DB: ' + dbError.message);

  alert('Username updated successfully!');
};

// Change Password
const changePassword = async () => {
  const current = document.getElementById('currentPassword').value;
  const newP = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmNewPassword').value;
  if (!current || !newP || !confirm || newP !== confirm) return alert('Please check your input.');

  const { error } = await supabase.auth.updateUser({ password: newP });

  if (!error) alert('Password changed successfully.');
  else alert('Failed to change password: ' + error.message);
};

// Verify Email
const sendVerificationEmail = async () => {
  const { error } = await supabase.auth.verifyOtp({ type: 'email' });
  if (!error) alert('Verification email sent.');
  else alert('Failed: ' + error.message);
};

// Enable 2FA
const toggle2FA = async () => {
  const checked = document.getElementById('enable2FA').checked;
  alert('2FA is not yet supported by Supabase client SDK. Use a custom flow.');
  // You may hide this feature or roll your own 2FA via OTP/email magic link/etc.
};

// Delete Account
const deleteAccount = async () => {
  if (!confirm('Are you sure you want to delete your account?')) return;
  const session = await getSession();
  const user = session?.user;

  if (!user) return alert('Not logged in.');

  // Optional: Delete from custom DB table first
  await supabase.from('users').delete().eq('id', user.id);

  // Then delete from auth
  const { error } = await supabase.auth.admin.deleteUser(user.id); // Requires admin access
  if (!error) alert('Account deleted.');
  else alert('Error: ' + error.message);
};

export function initAccountSettings() {
  document.getElementById('changeUsernameBtn')?.addEventListener('click', changeUsername);
  document.getElementById('changePasswordBtn')?.addEventListener('click', changePassword);
  document.getElementById('verifyEmailBtn')?.addEventListener('click', sendVerificationEmail);
  document.getElementById('enable2FA')?.addEventListener('change', toggle2FA);
  document.getElementById('deleteAccountBtn')?.addEventListener('click', deleteAccount);

  // Display email verification status
  getSession().then(session => {
    const emailConfirmed = session?.user?.email_confirmed_at;
    const el = document.getElementById('emailStatus');
    if (el) el.textContent = emailConfirmed ? 'Verified' : 'Unverified';
  });
}