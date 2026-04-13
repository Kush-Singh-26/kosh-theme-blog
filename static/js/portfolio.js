/* portfolio.js - Consolidated Portfolio Features */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Section Reveal Animations (Intersection Observer)
    const fadeObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

    // 2. Blog Snippets Fetcher (from RSS)
    async function loadBlogSnippets() {
        const grid = document.getElementById('blog-snippets-grid');
        if (!grid) return;

        try {
            const res = await fetch('/rss.xml', { cache: 'no-cache' });
            if (!res.ok) throw new Error('RSS fetch failed');
            const xmlText = await res.text();
            const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
            const items = Array.from(doc.querySelectorAll('item')).slice(0, 3);

            if (!items.length) {
                grid.innerHTML = '<div class="blog-snippet-card is-loading">No posts found.</div>';
                return;
            }

            grid.innerHTML = '';

            items.forEach(item => {
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

                const card = document.createElement('a');
                card.className = 'blog-snippet-card';
                card.href = link;
                card.target = '_blank';
                card.rel = 'noopener noreferrer';
                card.innerHTML = `
                    <span class="blog-snippet-date mono-text">${dateLabel}</span>
                    <h3>${title}</h3>
                    <p>${excerpt.slice(0, 140)}${excerpt.length > 140 ? '…' : ''}</p>
                    <span class="blog-snippet-link mono-text">Read →</span>
                `;
                grid.appendChild(card);
            });
        } catch (err) {
            console.error('Failed to load blog snippets:', err);
            grid.innerHTML = '<div class="blog-snippet-card">Latest posts unavailable.</div>';
        }
    }

    loadBlogSnippets();

    // 3. Tokenizer Hero Interaction
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

    // 4. Copy Email Functionality
    const copyEmailBtn = document.getElementById('copy-email');
    if (copyEmailBtn) {
        copyEmailBtn.addEventListener('click', async () => {
            const email = 'kush26cs@gmail.com'; // Fallback to hardcoded for simplicity
            try {
                await navigator.clipboard.writeText(email);
                const originalContent = copyEmailBtn.innerHTML;
                copyEmailBtn.textContent = 'Copied!';
                copyEmailBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyEmailBtn.innerHTML = originalContent;
                    copyEmailBtn.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy email:', err);
            }
        });
    }

    // 4. Smooth scroll for anchor links
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
