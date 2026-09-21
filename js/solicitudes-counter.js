/**
 * Contador de Solicitudes de ImpactoLOCAL
 * ----------------------------------------
 * Guarda en localStorage el número total de solicitudes registradas
 * en la plataforma y lo muestra en cualquier elemento con el atributo
 * [data-solicitudes-count]. Cuando se registra una nueva solicitud
 * (por ejemplo, al enviar un formulario de "Regístrate"), se puede
 * llamar a window.ImpactoLocalSolicitudes.incrementar() para que el
 * número suba automáticamente en cualquier página que use este script.
 */
(function () {
  var STORAGE_KEY = 'impactolocal_solicitudes_count';
  var DEFAULT_COUNT = 14;

  function getCount() {
    var stored = window.localStorage ? localStorage.getItem(STORAGE_KEY) : null;
    var n = parseInt(stored, 10);
    return isNaN(n) ? DEFAULT_COUNT : n;
  }

  function renderCount(n) {
    document.querySelectorAll('[data-solicitudes-count]').forEach(function (el) {
      el.textContent = n;
    });
  }

  function setCount(n) {
    if (window.localStorage) {
      localStorage.setItem(STORAGE_KEY, String(n));
    }
    renderCount(n);
  }

  function incrementar(cantidad) {
    var actual = getCount();
    var nuevo = actual + (typeof cantidad === 'number' ? cantidad : 1);
    setCount(nuevo);
    return nuevo;
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderCount(getCount());
  });

  window.ImpactoLocalSolicitudes = {
    getCount: getCount,
    incrementar: incrementar
  };
})();
