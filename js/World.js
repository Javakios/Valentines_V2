import * as THREE from 'three';

export const walls = [];
export const wallMeshes = [];

export function createWorld(scene) {
    scene.background = new THREE.Color(0x200025);
    scene.fog = new THREE.FogExp2(0x200025, 0.015);

    const texLoader = new THREE.TextureLoader();

    // Materials
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x805080, roughness: 0.6 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x332244, roughness: 0.5 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 });

    const addWallPhysics = (mesh) => {
        mesh.updateMatrixWorld();
        const box = new THREE.Box3().setFromObject(mesh);
        walls.push(box);
        wallMeshes.push(mesh);
        mesh.userData.isWall = true;
    };

    // --- PROPS CREATORS ---
    const createTable = (x, z, radius = 3) => {
        const top = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.2, 16), woodMat);
        top.position.set(x, 2, z);
        top.receiveShadow = true; top.castShadow = true;
        scene.add(top);
        addWallPhysics(top);

        const leg = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.1, radius * 0.1, 2), woodMat);
        leg.position.set(x, 1, z);
        scene.add(leg);

        return top.position;
    };

    const createRug = (x, z, col) => {
        const geo = new THREE.CircleGeometry(4, 32);
        // FIX: Do not rotate geometry directly, rotate mesh to ensure correct orientation
        const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 1.0, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2; // Rotate flat 
        mesh.position.set(x, 0.05, z);
        mesh.receiveShadow = true;
        scene.add(mesh);
    };

    const makeRoom = (x, z, w, d, colorInt) => {
        // Floor
        const floorGeo = new THREE.PlaneGeometry(w, d);
        // Use mesh rotation for floor too, consistency
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

        // Side Walls
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

        // Lights
        const light = new THREE.PointLight(colorInt, 1.5, 40);
        light.position.set(x, 8, z);
        scene.add(light);
    };

    // --- BUILD LAYOUT ---

    // Room 1: The Lounge (0, 0, 30x30)
    makeRoom(0, 0, 30, 30, 0xff55ff);
    createRug(0, 0, 0x880088);

    // Room 1 Back Wall
    const startWall = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 2), wallMat);
    startWall.position.set(0, 6, 15);
    scene.add(startWall);
    addWallPhysics(startWall);

    // CONNECTION 1
    const shoulder1 = new THREE.Mesh(new THREE.BoxGeometry(10, 12, 2), wallMat);
    shoulder1.position.set(10, 6, -15);
    scene.add(shoulder1);
    addWallPhysics(shoulder1);

    const shoulder2 = new THREE.Mesh(new THREE.BoxGeometry(10, 12, 2), wallMat);
    shoulder2.position.set(-10, 6, -15);
    scene.add(shoulder2);
    addWallPhysics(shoulder2);


    // Room 2: The Hallway (0, -30, 10x30)
    makeRoom(0, -30, 10, 30, 0x55ffff);
    createRug(0, -30, 0x008888);

    createTable(3.5, -30, 1.0);


    // CONNECTION 2
    const shoulder3 = new THREE.Mesh(new THREE.BoxGeometry(15, 12, 2), wallMat);
    shoulder3.position.set(12.5, 6, -45);
    scene.add(shoulder3);
    addWallPhysics(shoulder3);

    const shoulder4 = new THREE.Mesh(new THREE.BoxGeometry(15, 12, 2), wallMat);
    shoulder4.position.set(-12.5, 6, -45);
    scene.add(shoulder4);
    addWallPhysics(shoulder4);


    // Room 3: The Sanctuary (0, -60, 40x40)
    makeRoom(0, -65, 40, 40, 0xff5555);
    createRug(0, -65, 0x880000);

    const endWall = new THREE.Mesh(new THREE.BoxGeometry(40, 12, 2), wallMat);
    endWall.position.set(0, 6, -85);
    scene.add(endWall);
    addWallPhysics(endWall);

    // Furniture in Lounge
    createTable(-8, 5);
    createTable(8, -5);
}
