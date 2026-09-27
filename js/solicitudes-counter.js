// Contador de solicitudes del encabezado: se lee desde Neon (GET /api/solicitudes).
(function () {
  var FALLBACK = 14;

  function render(n) {
    document.querySelectorAll('[data-solicitudes-count]').forEach(function (el) { el.textContent = n; });
  }

  function refresh() {
    return fetch('/api/solicitudes')
      .then(function (r) { return r.json(); })
      .then(function (j) { render(j && j.ok ? j.total : FALLBACK); })
      .catch(function () { render(FALLBACK); });
  }

  document.addEventListener('DOMContentLoaded', refresh);
  window.ImpactoLocalSolicitudes = { refresh: refresh };
})();
