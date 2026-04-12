/* main.js - Global utilities and footer helpers */
document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const toast = document.getElementById('toast');
    const RSS_FEED_URL = '/rss.xml';

    function showToast(message, duration = 2000) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    }

    // Footer year
    const yearEl = document.getElementById('copyright-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Copy email button
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

    // Terminal time (updates once per minute)
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

    // Blog snippets
    async function loadBlogSnippets() {
        const grid = document.getElementById('blog-snippets-grid');
        if (!grid) return;

        try {
            const res = await fetch(RSS_FEED_URL, { cache: 'no-cache' });
            if (!res.ok) throw new Error('RSS fetch failed');
            const xmlText = await res.text();
            const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
            const items = Array.from(doc.querySelectorAll('item')).slice(0, 3);

            if (!items.length) {
                grid.innerHTML = '<div class="blog-snippet-card is-loading">No posts found.</div>';
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
            window.BLOG_POSTS = cards;
            document.dispatchEvent(new CustomEvent('blog-posts-ready'));

            cards.forEach(cardData => {
                const card = document.createElement('a');
                card.className = 'blog-snippet-card';
                card.href = cardData.link;
                card.target = '_blank';
                card.rel = 'noopener noreferrer';
                card.innerHTML = `
                    <span class="blog-snippet-date mono-text">${cardData.dateLabel}</span>
                    <h3>${cardData.title}</h3>
                    <p>${cardData.excerpt.slice(0, 160)}${cardData.excerpt.length > 160 ? '…' : ''}</p>
                    <span class="blog-snippet-link mono-text">Read →</span>
                `;
                grid.appendChild(card);
            });
        } catch (err) {
            console.error('Failed to load blog snippets:', err);
            grid.innerHTML = '<div class="blog-snippet-card is-loading">Latest posts unavailable.</div>';
        }
    }

    loadBlogSnippets();

});
