/* github.js - GitHub & LeetCode contribution grids */
document.addEventListener('DOMContentLoaded', () => {
    const WEEKS = 52, DAYS = 7;
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    function gridStartDate(now, utc) {
        if (utc) {
            const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            startDate.setUTCDate(startDate.getUTCDate() - (WEEKS * 7));
            startDate.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay());
            return startDate;
        }

        const startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - (WEEKS * 7));
        startDate.setDate(startDate.getDate() - startDate.getDay());
        return startDate;
    }

    function renderContribGrid(grid, cells, startDate, utc) {
        const getMonth = utc ? d => d.getUTCMonth() : d => d.getMonth();
        const addDays = utc
            ? (d, n) => d.setUTCDate(d.getUTCDate() + n)
            : (d, n) => d.setDate(d.getDate() + n);

        const labelRow = document.createElement('div');
        labelRow.className = 'contrib-months mono-text';

        let lastMo = -1;
        let lastLabelWeek = -10;

        for (let w = 0; w < WEEKS; w++) {
            const d = new Date(startDate);
            addDays(d, w * 7);
            const mo = getMonth(d);

            if (mo !== lastMo) {
                if ((w - lastLabelWeek) >= 2) {
                    const lbl = document.createElement('span');
                    lbl.textContent = monthNames[mo];
                    lbl.style.gridColumn = (w + 1).toString();
                    labelRow.appendChild(lbl);
                    lastLabelWeek = w;
                }
                lastMo = mo;
            }
        }
        grid.parentElement.insertBefore(labelRow, grid);

        const frag = document.createDocumentFragment();
        for (let w = 0; w < WEEKS; w++) {
            const wkDate = new Date(startDate);
            addDays(wkDate, w * 7);

            for (let d = 0; d < DAYS; d++) {
                const cell = document.createElement('div');
                cell.className = 'contrib-cell';
                const level = cells[w * DAYS + d] ?? 0;
                cell.dataset.level = level;

                const dayDate = new Date(wkDate);
                addDays(dayDate, d);
                const countLabel = ['No','1–2','3–5','6–9','10+'][level];
                const dateLabel = utc
                    ? dayDate.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                    : dayDate.toDateString();
                cell.title = `${dateLabel} · ${countLabel} contributions`;
                frag.appendChild(cell);
            }
        }
        grid.appendChild(frag);
    }

    /* --- GITHUB CONTRIBUTION GRID --- */
    (async function buildContribGrid() {
        const grid = document.getElementById('contrib-grid');
        if (!grid) return;

        const block = grid.closest('.github-contrib');
        const username = 'Kush-Singh-26';

        try {
            const resp = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

            const data = await resp.json();
            const cells = (data.contributions || []).slice(-364).map(d => {
                const c = d.count;
                return c === 0 ? 0 : c <= 2 ? 1 : c <= 5 ? 2 : c <= 9 ? 3 : 4;
            });
            if (cells.length < WEEKS * DAYS) throw new Error('insufficient data');

            renderContribGrid(grid, cells, gridStartDate(new Date(), false), false);
        } catch (_) {
            if (block) block.hidden = true;
        }
    })();

    /* --- LEETCODE CONTRIBUTION GRID --- */
    (async function buildLeetCodeGrid() {
        const grid = document.getElementById('leetcode-grid');
        if (!grid) return;

        const block = grid.closest('.github-contrib');
        const username = 'Kush-Singh-26';

        try {
            const resp = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${username}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

            const data = await resp.json();
            if (!data || !data.submissionCalendar) throw new Error('missing submissionCalendar');

            const calendar = typeof data.submissionCalendar === 'string'
                ? JSON.parse(data.submissionCalendar)
                : data.submissionCalendar;

            const counts = new Map();
            for (const [ts, count] of Object.entries(calendar)) {
                counts.set(Math.floor(Number(ts) / 86400), Number(count));
            }

            const startDate = gridStartDate(new Date(), true);
            const cells = [];
            for (let w = 0; w < WEEKS; w++) {
                for (let d = 0; d < DAYS; d++) {
                    const day = new Date(startDate);
                    day.setUTCDate(day.getUTCDate() + (w * 7) + d);
                    const count = counts.get(Math.floor(day.getTime() / 86400000)) || 0;
                    cells.push(count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 9 ? 3 : 4);
                }
            }

            renderContribGrid(grid, cells, startDate, true);
        } catch (_) {
            if (block) block.hidden = true;
        }
    })();
});
