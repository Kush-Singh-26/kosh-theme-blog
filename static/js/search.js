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

    const joinPath = (base, path) => {
        if (!base) return path;
        const needsSlash = !base.endsWith('/') && !path.startsWith('/');
        const hasDoubleSlash = base.endsWith('/') && path.startsWith('/');
        if (hasDoubleSlash) return base + path.slice(1);
        if (needsSlash) return base + '/' + path;
        return base + path;
    };

    async function loadWasm() {
        const currentVersion = window.buildVersion || '';
        if (wasmLoaded && wasmLoadedVersion === currentVersion) return;
        if (wasmLoaded) { wasmLoaded = false; wasmPromise = null; }
        if (wasmPromise) return wasmPromise;

        wasmPromise = (async () => {
            try {
                if (typeof Go === 'undefined') {
                    const script = document.createElement('script');
                    script.src = joinPath(baseURL, '/static/js/wasm_exec.js') + versionQuery;
                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }
                const go = new Go();
                const wasmPath = joinPath(baseURL, '/static/wasm/search.wasm') + versionQuery;
                const response = await fetch(wasmPath);
                const result = await WebAssembly.instantiateStreaming(response, go.importObject);
                go.run(result.instance);
                const binPath = joinPath(baseURL, '/search.bin') + versionQuery;
                await window.initSearch(binPath);
                wasmLoaded = true;
                wasmLoadedVersion = currentVersion;
            } catch (err) {
                console.error("Search initialization failed:", err);
                if (searchResults) searchResults.innerHTML = `<div style="padding: 2rem; color: #f85149;">Search failed to load.</div>`;
            }
        })();
        return wasmPromise;
    }

    function renderDiscovery() {
        if (!searchResults) return;
        
        var tagsHTML = '';
        
        try {
            var tags = window.blogTags;
            if (typeof tags === 'string') {
                tags = JSON.parse(tags);
            }
            if (tags && tags.length > 0 && tags[0] && tags[0].Name) {
                var sorted = tags.slice().sort(function(a, b) {
                    return (b.Count || 0) - (a.Count || 0);
                }).slice(0, 4);
                
                tagsHTML = sorted.map(function(tag) {
                    var name = tag.Name;
                    var link = tag.Link || '';
                    var slug = '';
                    if (link.indexOf && link.indexOf('/blogs/tags/') > -1) {
                        slug = link.split('/blogs/tags/')[1].replace('.html', '');
                    } else if (name) {
                        slug = name.toLowerCase().replace(/\s+/g, '-');
                    }
                    var url = slug ? (baseURL + '/blogs/tags/' + slug + '.html') : (baseURL + '/blogs/tags/index.html');
                    return '<a href="' + url + '" class="discovery-tag">#' + name + '</a>';
                }).join('');
            }
        } catch (e) {}
        
        if (!tagsHTML) {
            tagsHTML = 
                '<a href="' + baseURL + '/blogs/tags/minimalism.html" class="discovery-tag">#minimalism</a>' +
                '<a href="' + baseURL + '/blogs/tags/technology.html" class="discovery-tag">#technology</a>' +
                '<a href="' + baseURL + '/blogs/tags/design.html" class="discovery-tag">#design</a>' +
                '<a href="' + baseURL + '/blogs/tags/writing.html" class="discovery-tag">#writing</a>';
        }
        
        searchResults.innerHTML = `
            <div class="search-empty-state">
                <div class="discovery-section">
                    <div class="discovery-title">Featured Topics</div>
                    <div class="discovery-tags">${tagsHTML}</div>
                </div>
                <div class="discovery-section discovery-recent">
                    <div class="discovery-title">Quick Actions</div>
                    <a href="${joinPath(baseURL, '/graph.html')}" class="recent-search-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10l2.1 2.1M4.9 19.1l2.1-2.1m10-10l2.1-2.1"></path></svg>
                        Explore Knowledge Graph
                    </a>
                    <a href="${joinPath(baseURL, '/tags')}" class="recent-search-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                        Browse All Topics
                    </a>
                </div>
            </div>
        `;
    }

    function openModal() {
        if (!searchModal) return;
        searchModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        renderDiscovery();
        loadWasm().then(() => { if (searchInput) { searchInput.value = ''; searchInput.focus(); } }).catch(() => {});
    }

    function closeModal() {
        if (!searchModal) return;
        searchModal.style.display = 'none';
        document.body.style.overflow = '';
        if (searchInput) searchInput.value = '';
        if (searchResults) searchResults.innerHTML = '';
        if (searchSuggestions) { searchSuggestions.innerHTML = ''; searchSuggestions.style.display = 'none'; }
        selectedIndex = -1;
        selectedSuggestionIndex = -1;
        suggestionsActive = false;
    }

    if (searchBtn) searchBtn.addEventListener('click', openModal);
    if (heroSearchTrigger) heroSearchTrigger.addEventListener('click', openModal);
    if (closeSearch) closeSearch.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target == searchModal) closeModal(); });

    window.addEventListener('keydown', (e) => {
        const isSearchOpen = searchModal && searchModal.style.display === 'flex';
        if (!isSearchOpen && (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key === 'k'))) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
            e.preventDefault();
            openModal();
            return;
        }
        if (isSearchOpen) {
            if (e.key === 'Escape') { closeModal(); return; }
            const items = searchResults ? searchResults.querySelectorAll('.search-result-item') : [];
            if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length > 0) { selectedIndex = Math.min(selectedIndex + 1, items.length - 1); updateSelection(items); } }
            else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length > 0) { selectedIndex = Math.max(selectedIndex - 1, 0); updateSelection(items); } }
            else if (e.key === 'Enter' && selectedIndex >= 0 && items[selectedIndex]) { e.preventDefault(); items[selectedIndex].click(); }
        }
    });

    function updateSelection(items) {
        items.forEach((item, i) => {
            if (i === selectedIndex) { item.classList.add('selected'); item.scrollIntoView({ block: 'nearest' }); }
            else { item.classList.remove('selected'); }
        });
    }

    let debounceTimer;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value;
            debounceTimer = setTimeout(() => { performSearch(query); }, 100);
        });
    }

    function performSearch(query) {
        if (!wasmLoaded || !query || !query.trim()) { renderDiscovery(); return; }
        try {
            const results = window.searchPosts(query, "all");
            if (!results || results.length === 0) {
                renderDiscovery(true);
            } else {
                renderResults(results);
            }
        } catch (err) { console.error("Search failed:", err); }
    }

    function renderDiscovery(noResults = false) {
        if (!searchResults) return;
        
        var tagsHTML = '';
        
        try {
            var tags = window.blogTags;
            if (typeof tags === 'string') {
                tags = JSON.parse(tags);
            }
            if (tags && tags.length > 0 && tags[0] && tags[0].Name) {
                var sorted = tags.slice().sort(function(a, b) {
                    return (b.Count || 0) - (a.Count || 0);
                }).slice(0, 4);
                
                tagsHTML = sorted.map(function(tag) {
                    var name = tag.Name;
                    var link = tag.Link || '';
                    var slug = '';
                    if (link.indexOf && link.indexOf('/blogs/tags/') > -1) {
                        slug = link.split('/blogs/tags/')[1].replace('.html', '');
                    } else if (name) {
                        slug = name.toLowerCase().replace(/\s+/g, '-');
                    }
                    var url = slug ? (baseURL + '/blogs/tags/' + slug + '.html') : (baseURL + '/blogs/tags/index.html');
                    return '<a href="' + url + '" class="discovery-tag">#' + name + '</a>';
                }).join('');
            }
        } catch (e) {}
        
        if (!tagsHTML) {
            tagsHTML = 
                '<a href="' + baseURL + '/blogs/tags/minimalism.html" class="discovery-tag">#minimalism</a>' +
                '<a href="' + baseURL + '/blogs/tags/technology.html" class="discovery-tag">#technology</a>' +
                '<a href="' + baseURL + '/blogs/tags/design.html" class="discovery-tag">#design</a>' +
                '<a href="' + baseURL + '/blogs/tags/writing.html" class="discovery-tag">#writing</a>';
        }

        const noResultsHTML = noResults ? `<div class="search-no-results">No results found for "${searchInput.value}". Try exploring these topics instead:</div>` : '';
        
        searchResults.innerHTML = `
            <div class="search-empty-state">
                ${noResultsHTML}
                <div class="discovery-section">
                    <div class="discovery-title">Featured Topics</div>
                    <div class="discovery-tags">${tagsHTML}</div>
                </div>
                <div class="discovery-section discovery-recent">
                    <div class="discovery-title">Quick Actions</div>
                    <a href="${joinPath(baseURL, '/graph.html')}" class="recent-search-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10l2.1 2.1M4.9 19.1l2.1-2.1m10-10l2.1-2.1"></path></svg>
                        Explore Knowledge Graph
                    </a>
                    <a href="${joinPath(baseURL, '/blogs/tags/')}" class="recent-search-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                        Browse All Topics
                    </a>
                </div>
            </div>
        `;
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
        results.slice(0, 20).forEach(res => {
            const item = document.createElement('a');
            item.href = joinPath(baseURL, res.link);
            item.className = 'search-result-item';
            item.innerHTML = `
                <div class="search-result-title">${res.title}</div>
                <div class="search-result-snippet">${res.snippet}</div>
            `;
            const gBtn = document.createElement('div');
            gBtn.className = 'search-graph-btn';
            gBtn.textContent = 'Explore in Graph';
            gBtn.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                const absLink = joinPath(baseURL, res.link);
                if (document.getElementById('graph-canvas')) {
                    window.dispatchEvent(new CustomEvent('kosh:graph-focus', { detail: { link: absLink } }));
                } else {
                    window.location.href = `${joinPath(baseURL, '/graph.html')}?focus=${encodeURIComponent(absLink)}`;
                }
                closeModal();
            };
            item.appendChild(gBtn);
            fragment.appendChild(item);
        });
        searchResults.appendChild(fragment);
    }
})();
