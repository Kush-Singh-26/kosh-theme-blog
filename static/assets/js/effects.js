/* effects.js - UI effects */
document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

    const cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow) {
        if (!finePointer || prefersReducedMotion) {
            cursorGlow.style.display = 'none';
        } else {
            let mX = window.innerWidth / 2, mY = window.innerHeight / 2;
            let gX = mX, gY = mY;
            (function loop() {
                gX += (mX - gX) * 0.08;
                gY += (mY - gY) * 0.08;
                cursorGlow.style.transform = `translate(${gX}px, ${gY}px) translate(-50%, -50%)`;
                requestAnimationFrame(loop);
            })();
            document.addEventListener('pointermove', e => { mX = e.clientX; mY = e.clientY; }, { passive: true });
            document.addEventListener('pointerdown', e => {
                const r = document.createElement('div');
                r.className = 'cursor-ripple';
                r.style.left = e.clientX + 'px';
                r.style.top  = e.clientY + 'px';
                document.body.appendChild(r);
                setTimeout(() => r.remove(), 600);
            }, { passive: true });
        }
    }

    const identityEl = document.querySelector('.hero-identity');
    if (identityEl) {
        const text = identityEl.innerText;
        identityEl.innerHTML = '<span class="typed-text"></span><span class="typing-cursor"></span>';
        const span = identityEl.querySelector('.typed-text');
        let i = 0;
        function type() {
            if (i < text.length) { span.textContent += text[i++]; setTimeout(type, 45 + Math.random() * 55); }
        }
        setTimeout(type, 1000);
    }

    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    function scramble(el) {
        const orig = el.dataset.value || el.innerText;
        el.dataset.value = orig;
        let iter = 0;
        clearInterval(el._sc);
        el._sc = setInterval(() => {
            el.innerText = orig.split('').map((ch, idx) =>
                idx < iter ? orig[idx] : ch === ' ' ? ' ' : CHARS[Math.floor(Math.random() * 26)]
            ).join('');
            if (iter >= orig.length) clearInterval(el._sc);
            iter += 1 / 3;
        }, 28);
    }
    const scrambleObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { scramble(e.target); scrambleObs.unobserve(e.target); } });
    }, { threshold: 0.8 });
    document.querySelectorAll('.section-label').forEach(el => scrambleObs.observe(el));

    document.querySelectorAll('.nav-links a, .social-item').forEach(link => {
        link.addEventListener('mouseenter', () => {
            const orig = link.dataset.value || link.innerText;
            if (!link.dataset.value) link.dataset.value = orig;
            let iter = 0;
            clearInterval(link._gl);
            link._gl = setInterval(() => {
                link.innerText = orig.split('').map((ch, idx) =>
                    idx < iter ? orig[idx] : ch === ' ' ? ' ' : CHARS[Math.floor(Math.random() * 26)]
                ).join('');
                if (iter >= orig.length) clearInterval(link._gl);
                iter += 1 / 2;
            }, 28);
        });
    });

    if (finePointer && !prefersReducedMotion) {
        document.querySelectorAll('.nav-links a, .social-item, .nav-cta, .link-arrow').forEach(el => {
            el.addEventListener('pointermove', e => {
                const r = el.getBoundingClientRect();
                el.style.transform = `translate(${(e.clientX - r.left - r.width/2) * 0.3}px,${(e.clientY - r.top - r.height/2) * 0.3}px) scale(1.04)`;
                el.style.transition = 'transform 0.08s cubic-bezier(0.2,0.8,0.2,1)';
            }, { passive: true });
            el.addEventListener('pointerleave', () => {
                el.style.transform = '';
                el.style.transition = 'transform 0.4s cubic-bezier(0.2,0.8,0.2,1)';
            }, { passive: true });
        });
    }

    const orbs = document.querySelectorAll('.ambient-orb');
    if (orbs.length && finePointer && !prefersReducedMotion) {
        document.addEventListener('pointermove', e => {
            const x = e.clientX / window.innerWidth - 0.5;
            const y = e.clientY / window.innerHeight - 0.5;
            orbs.forEach((orb, i) => {
                orb.style.transform = `translate(${x * (i === 0 ? 50 : -70)}px,${y * (i === 0 ? 50 : -70)}px)`;
            });
        }, { passive: true });
    }
});
