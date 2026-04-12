/* cmd-palette.js - Command palette */
(function () {
    'use strict';

    function showToast(msg, duration = 2200) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.classList.remove('show'), duration);
    }

    function initCommandPalette() {
        const overlay = document.getElementById('cmd-overlay');
        if (!overlay) return;

        const input   = document.getElementById('cmd-input');
        const results = document.getElementById('cmd-results');

        let ALL_ITEMS = [
            // Navigation
            { group: 'Navigate', icon: '⌂', title: 'Home', desc: 'Scroll to top', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
            { group: 'Navigate', icon: '◈', title: 'About', desc: '#about section', action: () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) },
            { group: 'Navigate', icon: '◈', title: 'Projects', desc: '#projects section', action: () => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }) },
            { group: 'Navigate', icon: '◈', title: 'Skills', desc: '#skills section', action: () => document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth' }) },
            { group: 'Navigate', icon: '◈', title: 'Timeline', desc: '#education section', action: () => document.getElementById('education')?.scrollIntoView({ behavior: 'smooth' }) },
            { group: 'Navigate', icon: '◈', title: 'Contact', desc: '#contact section', action: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) },
            // Actions
            { group: 'Actions', icon: '↓', title: 'Download Resume', desc: 'Open resume.pdf', action: () => window.open('./resume.pdf', '_blank') },
            { group: 'Actions', icon: '@', title: 'Send Email', desc: 'kushsingh2604@gmail.com', action: () => window.open('mailto:kushsingh2604@gmail.com') },
            { group: 'Actions', icon: '☀', title: 'Toggle Theme', desc: 'Switch dark/light mode', action: () => document.getElementById('theme-toggle')?.click() },
            { group: 'Actions', icon: '✎', title: 'Copy Email', desc: 'Copy to clipboard', action: () => { navigator.clipboard.writeText('kushsingh2604@gmail.com'); showToast('// email copied to clipboard'); } },
            // Projects
            { group: 'Projects', icon: '▸', title: 'Inference Engine', desc: 'C++ · SIMD/AVX2 · KV-Cache', action: () => window.open('https://github.com/Kush-Singh-26/Inference_Engine', '_blank') },
            { group: 'Projects', icon: '▸', title: 'Mental Health ChatBot', desc: 'Llama 3 8B · PEFT/LoRA', action: () => window.open('https://huggingface.co/Kush26/Mental_Health_ChatBot', '_blank') },
            { group: 'Projects', icon: '▸', title: 'Transformer Translate', desc: 'BLEU 23.64 · En→Hi', action: () => window.open('https://github.com/Kush-Singh-26/Transformer_Translate', '_blank') },
            { group: 'Projects', icon: '▸', title: 'Kosh SSG', desc: 'Golang · Markdown · KaTeX', action: () => window.open('https://github.com/Kush-Singh-26/blogs', '_blank') },
            { group: 'Projects', icon: '▸', title: 'Image Captioning', desc: 'CNN + LSTM · HuggingFace', action: () => window.open('https://github.com/Kush-Singh-26/Image_Caption', '_blank') },
            // Links
            { group: 'Links', icon: '⎋', title: 'GitHub', desc: 'github.com/Kush-Singh-26', action: () => window.open('https://github.com/Kush-Singh-26', '_blank') },
            { group: 'Links', icon: '⎋', title: 'LinkedIn', desc: 'linkedin.com/in/kush-singh-2b2440280', action: () => window.open('https://www.linkedin.com/in/kush-singh-2b2440280', '_blank') },
            { group: 'Links', icon: '⎋', title: 'Blog', desc: 'kush-singh-26.github.io/blogs', action: () => window.open('https://kush-singh-26.github.io/blogs/', '_blank') },
            { group: 'Links', icon: '⎋', title: 'HuggingFace', desc: 'huggingface.co/Kush26', action: () => window.open('https://huggingface.co/Kush26', '_blank') },
        ];

        document.addEventListener('blog-posts-ready', () => {
            if (window.BLOG_POSTS) {
                const blogItems = window.BLOG_POSTS.map(p => ({
                    group: 'Blog Posts',
                    icon: '✎',
                    title: p.title,
                    desc: p.excerpt.slice(0, 50) + '...',
                    action: () => window.open(p.link, '_blank')
                }));
                ALL_ITEMS = [...ALL_ITEMS, ...blogItems];
            }
        });

        let selectedIdx = 0;
        let filtered = ALL_ITEMS;

        function open() {
            overlay.classList.add('open');
            input.value = '';
            render('');
            input.focus();
        }

        function close() {
            overlay.classList.remove('open');
        }

        function render(query) {
            const q = query.toLowerCase().trim();
            filtered = q ? ALL_ITEMS.filter(item =>
                item.title.toLowerCase().includes(q) ||
                item.desc.toLowerCase().includes(q) ||
                item.group.toLowerCase().includes(q)
            ) : ALL_ITEMS;

            selectedIdx = 0;
            results.innerHTML = '';

            if (!filtered.length) {
                results.innerHTML = '<div class="cmd-no-results">// no results found</div>';
                return;
            }

            // Group items
            const groups = {};
            filtered.forEach(item => {
                if (!groups[item.group]) groups[item.group] = [];
                groups[item.group].push(item);
            });

            Object.entries(groups).forEach(([gName, items]) => {
                const label = document.createElement('div');
                label.className = 'cmd-group-label';
                label.textContent = gName;
                results.appendChild(label);

                items.forEach((item) => {
                    const idx = filtered.indexOf(item);
                    const el = document.createElement('div');
                    el.className = 'cmd-item' + (idx === 0 ? ' selected' : '');
                    el.innerHTML = `
                        <div class="cmd-item-icon">${item.icon}</div>
                        <div class="cmd-item-text">
                            <span class="cmd-item-title">${item.title}</span>
                            <span class="cmd-item-desc">${item.desc}</span>
                        </div>
                        <span class="cmd-item-arrow">↵</span>
                    `;
                    el.addEventListener('click', () => { item.action(); close(); });
                    el.addEventListener('mouseenter', () => {
                        selectedIdx = idx;
                        updateSelected();
                    });
                    results.appendChild(el);
                });
            });
        }

        function updateSelected() {
            results.querySelectorAll('.cmd-item').forEach((el, i) => {
                el.classList.toggle('selected', i === selectedIdx);
                if (i === selectedIdx) el.scrollIntoView({ block: 'nearest' });
            });
        }

        function executeSelected() {
            if (filtered[selectedIdx]) {
                filtered[selectedIdx].action();
                close();
            }
        }

        input.addEventListener('input', () => render(input.value));

        document.addEventListener('keydown', (e) => {
            const isOpen = overlay.classList.contains('open');

            // Open: Cmd+K or Ctrl+K
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                isOpen ? close() : open();
                return;
            }

            if (!isOpen) return;

            if (e.key === 'Escape') { close(); return; }
            if (e.key === 'Enter') { e.preventDefault(); executeSelected(); return; }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIdx = Math.min(selectedIdx + 1, filtered.length - 1);
                updateSelected();
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIdx = Math.max(selectedIdx - 1, 0);
                updateSelected();
            }
        });

        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        // Wire up trigger hints
        document.querySelectorAll('.cmd-trigger').forEach(el => {
            el.addEventListener('click', open);
        });
    }

    document.addEventListener('DOMContentLoaded', initCommandPalette);
})();
