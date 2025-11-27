document.addEventListener('DOMContentLoaded', () => {
  // Solo ejecutar si existe la galería
  const gallery = document.querySelector('.gallery-thumbnails');
  if (!gallery) return;

  // Abrir lightbox
  document.querySelectorAll('.gallery-thumbnails img').forEach(img => {
    img.addEventListener('click', () => {
      const fullSrc = img.getAttribute('data-full');
      document.getElementById('lightbox-img').src = fullSrc;
      document.getElementById('lightbox').style.display = 'flex';
    });
  });

  // Cerrar con X
  const closeBtn = document.getElementById('close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('lightbox').style.display = 'none';
    });
  }

  // Cerrar con tecla Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('lightbox').style.display = 'none';
    }
  });
});