document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('password-form');
  var message = document.getElementById('profile-message');
  var submit = form.querySelector('button[type="submit"]');

  function showMessage(text, ok) {
    message.textContent = text;
    message.className = 'il-form-msg ' + (ok ? 'is-ok' : 'is-error');
    message.hidden = false;
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem('il_sesion') || 'null'); }
    catch (e) { return null; }
  }

  var session = getSession();
  if (!session || session.rol !== 'usuario') {
    form.hidden = true;
    showMessage('Inicia sesión con una cuenta de cliente para editar tu perfil.', false);
  } else if (!session.email) {
    form.hidden = true;
    showMessage('Tu sesión es anterior a esta mejora. Cierra sesión e inicia sesión otra vez para continuar.', false);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var sessionNow = getSession();
    var actual = form.elements.actual.value;
    var nueva = form.elements.nueva.value;
    var confirmar = form.elements.confirmar.value;

    if (nueva !== confirmar) {
      showMessage('Las nuevas contraseñas no coinciden.', false);
      return;
    }
    if (!sessionNow || !sessionNow.email || sessionNow.rol !== 'usuario') {
      showMessage('Inicia sesión otra vez para verificar tu cuenta.', false);
      return;
    }

    submit.disabled = true;
    fetch('/api/cambiar-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: sessionNow.email, actual: actual, nueva: nueva })
    })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        showMessage(result.data.message || (result.ok ? 'Contraseña actualizada.' : 'No se pudo actualizar la contraseña.'), result.ok);
        if (result.ok) form.reset();
      })
      .catch(function () { showMessage('No hay conexión con el servidor. Intenta de nuevo.', false); })
      .then(function () { submit.disabled = false; });
  });

  document.getElementById('logout-button').addEventListener('click', function () {
    localStorage.removeItem('il_sesion');
    window.location.href = 'index.html';
  });
});
