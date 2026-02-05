import * as THREE from 'three';

export const walls = [];
export const wallMeshes = [];
export const lights = [];
let particleSystem;

export function createWorld(scene) {
    // BRIGHTER BACKGROUND & FOG
    scene.background = new THREE.Color(0x301040);
    scene.fog = new THREE.FogExp2(0x301040, 0.01);

    // GLOBAL AMBIENT LIGHT
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const texLoader = new THREE.TextureLoader();

    // Load Textures
    const texStone = texLoader.load('textures/stone_wall.png');
    texStone.wrapS = texStone.wrapT = THREE.RepeatWrapping;
    texStone.repeat.set(2, 1);

    const texWood = texLoader.load('textures/wood_floor.png');
    texWood.wrapS = texWood.wrapT = THREE.RepeatWrapping;
    texWood.repeat.set(4, 4);

    const texRug = texLoader.load('textures/rug_pattern.png');
    const texMetal = texLoader.load('textures/metal_safe.png');

    // Marble Texture for Columns
    const texMarble = texLoader.load('textures/marble_column.png');
    texMarble.wrapS = texMarble.wrapT = THREE.RepeatWrapping;
    texMarble.repeat.set(1, 4); // Stretch vertically for column look

    // Materials
    const wallMat = new THREE.MeshStandardMaterial({
        map: texStone,
        color: 0xaa60aa,
        roughness: 0.7
    });

    const floorMat = new THREE.MeshStandardMaterial({
        map: texWood,
        color: 0xffbbff,
        roughness: 0.5
    });

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });

    // Ancient Greek Marble Material
    const marbleMat = new THREE.MeshStandardMaterial({
        map: texMarble,
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.1
    });

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8 });

    // Physics Helper
    const addWallPhysics = (mesh) => {
        mesh.updateMatrixWorld();
        const box = new THREE.Box3().setFromObject(mesh);
        walls.push(box);
        wallMeshes.push(mesh);
        mesh.userData.isWall = true;
    };

    // --- PROPS ---
    const createTable = (x, z, radius = 3) => {
        const top = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.2, 16), woodMat);
        top.position.set(x, 2, z);
        top.receiveShadow = true; top.castShadow = true;
        scene.add(top);
        addWallPhysics(top);

        const leg = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.1, radius * 0.1, 2), woodMat);
        leg.position.set(x, 1, z);
        scene.add(leg);
    };

    const createRug = (x, z, col) => {
        const geo = new THREE.CircleGeometry(4, 32);
        const mat = new THREE.MeshStandardMaterial({ map: texRug, color: col, roughness: 1.0 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0.05, z);
        mesh.receiveShadow = true;
        scene.add(mesh);
    };

    const createColumn = (x, z) => {
        const geo = new THREE.CylinderGeometry(0.8, 1, 12, 16);
        const mesh = new THREE.Mesh(geo, marbleMat);
        mesh.position.set(x, 6, z);
        mesh.castShadow = true; mesh.receiveShadow = true;
        scene.add(mesh);
        addWallPhysics(mesh);

        // Base
        const base = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1, 2.5), marbleMat);
        base.position.set(x, 0.5, z);
        scene.add(base);

        // Top
        const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 2.2), marbleMat);
        top.position.set(x, 11.6, z);
        scene.add(top);
    };

    const createCandle = (x, y, z) => {
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        stick.position.set(x, y, z);
        scene.add(stick);

        const flame = new THREE.PointLight(0xffaa00, 1, 5);
        flame.position.set(0, 0.5, 0);
        stick.add(flame);

        // Random slight motion
        flame.userData = { originalInt: 1, speed: Math.random() * 5 + 2 };
        lights.push(flame);
    };

    const makeRoom = (x, z, w, d, colorInt) => {
        // Floor
        const floorGeo = new THREE.PlaneGeometry(w, d);
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(x, 0, z);
        floor.receiveShadow = true;
        scene.add(floor);

        // Ceiling
        const ceil = new THREE.Mesh(floorGeo, floorMat);
        ceil.rotation.x = Math.PI / 2;
        ceil.position.set(x, 12, z);
        scene.add(ceil);

        // Walls
        const wallH = 12;
        const thick = 2;
        const halfW = w / 2;

        const w1 = new THREE.Mesh(new THREE.BoxGeometry(thick, wallH, d), wallMat);
        w1.position.set(x - halfW, wallH / 2, z);
        w1.receiveShadow = true;
        scene.add(w1);
        addWallPhysics(w1);

        const w2 = new THREE.Mesh(new THREE.BoxGeometry(thick, wallH, d), wallMat);
        w2.position.set(x + halfW, wallH / 2, z);
        w2.receiveShadow = true;
        scene.add(w2);
        addWallPhysics(w2);

        // Light
        const light = new THREE.PointLight(colorInt, 2.5, 45);
        light.position.set(x, 8, z);
        light.userData = { originalInt: 2.5, speed: Math.random() * 0.1 + 0.05 };
        scene.add(light);
        lights.push(light);
    };

    // --- SETUP ROOMS ---
    makeRoom(0, 0, 30, 30, 0xff55ff);
    createRug(0, 0, 0xffffff);

    // Walls
    const startWall = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 2), wallMat);
    startWall.position.set(0, 6, 15);
    scene.add(startWall);
    addWallPhysics(startWall);

    const shoulder1 = new THREE.Mesh(new THREE.BoxGeometry(10, 12, 2), wallMat);
    shoulder1.position.set(10, 6, -15);
    scene.add(shoulder1);
    addWallPhysics(shoulder1);

    const shoulder2 = new THREE.Mesh(new THREE.BoxGeometry(10, 12, 2), wallMat);
    shoulder2.position.set(-10, 6, -15);
    scene.add(shoulder2);
    addWallPhysics(shoulder2);

    // Hallway
    makeRoom(0, -30, 10, 30, 0x55ffff);
    createRug(0, -30, 0xffffff);
    createTable(3.5, -30, 1.0);

    const shoulder3 = new THREE.Mesh(new THREE.BoxGeometry(15, 12, 2), wallMat);
    shoulder3.position.set(12.5, 6, -45);
    scene.add(shoulder3);
    addWallPhysics(shoulder3);

    const shoulder4 = new THREE.Mesh(new THREE.BoxGeometry(15, 12, 2), wallMat);
    shoulder4.position.set(-12.5, 6, -45);
    scene.add(shoulder4);
    addWallPhysics(shoulder4);

    // Sanctuary (FINAL ROOM)
    makeRoom(0, -65, 40, 40, 0xff5555);
    createRug(0, -65, 0xffffff);

    // --- DECORATION (Columns) ---
    // Left/Right Columns leading to heart
    createColumn(-10, -55); createColumn(10, -55);
    createColumn(-10, -65); createColumn(10, -65);
    createColumn(-10, -75); createColumn(10, -75);

    // Floating Candles
    createCandle(-5, 4, -60); createCandle(5, 4, -60);
    createCandle(-6, 5, -62); createCandle(6, 5, -62);
    createCandle(0, 6, -65); // High center

    // Petal Path (Simple red planes)
    for (let i = 0; i < 30; i++) {
        const pGeo = new THREE.PlaneGeometry(0.3, 0.3);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xaa0000, side: THREE.DoubleSide });
        const petal = new THREE.Mesh(pGeo, pMat);
        petal.rotation.x = -Math.PI / 2;
        petal.rotation.z = Math.random() * Math.PI;
        // Scatter along path Z -45 to -65, X -2 to 2
        petal.position.set((Math.random() - 0.5) * 4, 0.02, -45 - (Math.random() * 20));
        scene.add(petal);
    }

    // Back Wall
    const endWall = new THREE.Mesh(new THREE.BoxGeometry(40, 12, 2), wallMat);
    endWall.position.set(0, 6, -85);
    scene.add(endWall);
    addWallPhysics(endWall);

    createTable(-8, 5);
    createTable(8, -5);

    // --- ATMOSPHERE PARTICLES ---
    const partGeo = new THREE.BufferGeometry();
    const count = 500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
        pos[i] = (Math.random() - 0.5) * 60;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const partMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.15,
        transparent: true,
        opacity: 0.8
    });
    particleSystem = new THREE.Points(partGeo, partMat);
    particleSystem.position.y = 5;
    scene.add(particleSystem);
}

export function updateWorld(dt) {
    // 1. Flicker Lights
    const t = Date.now() * 0.005;
    lights.forEach(l => {
        l.intensity = l.userData.originalInt + Math.sin(t * l.userData.speed) * 0.3 + (Math.random() * 0.1);
    });

    // 2. Drift Particles
    if (particleSystem) {
        particleSystem.rotation.y += 0.0005;
        const positions = particleSystem.geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
            positions[i] -= 0.01;
            if (positions[i] < -5) positions[i] = 5;
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
    }
}
