document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('password-form');
  var message = document.getElementById('profile-message');
  var changeButton = document.getElementById('show-password-button');
  var logoutButton = document.getElementById('logout-button');
  var dialog = document.getElementById('password-dialog');
  var closeButton = document.getElementById('cancel-password-button');
  var cancelButton = document.getElementById('cancel-password-form');
  var profileData = document.getElementById('profile-data');
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

  function setValue(id, value) {
    document.getElementById(id).textContent = value === null || value === undefined || value === '' ? 'No registrado' : String(value);
  }

  var session = getSession();
  if (!session || session.rol !== 'usuario') {
    showMessage('Inicia sesión con una cuenta de cliente para ver tu perfil.', false);
  } else {
    logoutButton.hidden = false;
    if (!session.email || !session.perfil) {
      showMessage('Cierra sesión e inicia sesión otra vez para cargar los datos de tu perfil.', false);
    } else {
      var perfil = session.perfil;
      setValue('profile-id', perfil.id);
      setValue('profile-name', perfil.nombre || session.nombre);
      setValue('profile-email', perfil.email || session.email);
      setValue('profile-phone', perfil.telefono);
      setValue('profile-dni', perfil.dni);
      setValue('profile-occupation', perfil.ocupacion);
      profileData.hidden = false;
      changeButton.hidden = false;
    }
  }

  changeButton.addEventListener('click', function () {
    message.hidden = true;
    dialog.showModal();
  });

  function closeDialog() {
    form.reset();
    dialog.close();
  }

  closeButton.addEventListener('click', closeDialog);
  cancelButton.addEventListener('click', closeDialog);
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener('cancel', function () { form.reset(); });

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
        if (result.ok) {
          form.reset();
          dialog.close();
        }
        showMessage(result.data.message || (result.ok ? 'Contraseña actualizada.' : 'No se pudo actualizar la contraseña.'), result.ok);
      })
      .catch(function () { showMessage('No hay conexión con el servidor. Intenta de nuevo.', false); })
      .then(function () { submit.disabled = false; });
  });

  logoutButton.addEventListener('click', function () {
    localStorage.removeItem('il_sesion');
    window.location.href = '/html/index.html';
  });
});
