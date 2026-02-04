import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { walls } from './World.js';

export class Player {
    constructor(scene, onLoaded) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.mesh = null;

        this.loadModel(onLoaded);

        // Settings
        this.speed = 0.25;
        this.rotSpeed = 0.08;

        // Manual Collider size (Width, Height, Depth relative to player center)
        this.colliderRadius = 1.0;

        // Debug Visualizer
        // this.debugBox = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe:true}));
        // this.scene.add(this.debugBox);
    }

    loadModel(callback) {
        const objPath = './Cat_v1_L3.123cb1b1943a-2f48-4e44-8f71-6bbe19a3ab64/12221_Cat_v1_l3.obj';
        const mtlPath = './Cat_v1_L3.123cb1b1943a-2f48-4e44-8f71-6bbe19a3ab64/12221_Cat_v1_l3.mtl';

        const mtlLoader = new MTLLoader();
        mtlLoader.load(mtlPath, (materials) => {
            materials.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.load(objPath, (object) => {
                object.rotation.x = -Math.PI / 2;
                object.rotation.z = Math.PI;
                object.scale.set(0.1, 0.1, 0.1);
                object.traverse(c => { if (c.isMesh) c.castShadow = true; });

                this.mesh = object;
                this.group.add(object);
                if (callback) callback();
            });
        }, undefined, (err) => {
            console.error("OBJ Load Error:", err);
        });
    }

    update(inputs, dt) {
        if (!this.group) return;

        const oldPos = this.group.position.clone();

        // MOVEMENT
        if (inputs.w) this.group.translateZ(-this.speed);
        if (inputs.s) this.group.translateZ(this.speed);
        if (inputs.a) this.group.rotation.y += this.rotSpeed;
        if (inputs.d) this.group.rotation.y -= this.rotSpeed;

        // MANUAL COLLISION CHECK
        // Instead of asking the model (which might be huge/weird), we assume the cat is a 2x2x2 box around the group position
        const pPos = this.group.position;
        const min = new THREE.Vector3(pPos.x - 1, pPos.y, pPos.z - 1);
        const max = new THREE.Vector3(pPos.x + 1, pPos.y + 4, pPos.z + 1);
        const playerBox = new THREE.Box3(min, max);

        // Debug Update
        // if(this.debugBox) {
        //     this.debugBox.position.copy(pPos);
        //     this.debugBox.position.y += 1;
        // }

        let hit = false;
        for (let wall of walls) {
            if (playerBox.intersectsBox(wall)) {
                hit = true;
                break;
            }
        }

        if (hit) {
            console.log("Hit Wall!");
            this.group.position.copy(oldPos);
        }
    }

    getPosition() {
        return this.group.position;
    }
}
