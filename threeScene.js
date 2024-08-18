let renderer, scene, camera, sphereBg, nucleus, stars, controls;
const container = document.getElementById("canvas_container");
let timeout_Debounce = null;
const noise = new SimplexNoise();
const blobScale = 2;

init();
animate();

function randomPointSphere(radius) {
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);
    const dx = radius * Math.sin(phi) * Math.cos(theta);
    const dy = radius * Math.sin(phi) * Math.sin(theta);
    const dz = radius * Math.cos(phi);
    return new THREE.Vector3(dx, dy, dz);
}

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.set(0, 0, 100);

    const directionalLight = new THREE.DirectionalLight("#fff", 2);
    directionalLight.position.set(0, 50, -20);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight("#ffffff", 1);
    scene.add(ambientLight);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.maxDistance = 350;
    controls.minDistance = 150;
    controls.enablePan = false;

    const loader = new THREE.TextureLoader();
    const textureSphereBg = loader.load('https://i.ibb.co/4gHcRZD/bg3-je3ddz.jpg');
    const texturenucleus = loader.load('https://i.ibb.co/hcN2qXk/star-nc8wkw.jpg');
    const textureStar = loader.load("https://i.ibb.co/ZKsdYSz/p1-g3zb2a.png");
    const texture1 = loader.load("https://i.ibb.co/F8by6wW/p2-b3gnym.png");  
    const texture2 = loader.load("https://i.ibb.co/yYS2yx5/p3-ttfn70.png");
    const texture4 = loader.load("https://i.ibb.co/yWfKkHh/p4-avirap.png");

    /* Nucleus */
    texturenucleus.anisotropy = 16;
    const icosahedronGeometry = new THREE.IcosahedronGeometry(30, 10);
    const positions = icosahedronGeometry.attributes.position.array;
    nucleus = new THREE.Mesh(icosahedronGeometry, new THREE.MeshPhongMaterial({ map: texturenucleus }));
    scene.add(nucleus);

    /* Sphere Background */
    textureSphereBg.anisotropy = 16;
    const geometrySphereBg = new THREE.SphereBufferGeometry(150, 40, 40);
    const materialSphereBg = new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: textureSphereBg });
    sphereBg = new THREE.Mesh(geometrySphereBg, materialSphereBg);
    scene.add(sphereBg);

    /* Moving Stars */
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 50; i++) {
        const particleStar = randomPointSphere(150); 
        particleStar.velocity = THREE.MathUtils.randInt(25, 100);
        particleStar.startX = particleStar.x;
        particleStar.startY = particleStar.y;
        particleStar.startZ = particleStar.z;
        starPositions.push(particleStar.x, particleStar.y, particleStar.z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
        size: 5,
        color: "#ffffff",
        transparent: true,
        opacity: 0.8,
        map: textureStar,
        blending: THREE.AdditiveBlending,
    });
    starsMaterial.depthWrite = false;  
    stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    /* Fixed Stars */
    function createStars(texture, size, total) {
        const pointGeometry = new THREE.BufferGeometry();
        const positions = [];
        const pointMaterial = new THREE.PointsMaterial({
            size: size,
            map: texture,
            blending: THREE.AdditiveBlending,                      
        });
        for (let i = 0; i < total; i++) {
            const radius = THREE.MathUtils.randInt(149, 70); 
            const particles = randomPointSphere(radius);
            positions.push(particles.x, particles.y, particles.z);
        }
        pointGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        return new THREE.Points(pointGeometry, pointMaterial);
    }
    scene.add(createStars(texture1, 15, 20));   
    scene.add(createStars(texture2, 5, 5));
    scene.add(createStars(texture4, 7, 5));
}

function animate() {
    // Stars Animation
    const starPositions = stars.geometry.attributes.position.array;
    for (let i = 0; i < starPositions.length; i += 3) {
        starPositions[i] += (0 - starPositions[i]) / 50;
        starPositions[i + 1] += (0 - starPositions[i + 1]) / 50;
        starPositions[i + 2] += (0 - starPositions[i + 2]) / 50;
        if (Math.abs(starPositions[i]) <= 5 && Math.abs(starPositions[i + 1]) <= 5 && Math.abs(starPositions[i + 2]) <= 5) {
            const particleStar = randomPointSphere(150);
            starPositions[i] = particleStar.x;
            starPositions[i + 1] = particleStar.y;
            starPositions[i + 2] = particleStar.z;
        }
    }
    stars.geometry.attributes.position.needsUpdate = true;

    // Nucleus Animation
    const nucleusPositions = nucleus.geometry.attributes.position.array;
    const time = Date.now();
    for (let i = 0; i < nucleusPositions.length; i += 3) {
        const v = new THREE.Vector3(nucleusPositions[i], nucleusPositions[i + 1], nucleusPositions[i + 2]);
        v.normalize();
        const distance = 30 + noise.noise3D(
            v.x + time * 0.0005,
            v.y + time * 0.0003,
            v.z + time * 0.0008
        ) * blobScale;
        v.multiplyScalar(distance);
        nucleusPositions[i] = v.x;
        nucleusPositions[i + 1] = v.y;
        nucleusPositions[i + 2] = v.z;
    }
    nucleus.geometry.attributes.position.needsUpdate = true;
    nucleus.geometry.computeVertexNormals();
    nucleus.rotation.y += 0.002;

    // Sphere Background Animation
    sphereBg.rotation.x += 0.002;
    sphereBg.rotation.y += 0.002;
    sphereBg.rotation.z += 0.002;

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Handle resizing
window.addEventListener("resize", () => {
    clearTimeout(timeout_Debounce);
    timeout_Debounce = setTimeout(onWindowResize, 80);
});
function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}
