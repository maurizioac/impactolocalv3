// Envía a la API (y de ahí a Neon) todo <form data-api="/api/...">.
// Atributos opcionales: data-tipo, data-rol (se agregan al JSON), data-redirect, data-success.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('form[data-api]').forEach(function (form) {
    var msg = document.createElement('p');
    msg.className = 'il-form-msg';
    msg.setAttribute('role', 'alert');
    msg.hidden = true;
    form.appendChild(msg);

    function mostrar(texto, ok) {
      msg.textContent = texto;
      msg.className = 'il-form-msg ' + (ok ? 'is-ok' : 'is-error');
      msg.hidden = false;
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var datos = {};
      new FormData(form).forEach(function (v, k) { datos[k.replace(/-benefica$/, '')] = v; });
      if (form.dataset.tipo) datos.tipo = form.dataset.tipo;
      if (form.dataset.rol) datos.rol = form.dataset.rol;

      var boton = form.querySelector('button[type="submit"], button:not([type])');
      if (boton) boton.disabled = true;
      msg.hidden = true;

      fetch(form.dataset.api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) { mostrar(res.j.message || 'No se pudo completar la acción.', false); return; }
          if (res.j.nombre) {
            try { localStorage.setItem('il_sesion', JSON.stringify({ nombre: res.j.nombre, rol: res.j.rol || 'usuario' })); } catch (e) {}
          }
          if (form.dataset.redirect) { window.location.href = form.dataset.redirect; return; }
          form.reset();
          mostrar(form.dataset.success || res.j.message || 'Listo.', true);
          if (window.ImpactoLocalSolicitudes) window.ImpactoLocalSolicitudes.refresh();
        })
        .catch(function () { mostrar('No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.', false); })
        .then(function () { if (boton) boton.disabled = false; });
    });
  });
});
