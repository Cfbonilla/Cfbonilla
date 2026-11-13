// Modo claro / oscuro. Se carga en el <head> para aplicar el tema antes de dibujar la página.
(function () {
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (_) { /* almacenamiento bloqueado */ }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = saved === 'light' || saved === 'dark' ? saved : (prefersDark ? 'dark' : 'light');

  function paint(btn) {
    const dark = root.dataset.theme === 'dark';
    btn.textContent = dark ? '☀ CLARO' : '☾ OSCURO';
    btn.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    btn.setAttribute('aria-pressed', String(dark));
  }

  // Nieve pixelada cayendo en el encabezado.
  function snow() {
    for (const box of document.querySelectorAll('.snow')) {
      for (let i = 0; i < 28; i++) {
        const f = document.createElement('i');
        const size = [4, 6, 8][i % 3];
        const dur = 5 + Math.random() * 6;
        f.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;` +
          `animation-duration:${dur}s;animation-delay:${-Math.random() * dur}s`;
        box.appendChild(f);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    snow();
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    paint(btn);
    btn.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', root.dataset.theme); } catch (_) { /* sin almacenamiento */ }
      paint(btn);
    });
  });
})();
