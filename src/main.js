import * as THREE from "three"
import RAPIER from "@dimforge/rapier3d-compat"

// Clear the app
const app = document.querySelector("#app")
if (app) {
  app.innerHTML = ""
  app.style.position = "fixed"
  app.style.inset = "0"
  app.style.overflow = "hidden"
  app.style.background = "#000000"
}
document.body.style.margin = "0"

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
app?.appendChild(renderer.domElement)

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color("#000000")

// Camera - orthographic for flat, parallel view (like 2D but with depth)
const viewSize = 10
let aspect = window.innerWidth / window.innerHeight
const camera = new THREE.OrthographicCamera(
  (-viewSize * aspect) / 2,
  (viewSize * aspect) / 2,
  viewSize / 2,
  -viewSize / 2,
  0.1,
  100
)
camera.position.set(0, 0, 10)
camera.lookAt(0, 0, 0)

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.8))
const dir = new THREE.DirectionalLight(0xffffff, 0.6)
dir.position.set(5, 8, 5)
scene.add(dir)

// Physics
await RAPIER.init()
const world = new RAPIER.World({ x: 0, y: -6, z: 0 })

// Calculate visible bounds for orthographic camera
const visibleHeight = viewSize
const visibleWidth = viewSize * aspect

// Simple container: bottom + sides + front/back (no visual floor)
const wallThickness = 0.5 // Increased thickness to prevent tunneling
const containerDepth = 2 // Limit Z depth so objects can't fall behind

// Helper function to create visible walls for debugging
function createVisibleWall(x, y, z, width, height, depth, color) {
  const geometry = new THREE.BoxGeometry(width, height, depth)
  const material = new THREE.MeshStandardMaterial({ 
    color: color, 
    opacity: 0.3, 
    transparent: true,
    wireframe: false
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(x, y, z)
  scene.add(mesh)
  return mesh
}

// Bottom barrier - inner surface at visible bottom edge
{
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -visibleHeight / 2 - wallThickness / 2, 0))
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(visibleWidth / 2 + wallThickness, wallThickness / 2, containerDepth / 2 + wallThickness)
      .setTranslation(0, wallThickness / 2, 0),
    body
  )
  // Visual debug walls removed - walls are invisible but still functional
}

// Left barrier - inner surface at visible left edge
{
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(-visibleWidth / 2 - wallThickness / 2, 0, 0))
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(wallThickness / 2, visibleHeight / 2, containerDepth / 2)
      .setTranslation(wallThickness / 2, 0, 0),
    body
  )
  // Visual debug walls removed - walls are invisible but still functional
}

// Right barrier - inner surface at visible right edge
{
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(visibleWidth / 2 + wallThickness / 2, 0, 0))
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(wallThickness / 2, visibleHeight / 2, containerDepth / 2)
      .setTranslation(-wallThickness / 2, 0, 0),
    body
  )
  // Visual debug walls removed - walls are invisible but still functional
}

// Front barrier (glass pane - extends INTO container to create buffer zone)
{
  // Position wall so it extends 0.1 units INTO the container to prevent penetration
  const containerBoundaryZ = containerDepth / 2
  const bufferZone = 0.1 // Extend wall inward to create buffer
  const innerSurfaceZ = containerBoundaryZ - bufferZone // Wall starts inside container
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, innerSurfaceZ + wallThickness / 2))
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(visibleWidth / 2, visibleHeight / 2, wallThickness / 2)
      .setTranslation(0, 0, 0), // Collider center is at body position
    body
  )
  // Visual debug walls removed - walls are invisible but still functional
}

// Back barrier (extends INTO container to create buffer zone)
{
  // Position wall so it extends 0.1 units INTO the container to prevent penetration
  const containerBoundaryZ = -containerDepth / 2
  const bufferZone = 0.1 // Extend wall inward to create buffer
  const innerSurfaceZ = containerBoundaryZ + bufferZone // Wall starts inside container
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, innerSurfaceZ - wallThickness / 2))
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(visibleWidth / 2, visibleHeight / 2, wallThickness / 2)
      .setTranslation(0, 0, 0), // Collider center is at body position
    body
  )
  // Visual debug walls removed - walls are invisible but still functional
}

// Bricks
const brickW = 0.8 * 1.25 * 1.5 // 1.5
const brickH = 0.25 * 1.25 * 1.5 // 0.46875
const brickD = 0.4 * 1.25 * 1.5 // 0.75
const brickGeo = new THREE.BoxGeometry(brickW, brickH, brickD)
const colors = ["#0B66FF", "#5B49FF", "#FF3B30", "#FFC400", "#BDE8E1", "#F6C1DA"]
const bricks = []

// Debug: Log container info
console.log('=== Container Debug Info ===')
console.log('Container depth:', containerDepth)
console.log('Back wall at z:', -containerDepth / 2)
console.log('Front wall at z:', containerDepth / 2)
console.log('Z bounds: from', -containerDepth / 2, 'to', containerDepth / 2)
console.log('Brick depth:', brickD)
console.log('Brick Z half-extent:', brickD / 2)

// Debug: Log actual wall collider positions (matching the actual wall code)
console.log('=== Wall Collider Positions ===')
const containerBoundaryFront = containerDepth / 2
const bufferZone = 0.1
const frontWallInnerZ = containerBoundaryFront - bufferZone // Wall extends INTO container
const frontWallBodyZ = frontWallInnerZ + wallThickness / 2
const frontWallColliderCenterZ = frontWallBodyZ
console.log('Container boundary (front):', containerBoundaryFront)
console.log('Front wall inner surface z:', frontWallInnerZ, '(0.1 units INSIDE container - buffer zone)')
console.log('Front wall body z:', frontWallBodyZ)
console.log('Front wall collider center z:', frontWallColliderCenterZ)
console.log('Front wall collider extends from z:', frontWallColliderCenterZ - wallThickness / 2, 'to', frontWallColliderCenterZ + wallThickness / 2)
console.log('Wall thickness:', wallThickness, '(5x thicker to prevent tunneling)')

const containerBoundaryBack = -containerDepth / 2
const backWallInnerZ = containerBoundaryBack + bufferZone // Wall extends INTO container
const backWallBodyZ = backWallInnerZ - wallThickness / 2
const backWallColliderCenterZ = backWallBodyZ
console.log('Container boundary (back):', containerBoundaryBack)
console.log('Back wall inner surface z:', backWallInnerZ, '(0.1 units INSIDE container - buffer zone)')
console.log('Back wall body z:', backWallBodyZ)
console.log('Back wall collider center z:', backWallColliderCenterZ)
console.log('Back wall collider extends from z:', backWallColliderCenterZ - wallThickness / 2, 'to', backWallColliderCenterZ + wallThickness / 2)

// Debug: Log brick spawn range
console.log('=== Brick Spawn Range ===')
console.log('Brick X spawn: Left side (near -visibleWidth/2)')
console.log('Brick Y spawn: Top (visibleHeight/2 + 0.5)')
console.log('Brick Z spawn: Slightly back from center (z = -0.2)')

function spawnBrick(index, side = 'left') {
  // Spawn on left or right side of the screen
  const margin = 0.5 // Distance from wall
  let x = side === 'left' 
    ? -visibleWidth / 2 + margin  // Left side
    : visibleWidth / 2 - margin   // Right side
  
  // Add small X offset to prevent perfect stacking (especially for right side)
  const xOffset = index * 0.08 // Small incremental offset per brick
  if (side === 'right') {
    x -= xOffset // Shift right-side bricks slightly left
  } else {
    x += xOffset // Shift left-side bricks slightly right
  }
  
  // Spawn bricks with minimal spacing - just enough to prevent overlap detection
  const ySpacing = 0.15 // Small spacing to prevent overlap but keep bricks grouped
  const yOffset = index * ySpacing
  const y = visibleHeight / 2 + 0.5 + yOffset // All spawn near top, slightly spaced
  
  const z = -0.2 // Spawn slightly back from center to prevent forward drift

  // Debug: Log spawn position for each brick
  if (index < 3 || index >= 20) {
    console.log(`Brick ${side} ${index} spawn: x=${x.toFixed(3)}, y=${y.toFixed(3)}, visibleWidth=${visibleWidth.toFixed(3)}, aspect=${aspect.toFixed(3)}`)
  }

  const rb = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y, z)
      .setLinearDamping(0.5)
      .setAngularDamping(0.98) // Increased from 0.8 to reduce rotations and collisions
  )
  // Rely on walls to contain bricks - no Z lock needed

  world.createCollider(
    RAPIER.ColliderDesc.cuboid(brickW / 2, brickH / 2, brickD / 2)
      .setFriction(1.0)
      .setRestitution(0.1),
    rb
  )

  const mesh = new THREE.Mesh(
    brickGeo,
    new THREE.MeshStandardMaterial({ 
      color: colors[Math.floor(Math.random() * colors.length)], 
      roughness: 0.7 
    })
  )
  scene.add(mesh)
  bricks.push({ rb, mesh })
}

// Spawn 30 bricks on the left and 30 on the right
for (let i = 0; i < 30; i++) {
  spawnBrick(i, 'left')
}
for (let i = 0; i < 30; i++) {
  spawnBrick(i, 'right')
}

// Animation
let frameCount = 0
let bricksSettled = false // Track if bricks have settled

function animate() {
  requestAnimationFrame(animate)
  world.step()
  frameCount++

  for (let i = 0; i < bricks.length; i++) {
    const b = bricks[i]
    const t = b.rb.translation()
    const r = b.rb.rotation()
    
    // Force Z to stay at spawn position to prevent forward/backward drift
    // Disable Z resets once bricks have settled to prevent movement during resize
    const targetZ = -0.2
    const needsZReset = !bricksSettled && Math.abs(t.z - targetZ) > 0.01
    if (needsZReset) {
      b.rb.setTranslation({ x: t.x, y: t.y, z: targetZ }, false) // Don't wake up - let bricks sleep when settled
    }
    
    b.mesh.position.set(t.x, t.y, t.z)  // Use actual physics Z position to prevent visual overlap
    b.mesh.quaternion.set(r.x, r.y, r.z, r.w)
  }

  // Check if bricks have settled (most bricks at bottom with low Y velocity)
  if (!bricksSettled && frameCount > 300) {
    let settledCount = 0
    for (const b of bricks) {
      const linvel = b.rb.linvel()
      // Consider settled if Y velocity is near -12 (falling at terminal velocity) or very low
      if (Math.abs(linvel.y + 12) < 0.5 || Math.abs(linvel.y) < 0.5) {
        settledCount++
      }
    }
    // If 80% of bricks are settled, consider all settled
    if (settledCount >= bricks.length * 0.8) {
      bricksSettled = true
    }
  }

  renderer.render(scene, camera)
}

animate()

// Resize
window.addEventListener("resize", () => {
  // Only update camera and renderer - don't touch physics world
  // This prevents settled bricks from being woken up by viewport changes
  aspect = window.innerWidth / window.innerHeight
  camera.left = (-viewSize * aspect) / 2
  camera.right = (viewSize * aspect) / 2
  camera.top = viewSize / 2
  camera.bottom = -viewSize / 2
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  
  // Note: Walls are not rebuilt on resize - they remain at initial positions
  // This is intentional to prevent physics disruption once bricks have settled
})
