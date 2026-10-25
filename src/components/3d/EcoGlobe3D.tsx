import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface EcoGlobe3DProps {
  interactive?: boolean;
  className?: string;
  particleCount?: number;
}

/**
 * Procedural Earth Texture Generator
 * Paints realistic continents, oceans, latitude/longitude grids, and glowing city nodes onto a CanvasTexture.
 */
function createEarthCanvasTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // 1. Ocean Background: Deep Space Marine Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#020e09');
  oceanGrad.addColorStop(0.5, '#04170f');
  oceanGrad.addColorStop(1, '#020e09');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Latitude & Longitude Coordinate Grid (Futuristic Hologram)
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
  ctx.lineWidth = 1;
  for (let lat = 0; lat < height; lat += height / 18) {
    ctx.beginPath();
    ctx.moveTo(0, lat);
    ctx.lineTo(width, lat);
    ctx.stroke();
  }
  for (let lng = 0; lng < width; lng += width / 36) {
    ctx.beginPath();
    ctx.moveTo(lng, 0);
    ctx.lineTo(lng, height);
    ctx.stroke();
  }

  // 3. Continents: Polygonal Geography Scaled to Equirectangular Projection
  // [x = (lng + 180)/360 * width, y = (90 - lat)/180 * height]
  const toX = (lng: number) => ((lng + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  const continents = [
    // Eurasia & India
    [
      [toX(-10), toY(35)], [toX(0), toY(45)], [toX(15), toY(55)], [toX(30), toY(70)],
      [toX(70), toY(72)], [toX(130), toY(70)], [toX(170), toY(65)], [toX(140), toY(40)],
      [toX(120), toY(30)], [toX(105), toY(20)], [toX(100), toY(5)], [toX(95), toY(20)],
      // Indian Subcontinent (Prominent Detail)
      [toX(90), toY(24)], [toX(85), toY(20)], [toX(80), toY(8)], [toX(75), toY(12)],
      [toX(70), toY(23)], [toX(65), toY(25)], [toX(60), toY(30)], [toX(50), toY(25)],
      [toX(40), toY(30)], [toX(30), toY(35)], [toX(15), toY(38)], [toX(0), toY(36)],
    ],
    // Africa
    [
      [toX(-15), toY(30)], [toX(10), toY(37)], [toX(30), toY(32)], [toX(40), toY(15)],
      [toX(50), toY(10)], [toX(42), toY(-5)], [toX(35), toY(-20)], [toX(28), toY(-34)],
      [toX(18), toY(-34)], [toX(10), toY(-10)], [toX(8), toY(5)], [toX(-15), toY(12)],
    ],
    // North America
    [
      [toX(-165), toY(65)], [toX(-140), toY(70)], [toX(-90), toY(75)], [toX(-60), toY(55)],
      [toX(-70), toY(45)], [toX(-75), toY(35)], [toX(-80), toY(25)], [toX(-90), toY(20)],
      [toX(-100), toY(20)], [toX(-105), toY(30)], [toX(-120), toY(35)], [toX(-130), toY(50)],
      [toX(-165), toY(60)],
    ],
    // South America
    [
      [toX(-75), toY(10)], [toX(-60), toY(10)], [toX(-50), toY(0)], [toX(-35), toY(-5)],
      [toX(-40), toY(-22)], [toX(-55), toY(-40)], [toX(-65), toY(-55)], [toX(-72), toY(-50)],
      [toX(-70), toY(-30)], [toX(-78), toY(-10)], [toX(-80), toY(0)],
    ],
    // Australia
    [
      [toX(115), toY(-22)], [toX(130), toY(-15)], [toX(145), toY(-15)], [toX(152), toY(-25)],
      [toX(150), toY(-36)], [toX(135), toY(-38)], [toX(118), toY(-34)], [toX(114), toY(-26)],
    ],
  ];

  continents.forEach((poly) => {
    ctx.beginPath();
    poly.forEach(([x, y], idx) => {
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // Continental gradient: deep forest green to bright cyber-emerald
    const landGrad = ctx.createRadialGradient(
      poly[0][0],
      poly[0][1],
      10,
      poly[0][0],
      poly[0][1],
      350
    );
    landGrad.addColorStop(0, '#064e3b');
    landGrad.addColorStop(0.6, '#065f46');
    landGrad.addColorStop(1, '#042f24');
    ctx.fillStyle = landGrad;
    ctx.fill();

    // Glowing shoreline rim
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0; // reset
  });

  // 4. Glowing City Clusters & Environmental Monitoring Nodes
  const cityNodes = [
    { lng: 77.209, lat: 28.6139, label: 'Delhi Hub' },
    { lng: 72.8777, lat: 19.076, label: 'Mumbai Marine' },
    { lng: 77.5946, lat: 12.9716, label: 'Bengaluru Flora' },
    { lng: 78.4867, lat: 17.385, label: 'Hyderabad Grid' },
    { lng: 88.3639, lat: 22.5726, label: 'Kolkata Delta' },
    { lng: 80.2707, lat: 13.0827, label: 'Chennai Coast' },
    { lng: -0.1278, lat: 51.5074, label: 'London' },
    { lng: -74.006, lat: 40.7128, label: 'New York' },
    { lng: 139.6503, lat: 35.6762, label: 'Tokyo' },
    { lng: 114.1694, lat: 22.3193, label: 'Hong Kong' },
    { lng: 103.8198, lat: 1.3521, label: 'Singapore' },
    { lng: 151.2093, lat: -33.8688, label: 'Sydney' },
  ];

  // Draw node networks
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (let i = 0; i < cityNodes.length - 1; i++) {
    const p1 = cityNodes[i];
    const p2 = cityNodes[i + 1];
    ctx.beginPath();
    ctx.moveTo(toX(p1.lng), toY(p1.lat));
    ctx.lineTo(toX(p2.lng), toY(p2.lat));
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Draw glowing city beacon points
  cityNodes.forEach((node) => {
    const x = toX(node.lng);
    const y = toY(node.lat);

    // Outer glow
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.fill();

    // Inner bright center
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#67e8f9';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Atmospheric Cloud Texture
 */
function createCloudCanvasTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, width, height);

  // Soft atmospheric cloud streaks
  for (let i = 0; i < 45; i++) {
    const x = Math.random() * width;
    const y = height * 0.2 + Math.random() * (height * 0.6);
    const r = 35 + Math.random() * 85;

    const grad = ctx.createRadialGradient(x, y, 5, x, y, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    grad.addColorStop(0.5, 'rgba(200, 245, 230, 0.15)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.8, r * 0.6, Math.random() * 0.4 - 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export const EcoGlobe3D: React.FC<EcoGlobe3DProps> = ({
  interactive = true,
  className = 'w-full h-full absolute inset-0 pointer-events-none',
  particleCount = 2000,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020a06, 0.0016);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 20, 280);

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Lighting (Sunlight + Ambient Bio-Glow)
    const ambientLight = new THREE.AmbientLight(0x0d3b2a, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xe6fff4, 2.6);
    sunLight.position.set(220, 160, 200);
    scene.add(sunLight);

    const rimLight = new THREE.PointLight(0x06b6d4, 2.0, 500);
    rimLight.position.set(-200, -100, -100);
    scene.add(rimLight);

    // 4. Master Earth Globe Group
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const globeRadius = 90;

    // A. Textured Surface Mesh
    const earthTexture = createEarthCanvasTexture();
    const earthGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.55,
      metalness: 0.1,
      emissive: new THREE.Color(0x042416),
      emissiveIntensity: 0.35,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // B. Atmospheric Cloud Layer
    const cloudTexture = createCloudCanvasTexture();
    const cloudGeo = new THREE.SphereGeometry(globeRadius * 1.018, 48, 48);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      roughness: 1.0,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    earthGroup.add(cloudMesh);

    // C. Glowing Cyber-Atmosphere Outer Halo
    const haloGeo = new THREE.SphereGeometry(globeRadius * 1.14, 32, 32);
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          gl_FragColor = vec4(0.06, 0.82, 0.55, 1.0) * intensity * 1.6;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    earthGroup.add(haloMesh);

    // D. Outer Holographic Wireframe Cage
    const wireGeo = new THREE.IcosahedronGeometry(globeRadius * 1.05, 3);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.09,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    earthGroup.add(wireMesh);

    // 5. Orbiting Eco-Planets / "Planto" Celestial Bodies
    // Planto-1: "Verdant-Prime" (Lush Flora Biosphere with Mini Saturn Rings)
    const planto1Group = new THREE.Group();
    scene.add(planto1Group);

    const planto1Geo = new THREE.SphereGeometry(7.5, 24, 24);
    const planto1Mat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x059669,
      emissiveIntensity: 0.4,
      roughness: 0.4,
    });
    const planto1Mesh = new THREE.Mesh(planto1Geo, planto1Mat);
    planto1Group.add(planto1Mesh);

    // Mini Saturn ring around Planto-1
    const p1RingGeo = new THREE.RingGeometry(10.5, 15.5, 32);
    const p1RingMat = new THREE.MeshBasicMaterial({
      color: 0x6ee7b7,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const p1Ring = new THREE.Mesh(p1RingGeo, p1RingMat);
    p1Ring.rotation.x = Math.PI / 2.3;
    planto1Group.add(p1Ring);

    // Planto-2: "Aura-Azure" (Crystalline Ice & Ocean Satellite)
    const planto2Group = new THREE.Group();
    scene.add(planto2Group);

    const planto2Geo = new THREE.SphereGeometry(5.2, 20, 20);
    const planto2Mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8,
    });
    const planto2Mesh = new THREE.Mesh(planto2Geo, planto2Mat);
    planto2Group.add(planto2Mesh);

    // Planto-3: "Solar-Mote" (Warm Golden Energy Biosphere)
    const planto3Group = new THREE.Group();
    scene.add(planto3Group);

    const planto3Geo = new THREE.SphereGeometry(4.0, 16, 16);
    const planto3Mat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });
    const planto3Mesh = new THREE.Mesh(planto3Geo, planto3Mat);
    planto3Group.add(planto3Mesh);

    // Orbit Trajectory Guide Rings
    const orbits = [
      { radiusX: 165, radiusY: 145, tiltX: 0.35, tiltY: 0.2, color: 0x10b981, group: planto1Group, speed: 0.45 },
      { radiusX: 205, radiusY: 185, tiltX: -0.55, tiltY: 0.4, color: 0x06b6d4, group: planto2Group, speed: 0.32 },
      { radiusX: 240, radiusY: 220, tiltX: 0.7, tiltY: -0.3, color: 0xf59e0b, group: planto3Group, speed: 0.22 },
    ];

    orbits.forEach((orb) => {
      const curvePoints: THREE.Vector3[] = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = Math.cos(theta) * orb.radiusX;
        const z = Math.sin(theta) * orb.radiusY;
        const v = new THREE.Vector3(x, 0, z);
        v.applyAxisAngle(new THREE.Vector3(1, 0, 0), orb.tiltX);
        v.applyAxisAngle(new THREE.Vector3(0, 1, 0), orb.tiltY);
        curvePoints.push(v);
      }
      const orbGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const orbMat = new THREE.LineBasicMaterial({
        color: orb.color,
        transparent: true,
        opacity: 0.25,
      });
      const orbLine = new THREE.LineLoop(orbGeo, orbMat);
      scene.add(orbLine);
    });

    // 6. Real-Time Telemetry Beacons (Delhi, Mumbai, Bengaluru, Hyderabad, etc.)
    const beaconCoords = [
      { lat: 28.6139, lng: 77.209, color: 0xef4444 }, // Delhi
      { lat: 19.076, lng: 72.8777, color: 0xf59e0b }, // Mumbai
      { lat: 12.9716, lng: 77.5946, color: 0x10b981 }, // Bengaluru
      { lat: 17.385, lng: 78.4867, color: 0x06b6d4 }, // Hyderabad
      { lat: 22.5726, lng: 88.3639, color: 0x8b5cf6 }, // Kolkata
      { lat: 51.5074, lng: -0.1278, color: 0x10b981 }, // London
      { lat: 40.7128, lng: -74.006, color: 0x06b6d4 }, // New York
    ];

    const beaconPillars: THREE.Mesh[] = [];
    const beaconRings: THREE.Mesh[] = [];

    beaconCoords.forEach((b) => {
      const phi = (90 - b.lat) * (Math.PI / 180);
      const theta = (b.lng + 180) * (Math.PI / 180);

      const x = -(globeRadius * Math.sin(phi) * Math.cos(theta));
      const z = globeRadius * Math.sin(phi) * Math.sin(theta);
      const y = globeRadius * Math.cos(phi);

      // Light beam pointing radially outward
      const beamGeo = new THREE.CylinderGeometry(0.7, 0.7, 20, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: b.color,
        transparent: true,
        opacity: 0.8,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(x, y, z);
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, y, z).normalize());
      beam.translateY(10);
      earthGroup.add(beam);
      beaconPillars.push(beam);

      // Expanding concentric surface wave ring
      const ringGeo = new THREE.RingGeometry(1.5, 4.0, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: b.color,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, y, z);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(x, y, z).normalize());
      earthGroup.add(ring);
      beaconRings.push(ring);
    });

    // 7. Celestial Starfield & Floating Bio-Luminescent Spores
    const starCount = 1800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starCols = new Float32Array(starCount * 3);

    const starEmerald = new THREE.Color(0x34d399);
    const starCyan = new THREE.Color(0x38bdf8);
    const starGold = new THREE.Color(0xfde047);
    const starWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < starCount; i++) {
      const r = 320 + Math.random() * 500;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);

      starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      starPos[i * 3 + 2] = r * Math.cos(ph);

      const roll = Math.random();
      const col = roll < 0.4 ? starWhite : roll < 0.65 ? starEmerald : roll < 0.85 ? starCyan : starGold;
      starCols[i * 3] = col.r;
      starCols[i * 3 + 1] = col.g;
      starCols[i * 3 + 2] = col.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCols, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 8. Foreground Ecological Sensor Particles
    const sensorGeo = new THREE.BufferGeometry();
    const sensorPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      sensorPos[i * 3] = (Math.random() - 0.5) * 550;
      sensorPos[i * 3 + 1] = (Math.random() - 0.5) * 350;
      sensorPos[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    sensorGeo.setAttribute('position', new THREE.BufferAttribute(sensorPos, 3));

    const sensorMat = new THREE.PointsMaterial({
      size: 1.8,
      color: 0x10b981,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const sensorField = new THREE.Points(sensorGeo, sensorMat);
    scene.add(sensorField);

    // 9. Interactive Mouse Parallax Easing
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0.15;
    let targetRotY = 0;

    const onPointerMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / width;
      const ny = (e.clientY - rect.top) / height;
      mouseX = (nx - 0.5) * 2;
      mouseY = (ny - 0.5) * 2;

      targetRotY = mouseX * 0.75;
      targetRotX = 0.15 - mouseY * 0.45;
    };

    window.addEventListener('mousemove', onPointerMove);

    // 10. Responsive Window Resizing
    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth || window.innerWidth;
      const nh = container.clientHeight || window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    window.addEventListener('resize', onResize);

    // 11. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Earth rotation + interactive mouse easing
      earthGroup.rotation.y += 0.003;
      earthGroup.rotation.y += (targetRotY - earthGroup.rotation.y) * 0.04;
      earthGroup.rotation.x += (targetRotX - earthGroup.rotation.x) * 0.04;

      // Independent cloud layer rotation for atmospheric depth
      cloudMesh.rotation.y += 0.0042;

      // Rotate starfield slowly in reverse
      starField.rotation.y = -time * 0.0008;

      // Gentle floating drift of sensor particles
      sensorField.rotation.y = time * 0.0015;
      sensorField.rotation.x = Math.sin(time * 0.2) * 0.05;

      // Animate Planto planets along their elliptical orbits
      orbits.forEach((orb) => {
        const angle = time * orb.speed;
        const x = Math.cos(angle) * orb.radiusX;
        const z = Math.sin(angle) * orb.radiusY;
        const v = new THREE.Vector3(x, 0, z);
        v.applyAxisAngle(new THREE.Vector3(1, 0, 0), orb.tiltX);
        v.applyAxisAngle(new THREE.Vector3(0, 1, 0), orb.tiltY);
        orb.group.position.copy(v);
        orb.group.rotation.y += 0.02;
      });

      // Pulse beacon pillars and expanding wave rings
      const pulse = 1 + Math.sin(time * 4) * 0.25;
      beaconPillars.forEach((p) => p.scale.set(1, pulse, 1));

      const ringScale = 1 + (Math.sin(time * 3) + 1) * 0.3;
      beaconRings.forEach((r) => r.scale.set(ringScale, ringScale, ringScale));

      renderer.render(scene, camera);
    };

    animate();

    // 12. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('resize', onResize);

      earthGeo.dispose();
      earthMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      planto1Geo.dispose();
      planto1Mat.dispose();
      p1RingGeo.dispose();
      p1RingMat.dispose();
      planto2Geo.dispose();
      planto2Mat.dispose();
      planto3Geo.dispose();
      planto3Mat.dispose();
      starGeo.dispose();
      starMat.dispose();
      sensorGeo.dispose();
      sensorMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive, particleCount]);

  return <div ref={containerRef} className={className} style={{ minHeight: '100%' }} />;
};
