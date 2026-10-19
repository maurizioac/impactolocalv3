document.addEventListener('DOMContentLoaded', function () {
  var organizations = [];
  var applications = [];
  var activeStatus = 'all';
  var quickFilter = '';
  var visibleApplicationCount = 3;
  var search = document.getElementById('organizationSearch');
  var grid = document.getElementById('organizationGrid');
  var requestList = document.getElementById('applicationList');
  try {
    var adminSession = JSON.parse(localStorage.getItem('il_sesion') || 'null');
    var adminName = document.getElementById('adminAccountName');
    if (adminName && adminSession && adminSession.rol === 'superadmin' && adminSession.nombre) adminName.textContent = adminSession.nombre;
  } catch (error) {}

  function make(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
  }
  function showView(view) {
    document.querySelectorAll('[data-admin-view]').forEach(function (button) { button.classList.toggle('is-active', button.dataset.adminView === view); });
    document.querySelectorAll('[data-admin-panel]').forEach(function (panel) { panel.hidden = panel.dataset.adminPanel !== view; });
  }
  document.querySelectorAll('[data-admin-view]').forEach(function (button) {
    button.addEventListener('click', function () { showView(button.dataset.adminView); });
  });
  document.querySelectorAll('[data-return-discover]').forEach(function (button) { button.addEventListener('click', function () { showView('discover'); }); });

  function recordStatus(application) {
    if (application.estado === 'aprobada') return 'verified';
    if (application.estado === 'rechazada') return 'observed';
    return 'pending';
  }
  function allRecords() {
    var records = organizations.map(function (organization) {
      return {
        name: organization.nombre || 'Organización sin nombre',
        email: organization.email || '',
        description: organization.descripcion || 'Sin descripción registrada.',
        web: organization.web || '', instagram: organization.instagram || '', facebook: organization.facebook || '', tiktok: organization.tiktok || '',
        kind: 'organization', status: 'verified', updated: null
      };
    });
    var registeredEmails = new Set(records.map(function (record) { return record.email.toLowerCase(); }).filter(Boolean));
    applications.forEach(function (application) {
      var email = String(application.email || '').toLowerCase();
      if (email && registeredEmails.has(email)) return;
      records.push({
        id: application.id,
        name: application.usuario || 'Solicitud sin nombre',
        email: application.email || '',
        description: application.ocupacion || 'Solicitud de registro institucional.',
        web: application.web || '', instagram: application.instagram || '', facebook: application.facebook || '', tiktok: application.tiktok || '',
        type: application.tipo || 'Organización', kind: 'application', status: recordStatus(application),
        updated: application.creado_en || null, reason: application.motivo_rechazo || ''
      });
    });
    return records;
  }
  function statusLabel(status) {
    if (status === 'verified') return ['Verificada', 'is-verified'];
    if (status === 'observed') return ['Observada', 'is-observed'];
    return ['En validación', 'is-pending'];
  }
  function filteredRecords() {
    var term = search.value.trim().toLocaleLowerCase('es');
    var records = allRecords().filter(function (record) {
      if (activeStatus !== 'all' && record.status !== activeStatus) return false;
      if (quickFilter === 'foro' && record.kind !== 'foro') return false;
      if (quickFilter === 'ayuda' && record.kind !== 'application') return false;
      if (term && ![record.name, record.email, record.description, record.type, record.web].join(' ').toLocaleLowerCase('es').includes(term)) return false;
      return true;
    });
    if (quickFilter === 'recent') records.sort(function (a, b) { return new Date(b.updated || 0) - new Date(a.updated || 0); });
    else if (document.getElementById('organizationSort').value === 'status') records.sort(function (a, b) { return a.status.localeCompare(b.status); });
    else records.sort(function (a, b) { return a.name.localeCompare(b.name, 'es'); });
    return records;
  }
  function renderDirectory() {
    var records = allRecords();
    document.getElementById('countAll').textContent = records.length;
    document.getElementById('countVerified').textContent = records.filter(function (r) { return r.status === 'verified'; }).length;
    document.getElementById('countPending').textContent = records.filter(function (r) { return r.status === 'pending'; }).length;
    document.getElementById('countObserved').textContent = records.filter(function (r) { return r.status === 'observed'; }).length;
    grid.replaceChildren();
    var visible = filteredRecords();
    if (!visible.length) {
      grid.append(make('p', 'organization-empty', records.length ? 'No hay registros que coincidan con esos filtros.' : 'No hay organizaciones registradas para mostrar.'));
      return;
    }
    visible.forEach(function (record) {
      var card = make('article', 'organization-card');
      var top = make('div', 'organization-card-top');
      var statusData = statusLabel(record.status);
      var badge = make('span', 'organization-status ' + statusData[1]);
      var icon = document.createElement('i');
      icon.className = record.status === 'verified' ? 'fa-solid fa-check-double' : record.status === 'observed' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-clock';
      badge.append(icon, document.createTextNode(' ' + statusData[0]));
      var updated = make('span', 'organization-updated', record.updated ? new Date(record.updated).toLocaleDateString('es-PE') : 'Cuenta activa');
      top.append(badge, updated);
      var name = make('h2', '', record.name);
      var description = make('p', 'organization-card-description', record.description);
      var bottom = make('div', 'organization-card-bottom');
      var email = make('span', '', record.email || 'Correo no registrado');
      var detailsButton = make('button', '', record.status === 'observed' ? 'Resolver caso →' : record.status === 'pending' ? 'Auditar →' : 'Revisar ficha →');
      detailsButton.type = 'button';
      var details = make('div', 'organization-card-details');
      [['Tipo', record.type], ['Sitio web', record.web], ['Instagram', record.instagram], ['Facebook', record.facebook], ['TikTok', record.tiktok], ['Observación', record.reason]].forEach(function (pair) {
        if (pair[1]) details.append(make('span', '', pair[0] + ': ' + pair[1]));
      });
      detailsButton.addEventListener('click', function () {
        var expanded = card.classList.toggle('is-expanded');
        detailsButton.textContent = expanded ? 'Cerrar ficha ↑' : record.status === 'observed' ? 'Resolver caso →' : record.status === 'pending' ? 'Auditar →' : 'Revisar ficha →';
      });
      bottom.append(email, detailsButton);
      card.append(top, name, description, bottom, details);
      grid.append(card);
    });
  }
  document.querySelectorAll('[data-status-filter]').forEach(function (button) {
    button.addEventListener('click', function () {
      activeStatus = button.dataset.statusFilter;
      document.querySelectorAll('[data-status-filter]').forEach(function (other) { other.classList.toggle('is-active', other === button); });
      renderDirectory();
    });
  });
  document.querySelectorAll('[data-quick-filter]').forEach(function (button) {
    button.addEventListener('click', function () {
      var key = button.dataset.quickFilter;
      quickFilter = quickFilter === key ? '' : key;
      document.querySelectorAll('[data-quick-filter]').forEach(function (other) { other.classList.toggle('is-active', other.dataset.quickFilter === quickFilter); });
      renderDirectory();
    });
  });
  search.addEventListener('input', renderDirectory);
  document.getElementById('organizationSort').addEventListener('change', renderDirectory);
  document.getElementById('clearSearch').addEventListener('click', function () { search.value = ''; quickFilter = ''; document.querySelectorAll('[data-quick-filter]').forEach(function (button) { button.classList.remove('is-active'); }); renderDirectory(); search.focus(); });

  function renderApplications() {
    requestList.replaceChildren();
    var pendingApplications = applications.filter(function (application) { return application.estado === 'pendiente'; });
    var priorityCounter = document.getElementById('priorityCounter');
    var loadMore = document.getElementById('loadMoreApplications');
    priorityCounter.textContent = 'Pendientes prioritarias: ' + Math.min(visibleApplicationCount, pendingApplications.length) + ' de ' + pendingApplications.length;
    if (!pendingApplications.length) {
      requestList.append(make('p', 'organization-empty', 'No hay solicitudes institucionales para mostrar.'));
      loadMore.hidden = true;
      return;
    }
    pendingApplications.slice(0, visibleApplicationCount).forEach(function (application) {
      var card = make('article', 'moderation-card');
      var content = make('div', 'moderation-card-content');
      var titleRow = make('div', 'moderation-card-title');
      var title = make('h2', '', application.usuario || 'Solicitud institucional');
      titleRow.append(title, make('span', 'moderation-type', 'Solicitud ' + (application.tipo || 'Organización')));
      titleRow.append(make('time', 'moderation-date', application.creado_en ? new Date(application.creado_en).toLocaleDateString('es-PE') : 'Fecha no disponible'));
      content.append(titleRow);
      content.append(make('p', 'moderation-description', application.ocupacion || 'Solicitud de registro institucional.'));
      content.append(make('p', 'moderation-sender', 'Organización remitente: ' + (application.usuario || 'Nombre no registrado') + (application.email ? ' · ' + application.email : '')));
      var actions = make('div', 'moderation-actions');
      var observation = make('input', 'moderation-observation');
      observation.type = 'text';
      observation.maxLength = 500;
      observation.placeholder = '¿Por qué? (Observación de moderación)';
      observation.setAttribute('aria-label', 'Motivo de rechazo para ' + (application.usuario || 'la solicitud'));
      var approve = make('button', 'approve', '✓ Aceptar');
      var reject = make('button', 'reject', '× Rechazar');
      approve.type = reject.type = 'button';
      approve.addEventListener('click', function () { updateApplication(application.id, 'aprobada', ''); });
      reject.addEventListener('click', function () {
        var reason = observation.value.trim();
        if (reason.length < 5) {
          observation.setCustomValidity('Escribe un motivo de al menos 5 caracteres para rechazar.');
          observation.reportValidity();
          observation.addEventListener('input', function clearReason() { observation.setCustomValidity(''); observation.removeEventListener('input', clearReason); });
          return;
        }
        updateApplication(application.id, 'rechazada', reason);
      });
      actions.append(observation, approve, reject);
      content.append(actions);
      var evidence = make('aside', 'moderation-evidence');
      evidence.append(make('i', 'fa-regular fa-image'), make('strong', '', 'Sin evidencia adjunta'), make('span', '', 'Esta solicitud no incluye imagen.'));
      card.append(content, evidence);
      requestList.append(card);
    });
    var remaining = pendingApplications.length - visibleApplicationCount;
    loadMore.textContent = 'Cargar más solicitudes' + (remaining > 0 ? ' (' + remaining + ' restantes)' : '');
    loadMore.hidden = remaining <= 0;
  }
  document.getElementById('loadMoreApplications').addEventListener('click', function () { visibleApplicationCount += 3; renderApplications(); });
  async function loadDashboard() {
    var directoryFeedback = document.getElementById('directoryFeedback');
    var requestsFeedback = document.getElementById('requestsFeedback');
    var results = await Promise.allSettled([
      fetch('/api/admin/organizaciones').then(async function (response) { if (response.status === 401) { location.replace('administradores-iniciar-sesion.html'); throw new Error('Sesión vencida'); } var body = await response.json(); if (!response.ok) throw new Error(body.message || 'No se pudo cargar el directorio.'); return body.organizaciones || []; }),
      fetch('/api/admin/solicitudes').then(async function (response) { if (response.status === 401) { location.replace('administradores-iniciar-sesion.html'); throw new Error('Sesión vencida'); } var body = await response.json(); if (!response.ok) throw new Error(body.message || 'No se pudieron cargar las solicitudes.'); return body.solicitudes || []; })
    ]);
    if (results[0].status === 'fulfilled') {
      organizations = results[0].value;
      directoryFeedback.textContent = organizations.length ? 'Organizaciones cargadas desde Neon.' : 'No hay organizaciones registradas todavía.';
    } else {
      directoryFeedback.textContent = results[0].reason.message;
      directoryFeedback.classList.add('is-error');
    }
    if (results[1].status === 'fulfilled') {
      applications = results[1].value;
      requestsFeedback.textContent = applications.length ? 'Solicitudes de registro cargadas desde Neon.' : 'No hay solicitudes institucionales pendientes o históricas.';
    } else {
      applications = [];
      requestsFeedback.textContent = results[1].reason.message;
      requestsFeedback.classList.add('is-error');
    }
    document.getElementById('latestRequestCount').textContent = applications.filter(function (item) { return item.estado === 'pendiente'; }).length;
    renderDirectory();
    renderApplications();
  }
  async function updateApplication(id, estado, motivo) {
    try {
      var response = await fetch('/api/admin/solicitudes/' + encodeURIComponent(id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: estado, motivo: motivo }) });
      var result = await response.json();
      if (!response.ok) throw new Error(result.message || 'No se pudo actualizar la solicitud.');
      await loadDashboard();
    } catch (error) { alert(error.message); }
  }
  document.getElementById('logout').addEventListener('click', async function () {
    await fetch('/api/admin/logout', { method: 'POST' });
    location.replace('administradores-iniciar-sesion.html');
  });
  loadDashboard();
});
