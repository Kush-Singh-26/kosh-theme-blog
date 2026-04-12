/* visual2.js - Visual Enhancements */
(function () {
    'use strict';

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    /* Variable Font Breathing */
    function initVariableFont() {
        const headline = document.querySelector('.headline');
        if (!headline) return;
        const walker = document.createTreeWalker(headline, NodeFilter.SHOW_TEXT);
        const textNode = walker.nextNode();
        if (!textNode || !textNode.textContent.trim()) return;
        const wrap = document.createElement('span');
        wrap.className = 'breathe-word';
        textNode.replaceWith(wrap);
        wrap.appendChild(textNode);
    }

    function initSplitText() {}

    /* Scanline CRT Overlay */
    function initScanlines() {
        const el = document.createElement('div');
        el.className = 'scanline-overlay';
        el.setAttribute('aria-hidden', 'true');
        document.body.appendChild(el);
    }

    function initDepthFog() {}

    /* Progress-Driven Circuit Drawing */
    function initProgressCircuit() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'progress-circuit';
        svg.setAttribute('viewBox', '0 0 40 300');
        svg.setAttribute('aria-hidden', 'true');

        svg.innerHTML = `
            <defs>
                <marker id="arrowhead" markerWidth="6" markerHeight="6"
                    refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="rgba(201,168,108,0.6)"/>
                </marker>
            </defs>
            <path id="circuit-path" d="
                M 20 10
                L 20 50
                L 10 60
                L 10 80
                L 30 90
                L 30 110
                L 20 120
                L 20 140
                L 8 150
                L 8 170
                L 32 180
                L 32 200
                L 20 210
                L 20 230
                L 14 240
                L 14 260
                L 20 270
                L 20 290
            "/>
            <circle class="circuit-node" cx="20" cy="10"  r="3"/>
            <circle class="circuit-node" cx="10" cy="70"  r="2.5"/>
            <circle class="circuit-node" cx="30" cy="100" r="2.5"/>
            <circle class="circuit-node" cx="8"  cy="160" r="2.5"/>
            <circle class="circuit-node" cx="32" cy="190" r="2.5"/>
            <circle class="circuit-node" cx="14" cy="250" r="2.5"/>
            <circle class="circuit-node" cx="20" cy="290" r="3"/>
        `;
        document.body.appendChild(svg);

        const pathEl  = svg.querySelector('#circuit-path');
        const nodes   = svg.querySelectorAll('.circuit-node');
        const totalLen = pathEl.getTotalLength();

        pathEl.style.strokeDasharray  = totalLen;
        pathEl.style.strokeDashoffset = totalLen;

        let maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        window.addEventListener('resize', () => {
            maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        }, { passive: true });

        function update() {
            if (maxScroll <= 0) return;
            const scrolled = window.scrollY;
            const progress = Math.min(scrolled / maxScroll, 1);

            const offset = totalLen * (1 - progress);
            pathEl.style.strokeDashoffset = offset;

            nodes.forEach((node, i) => {
                const threshold = i / (nodes.length - 1);
                node.classList.toggle('lit', progress >= threshold - 0.02);
            });
        }

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    update();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        update();
    }

    /* Loss Landscape Visualization */
    function buildLossLandscape() {
        const container = document.querySelector('.loss-landscape');
        if (!container) return;

        const canvas = container.querySelector('.loss-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        
        // High-DPI Resolution Support
        const dpr = window.devicePixelRatio || 1;
        const W = 720;
        const H = 460;
        
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        ctx.scale(dpr, dpr);

        // Increased mesh density for smoother manifold
        const cols = 56, rows = 36;
        const spacingX = 480 / cols; 
        const spacingY = 192 / rows;
        const startX = 60;
        const startY = 180;
        const skew = 0.5;

        // --- NEW: Performance Buffers ---
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d');
        const zCache = new Float32Array(cols * rows);
        let gridNeedsBake = true;

        let currentBlobs = [];
        let nextBlobs = [];
        let morphAlpha = 1;
        let agent = { x: 0, y: 0, vx: 0, vy: 0, path: [], converged: false };
        let resetTimer = 0;
        let isMorphing = false;
        let animationId = null;

        function generateBlobs() {
            const blobs = [];
            blobs.push({
                cx: 0.3 + Math.random() * 0.4,
                cy: 0.3 + Math.random() * 0.4,
                amp: -70 - Math.random() * 50,
                sigma: 0.18 + Math.random() * 0.08
            });
            for (let i = 0; i < 7; i++) {
                blobs.push({
                    cx: Math.random(),
                    cy: Math.random(),
                    amp: (Math.random() - 0.35) * 100,
                    sigma: 0.08 + Math.random() * 0.15
                });
            }
            return blobs;
        }

        function bakeGrid() {
            offscreenCanvas.width = canvas.width;
            offscreenCanvas.height = canvas.height;
            offscreenCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const colors = getThemeColors();
            offscreenCtx.lineWidth = 1.0;
            offscreenCtx.lineJoin = 'round';
            offscreenCtx.lineCap = 'round';

            // Cache all Z values first
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    zCache[r * cols + c] = getZ(c / (cols - 1), r / (rows - 1));
                }
            }

            // Draw Y lines
            for (let r = 0; r < rows; r++) {
                offscreenCtx.beginPath();
                for (let c = 0; c < cols; c++) {
                    const nx = c / (cols - 1), ny = r / (rows - 1);
                    const z = zCache[r * cols + c];
                    const p = project(nx, ny, z);
                    const op = Math.max(0.04, Math.min(0.35, 0.15 + (z / 300)));
                    offscreenCtx.strokeStyle = colors.strokeColor.replace(/[\d\.]+\)$/, op + ')');
                    if (c === 0) offscreenCtx.moveTo(p.x, p.y);
                    else offscreenCtx.lineTo(p.x, p.y);
                }
                offscreenCtx.stroke();
            }

            // Draw X lines
            for (let c = 0; c < cols; c++) {
                offscreenCtx.beginPath();
                for (let r = 0; r < rows; r++) {
                    const nx = c / (cols - 1), ny = r / (rows - 1);
                    const z = zCache[r * cols + c];
                    const p = project(nx, ny, z);
                    const op = Math.max(0.04, Math.min(0.35, 0.15 + (z / 300)));
                    offscreenCtx.strokeStyle = colors.strokeColor.replace(/[\d\.]+\)$/, op + ')');
                    if (r === 0) offscreenCtx.moveTo(p.x, p.y);
                    else offscreenCtx.lineTo(p.x, p.y);
                }
                offscreenCtx.stroke();
            }
            gridNeedsBake = false;
        }

        function initLandscape() {
            if (currentBlobs.length === 0) {
                currentBlobs = generateBlobs();
                nextBlobs = generateBlobs();
                morphAlpha = 1;
                resetAgent();
            } else {
                isMorphing = true;
                morphAlpha = 0;
                nextBlobs = generateBlobs();
                agent.path = [];
                resetTimer = 0;
            }
            gridNeedsBake = true;
        }

        function resetAgent() {
            let bestX = 0, bestY = 0, maxZ = -Infinity;
            for (let i = 0; i < 40; i++) {
                let rx = 0.1 + Math.random() * 0.8;
                let ry = 0.1 + Math.random() * 0.8;
                let rz = getZ(rx, ry);
                if (rz > maxZ) { maxZ = rz; bestX = rx; bestY = ry; }
            }
            // NAG momentum state
            agent = { 
                x: bestX, y: bestY, 
                vx: 0, vy: 0,
                t: 0,
                stallTimer: 0,
                path: [], 
                converged: false 
            };
            resetTimer = 0;
        }

        function getZ(nx, ny) {
            const calculateZ = (blobs) => {
                let z = 0;
                blobs.forEach(b => {
                    const dx = nx - b.cx, dy = ny - b.cy;
                    const d2 = dx*dx + dy*dy;
                    z += b.amp * Math.exp(-d2 / (2 * b.sigma * b.sigma));
                });
                return z;
            };

            const z1 = calculateZ(currentBlobs);
            const z2 = calculateZ(nextBlobs);
            let z = z1 * (1 - morphAlpha) + z2 * morphAlpha;

            const b = 0.12;
            const intensity = 80;
            if (nx < b) z += Math.pow((b - nx) / b, 2) * intensity;
            if (nx > 1 - b) z += Math.pow((nx - (1 - b)) / b, 2) * intensity;
            if (ny < b) z += Math.pow((b - ny) / b, 2) * intensity;
            if (ny > 1 - b) z += Math.pow((ny - (1 - b)) / b, 2) * intensity;

            z += (nx + ny) * 5;
            return z;
        }

        function getGradient(nx, ny) {
            const eps = 0.01;
            const dzdx = (getZ(nx + eps, ny) - getZ(nx - eps, ny)) / (2 * eps);
            const dzdy = (getZ(nx, ny + eps) - getZ(nx, ny - eps)) / (2 * eps);
            return { dx: dzdx, dy: dzdy };
        }

        function project(nx, ny, z) {
            const x = startX + (nx * cols * spacingX) + (ny * rows * spacingX * skew);
            const y = startY + (ny * rows * spacingY) - z;
            return { x, y };
        }

        function getThemeColors() {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            return {
                // Extremely subtle grid for maximum contrast with the agent
                strokeColor: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.1)',
                ballColor: isLight ? '#1a1816' : '#ffffff', // High contrast agent
                pathColor: isLight ? '#7a6240' : '#c9a86c' // Primary accent colors for the trail
            };
        }

        function update() {
            if (document.hidden || !container.classList.contains('visible')) {
                animationId = requestAnimationFrame(update);
                return;
            }

            if (isMorphing) {
                morphAlpha += 0.025;
                if (morphAlpha >= 1) {
                    morphAlpha = 1;
                    isMorphing = false;
                    currentBlobs = nextBlobs;
                    resetAgent();
                }
            }

            if (!agent.converged && !isMorphing) {
                // Lookahead position (Nesterov style)
                const mu = 0.92;
                const lookX = agent.x + mu * agent.vx;
                const lookY = agent.y + mu * agent.vy;
                
                const grad = getGradient(lookX, lookY);
                agent.t += 1;
                
                // Thermal noise component (Langevin Dynamics style)
                // If velocity is low but we are not converged, increase "temperature"
                const speed = Math.sqrt(agent.vx * agent.vx + agent.vy * agent.vy);
                if (speed < 0.001) agent.stallTimer += 1;
                else agent.stallTimer = Math.max(0, agent.stallTimer - 2);

                const burst = (agent.stallTimer > 40) ? 0.01 : 0.0015;
                const noiseX = (Math.random() - 0.5) * burst;
                const noiseY = (Math.random() - 0.5) * burst;

                // NAG Update
                const gWeight = 0.00007;
                
                agent.vx = mu * agent.vx - gWeight * grad.dx + noiseX;
                agent.vy = mu * agent.vy - gWeight * grad.dy + noiseY;
                
                agent.x += agent.vx;
                agent.y += agent.vy;

                // Boundary bounce with energy loss
                if (agent.x < 0) { agent.x = 0; agent.vx *= -0.4; }
                if (agent.x > 1) { agent.x = 1; agent.vx *= -0.4; }
                if (agent.y < 0) { agent.y = 0; agent.vy *= -0.4; }
                if (agent.y > 1) { agent.y = 1; agent.vy *= -0.4; }

                const p = project(agent.x, agent.y, getZ(agent.x, agent.y));
                agent.path.push(p);
                if (agent.path.length > 150) agent.path.shift();

                if (agent.t > 100 && speed < 0.0002 && agent.stallTimer < 50) {
                    agent.converged = true;
                }
            } else if (agent.converged && !isMorphing) {
                resetTimer++;
                if (resetTimer > 40) initLandscape();
            }

            const colors = getThemeColors();
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            ctx.clearRect(0, 0, W, H);

            if (!isMorphing) {
                if (gridNeedsBake) bakeGrid();
                ctx.drawImage(offscreenCanvas, 0, 0, W, H);
            } else {
                ctx.lineWidth = 1.0;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';

                // Draw Y lines
                for (let r = 0; r < rows; r++) {
                    ctx.beginPath();
                    for (let c = 0; c < cols; c++) {
                        const nx = c / (cols - 1), ny = r / (rows - 1);
                        const z = getZ(nx, ny);
                        const p = project(nx, ny, z);
                        const op = Math.max(0.04, Math.min(0.35, 0.15 + (z / 300)));
                        ctx.strokeStyle = colors.strokeColor.replace(/[\d\.]+\)$/, op + ')');
                        if (c === 0) ctx.moveTo(p.x, p.y);
                        else ctx.lineTo(p.x, p.y);
                    }
                    ctx.stroke();
                }

                // Draw X lines
                for (let c = 0; c < cols; c++) {
                    ctx.beginPath();
                    for (let r = 0; r < rows; r++) {
                        const nx = c / (cols - 1), ny = r / (rows - 1);
                        const z = getZ(nx, ny);
                        const p = project(nx, ny, z);
                        const op = Math.max(0.04, Math.min(0.35, 0.15 + (z / 300)));
                        ctx.strokeStyle = colors.strokeColor.replace(/[\d\.]+\)$/, op + ')');
                        if (r === 0) ctx.moveTo(p.x, p.y);
                        else ctx.lineTo(p.x, p.y);
                    }
                    ctx.stroke();
                }
            }

            if (agent.path.length > 1) {
                ctx.strokeStyle = colors.pathColor;
                ctx.lineWidth = 2.5;
                
                // Increased path visibility and glow
                ctx.shadowBlur = 10;
                ctx.shadowColor = colors.pathColor;
                ctx.globalAlpha = 0.85;
                
                ctx.beginPath();
                ctx.moveTo(agent.path[0].x, agent.path[0].y);
                for (let i = 1; i < agent.path.length; i++) {
                    ctx.lineTo(agent.path[i].x, agent.path[i].y);
                }
                ctx.stroke();
                
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            }

            const curP = project(agent.x, agent.y, getZ(agent.x, agent.y));
            const ballOpacity = agent.converged ? (Math.sin(Date.now() / 200) * 0.5 + 0.5) : 1;
            
            ctx.fillStyle = colors.ballColor;
            ctx.globalAlpha = ballOpacity;
            
            // Subtle glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = colors.ballColor;
            
            ctx.beginPath();
            ctx.arc(curP.x, curP.y, 4.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Sharp highlight border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.2;
            ctx.globalAlpha = 0.6 * ballOpacity;
            ctx.stroke();
            
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;

            animationId = requestAnimationFrame(update);
        }

        initLandscape();

        window.addEventListener('themechanged', () => {
            gridNeedsBake = true;
        });

        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    container.classList.add('visible');
                    if (!animationId) {
                        animationId = requestAnimationFrame(update);
                    }
                } else {
                    if (animationId) {
                        cancelAnimationFrame(animationId);
                        animationId = null;
                    }
                }
            });
        }, { threshold: 0.1 });
        obs.observe(container);
    }

    function initLossLandscape() {
        const about = document.getElementById('about');
        if (!about) return;

        const terminal = about.querySelector('.interactive-terminal');
        const divider = about.querySelector('.terminal-visual-divider');

        const wrap = document.createElement('div');
        wrap.className = 'loss-landscape';

        const canvas = document.createElement('canvas');
        canvas.id = 'loss-canvas';
        canvas.className = 'loss-canvas';
        wrap.appendChild(canvas);

        const caption = document.createElement('p');
        caption.className = 'll-caption mono-text';
        caption.textContent = '// non-convex optimization - Nesterov momentum & stochastic thermal bursts';
        wrap.appendChild(caption);

        if (divider) {
            divider.after(wrap);
        } else if (terminal) {
            terminal.after(wrap);
        } else {
            about.querySelector('.content-block')?.appendChild(wrap);
        }
        buildLossLandscape();
    }

    /* Section Divider Particles */
    function initDividerParticles() {
        const dividers = document.querySelectorAll('.section-divider');

        function burst(divider) {
            const rect = divider.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2 + window.scrollY;

            const count = 10;
            for (let i = 0; i < count; i++) {
                const p = document.createElement('div');
                p.className = 'divider-particle';
                const angle = (i / count) * Math.PI * 2;
                const speed = 2 + Math.random() * 3.5;
                const size = 2 + Math.random() * 3;

                p.style.cssText = `
                    width: ${size}px;
                    height: ${size}px;
                    left: ${cx}px;
                    top: ${cy}px;
                    position: absolute;
                    background: hsl(${36 + Math.random() * 20}, 65%, ${55 + Math.random() * 20}%);
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 500;
                `;
                document.body.appendChild(p);

                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                let x = 0, y = 0, op = 1;

                const iv = setInterval(() => {
                    x += vx;
                    y += vy;
                    op -= 0.035;
                    p.style.transform = `translate(${x}px, ${y}px)`;
                    p.style.opacity = op;
                    if (op <= 0) { clearInterval(iv); p.remove(); }
                }, 16);
            }
        }

        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting && !e.target._bursted) {
                    e.target._bursted = true;
                    burst(e.target);
                    setTimeout(() => { e.target._bursted = false; }, 3000);
                }
            });
        }, { threshold: 0.9 });

        dividers.forEach(d => obs.observe(d));
    }

    /* Avatar */
    function initAvatar() {
        const profileContent = document.getElementById('about-profile-content');
        if (!profileContent) return;
        
        // Skip if avatar already exists in DOM (template rendered it)
        if (profileContent.querySelector('.avatar-wrap')) return;

        const wrap = document.createElement('div');
        wrap.className = 'avatar-wrap';

        ['tl','tr','bl','br'].forEach(pos => {
            const b = document.createElement('span');
            b.className = 'avatar-bracket avatar-bracket--' + pos;
            wrap.appendChild(b);
        });

        const img = document.createElement('img');
        img.className = 'avatar-img';
        img.src = 'assets/img/profile-photo.webp';
        img.alt = 'Kush Singh';
        wrap.appendChild(img);

        const label = document.createElement('span');
        label.className = 'avatar-label';
        label.textContent = '// kush_singh';
        wrap.appendChild(label);

        profileContent.appendChild(wrap);
    }

    /* Live Tokenizer Hero */
    function initTokenizerHero() {
        const headline = document.querySelector('.headline');
        if (!headline) return;

        const tokenSpecs = [
            {
                selector: '.breathe-word',
                tokens: [
                    { text: 'B', id: 65, floats: [23478, 13] },
                    { text: 'eyond', id: 23478, floats: [65, 13] },
                    { text: '.', id: 13, floats: [50256, 198] }
                ]
            },
            {
                selector: '.accent-text',
                tokens: [
                    { text: 'Binary', id: 8026, floats: [13, 220] },
                    { text: '.', id: 13, floats: [8026, 198] }
                ]
            }
        ];

        tokenSpecs.forEach(spec => {
            const container = headline.querySelector(spec.selector);
            if (!container) return;

            container.textContent = ''; 

            spec.tokens.forEach(tokenData => {
                const wrapper = document.createElement('span');
                wrapper.className = 'tokenizer-wrapper';
                wrapper.setAttribute('aria-hidden', 'true');
                if (spec.selector === '.accent-text') wrapper.classList.add('is-accent');

                const idDisplay = document.createElement('span');
                idDisplay.className = 'token-id-display';
                idDisplay.textContent = `[${tokenData.id}]`;
                wrapper.appendChild(idDisplay);

                const chars = tokenData.text.split('');
                chars.forEach((char, i) => {
                    const span = document.createElement('span');
                    span.className = 'token-char';
                    span.textContent = char;
                    const tx = (Math.random() - 0.5) * 50;
                    const ty = (Math.random() - 0.5) * 40;
                    const rot = (Math.random() - 0.5) * 30;
                    span.style.setProperty('--tx', tx + 'px');
                    span.style.setProperty('--ty', ty + 'px');
                    span.style.setProperty('--rot', rot + 'deg');
                    span.style.animationDelay = (i * 0.03) + 's';
                    wrapper.appendChild(span);
                });

                wrapper.addEventListener('mouseenter', () => {
                    wrapper.classList.remove('settling');
                    wrapper.classList.add('scattered');
                });
                wrapper.addEventListener('mouseleave', () => {
                    wrapper.classList.remove('scattered');
                    wrapper.classList.add('settling');
                    setTimeout(() => wrapper.classList.remove('settling'), 600);
                });

                container.appendChild(wrapper);
            });
        });
    }

    function initNeuralDividers() {}
    function initArchitectureStack() {}

    ready(() => {
        initVariableFont();
        initSplitText();
        // initScanlines();
        initDepthFog();
        initProgressCircuit();
        initDividerParticles();
        initAvatar();
        setTimeout(initLossLandscape, 50);
        setTimeout(initTokenizerHero, 300);
    });

})();
