document.addEventListener('DOMContentLoaded', function () {
  var cont = document.querySelector('.site-header .header-container');
  var nav = cont && cont.querySelector('.main-nav');
  var loggedInClient = false;

  try {
    var session = JSON.parse(localStorage.getItem('il_sesion') || 'null');
    loggedInClient = Boolean(session && session.rol === 'usuario');
  } catch (e) {}

  document.querySelectorAll('.header-actions, .il-header-actions').forEach(function (actions) {
    var loginLinks = actions.querySelectorAll('.btn-text[href*="iniciar-sesion"], .il-link-muted');
    var registerLinks = actions.querySelectorAll('.btn-pill, .il-btn-outline');
    var avatar = actions.querySelector('.user-avatar, .il-avatar');

    if (loggedInClient) {
      loginLinks.forEach(function (link) { link.hidden = true; });
      registerLinks.forEach(function (link) { link.hidden = true; });
      if (!avatar) {
        avatar = document.createElement('a');
        avatar.className = actions.classList.contains('il-header-actions') ? 'il-avatar' : 'user-avatar';
        avatar.innerHTML = '<i class="fa-solid fa-user" aria-hidden="true"></i>';
        actions.appendChild(avatar);
      }
      avatar.href = 'perfil.html';
      avatar.classList.add('is-authenticated');
      avatar.setAttribute('aria-label', 'Mi perfil');
      avatar.title = 'Mi perfil';
    }
  });

  if (!cont || !nav) return;

  var btn = cont.querySelector('.nav-toggle');
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-toggle';
    btn.setAttribute('aria-label', 'Abrir menú');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    cont.appendChild(btn);
  }

  var login = cont.querySelector('.btn-text[href*="iniciar-sesion"]');
  if (login && !loggedInClient && !nav.querySelector('.nav-extra')) {
    var a = login.cloneNode(true);
    a.className = 'nav-item nav-extra';
    nav.appendChild(a);
  }
  if (loggedInClient) nav.querySelectorAll('.nav-extra').forEach(function (item) { item.remove(); });

  btn.addEventListener('click', function () {
    var abierto = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(abierto));
  });
});
