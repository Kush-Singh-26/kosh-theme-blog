/* cards.js - Card spotlight, mobile card expand */
document.addEventListener('DOMContentLoaded', () => {

    /* --- CARD SPOTLIGHT --- */
    document.querySelectorAll('.card-spotlight').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', (e.clientX - r.left) + 'px');
            card.style.setProperty('--mouse-y', (e.clientY - r.top) + 'px');
        });
    });

    /* --- MOBILE CARD EXPAND --- */
    if (window.innerWidth <= 768) {
        document.querySelectorAll('.bento-card').forEach(card => {
            const content = card.querySelector('.card-content');
            if (!content) return;
            const body = document.createElement('div');
            body.className = 'bento-card-body';
            content.querySelectorAll('p, .stack-tags, .link-group, .card-link').forEach(el => body.appendChild(el));
            content.appendChild(body);
            const hint = document.createElement('div');
            hint.className = 'card-expand-hint';
            hint.innerHTML = 'tap to expand <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
            content.appendChild(hint);
            card.addEventListener('click', () => card.classList.toggle('expanded'));
        });
    }
});
