import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface EcoGlobe3DProps {
  interactive?: boolean;
  className?: string;
  particleCount?: number;
}

export const EcoGlobe3D: React.FC<EcoGlobe3DProps> = ({
  interactive = true,
  className = 'w-full h-full absolute inset-0 pointer-events-none',
  particleCount = 1800,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040906, 0.0018);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.z = 280;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Main Group for rotation
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 3. Central Wireframe Globe
    const globeRadius = 100;
    const sphereGeometry = new THREE.SphereGeometry(globeRadius, 36, 36);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const globeMesh = new THREE.Mesh(sphereGeometry, wireframeMaterial);
    globeGroup.add(globeMesh);

    // Inner Dark Core with subtle cyan glow
    const coreGeometry = new THREE.SphereGeometry(globeRadius * 0.98, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x03180e,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    globeGroup.add(coreMesh);

    // 4. Orbital Rings (Atmospheric Troposphere & Stratosphere layers)
    const ringRadii = [globeRadius * 1.15, globeRadius * 1.35, globeRadius * 1.6];
    const ringColors = [0x10b981, 0x06b6d4, 0x34d399];
    const ringTilts = [0.35, -0.45, 0.2];

    const rings: THREE.LineLoop[] = [];
    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      const segments = 120;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0));
      }
      ringGeo.setFromPoints(points);
      const ringMat = new THREE.LineBasicMaterial({
        color: ringColors[idx],
        transparent: true,
        opacity: 0.25 - idx * 0.05,
      });
      const ring = new THREE.LineLoop(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + ringTilts[idx];
      ring.rotation.y = ringTilts[idx] * 2;
      globeGroup.add(ring);
      rings.push(ring);
    });

    // 5. Ambient Atmospheric Particles (Air & Ecological Sensors)
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const emerald = new THREE.Color(0x10b981);
    const cyan = new THREE.Color(0x06b6d4);
    const lime = new THREE.Color(0x34d399);

    for (let i = 0; i < particleCount; i++) {
      // Distribute particles in a spherical shell around the globe
      const radius = globeRadius * (0.95 + Math.random() * 1.4);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Random color gradient between emerald, cyan, and lime
      const randColor = Math.random();
      const color = randColor < 0.6 ? emerald : randColor < 0.85 ? cyan : lime;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    globeGroup.add(particles);

    // 6. Geographic Beacons (Pulsing Pollution Monitoring Beacons)
    // Key coordinates: Delhi, Mumbai, Bengaluru, Hyderabad, London, New York, Tokyo
    const beaconCoords = [
      { lat: 28.6139, lng: 77.209, color: 0xef4444, label: 'Delhi Sensor' }, // Critical
      { lat: 17.385, lng: 78.4867, color: 0x10b981, label: 'Hyderabad Hub' },
      { lat: 19.076, lng: 72.8777, color: 0xf59e0b, label: 'Mumbai Marine' },
      { lat: 12.9716, lng: 77.5946, color: 0x06b6d4, label: 'Bengaluru Lake' },
      { lat: 22.5726, lng: 88.3639, color: 0x8b5cf6, label: 'Kolkata River' },
      { lat: 51.5074, lng: -0.1278, color: 0x10b981, label: 'London Node' },
      { lat: 35.6762, lng: 139.6503, color: 0x06b6d4, label: 'Tokyo Station' },
    ];

    const beaconPillars: THREE.Mesh[] = [];
    beaconCoords.forEach((b) => {
      // Convert lat/lng to spherical coordinates
      const phi = (90 - b.lat) * (Math.PI / 180);
      const theta = (b.lng + 180) * (Math.PI / 180);

      const x = -(globeRadius * Math.sin(phi) * Math.cos(theta));
      const z = globeRadius * Math.sin(phi) * Math.sin(theta);
      const y = globeRadius * Math.cos(phi);

      // Create a vertical light beam pointing outwards from globe surface
      const beamGeo = new THREE.CylinderGeometry(0.6, 0.6, 16, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: b.color,
        transparent: true,
        opacity: 0.85,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);

      // Position and orient outward
      beam.position.set(x, y, z);
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, y, z).normalize());
      beam.translateY(8); // Shift center along normal
      globeGroup.add(beam);
      beaconPillars.push(beam);

      // Beacon surface pulsing ring
      const beaconRingGeo = new THREE.RingGeometry(1.5, 3.0, 16);
      const beaconRingMat = new THREE.MeshBasicMaterial({
        color: b.color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const beaconRing = new THREE.Mesh(beaconRingGeo, beaconRingMat);
      beaconRing.position.set(x, y, z);
      beaconRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(x, y, z).normalize());
      globeGroup.add(beaconRing);
    });

    // 7. Mouse interaction parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0.2;
    let targetRotationY = 0;

    const handlePointerMove = (event: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      mouseX = (x / width) * 2 - 1;
      mouseY = -(y / height) * 2 + 1;

      targetRotationY = mouseX * 0.8;
      targetRotationX = 0.2 - mouseY * 0.5;
    };

    window.addEventListener('mousemove', handlePointerMove);

    // 8. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 9. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Constant slow rotation + smooth mouse easing
      globeGroup.rotation.y += 0.0035;
      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.03;
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.03;

      // Pulse atmospheric rings
      rings.forEach((ring, idx) => {
        ring.rotation.z = elapsedTime * (0.05 + idx * 0.02);
      });

      // Pulse beacon pillars
      const pulseScale = 1 + Math.sin(elapsedTime * 4) * 0.25;
      beaconPillars.forEach((pillar) => {
        pillar.scale.set(1, pulseScale, 1);
      });

      renderer.render(scene, camera);
    };

    animate();

    // 10. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      sphereGeometry.dispose();
      wireframeMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive, particleCount]);

  return <div ref={containerRef} className={className} style={{ minHeight: '100%' }} />;
};
