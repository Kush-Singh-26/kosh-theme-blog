// Cache for the WASM binary to avoid re-downloading
let wasmBinaryCache = null;
let wasmBinaryCachePromise = null;

class WasmSim extends HTMLElement {
    connectedCallback() {
        setTimeout(() => this.init(), 0);
    }

    init() {
        const simName = this.getAttribute('src');
        if (!simName) return;

        let controls = [];

        // Read controls from child script tag
        const scriptEl = this.querySelector('script[type="application/json"]');
        if (scriptEl) {
            try {
                controls = JSON.parse(scriptEl.textContent);
            } catch (e) {
                console.error(`WasmSim [${simName}]: Error parsing JSON from script tag:`, e);
            }
        }

        // Fallback to attribute
        if (controls.length === 0) {
            const attrControls = this.getAttribute('controls');
            if (attrControls) {
                try {
                    controls = JSON.parse(attrControls);
                } catch (e) {
                    console.error(`WasmSim [${simName}]: Error parsing 'controls' attribute.`, e);
                }
            }
        }

        const prefix = `canvas_${simName}`;

        // Fix title changes
        if (!window.fixedTitle) {
            window.fixedTitle = document.title;
            const titleEl = document.querySelector('title');
            if (titleEl) {
                new MutationObserver(() => {
                    if (document.title !== window.fixedTitle) {
                        document.title = window.fixedTitle;
                    }
                }).observe(titleEl, { childList: true, subtree: true, characterData: true });
            }
        }

        // Create canvas and UI (labels created dynamically by C++)
        this.innerHTML = `
            <div style="background: var(--bg-card); padding: 20px; border-radius: 8px; border: 1px solid var(--border); display: inline-block; margin: 20px 0;">
                <div id="canvas_container_${simName}" style="position: relative; width: 800px; height: 600px; background: var(--bg-body); border: 1px solid var(--border); margin-bottom: 20px; overflow: hidden;">
                    <canvas id="${prefix}" oncontextmenu="event.preventDefault()" style="width: 100%; height: 100%; display: block;"></canvas>
                </div>
                <div id="ui_${simName}" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; align-items: end;"></div>
            </div>
            <style>
                .sim-label {
                    position: absolute; top: 0; left: 0; 
                    font-family: var(--font-main); font-weight: bold; font-size: 16px; 
                    text-shadow: 0 0 4px var(--bg-body); pointer-events: none;
                    transition: opacity 0.1s;
                    z-index: 10;
                }
                .sim-btn {
                    padding: 8px 16px; background: var(--color-success); color: white; border: none; border-radius: 6px; cursor: pointer; width: 100%; font-weight: 600;
                    font-family: var(--font-main);
                }
                .sim-btn:hover { background: color-mix(in oklch, var(--color-success), white 10%); }
                .sim-btn:active { background: var(--color-success); opacity: 0.8; }
            </style>
        `;

        // Global helper for UI updates
        window.updateSimControl = (simName, id, val) => {
            const input = document.getElementById(`input_${simName}_${id}`);
            if (input) input.value = val;

            const label = document.getElementById(`val_${simName}_${id}`);
            if (label) label.textContent = val.toFixed(2);
        };

        this.initWasm(simName, controls);
    }

    async initWasm(name, controls) {
        const canvas = this.querySelector('canvas');
        
        // Compute relative path to static assets based on current location
        // Blog pages at /blogs/* need ../static, home page at /* needs static
        const pathDepth = window.location.pathname.split('/').filter(Boolean).length;
        const wasmPrefix = pathDepth > 1 ? '../' : '';
        
        // Load the engine script only once
        if (!document.getElementById(`script_engine`)) {
            const script = document.createElement('script');
            script.id = `script_engine`;
            script.src = wasmPrefix + 'static/wasm/engine.js';
            document.body.appendChild(script);
        }

        await this.waitForEngine(name, canvas, controls, wasmPrefix);
    }

    async waitForEngine(name, canvas, controls, wasmPrefix) {
        // Wait for the factory function to exist
        while (!window[`create_engine`]) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Pre-fetch the WASM binary ONCE and cache it
        if (!wasmBinaryCachePromise) {
            console.log("Fetching WASM binary (will be cached for all sims)...");
            wasmBinaryCachePromise = fetch(wasmPrefix + 'static/wasm/engine.wasm')
                .then(response => response.arrayBuffer())
                .then(buffer => {
                    wasmBinaryCache = buffer;
                    console.log("WASM binary cached successfully");
                    return buffer;
                });
        }

        // Wait for WASM to be cached
        await wasmBinaryCachePromise;

        // Create a separate module instance for THIS simulation
        // But reuse the cached WASM binary
        console.log(`Creating module instance for "${name}" (using cached WASM)...`);
        const module = await window[`create_engine`]({
            canvas: canvas,
            wasmBinary: wasmBinaryCache, // Reuse the cached binary!
            // engine.js is loaded dynamically so currentScript is null at its
            // execution time — scriptDirectory becomes "" and locateFile would
            // resolve to a bare "engine.wasm" filename (wrong). Override it to
            // always point at the correct static path relative to the page root.
            locateFile: (path) => wasmPrefix + 'static/wasm/' + path,
            print: (text) => console.log(name + ": " + text),
            printErr: (text) => console.error(name + ": " + text),
            setStatus: (text) => { },
        });

        this.startSim(name, canvas, controls, module);
    }

    startSim(name, canvas, controls, module) {
        if (!module) {
            console.error(`Module not loaded for ${name}`);
            return;
        }

        // Load the specific simulation
        const success = module.loadSim(name);
        if (!success) {
            console.error(`Failed to load simulation: ${name}`);
            return;
        }

        // Initialize the simulation
        const simInstance = module.getCurrentSim();
        if (simInstance && simInstance.initHelper) {
            simInstance.initHelper(800, 600, "#" + canvas.id);
        }

        const ui = this.querySelector(`#ui_${name}`);

        // Generic setter helper
        const setSimProp = (id, val) => {
            if (typeof val === 'boolean') {
                module.setSimBool(id, val);
            } else if (typeof val === 'number') {
                module.setSimFloat(id, val);
            }
        };

        // Action helper
        const callSimAction = (id) => {
            module.callSimAction(id);
        };

        // Create controls
        controls.forEach(c => {
            const type = c.type || 'slider';
            const wrapper = document.createElement('div');

            if (type === 'button') {
                wrapper.innerHTML = `<button class="sim-btn">${c.label}</button>`;
                wrapper.querySelector('button').onclick = () => {
                    callSimAction(c.id);
                };
            } else if (type === 'checkbox') {
                setSimProp(c.id, !!c.val);
                wrapper.style.display = "flex";
                wrapper.style.alignItems = "center";
                wrapper.style.height = "100%";
                wrapper.innerHTML = `
                    <input type="checkbox" id="chk_${name}_${c.id}" ${c.val ? 'checked' : ''} style="margin-right: 10px; transform: scale(1.2);">
                    <label for="chk_${name}_${c.id}" style="color: var(--text-secondary); cursor: pointer; font-family: var(--font-main);">${c.label}</label>
                `;
                wrapper.querySelector('input').onchange = (e) => setSimProp(c.id, e.target.checked);
            } else {
                setSimProp(c.id, c.val);
                wrapper.innerHTML = `
                    <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 6px; font-family: var(--font-main);">${c.label}: <span id="val_${name}_${c.id}">${c.val}</span></div>
                    <input id="input_${name}_${c.id}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.val}" style="width: 100%;">
                `;
                wrapper.querySelector('input').addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    setSimProp(c.id, val);
                    wrapper.querySelector(`#val_${name}_${c.id}`).textContent = val.toFixed(2);
                });
            }
            ui.appendChild(wrapper);
        });
    }
}

customElements.define('wasm-sim', WasmSim);
