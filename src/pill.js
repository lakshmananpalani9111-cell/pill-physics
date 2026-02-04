import * as THREE from "three"

// Create canvas texture with "DOPAMINE" text
function createTextTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  
  // Warm ivory background (matching material color)
  ctx.fillStyle = '#f5e6c8'
  ctx.fillRect(0, 0, 512, 256)
  
  // Text styling - pharmaceutical style font (bold, condensed)
  ctx.fillStyle = '#D7994D'  // Warm golden orange to match pill top
  ctx.font = 'bold 52px "Arial Narrow", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = '2px'
  
  // Draw "DOPAMINE" text
  ctx.fillText('DOPAMINE', 256, 128)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace  // Match material color space
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

const textTexture = createTextTexture()

export function createPillMesh(radius = 0.15, height = 0.74, segments = 32) {
  const group = new THREE.Group()

  const cylinderHeight = Math.max(0, height - 2 * radius)

  // Materials - warm charcoal top, warm ivory bottom
  const topMaterial = new THREE.MeshStandardMaterial({
    color: 0xD7994D,  // Warm golden orange
    roughness: 0.5,
    metalness: 0.0,
  })

  // Bottom material (warm ivory) - plain for hemisphere
  const bottomMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5e6c8,  // Warm ivory
    roughness: 0.8,
    metalness: 0.0,
  })

  // Bottom material with text for cylinder only
  const bottomMaterialWithText = new THREE.MeshStandardMaterial({
    color: 0xffffff,  // White to show texture colors accurately
    roughness: 0.8,
    metalness: 0.0,
    map: textTexture,
  })

  // Hemispheres: their cut edge (equator) is at local y=0
  const topHemGeo = new THREE.SphereGeometry(
    radius,
    segments,
    Math.floor(segments / 2),
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  )
  const topHem = new THREE.Mesh(topHemGeo, topMaterial)
  topHem.position.y = cylinderHeight / 2        // ✅ seam height
  group.add(topHem)

  const botHemGeo = new THREE.SphereGeometry(
    radius,
    segments,
    Math.floor(segments / 2),
    0,
    Math.PI * 2,
    Math.PI / 2,
    Math.PI / 2
  )
  const botHem = new THREE.Mesh(botHemGeo, bottomMaterial)
  botHem.position.y = -cylinderHeight / 2       // ✅ seam height
  group.add(botHem)

  // Cylinders (split into 2 halves)
  if (cylinderHeight > 0) {
    const halfCylH = cylinderHeight / 2

    const topCylGeo = new THREE.CylinderGeometry(radius, radius, halfCylH, segments)
    const topCyl = new THREE.Mesh(topCylGeo, topMaterial)
    topCyl.position.y = +halfCylH / 2           // = cylinderHeight/4
    group.add(topCyl)

    const botCylGeo = new THREE.CylinderGeometry(radius, radius, halfCylH, segments)
    const botCyl = new THREE.Mesh(botCylGeo, bottomMaterialWithText)
    botCyl.position.y = -halfCylH / 2           // = -cylinderHeight/4
    group.add(botCyl)
  }

  return group
}
