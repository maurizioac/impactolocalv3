document.addEventListener('DOMContentLoaded', function () {
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
      if (target === 'revision' && typeof renderReviewExpedients === 'function') renderReviewExpedients();
      if (nav) nav.classList.remove('is-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      history.replaceState(null, '', '#' + target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  var form = document.getElementById('ongPageForm');
  if (!form) return;
  var feedback = document.getElementById('editorFeedback');
  var coverUrl = '';
  var actionImageUrl = '';
  var coverData = '';
  var actionImageData = '';
  var defaults = {
    name: '', description: '', subtitle1: '', text1: '', subtitle2: '', text2: '',
    location: '', phone: '', website: '', instagram: '', facebook: '', tiktok: '', email: ''
  };
  var session = null;
  try { session = JSON.parse(localStorage.getItem('il_sesion') || 'null'); } catch (error) { session = null; }
  var normalizeOrganizationName = function (name) {
    return String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  };
  var storageKey = 'impactolocal-ong-page-draft-v1:' + normalizeOrganizationName(session && session.nombre || 'anonima');
  if (session && session.rol === 'organizacion') {
    var accountName = document.getElementById('ongAccountName');
    if (accountName) accountName.textContent = session.nombre || 'Organización';
  }
  try {
    if (!localStorage.getItem(storageKey) && session && session.rol === 'organizacion') {
      var legacyDraft = JSON.parse(localStorage.getItem('impactolocal-ong-page-draft-v1') || 'null');
      if (legacyDraft && normalizeOrganizationName(legacyDraft.name) === normalizeOrganizationName(session.nombre)) {
        localStorage.setItem(storageKey, JSON.stringify(legacyDraft));
      }
    }
  } catch (error) { /* Los borradores antiguos inválidos se ignoran. */ }
  try {
    var saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    Object.keys(defaults).forEach(function (key) {
      if (typeof saved[key] === 'string' && form.elements.namedItem(key)) form.elements.namedItem(key).value = saved[key];
    });
  } catch (error) { /* Un borrador inválido no debe bloquear el editor. */ }
  if (session && session.rol === 'organizacion') {
    if (!form.elements.namedItem('name').value) form.elements.namedItem('name').value = session.nombre || '';
    if (!form.elements.namedItem('email').value) form.elements.namedItem('email').value = session.email || '';
  }

  function value(name, fallback) {
    return form.elements.namedItem(name).value.trim() || fallback;
  }
  function validWebAddress(raw) {
    var address = String(raw || '').trim();
    if (!address || address === '-') return '';
    try {
      var parsed = new URL(address);
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
    } catch (error) { return ''; }
  }
  function refreshPreview() {
    var organizationName = value('name', (session && session.nombre) || 'Nombre de tu organización');
    document.getElementById('previewName').textContent = organizationName;
    document.getElementById('previewDescription').textContent = value('description', 'Cuéntale a la comunidad quiénes son, qué hacen y a quiénes ayudan.');
    var location = document.getElementById('previewLocation');
    location.lastChild.textContent = ' ' + value('location', 'Tu región, Perú');
    document.getElementById('previewSubtitle1').textContent = value('subtitle1', '¿Cómo lo hacemos?');
    document.getElementById('previewText1').textContent = value('text1', 'Describe brevemente el enfoque de trabajo de tu organización.');
    document.getElementById('previewSubtitle2').textContent = value('subtitle2', 'Nuestros pilares de acción');
    document.getElementById('previewText2').textContent = value('text2', 'Comparte los principios y objetivos que guían su trabajo.');
    document.getElementById('descriptionCount').textContent = form.elements.namedItem('description').value.length;
    var cover = document.getElementById('previewCover');
    cover.hidden = !coverUrl;
    if (coverUrl) cover.src = coverUrl;
    var actionImage = document.getElementById('previewActionImage');
    actionImage.hidden = !actionImageUrl;
    if (actionImageUrl) actionImage.src = actionImageUrl;
  }

  function collectDraft() {
    var values = {};
    Object.keys(defaults).forEach(function (key) { values[key] = form.elements.namedItem(key).value; });
    return values;
  }
  function saveDraft() {
    try { localStorage.setItem(storageKey, JSON.stringify(collectDraft())); }
    catch (error) { feedback.textContent = 'No se pudo guardar el borrador en este navegador.'; return false; }
    return true;
  }
  form.addEventListener('input', refreshPreview);
  form.querySelectorAll('input[type="file"]').forEach(function (input) {
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      var wrapper = input.closest('.editor-upload');
      var name = wrapper.querySelector('.editor-file-name');
      if (!file) return;
      if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 2.5 * 1024 * 1024) {
        input.value = '';
        name.textContent = 'Usa PNG, JPG o WEBP de hasta 2.5 MB.';
        name.classList.add('is-error');
        return;
      }
      name.classList.remove('is-error');
      name.textContent = file.name;
      var url = URL.createObjectURL(file);
      if (input.name === 'cover') {
        if (coverUrl) URL.revokeObjectURL(coverUrl);
        coverUrl = url;
      } else {
        if (actionImageUrl) URL.revokeObjectURL(actionImageUrl);
        actionImageUrl = url;
      }
      refreshPreview();
    });
  });
  document.getElementById('savePageDraft').addEventListener('click', function () {
    feedback.textContent = saveDraft() ? 'Borrador guardado en este navegador.' : feedback.textContent;
  });
  function loadOrganizationProfile() {
    if (!session || session.rol !== 'organizacion') return;
    fetch('/api/principal-org')
      .then(function (response) { return response.json().then(function (body) { if (!response.ok) throw new Error(body.message || 'No se pudo cargar la ficha publicada.'); return body; }); })
      .then(function (body) {
        var username = normalizeOrganizationName(session.nombre);
        var profile = body.mi_organizacion || (Array.isArray(body.organizaciones) ? body.organizaciones : []).find(function (item) {
          return normalizeOrganizationName(item.nombre_usuario) === username;
        });
        if (!profile) {
          feedback.textContent = 'No encontramos una ficha guardada para esta organización. Completa los datos y pulsa “Guardar y publicar”.';
          return;
        }
        form.elements.namedItem('name').value = profile.titulo || '';
        form.elements.namedItem('description').value = profile.descripcion || '';
        form.elements.namedItem('subtitle1').value = profile.subtitulo_1 || '';
        form.elements.namedItem('text1').value = profile.texto_1 || '';
        form.elements.namedItem('subtitle2').value = profile.subtitulo_2 || '';
        form.elements.namedItem('text2').value = profile.texto_2 || '';
        form.elements.namedItem('website').value = validWebAddress(profile.web);
        form.elements.namedItem('instagram').value = validWebAddress(profile.instagram);
        form.elements.namedItem('facebook').value = validWebAddress(profile.facebook);
        form.elements.namedItem('tiktok').value = validWebAddress(profile.tik_tok);
        coverData = profile.imagen_principal || '';
        actionImageData = profile.imagen_secundaria || '';
        coverUrl = coverData;
        actionImageUrl = actionImageData;
        var coverName = form.elements.namedItem('cover').closest('.editor-upload').querySelector('.editor-file-name');
        var actionName = form.elements.namedItem('actionImage').closest('.editor-upload').querySelector('.editor-file-name');
        coverName.textContent = coverData ? 'Imagen guardada en Neon' : '';
        actionName.textContent = actionImageData ? 'Imagen guardada en Neon' : '';
        refreshPreview();
      })
      .catch(function (error) { feedback.textContent = error.message || 'No se pudo cargar la ficha de Neon.'; });
  }
  loadOrganizationProfile();
  function readPageImage(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('No se pudo leer una de las imágenes.')); };
      reader.readAsDataURL(file);
    });
  }
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    var submitButton = form.querySelector('button[type="submit"]');
    var coverFile = form.elements.namedItem('cover').files[0];
    var actionFile = form.elements.namedItem('actionImage').files[0];
    if ((coverFile && coverFile.size > 2.5 * 1024 * 1024) || (actionFile && actionFile.size > 2.5 * 1024 * 1024)) {
      feedback.textContent = 'Cada imagen puede pesar hasta 2.5 MB.';
      return;
    }
    if (submitButton) submitButton.disabled = true;
    feedback.textContent = 'Guardando la ficha de organización en Neon...';
    try {
      var payload = {
        titulo: form.elements.namedItem('name').value.trim(),
        descripcion: form.elements.namedItem('description').value.trim(),
        imagen_principal: coverFile ? await readPageImage(coverFile) : (coverData || null),
        imagen_secundaria: actionFile ? await readPageImage(actionFile) : (actionImageData || null),
        subtitulo_1: form.elements.namedItem('subtitle1').value.trim(),
        texto_1: form.elements.namedItem('text1').value.trim(),
        subtitulo_2: form.elements.namedItem('subtitle2').value.trim(),
        texto_2: form.elements.namedItem('text2').value.trim(),
        web: form.elements.namedItem('website').value.trim(),
        instagram: form.elements.namedItem('instagram').value.trim(),
        facebook: form.elements.namedItem('facebook').value.trim(),
        tik_tok: form.elements.namedItem('tiktok').value.trim()
      };
      var response = await fetch('/api/principal-org', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var result = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(result.message || 'No se pudo guardar la ficha en Neon.');

      var saved = result.organizacion;
      coverData = saved.imagen_principal || '';
      actionImageData = saved.imagen_secundaria || '';
      if (coverUrl && coverUrl.startsWith('blob:')) URL.revokeObjectURL(coverUrl);
      if (actionImageUrl && actionImageUrl.startsWith('blob:')) URL.revokeObjectURL(actionImageUrl);
      coverUrl = coverData;
      actionImageUrl = actionImageData;
      refreshPreview();
      try { saveDraft(); } catch (error) {}
      document.querySelector('.page-editor-state strong').innerHTML = '<i class="fa-solid fa-circle"></i> Publicado en Descubre';
      feedback.textContent = 'Ficha guardada en PRINCIPAL_ORG. La página Descubre ya puede mostrar estos cambios.';
      form.elements.namedItem('cover').value = '';
      form.elements.namedItem('actionImage').value = '';
      form.elements.namedItem('cover').closest('.editor-upload').querySelector('.editor-file-name').textContent = coverData ? 'Imagen guardada en Neon' : '';
      form.elements.namedItem('actionImage').closest('.editor-upload').querySelector('.editor-file-name').textContent = actionImageData ? 'Imagen guardada en Neon' : '';
    } catch (error) {
      feedback.textContent = error.message || 'No se pudo guardar la ficha en Neon.';
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
  refreshPreview();


  var requestItems = [];
  var requestsHeading = document.getElementById('requestsPageHeading');
  var requestsList = document.getElementById('ongRequestList');
  var requestForm = document.getElementById('ongRequestForm');
  var requestTrigger = document.getElementById('requestCreateTrigger');
  var requestNotice = document.getElementById('requestNotice');
  var requestFilter = 'vigentes';
  var editingRequestId = null;
  var requestOrganization = document.getElementById('ongAccountName').textContent;
  var requestImagePreview = document.getElementById('requestImagePreview');
  var requestImageName = document.getElementById('requestImageName');
  var requestImageObjectUrl = '';

  function clearRequestImage() {
    if (requestImageObjectUrl) URL.revokeObjectURL(requestImageObjectUrl);
    requestImageObjectUrl = '';
    requestImagePreview.hidden = true;
    requestImagePreview.removeAttribute('src');
    requestImageName.textContent = 'Haz clic para elegir una imagen';
    requestImageName.classList.remove('is-error');
  }

  function requestStatus(item) {
    if (item.status === true) return { label: 'Vigente · Aceptada', className: 'is-accepted' };
    if (item.status === false) return { label: 'Rechazada', className: 'is-rejected' };
    return { label: 'En revisión', className: 'is-pending' };
  }
  function visibleRequests() {
    return requestItems.filter(function (item) {
      if (requestFilter === 'vigentes') return item.status === true;
      if (requestFilter === 'rechazadas') return item.status === false;
      return item.status === null;
    });
  }
  function renderRequests() {
    requestOrganization = document.getElementById('ongAccountName').textContent;
    document.getElementById('activeRequestCount').textContent = requestItems.filter(function (item) { return item.status === true; }).length;
    document.getElementById('pendingRequestCount').textContent = requestItems.filter(function (item) { return item.status === null; }).length;
    document.getElementById('rejectedRequestCount').textContent = requestItems.filter(function (item) { return item.status === false; }).length;
    requestsList.replaceChildren();
    var filtered = visibleRequests();
    if (!filtered.length) {
      var empty = document.createElement('p');
      empty.className = 'request-empty-state';
      empty.textContent = requestFilter === 'vigentes' ? 'Todavía no tienes solicitudes aceptadas.' : requestFilter === 'pendientes' ? 'No tienes solicitudes en revisión.' : 'No tienes solicitudes rechazadas.';
      requestsList.append(empty);
      return;
    }
    filtered.forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'request-card';
      var copy = document.createElement('div');
      copy.className = 'request-card-copy';
      var heading = document.createElement('div');
      heading.className = 'request-card-heading';
      var org = document.createElement('strong');
      org.textContent = item.organization || 'Organización sin identificar';
      var type = document.createElement('span');
      type.className = 'request-type-label';
      type.textContent = 'Solicitud: ' + item.type;
      var date = document.createElement('time');
      date.className = 'request-card-date';
      date.textContent = item.date || 'Sin fecha';
      heading.append(org, type, date);
      var state = requestStatus(item);
      var status = document.createElement('span');
      status.className = 'request-status ' + state.className;
      status.innerHTML = '<i class="fa-solid fa-circle"></i> ' + state.label;
      var description = document.createElement('p');
      description.className = 'request-card-description';
      description.textContent = item.description;
      var footer = document.createElement('div');
      footer.className = 'request-card-footer';
      var goal = document.createElement('span');
      goal.className = 'request-goal';
      goal.textContent = 'Meta: ' + (item.goal || 'Por definir');
      var details = document.createElement('button');
      details.type = 'button';
      details.className = 'request-details-button';
      details.textContent = 'Ver detalles completos →';
      details.addEventListener('click', function () {
        var expanded = card.classList.toggle('is-expanded');
        details.textContent = expanded ? 'Ver menos ↑' : 'Ver detalles completos →';
      });
      var actions = document.createElement('div');
      actions.className = 'request-card-actions';
      actions.append(details);
      if (item.canEdit && item.id) {
        var edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'request-details-button request-edit-button';
        edit.textContent = 'Editar solicitud';
        edit.addEventListener('click', function () { editRequest(item); });
        actions.append(edit);
      }
      footer.append(goal, actions);
      copy.append(heading, status, description, footer);
      card.append(copy);
      var evidence = document.createElement('div');
      evidence.className = 'request-evidence';
      if (item._imagePreview || item.image) {
        var img = document.createElement('img');
        img.src = item._imagePreview || new URL(item.image, window.location.href).href;
        img.alt = 'Evidencia de la solicitud';
        evidence.append(img);
      } else {
        var icon = document.createElement('i');
        icon.className = 'fa-regular fa-image';
        evidence.append(icon);
      }
      var evidenceTitle = document.createElement('strong');
      evidenceTitle.textContent = 'Evidencia del Proyecto';
      var fileName = document.createElement('span');
      fileName.textContent = item.imageName || 'Sin evidencia adjunta';
      evidence.append(evidenceTitle, fileName);
      card.append(evidence);
      requestsList.append(card);
    });
  }
  document.querySelectorAll('[data-request-filter]').forEach(function (button) {
    button.addEventListener('click', function () {
      requestFilter = button.dataset.requestFilter;
      document.querySelectorAll('[data-request-filter]').forEach(function (item) { item.classList.toggle('is-active', item === button); });
      requestNotice.hidden = true;
      renderRequests();
    });
  });
  function requestField(item, aliases) {
    var wanted = aliases.map(function (key) { return key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); });
    var key = Object.keys(item || {}).find(function (name) {
      return wanted.includes(name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''));
    });
    return key && item[key] !== null && item[key] !== undefined ? item[key] : '';
  }
  function requestFromApi(item) {
    var rawStatus = requestField(item, ['estado', 'status']);
    var normalizedStatus = String(rawStatus === null || rawStatus === undefined ? '' : rawStatus).toLowerCase();
    var status = rawStatus === true || rawStatus === 1 || ['true', '1', 'aceptado', 'aceptada', 'vigente', 'aprobado', 'aprobada'].includes(normalizedStatus)
      ? true
      : rawStatus === false || rawStatus === 0 || ['false', '0', 'rechazado', 'rechazada'].includes(normalizedStatus)
        ? false : null;
    var rawDate = String(requestField(item, ['fecha limite', 'fecha limite de la solicitud', 'fecha de cierre', 'fecha objetivo']) || '').trim();
    var dateInput = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : '';
    var dayFirstDate = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(rawDate);
    if (!dateInput && dayFirstDate) dateInput = dayFirstDate[3] + '-' + dayFirstDate[2].padStart(2, '0') + '-' + dayFirstDate[1].padStart(2, '0');
    if (!dateInput && rawDate) {
      var parsedRawDate = new Date(rawDate);
      if (!Number.isNaN(parsedRawDate.getTime())) dateInput = parsedRawDate.toISOString().slice(0, 10);
    }
    var parsedDeadline = dateInput ? new Date(dateInput + 'T00:00:00') : null;
    var rawSubmissionDate = String(requestField(item, ['fecha', 'fecha de envio', 'fecha de solicitud']) || '').trim();
    var rawSubmissionTime = String(requestField(item, ['hora', 'hora de envio', 'hora de solicitud']) || '').trim();
    var submissionDate = rawSubmissionDate;
    var isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(rawSubmissionDate);
    if (isoDate) submissionDate = isoDate[3] + '/' + isoDate[2] + '/' + isoDate[1];
    var dateLabel = rawSubmissionDate
      ? 'Enviada: ' + submissionDate + (rawSubmissionTime ? ' · ' + rawSubmissionTime.slice(0, 8) : '')
      : parsedDeadline && !Number.isNaN(parsedDeadline.getTime()) ? 'Fecha límite: ' + parsedDeadline.toLocaleDateString('es-PE') : '';
    var organization = requestField(item, ['nombre_usuario', 'nombre de usuario', 'organizacion', 'nombre de la organizacion', 'autor']);
    var currentUsername = session && session.rol === 'organizacion' ? String(session.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';
    var ownerUsername = String(organization || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    var isOwn = item.puede_editar === true || (!!currentUsername && ownerUsername === currentUsername);
    return {
      id: requestField(item, ['id', 'id solicitud']), organization: String(organization || ''),
      canEdit: isOwn && status === null,
      title: String(requestField(item, ['titulo', 'titulo de la solicitud', 'titulo de solicitud', 'title']) || ''),
      type: String(requestField(item, ['tipo', 'tipo de solicitud', 'solicitud tipo', 'type', 'categoria']) || ''),
      description: String(requestField(item, ['descripcion', 'descripcion y detalles', 'description', 'detalles']) || ''),
      goal: String(requestField(item, ['meta', 'meta cantidad solicitada', 'meta cantidad', 'cantidad solicitada', 'cantidad', 'objetivo', 'goal']) || ''),
      location: String(requestField(item, ['ubicacion', 'ubicacion de la solicitud', 'location', 'lugar']) || ''),
      date: dateLabel,
      dateInput: dateInput,
      image: String(requestField(item, ['imagen principal', 'imagen', 'imagen parcial', 'evidencia', 'image']) || ''),
      imageName: requestField(item, ['imagen nombre', 'nombre archivo', 'nombre imagen', 'archivo evidencia', 'image name']) || (requestField(item, ['imagen principal', 'imagen', 'imagen parcial', 'evidencia', 'image']) ? 'Evidencia adjunta' : 'Sin evidencia adjunta'),
      status: status
    };
  }
  async function loadOrganizationRequests() {
    try {
      var response = await fetch('/api/solicitudes-org', { credentials: 'same-origin' });
      var body = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(body.message || 'No se pudieron cargar tus solicitudes desde Neon.');
      requestItems = (Array.isArray(body.solicitudes) ? body.solicitudes : []).map(requestFromApi);
      renderRequests();
      var reviewPanel = document.querySelector('[data-panel="revision"]');
      if (reviewPanel && reviewPanel.classList.contains('is-visible')) renderReviewExpedients();
    } catch (error) {
      renderRequests();
      requestNotice.textContent = error.message || 'No se pudieron cargar tus solicitudes desde Neon.';
      requestNotice.hidden = false;
    }
  }
  loadOrganizationRequests();
  function resetRequestEditor() {
    editingRequestId = null;
    requestForm.reset();
    clearRequestImage();
    requestForm.querySelector('.request-compose-top h1 span').textContent = 'Nueva necesidad';
    requestForm.querySelector('button[type="submit"]').textContent = 'Enviar solicitud';
    document.getElementById('requestFeedback').textContent = '';
  }
  function editRequest(item) {
    if (!item.canEdit || !item.id) return;
    resetRequestEditor();
    editingRequestId = item.id;
    requestForm.elements.namedItem('title').value = item.title;
    var typeSelect = requestForm.elements.namedItem('type');
    var savedType = String(item.type || '').replace(/^solicitud\s*:\s*/i, '').trim();
    var normalizedType = function (value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); };
    var matchingType = /^solicitud\s*:/i.test(String(item.type || '')) ? null : Array.from(typeSelect.options).find(function (option) {
      return normalizedType(option.value) === normalizedType(savedType) || normalizedType(option.textContent) === normalizedType(savedType);
    });
    if (!matchingType && savedType) {
      matchingType = document.createElement('option');
      matchingType.value = String(item.type || savedType);
      matchingType.textContent = savedType;
      typeSelect.appendChild(matchingType);
    }
    typeSelect.value = matchingType ? matchingType.value : '';
    requestForm.elements.namedItem('description').value = item.description;
    requestForm.elements.namedItem('location').value = item.location;
    requestForm.elements.namedItem('goal').value = item.goal;
    requestForm.elements.namedItem('date').value = item.dateInput || '';
    document.getElementById('requestDescriptionCount').textContent = item.description.length.toLocaleString('es-PE');
    if (item.image) {
      requestImagePreview.src = /^(data:|https?:|blob:)/i.test(item.image) ? item.image : new URL(item.image, window.location.href).href;
      requestImagePreview.hidden = false;
      requestImageName.textContent = 'Evidencia actual (sube otra para reemplazarla)';
    }
    requestForm.querySelector('.request-compose-top h1 span').textContent = 'Editar solicitud';
    requestForm.querySelector('button[type="submit"]').textContent = 'Guardar cambios';
    requestsHeading.hidden = true;
    requestsList.hidden = true;
    requestTrigger.hidden = true;
    requestNotice.hidden = true;
    requestForm.hidden = false;
    requestForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    requestForm.elements.namedItem('title').focus();
  }
  document.getElementById('newRequestBtn').addEventListener('click', function () {
    resetRequestEditor();
    requestsHeading.hidden = true;
    requestsList.hidden = true;
    requestTrigger.hidden = true;
    requestNotice.hidden = true;
    requestForm.hidden = false;
    requestForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    requestForm.elements.namedItem('title').focus();
  });
  document.getElementById('cancelRequestBtn').addEventListener('click', function () {
    resetRequestEditor();
    requestForm.hidden = true;
    requestsHeading.hidden = false;
    requestsList.hidden = false;
    requestTrigger.hidden = false;
    clearRequestImage();
  });
  requestForm.elements.namedItem('description').addEventListener('input', function (event) {
    document.getElementById('requestDescriptionCount').textContent = event.target.value.length.toLocaleString('es-PE');
  });
  requestForm.elements.namedItem('image').addEventListener('change', function (event) {
    var file = event.target.files[0];
    var feedback = document.getElementById('requestFeedback');
    if (file && (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024)) {
      event.target.value = '';
      feedback.textContent = 'Elige PNG, JPG o WEBP de hasta 5 MB.';
      requestImageName.textContent = 'Archivo no válido';
      requestImageName.classList.add('is-error');
      requestImagePreview.hidden = true;
      requestImagePreview.removeAttribute('src');
      if (requestImageObjectUrl) URL.revokeObjectURL(requestImageObjectUrl);
      requestImageObjectUrl = '';
      return;
    }
    feedback.textContent = '';
    requestImageName.classList.remove('is-error');
    if (requestImageObjectUrl) URL.revokeObjectURL(requestImageObjectUrl);
    requestImageObjectUrl = file ? URL.createObjectURL(file) : '';
    requestImageName.textContent = file ? file.name : 'Haz clic para elegir una imagen';
    requestImagePreview.hidden = !file;
    if (file) requestImagePreview.src = requestImageObjectUrl;
    else requestImagePreview.removeAttribute('src');
  });
  requestForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!requestForm.reportValidity()) return;
    var submitButton = requestForm.querySelector('button[type="submit"]');
    var feedback = document.getElementById('requestFeedback');
    if (submitButton) submitButton.disabled = true;
    feedback.textContent = 'Guardando solicitud en Neon...';
    try {
      var imageFile = requestForm.elements.namedItem('image').files[0];
      var formValues = Object.fromEntries(new FormData(requestForm).entries());
      var requestId = editingRequestId;
      if (requestId === null) {
        var normalizeRequestValue = function (value) {
          return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
        };
        var duplicate = requestItems.filter(function (item) {
          return item.canEdit && normalizeRequestValue(item.title) === normalizeRequestValue(formValues.title) &&
            normalizeRequestValue(item.type).replace(/^solicitud\s*:\s*/, '') === normalizeRequestValue(formValues.type).replace(/^solicitud\s*:\s*/, '') &&
            normalizeRequestValue(item.description) === normalizeRequestValue(formValues.description);
        }).sort(function (a, b) { return Number(a.id) - Number(b.id); })[0];
        if (duplicate) {
          requestId = duplicate.id;
          feedback.textContent = 'Ya existe una solicitud idéntica (#' + requestId + '). Se actualizará esa solicitud para evitar otra copia.';
        }
      }
      var deviceNow = new Date();
      var localFechaEnvio = deviceNow.getFullYear() + '-' + String(deviceNow.getMonth() + 1).padStart(2, '0') + '-' + String(deviceNow.getDate()).padStart(2, '0');
      var localHoraEnvio = String(deviceNow.getHours()).padStart(2, '0') + ':' + String(deviceNow.getMinutes()).padStart(2, '0') + ':' + String(deviceNow.getSeconds()).padStart(2, '0');
      var requestPayload = {
        titulo: formValues.title.trim(), tipo: formValues.type,
        descripcion: formValues.description.trim(), ubicacion: formValues.location.trim(),
        meta: formValues.goal.trim(), fecha_limite: formValues.date || '',
        fecha_envio: localFechaEnvio, hora_envio: localHoraEnvio,
        imagen: imageFile ? await readPageImage(imageFile) : null,
        imagen_nombre: imageFile ? imageFile.name : ''
      };
      if (requestId !== null) requestPayload.id = requestId;
      var response = await fetch('/api/solicitudes-org', {
        method: requestId !== null ? 'PATCH' : 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });
      var result = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(result.message || 'No se pudo guardar la solicitud en Neon.');
      if (result.solicitud) {
        var savedRequest = requestFromApi(result.solicitud);
        var existingIndex = requestItems.findIndex(function (item) { return String(item.id) === String(savedRequest.id); });
        if (existingIndex >= 0) requestItems.splice(existingIndex, 1, savedRequest);
        else requestItems.unshift(savedRequest);
      }
      if (requestId === null) {
        requestFilter = 'pendientes';
        document.querySelectorAll('[data-request-filter]').forEach(function (button) { button.classList.toggle('is-active', button.dataset.requestFilter === 'pendientes'); });
      }
      resetRequestEditor();
      document.getElementById('requestDescriptionCount').textContent = '0';
      requestForm.hidden = true;
      requestsHeading.hidden = false;
      requestsList.hidden = false;
      requestTrigger.hidden = false;
      renderRequests();
      feedback.textContent = requestId === null ? 'Solicitud guardada en SOLICITUDES_ORG.' : 'Cambios guardados en SOLICITUDES_ORG.';
      requestNotice.textContent = requestId === null ? 'Tu solicitud se guardó y quedó pendiente de aprobación. Aparecerá en la página de Solicitudes cuando el equipo la apruebe.' : 'La solicitud se actualizó correctamente y quedó pendiente de aprobación.';
      requestNotice.hidden = false;
      requestsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      feedback.textContent = error.message || 'No se pudo guardar la solicitud en Neon.';
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  var reviewList = document.getElementById('reviewExpedientList');
  function renderReviewExpedients() {
    reviewList.replaceChildren();
    var entries = requestItems.filter(function (item) { return item.canEdit; }).map(function (item, index) {
      return { kind: 'request', item: item, reference: item.reference || '#EXP-2026-' + String(890 + index).padStart(4, '0') };
    });
    if (!entries.length) {
      var empty = document.createElement('p');
      empty.className = 'review-expedient-empty';
      empty.textContent = 'Todavía no hay solicitudes de ayuda registradas para esta organización.';
      reviewList.appendChild(empty);
      return;
    }
    entries.forEach(function (entry) {
      var item = entry.item;
      var accepted = item.status === true;
      var rejected = item.status === false;
      var stateText = accepted ? 'Aceptado' : rejected ? 'Rechazado' : 'En Evaluación';
      var stateClass = accepted ? 'is-accepted' : rejected ? 'is-rejected' : 'is-evaluating';
      var card = document.createElement('article');
      card.className = 'review-expedient-card';
      var copy = document.createElement('div');
      copy.className = 'review-expedient-copy';
      var heading = document.createElement('div');
      heading.className = 'review-expedient-card-heading';
      var title = document.createElement('h2');
      title.textContent = item.organization || 'Organización sin identificar';
      var descriptor = document.createElement('span');
      descriptor.textContent = 'Solicitud: ' + item.title;
      var date = document.createElement('time');
      date.textContent = item.date || 'Sin fecha';
      heading.append(title, descriptor, date);
      var description = document.createElement('p');
      description.className = 'review-expedient-description';
      description.textContent = item.description || '';
      copy.append(heading, description);
      if (rejected && item.reason) {
        var reason = document.createElement('p');
        reason.className = 'review-observation';
        var reasonLabel = document.createElement('strong');
        reasonLabel.textContent = 'Motivo de observación: ';
        reason.append(reasonLabel, document.createTextNode(item.reason));
        copy.append(reason);
      }
      var chips = document.createElement('div');
      chips.className = 'review-expedient-chips';
      if (item.location) {
        var location = document.createElement('span');
        var locationIcon = document.createElement('i');
        locationIcon.className = 'fa-solid fa-location-dot';
        location.append(locationIcon, document.createTextNode(' ' + item.location));
        chips.append(location);
      }
      var reference = document.createElement('span');
      reference.textContent = 'Expediente: ' + entry.reference;
      chips.append(reference);
      var verification = document.createElement('span');
      verification.className = accepted ? 'review-verification-done' : rejected ? 'review-verification-fix' : 'review-verification-pending';
      verification.textContent = accepted ? 'Verificación completada' : rejected ? 'Permite subsanación' : 'Validación en curso';
      chips.append(verification);
      copy.append(chips);
      var media = document.createElement('div');
      media.className = 'review-expedient-media';
      var imageSource = item._imagePreview || item.image;
      if (imageSource) {
        var image;
        try {
          var safeImage = new URL(imageSource, window.location.href);
          if (['http:', 'https:', 'blob:', 'data:'].includes(safeImage.protocol)) {
            image = document.createElement('img');
            image.src = safeImage.href;
            image.alt = 'Evidencia de ' + item.title;
            media.append(image);
          }
        } catch (error) { image = null; }
      }
      if (!media.querySelector('img')) {
        var placeholder = document.createElement('i');
        placeholder.className = 'fa-regular fa-image';
        media.append(placeholder);
      }
      var mediaCaption = document.createElement('span');
      mediaCaption.textContent = item.imageName || (imageSource ? 'Evidencia fotográfica' : 'Sin evidencia adjunta');
      media.append(mediaCaption);
      var status = document.createElement('strong');
      status.className = 'review-expedient-status ' + stateClass;
      status.textContent = stateText;
      media.append(status);
      card.append(copy, media);
      reviewList.append(card);
    });
  }
  renderReviewExpedients();
  document.getElementById('reviewNewRequest').addEventListener('click', function () {
    document.querySelector('[data-ong-tab="solicitudes"]').click();
    document.getElementById('newRequestBtn').click();
  });
  document.getElementById('reviewCreateMore').addEventListener('click', function () {
    document.getElementById('reviewNewRequest').click();
  });
});
