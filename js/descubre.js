// URL base de la API. En Vercel, las funciones de /api viven en el MISMO
// dominio que la página, así que dejamos esto vacío (ruta relativa).
// Si algún día separas el backend a otro dominio, ponlo aquí.
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

    // Quita tildes/diacríticos y pasa a minúsculas para comparar sin importar acentos.
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

    // Actualiza el contador de resultados, el mensaje "Mostrando X de Y" y el estado vacío.
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

    // Junta, sin repetir, todas las palabras/categorías que existen en las
    // tarjetas de organizaciones (su atributo data-categorias). Esta es la
    // "lista de vocabulario" que le mandamos a Gemini para que elija cuáles
    // aplican a lo que escribió el usuario.
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

    // Muestra/oculta tarjetas según si su data-categorias contiene alguna
    // de las palabras dadas (ya sea las que devolvió Gemini, o el término
    // tal cual en el modo local de respaldo).
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

    // Respaldo local: compara el término tal cual, sin IA. Se usa si la API
    // de Gemini no responde (backend apagado, sin internet, etc.) para que
    // el buscador nunca se quede roto.
    function searchByCauseLocal(rawTerm) {
        filtrarPorPalabras(rawTerm, [rawTerm], ' · búsqueda local');
    }

    // Buscador 1 (hero): busca por CAUSA / TIPO DE AYUDA (ej. "juguetes", "biberones").
    // Le manda el término al backend, que usa Gemini para decidir cuáles
    // categorías reales de la plataforma son relevantes (entendiendo
    // sinónimos y errores de tipeo), y con eso filtra las tarjetas.
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

    // Buscador 2 (directorio): busca una organización específica POR SU NOMBRE.
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

    // --- Buscador 1: Hero (por causa / tipo de ayuda) ---
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

    // --- Buscador 2: Directorio (por nombre de la organización) ---
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

    // Estado inicial: todas las organizaciones visibles con sus contadores correctos.
    updateResultsUI(orgCards.length);
});
