document.addEventListener('DOMContentLoaded', function () {
    var navToggle = document.getElementById('ilNavToggle');
    var nav = document.querySelector('.il-nav');
    if (navToggle && nav) {
        navToggle.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    var search = document.getElementById('ilSolSearch');
    var requestList = document.querySelector('.il-request-list');
    var requestCards = document.querySelectorAll('.il-request-card');
    // Las solicitudes aprobadas del panel ONG aparecen en el listado público en esta demo local.
    try {
        var demoData = JSON.parse(localStorage.getItem('impactolocal-ong-demo-v1') || '{}');
        (Array.isArray(demoData.requests) ? demoData.requests : []).forEach(function (request) {
            if (request.state !== 'Aprobada' || !requestList) return;
            var card = document.createElement('article');
            card.className = 'il-request-card ong-public-request';
            var content = document.createElement('div');
            content.className = 'il-request-content';
            var titleRow = document.createElement('div');
            titleRow.className = 'il-request-title-row';
            var title = document.createElement('h3');
            title.textContent = (demoData.profile && demoData.profile.name ? demoData.profile.name : 'Organización') + ' (' + request.title + ')';
            var date = document.createElement('span');
            date.className = 'il-request-date';
            date.textContent = 'Publicado recientemente';
            titleRow.append(title, date);
            var description = document.createElement('p');
            description.textContent = request.description;
            var footer = document.createElement('div');
            footer.className = 'il-request-footer';
            var tags = document.createElement('div');
            tags.className = 'il-request-tags';
            var type = document.createElement('span');
            type.className = 'il-chip il-chip--green-outline';
            type.textContent = request.type;
            var location = document.createElement('span');
            location.className = 'il-chip il-chip--blue-outline';
            location.textContent = request.location || 'Perú';
            tags.append(type, location);
            var actions = document.createElement('div');
            actions.className = 'il-card-actions';
            var details = document.createElement('a');
            details.href = 'organizacion.html';
            details.className = 'il-btn-gray';
            details.textContent = 'Conocer organización';
            var join = document.createElement('a');
            join.href = 'iniciar-sesion.html';
            join.className = 'il-btn-solid';
            join.textContent = 'Postular como voluntario';
            actions.append(details, join);
            footer.append(tags, actions);
            content.append(titleRow, description, footer);
            card.appendChild(content);
            requestList.appendChild(card);
        });
        requestCards = document.querySelectorAll('.il-request-card');
    } catch (error) {
        console.warn('No se pudieron cargar solicitudes de demostración.', error);
    }
    if (search) {
        search.addEventListener('input', function () {
            var term = search.value.trim().toLowerCase();
            requestCards.forEach(function (card) {
                var text = card.textContent.toLowerCase();
                card.style.display = term === '' || text.indexOf(term) !== -1 ? '' : 'none';
            });
        });
    }

    var loadMore = document.getElementById('ilLoadMore');
    if (loadMore) {
        loadMore.addEventListener('click', function () {
            loadMore.textContent = 'No hay más solicitudes por ahora';
            loadMore.disabled = true;
            loadMore.style.opacity = '0.6';
            loadMore.style.cursor = 'default';
        });
    }
});
