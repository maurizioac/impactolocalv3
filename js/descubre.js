var IL_API_BASE = '';

document.addEventListener('DOMContentLoaded', function () {
    var navToggle = document.getElementById('ilNavToggle');
    var nav = document.querySelector('.il-nav');
    if (navToggle && nav) {
        navToggle.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    var heroSearch = document.getElementById('ilHeroSearch');
    var directorySearch = document.getElementById('ilDirectorySearch');
    var directorySection = document.getElementById('directorio');
    var orgList = document.getElementById('ilOrgList');
    var orgCards = orgList ? Array.prototype.slice.call(orgList.querySelectorAll('.il-org-card')) : [];
    var orgCountHeading = document.getElementById('ilOrgCount');
    var showingLabel = document.getElementById('ilShowingLabel');
    var emptyState = document.getElementById('ilEmptyState');
    var activeFiltersBar = document.getElementById('ilActiveFilters');
    var searchNote = document.getElementById('ilSearchNote');
    var searchNoteText = document.getElementById('ilSearchNoteText');
    var searchNoteClear = document.getElementById('ilSearchNoteClear');
    var totalOrgCount = orgCards.length;

    function normalize(text) {
        return (text || '')
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function getOrgName(card) {
        var heading = card.querySelector('h3');
        return heading ? heading.textContent : '';
    }

    function getOrgCategorias(card) {
        return card.getAttribute('data-categorias') || '';
    }

    function updateResultsUI(visibleCount) {
        if (orgCountHeading) {
            orgCountHeading.textContent = 'Organizaciones Registradas y Verificadas (' + visibleCount + ')';
        }
        if (showingLabel) {
            showingLabel.textContent = 'Mostrando ' + visibleCount + ' de ' + totalOrgCount + ' iniciativas registradas en el ecosistema nacional';
        }
        if (emptyState) {
            emptyState.hidden = visibleCount !== 0;
        }
        if (orgList) {
            orgList.style.display = visibleCount === 0 ? 'none' : '';
        }
    }

    function showAllCards() {
        orgCards.forEach(function (card) {
            card.style.display = '';
        });
        updateResultsUI(orgCards.length);
    }

    function hideSearchNote() {
        if (searchNote) {
            searchNote.hidden = true;
        }
        if (activeFiltersBar) {
            activeFiltersBar.hidden = false;
        }
    }

    function showSearchNote(message) {
        if (searchNote && searchNoteText) {
            searchNoteText.textContent = message;
            searchNote.hidden = false;
        }
        if (activeFiltersBar) {
            activeFiltersBar.hidden = true;
        }
    }

    function getVocabularioCategorias() {
        var vistas = {};
        var vocabulario = [];
        orgCards.forEach(function (card) {
            getOrgCategorias(card).split(/\s+/).forEach(function (palabra) {
                if (palabra && !vistas[palabra]) {
                    vistas[palabra] = true;
                    vocabulario.push(palabra);
                }
            });
        });
        return vocabulario;
    }

    function filtrarPorPalabras(rawTerm, palabras, sufijoNota) {
        var palabrasNorm = palabras.map(normalize).filter(function (p) { return p !== ''; });

        var visibleCount = 0;
        orgCards.forEach(function (card) {
            var categorias = normalize(getOrgCategorias(card));
            var matches = palabrasNorm.some(function (p) {
                return categorias.indexOf(p) !== -1;
            });
            card.style.display = matches ? '' : 'none';
            if (matches) {
                visibleCount += 1;
            }
        });

        updateResultsUI(visibleCount);
        showSearchNote(
            'Resultados para "' + rawTerm.trim() + '" (' + visibleCount +
            ' encontrada' + (visibleCount === 1 ? '' : 's') + ')' +
            (sufijoNota || '')
        );
    }

    function searchByCauseLocal(rawTerm) {
        filtrarPorPalabras(rawTerm, [rawTerm], ' · búsqueda local');
    }

    function searchByCause(rawTerm) {
        var term = rawTerm.trim();

        if (directorySearch) {
            directorySearch.value = '';
        }

        if (term === '') {
            showAllCards();
            hideSearchNote();
            return;
        }

        showSearchNote('Buscando "' + term + '" con IA...');

        fetch(IL_API_BASE + '/api/buscar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                termino: term,
                categorias: getVocabularioCategorias()
            })
        })
            .then(function (res) { return res.json(); })
            .then(function (json) {
                var palabras = (json.success && json.data && json.data.palabras_relacionadas) || [];
                filtrarPorPalabras(term, palabras);
            })
            .catch(function (err) {
                console.error('No se pudo conectar con /buscar, usando búsqueda local:', err);
                searchByCauseLocal(term);
            });
    }

    function searchByName(rawTerm) {
        var term = normalize(rawTerm);
        if (term === '') {
            showAllCards();
            hideSearchNote();
            return;
        }

        var visibleCount = 0;
        orgCards.forEach(function (card) {
            var nombre = normalize(getOrgName(card));
            var matches = nombre.indexOf(term) !== -1;
            card.style.display = matches ? '' : 'none';
            if (matches) {
                visibleCount += 1;
            }
        });

        updateResultsUI(visibleCount);
        showSearchNote('Buscando organización: "' + rawTerm.trim() + '" (' + visibleCount + ' encontrada' + (visibleCount === 1 ? '' : 's') + ')');
    }

    function goToDirectory() {
        if (directorySection) {
            directorySection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    if (heroSearch) {
        heroSearch.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                searchByCause(heroSearch.value);
                goToDirectory();
            }
        });
        var heroSubmit = heroSearch.closest('form').querySelector('.il-search-submit');
        if (heroSubmit) {
            heroSubmit.addEventListener('click', function () {
                searchByCause(heroSearch.value);
                goToDirectory();
            });
        }
    }

    if (directorySearch) {
        directorySearch.addEventListener('input', function () {
            searchByName(directorySearch.value);
        });
        var directorySubmit = directorySearch.closest('form').querySelector('.il-search-submit-sm');
        if (directorySubmit) {
            directorySubmit.addEventListener('click', function () {
                searchByName(directorySearch.value);
            });
        }
    }

    if (searchNoteClear) {
        searchNoteClear.addEventListener('click', function () {
            if (heroSearch) heroSearch.value = '';
            if (directorySearch) directorySearch.value = '';
            showAllCards();
            hideSearchNote();
        });
    }

    var filterCards = document.querySelectorAll('.il-filter-card');
    filterCards.forEach(function (card) {
        card.addEventListener('click', function () {
            filterCards.forEach(function (c) { c.classList.remove('is-selected'); });
            card.classList.add('is-selected');
        });
    });

    var consultarBtn = document.getElementById('ilConsultarBtn');
    if (consultarBtn) {
        consultarBtn.addEventListener('click', function () {
            window.location.href = 'solicitudes.html';
        });
    }

    updateResultsUI(orgCards.length);
});
