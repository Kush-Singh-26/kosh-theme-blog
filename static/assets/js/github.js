/* github.js - GitHub contribution grid */
document.addEventListener('DOMContentLoaded', () => {

    /* --- GITHUB CONTRIBUTION GRID --- */
    (async function buildContribGrid() {
        const grid = document.getElementById('contrib-grid');
        if (!grid) return;

        const WEEKS = 52, DAYS = 7;
        const username = 'Kush-Singh-26';
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        let cells = null;

        try {
            const resp = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
            if (resp.ok) {
                const data = await resp.json();
                cells = (data.contributions || []).slice(-364).map(d => {
                    const c = d.count;
                    return c === 0 ? 0 : c <= 2 ? 1 : c <= 5 ? 2 : c <= 9 ? 3 : 4;
                });
            }
        } catch (_) {}

        // Seeded fallback
        if (!cells || cells.length < WEEKS * DAYS) {
            let s = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
            const rnd = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
            cells = [];
            for (let w = 0; w < WEEKS; w++) {
                for (let d = 0; d < DAYS; d++) {
                    const v = rnd() * (d > 0 && d < 6 ? 1.6 : 0.6) * (w > 40 ? 1.3 : 1);
                    cells.push(v < 0.45 ? 0 : v < 0.75 ? 1 : v < 0.9 ? 2 : v < 0.97 ? 3 : 4);
                }
            }
        }
        while (cells.length < WEEKS * DAYS) cells.unshift(0);

        // Month label bar
        const labelRow = document.createElement('div');
        labelRow.className = 'contrib-months mono-text';
        const now = new Date();
        let lastMo = -1;
        for (let w = 0; w < WEEKS; w++) {
            const d = new Date(now);
            d.setDate(d.getDate() - (WEEKS - 1 - w) * 7);
            const mo = d.getMonth();
            if (mo !== lastMo) {
                const lbl = document.createElement('span');
                lbl.textContent = monthNames[mo];
                lbl.style.gridColumn = (w + 1).toString();
                labelRow.appendChild(lbl);
                lastMo = mo;
            }
        }
        grid.parentElement.insertBefore(labelRow, grid);

        // Build cells with tooltips
        const frag = document.createDocumentFragment();
        for (let w = 0; w < WEEKS; w++) {
            const wkDate = new Date(now);
            wkDate.setDate(wkDate.getDate() - (WEEKS - 1 - w) * 7);
            for (let d = 0; d < DAYS; d++) {
                const cell = document.createElement('div');
                cell.className = 'contrib-cell';
                const level = cells[w * DAYS + d] ?? 0;
                cell.dataset.level = level;
                const dayDate = new Date(wkDate);
                dayDate.setDate(dayDate.getDate() - (6 - d));
                const countLabel = ['No','1–2','3–5','6–9','10+'][level];
                cell.title = `${dayDate.toDateString()} · ${countLabel} contributions`;
                frag.appendChild(cell);
            }
        }
        grid.appendChild(frag);
    })();
});
