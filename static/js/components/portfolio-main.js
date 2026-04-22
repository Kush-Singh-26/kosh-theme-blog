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

    // 5. Terminal time (updates once per minute)
    function updateTermTime() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const el = document.getElementById('term-time');
        if (el) el.textContent = h + ':' + m;
    }

    function scheduleTermTime() {
        const now = new Date();
        const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 30;
        setTimeout(() => {
            updateTermTime();
            scheduleTermTime();
        }, msToNextMinute);
    }

    updateTermTime();
    scheduleTermTime();

    // 6. Content snippets fetcher (from RSS)
    async function loadContentSnippets() {
        const grid = document.getElementById('content-snippets-grid');
        if (!grid) return;

        try {
            const res = await fetch(RSS_FEED_URL, { cache: 'no-cache' });
            if (!res.ok) throw new Error('RSS fetch failed');
            const xmlText = await res.text();
            const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
            const items = Array.from(doc.querySelectorAll('item')).slice(0, 3);

            if (!items.length) {
                grid.innerHTML = '<div class="content-snippet-card is-loading">No items found.</div>';
                return;
            }

            grid.innerHTML = '';

            const cards = items.map(item => {
                const title = item.querySelector('title')?.textContent?.trim() || 'Untitled';
                const link = item.querySelector('link')?.textContent?.trim() || '#';
                const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
                const description = item.querySelector('description')?.textContent || '';

                const date = pubDate ? new Date(pubDate) : null;
                const dateLabel = date && !Number.isNaN(date.getTime())
                    ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : '';

                const tmp = document.createElement('div');
                tmp.innerHTML = description;
                const excerpt = (tmp.textContent || '').replace(/\s+/g, ' ').trim();

                return { title, link, dateLabel, excerpt };
            });

            // Store for Command Palette search
            window.CONTENT_ITEMS = cards;
            document.dispatchEvent(new CustomEvent('content-items-ready'));

            cards.forEach(cardData => {
                const card = document.createElement('a');
                card.className = 'content-snippet-card';
                card.href = cardData.link;
                card.target = '_blank';
                card.rel = 'noopener noreferrer';
                card.innerHTML = `
                    <span class="content-snippet-date mono-text">${cardData.dateLabel}</span>
                    <h3>${cardData.title}</h3>
                    <p>${cardData.excerpt.slice(0, 160)}${cardData.excerpt.length > 160 ? '…' : ''}</p>
                    <span class="content-snippet-link mono-text">Read →</span>
                `;
                grid.appendChild(card);
            });
        } catch (err) {
            console.error('Failed to load content snippets:', err);
            grid.innerHTML = '<div class="content-snippet-card is-loading">Latest items unavailable.</div>';
        }
    }

    loadContentSnippets();

    // 7. Tokenizer Hero Interaction
    function initTokenizer() {
        const headline = document.querySelector('.headline');
        if (!headline) return;

        const tokenSpecs = [
            {
                selector: '.breathe-word',
                tokens: [
                    { text: 'b', id: 65 },
                    { text: 'eyond', id: 23478 },
                    { text: '.', id: 13 }
                ]
            },
            {
                selector: '.accent-text',
                tokens: [
                    { text: 'binary', id: 8026 },
                    { text: '.', id: 13 }
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

                const chars = tokenData.text.split('');
                chars.forEach((char, i) => {
                    const span = document.createElement('span');
                    span.className = 'token-char';
                    span.textContent = char;
                    
                    // Pre-calculate scatter offsets
                    const tx = (Math.random() - 0.5) * 60;
                    const ty = (Math.random() - 0.5) * 40;
                    const rot = (Math.random() - 0.5) * 30;
                    
                    span.style.setProperty('--tx', `${tx}px`);
                    span.style.setProperty('--ty', `${ty}px`);
                    span.style.setProperty('--rot', `${rot}deg`);
                    
                    wrapper.appendChild(span);
                });

                // Enable movement and ID display for all tokens
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

    // 8. Smooth scroll for anchor links
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
