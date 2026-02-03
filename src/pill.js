import * as THREE from "three"

export function createPillMesh(radius = 0.15, height = 0.74, segments = 32) {
  const group = new THREE.Group()

  const cylinderHeight = Math.max(0, height - 2 * radius)

  // Materials - less contrast, warmer tones to match scene
  const topMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,     // Dark gray instead of pure black
    roughness: 0.4,      // Less glossy
    metalness: 0.1,      // Less metallic
  })

  const bottomMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8e4d4,     // Warmer cream to match scene
    roughness: 0.85,     // Slightly less rough
    metalness: 0.02,     // Minimal metalness
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
    const botCyl = new THREE.Mesh(botCylGeo, bottomMaterial)
    botCyl.position.y = -halfCylH / 2           // = -cylinderHeight/4
    group.add(botCyl)
  }

  return group
}
