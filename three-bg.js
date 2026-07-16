// Three.js is loaded globally via CDN in index.html
const mount = document.getElementById('app');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x060a12, 0.015);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 260);
camera.position.set(0, 0, 14);

scene.add(new THREE.AmbientLight(0xcfe2ff, 1.08));

const keyLight = new THREE.PointLight(0xffffff, 34, 120, 2);
keyLight.position.set(8, 6, 18);
scene.add(keyLight);

const cyanLight = new THREE.PointLight(0x67e8f9, 18, 130, 2);
cyanLight.position.set(-9, -2, -20);
scene.add(cyanLight);

const blueLight = new THREE.PointLight(0x60a5fa, 15, 140, 2);
blueLight.position.set(6, 0, -54);
scene.add(blueLight);

const world = new THREE.Group();
scene.add(world);
const items = [];

const mouse = { x: 0, y: 0 };
const cameraCurrent = new THREE.Vector3(0, 0, 14);
const cameraTarget = new THREE.Vector3(0, 0, 14);
const lookCurrent = new THREE.Vector3(0, 0, 0);
const lookTarget = new THREE.Vector3(0, 0, 0);

function glassMat(color, opacity = 0.88) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity,
    transmission: 0.72,
    thickness: 1.1,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    ior: 1.22
  });
}

function metalMat(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.24, metalness: 0.92 });
}

function addFloating(mesh, speed, drift) {
  world.add(mesh);
  items.push({
    mesh,
    basePos: mesh.position.clone(),
    baseRot: mesh.rotation.clone(),
    speed,
    drift,
    phase: Math.random() * Math.PI * 2
  });
}

for (let i = 0; i < 14; i++) {
  const shard = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.7 + Math.random() * 1.5, 0),
    glassMat([0xe0f2fe, 0x93c5fd, 0x7dd3fc, 0xc4b5fd][i % 4], 0.84)
  );
  shard.position.set(
    (Math.random() - 0.5) * 24,
    (Math.random() - 0.5) * 14,
    -Math.random() * 118
  );
  shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  shard.scale.setScalar(0.7 + Math.random() * 1.7);
  addFloating(shard, 0.22 + Math.random() * 0.7, 0.18 + Math.random() * 0.34);
}

for (let i = 0; i < 12; i++) {
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(
      1 + Math.random() * 3.8,
      0.16 + Math.random() * 1.4,
      0.12 + Math.random() * 0.8
    ),
    glassMat([0x38bdf8, 0x67e8f9, 0x60a5fa, 0xa78bfa][i % 4], 0.82)
  );
  slab.position.set(
    (Math.random() - 0.5) * 18,
    (Math.random() - 0.5) * 12,
    -8 - Math.random() * 110
  );
  slab.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
  addFloating(slab, 0.24 + Math.random() * 0.52, 0.16 + Math.random() * 0.28);
}

for (let i = 0; i < 8; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.85 + Math.random() * 1.6, 0.05 + Math.random() * 0.12, 18, 72),
    metalMat([0xe2e8f0, 0xcbd5e1, 0x94a3b8][i % 3])
  );
  ring.position.set(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 14,
    -6 - Math.random() * 96
  );
  ring.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
  addFloating(ring, 0.18 + Math.random() * 0.42, 0.12 + Math.random() * 0.2);
}

const starGeo = new THREE.BufferGeometry();
const starCount = 340;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 28;
  starPos[i * 3 + 1] = (Math.random() - 0.5) * 18;
  starPos[i * 3 + 2] = -Math.random() * 132;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: 0xe0f2fe, size: 0.034, transparent: true, opacity: 0.84 })
);
scene.add(stars);

function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 0;
}

window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
});

const clock = new THREE.Clock();

function animate() {
  const t = clock.getElapsedTime();
  const s = scrollProgress();

  cameraTarget.set(
    reduceMotion ? 0 : mouse.x * 2.2,
    reduceMotion ? s * 0.3 : (-mouse.y * 1.4 + s * 1.08),
    14 - s * 130
  );
  cameraCurrent.lerp(cameraTarget, reduceMotion ? 0.16 : 0.048);
  camera.position.copy(cameraCurrent);

  lookTarget.set(mouse.x * 4.2, -mouse.y * 2.6, -20 - s * 50);
  lookCurrent.lerp(lookTarget, reduceMotion ? 0.14 : 0.044);
  camera.lookAt(lookCurrent);

  items.forEach((item, index) => {
    const tt = t * item.speed + item.phase + index * 0.12;
    const depthFactor = 1 + Math.abs(item.basePos.z) * 0.0055;

    item.mesh.position.x = item.basePos.x + Math.sin(tt) * item.drift * 1.8 * depthFactor + mouse.x * 0.42 * depthFactor;
    item.mesh.position.y = item.basePos.y + Math.cos(tt * 1.14) * item.drift * 1.2 * depthFactor - mouse.y * 0.28 * depthFactor;
    item.mesh.position.z = item.basePos.z + Math.sin(tt * 0.52) * item.drift * 5.4;

    item.mesh.rotation.x = item.baseRot.x + Math.sin(tt * 0.72) * 0.24;
    item.mesh.rotation.y = item.baseRot.y + Math.cos(tt * 0.46) * 0.32;
    item.mesh.rotation.z = item.baseRot.z + Math.sin(tt * 0.92) * 0.18;
  });

  stars.rotation.y = t * 0.018;
  stars.position.z = -s * 14;
  stars.position.y = Math.sin(t * 0.4) * 0.42;

  keyLight.position.x = 8 + mouse.x * 2.4;
  keyLight.position.y = 6 - mouse.y * 1.8;
  cyanLight.position.x = -9 - mouse.x * 1.6;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
