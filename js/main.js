import * as THREE from 'three';
import { createWorld, walls, wallMeshes } from './World.js';
import { Player } from './Player.js';
import { InteractionManager } from './Interaction.js';
import { Joystick } from './Joystick.js';

// --- Globals ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const clock = new THREE.Clock();
const inputs = { w: false, a: false, s: false, d: false, e: false };
const raycaster = new THREE.Raycaster();

// --- Init ---
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);

// Modules
createWorld(scene);
const interactions = new InteractionManager(scene);
const player = new Player(scene, () => { console.log("Player Loaded"); });
const joystick = new Joystick(inputs);

// Flashlight
const spotLight = new THREE.SpotLight(0xffaa00, 1.5);
spotLight.angle = Math.PI / 4;
spotLight.penumbra = 0.5;
spotLight.distance = 50;
spotLight.castShadow = true;
scene.add(spotLight);

// Controls
window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w') inputs.w = true;
    if (k === 'a') inputs.a = true;
    if (k === 's') inputs.s = true;
    if (k === 'd') inputs.d = true;
    if (k === 'e') inputs.e = true;
});
window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w') inputs.w = false;
    if (k === 'a') inputs.a = false;
    if (k === 's') inputs.s = false;
    if (k === 'd') inputs.d = false;
    if (k === 'e') inputs.e = false;
});
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Loop
function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();

    // Update Player
    player.update(inputs, dt);

    // CAMERA FOLLOW WITH COLLISION
    if (player.group) {
        const idealOffset = new THREE.Vector3(0, 10, 15);
        idealOffset.applyQuaternion(player.group.quaternion);
        const playerPos = player.group.position.clone();
        const targetCamPos = playerPos.clone().add(idealOffset);

        const rayOrigin = playerPos.clone().add(new THREE.Vector3(0, 5, 0));
        const dir = new THREE.Vector3().subVectors(targetCamPos, rayOrigin);
        const dist = dir.length();
        dir.normalize();

        raycaster.set(rayOrigin, dir);
        raycaster.far = dist;

        // Raycast against wallMeshes (exported from World.js)
        const intersects = raycaster.intersectObjects(wallMeshes);

        let finalPos = targetCamPos;
        if (intersects.length > 0) {
            const hit = intersects[0];
            if (hit.distance < dist) {
                finalPos = hit.point.add(dir.multiplyScalar(-0.5));
            }
        }

        camera.position.lerp(finalPos, 0.2);
        camera.lookAt(player.group.position);

        spotLight.position.copy(player.group.position);
        spotLight.position.y += 5;
        spotLight.target.position.copy(player.group.position).add(new THREE.Vector3(0, 0, -10).applyQuaternion(player.group.quaternion));
        spotLight.target.updateMatrixWorld();
    }

    if (interactions.check(player.getPosition(), inputs.e)) {
        inputs.e = false;
    }

    renderer.render(scene, camera);
}

animate();
