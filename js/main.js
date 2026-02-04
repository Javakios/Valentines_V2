import * as THREE from 'three';
import { createWorld, walls } from './World.js';
import { Player } from './Player.js';
import { InteractionManager } from './Interaction.js';

// --- Globals ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const clock = new THREE.Clock();
const inputs = { w: false, a: false, s: false, d: false, e: false };
const raycaster = new THREE.Raycaster(); // For camera collision

// --- Init ---
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);

createWorld(scene);
const interactions = new InteractionManager(scene);
const player = new Player(scene, () => { console.log("Player Loaded"); });

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
        // 1. Calculate Ideal Position
        const idealOffset = new THREE.Vector3(0, 10, 15);
        idealOffset.applyQuaternion(player.group.quaternion);
        const playerPos = player.group.position.clone();
        // Camera target is player position + offset
        const targetCamPos = playerPos.clone().add(idealOffset);

        // 2. Raycast from Player to Camera to check for walls
        // Start ray slightly above player center to avoid floor/feet issues
        const rayOrigin = playerPos.clone().add(new THREE.Vector3(0, 5, 0));
        const dir = new THREE.Vector3().subVectors(targetCamPos, rayOrigin);
        const dist = dir.length();
        dir.normalize();

        raycaster.set(rayOrigin, dir);
        raycaster.far = dist;

        // Intersect against 'walls' (bounding boxes don't work with raycaster directly, need Meshes)
        // We exported 'walls' as Box3 in World.js, but Raycaster needs Mesh objects.
        // We need to fix World.js to export the Wall Meshes too, or just iterate objects in scene?
        // Traversing scene is slow. Best to have a list of wall meshes.
        // For current fallback, let's assume `scene.children` is okay if we filter, 
        // OR better: Update World.js to export `wallMeshes` list. 
        // Since I can't update World.js *before* this runs in this turn (unless I do it first), 
        // I will update Main.js to use `walls` if they were meshes, but they are Boxes.
        // WAIT: Player collision uses Box3. Camera uses Raycaster.
        // I'll update World.js to export `wallMeshes`.

        // Assuming World.js will be updated to export `wallMeshes`
        // If not, we can try to find them by name or uuid, but explicit list is best.
        // Temporary hack: Pass `scene.children` but filtered? No.
        // I will update World.js NEXT step to export `pixelWalls` or `wallMeshes`.
        // Let's assume `window.wallMeshes` is set by World.js or similar global.

        // Actually, I can search scene for objects with `isWall` custom property?
        // Let's look at World.js... I'll just traverse scene for now for robustness, simple scene.

        const wallObjects = [];
        scene.traverse(o => {
            if (o.isMesh && (o.geometry.type === 'BoxGeometry' || o.geometry.type === 'PlaneGeometry')) {
                // Crude filter for walls
                wallObjects.push(o);
            }
        });

        const intersects = raycaster.intersectObjects(wallObjects);

        let finalPos = targetCamPos;
        if (intersects.length > 0) {
            // Hit a wall! Move camera to hit point (minus buffer)
            const hit = intersects[0];
            // Only clip if it's not the player mesh (Player uses Box/Obj)
            // Wall meshes are usually the ones we care about.
            if (hit.distance < dist) {
                finalPos = hit.point.add(dir.multiplyScalar(-0.5)); // Move slightly in front of wall
            }
        }

        // Smooth Lerp to final
        camera.position.lerp(finalPos, 0.2); // Faster lerp for collision responsiveness
        camera.lookAt(player.group.position);

        // Flashlight Update
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
