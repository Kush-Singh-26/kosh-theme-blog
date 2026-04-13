/* ascii.js - ASCII hero with glitch effect */
(function () {
    'use strict';

    function initASCII() {
        const el = document.getElementById('ascii-canvas');
        if (!el) return;

        // "KUSH" in a compact block font using ASCII art
        const frames = [
`██╗  ██╗██╗   ██╗███████╗██╗  ██╗
██║ ██╔╝██║   ██║██╔════╝██║  ██║
█████╔╝ ██║   ██║███████╗███████║
██╔═██╗ ██║   ██║╚════██║██╔══██║
██║  ██╗╚██████╔╝███████║██║  ██║
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝`,

`▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ █▄▀ █ █ █▀▀ █  █
█ █ █ ▀▄▀ ▀▀▄ █▀▀█
█▀▀▀▀ █  █ ▀▀▀ █  █
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`,
        ];

        // We'll use a single deterministic frame and add a glitch/dissolve effect
        const text = frames[0];
        const lines = text.split('\n');
        const CHARS = '░▒▓█▄▀╗╝╔╚║═▐▌';

        let glitching = false;
        let originalLines = lines.slice();

        function render(lns) {
            el.textContent = lns.join('\n');
        }

        render(lines);

        // Glitch on hover
        el.addEventListener('mouseenter', () => {
            if (glitching) return;
            glitching = true;
            let iter = 0;
            const maxIter = 18;
            const iv = setInterval(() => {
                const glitched = originalLines.map((line, li) => {
                    const progress = iter / maxIter;
                    return line.split('').map((ch, ci) => {
                        // dissolve from edges inward as iter increases
                        const distFromCenter = Math.abs(ci - line.length / 2) / (line.length / 2);
                        const threshold = 1 - progress;
                        if (distFromCenter > threshold && ch !== ' ') {
                            return CHARS[Math.floor(Math.random() * CHARS.length)];
                        }
                        return ch;
                    }).join('');
                });
                render(glitched);
                iter++;
                if (iter > maxIter) clearInterval(iv);
            }, 35);
        });

        el.addEventListener('mouseleave', () => {
            glitching = false;
            // Reassemble
            let iter = 0;
            const maxIter = 20;
            const iv = setInterval(() => {
                const reassembled = originalLines.map((line) => {
                    const progress = iter / maxIter;
                    return line.split('').map((ch, ci) => {
                        const distFromCenter = Math.abs(ci - line.length / 2) / (line.length / 2);
                        const threshold = progress;
                        if (distFromCenter > threshold && ch !== ' ' && Math.random() > 0.5) {
                            return CHARS[Math.floor(Math.random() * CHARS.length)];
                        }
                        return ch;
                    }).join('');
                });
                render(reassembled);
                iter++;
                if (iter > maxIter) { render(originalLines); glitching = false; clearInterval(iv); }
            }, 30);
        });

        // Ambient micro-glitch every ~7s
        setInterval(() => {
            if (glitching) return;
            const lineIdx = Math.floor(Math.random() * lines.length);
            const orig = originalLines[lineIdx];
            const glitched = orig.split('').map((ch, i) => {
                return Math.random() < 0.06 && ch !== ' ' ? CHARS[Math.floor(Math.random() * CHARS.length)] : ch;
            }).join('');
            const temp = [...originalLines];
            temp[lineIdx] = glitched;
            render(temp);
            setTimeout(() => render(originalLines), 120);
        }, 7000);
    }

    document.addEventListener('DOMContentLoaded', initASCII);
})();
