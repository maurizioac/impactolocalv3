document.addEventListener('DOMContentLoaded', function () {
    var navToggle = document.getElementById('ilNavToggle');
    var nav = document.querySelector('.il-nav');
    if (navToggle && nav) {
        navToggle.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    var search = document.getElementById('ilSolSearch');
    var requestCards = document.querySelectorAll('.il-request-card');
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
