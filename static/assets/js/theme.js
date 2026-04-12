/* theme.js - Theme toggle */
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isLight = html.getAttribute('data-theme') === 'light';
            if (isLight) {
                html.removeAttribute('data-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                html.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            }
            // Dispatch a custom event so other components (like the globe) can react
            window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: isLight ? 'dark' : 'light' } }));
        });
    }
});
