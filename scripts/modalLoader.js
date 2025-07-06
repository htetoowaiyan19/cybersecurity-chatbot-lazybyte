export async function loadQuizModals() {
  if (document.getElementById('modalContainer')) return;
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

export async function loadModel(name) {
  const containerId = `modal-${name}`;
  if (document.getElementById(containerId)) return;

  const modalContainer = document.createElement('div');
  modalContainer.id = containerId;
  document.body.appendChild(modalContainer);

  const modalFile = `HTMLComponents/${name}.html`;

  try {
    const res = await fetch(modalFile);
    if (!res.ok) throw new Error(`Failed to load ${modalFile}: ${res.status}`);
    const html = await res.text();
    modalContainer.insertAdjacentHTML('beforeend', html);
  } catch (err) {
    console.error(err);
  }
}