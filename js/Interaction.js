import * as THREE from 'three';

export class InteractionManager {
    constructor(scene) {
        this.scene = scene;
        this.interactables = [];
        this.gameState = {
            hasGlass: false,
            knownCode: false,
            hasKey: false
        };
        this.currentHover = null;
        this.setupProps();
        this.setupUI();
    }

    setupProps() {
        const texLoader = new THREE.TextureLoader();
        const texWood = texLoader.load('textures/wood_floor.png');
        const texMetal = texLoader.load('textures/metal_safe.png');

        // Helper to apply texture options
        texWood.wrapS = texWood.wrapT = THREE.RepeatWrapping;
        texMetal.wrapS = texMetal.wrapT = THREE.RepeatWrapping;

        const addProp = (geom, col, x, y, z, name, interactionLogic, isFinal, texture = null) => {
            const matParams = { color: col, emissive: 0x000000 };
            if (texture) {
                matParams.map = texture;
                matParams.roughness = 0.8;
                matParams.metalness = 0.2;
            } else {
                matParams.roughness = 0.5;
            }

            const mat = new THREE.MeshStandardMaterial(matParams);
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(x, y + (geom.parameters.height ? geom.parameters.height / 2 : 0), z);
            mesh.castShadow = true;
            this.scene.add(mesh);
            this.interactables.push({
                mesh,
                name,
                logic: interactionLogic,
                type: isFinal ? 'final' : 'riddle',
                baseColor: col
            });
            const l = new THREE.PointLight(col, 2, 5);
            l.position.y = 2;
            mesh.add(l);
        };

        // 1. Desk (Glass) - Uses WOOD Texture
        addProp(new THREE.BoxGeometry(1.5, 1, 1), 0xffffff, -8, 2.2, 5, "Μικρό Σεντούκι",
            () => {
                if (this.gameState.hasGlass) return "Άδειο.";
                this.gameState.hasGlass = true;
                return "Βρήκες Μεγεθυντικό Φακό! 🔍";
            }, false, texWood);

        // 2. Note (Code) - Paper (No texture, just white)
        addProp(new THREE.PlaneGeometry(0.8, 0.8), 0xffffff, 3.5, 2.21, -30, "Χαρτί",
            () => {
                if (!this.gameState.hasGlass) return "Πολύ μικρό για να διαβαστεί.";
                this.gameState.knownCode = true;
                return "Κωδικός: 1 4 3";
            }, false, null);
        this.interactables[1].mesh.rotation.x = -Math.PI / 2;

        // 3. Safe (Key) - Uses METAL Texture
        addProp(new THREE.BoxGeometry(1.5, 1.5, 1.5), 0x888888, 8, 2.2, -5, "Χρηματοκιβώτιο",
            () => {
                if (this.gameState.hasKey) return "Άδειο.";
                if (this.gameState.knownCode) {
                    this.gameState.hasKey = true;
                    // Play Sound
                    if (window.soundManager) window.soundManager.playBeep(880, 'triangle');
                    return "Κωδικός Δεκτός. Βρέθηκε Κλειδί! 🗝️";
                }
                return "Κλειδωμένο. Χρειάζεται Κωδικό.";
            }, false, texMetal);

        // 4. The HEART (Real Shape)
        const x = 0, y = 0;
        const heartShape = new THREE.Shape();
        heartShape.moveTo(x + 5, y + 5);
        heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
        heartShape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
        heartShape.bezierCurveTo(x - 6, y + 11, x - 2, y + 15.4, x + 5, y + 19);
        heartShape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
        heartShape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
        heartShape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);

        const extrudeSettings = { depth: 2, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.5, bevelThickness: 0.5 };
        const hGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
        hGeo.center();

        const hMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x000000, roughness: 0.2 });
        const heart = new THREE.Mesh(hGeo, hMat);

        heart.rotation.z = Math.PI;
        heart.position.set(0, 4, -65);
        heart.scale.set(0.2, 0.2, 0.2);
        this.scene.add(heart);

        this.interactables.push({
            mesh: heart,
            name: "Καρδιά",
            logic: () => {
                if (this.gameState.hasKey) {
                    document.getElementById('final-overlay').classList.add('visible');
                    // Play Win Sound
                    if (window.soundManager) {
                        window.soundManager.playBeep(523, 'sine');
                        setTimeout(() => window.soundManager.playBeep(659, 'sine'), 200);
                        setTimeout(() => window.soundManager.playBeep(784, 'sine'), 400);
                    }
                    return "UNLOCKED";
                }
                return "Κλειδωμένο. Χρειάζεται Κλειδί.";
            },
            type: 'final',
            baseColor: 0xff0000
        });

        const hl = new THREE.PointLight(0xff0000, 3, 15);
        heart.add(hl);
    }

    setupUI() {
        const btnYes = document.getElementById('btn-yes');
        const btnNo = document.getElementById('btn-no');
        const successPopup = document.getElementById('success-popup');

        btnYes.onclick = () => {
            successPopup.style.display = 'block';
            this.spawnConfetti();
        };

        let yesScale = 1.0;
        const growYes = () => {
            yesScale += 0.5;
            btnYes.style.transform = `scale(${yesScale})`;
            btnYes.innerText = `ΝΑΙ! ${'❤️'.repeat(Math.floor(yesScale))}`;
            btnNo.style.position = 'absolute';
            btnNo.style.left = `${Math.random() * 80 + 10}%`;
            btnNo.style.top = `${Math.random() * 80 + 10}%`;
        };
        btnNo.onmouseover = growYes;
        btnNo.onclick = growYes;
    }

    spawnConfetti() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                left: ${Math.random() * 100}vw;
                top: -10px;
                width: 10px; height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                z-index: 2000;
                transform: rotate(${Math.random() * 360}deg);
                animation: fall ${Math.random() * 2 + 2}s linear forwards;
            `;
            document.body.appendChild(confetti);

            // Cleanup
            setTimeout(() => confetti.remove(), 4000);
        }

        // Add minimal CSS for falling (Injection)
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes fall {
                to { top: 100vh; transform: rotate(720deg); }
            }
        `;
        document.head.appendChild(style);
    }

    check(playerPos, isInteractPressed) {
        let closest = null;
        let minDist = 8;

        for (let item of this.interactables) {
            // Reset Emission
            if (item.mesh.material.emissive) {
                item.mesh.material.emissive.setHex(0x000000);
            }

            const dist = playerPos.distanceTo(item.mesh.position);
            if (dist < minDist) closest = item;
            if (item.type === 'final') {
                item.mesh.rotation.y += 0.02;
                item.mesh.position.y = 4 + Math.sin(Date.now() * 0.003) * 0.5;
            }
        }

        const prompt = document.getElementById('interaction-prompt');
        if (closest) {
            prompt.style.opacity = 1;
            prompt.innerText = `Πάτα E: ${closest.name}`;

            // GLOW EFFECT
            if (closest.mesh.material.emissive) {
                // Pulse
                const val = 0.2 + (Math.sin(Date.now() * 0.01) * 0.1 + 0.1);
                closest.mesh.material.emissive.setHex(0x444444);
            }

            if (isInteractPressed) {
                const message = closest.logic();
                if (message !== "UNLOCKED") {
                    document.getElementById('clue-box').style.display = 'block';
                    document.getElementById('clue-title').innerText = closest.name;
                    document.getElementById('clue-text').innerText = message;
                }
                return true;
            }
        } else {
            prompt.style.opacity = 0;
            this.currentHover = null;
        }
        return false;
    }
}
