export function setActiveNavLink() {
  const currentHash = window.location.hash || '#dashboard';
  document.querySelectorAll(".nav-link").forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentHash) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}