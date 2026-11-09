document.addEventListener('DOMContentLoaded', function () {
  var organizations = [];
  var applications = [];
  var helpRequests = [];
  var publications = [];
  var activeStatus = 'all';
  var quickFilter = '';
  var search = document.getElementById('organizationSearch');
  var grid = document.getElementById('organizationGrid');
  var helpRequestList = document.getElementById('helpRequestList');
  var publicationList = document.getElementById('publicationList');
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
    var status = String(application.estado || '').trim().toLocaleLowerCase('es');
    if (status === 'aprobada') return 'verified';
    if (status === 'rechazada') return 'observed';
    return 'pending';
  }
  function isPending(application) { return String(application.estado || '').trim().toLocaleLowerCase('es') === 'pendiente'; }
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
      if (quickFilter === 'ayuda' && record.kind !== 'application') return false;
      if (term && ![record.name, record.email, record.description, record.type, record.web].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').includes(term.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es'))) return false;
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

  function renderHelpRequests() {
    helpRequestList.replaceChildren();
    var pending = helpRequests.filter(function (item) { return String(item.estado || '').trim().toLowerCase() === 'pendiente'; });
    document.getElementById('helpRequestCount').textContent = pending.length + ' pendientes';
    document.getElementById('latestRequestCount').textContent = pending.length;
    if (!helpRequests.length) {
      helpRequestList.append(make('p', 'organization-empty', 'No hay solicitudes de ayuda registradas.'));
      return;
    }
    helpRequests.slice().sort(function (a, b) {
      return Number(String(b.estado || '').toLowerCase() === 'pendiente') - Number(String(a.estado || '').toLowerCase() === 'pendiente');
    }).forEach(function (item) {
      var card = make('article', 'moderation-card');
      var content = make('div', 'moderation-card-content');
      var titleRow = make('div', 'moderation-card-title');
      titleRow.append(make('h2', '', item.titulo || 'Solicitud de ayuda'));
      titleRow.append(make('span', 'moderation-type', item.estado === 'pendiente' ? 'PENDIENTE · ESTADO NULL' : item.estado));
      content.appendChild(titleRow);
      content.appendChild(make('p', 'moderation-description', item.descripcion || 'Sin descripción.'));
      var details = [
        'Organización: ' + (item.nombre_usuario || 'No identificada'),
        item.tipo ? 'Tipo: ' + item.tipo : '',
        item.ubicacion ? 'Ubicación: ' + item.ubicacion : '',
        item.meta ? 'Meta/cantidad: ' + item.meta : ''
      ].filter(Boolean);
      content.appendChild(make('p', 'moderation-sender', details.join(' · ')));
      var sent = [item.fecha, item.hora].filter(Boolean).map(function (part) {
        var value = String(part);
        var match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
        return match ? match[3] + '/' + match[2] + '/' + match[1] : value;
      });
      if (sent.length) content.appendChild(make('p', 'moderation-request-meta', 'Enviado desde el dispositivo: ' + sent.join(' · ')));
      if (item.fecha_limite) content.appendChild(make('p', 'moderation-request-meta', 'Fecha límite: ' + String(item.fecha_limite).slice(0, 10)));
      var links = make('div', 'moderation-request-links');
      [['Sitio web', item.web], ['Instagram', item.instagram], ['Facebook', item.facebook], ['TikTok', item.tik_tok]].forEach(function (entry) {
        if (!entry[1]) return;
        try {
          var url = new URL(String(entry[1]), window.location.href);
          if (!['http:', 'https:'].includes(url.protocol)) return;
          var link = make('a', '', entry[0]);
          link.href = url.href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          links.appendChild(link);
        } catch (error) {}
      });
      if (links.childElementCount) content.appendChild(links);
      var actions = make('div', 'moderation-actions');
      if (String(item.estado || '').trim().toLowerCase() === 'pendiente') {
        var approve = make('button', 'approve', '✓ Aceptar y publicar');
        var reject = make('button', 'reject', '× Rechazar');
        approve.type = reject.type = 'button';
        approve.addEventListener('click', function () { updateHelpRequest(item.id, 'aceptado'); });
        reject.addEventListener('click', function () { updateHelpRequest(item.id, 'rechazado'); });
        actions.append(approve, reject);
      } else actions.append(make('span', '', 'Estado: ' + item.estado));
      content.append(actions);
      var evidence = make('aside', 'moderation-evidence');
      if (item.imagen) {
        var image = document.createElement('img');
        image.src = item.imagen;
        image.alt = 'Imagen principal de ' + (item.titulo || 'la solicitud');
        image.style.cssText = 'width:100%;height:100%;max-height:220px;object-fit:contain';
        evidence.appendChild(image);
        evidence.appendChild(make('strong', '', item.imagen_nombre || 'Imagen adjunta'));
      } else evidence.append(make('i', 'fa-regular fa-image'), make('strong', '', 'Sin imagen adjunta'));
      card.append(content, evidence);
      helpRequestList.append(card);
    });
  }
  function renderPublications() {
    publicationList.replaceChildren();
    document.getElementById('publicationCount').textContent = publications.length;
    document.getElementById('publicationTotal').textContent = publications.length + (publications.length === 1 ? ' publicación' : ' publicaciones');
    if (!publications.length) {
      publicationList.append(make('p', 'organization-empty', 'No hay publicaciones registradas en PRINCIPAL_ORG.'));
      return;
    }
    function imageSource(value) {
      var raw = String(value || '').trim();
      if (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i.test(raw)) return raw.replace(/\s/g, '');
      try {
        var url = new URL(raw, window.location.href);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
      } catch (error) { return ''; }
    }
    function displayDate(value) {
      var raw = String(value || '');
      var match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
      return match ? match[3] + '/' + match[2] + '/' + match[1] : raw;
    }
    publications.forEach(function (item) {
      var card = make('article', 'moderation-card publication-card');
      var content = make('div', 'moderation-card-content');
      var titleRow = make('div', 'moderation-card-title');
      titleRow.append(make('h2', '', item.titulo || 'Publicación sin título'));
      var normalizedState = String(item.estado ?? '').trim().toLowerCase();
      var pendingPublication = item.estado === null || item.estado === undefined || ['', 'null', 'pendiente', 'pending'].includes(normalizedState);
      var acceptedPublication = ['aceptado', 'aceptada', 'aprobado', 'aprobada', 'vigente', 'true', '1'].includes(normalizedState) || item.estado === true;
      var rejectedPublication = ['rechazado', 'rechazada', 'false', '0'].includes(normalizedState) || item.estado === false;
      var state = pendingPublication ? 'PENDIENTE · ESTADO NULL' : acceptedPublication ? 'ACEPTADO' : rejectedPublication ? 'RECHAZADO' : String(item.estado);
      titleRow.append(make('span', 'moderation-type', state));
      content.appendChild(titleRow);
      content.appendChild(make('p', 'moderation-sender', 'Organización: ' + (item.nombre_usuario || 'No identificada')));
      content.appendChild(make('p', 'moderation-description', item.descripcion || 'Sin descripción.'));
      [['subtitulo_1', 'texto_1'], ['subtitulo_2', 'texto_2']].forEach(function (fields) {
        var subtitle = String(item[fields[0]] || '').trim();
        var body = String(item[fields[1]] || '').trim();
        if (subtitle || body) content.appendChild(make('p', 'moderation-request-meta', (subtitle ? subtitle + ': ' : '') + body));
      });
      var sent = [item.fecha ? displayDate(item.fecha) : '', item.hora ? String(item.hora).slice(0, 8) : ''].filter(Boolean);
      content.appendChild(make('p', 'moderation-request-meta', 'Fecha y hora: ' + (sent.length ? sent.join(' · ') : 'Sin dato')));
      var links = make('div', 'moderation-request-links');
      [['Sitio web', item.web], ['Instagram', item.instagram], ['Facebook', item.facebook], ['TikTok', item.tik_tok]].forEach(function (entry) {
        if (!entry[1]) return;
        try {
          var url = new URL(String(entry[1]), window.location.href);
          if (!['http:', 'https:'].includes(url.protocol)) return;
          var link = make('a', '', entry[0]);
          link.href = url.href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          links.appendChild(link);
        } catch (error) {}
      });
      if (links.childElementCount) content.appendChild(links);
      var gallery = make('aside', 'moderation-evidence publication-images');
      [['imagen_principal', 'Imagen principal'], ['imagen_secundaria', 'Imagen secundaria']].forEach(function (entry) {
        var src = imageSource(item[entry[0]]);
        if (!src) return;
        var figure = make('figure', 'publication-image');
        var image = document.createElement('img');
        image.src = src;
        image.alt = entry[1] + ' de ' + (item.nombre_usuario || 'la organización');
        image.loading = 'lazy';
        figure.append(image, make('figcaption', '', entry[1]));
        gallery.appendChild(figure);
      });
      if (!gallery.childElementCount) gallery.append(make('i', 'fa-regular fa-image'), make('strong', '', 'Sin imágenes adjuntas'));
      if (pendingPublication) {
        var actions = make('div', 'moderation-actions');
        var approve = make('button', 'approve', '✓ Aceptar');
        var reject = make('button', 'reject', '× Rechazar');
        approve.type = reject.type = 'button';
        approve.addEventListener('click', function () { updatePublication(item.nombre_usuario, 'aceptado'); });
        reject.addEventListener('click', function () { updatePublication(item.nombre_usuario, 'rechazado'); });
        actions.append(approve, reject);
        content.append(actions);
      }
      card.append(content, gallery);
      publicationList.append(card);
    });
  }
  async function loadDashboard() {
    var directoryFeedback = document.getElementById('directoryFeedback');
    var results = await Promise.allSettled([
      fetch('/api/admin/organizaciones').then(async function (response) { if (response.status === 401) { location.replace('administradores-iniciar-sesion.html'); throw new Error('Sesión vencida'); } var body = await response.json(); if (!response.ok) throw new Error(body.message || 'No se pudo cargar el directorio.'); return body.organizaciones || []; }),
      fetch('/api/admin/solicitudes').then(async function (response) { if (response.status === 401) { location.replace('administradores-iniciar-sesion.html'); throw new Error('Sesión vencida'); } var body = await response.json(); if (!response.ok) throw new Error(body.message || 'No se pudieron cargar las solicitudes.'); return body.solicitudes || []; }),
      fetch('/api/admin/solicitudes-ayuda').then(async function (response) { if (response.status === 401) { location.replace('administradores-iniciar-sesion.html'); throw new Error('SesiÃ³n vencida'); } var body = await response.json(); if (!response.ok) throw new Error(body.message || 'No se pudieron cargar las solicitudes de ayuda.'); return body.solicitudes || []; }),
      fetch('/api/admin/publicaciones').then(async function (response) { if (response.status === 401) { location.replace('administradores-iniciar-sesion.html'); throw new Error('Sesión vencida'); } var body = await response.json(); if (!response.ok) throw new Error(body.message || 'No se pudieron cargar las publicaciones.'); return body.publicaciones || []; })
    ]);
    if (results[0].status === 'fulfilled') {
      organizations = results[0].value;
      directoryFeedback.textContent = organizations.length ? 'Organizaciones cargadas desde Neon.' : 'No hay organizaciones registradas todavía.';
    } else {
      directoryFeedback.textContent = results[0].reason.message;
      directoryFeedback.classList.add('is-error');
    }
    applications = results[1].status === 'fulfilled' ? results[1].value : [];
    var helpFeedback = document.getElementById('helpRequestsFeedback');
    if (results[2].status === 'fulfilled') {
      helpRequests = results[2].value;
      helpFeedback.textContent = helpRequests.length ? 'Solicitudes de ayuda cargadas desde Neon.' : 'Todavía no hay solicitudes de ayuda.';
    } else {
      helpRequests = [];
      helpFeedback.textContent = results[2].reason.message;
      helpFeedback.classList.add('is-error');
    }
    var publicationsFeedback = document.getElementById('publicationsFeedback');
    if (results[3].status === 'fulfilled') {
      publications = results[3].value;
      publicationsFeedback.textContent = publications.length ? 'Publicaciones cargadas desde PRINCIPAL_ORG.' : 'No hay publicaciones para mostrar.';
    } else {
      publications = [];
      publicationsFeedback.textContent = results[3].reason.message;
      publicationsFeedback.classList.add('is-error');
    }
    renderDirectory();
    renderHelpRequests();
    renderPublications();
  }
  async function updatePublication(nombreUsuario, estado) {
    try {
      var response = await fetch('/api/admin/publicaciones', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre_usuario: nombreUsuario, estado: estado }) });
      var result = await response.json();
      if (!response.ok) throw new Error(result.message || 'No se pudo actualizar la publicación.');
      await loadDashboard();
    } catch (error) { alert(error.message); }
  }
  async function updateHelpRequest(id, estado) {
    try {
      var response = await fetch('/api/admin/solicitudes-ayuda', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id, estado: estado }) });
      var result = await response.json();
      if (!response.ok) throw new Error(result.message || 'No se pudo actualizar la solicitud de ayuda.');
      await loadDashboard();
    } catch (error) { alert(error.message); }
  }
  document.getElementById('logout').addEventListener('click', async function () {
    await fetch('/api/admin/logout', { method: 'POST' });
    location.replace('administradores-iniciar-sesion.html');
  });
  loadDashboard();
});
