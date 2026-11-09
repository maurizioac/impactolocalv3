var IL_API_BASE = '';

document.addEventListener('DOMContentLoaded', function () {
  var assistantGreeting = document.getElementById('ilAssistantGreeting');
  if (assistantGreeting) {
    try {
      var session = JSON.parse(localStorage.getItem('il_sesion') || 'null');
      var greetingName = session && typeof session.nombre === 'string' ? session.nombre.trim() : '';
      assistantGreeting.textContent = '¿Pregunta lo que quieras, ' + (greetingName || 'estimado(a)') + '?';
    } catch (error) {
      assistantGreeting.textContent = '¿Pregunta lo que quieras, estimado(a)?';
    }
  }

  var navToggle = document.getElementById('ilNavToggle');
  var nav = document.querySelector('.il-nav');
  if (navToggle && nav) navToggle.addEventListener('click', function () { nav.classList.toggle('is-open'); });

  var heroSearch = document.getElementById('ilHeroSearch');
  var chatInput = document.getElementById('ilChatInput');
  var heroSearchForm = document.getElementById('ilHeroSearchForm');
  var chatWidget = document.getElementById('ilChatWidget');
  var chatToggle = document.getElementById('ilChatToggle');
  var chatClose = document.getElementById('ilChatClose');
  var chatClear = document.getElementById('ilChatClear');
  var directorySection = document.getElementById('directorio');
  var orgList = document.getElementById('ilOrgList');
  var orgCountHeading = document.getElementById('ilOrgCount');
  var showingLabel = document.getElementById('ilShowingLabel');
  var emptyState = document.getElementById('ilEmptyState');
  var emptyStateText = document.getElementById('ilEmptyStateText');
  var chatForm = document.getElementById('ilChatForm');
  var chatMessages = document.getElementById('ilChatMessages');
  var chatSend = document.getElementById('ilChatSend');
  var organizationsLoaded = false;
  var feedback = document.getElementById('ilOrgFeedback');
  var searchNote = document.getElementById('ilSearchNote');
  var searchNoteText = document.getElementById('ilSearchNoteText');
  var searchClear = document.getElementById('ilSearchClear');
  var profileDialog = document.getElementById('ilOrgProfileDialog');
  var profileDialogTitle = document.getElementById('ilOrgProfileTitle');
  var profileContent = document.getElementById('ilOrgProfileContent');
  var organizations = [];
  var orgCards = [];
  var resolveOrganizationsReady;
  var organizationsReady = new Promise(function (resolve) { resolveOrganizationsReady = resolve; });

  function text(value) { return value === null || value === undefined ? '' : String(value).trim(); }
  function normalize(value) {
    return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  }
  function safeImage(value) {
    var raw = text(value);
    if (!raw) return '';
    if (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i.test(raw)) return raw.replace(/\s/g, '');
    try {
      var url = new URL(raw, window.location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (error) { return ''; }
  }
  function safeExternalLink(value) {
    var raw = text(value);
    if (!raw) return '';
    try {
      var url = new URL(raw);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (error) { return ''; }
  }
  function make(tag, className, value) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = value;
    return element;
  }
  function addProfileImage(container, source, alt) {
    var imageUrl = safeImage(source);
    if (!imageUrl) return false;
    var image = document.createElement('img');
    image.src = imageUrl;
    image.alt = alt;
    image.loading = 'lazy';
    container.appendChild(image);
    return true;
  }
  function addSocialLinks(container, organization) {
    [
      ['Sitio web', organization.web, 'fa-solid fa-globe'],
      ['Instagram', organization.instagram, 'fa-brands fa-instagram'],
      ['Facebook', organization.facebook, 'fa-brands fa-facebook'],
      ['TikTok', organization.tik_tok, 'fa-brands fa-tiktok']
    ].forEach(function (item) {
      var raw = text(item[1]);
      if (!raw || raw === '-') return;
      var href = safeExternalLink(item[1]);
      var link = document.createElement(href ? 'a' : 'span');
      link.className = 'il-foro-link';
      if (href) {
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      var icon = document.createElement('i');
      icon.className = item[2];
      icon.setAttribute('aria-hidden', 'true');
      link.append(icon, document.createTextNode(' ' + item[0] + (href ? '' : ': ' + raw)));
      container.appendChild(link);
    });
  }
  function openProfile(organization) {
    profileDialogTitle.textContent = text(organization.nombre_usuario) || 'Perfil de organización';
    profileContent.replaceChildren();
    var title = make('h3', 'il-org-profile-subtitle', text(organization.titulo) || 'Organización');
    var description = make('p', 'il-request-dialog-copy', text(organization.descripcion) || 'Esta organización no ha agregado una descripción.');
    profileContent.append(title, description);

    var mainImage = document.createElement('div');
    mainImage.className = 'il-org-profile-image';
    if (addProfileImage(mainImage, organization.imagen_principal, 'Imagen principal de ' + (text(organization.nombre_usuario) || 'la organización'))) profileContent.appendChild(mainImage);

    [['subtitulo_1', 'texto_1'], ['subtitulo_2', 'texto_2']].forEach(function (fields, index) {
      var headingText = text(organization[fields[0]]);
      var paragraphText = text(organization[fields[1]]);
      if (!headingText && !paragraphText) return;
      var section = make('section', 'il-org-profile-section');
      section.appendChild(make('h4', '', headingText || (index === 0 ? 'Más información' : 'Nuestro trabajo')));
      if (paragraphText) section.appendChild(make('p', 'il-request-dialog-copy', paragraphText));
      profileContent.appendChild(section);
    });

    var secondaryImage = document.createElement('div');
    secondaryImage.className = 'il-org-profile-image is-secondary';
    if (addProfileImage(secondaryImage, organization.imagen_secundaria, 'Imagen secundaria de ' + (text(organization.nombre_usuario) || 'la organización'))) {
      profileContent.appendChild(make('h4', 'il-org-profile-contact-heading', 'Imagen secundaria'));
      profileContent.appendChild(secondaryImage);
    }

    var socials = document.createElement('div');
    socials.className = 'il-foro-dialog-links';
    addSocialLinks(socials, organization);
    if (socials.childElementCount) {
      profileContent.appendChild(make('h4', 'il-org-profile-contact-heading', 'Contacto y redes'));
      profileContent.appendChild(socials);
    }
    profileDialog.showModal();
  }
  function createOrganizationCard(organization) {
    var card = document.createElement('article');
    card.className = 'il-org-card';
    card.dataset.organization = text(organization.nombre_usuario);
    card.dataset.categorias = [organization.nombre_usuario, organization.titulo, organization.descripcion, organization.subtitulo_1, organization.texto_1, organization.subtitulo_2, organization.texto_2].map(text).join(' ');

    var content = document.createElement('div');
    content.className = 'il-org-content';
    var tags = document.createElement('div');
    tags.className = 'il-org-tags';
    tags.appendChild(make('span', 'il-org-meta', text(organization.nombre_usuario) || 'Organización'));
    content.appendChild(tags);
    content.appendChild(make('h3', '', text(organization.titulo) || text(organization.nombre_usuario) || 'Organización'));
    content.appendChild(make('p', '', text(organization.descripcion) || 'Esta organización no ha agregado una descripción.'));

    var actions = document.createElement('div');
    actions.className = 'il-card-actions';
    var profile = make('button', 'il-btn-solid', 'Ver Perfil Completo');
    profile.type = 'button';
    profile.addEventListener('click', function () { openProfile(organization); });
    actions.appendChild(profile);
    var website = safeExternalLink(organization.web);
    if (website) {
      var visit = make('a', 'il-btn-outline-dark', 'Sitio web');
      visit.href = website;
      visit.target = '_blank';
      visit.rel = 'noopener noreferrer';
      actions.appendChild(visit);
    }
    content.appendChild(actions);
    card.appendChild(content);

    var imageBox = document.createElement('div');
    imageBox.className = 'il-org-image';
    if (addProfileImage(imageBox, organization.imagen_principal, 'Imagen principal de ' + (text(organization.nombre_usuario) || 'la organización'))) {
      card.appendChild(imageBox);
    } else {
      card.classList.add('il-org-card-no-image');
    }
    return card;
  }

  function updateResultsUI(visibleCount) {
    if (orgCountHeading) orgCountHeading.textContent = 'Organizaciones registradas (' + visibleCount + ')';
    if (showingLabel) showingLabel.textContent = 'Mostrando ' + visibleCount + ' de ' + organizations.length + ' organizaciones aprobadas en Neon';
    if (emptyState) emptyState.hidden = visibleCount !== 0 || (!organizationsLoaded && organizations.length === 0);
    if (emptyStateText && visibleCount === 0 && organizationsLoaded) {
      emptyStateText.textContent = organizations.length ? 'No se pudo encontrar una ONG/voluntariado que le pueda ayudar.' : 'Todavía no hay organizaciones aprobadas para mostrar.';
    }
    if (orgList) orgList.style.display = visibleCount === 0 ? 'none' : '';
  }
  function showSearchNote(message) {
    if (!searchNote || !searchNoteText) return;
    searchNoteText.textContent = message;
    searchNote.hidden = false;
  }
  function hideSearchNote() { if (searchNote) searchNote.hidden = true; }
  function showAllCards() {
    orgCards.forEach(function (card) { card.style.display = ''; orgList.appendChild(card); });
    updateResultsUI(orgCards.length);
  }
  function appendChatMessage(role, message, extraClass) {
    var bubble = document.createElement('div');
    bubble.className = 'il-chat-message is-' + role + (extraClass ? ' ' + extraClass : '');
    if (role === 'assistant') {
      var avatar = document.createElement('span');
      avatar.className = 'il-chat-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      var icon = document.createElement('i');
      icon.className = 'fa-solid fa-leaf';
      avatar.appendChild(icon);
      bubble.appendChild(avatar);
    }
    var paragraph = document.createElement('p');
    paragraph.textContent = message;
    bubble.appendChild(paragraph);
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
  }
  function showRecommendations(recommendations) {
    var byName = new Map();
    orgCards.forEach(function (card) { byName.set(normalize(card.dataset.organization), card); card.style.display = 'none'; });
    var visibleCount = 0;
    recommendations.forEach(function (item) {
      var card = byName.get(normalize(item.nombre_usuario));
      if (!card) return;
      card.style.display = '';
      orgList.appendChild(card);
      visibleCount += 1;
    });
    updateResultsUI(visibleCount);
    if (visibleCount === 0 && emptyStateText) emptyStateText.textContent = 'No se pudo encontrar una ONG/voluntariado que le pueda ayudar.';
    return visibleCount;
  }
  function openChatWidget() {
    if (!chatWidget || !chatToggle) return;
    chatWidget.hidden = false;
    chatToggle.setAttribute('aria-expanded', 'true');
    if (chatInput) chatInput.focus();
  }
  function closeChatWidget() {
    if (!chatWidget || !chatToggle) return;
    chatWidget.hidden = true;
    chatToggle.setAttribute('aria-expanded', 'false');
    chatToggle.focus();
  }
  async function sendChatMessage(message, sourceInput) {
    var term = text(message);
    if (!term || !chatMessages || !chatSend || chatSend.disabled) return;
    openChatWidget();
    appendChatMessage('user', term);
    if (sourceInput) sourceInput.value = '';
    if (sourceInput === heroSearch && searchClear) searchClear.hidden = true;
    if (sourceInput === chatInput && chatClear) chatClear.hidden = true;
    chatSend.disabled = true;
    chatSend.setAttribute('aria-busy', 'true');
    var typing = appendChatMessage('assistant', 'Estoy revisando las organizaciones aprobadas en Neon…', 'is-typing');
    try {
      await organizationsReady;
      var response = await fetch(IL_API_BASE + '/api/buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termino: term })
      });
      var result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo completar la búsqueda.');
      typing.remove();
      var recommendations = Array.isArray(result.organizaciones) ? result.organizaciones : [];
      appendChatMessage('assistant', result.respuesta || (recommendations.length ? 'Encontré organizaciones relacionadas con tu caso.' : 'No se pudo encontrar una ONG/voluntariado que le pueda ayudar.'));
      var visibleCount = showRecommendations(recommendations);
      if (visibleCount && recommendations.length) {
        var explanations = recommendations.filter(function (item) { return item && item.motivo; }).map(function (item) { return item.nombre_usuario + ': ' + item.motivo; });
        if (explanations.length) appendChatMessage('assistant', explanations.join('\n'));
      }
      if (visibleCount) {
        showSearchNote('Encontré ' + visibleCount + (visibleCount === 1 ? ' organización relacionada' : ' organizaciones relacionadas') + '. Revisa las fichas debajo.');
        if (directorySection) directorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        showSearchNote('No se pudo encontrar una ONG/voluntariado que le pueda ayudar.');
        if (directorySection) directorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      typing.remove();
      appendChatMessage('assistant', error.message || 'No se pudo consultar a Gemini y Neon. Inténtalo nuevamente.', 'is-error');
    } finally {
      chatSend.disabled = false;
      chatSend.removeAttribute('aria-busy');
      chatInput.focus();
    }
  }
  function renderOrganizations(rows) {
    organizations = rows;
    organizationsLoaded = true;
    resolveOrganizationsReady();
    orgList.replaceChildren();
    organizations.forEach(function (organization) { orgList.appendChild(createOrganizationCard(organization)); });
    orgCards = Array.prototype.slice.call(orgList.querySelectorAll('.il-org-card'));
    if (feedback) feedback.textContent = organizations.length ? '' : 'No hay organizaciones aprobadas en PRINCIPAL_ORG.';
    hideSearchNote();
    showAllCards();
  }

  if (heroSearch) heroSearch.addEventListener('input', function () { if (searchClear) searchClear.hidden = !heroSearch.value.trim(); });
  if (searchClear) searchClear.hidden = !heroSearch.value.trim();
  if (heroSearchForm) heroSearchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!text(heroSearch.value)) { heroSearch.focus(); return; }
    openChatWidget();
    sendChatMessage(heroSearch.value, heroSearch);
  });
  if (chatInput) chatInput.addEventListener('input', function () { if (chatClear) chatClear.hidden = !chatInput.value.trim(); });
  if (chatForm) chatForm.addEventListener('submit', function (event) {
    event.preventDefault();
    sendChatMessage(chatInput.value, chatInput);
  });
  if (chatToggle) chatToggle.addEventListener('click', function () { if (chatWidget.hidden) openChatWidget(); else closeChatWidget(); });
  if (chatClose) chatClose.addEventListener('click', closeChatWidget);
  if (searchClear) searchClear.addEventListener('click', function () { heroSearch.value = ''; searchClear.hidden = true; heroSearch.focus(); });
  if (chatClear) chatClear.addEventListener('click', function () { chatInput.value = ''; chatClear.hidden = true; chatInput.focus(); });
  document.querySelectorAll('[data-chat-suggestion]').forEach(function (button) {
    button.addEventListener('click', function () {
      chatInput.value = button.dataset.chatSuggestion || '';
      if (chatClear) chatClear.hidden = !chatInput.value;
      chatForm.requestSubmit();
    });
  });

  var consultarBtn = document.getElementById('ilConsultarBtn');
  if (consultarBtn) consultarBtn.addEventListener('click', function () { window.location.href = 'solicitudes.html'; });
  var profileClose = document.getElementById('ilOrgProfileClose');
  var profileDone = document.getElementById('ilOrgProfileDone');
  if (profileClose) profileClose.addEventListener('click', function () { profileDialog.close(); });
  if (profileDone) profileDone.addEventListener('click', function () { profileDialog.close(); });
  if (profileDialog) profileDialog.addEventListener('click', function (event) { if (event.target === profileDialog) profileDialog.close(); });

  fetch('/api/principal-org')
    .then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok) throw new Error(body.message || 'No se pudieron cargar las organizaciones.');
        return body;
      });
    })
    .then(function (body) { renderOrganizations(Array.isArray(body.organizaciones) ? body.organizaciones : []); })
    .catch(function (error) {
      if (feedback) feedback.textContent = error.message || 'No se pudieron cargar las organizaciones desde Neon.';
      organizationsLoaded = true;
      resolveOrganizationsReady();
      updateResultsUI(0);
    });
});
