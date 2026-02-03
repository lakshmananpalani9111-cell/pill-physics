import * as THREE from "three"
import { createPillMesh } from "./pill.js"

// Clear the app
const app = document.querySelector("#app")
if (app) {
  app.innerHTML = ""
  app.style.position = "fixed"
  app.style.inset = "0"
  app.style.overflow = "hidden"
}

// Renderer
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  alpha: true
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
app?.appendChild(renderer.domElement)

// Scene
const scene = new THREE.Scene()
scene.background = null // Transparent

// Camera - perspective for better 3D view
const camera = new THREE.PerspectiveCamera(
  50, // FOV
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 0, 3)
camera.lookAt(0, 0, 0)

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6))
const dir = new THREE.DirectionalLight(0xffffff, 0.8)
dir.position.set(5, 8, 5)
scene.add(dir)

// Add a subtle rim light
const rimLight = new THREE.DirectionalLight(0xffffff, 0.4)
rimLight.position.set(-5, 0, -5)
scene.add(rimLight)

// Create the pill
const pillRadius = 0.15
const pillHeight = 0.74
const pill = createPillMesh(pillRadius, pillHeight, 32)
scene.add(pill)

// Add rotation animation
function animate() {
  requestAnimationFrame(animate)
  
  // Slowly rotate the pill so you can see all sides
  pill.rotation.y += 0.01
  pill.rotation.x += 0.005
  
  renderer.render(scene, camera)
}

animate()

// Handle resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
