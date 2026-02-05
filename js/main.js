import * as THREE from 'three';
import { Player } from './Player.js';
import { createWorld, updateWorld } from './World.js';
import { InteractionManager } from './Interaction.js';
import { Joystick } from './Joystick.js';
import { SoundManager } from './SoundManager.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Global Managers
window.soundManager = new SoundManager();

window.startGame = () => {
    document.getElementById('start-screen').style.display = 'none';
    window.soundManager.resume();
    // Play a starting chime
    window.soundManager.playBeep(600, 'sine');
};

// World
createWorld(scene);

// Player
const player = new Player(scene, () => {
    console.log("Player Loaded");
});

// Interactions
const interactionManager = new InteractionManager(scene);

// Mobile Joystick
const joystick = new Joystick({
    onMove: (data) => {
        // Data is {x, y} normalized -1 to 1
        // Forward in ThreeJS is -Z. Joystick Y -1 is Up.
        // So Joystick Y -1 should map to W (Move Forward).
        // Joystick Y +1 should map to S (Move Backward).

        // Let's inject into input keys
        if (data.y < -0.3) keys.w = true; else keys.w = false;
        if (data.y > 0.3) keys.s = true; else keys.s = false;

        if (data.x < -0.3) keys.a = true; else keys.a = false;
        if (data.x > 0.3) keys.d = true; else keys.d = false;
    }
});

// Camera Offset
const cameraOffset = new THREE.Vector3(0, 5, 8);

// Input
const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'w') keys.w = true;
    if (e.key.toLowerCase() === 'a') keys.a = true;
    if (e.key.toLowerCase() === 's') keys.s = true;
    if (e.key.toLowerCase() === 'd') keys.d = true;
    if (e.key.toLowerCase() === 'e') {
        const hit = interactionManager.check(player.getPosition(), true);
        if (hit) window.soundManager.playBeep(600, 'sine'); // Feedback
    }

    // Resume Audio Context on first interaction
    window.soundManager.resume();
});
window.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() === 'w') keys.w = false;
    if (e.key.toLowerCase() === 'a') keys.a = false;
    if (e.key.toLowerCase() === 's') keys.s = false;
    if (e.key.toLowerCase() === 'd') keys.d = false;
});

// Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();
    const t = clock.getElapsedTime();

    player.update(keys, dt);

    // World Updates (Atmosphere)
    updateWorld(dt);

    if (player.mesh) {
        // Smooth Camera Follow
        const targetPos = player.getPosition().clone().add(cameraOffset);
        camera.position.lerp(targetPos, 0.1);
        camera.lookAt(player.getPosition());

        // Interaction Hover Check (Pulse Visuals)
        interactionManager.check(player.getPosition(), false);
    }

    // Random Meow
    if (Math.random() < 0.002) { // approx once every 500 frames (~8-10 sec)
        if (window.soundManager) window.soundManager.playMeow();
    }

    renderer.render(scene, camera);
}

// Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
