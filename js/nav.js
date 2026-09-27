// Menú hamburguesa para las páginas con .site-header (index, registrar, iniciar-sesion, organizacion)
document.addEventListener('DOMContentLoaded', function () {
  var cont = document.querySelector('.site-header .header-container');
  var nav = cont && cont.querySelector('.main-nav');
  if (!nav) return;

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-label', 'Abrir menú');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
  cont.appendChild(btn);

  // En pantallas muy chicas "Iniciar Sesión" pasa al menú desplegable
  var login = cont.querySelector('.btn-text');
  if (login) {
    var a = login.cloneNode(true);
    a.className = 'nav-item nav-extra';
    nav.appendChild(a);
  }

  btn.addEventListener('click', function () {
    var abierto = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(abierto));
  });
});
