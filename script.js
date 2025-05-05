$(document).ready(function () {
    // Element references
    const loader = $("#loader");
    const surahCardsContainer = $("#surahCardsContainer");
    const versesContainer = $("#versesContainer");
    const backButton = $("#backButton");
    const versesList = $("#versesList");
    const juzCardsContainer = $("#juzCardsContainer");

    // State management
    let currentView = 'surahs';
    let previousView = 'surahs';
    let originalSurahCardsHTML = '';
    let allSurahs = [];
    let juzsData = [];

    // Initial load
    function initializeApp() {
        loader.removeClass("hidden");
        fetchSurahs();
        setupEventHandlers();
        setupSearch();
        setupModals();
    }

    // Fetch initial surah data
    function fetchSurahs() {
        $.ajax({
            url: "https://api.quran.com/api/v4/chapters",
            method: "GET",
            success: function (data) {
                allSurahs = data.chapters;
                renderSurahCards(allSurahs);
                initializeJuzs();
            },
            error: handleAjaxError
        });
    }

    // Render surah cards (FIXED TYPO HERE)
    function renderSurahCards(surahs) {
        surahCardsContainer.empty();
        surahs.forEach(surah => {  // Changed 'surahes' to 'surahs'
            surahCardsContainer.append(createSurahCard(surah));
        });
        originalSurahCardsHTML = surahCardsContainer.html();
        loader.addClass("hidden");
        surahCardsContainer.removeClass("hidden");
    }

        
            // Create individual surah card HTML
            function createSurahCard(surah) {
                return `
                    <div class="surah-card bg-white p-6 rounded-lg shadow-md hover:bg-gray-50" 
                         data-surah-id="${surah.id}">
                        <h3 class="text-xl font-bold text-blue-600 mb-2">${surah.name_simple}</h3>
                        <p class="text-gray-700">Verses: ${surah.verses_count}</p>
                        <p class="text-sm text-gray-500">${surah.translated_name.name}</p>
                    </div>
                `;
            }
        
            // Fetch and display verses
            function fetchVerses(chapterNumber) {
                loader.removeClass("hidden");
                versesList.empty();
        
                $.ajax({
                    url: `https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${chapterNumber}`,
                    method: "GET",
                    success: function (data) {
                        data.verses.forEach(verse => {
                            versesList.append(`
                                <div class="verse-card p-4">
                                    <div class="arabic-text">${verse.text_uthmani}</div>
                                    <div class="text-gray-500 text-sm mt-2">${verse.verse_key}</div>
                                </div>
                            `);
                        });
                        switchView('verses');
                    },
                    error: handleAjaxError
                });
            }
        
            // View management
            function switchView(view) {
                surahCardsContainer.addClass("hidden");
                versesContainer.addClass("hidden");
                juzCardsContainer.addClass("hidden");
                loader.addClass("hidden");
        
                previousView = currentView;
                currentView = view;
        
                if (view === 'surahs') {
                    surahCardsContainer.removeClass("hidden");
                } else if (view === 'verses') {
                    versesContainer.removeClass("hidden");
                } else if (view === 'juzs') {
                    juzCardsContainer.removeClass("hidden");
                }
            }
        
            // Juz functionality
            function initializeJuzs() {
                $.ajax({
                    url: "https://api.quran.com/api/v4/juzs",
                    method: "GET",
                    success: function (data) {
                        juzsData = data.juzs;
                        renderJuzCards();
                    }
                });
            }
        
            function renderJuzCards() {
                juzCardsContainer.empty();
                juzsData.forEach(juz => {
                    const surahNames = getJuzSurahNames(juz);
                    juzCardsContainer.append(`
                        <div class="juz-card bg-white p-6 rounded-lg shadow-md hover:bg-gray-50" 
                             data-juz-number="${juz.juz_number}">
                            <h3 class="text-xl font-bold text-blue-600 mb-2">Juz ${juz.juz_number}</h3>
                            <p class="text-gray-700">Contains: ${surahNames.join(', ')}</p>
                        </div>
                    `);
                });
            }
        
            function getJuzSurahNames(juz) {
                return Object.keys(juz.verse_mapping)
                    .map(id => allSurahs.find(s => s.id == id)?.name_simple)
                    .filter(name => name);
            }
        
            // Event handlers
            function setupEventHandlers() {
                // Surah card click
                surahCardsContainer.on("click", ".surah-card", function () {
                    const chapterNumber = $(this).data("surah-id");
                    fetchVerses(chapterNumber);
                });
        
                // Back button
                backButton.on("click", handleBackButton);
        
                // Juz navigation
                $('#juzButton').click(showJuzView);
                juzCardsContainer.on('click', '.juz-card', handleJuzSelection);
            }
        
            function handleBackButton() {
                if (currentView === 'verses') {
                    switchView(previousView);
                } else {
                    switchView('surahs');
                }
            }
        
            function showJuzView() {
                switchView('juzs');
            }
        
            function handleJuzSelection() {
                const juzNumber = $(this).data('juz-number');
                const juz = juzsData.find(j => j.juz_number == juzNumber);
                const filteredSurahs = allSurahs.filter(s => 
                    Object.keys(juz.verse_mapping).includes(s.id.toString())
                );
                
                surahCardsContainer.empty();
                filteredSurahs.forEach(surah => {
                    surahCardsContainer.append(createSurahCard(surah));
                });
                switchView('filteredSurahs');
            }
        
            // Search functionality
            // Search functionality (FIXED QUOTATION MARKS)
    function setupSearch() {
        const searchInput = $('#searchInput');
        const searchResults = $('#searchResults');

        searchInput.on('input', debounce(function (e) {
            const query = e.target.value.toLowerCase();
            const results = allSurahs.filter(surah => 
                surah.name_simple.toLowerCase().includes(query)
            );
            renderSearchResults(results);
        }, 300));

        searchResults.on('click', '[data-surah]', function (e) {
            e.preventDefault();
            fetchVerses($(this).data('surah'));
            searchResults.addClass("hidden");
        });
    }

    function renderSearchResults(results) {
        const searchResults = $('#searchResults');
        searchResults.empty();
        
        results.forEach(surah => {
            searchResults.append(`
                <a href="#" class="block px-4 py-2 hover:bg-gray-100" data-surah="${surah.id}">
                    ${surah.name_simple} (${surah.verses_count} verses)
                </a>
            `);
        });
        searchResults.toggleClass('hidden', results.length === 0);
    }

            // Modal controls
            function setupModals() {
                // Settings modal
                $('#settingsButton').click(() => $('#settingsModal').removeClass('hidden'));
                $('#closeSettings').click(() => $('#settingsModal').addClass('hidden'));
        
                // Account modal
                $('#accountButton').click(() => $('#accountModal').removeClass('hidden'));
                $('#closeAccount').click(() => $('#accountModal').addClass('hidden'));
        
                // Close modals on outside click
                $(window).click(function (e) {
                    if (e.target === $('#settingsModal')[0]) $('#settingsModal').addClass('hidden');
                    if (e.target === $('#accountModal')[0]) $('#accountModal').addClass('hidden');
                });
            }
        
            // Utility functions
            function debounce(func, wait) {
                let timeout;
                return function (...args) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), wait);
                };
            }
        
            function handleAjaxError(err) {
                console.error("API Error:", err);
                loader.addClass("hidden");
            }
        
            // Start the application
            initializeApp();
        });
        document.addEventListener('DOMContentLoaded', () => {
            const mobileMenuButton = document.getElementById('mobileMenuButton');
            const mobileMenu = document.getElementById('mobileMenu');
        
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        
            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenu.contains(e.target) && !mobileMenuButton.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                }
            });
        });