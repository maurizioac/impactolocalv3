document.addEventListener('DOMContentLoaded', function () {
  var storageKey = 'impactolocal-ong-demo-v1';
  var seed = {
    profile: { name: 'Greenpeace Perú', summary: 'Trabajamos por la protección del ambiente, la justicia climática y la biodiversidad en el Perú.', location: 'Lima, Perú', email: 'contacto@greenpeace.org.pe', website: 'https://www.greenpeace.org/peru/' },
    posts: [
      { title: 'Avanzamos con la limpieza de la Costa Verde', body: 'Este fin de semana, voluntarias y voluntarios retiraron residuos de la playa y separaron materiales reciclables. Gracias a todas las personas que se sumaron.', date: 'Hace 2 días', icon: 'fa-water' },
      { title: 'Taller comunitario por una ciudad más sostenible', body: 'Compartimos herramientas prácticas para reducir residuos y cuidar nuestros espacios comunes. Seguimos construyendo soluciones junto a los barrios.', date: 'Hace 1 semana', icon: 'fa-people-group' }
    ],
    requests: [
      { title: 'Voluntariado para limpieza de playas', type: 'Voluntariado presencial', description: 'Buscamos personas para apoyar en una jornada de limpieza, clasificación de residuos y sensibilización ambiental en la Costa Verde. No necesitas experiencia previa.', location: 'Costa Verde, Lima', places: 12, date: '', state: 'Aprobada' },
      { title: 'Diseño gráfico para campaña ambiental', type: 'Micro-voluntariado remoto', description: 'Necesitamos apoyo profesional para diseñar piezas digitales accesibles para una campaña de protección de ecosistemas costeros.', location: 'Remoto', places: 2, date: '', state: 'Aprobada' }
    ]
  };
  function load() {
    try { return Object.assign({}, seed, JSON.parse(localStorage.getItem(storageKey) || '{}')); }
    catch (error) { return seed; }
  }
  var data = load();
  data.profile = Object.assign({}, seed.profile, data.profile || {});
  data.posts = Array.isArray(data.posts) ? data.posts : seed.posts;
  data.requests = Array.isArray(data.requests) ? data.requests : seed.requests;
  function save() { localStorage.setItem(storageKey, JSON.stringify(data)); }
  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; });
  }

  var nav = document.getElementById('ongNav');
  var toggle = document.getElementById('ongNavToggle');
  if (toggle && nav) toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('[data-ong-tab]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      var target = link.dataset.ongTab;
      document.querySelectorAll('[data-ong-tab]').forEach(function (item) { item.classList.toggle('is-active', item === link); });
      document.querySelectorAll('[data-panel]').forEach(function (panel) {
        var visible = panel.dataset.panel === target;
        panel.hidden = !visible;
        panel.classList.toggle('is-visible', visible);
      });
      if (nav) nav.classList.remove('is-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      history.replaceState(null, '', '#' + target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  var profileForm = document.getElementById('ongProfileForm');
  Object.keys(data.profile).forEach(function (key) {
    var input = profileForm.elements.namedItem(key);
    if (input) input.value = data.profile[key];
  });
  function refreshProfile() {
    document.getElementById('profilePreviewName').textContent = data.profile.name;
    document.getElementById('profilePreviewSummary').textContent = data.profile.summary;
    document.getElementById('profilePreviewLocation').textContent = data.profile.location;
    document.getElementById('profilePreviewEmail').textContent = data.profile.email;
  }
  refreshProfile();
  profileForm.addEventListener('submit', function (event) {
    event.preventDefault();
    data.profile = Object.fromEntries(new FormData(profileForm).entries());
    save(); refreshProfile();
    document.getElementById('profileFeedback').textContent = 'Cambios guardados en este navegador.';
  });

  var feed = document.getElementById('ongFeed');
  function renderPosts() {
    feed.innerHTML = data.posts.map(function (post) {
      return '<article class="ong-card ong-post"><div class="ong-post-top"><span class="ong-post-avatar"><i class="fa-solid fa-leaf"></i></span><div><strong>' + escapeHtml(data.profile.name) + '</strong><span>' + escapeHtml(post.date || 'Ahora') + '</span></div><span class="ong-post-mark"><i class="fa-solid fa-circle-check"></i> Actualización</span></div><h3>' + escapeHtml(post.title) + '</h3><p>' + escapeHtml(post.body) + '</p>' + (post.image ? '<img class="ong-post-image" src="' + escapeHtml(post.image) + '" alt="Imagen de la actividad" loading="lazy">' : '') + '<div class="ong-post-footer"><span><i class="fa-regular fa-heart"></i> Comunidad ImpactoLOCAL</span><span><i class="fa-regular fa-comment"></i> Compartir avance</span></div></article>';
    }).join('');
    document.getElementById('ongPostCount').textContent = data.posts.length + 1;
  }
  renderPosts();
  document.getElementById('ongPostForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var form = event.currentTarget;
    var values = Object.fromEntries(new FormData(form).entries());
    data.posts.unshift({ title: values.title, body: values.body, image: values.image, date: 'Ahora', icon: 'fa-leaf' });
    save(); renderPosts(); form.reset();
    document.getElementById('postFeedback').textContent = 'Actualización agregada a la vista de demostración.';
  });

  var requestForm = document.getElementById('ongRequestForm');
  var requestList = document.getElementById('ongRequestList');
  function renderRequests() {
    requestList.innerHTML = data.requests.map(function (request, index) {
      var state = request.state || 'Pendiente';
      var statusClass = state.toLowerCase() === 'aprobada' ? 'state-approved' : state.toLowerCase() === 'rechazada' ? 'state-rejected' : 'state-pending';
      return '<article class="ong-card ong-request-item"><div class="ong-request-item-head"><span class="ong-request-type"><i class="fa-solid fa-hand-holding-heart"></i> ' + escapeHtml(request.type) + '</span><span class="ong-review-state ' + statusClass + '">' + escapeHtml(state) + '</span></div><h3>' + escapeHtml(request.title) + '</h3><p>' + escapeHtml(request.description) + '</p><div class="ong-request-meta"><span><i class="fa-solid fa-location-dot"></i> ' + escapeHtml(request.location || 'Ubicación por confirmar') + '</span><span><i class="fa-solid fa-user-group"></i> ' + escapeHtml(request.places) + ' vacantes</span>' + (request.date ? '<span><i class="fa-regular fa-calendar"></i> ' + escapeHtml(request.date) + '</span>' : '') + '</div>' + (state === 'Pendiente' ? '<button class="ong-delete-request" type="button" data-delete-request="' + index + '"><i class="fa-regular fa-trash-can"></i> Quitar borrador</button>' : '') + '</article>';
    }).join('');
    document.getElementById('ongRequestCount').textContent = data.requests.filter(function (r) { return r.state === 'Aprobada'; }).length;
    document.getElementById('ongPendingCount').textContent = data.requests.filter(function (r) { return r.state === 'Pendiente'; }).length + 1;
  }
  renderRequests();
  requestList.addEventListener('click', function (event) {
    var button = event.target.closest('[data-delete-request]');
    if (!button) return;
    data.requests.splice(Number(button.dataset.deleteRequest), 1); save(); renderRequests();
  });
  document.getElementById('newRequestBtn').addEventListener('click', function () {
    requestForm.hidden = false; requestForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  document.getElementById('cancelRequestBtn').addEventListener('click', function () { requestForm.hidden = true; requestForm.reset(); });
  requestForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var values = Object.fromEntries(new FormData(requestForm).entries());
    values.state = 'Pendiente'; data.requests.unshift(values); save(); renderRequests();
    requestForm.reset(); requestForm.hidden = true;
    document.getElementById('requestFeedback').textContent = 'Solicitud guardada como pendiente de revisión.';
  });
});
