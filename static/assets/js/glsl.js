/* glsl.js - GLSL shader background */
(function () {
    'use strict';

    function initGLSL() {
        const canvas = document.getElementById('glsl-canvas');
        if (!canvas) return;
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) { canvas.style.display = 'none'; return; }

        const DPR = Math.min(window.devicePixelRatio || 1, 1);
        function resize() {
            canvas.width = Math.floor(window.innerWidth * DPR);
            canvas.height = Math.floor(window.innerHeight * DPR);
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
        resize();
        window.addEventListener('resize', resize, { passive: true });

        const vsSource = `
            attribute vec2 a_pos;
            void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
        `;

        const fsSource = `
            precision mediump float;
            uniform float u_time;
            uniform vec2 u_res;
            uniform vec2 u_mouse;

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }

            float noise(vec2 p) {
                vec2 i = floor(p), f = fract(p);
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(
                    mix(hash(i), hash(i + vec2(1,0)), u.x),
                    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
            }

            float fbm(vec2 p) {
                float v = 0.0, a = 0.5;
                for (int i = 0; i < 5; i++) {
                    v += a * noise(p);
                    p = p * 2.1 + vec2(1.7, 9.2);
                    a *= 0.5;
                }
                return v;
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / u_res;
                vec2 m = u_mouse / u_res;
                float t = u_time * 0.09;

                vec2 q = vec2(fbm(uv + t * 0.4), fbm(uv + vec2(5.2, 1.3) + t * 0.35));
                vec2 r = vec2(fbm(uv + 3.0 * q + vec2(1.7, 9.2) + t * 0.15),
                              fbm(uv + 3.0 * q + vec2(8.3, 2.8) + t * 0.12));

                float f = fbm(uv + 3.0 * r + m * 0.15);

                vec3 col = mix(
                    vec3(0.10, 0.09, 0.08),
                    vec3(0.79, 0.66, 0.42),
                    clamp(f * f * 4.0, 0.0, 1.0)
                );
                col = mix(col, vec3(0.54, 0.71, 0.78), clamp(length(q), 0.0, 1.0));
                col = mix(col, vec3(0.89, 0.78, 0.59), clamp(length(r.x), 0.0, 1.0));

                gl_FragColor = vec4(col * 0.18, 1.0);
            }
        `;

        function compileShader(src, type) {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
        }

        const prog = gl.createProgram();
        gl.attachShader(prog, compileShader(vsSource, gl.VERTEX_SHADER));
        gl.attachShader(prog, compileShader(fsSource, gl.FRAGMENT_SHADER));
        gl.linkProgram(prog);
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

        const aPosLoc = gl.getAttribLocation(prog, 'a_pos');
        gl.enableVertexAttribArray(aPosLoc);
        gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

        const uTime  = gl.getUniformLocation(prog, 'u_time');
        const uRes   = gl.getUniformLocation(prog, 'u_res');
        const uMouse = gl.getUniformLocation(prog, 'u_mouse');

        let mx = 0, my = 0;
        document.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

        let start = performance.now();
        let lastFrame = 0;
        const targetDelta = 1000 / 45;
        let isPaused = false;
        let animationId = null;

        function loop(now) {
            animationId = requestAnimationFrame(loop);
            if (isPaused || document.hidden) return;
            if (now - lastFrame >= targetDelta) {
                lastFrame = now;
                const t = (now - start) / 1000;
                gl.uniform1f(uTime, t);
                gl.uniform2f(uRes, canvas.width, canvas.height);
                gl.uniform2f(uMouse, mx * DPR, canvas.height - my * DPR);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            }
        }

        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                isPaused = !e.isIntersecting;
            });
        }, { threshold: 0.1 });
        obs.observe(canvas);

        animationId = requestAnimationFrame(loop);
    }

    document.addEventListener('DOMContentLoaded', initGLSL);
})();
