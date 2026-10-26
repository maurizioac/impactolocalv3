document.addEventListener('DOMContentLoaded', async function () {
  var normalize = function (value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); };
  var params = new URLSearchParams(window.location.search);
  var username = params.get('usuario') || '';
  var defaultImages = {
    cambiandovidas: '../imagenes/ong-cambiando-vidas.svg',
    escoladrillosperu: '../imagenes/ong-escoladrillos.svg',
    buscandouncambiope: '../imagenes/ong-buscando-cambio.svg',
    corazonesinmaculadoslima: '../imagenes/ong-corazones-inmaculados.svg',
    gabyalrescate: '../imagenes/ong-gaby-rescate.svg'
  };
  var status = document.getElementById('detailStatus');
  var records;
  try {
    var response = await fetch('/api/organizaciones', { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo conectar al directorio.');
    var payload = await response.json();
    if (!payload.ok || !Array.isArray(payload.organizaciones)) throw new Error(payload.message || 'Respuesta inválida del directorio.');
    records = payload.organizaciones;
  } catch (_) {
    status.textContent = 'No se pudo cargar la información desde Neon. Intenta de nuevo más tarde.';
    return;
  }
  var org = records.find(function (record) { return normalize(record.usuario) === normalize(username); });
  if (!org) {
    status.textContent = 'No encontramos esa organización. Vuelve al directorio para elegir una iniciativa.';
    return;
  }
  var text = function (id, value) { document.getElementById(id).textContent = value || ''; };
  text('detailBreadcrumb', org.titulo);
  text('detailTitle', org.titulo);
  text('detailSubtitle', org.subtitulo);
  text('detailUsername', org.titulo);
  text('detailDescription', org.descripcion);
  text('detailHandle', '@' + org.usuario);
  text('detailSubtitle1', org.subtitulo1 || org.subtitulo);
  text('detailText1', org.texto1);
  text('detailSubtitle2', org.subtitulo2);
  text('detailText2', org.texto2);
  var image = function (id, src) {
    var element = document.getElementById(id);
    if (element) element.src = src || defaultImages[normalize(org.usuario)] || '../imagenes/personas.png';
  };
  image('detailImage', org.imagenPrincipal);
  var channels = [
    ['fa-globe', 'Sitio web', org.web],
    ['fa-instagram', 'Instagram', org.instagram],
    ['fa-facebook', 'Facebook', org.facebook],
    ['fa-tiktok', 'TikTok', org.tiktok]
  ];
  var links = document.getElementById('detailSocialLinks');
  channels.forEach(function (channel) {
    if (!channel[2]) return;
    var anchor = document.createElement('a');
    anchor.className = 'detail-social-link'; anchor.href = channel[2]; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
    var icon = document.createElement('i'); icon.className = 'fa-brands ' + channel[0];
    if (channel[0] === 'fa-globe') icon.className = 'fa-solid ' + channel[0];
    var label = document.createElement('span'); label.textContent = channel[1];
    var url = document.createElement('small'); url.textContent = channel[2];
    anchor.append(icon, label, url); links.appendChild(anchor);
  });
  if (!links.children.length) links.textContent = 'Esta iniciativa aún no ha compartido sus redes sociales.';
  document.title = org.titulo + ' - ImpactoLOCAL';
  status.hidden = true;
  document.getElementById('detailContent').hidden = false;
});
