document.addEventListener('DOMContentLoaded', async function () {
  var list = document.getElementById('ilOrgList');
  var directorySearch = document.getElementById('ilDirectorySearch');
  var heroSearch = document.getElementById('ilHeroSearch');
  var count = document.getElementById('ilOrgCount');
  var showing = document.getElementById('ilShowingLabel');
  var empty = document.getElementById('ilEmptyState');
  var note = document.getElementById('ilSearchNote');
  var noteText = document.getElementById('ilSearchNoteText');
  var total = 0;

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
  var defaultImages = {
    cambiandovidas: '../imagenes/ong-cambiando-vidas.svg',
    escoladrillosperu: '../imagenes/ong-escoladrillos.svg',
    buscandouncambiope: '../imagenes/ong-buscando-cambio.svg',
    corazonesinmaculadoslima: '../imagenes/ong-corazones-inmaculados.svg',
    gabyalrescate: '../imagenes/ong-gaby-rescate.svg'
  };
  function makeCard(org) {
    var card = document.createElement('article');
    card.className = 'il-org-card';
    card.dataset.search = normalize(Object.values(org).join(' '));
    var content = document.createElement('div'); content.className = 'il-org-content';
    var tags = document.createElement('div'); tags.className = 'il-org-tags';
    var category = document.createElement('span'); category.className = 'il-chip il-chip--green-solid'; category.textContent = org.categoria || 'Iniciativa social';
    var user = document.createElement('span'); user.className = 'il-org-meta'; user.textContent = '@' + org.usuario;
    tags.append(category, user);
    var title = document.createElement('h3'); title.textContent = org.titulo;
    var desc = document.createElement('p'); desc.textContent = org.descripcion;
    var actions = document.createElement('div'); actions.className = 'il-card-actions';
    var detail = document.createElement('a'); detail.className = 'il-btn-solid'; detail.href = 'organizacion.html?usuario=' + encodeURIComponent(org.usuario); detail.textContent = 'Ver perfil completo';
    actions.append(detail);
    content.append(tags, title, desc, actions);
    var image = document.createElement('div'); image.className = 'il-org-image'; image.style.backgroundImage = 'url("' + (org.imagenPrincipal || defaultImages[normalize(org.usuario)] || '../imagenes/personas.png').replace(/["\\]/g, '') + '")';
    card.append(content, image);
    return card;
  }
  function render(records) {
    list.replaceChildren();
    records.forEach(function (org) { list.appendChild(makeCard(org)); });
    total = records.length;
    filter(directorySearch ? directorySearch.value : '');
  }
  function filter(term) {
    var normalized = normalize(term);
    var cards = Array.from(list.querySelectorAll('.il-org-card'));
    var visible = 0;
    cards.forEach(function (card) {
      var match = !normalized || card.dataset.search.indexOf(normalized) !== -1;
    card.style.display = match ? '' : 'none';
      if (match) visible++;
    });
    count.textContent = 'Organizaciones y voluntariados (' + visible + ')';
    showing.textContent = 'Mostrando ' + visible + ' de ' + total + ' organizaciones y voluntariados';
    empty.hidden = visible !== 0;
    list.hidden = visible === 0;
    note.hidden = !normalized;
    if (normalized) noteText.textContent = 'Resultados para “' + term.trim() + '” (' + visible + ')';
  }
  try {
    var response = await fetch('/api/organizaciones', { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo consultar Neon.');
    var payload = await response.json();
    if (!payload.ok || !Array.isArray(payload.organizaciones)) throw new Error(payload.message || 'Respuesta inválida del directorio.');
    render(payload.organizaciones);
  } catch (error) {
    list.replaceChildren();
    total = 0;
    filter('');
    empty.textContent = 'No se pudo conectar con Neon. Verifica DATABASE_URL en .env y vuelve a cargar la página.';
  }
  if (directorySearch) directorySearch.addEventListener('input', function () { filter(directorySearch.value); });
  if (heroSearch) heroSearch.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') { directorySearch.value = heroSearch.value; filter(heroSearch.value); document.getElementById('directorio').scrollIntoView({ behavior: 'smooth' }); }
  });
  var heroButton = document.querySelector('.il-search-hero .il-search-submit');
  if (heroButton && heroSearch) heroButton.addEventListener('click', function () {
    directorySearch.value = heroSearch.value;
    filter(heroSearch.value);
    document.getElementById('directorio').scrollIntoView({ behavior: 'smooth' });
  });
  var directoryButton = document.querySelector('.il-search-compact .il-search-submit-sm');
  if (directoryButton && directorySearch) directoryButton.addEventListener('click', function () { filter(directorySearch.value); });
  var clear = document.getElementById('ilSearchNoteClear');
  if (clear) clear.addEventListener('click', function (event) {
    event.preventDefault();
    directorySearch.value = '';
    if (heroSearch) heroSearch.value = '';
    filter('');
    if (directorySearch) directorySearch.focus();
  });
});
