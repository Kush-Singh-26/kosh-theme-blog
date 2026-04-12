/* scroll.js - Scroll-based features */
document.addEventListener('DOMContentLoaded', () => {

    const fadeObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

    const heroStaggers = document.querySelectorAll('.hero-content .fade-in-stagger');
    heroStaggers.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
    });
    heroStaggers.forEach((el, i) => {
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            el.style.transition = 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)';
        }, 120 * (i + 1));
    });

    const progressBar = document.getElementById('scroll-progress');
    const backToTop   = document.getElementById('back-to-top');
    const sections    = document.querySelectorAll('section[id]');
    const navAnchors  = document.querySelectorAll('.nav-links a');

    let maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.addEventListener('resize', () => {
        maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    }, { passive: true });

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navAnchors.forEach(a => {
                    a.classList.toggle('active', a.getAttribute('href') === '#' + id);
                });
            }
        });
    }, { threshold: 0.3, rootMargin: "-20% 0px -40% 0px" });

    sections.forEach(sec => navObserver.observe(sec));

    let isTicking = false;
    window.addEventListener('scroll', () => {
        if (!isTicking) {
            window.requestAnimationFrame(() => {
                if (progressBar && maxScroll > 0) {
                    const s = window.scrollY;
                    progressBar.style.width = (s / maxScroll * 100) + '%';
                }
                if (backToTop) backToTop.classList.toggle('visible', window.scrollY > window.innerHeight * 0.8);
                
                isTicking = false;
            });
            isTicking = true;
        }
    }, { passive: true });

    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            const t = document.querySelector(a.getAttribute('href'));
            if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    if (backToTop) backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
});
