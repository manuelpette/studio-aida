const canvas   = document.getElementById('gradient');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const scene    = new THREE.Scene();
const camera   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const clock    = new THREE.Clock();

const palette = {
  bordeaux: '#800E12',
  arancio:  '#DA2E2E',
  crema:    '#f7f0e0',
  pesca:    '#F07121',
  aida:     '#AA1F24'
};

const uniformMap = {
  bordeaux: 'uBordeaux',
  arancio:  'uArancio',
  crema:    'uCrema',
  pesca:    'uPesca',
  aida:     'uAida'
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision mediump float;

  varying vec2 vUv;
  uniform float uTime;

  uniform vec3 uBordeaux;
  uniform vec3 uArancio;
  uniform vec3 uCrema;
  uniform vec3 uPesca;
  uniform vec3 uAida;

  float blob(vec2 uv, vec2 center, float radius) {
    return 1.0 - smoothstep(0.0, radius, length(uv - center));
  }

  float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  // ➕ AGGIUNTA
  float filmGrain(vec2 uv, float time) {
    float t = time * 0.01;

    float g1 = random(uv * 900.0  + t * 0.5);
    float g2 = random(uv * 1400.0 - t * 0.3 + 4.32);
    float g3 = random(uv * 2200.0 + t * 0.2 + 9.17);

    float grain = g1 * 0.5 + g2 * 0.35 + g3 * 0.15;
    return grain;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.15;

    /* Base scura — sinistra */
    vec2 bBase  = vec2(0.10, 0.50);
    float wBase = blob(uv, bBase, 0.90);

    /* Rosso/arancio — centro-sinistra */
    vec2 bRed = vec2(
      0.28 + sin(t * 0.50) * 0.04,
      0.55 + cos(t * 0.40) * 0.05
    );
    float wRed = blob(uv, bRed, 0.55);

    /* Crema — alto destra */
    vec2 bLight1 = vec2(
      0.72 + sin(t * 0.35) * 0.04,
      0.82 + cos(t * 0.30) * 0.03
    );
    float wLight1 = blob(uv, bLight1, 0.52);

    /* Pesca — basso destra */
    vec2 bLight2 = vec2(
      0.65 + sin(t * 0.45) * 0.05,
      0.22 + cos(t * 0.38) * 0.04
    );
    float wLight2 = blob(uv, bLight2, 0.58);

    /* Quinto colore — luce calda centrale */
    vec2 bLight3 = vec2(
      0.48 + sin(t * 0.42) * 0.03,
      0.48 + cos(t * 0.36) * 0.03
    );
    float wLight3 = blob(uv, bLight3, 0.32);

    float total = wBase + wRed + wLight1 + wLight2 + wLight3 + 0.001;

    vec3 col = (
      wBase   * uBordeaux +
      wRed    * uArancio +
      wLight1 * uCrema +
      wLight2 * uPesca +
      wLight3 * uAida
    ) / total;

    float grain = filmGrain(uv, uTime);

    // ➕ AGGIUNTA
    grain = (grain - 0.5) * 0.2;

    // ➕ AGGIUNTA
    float luminance = dot(col, vec3(0.299, 0.587, 0.114));

    // ➕ AGGIUNTA
    float grainAmount = mix(0.9, 0.35, smoothstep(0.0, 1.0, luminance));

    // ✨ MODIFICATA
    col += grain * grainAmount;
    col = clamp(col, 0.0, 1.0);
    col = pow(col, vec3(0.90));

    gl_FragColor = vec4(col, 1.0);
  }
`;

const uniforms = {
  uTime: { value: 0.0 }
};

for (const key in palette) {
  uniforms[uniformMap[key]] = { value: new THREE.Color(palette[key]) };
}

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms
});

scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

function onResize() {
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener('resize', onResize);
onResize();

function animate() {
  requestAnimationFrame(animate);
  material.uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}
animate();

function updatePalette(nextPalette) {
  for (const key in nextPalette) {
    const uniformName = uniformMap[key];
    if (uniformName && material.uniforms[uniformName]) {
      material.uniforms[uniformName].value.set(nextPalette[key]);
    }
  }
}