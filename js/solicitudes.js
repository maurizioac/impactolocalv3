document.addEventListener('DOMContentLoaded', function () {
  var search = document.getElementById('ilSolSearch');
  var requestList = document.getElementById('ilRequestList');
  var feedback = document.getElementById('ilRequestFeedback');
  var requestDialog = document.getElementById('ilRequestDialog');
  var dialogTitle = document.getElementById('ilRequestDialogTitle');
  var dialogContent = document.getElementById('ilRequestDialogContent');
  var dialogActions = document.getElementById('ilRequestDialogActions');
  var publications = [];

  function safeLink(value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    try {
      var url = new URL(raw);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch (error) { return ''; }
  }

  function safeImage(value) {
    var raw = String(value || '').trim();
    if (!raw) return '';
    if (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i.test(raw)) return raw.replace(/\s/g, '');
    var link = safeLink(raw);
    if (link) return link;
    return /^(\.\.\/|\.\/|\/)?[A-Za-z0-9_./%-]+(?:\?[A-Za-z0-9_=&%-]*)?$/.test(raw) ? raw : '';
  }

  function createExternalLink(label, value, iconClass) {
    var href = safeLink(value);
    if (!href) return null;
    var link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'il-foro-link';
    var icon = document.createElement('i');
    icon.className = iconClass;
    icon.setAttribute('aria-hidden', 'true');
    link.append(icon, document.createTextNode(' ' + label));
    return link;
  }

  function createCard(publication) {
    var card = document.createElement('article');
    card.className = 'il-request-card il-foro-card';
    var content = document.createElement('div');
    content.className = 'il-request-content';
    var titleRow = document.createElement('div');
    titleRow.className = 'il-request-title-row';
    var heading = document.createElement('h3');
    heading.textContent = publication.nombre_usuario || 'Organización';
    var subtitle = document.createElement('span');
    subtitle.className = 'il-request-sub';
    subtitle.textContent = publication.titulo || 'Publicación';
    heading.appendChild(document.createTextNode(' '));
    heading.appendChild(subtitle);
    titleRow.appendChild(heading);

    var description = document.createElement('p');
    description.className = 'il-foro-description';
    description.textContent = publication.descripcion || 'Esta publicación no incluye una descripción.';

    var footer = document.createElement('div');
    footer.className = 'il-request-footer il-foro-footer';
    var links = document.createElement('div');
    links.className = 'il-foro-links';
    [
      ['Sitio web', publication.web, 'fa-solid fa-globe'],
      ['Instagram', publication.instagram, 'fa-brands fa-instagram'],
      ['Facebook', publication.facebook, 'fa-brands fa-facebook'],
      ['TikTok', publication.tik_tok, 'fa-brands fa-tiktok']
    ].forEach(function (item) {
      var link = createExternalLink(item[0], item[1], item[2]);
      if (link) links.appendChild(link);
    });
    var details = document.createElement('button');
    details.type = 'button';
    details.className = 'il-btn-gray il-foro-details';
    details.textContent = 'Ver publicación';
    details.addEventListener('click', function () { openDetails(publication); });
    footer.append(links, details);
    content.append(titleRow, description, footer);
    card.appendChild(content);

    var imageSource = safeImage(publication.imagen_parcial);
    if (imageSource) {
      var imageBox = document.createElement('div');
      imageBox.className = 'il-request-image il-foro-image';
      var image = document.createElement('img');
      image.src = imageSource;
      image.alt = 'Imagen de ' + (publication.titulo || publication.nombre_usuario || 'la publicación');
      image.loading = 'lazy';
      imageBox.appendChild(image);
      card.appendChild(imageBox);
    } else {
      card.classList.add('il-foro-card-no-image');
    }
    return card;
  }

  function openDetails(publication) {
    dialogTitle.textContent = publication.nombre_usuario || 'Publicación';
    dialogContent.replaceChildren();
    var subtitle = document.createElement('h3');
    subtitle.className = 'il-foro-dialog-subtitle';
    subtitle.textContent = publication.titulo || 'Publicación';
    var description = document.createElement('p');
    description.className = 'il-request-dialog-copy';
    description.textContent = publication.descripcion || 'Esta publicación no incluye una descripción.';
    dialogContent.append(subtitle, description);

    var networks = document.createElement('div');
    networks.className = 'il-foro-dialog-links';
    [
      ['Sitio web', publication.web, 'fa-solid fa-globe'],
      ['Instagram', publication.instagram, 'fa-brands fa-instagram'],
      ['Facebook', publication.facebook, 'fa-brands fa-facebook'],
      ['TikTok', publication.tik_tok, 'fa-brands fa-tiktok']
    ].forEach(function (item) {
      var link = createExternalLink(item[0], item[1], item[2]);
      if (link) networks.appendChild(link);
    });
    if (networks.childElementCount) dialogContent.appendChild(networks);

    var close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Cerrar';
    close.addEventListener('click', function () { requestDialog.close(); });
    dialogActions.replaceChildren(close);
    requestDialog.showModal();
  }

  function renderPublications(list) {
    requestList.replaceChildren();
    list.forEach(function (publication) { requestList.appendChild(createCard(publication)); });
    if (!list.length) feedback.textContent = publications.length ? 'No hay publicaciones que coincidan con tu búsqueda.' : 'Todavía no hay publicaciones de organizaciones.';
    else feedback.textContent = '';
  }

  function filteredPublications() {
    var term = search ? search.value.trim().toLocaleLowerCase('es') : '';
    return publications.filter(function (item) {
      return [item.nombre_usuario, item.titulo, item.descripcion].join(' ').toLocaleLowerCase('es').includes(term);
    });
  }

  if (search) {
    search.addEventListener('input', function () {
      renderPublications(filteredPublications());
    });
    var searchButton = search.closest('form').querySelector('.il-search-submit-sm');
    if (searchButton) searchButton.addEventListener('click', function () { search.dispatchEvent(new Event('input')); });
  }

  var dialogClose = document.getElementById('ilRequestDialogClose');
  if (dialogClose) dialogClose.addEventListener('click', function () { requestDialog.close(); });
  if (requestDialog) requestDialog.addEventListener('click', function (event) { if (event.target === requestDialog) requestDialog.close(); });

  fetch('/api/foro-org')
    .then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok) throw new Error(body.message || 'No se pudieron cargar las publicaciones.');
        return body;
      });
    })
    .then(function (body) {
      publications = Array.isArray(body.publicaciones) ? body.publicaciones : [];
      renderPublications(filteredPublications());
    })
    .catch(function (error) {
      feedback.textContent = error.message || 'No se pudieron cargar las publicaciones de Neon.';
    });
});
