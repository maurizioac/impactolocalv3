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
  var storageKey = 'impactolocal-ong-page-draft-v1';
  var feedback = document.getElementById('editorFeedback');
  var coverUrl = '';
  var actionImageUrl = '';
  var coverData = '';
  var actionImageData = '';
  var defaults = {
    name: '', description: '', subtitle1: '', text1: '', subtitle2: '', text2: '',
    video: '', location: '', phone: '', website: '', instagram: '', facebook: '', tiktok: '', email: ''
  };
  var session = null;
  try { session = JSON.parse(localStorage.getItem('il_sesion') || 'null'); } catch (error) { session = null; }
  if (session && session.rol === 'organizacion') {
    var accountName = document.getElementById('ongAccountName');
    if (accountName) accountName.textContent = session.nombre || 'Organización';
  }
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
        var username = String(session.nombre || '').trim().toLocaleLowerCase('es');
        var profile = (Array.isArray(body.organizaciones) ? body.organizaciones : []).find(function (item) {
          return String(item.nombre_usuario || '').trim().toLocaleLowerCase('es') === username;
        });
        if (!profile) return;
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

  var forumForm = document.getElementById('ongPostForm');
  var forumFeed = document.getElementById('ongFeed');
  var forumPosts = [];
  var forumOrgName = document.getElementById('ongAccountName').textContent;
  var forumLocation = document.getElementById('forumLocation');
  var savedLocation = '';
  try { savedLocation = JSON.parse(localStorage.getItem(storageKey) || '{}').location || ''; } catch (error) { savedLocation = ''; }
  if (savedLocation) forumLocation.lastChild.textContent = ' Vista pública · ' + savedLocation;

  function renderForum() {
    forumOrgName = document.getElementById('ongAccountName').textContent;
    forumFeed.replaceChildren();
    if (!forumPosts.length) {
      var empty = document.createElement('p');
      empty.className = 'forum-post-feedback';
      empty.textContent = 'Todavía no hay publicaciones guardadas en Neon para esta organización.';
      forumFeed.appendChild(empty);
      return;
    }
    forumPosts.forEach(function (post) {
      var card = document.createElement('article');
      card.className = 'forum-post-card' + (post._imagePreview || post.image ? '' : ' is-text-only');
      var copy = document.createElement('div');
      copy.className = 'forum-post-copy';
      var meta = document.createElement('div');
      meta.className = 'forum-post-meta';
      var org = document.createElement('strong');
      org.textContent = forumOrgName || 'Organización';
      var date = document.createElement('time');
      date.textContent = post.date || 'Publicación';
      meta.append(org, date);
      var title = document.createElement('h2');
      title.textContent = post.title;
      var body = document.createElement('p');
      body.textContent = post.body;
      var foot = document.createElement('div');
      foot.className = 'forum-post-footer';
      var tag = document.createElement('span');
      tag.className = 'forum-post-tag';
      tag.textContent = '#' + String(post.tag || 'Comunidad').replace(/^#/, '');
      var author = document.createElement('span');
      author.textContent = 'Publicado por: ' + (post.author || 'Equipo de la organización');
      foot.append(tag, author);
      copy.append(meta, title, body, foot);
      card.append(copy);
      var imageSource = post._imagePreview || post.image;
      if (imageSource) {
        var imageUrl;
        try { imageUrl = new URL(imageSource, window.location.href); } catch (error) { imageUrl = null; }
        if (imageUrl && (['http:', 'https:'].includes(imageUrl.protocol) || imageSource.startsWith('blob:') || /^data:image\/(png|jpeg|webp);base64,/i.test(imageSource))) {
          var imageWrap = document.createElement('div');
          imageWrap.className = 'forum-post-image-wrap';
          var image = document.createElement('img');
          image.src = imageUrl.href;
          image.alt = 'Imagen de la actividad de ' + (forumOrgName || 'la organización');
          image.loading = 'lazy';
          var badge = document.createElement('span');
          badge.textContent = 'Imagen';
          imageWrap.append(image, badge);
          card.append(imageWrap);
        }
      }
      forumFeed.append(card);
    });
  }
  function loadForumPosts() {
    fetch('/api/foro-org')
      .then(function (response) { return response.json().then(function (body) { if (!response.ok) throw new Error(body.message || 'No se pudieron cargar las publicaciones.'); return body; }); })
      .then(function (body) {
        var currentName = forumOrgName.trim().toLocaleLowerCase('es');
        forumPosts = (Array.isArray(body.publicaciones) ? body.publicaciones : [])
          .filter(function (item) { return String(item.nombre_usuario || '').trim().toLocaleLowerCase('es') === currentName; })
          .map(function (item) { return { title: item.titulo || '', body: item.descripcion || '', tag: 'Comunidad', author: item.nombre_usuario || forumOrgName, image: item.imagen_parcial || '', date: '' }; });
        renderForum();
      })
      .catch(function (error) {
        forumPosts = [];
        renderForum();
        document.getElementById('forumNotice').textContent = error.message || 'No se pudieron cargar las publicaciones de Neon.';
        document.getElementById('forumNotice').hidden = false;
      });
  }
  loadForumPosts();
  var forumToday = new Date();
  document.getElementById('forumToday').textContent = String(forumToday.getDate()).padStart(2, '0') + '/' + String(forumToday.getMonth() + 1).padStart(2, '0') + '/' + forumToday.getFullYear();
  var forumBody = forumForm.elements.namedItem('body');
  var forumImageInput = forumForm.elements.namedItem('image');
  var forumImagePreview = document.getElementById('forumImagePreview');
  var forumImageName = document.getElementById('forumImageName');
  var forumImageObjectUrl = '';
  var forumHeading = document.querySelector('.forum-page-heading');
  var forumTrigger = document.querySelector('.forum-create-trigger');
  function showForumImage(file) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
      forumImageInput.value = '';
      forumImageName.textContent = 'Elige PNG, JPG o WEBP de hasta 5 MB.';
      forumImageName.classList.add('is-error');
      forumImagePreview.hidden = true;
      return;
    }
    if (forumImageObjectUrl) URL.revokeObjectURL(forumImageObjectUrl);
    forumImageObjectUrl = URL.createObjectURL(file);
    forumImagePreview.src = forumImageObjectUrl;
    forumImagePreview.hidden = false;
    forumImageName.textContent = file.name;
    forumImageName.classList.remove('is-error');
  }
  forumImageInput.addEventListener('change', function () { showForumImage(forumImageInput.files[0]); });
  forumBody.addEventListener('input', function () { document.getElementById('forumBodyCount').textContent = forumBody.value.length.toLocaleString('es-PE'); });
  var uploadZone = document.getElementById('forumUploadZone');
  uploadZone.addEventListener('dragover', function (event) { event.preventDefault(); uploadZone.classList.add('is-dragging'); });
  uploadZone.addEventListener('dragleave', function () { uploadZone.classList.remove('is-dragging'); });
  uploadZone.addEventListener('drop', function (event) {
    event.preventDefault();
    uploadZone.classList.remove('is-dragging');
    var file = event.dataTransfer.files[0];
    if (!file) return;
    try { var transfer = new DataTransfer(); transfer.items.add(file); forumImageInput.files = transfer.files; } catch (error) { /* El archivo sigue disponible para seleccionarlo con el botón. */ }
    showForumImage(file);
  });
  document.getElementById('newForumPost').addEventListener('click', function () {
    document.getElementById('forumNotice').hidden = true;
    forumHeading.hidden = true;
    forumFeed.hidden = true;
    forumTrigger.hidden = true;
    forumForm.hidden = false;
    forumForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    forumForm.elements.namedItem('title').focus();
  });
  document.getElementById('cancelForumPost').addEventListener('click', function () {
    forumForm.hidden = true;
    forumHeading.hidden = false;
    forumFeed.hidden = false;
    forumTrigger.hidden = false;
    forumForm.reset();
    if (forumImageObjectUrl) URL.revokeObjectURL(forumImageObjectUrl);
    forumImageObjectUrl = '';
    forumImagePreview.hidden = true;
    forumImagePreview.removeAttribute('src');
    forumImageName.textContent = '';
    document.getElementById('forumBodyCount').textContent = '0';
    document.getElementById('postFeedback').textContent = '';
  });
  function readImageAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('No se pudo leer la imagen.')); };
      reader.readAsDataURL(file);
    });
  }
  forumForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!forumForm.reportValidity()) return;
    var submitButton = forumForm.querySelector('button[type="submit"]');
    var postFeedback = document.getElementById('postFeedback');
    var imageFile = forumImageInput.files[0];
    if (imageFile && (imageFile.size > 5 * 1024 * 1024 || !/^image\/(png|jpeg|webp)$/.test(imageFile.type))) {
      showForumImage(imageFile);
      return;
    }
    if (submitButton) submitButton.disabled = true;
    postFeedback.textContent = 'Guardando publicación en Neon...';
    try {
      var image = imageFile ? await readImageAsDataUrl(imageFile) : null;
      var response = await fetch('/api/foro-org', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: forumForm.elements.namedItem('title').value.trim(),
          descripcion: forumBody.value.trim(),
          imagen: image
        })
      });
      var result = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(result.message || 'No se pudo guardar la publicación.');

      var publication = result.publicacion;
      forumPosts.unshift({ title: publication.titulo, body: publication.descripcion, tag: 'Comunidad', author: publication.nombre_usuario, image: publication.imagen_parcial || '', date: '' });
      renderForum();
      postFeedback.textContent = 'La publicación y su imagen se guardaron en Neon.';
      if (forumImageObjectUrl) URL.revokeObjectURL(forumImageObjectUrl);
      forumImageObjectUrl = '';
      forumForm.reset();
      forumImagePreview.hidden = true;
      forumImagePreview.removeAttribute('src');
      forumImageName.textContent = '';
      forumImageName.classList.remove('is-error');
      document.getElementById('forumBodyCount').textContent = '0';
      var notice = document.getElementById('forumNotice');
      notice.textContent = 'La publicación ya aparece en el directorio público de organizaciones.';
      notice.hidden = false;
      forumForm.hidden = true;
      forumHeading.hidden = false;
      forumFeed.hidden = false;
      forumTrigger.hidden = false;
      forumFeed.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      postFeedback.textContent = error.message || 'No se pudo guardar la publicación en Neon.';
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
  var requestKey = 'impactolocal-ong-requests-v1';
  var requestSeed = [
    { title: 'Riego por goteo para biohuertos comunitarios', type: 'Donación de materiales', description: 'Requerimos kits de tubos de polietileno de alta densidad, electrobombas solares y válvulas para reabastecer el sistema de atrapanieblas y biohuertos comunales en las lomas de Villa María del Triunfo. Se convoca a empresas aliadas y técnicos agrícolas para asesoría de ensamblaje.', goal: '3,500 m de tubos PVC · 40 voluntarios técnicos', location: 'Lima Este', date: '24/10/2026', image: '../imagenes/personas.png', imageName: 'Lomas_vmt_zona_3.jpg', status: true },
    { title: 'Semillas y abono orgánico para huertos populares', type: 'Donación de materiales', description: 'Solicitamos insumos para la siembra de temporada de invierno en comedores autogestionados. Se requiere compost maduro, humus de lombriz y semillas certificadas de hortalizas resistentes a suelos arenosos, además de herramientas de mano.', goal: '2 toneladas de abono · Huertos populares', location: 'Rímac, Lima', date: '19/10/2026', image: '../imagenes/personas.png', imageName: 'Insumos_huerto_rimac.png', status: true },
    { title: 'Brigada voluntaria para recuperar espacios verdes', type: 'Voluntariado presencial', description: 'Buscamos personas voluntarias para apoyar la recuperación de áreas verdes y la limpieza de espacios comunitarios. La propuesta está en revisión por el equipo administrador.', goal: '20 voluntarios · 2 jornadas', location: 'San Juan de Lurigancho', date: '28/10/2026', image: '', imageName: 'Evidencia pendiente de revisión', status: null },
    { title: 'Herramientas para el vivero comunitario', type: 'Apoyo logístico', description: 'Solicitud de palas, guantes y herramientas para el vivero. El equipo administrador solicitó completar información sobre el destino de los materiales.', goal: '15 kits de herramientas', location: 'Lima, Perú', date: '11/10/2026', image: '', imageName: 'Sin evidencia adjunta', status: false, reason: 'Indica el destino de los materiales y cuántas personas se beneficiarán.' }
  ];
  var requestItems = requestSeed;
  try {
    var storedRequests = JSON.parse(localStorage.getItem(requestKey));
    if (Array.isArray(storedRequests)) requestItems = storedRequests;
  } catch (error) { /* Se muestran solicitudes de ejemplo. */ }
  var requestsHeading = document.getElementById('requestsPageHeading');
  var requestsList = document.getElementById('ongRequestList');
  var requestForm = document.getElementById('ongRequestForm');
  var requestTrigger = document.getElementById('requestCreateTrigger');
  var requestNotice = document.getElementById('requestNotice');
  var requestFilter = 'vigentes';
  var requestOrganization = document.getElementById('ongAccountName').textContent;
  var requestFileUrl = '';

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
      org.textContent = requestOrganization || 'Organización';
      var type = document.createElement('span');
      type.className = 'request-type-label';
      type.textContent = 'Solicitud: ' + item.type;
      var date = document.createElement('time');
      date.className = 'request-card-date';
      date.textContent = item.date || new Date().toLocaleDateString('es-PE');
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
      footer.append(goal, details);
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
  renderRequests();
  document.getElementById('newRequestBtn').addEventListener('click', function () {
    requestsHeading.hidden = true;
    requestsList.hidden = true;
    requestTrigger.hidden = true;
    requestNotice.hidden = true;
    requestForm.hidden = false;
    requestForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    requestForm.elements.namedItem('title').focus();
  });
  document.getElementById('cancelRequestBtn').addEventListener('click', function () {
    requestForm.reset();
    requestForm.hidden = true;
    requestsHeading.hidden = false;
    requestsList.hidden = false;
    requestTrigger.hidden = false;
    if (requestFileUrl) URL.revokeObjectURL(requestFileUrl);
    requestFileUrl = '';
  });
  requestForm.elements.namedItem('description').addEventListener('input', function (event) {
    document.getElementById('requestDescriptionCount').textContent = event.target.value.length.toLocaleString('es-PE');
  });
  requestForm.elements.namedItem('image').addEventListener('change', function (event) {
    var file = event.target.files[0];
    var feedback = document.getElementById('requestFeedback');
    if (file && (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024)) {
      event.target.value = '';
      feedback.textContent = 'Elige PNG, JPG o WEBP de hasta 10 MB.';
    } else feedback.textContent = '';
  });
  requestForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!requestForm.reportValidity()) return;
    var imageFile = requestForm.elements.namedItem('image').files[0];
    if (requestFileUrl) URL.revokeObjectURL(requestFileUrl);
    requestFileUrl = imageFile ? URL.createObjectURL(imageFile) : '';
    var formValues = Object.fromEntries(new FormData(requestForm).entries());
    var newRequest = {
      title: formValues.title.trim(), type: formValues.type,
      description: formValues.description.trim(), goal: formValues.goal.trim(),
      location: formValues.location.trim(), date: formValues.date ? new Date(formValues.date + 'T12:00:00').toLocaleDateString('es-PE') : new Date().toLocaleDateString('es-PE'),
      image: '', imageName: imageFile ? imageFile.name : 'Sin evidencia adjunta', _imagePreview: requestFileUrl, status: null
    };
    requestItems.unshift(newRequest);
    try {
      localStorage.setItem(requestKey, JSON.stringify(requestItems.map(function (item) { return { title: item.title, type: item.type, description: item.description, goal: item.goal, location: item.location, date: item.date, image: item.image, imageName: item.imageName, status: item.status }; })));
    } catch (error) {
      document.getElementById('requestFeedback').textContent = 'No se pudo guardar en este navegador.';
      return;
    }
    requestFileUrl = '';
    requestFilter = 'pendientes';
    document.querySelectorAll('[data-request-filter]').forEach(function (button) { button.classList.toggle('is-active', button.dataset.requestFilter === 'pendientes'); });
    requestForm.reset();
    document.getElementById('requestDescriptionCount').textContent = '0';
    requestForm.hidden = true;
    requestsHeading.hidden = false;
    requestsList.hidden = false;
    requestTrigger.hidden = false;
    renderRequests();
    requestNotice.textContent = 'Tu solicitud se agregó como “En revisión” (null). Esta versión todavía no la envía a Neon ni al equipo administrador.';
    requestNotice.hidden = false;
    requestsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  var reviewList = document.getElementById('reviewExpedientList');
  function renderReviewExpedients() {
    reviewList.replaceChildren();
    var entries = requestItems.map(function (item, index) {
      return { kind: 'request', item: item, reference: item.reference || '#EXP-2026-' + String(890 + index).padStart(4, '0') };
    }).concat(forumPosts.map(function (item, index) {
      return { kind: 'forum', item: item, reference: '#FORO-2026-' + String(420 + index).padStart(4, '0') };
    }));
    entries.forEach(function (entry) {
      var item = entry.item;
      var accepted = entry.kind === 'request' && item.status === true;
      var rejected = entry.kind === 'request' && item.status === false;
      var stateText = accepted ? 'Aceptado' : rejected ? 'Rechazado' : 'En Evaluación';
      var stateClass = accepted ? 'is-accepted' : rejected ? 'is-rejected' : 'is-evaluating';
      var card = document.createElement('article');
      card.className = 'review-expedient-card';
      var copy = document.createElement('div');
      copy.className = 'review-expedient-copy';
      var heading = document.createElement('div');
      heading.className = 'review-expedient-card-heading';
      var title = document.createElement('h2');
      title.textContent = requestOrganization;
      var descriptor = document.createElement('span');
      descriptor.textContent = entry.kind === 'request' ? 'Solicitud: ' + item.title : 'Foro Abierto: ' + item.title;
      var date = document.createElement('time');
      date.textContent = item.date || 'Hoy';
      heading.append(title, descriptor, date);
      var description = document.createElement('p');
      description.className = 'review-expedient-description';
      description.textContent = item.description || item.body || '';
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
          if (['http:', 'https:', 'blob:'].includes(safeImage.protocol)) {
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
  document.getElementById('reviewNewForum').addEventListener('click', function () {
    document.querySelector('[data-ong-tab="foro"]').click();
    document.getElementById('newForumPost').click();
  });
  document.getElementById('reviewCreateMore').addEventListener('click', function () {
    document.getElementById('reviewNewRequest').click();
  });
});
