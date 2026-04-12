/* globe.js - Lightweight Vanilla JS 3D Skill Globe (Three.js Replacement) */
(function () {
    'use strict';

    function initGlobe() {
        const container = document.getElementById('globe-container');
        const canvas = document.getElementById('globe-canvas');
        if (!container || !canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const skills = [
            'C++', 'Python', 'PyTorch', 'Golang', 'SIMD/AVX2',
            'LLMs', 'LoRA', 'GGUF', 'NumPy', 'Transformers',
            'KV-Cache', 'Docker', 'Linux', 'Git', 'CUDA',
        ];

        let width, height, radius;
        let points = [];
        let labels = [];
        
        // Rotation state
        let rotationX = 0;
        let rotationY = 0;
        let targetRotationX = 0;
        let targetRotationY = 0;
        let velocityX = 0.005;
        let velocityY = 0.002;
        
        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        let autoRotate = true;
        let autoRotateTimer = null;

        function getThemeColors() {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            return {
                accent: isLight ? [61, 43, 20] : [201, 168, 108], // rgb
                text1: isLight ? '#000000' : '#f0e0c0',
                text2: '#a0b8c8', // Consistently blue across themes
                bgOpacity: isLight ? 0.15 : 0.05
            };
        }


        let colors = getThemeColors();

        function resize() {
            width = container.offsetWidth;
            height = container.offsetHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            ctx.scale(dpr, dpr);
            radius = Math.min(width, height) * 0.4;
        }

        function initPoints() {
            points = [];
            const n = 150; // Sphere surface points
            for (let i = 0; i < n; i++) {
                const phi = Math.acos(1 - 2 * (i + 0.5) / n);
                const theta = Math.PI * (1 + Math.sqrt(5)) * i;
                points.push({
                    x: Math.sin(phi) * Math.cos(theta),
                    y: Math.cos(phi),
                    z: Math.sin(phi) * Math.sin(theta)
                });
            }

            labels = skills.map((skill, i) => {
                const phi = Math.acos(1 - 2 * (i + 0.5) / skills.length);
                const theta = Math.PI * (1 + Math.sqrt(5)) * i;
                return {
                    text: skill,
                    x: Math.sin(phi) * Math.cos(theta),
                    y: Math.cos(phi),
                    z: Math.sin(phi) * Math.sin(theta),
                    isPrimary: i < 8
                };
            });
        }

        function project(p) {
            // Rotate Y
            let x = p.x * Math.cos(rotationY) - p.z * Math.sin(rotationY);
            let z = p.x * Math.sin(rotationY) + p.z * Math.cos(rotationY);
            
            // Rotate X
            let y = p.y * Math.cos(rotationX) - z * Math.sin(rotationX);
            let z2 = p.y * Math.sin(rotationX) + z * Math.cos(rotationX);

            return {
                x: x * radius + width / 2,
                y: y * radius + height / 2,
                z: z2,
                scale: (z2 + 1.5) / 2.5 // Perspective-ish scaling
            };
        }

        function draw() {
            ctx.clearRect(0, 0, width, height);
            
            const theme = getThemeColors();
            const rgb = theme.accent.join(',');

            // 1. Draw "Rim Light" / Atmosphere
            const gradient = ctx.createRadialGradient(width/2, height/2, radius * 0.8, width/2, height/2, radius * 1.2);
            gradient.addColorStop(0, `rgba(${rgb}, 0)`);
            gradient.addColorStop(0.9, `rgba(${rgb}, ${theme.bgOpacity})`);
            gradient.addColorStop(1, `rgba(${rgb}, 0)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // 2. Draw Wireframe / Points
            ctx.fillStyle = `rgba(${rgb}, 0.5)`;
            points.forEach(p => {
                const proj = project(p);
                if (proj.z < 0) return; // Simple back-face culling for points
                const size = 1.2 * proj.scale;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, size, 0, Math.PI * 2);
                ctx.fill();
            });

            // 3. Draw Labels (Sorted by depth)
            const projectedLabels = labels.map(l => ({ ...l, proj: project(l) }));
            projectedLabels.sort((a, b) => a.proj.z - b.proj.z);

            projectedLabels.forEach(l => {
                const proj = l.proj;
                const opacity = Math.max(0.1, (proj.z + 1) / 2);
                ctx.globalAlpha = opacity;
                
                const fontSize = (l.isPrimary ? 16 : 13) * proj.scale;
                ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;
                ctx.fillStyle = l.isPrimary ? theme.text1 : theme.text2;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Draw text
                ctx.fillText(l.text, proj.x, proj.y);
            });
            ctx.globalAlpha = 1.0;
        }

        function update() {
            if (autoRotate && !isDragging) {
                // Return to base speed
                const baseVelX = 0.005;
                const baseVelY = 0.002;
                velocityX += (baseVelX - velocityX) * 0.05;
                velocityY += (baseVelY - velocityY) * 0.05;
                
                rotationY += velocityX;
                rotationX += velocityY;
            } else if (!isDragging) {
                // Apply friction after drag release
                velocityX *= 0.95;
                velocityY *= 0.95;
                rotationY += velocityX;
                rotationX += velocityY;
            }

            draw();
            requestAnimationFrame(update);
        }

        // Interaction
        container.addEventListener('mousedown', e => {
            isDragging = true;
            autoRotate = false;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            if (autoRotateTimer) clearTimeout(autoRotateTimer);
        });

        window.addEventListener('mousemove', e => {
            if (!isDragging) return;
            const dx = e.clientX - lastMouseX;
            const dy = e.clientY - lastMouseY;
            
            rotationY += dx * 0.005;
            rotationX += dy * 0.005;
            
            velocityX = dx * 0.005;
            velocityY = dy * 0.005;

            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            autoRotateTimer = setTimeout(() => {
                autoRotate = true;
            }, 2000);
        });

        window.addEventListener('themechanged', () => {
            colors = getThemeColors();
        });

        window.addEventListener('resize', () => {
            resize();
        });

        resize();
        initPoints();
        update();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGlobe);
    } else {
        initGlobe();
    }
})();
