export async function loadQuizModals() {
  if (document.getElementById('modalContainer')) return; // prevent re-adding
  const modalContainer = document.createElement('div');
  modalContainer.id = 'modalContainer';
  document.body.appendChild(modalContainer);

  const modalFiles = [
    'HTMLComponents/quiz_completed.html',
    'HTMLComponents/quiz_blocked_completed.html',
    'HTMLComponents/quiz_failed.html'
  ];

  for (const file of modalFiles) {
    const res = await fetch(file);
    const html = await res.text();
    modalContainer.insertAdjacentHTML('beforeend', html);
  }
}