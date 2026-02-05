import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { walls } from './World.js';

export class Player {
    constructor(scene, onLoaded) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.mesh = null;

        // Remove DEBUG box? Or keep it for one more turn to be safe?
        // Let's remove it if we are confident.
        // Or keep it invisible.
        // this.debugMesh = ...

        this.loadModel(onLoaded);

        // Settings
        this.speed = 0.25;
        this.rotSpeed = 0.08;
    }

    loadModel(callback) {
        // CORRECT PATH from checking filesystem
        const objPath = './Cat_v1_L3.123cb1b1943a-2f48-4e44-8f71-6bbe19a3ab64/12221_Cat_v1_l3.obj';
        const texPath = './Cat_v1_L3.123cb1b1943a-2f48-4e44-8f71-6bbe19a3ab64/Cat_diffuse.jpg';

        const texLoader = new THREE.TextureLoader();
        const catTexture = texLoader.load(texPath);

        const loader = new OBJLoader();
        loader.load(objPath, (object) => {

            // OBJ usually needs rotation X -90
            object.rotation.x = -Math.PI / 2;
            object.rotation.z = Math.PI; // Spin around to face away from camera?

            // Size Check
            const box = new THREE.Box3().setFromObject(object);
            const size = new THREE.Vector3();
            box.getSize(size);

            // Normalize Height to 3 units
            const targetHeight = 3.0;
            const scalar = size.y > 0.001 ? targetHeight / size.y : 0.05; // 0.05 is a guess if size fails
            object.scale.set(scalar, scalar, scalar);

            // Center Feet
            object.updateMatrixWorld();
            const newBox = new THREE.Box3().setFromObject(object);
            const bottom = newBox.min.y;
            object.position.y -= bottom; // Ground it

            object.traverse(c => {
                if (c.isMesh) {
                    c.castShadow = true;
                    if (c.material) {
                        c.material.map = catTexture;
                        // OBJ material might be Phong or Lambert. Update to Standard for better light?
                        c.material = new THREE.MeshStandardMaterial({
                            map: catTexture,
                            roughness: 0.8,
                            color: 0xffffff
                        });
                    }
                }
            });

            this.mesh = object;
            this.group.add(object);

            if (callback) callback();
        }, undefined, (err) => {
            console.error("OBJ Error:", err);
            // Fallback: Red Box if OBJ fails
            const geo = new THREE.BoxGeometry(2, 2, 2);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            this.mesh = new THREE.Mesh(geo, mat);
            this.group.add(this.mesh);
        });
    }

    update(inputs, dt) {
        if (!this.group) return;

        // No Mixer (OBJ has no skeletal animation)

        const isMoving = inputs.w || inputs.s;
        if (isMoving) {
            if (!this.stepTimer) this.stepTimer = 0;
            this.stepTimer += dt;
            if (this.stepTimer > 0.4) {
                if (window.soundManager) window.soundManager.playStep();
                this.stepTimer = 0;
            }
        } else {
            this.stepTimer = 0.4; // Ready to step immediately on move
        }

        const oldPos = this.group.position.clone();

        if (inputs.w) this.group.translateZ(-this.speed);
        if (inputs.s) this.group.translateZ(this.speed);
        if (inputs.a) this.group.rotation.y += this.rotSpeed;
        if (inputs.d) this.group.rotation.y -= this.rotSpeed;

        // Collision
        const pPos = this.group.position;
        const min = new THREE.Vector3(pPos.x - 1, pPos.y, pPos.z - 1);
        const max = new THREE.Vector3(pPos.x + 1, pPos.y + 4, pPos.z + 1);
        const playerBox = new THREE.Box3(min, max);

        let hit = false;
        for (let wall of walls) {
            if (playerBox.intersectsBox(wall)) {
                hit = true;
                break;
            }
        }

        if (hit) {
            this.group.position.copy(oldPos);
        }
    }

    getPosition() {
        return this.group.position;
    }
}
