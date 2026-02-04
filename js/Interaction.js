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
        this.setupProps();
        this.setupUI();
    }

    setupProps() {
        const addProp = (geom, col, x, y, z, name, interactionLogic, isFinal) => {
            const mat = new THREE.MeshStandardMaterial({ color: col, emissive: 0x111111 });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(x, y + (geom.parameters.height ? geom.parameters.height / 2 : 0), z);
            mesh.castShadow = true;
            this.scene.add(mesh);
            this.interactables.push({
                mesh,
                name,
                logic: interactionLogic,
                type: isFinal ? 'final' : 'riddle'
            });
            const l = new THREE.PointLight(col, 2, 5);
            l.position.y = 2;
            mesh.add(l);
        };

        // 1. Desk (Glass)
        addProp(new THREE.BoxGeometry(1.5, 1, 1), 0x8B4513, -8, 2.2, 5, "Μικρό Σεντούκι",
            () => {
                if (this.gameState.hasGlass) return "Άδειο.";
                this.gameState.hasGlass = true;
                return "Βρήκες Μεγεθυντικό Φακό! 🔍";
            });

        // 2. Note (Code)
        addProp(new THREE.PlaneGeometry(0.8, 0.8), 0xffffff, 3.5, 2.21, -30, "Χαρτί",
            () => {
                if (!this.gameState.hasGlass) return "Πολύ μικρό για να διαβαστεί.";
                this.gameState.knownCode = true;
                return "Κωδικός: 1 4 3";
            });
        this.interactables[1].mesh.rotation.x = -Math.PI / 2;

        // 3. Safe (Key)
        addProp(new THREE.BoxGeometry(1.5, 1.5, 1.5), 0x222222, 8, 2.2, -5, "Χρηματοκιβώτιο",
            () => {
                if (this.gameState.hasKey) return "Άδειο.";
                if (this.gameState.knownCode) {
                    this.gameState.hasKey = true;
                    return "Κωδικός Δεκτός. Βρέθηκε Κλειδί! 🗝️";
                }
                return "Κλειδωμένο. Χρειάζεται Κωδικό.";
            });

        // 4. The HEART (Real Shape)
        const x = 0, y = 0;
        const heartShape = new THREE.Shape();
        // Standard Heart Curve
        heartShape.moveTo(x + 5, y + 5);
        heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
        heartShape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
        heartShape.bezierCurveTo(x - 6, y + 11, x - 2, y + 15.4, x + 5, y + 19);
        heartShape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
        heartShape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
        heartShape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);

        const extrudeSettings = { depth: 2, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.5, bevelThickness: 0.5 };
        const hGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
        // Center it roughly
        hGeo.center();

        const hMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0022, roughness: 0.2 });
        const heart = new THREE.Mesh(hGeo, hMat);

        // Orientation
        heart.rotation.z = Math.PI; // Flip it upright? The shape draws upside down usually or depends on coords. 
        // Bezier above goes +Y as it goes down? No, 0,0 is bottom tip references.
        // Let's rotate Z 180 to be safe, or just check.
        // Actually coords: x+5,y+19 is TIP? No, 0,0 is usually notch? 
        // Usually heart shapes in ThreeJS examples are upside down.
        heart.rotation.z = Math.PI;

        heart.position.set(0, 4, -65);
        heart.scale.set(0.2, 0.2, 0.2); // Scale down

        this.scene.add(heart);

        this.interactables.push({
            mesh: heart,
            name: "Καρδιά",
            logic: () => {
                if (this.gameState.hasKey) {
                    document.getElementById('final-overlay').classList.add('visible');
                    return "UNLOCKED";
                }
                return "Κλειδωμένο. Χρειάζεται Κλειδί.";
            },
            type: 'final'
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

    check(playerPos, isInteractPressed) {
        let closest = null;
        let minDist = 8;

        for (let item of this.interactables) {
            const dist = playerPos.distanceTo(item.mesh.position);
            if (dist < minDist) closest = item;
            if (item.type === 'final') {
                item.mesh.rotation.y += 0.02;
                // Bounce
                item.mesh.position.y = 4 + Math.sin(Date.now() * 0.003) * 0.5;
            }
        }

        const prompt = document.getElementById('interaction-prompt');
        if (closest) {
            prompt.style.opacity = 1;
            prompt.innerText = `Πάτα E: ${closest.name}`;

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
        }
        return false;
    }
}
