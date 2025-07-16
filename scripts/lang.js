let languageData = {};
let currentLanguage = 'en';

export async function loadLanguageFile() {
  const res = await fetch('scripts/lang.json');
  languageData = await res.json();
}

export function getLanguage() {
  return localStorage.getItem('lang') || 'en';
}

export function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('lang', lang);
  applyTranslations();
  updateLangLabel();
}

export function t(key) {
  return languageData[currentLanguage]?.[key] || key;
}

export function applyTranslations() {
  const translations = languageData[currentLanguage];
  if (!translations) return;

  for (const id in translations) {
    const el = document.getElementById(id);
    if (el) el.innerText = translations[id];
  }
}

export function initLanguageSelector() {
  const dropdown = document.getElementById('languageDropdown');
  if (!dropdown) return;

  dropdown.querySelectorAll('[data-lang]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = item.getAttribute('data-lang');
      setLanguage(lang);
    });
  });

  updateLangLabel();
}

function updateLangLabel() {
  const label = document.getElementById('currentLangLabel');
  if (label) {
    label.textContent = currentLanguage === 'mm' ? 'မြန်မာ' : 'English';
  }
}

export async function initLanguage() {
  await loadLanguageFile();
  setLanguage(getLanguage());
  initLanguageSelector();
}