let languageData = {};
let currentLanguage = 'en';

export async function setLanguage(lang) {
  try {
    const res = await fetch('scripts/lang.json');
    const data = await res.json();
    languageData = data;
    currentLanguage = lang;
    localStorage.setItem('lang', lang);

    const textMap = data[lang];
    for (const id in textMap) {
      const el = document.getElementById(id);
      if (el) el.innerText = textMap[id];
    }
  } catch (err) {
    console.error('Failed to load language file:', err);
  }
}

export function getLanguage() {
  return localStorage.getItem('lang') || 'en';
}

export function t(key) {
  return languageData[currentLanguage]?.[key] || key;
}
