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
