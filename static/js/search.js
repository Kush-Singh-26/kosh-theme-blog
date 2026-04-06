(function() {
    let wasmLoaded = false;
    let wasmPromise = null;
    let wasmLoadedVersion = null;

    // Elements
    const searchBtn = document.getElementById('search-btn');
    const heroSearchTrigger = document.getElementById('hero-search-trigger');
    const searchModal = document.getElementById('search-modal');
    const closeSearch = document.querySelector('.close-search');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchSuggestions = document.getElementById('search-suggestions');
    
    let selectedIndex = -1;
    let selectedSuggestionIndex = -1;
    let suggestionsActive = false;
    let currentSuggestions = [];

    // Ensure siteBaseURL is set
    const baseURL = window.siteBaseURL || '';
    const versionQuery = window.buildVersion ? `?v=${window.buildVersion}` : '';

    // Construct paths safely (avoiding double slashes except after protocol)
    // Optimized to reduce intermediate string allocations
    const joinPath = (base, path) => {
        if (!base) return path;
        const needsSlash = !base.endsWith('/') && !path.startsWith('/');
        const hasDoubleSlash = base.endsWith('/') && path.startsWith('/');
        
        if (hasDoubleSlash) return base + path.slice(1);
        if (needsSlash) return base + '/' + path;
        return base + path;
    };

    // Load WASM when needed
    async function loadWasm() {
        const currentVersion = window.buildVersion || '';
        if (wasmLoaded && wasmLoadedVersion === currentVersion) return;
        if (wasmLoadedVersion && wasmLoadedVersion !== currentVersion) {
            wasmLoaded = false;
            wasmPromise = null;
        }
        if (wasmLoaded) return;
        if (wasmPromise) return wasmPromise;

        wasmPromise = (async () => {
            try {
                // 1. Load wasm_exec.js if Go is not defined
                if (typeof Go === 'undefined') {
                    const script = document.createElement('script');
                    script.src = joinPath(baseURL, '/static/js/wasm_exec.js') + versionQuery;
                    const scriptPromise = new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = (e) => reject(new Error(`Failed to load wasm_exec.js: ${e}`));
                    });
                    document.head.appendChild(script);
                    await scriptPromise;
                }

                if (typeof Go === 'undefined') {
                    throw new Error("wasm_exec.js failed to load - Go is still undefined");
                }
                const go = new Go();
                
                const wasmPath = joinPath(baseURL, '/static/wasm/search.wasm') + versionQuery;
                const response = await fetch(wasmPath);
                if (!response.ok) throw new Error(`Failed to fetch WASM: ${response.status} ${response.statusText}`);
                
                const result = await WebAssembly.instantiateStreaming(response, go.importObject);
                go.run(result.instance);
                
                // Check if initSearch is available
                if (typeof window.initSearch !== 'function') {
                    throw new Error("window.initSearch is not available after WASM load");
                }
                
                // Initialize with the data index
                const binPath = joinPath(baseURL, '/search.bin') + versionQuery;
                
                try {
                    await window.initSearch(binPath);
                    wasmLoaded = true;
                    wasmLoadedVersion = currentVersion;
                } catch (initErr) {
                    console.error("initSearch failed:", initErr);
                    throw new Error(`Failed to initialize search index: ${initErr}`);
                }
            } catch (err) {
                console.error("Search initialization failed:", err);
                if (searchResults) {
                    const errorMessage = err && err.message ? err.message : String(err);
                    searchResults.innerHTML = `<div style="padding: 2rem; color: #f85149;">Search initialization failed: ${errorMessage}</div>`;
                }
                throw err;
            }
        })();

        return wasmPromise;
    }

    function openModal() {
        if (!searchModal) return;
        searchModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        
        loadWasm().then(() => {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
        }).catch(() => {});
    }

    function closeModal() {
        if (!searchModal) return;
        searchModal.style.display = 'none';
        document.body.style.overflow = '';
        if (searchInput) searchInput.value = '';
        if (searchResults) searchResults.innerHTML = '';
        if (searchSuggestions) {
            searchSuggestions.innerHTML = '';
            searchSuggestions.style.display = 'none';
        }
        selectedIndex = -1;
        selectedSuggestionIndex = -1;
        suggestionsActive = false;
        currentSuggestions = [];
    }

    // Event Listeners
    if (searchBtn) searchBtn.addEventListener('click', openModal);
    if (heroSearchTrigger) heroSearchTrigger.addEventListener('click', openModal);
    if (closeSearch) closeSearch.addEventListener('click', closeModal);

    window.addEventListener('click', (e) => {
        if (e.target == searchModal) closeModal();
    });

    window.addEventListener('keydown', (e) => {
        // Detect modal open state consistently (main.js sets flex, search.js used to set block)
        const isSearchOpen = searchModal && (searchModal.style.display === 'flex' || searchModal.style.display === 'block');
        
        if (!isSearchOpen && (e.key === '/' || (e.ctrlKey && e.key === 'k'))) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }
            e.preventDefault();
            openModal();
            return;
        }
        
        if (isSearchOpen) {
            if (e.key === 'Escape') {
                closeModal();
                return;
            }
            
            // Handle suggestions navigation
            if (suggestionsActive && e.key === 'Tab') {
                e.preventDefault();
                const suggestionItems = searchSuggestions.querySelectorAll('.suggestion-item');
                if (suggestionItems.length > 0) {
                    selectedSuggestionIndex = (selectedSuggestionIndex + 1) % suggestionItems.length;
                    updateSuggestionSelection(suggestionItems);
                }
                return;
            }

            if (suggestionsActive && e.key === 'Enter' && selectedSuggestionIndex >= 0) {
                e.preventDefault();
                const suggestionItems = searchSuggestions.querySelectorAll('.suggestion-item');
                if (suggestionItems[selectedSuggestionIndex]) {
                    suggestionItems[selectedSuggestionIndex].click();
                }
                return;
            }

            // Only handle nav keys if result items exist
            const items = searchResults ? searchResults.querySelectorAll('.search-result-item') : [];
            
            if (e.key === 'ArrowDown' && items.length > 0) {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                updateSelection(items);
            } else if (e.key === 'ArrowUp' && items.length > 0) {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                updateSelection(items);
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                if (items[selectedIndex]) items[selectedIndex].click();
            }
            // Allow Backspace and other keys to function normally in the input
        }
    });

    function updateSelection(items) {
        // If we select a result, deselect suggestions
        if (selectedIndex >= 0) {
            selectedSuggestionIndex = -1;
            updateSuggestionSelection(searchSuggestions.querySelectorAll('.suggestion-item'));
        }
        items.forEach((item, i) => {
            if (i === selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    function updateSuggestionSelection(items) {
        items.forEach((item, i) => {
            if (i === selectedSuggestionIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    let debounceTimer;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value;
            debounceTimer = setTimeout(() => {
                updateSuggestions(query);
                performSearch(query);
            }, 100);
        });
    }

    function updateSuggestions(query) {
        if (!wasmLoaded || !query || query.trim().length < 2) {
            if (searchSuggestions) {
                searchSuggestions.innerHTML = '';
                searchSuggestions.style.display = 'none';
                suggestionsActive = false;
                currentSuggestions = [];
                selectedSuggestionIndex = -1;
            }
            return;
        }

        try {
            // Get last word for completion
            const words = query.split(/\s+/);
            const lastWord = words[words.length - 1];
            if (lastWord.length < 2 || lastWord.startsWith('+') || lastWord.startsWith('-') || lastWord.startsWith('"')) {
                searchSuggestions.style.display = 'none';
                suggestionsActive = false;
                return;
            }

            const suggestions = window.getSuggestions(lastWord);
            if (!suggestions || suggestions.length === 0) {
                searchSuggestions.style.display = 'none';
                suggestionsActive = false;
                return;
            }

            currentSuggestions = suggestions;
            suggestionsActive = true;
            searchSuggestions.innerHTML = '';
            searchSuggestions.style.display = 'flex';

            const fragment = document.createDocumentFragment();
            suggestions.forEach((s, idx) => {
                const item = document.createElement('span');
                item.className = 'suggestion-item';
                item.textContent = s;
                item.onclick = () => {
                    words[words.length - 1] = s;
                    searchInput.value = words.join(' ') + ' ';
                    searchInput.focus();
                    updateSuggestions(searchInput.value);
                    performSearch(searchInput.value);
                };
                fragment.appendChild(item);
            });
            searchSuggestions.appendChild(fragment);
            selectedSuggestionIndex = -1;
        } catch (err) {
            console.error("Suggestions failed:", err);
        }
    }

    function performSearch(query) {
        if (!wasmLoaded || !query || !query.trim()) {
            if (searchResults) searchResults.innerHTML = '';
            return;
        }

        try {
            const results = window.searchPosts(query, "all");
            renderResults(results);
        } catch (err) {
            console.error("Search failed:", err);
        }
    }

    // Warm search assets early in dev to reduce first-open races after rebuilds.
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '0.0.0.0') {
        window.addEventListener('load', () => {
            loadWasm().catch(() => {});
        }, { once: true });
    }

    function renderResults(results) {
        if (!searchResults) return;
        searchResults.innerHTML = '';
        selectedIndex = -1;

        if (!results || results.length === 0) {
            searchResults.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No results found.</div>';
            return;
        }

        const fragment = document.createDocumentFragment();
        const limitedResults = results.slice(0, 20);
        limitedResults.forEach(res => {
            const item = document.createElement('a');
            const link = joinPath(baseURL, res.link);
            item.href = link;
            item.className = 'search-result-item';
            item.innerHTML = `
                <div class="search-result-title">${res.title}</div>
                <div class="search-result-snippet">${res.snippet}</div>
            `;

            // Bridge to Graph
            const absoluteLink = joinPath(baseURL, res.link);
            const gBtn = document.createElement('div');
            gBtn.className = 'search-graph-btn';
            gBtn.textContent = 'Explore in Graph';
            gBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (document.getElementById('graph-canvas')) {
                    // Already on graph page, just focus
                    window.dispatchEvent(new CustomEvent('kosh:graph-focus', { detail: { link: absoluteLink } }));
                } else {
                    // Navigate to graph page with focus param
                    const graphUrl = joinPath(baseURL, '/graph.html');
                    window.location.href = `${graphUrl}?focus=${encodeURIComponent(absoluteLink)}`;
                }
                closeModal();
            };
            item.appendChild(gBtn);

            fragment.appendChild(item);
        });
        searchResults.appendChild(fragment);
    }
})();
