(function () {
    function init() {
        // 1. Image Path Fix for GitHub Pages (or sub-directory hosting)
        if (typeof siteBaseURL !== 'undefined' && siteBaseURL && siteBaseURL !== "") {
            document.querySelectorAll('img').forEach(img => {
                const src = img.getAttribute('src');
                if (src && src.startsWith('/') && !src.startsWith(siteBaseURL)) {
                    img.src = siteBaseURL + src;
                }
            });
        }

        // 2. Code Block Setup (Language Badges & Copy Buttons)
        document.querySelectorAll('.code-wrapper').forEach(wrapper => {
            // Language Badge
            const lang = wrapper.getAttribute('data-lang');
            if (lang && lang !== 'text' && !wrapper.querySelector('.code-badge')) {
                const badge = document.createElement('span');
                badge.className = 'code-badge';
                badge.textContent = lang.toUpperCase();
                wrapper.appendChild(badge);
                wrapper.classList.add('has-badge');
            }

            // Copy Button (Event listener handled globally)
            const pre = wrapper.querySelector('pre');
            if (pre && !pre.classList.contains('d2') && !wrapper.querySelector('.copy-btn')) {
                const btn = document.createElement('button');
                btn.className = 'copy-btn';
                btn.textContent = 'Copy';
                wrapper.appendChild(btn);
            }
        });

        // 3. Scroll UI Elements (Progress Bar & Back to Top)
        let progressBar = document.getElementById('progress-bar');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'progress-bar';
            document.body.appendChild(progressBar);
        }

        let backToTopBtn = document.getElementById('back-to-top');
        if (!backToTopBtn) {
            backToTopBtn = document.createElement('button');
            backToTopBtn.id = 'back-to-top';
            backToTopBtn.innerHTML = '↑';
            backToTopBtn.ariaLabel = 'Back to Top';
            document.body.appendChild(backToTopBtn);
        }

        // Consolidated Scroll Listener with requestAnimationFrame for Performance
        if (!window.__scrollInitialized) {
            window.__scrollInitialized = true;
            let ticking = false;
            
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                        
                        // Update Progress Bar
                        if (scrollHeight > 0) {
                            progressBar.style.width = (scrollTop / scrollHeight) * 100 + "%";
                        }
                        
                        // Update Back to Top Visibility
                        if (scrollTop > 300) {
                            backToTopBtn.classList.add('visible');
                        } else {
                            backToTopBtn.classList.remove('visible');
                        }
                        
                        ticking = false;
                    });
                    ticking = true;
                }
            }, { passive: true });
        }

        // 4. Theme Toggle Logic
        const toggleBtn = document.getElementById('theme-toggle');
        const mobileToggleBtn = document.getElementById('theme-toggle-mobile');
        const htmlEl = document.documentElement;

        function toggleTheme() {
            const isLight = htmlEl.getAttribute('data-theme') === 'light';
            if (isLight) {
                htmlEl.removeAttribute('data-theme');
                localStorage.setItem('theme', 'dark');
                window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: 'dark' } }));
            } else {
                htmlEl.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: 'light' } }));
            }
        }

        if (!window.__themeToggleInitialized) {
            window.__themeToggleInitialized = true;
            if (toggleBtn) toggleBtn.addEventListener('click', toggleTheme);
            if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', toggleTheme);
        }

        // 5. Mobile Menu Logic
        const menuToggle = document.getElementById('menu-toggle');
        const menuClose = document.getElementById('menu-close');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');

        function openMobileMenu() {
            if (!mobileMenu || !mobileMenuBackdrop) return;
            mobileMenu.classList.add('open');
            mobileMenuBackdrop.classList.add('open');
            mobileMenu.setAttribute('aria-hidden', 'false');
            menuToggle?.setAttribute('aria-expanded', 'true');
            document.body.classList.add('menu-open');
        }

        function closeMobileMenu() {
            if (!mobileMenu || !mobileMenuBackdrop) return;
            mobileMenu.classList.remove('open');
            mobileMenuBackdrop.classList.remove('open');
            mobileMenu.setAttribute('aria-hidden', 'true');
            menuToggle?.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
        }

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                mobileMenu.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
            });
        }
        if (menuClose) menuClose.addEventListener('click', closeMobileMenu);
        if (mobileMenuBackdrop) mobileMenuBackdrop.addEventListener('click', closeMobileMenu);

        const mobileSearchBtn = document.getElementById('search-btn-mobile');
        if (mobileSearchBtn) {
            mobileSearchBtn.addEventListener('click', () => {
                const searchModal = document.getElementById('search-modal');
                const searchInput = document.getElementById('search-input');
                if (searchModal) {
                    searchModal.style.display = 'flex';
                    if (searchInput) searchInput.focus();
                }
            });
        }

        // 6. Universal Lightbox
        let lightbox = document.getElementById('lightbox');
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'lightbox';
            lightbox.innerHTML = `
                <div class="lightbox-content">
                    <img src="" alt="Expanded image" style="display: none;">
                    <div class="lightbox-svg-container" style="display: none;"></div>
                </div>
            `;
            document.body.appendChild(lightbox);
        }

        const lightboxImg = lightbox.querySelector('img');
        const lightboxSvgContainer = lightbox.querySelector('.lightbox-svg-container');

        function openLightbox(type, content) {
            if (type === 'img') {
                lightboxImg.src = content;
                lightboxImg.style.display = 'block';
                lightboxSvgContainer.style.display = 'none';
            } else if (type === 'svg') {
                lightboxSvgContainer.innerHTML = content;
                lightboxImg.style.display = 'none';
                lightboxSvgContainer.style.display = 'block';
                
                const svg = lightboxSvgContainer.querySelector('svg');
                if (svg) {
                    svg.removeAttribute('width');
                    svg.removeAttribute('height');
                    svg.setAttribute('width', '100%');
                    svg.setAttribute('height', '100%');
                    svg.style.display = 'block';
                }
            }
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => {
                if (!lightbox.classList.contains('active')) {
                    lightboxImg.src = '';
                    lightboxSvgContainer.innerHTML = '';
                }
            }, 300);
        }

        // 7. Global Event Delegation (Clicks & Keys)
        if (!window.__globalEventsInitialized) {
            window.__globalEventsInitialized = true;
            
            document.body.addEventListener('click', (e) => {
                // Handle Lightbox BG Click
                if (e.target.id === 'lightbox' || e.target.classList.contains('lightbox-content')) {
                    closeLightbox();
                    return;
                }

                // Handle Image Click
                const img = e.target.closest('article img, .content-body img');
                if (img && !img.closest('a') && !img.classList.contains('site-logo')) {
                    openLightbox('img', img.src);
                    return;
                }

                // Handle D2 SVG Click
                const d2Container = e.target.closest('.d2-container');
                if (d2Container) {
                    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
                    const selector = isLight ? '.d2-light svg' : '.d2-dark svg';
                    const activeSvg = d2Container.querySelector(selector);
                    if (activeSvg) openLightbox('svg', activeSvg.outerHTML);
                    return;
                }

                // Handle Copy Button Click
                const copyBtn = e.target.closest('.copy-btn');
                if (copyBtn) {
                    const wrapper = copyBtn.closest('.code-wrapper');
                    const code = wrapper ? wrapper.querySelector('code') : null;
                    if (code) {
                        navigator.clipboard.writeText(code.textContent.trimEnd()).then(() => {
                            copyBtn.textContent = 'Copied!';
                            copyBtn.classList.add('copied');
                            setTimeout(() => {
                                copyBtn.textContent = 'Copy';
                                copyBtn.classList.remove('copied');
                            }, 2000);
                        }).catch(err => console.error('Failed to copy:', err));
                    }
                    return;
                }

                // Handle Mobile Nav Link Click
                if (e.target.closest('.mobile-nav-link')) {
                    closeMobileMenu();
                }

                // Handle Back to Top Click
                if (e.target.closest('#back-to-top')) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (lightbox && lightbox.classList.contains('active')) closeLightbox();
                    if (mobileMenu && mobileMenu.classList.contains('open')) closeMobileMenu();
                }
            });
        }

        // 8. Table of Contents ScrollSpy
        const tocLinks = document.querySelectorAll('.toc-container a');
        const sections = document.querySelectorAll('article h1, article h2, article h3, article h4, article h5, article h6');

        if (tocLinks.length > 0 && sections.length > 0) {
            const observerOptions = {
                root: null,
                rootMargin: '0px 0px -80% 0px',
                threshold: 0
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id;
                        if (id) {
                            tocLinks.forEach(link => {
                                link.classList.remove('active');
                                if (link.getAttribute('href') === `#${id}`) {
                                    link.classList.add('active');
                                    const tocNav = link.closest('nav');
                                    if (tocNav) {
                                        const navRect = tocNav.getBoundingClientRect();
                                        const linkRect = link.getBoundingClientRect();
                                        if (linkRect.top < navRect.top || linkRect.bottom > navRect.bottom) {
                                            link.scrollIntoView({ block: 'center', behavior: 'smooth' });
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            }, observerOptions);

            sections.forEach(section => observer.observe(section));
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
