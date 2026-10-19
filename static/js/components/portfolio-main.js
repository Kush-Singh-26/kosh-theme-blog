/* portfolio-main.js - Unified Portfolio Features */
document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const toast = document.getElementById('toast');
    const RSS_FEED_URL = '/rss.xml';

    // 1. Toast notifications
    function showToast(message, duration = 2000) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    }

    // 2. Section Reveal Animations (Intersection Observer)
    const fadeObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

    // 3. Footer year
    const yearEl = document.getElementById('copyright-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // 4. Copy email button
    const copyEmailBtn = document.getElementById('copy-email');
    const copyIcon = document.getElementById('copy-icon');
    const checkIcon = document.getElementById('check-icon');
    if (copyEmailBtn) {
        copyEmailBtn.addEventListener('click', async () => {
            const email = 'kush26cs@gmail.com';
            try {
                await navigator.clipboard.writeText(email);
                if (copyIcon) copyIcon.style.display = 'none';
                if (checkIcon) checkIcon.style.display = 'block';
                copyEmailBtn.classList.add('copied');
                showToast('Email copied to clipboard');
                setTimeout(() => {
                    if (copyIcon) copyIcon.style.display = 'block';
                    if (checkIcon) checkIcon.style.display = 'none';
                    copyEmailBtn.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy email:', err);
                showToast('Copy failed - try again');
            }
        });
    }

    // 5. Content snippets fetcher (enhances server-rendered content via RSS)
    async function loadContentSnippets() {
        const grid = document.getElementById('content-snippets-grid');
        if (!grid) return;

        // Skip if server already rendered 3 real cards (no "Loading" placeholder)
        const serverRendered = grid.querySelectorAll('.content-snippet-card:not(.is-loading)');
        if (serverRendered.length >= 3) return;

        try {
            const res = await fetch(RSS_FEED_URL, { cache: 'no-cache' });
            if (!res.ok) throw new Error('RSS fetch failed');
            const xmlText = await res.text();
            const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
            const items = Array.from(doc.querySelectorAll('item')).slice(0, 3);

            if (!items.length) return;

            grid.innerHTML = '';

            items.forEach(item => {
                const title = item.querySelector('title')?.textContent?.trim() || 'Untitled';
                const link = item.querySelector('link')?.textContent?.trim() || '#';
                const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
                const rawDescription = item.querySelector('description')?.textContent || '';

                const date = pubDate ? new Date(pubDate) : null;
                const dateLabel = date && !Number.isNaN(date.getTime())
                    ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : '';

                // Strip HTML tags and normalize whitespace
                const excerpt = rawDescription
                    .replace(/<[^>]*>/g, '')
                    .replace(/&[a-z]+;/gi, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 160);

                const card = document.createElement('a');
                card.className = 'content-snippet-card';
                card.href = link;
                card.target = '_blank';
                card.rel = 'noopener noreferrer';
                card.innerHTML = `
                    <span class="content-snippet-kicker mono-text">Latest note</span>
                    <h3 class="content-snippet-title">${title}</h3>
                    <p class="content-snippet-excerpt">${excerpt}${excerpt.length >= 160 ? '\u2026' : ''}</p>
                    <div class="content-snippet-footer">
                        <span class="content-snippet-date mono-text">${dateLabel}</span>
                        <span class="content-snippet-link mono-text">Read \u2192</span>
                    </div>
                `;
                grid.appendChild(card);
            });
        } catch (err) {
            console.error('Failed to load content snippets:', err);
        }
    }

    loadContentSnippets();

    // 6. Tokenizer Hero Interaction
    function initTokenizer() {
        const headline = document.querySelector('.headline');
        if (!headline) return;

        const tokenSpecs = [
            {
                selector: '.breathe-word',
                tokens: [
                    { text: 'K', id: 42 },
                    { text: 'ernels', id: 184174 }
                ]
            },
            {
                selector: '.headline-amp',
                tokens: [
                    { text: '&', id: 827 }
                ]
            },
            {
                selector: '.accent-text',
                tokens: [
                    { text: 'T', id: 353 },
                    { text: 'ensors', id: 40797 }
                ]
            }
        ];

        tokenSpecs.forEach(spec => {
            const container = headline.querySelector(spec.selector);
            if (!container) return;

            container.textContent = '';

            spec.tokens.forEach(tokenData => {
                const wrapper = document.createElement('span');
                wrapper.className = 'tokenizer-wrapper';
                wrapper.setAttribute('aria-hidden', 'true');

                const idDisplay = document.createElement('span');
                idDisplay.className = 'token-id-display';
                idDisplay.textContent = `[${tokenData.id}]`;
                wrapper.appendChild(idDisplay);

                tokenData.text.split('').forEach(char => {
                    const span = document.createElement('span');
                    span.className = 'token-char';
                    span.textContent = char;

                    const tx = (Math.random() - 0.5) * 60;
                    const ty = (Math.random() - 0.5) * 40;
                    const rot = (Math.random() - 0.5) * 30;

                    span.style.setProperty('--tx', `${tx}px`);
                    span.style.setProperty('--ty', `${ty}px`);
                    span.style.setProperty('--rot', `${rot}deg`);

                    wrapper.appendChild(span);
                });

                wrapper.addEventListener('mouseenter', () => {
                    wrapper.classList.remove('settling');
                    wrapper.classList.add('scattered');
                });

                wrapper.addEventListener('mouseleave', () => {
                    wrapper.classList.remove('scattered');
                    wrapper.classList.add('settling');
                    setTimeout(() => wrapper.classList.remove('settling'), 600);
                });

                container.appendChild(wrapper);
            });
        });
    }

    initTokenizer();

    // 7. Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});
