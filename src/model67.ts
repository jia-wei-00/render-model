import {
  EdgesGeometry,
  ExtrudeGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  Path,
  Shape,
  ShapeUtils,
  Vector2,
} from 'three'

const STROKE_HALF_WIDTH = 0.065
const EXTRUSION_DEPTH = 0.3

const LOOP_6 = { center: new Vector2(-0.55, -0.4), radius: 0.34 }
const HOOK_6 = {
  center: new Vector2(-0.5, -0.05),
  radius: 0.42,
  startAngle: Math.PI / 2,
  endAngle: Math.PI,
}

const BAR_7 = {
  start: new Vector2(0.15, 0.55),
  end: new Vector2(0.95, 0.55),
}

const DIAG_7 = {
  start: new Vector2(0.95, 0.55),
  end: new Vector2(0.35, -0.65),
}

const curveSegments = 72

const digitSixMaterial = new MeshStandardMaterial({
  color: 0x7c3aed,
  roughness: 0.24,
  metalness: 0.08,
})

const digitSevenMaterial = new MeshStandardMaterial({
  color: 0x14b8a6,
  roughness: 0.22,
  metalness: 0.1,
})

const edgeMaterial = new LineBasicMaterial({
  color: 0xf8fafc,
  transparent: true,
  opacity: 0.75,
})

export function createModel67(): Group {
  const group = new Group()
  group.add(
    createStrokeMesh(createRingShape(LOOP_6.center, LOOP_6.radius, STROKE_HALF_WIDTH), digitSixMaterial),
    createStrokeMesh(
      createArcStrokeShape(
        HOOK_6.center,
        HOOK_6.radius,
        HOOK_6.startAngle,
        HOOK_6.endAngle,
        STROKE_HALF_WIDTH,
      ),
      digitSixMaterial,
    ),
    createStrokeMesh(createCapsuleShape(BAR_7.start, BAR_7.end, STROKE_HALF_WIDTH), digitSevenMaterial),
    createStrokeMesh(createCapsuleShape(DIAG_7.start, DIAG_7.end, STROKE_HALF_WIDTH), digitSevenMaterial),
  )

  return group
}

export const modelParameters = {
  strokeHalfWidth: STROKE_HALF_WIDTH,
  depth: EXTRUSION_DEPTH,
  alpha: -Math.PI / 6,
  beta: Math.atan(1 / Math.sqrt(2)),
}

function createStrokeMesh(shape: Shape, material: MeshStandardMaterial): Group {
  const geometry = new ExtrudeGeometry(shape, {
    depth: EXTRUSION_DEPTH,
    bevelEnabled: false,
    curveSegments,
  })

  geometry.computeVertexNormals()

  const mesh = new Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true

  const edges = new LineSegments(new EdgesGeometry(geometry, 18), edgeMaterial)

  const group = new Group()
  group.add(mesh, edges)
  return group
}

function createRingShape(center: Vector2, radius: number, thickness: number): Shape {
  const outer = sampleArc(center, radius + thickness, 0, Math.PI * 2, curveSegments)
  const inner = sampleArc(center, radius - thickness, Math.PI * 2, 0, curveSegments)
  return createShape(outer, [inner])
}

function createArcStrokeShape(
  center: Vector2,
  radius: number,
  startAngle: number,
  endAngle: number,
  thickness: number,
): Shape {
  const outer = sampleArc(center, radius + thickness, startAngle, endAngle, 28)
  const endPoint = polar(center, radius, endAngle)
  const inner = sampleArc(center, radius - thickness, endAngle, startAngle, 28)
  const startPoint = polar(center, radius, startAngle)

  const boundary = [
    ...outer,
    ...sampleArc(endPoint, thickness, endAngle, endAngle + Math.PI, 18).slice(1),
    ...inner.slice(1),
    ...sampleArc(startPoint, thickness, startAngle + Math.PI, startAngle + Math.PI * 2, 18).slice(1),
  ]

  return createShape(boundary)
}

function createCapsuleShape(start: Vector2, end: Vector2, thickness: number): Shape {
  const direction = new Vector2().subVectors(end, start)
  const angle = Math.atan2(direction.y, direction.x)
  const normalAngle = angle + Math.PI / 2
  const normal = new Vector2(-direction.y, direction.x).normalize().multiplyScalar(thickness)

  const boundary = [
    start.clone().add(normal),
    end.clone().add(normal),
    ...sampleArc(end, thickness, normalAngle, normalAngle - Math.PI, 18).slice(1),
    start.clone().sub(normal),
    ...sampleArc(start, thickness, normalAngle - Math.PI, normalAngle - Math.PI * 2, 18).slice(1),
  ]

  return createShape(boundary)
}

function createShape(contour: Vector2[], holes: Vector2[][] = []): Shape {
  const outer = ensureCounterClockwise(normalizeContour(contour))
  const shape = new Shape(outer)

  for (const holeContour of holes) {
    const hole = ensureClockwise(normalizeContour(holeContour))
    shape.holes.push(new Path(hole))
  }

  return shape
}

function normalizeContour(points: Vector2[]): Vector2[] {
  const contour = points.map((point) => point.clone())

  if (contour.length > 1 && contour[0].distanceToSquared(contour[contour.length - 1]) < 1e-10) {
    contour.pop()
  }

  return contour
}

function ensureCounterClockwise(points: Vector2[]): Vector2[] {
  return ShapeUtils.isClockWise(points) ? points.reverse() : points
}

function ensureClockwise(points: Vector2[]): Vector2[] {
  return ShapeUtils.isClockWise(points) ? points : points.reverse()
}

function sampleArc(
  center: Vector2,
  radius: number,
  startAngle: number,
  endAngle: number,
  segments: number,
): Vector2[] {
  const points: Vector2[] = []
  const angleStep = (endAngle - startAngle) / segments

  for (let index = 0; index <= segments; index += 1) {
    points.push(polar(center, radius, startAngle + angleStep * index))
  }

  return points
}

function polar(center: Vector2, radius: number, angle: number): Vector2 {
  return new Vector2(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle))
}
