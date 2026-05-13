import "./style.css";
import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  OrthographicCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createModel67, modelParameters } from "./model67";
import { Analytics } from "@vercel/analytics/next";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main class="layout">
    <section class="panel">
      <p class="eyebrow">Three.js realization</p>
      <h1>Mathematical model of 67</h1>
      <p class="lede">
        The solid is built from the exact stroke neighborhoods in the spec: a ring and quarter-arc
        for the 6, plus two rounded line-segment capsules for the 7, all extruded along the z-axis.
      </p>
      <dl class="metrics">
        <div>
          <dt>Stroke half-width</dt>
          <dd>${modelParameters.strokeHalfWidth.toFixed(3)}</dd>
        </div>
        <div>
          <dt>Extrusion depth</dt>
          <dd>${modelParameters.depth.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Azimuth</dt>
          <dd>${formatAngle(modelParameters.alpha)}</dd>
        </div>
        <div>
          <dt>Elevation</dt>
          <dd>${formatAngle(modelParameters.beta)}</dd>
        </div>
      </dl>
      <p class="note">
        The camera starts from the dimetric preview angle in the model notes so the interior of the 7
        stays visible, with orbit and zoom enabled for inspection.
      </p>
    </section>
    <section class="viewport-shell">
      <div id="viewport" aria-label="Three.js rendering of the number 67"></div>
      <p class="hint">Drag to orbit • Scroll to zoom</p>
    </section>
    <Analytics/>
  </main>
`;

const viewport = document.querySelector<HTMLDivElement>("#viewport")!;

const scene = new Scene();
scene.background = new Color(0x020617);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
viewport.appendChild(renderer.domElement);

const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minZoom = 0.8;
controls.maxZoom = 6;

scene.add(
  new AmbientLight(0xffffff, 0.35),
  new HemisphereLight(0x60a5fa, 0x020617, 1.2),
  createMainLight(),
);

const model = createModel67();
model.scale.setScalar(3.1);
scene.add(model);

const frame = new Box3().setFromObject(model);
const center = frame.getCenter(new Vector3());
const size = frame.getSize(new Vector3());
const radius = Math.max(size.x, size.y, size.z) * 0.9;

controls.target.copy(center);
setProjectionPose(camera, center, radius * 5.2);

function resize() {
  const width = Math.max(viewport.clientWidth, 1);
  const height = Math.max(viewport.clientHeight, 1);
  const aspect = width / height;
  const frustumHeight = radius * 3;

  camera.left = (-frustumHeight * aspect) / 2;
  camera.right = (frustumHeight * aspect) / 2;
  camera.top = frustumHeight / 2;
  camera.bottom = -frustumHeight / 2;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height, false);
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(viewport);
resize();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener("beforeunload", () => {
  resizeObserver.disconnect();
  controls.dispose();
  renderer.dispose();
});

function createMainLight(): DirectionalLight {
  const light = new DirectionalLight(0xffffff, 1.9);
  light.position.set(4.5, -2.8, 6.5);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  light.shadow.bias = -0.0001;
  return light;
}

function setProjectionPose(
  camera: OrthographicCamera,
  target: Vector3,
  distance: number,
) {
  const alpha = modelParameters.alpha;
  const beta = modelParameters.beta;

  const viewDirection = new Vector3(
    Math.cos(alpha) * Math.cos(beta),
    Math.sin(alpha) * Math.cos(beta),
    Math.sin(beta),
  ).normalize();

  const up = new Vector3(
    -Math.cos(alpha) * Math.sin(beta),
    -Math.sin(alpha) * Math.sin(beta),
    Math.cos(beta),
  ).normalize();

  camera.up.copy(up);
  camera.position.copy(target).addScaledVector(viewDirection, distance);
  camera.lookAt(target);
}

function formatAngle(radians: number): string {
  return `${MathUtils.radToDeg(radians).toFixed(1)}°`;
}
