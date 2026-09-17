import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import confetti from "canvas-confetti";
import { soundFX } from "../lib/soundFX";
import {
  Crosshair,
  Zap,
  RotateCcw,
  Home,
  Volume2,
  VolumeX,
  Trophy,
  ShieldAlert,
  Flame,
  Activity,
  Gauge,
  Sparkles,
  Maximize2
} from "lucide-react";

type GameMode = "AIM" | "CLICK" | "SNIPER";
type Difficulty = "EASY" | "NORMAL" | "HARD";

interface HighScores {
  aimKills: number;
  aimWave: number;
  clickCount: number;
  clickCPS: number;
}

const STORAGE_KEY = "neon_aim_trainer_highscores_v1";

export default function AimTrainerApp() {
  const mountRef = useRef<HTMLDivElement>(null);

  // Game UI State
  const [currentMode, setCurrentMode] = useState<GameMode | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("NORMAL");
  const [muted, setMuted] = useState<boolean>(false);

  // Aim Mode Stats
  const [aimScore, setAimScore] = useState<number>(0);
  const [aimKills, setAimKills] = useState<number>(0);
  const [aimWave, setAimWave] = useState<number>(1);
  const [aimCombo, setAimCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [aimShots, setAimShots] = useState<number>(0);
  const [aimHits, setAimHits] = useState<number>(0);
  const [closestEnemyDist, setClosestEnemyDist] = useState<number>(100);

  // Click Mode Stats
  const [clickCount, setClickCount] = useState<number>(0);
  const [clickTimeLeft, setClickTimeLeft] = useState<number>(10);
  const [clickPeakCPS, setClickPeakCPS] = useState<number>(0);
  const [clickScale, setClickScale] = useState<number>(1);

  // Sniper Mode Stats
  const [sniperTimeLeft, setSniperTimeLeft] = useState<number>(30);
  const [sniperKills, setSniperKills] = useState<number>(0);
  const [sniperShots, setSniperShots] = useState<number>(0);
  const [isScoped, setIsScoped] = useState<boolean>(false);
  const [scopeMarkers, setScopeMarkers] = useState<Array<{ id: number; x: number; y: number; hidden: boolean }>>([]);

  // Game Over Modal State
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameOverReason, setGameOverReason] = useState<string>("");

  // Persistent High Scores
  const [highScores, setHighScores] = useState<HighScores>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return { aimKills: 0, aimWave: 1, clickCount: 0, clickCPS: 0 };
  });

  // Crosshair laser mouse position
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [cursorDown, setCursorDown] = useState(false);
  const aimCursorRef = useRef({ x: -100, y: -100 });
  const lastMouseRef = useRef({ x: -100, y: -100 });
  const activeModeRef = useRef<GameMode | null>(null);
  const scopedRef = useRef<boolean>(false);
  const scopeUpdateAtRef = useRef<number>(0);

  // Internal Three.js Game Engine Refs
  const engineRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    targetTexture: THREE.Texture;
    targets: Array<{
      mesh: THREE.Sprite;
      speed: number;
      hp: number;
      id: number;
      pulseOffset: number;
      baseScale: number;
    }>;
    particles: THREE.Points;
    particlePositions: Float32Array;
    particleVelocities: Float32Array;
    particleLifetimes: Float32Array;
    particleCount: number;
    animationFrameId: number;
    mouseRay: THREE.Vector2;
    raycaster: THREE.Raycaster;
  } | null>(null);

  // Sync highscores
  const updateHighScores = useCallback((updates: Partial<HighScores>) => {
    setHighScores((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  // -------------------------------------------------------------
  // Initialize Three.js Scene
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04050d);
    scene.fog = new THREE.FogExp2(0x060714, 0.006);

    // 2. Camera: balanced height and view angle
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    // Pull the camera back slightly so the safe arrival frustum is wider.
    camera.position.set(0, 3.2, 14.0);
    camera.lookAt(0, 3.2, -25);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.replaceChildren(renderer.domElement);

    // 4. Background Arena Backdrop
    const textureLoader = new THREE.TextureLoader();
    const bgTexture = textureLoader.load("/manus-storage/arena_bg_35240ab8.png");
    bgTexture.colorSpace = THREE.SRGBColorSpace;
    const targetTexture = textureLoader.load("/manus-storage/target_orb_sharp_8fcd78d3.png");
    targetTexture.colorSpace = THREE.SRGBColorSpace;
    targetTexture.magFilter = THREE.LinearFilter;
    targetTexture.minFilter = THREE.LinearMipmapLinearFilter;
    targetTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // Arena backdrop plane far behind
    const bgPlaneGeo = new THREE.PlaneGeometry(150, 95);
    const bgPlaneMat = new THREE.MeshBasicMaterial({
      map: bgTexture,
      transparent: true,
      opacity: 0.95,
    });
    const bgPlane = new THREE.Mesh(bgPlaneGeo, bgPlaneMat);
    bgPlane.position.set(0, 4, -50);
    scene.add(bgPlane);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00f0ff, 4, 60);
    cyanLight.position.set(-10, 6, -15);
    scene.add(cyanLight);

    const pinkLight = new THREE.PointLight(0xff007f, 4, 60);
    pinkLight.position.set(10, 6, -15);
    scene.add(pinkLight);

    // 6. Ground Neon Grid Floor
    const gridHelper = new THREE.GridHelper(160, 40, 0x00f0ff, 0x1b1f3b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Subtle reflective black floor beneath grid
    const floorGeo = new THREE.PlaneGeometry(160, 160);
    const floorMat = new THREE.MeshBasicMaterial({
      color: 0x020308,
      transparent: true,
      opacity: 0.18,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.01;
    scene.add(floorMesh);

    // 7. Particle Spark System
    const PARTICLE_COUNT = 300;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleVelocities = new Float32Array(PARTICLE_COUNT * 3);
    const particleLifetimes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particlePositions[i * 3 + 0] = 0;
      particlePositions[i * 3 + 1] = -100;
      particlePositions[i * 3 + 2] = 0;
      particleLifetimes[i] = 0;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.4,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Store engine reference
    engineRef.current = {
      scene,
      camera,
      renderer,
      targetTexture,
      targets: [],
      particles,
      particlePositions,
      particleVelocities,
      particleLifetimes,
      particleCount: PARTICLE_COUNT,
      animationFrameId: 0,
      mouseRay: new THREE.Vector2(),
      raycaster: new THREE.Raycaster(),
    };

    // Auto-check URL parameters for testing modes
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get("mode");
    if (modeParam === "aim") {
      setTimeout(() => startAimMode(), 150);
    } else if (modeParam === "click") {
      setTimeout(() => startClickMode(), 150);
    } else if (modeParam === "sniper") {
      setTimeout(() => startSniperMode(), 150);
    } else if (modeParam === "gameover") {
      setTimeout(() => {
        setCurrentMode("AIM");
        setIsGameOver(true);
        setGameOverReason("적 표적이 방어선(2.5m)을 돌파했습니다!");
        setAimKills(24);
        setAimWave(4);
        setAimShots(28);
        setAimHits(24);
        setMaxCombo(12);
        setAimScore(15600);
      }, 150);
    }

    // Resize Handler
    const handleResize = () => {
      if (!container || !engineRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 8. Main Render & Physics Loop
    let lastTime = performance.now();
    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const engine = engineRef.current;
      if (engine) {
        const targetFov = scopedRef.current ? 34 : 60;
        camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 10);
        camera.updateProjectionMatrix();
        // Update active targets
        let minDistanceToPlayer = 100;
        for (let i = engine.targets.length - 1; i >= 0; i--) {
          const item = engine.targets[i];
          if (activeModeRef.current === "SNIPER") {
            const sniperState = item.mesh.userData as {
              phase: number;
              elapsed: number;
              hidden: boolean;
            };
            sniperState.elapsed += dt;
            // Larger, faster sweep so the sniper target crosses a wider area
            // before returning, while the frustum clamp below keeps it safe.
            item.mesh.position.x += Math.sin(sniperState.elapsed * 1.6 + sniperState.phase) * dt * 3.4;
            item.mesh.position.y += Math.cos(sniperState.elapsed * 1.35 + sniperState.phase) * dt * 2.2;

            // Recalculate the safe movement box from the live camera FOV.
            // This is important while scoped because the zoomed viewport is
            // much narrower than the normal camera view.
            const sniperDistance = Math.max(1, camera.position.z - item.mesh.position.z);
            const sniperHalfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * sniperDistance;
            const sniperHalfWidth = sniperHalfHeight * camera.aspect;
            const sniperMargin = item.baseScale * 0.45 + 0.2;
            const safeMinX = camera.position.x - sniperHalfWidth + sniperMargin;
            const safeMaxX = camera.position.x + sniperHalfWidth - sniperMargin;
            const safeMinY = camera.position.y - sniperHalfHeight + sniperMargin;
            const safeMaxY = camera.position.y + sniperHalfHeight - sniperMargin;
            item.mesh.position.x = THREE.MathUtils.clamp(item.mesh.position.x, safeMinX, safeMaxX);
            item.mesh.position.y = THREE.MathUtils.clamp(item.mesh.position.y, safeMinY, safeMaxY);

            // Targets are completely cloaked until the player holds right-click.
            // Once scoped, the moving target is revealed for the shot.
            const projectedTarget = item.mesh.position.clone().project(camera);
            const targetScreenX = (projectedTarget.x * 0.5 + 0.5) * window.innerWidth;
            const targetScreenY = (-projectedTarget.y * 0.5 + 0.5) * window.innerHeight;
            const scopeRadius = Math.min(window.innerWidth, window.innerHeight) * 0.24;
            const insideAimArea = Math.hypot(aimCursorRef.current.x - targetScreenX, aimCursorRef.current.y - targetScreenY) <= scopeRadius;
            const shouldHide = !scopedRef.current || !insideAimArea;
            sniperState.hidden = shouldHide;
            // Always sync the render visibility because a target can spawn
            // while unscoped with the same hidden-state value already set.
            item.mesh.visible = !shouldHide;
            if (shouldHide) continue;
          }
          // Approach camera
          if (activeModeRef.current !== "SNIPER") {
            item.mesh.position.z += item.speed * dt * 60;
          }
          // Pulse scale subtly
          const pulse = 1 + Math.sin(currentTime * 0.008 + item.pulseOffset) * 0.1;
          const s = item.baseScale * pulse;
          item.mesh.scale.set(s, s, 1);

          const dist = 14.0 - item.mesh.position.z;
          if (dist < minDistanceToPlayer) {
            minDistanceToPlayer = dist;
          }

          // Check breach threshold (when passing z = 4.0)
          if (item.mesh.position.z >= 4.0) {
            scene.remove(item.mesh);
            engine.targets.splice(i, 1);
            triggerGameOver("적 표적이 방어선(3.0m)을 돌파했습니다!");
            break;
          }
        }
        setClosestEnemyDist(Math.max(0, parseFloat(minDistanceToPlayer.toFixed(1))));

        if (activeModeRef.current === "SNIPER" && scopedRef.current && currentTime - scopeUpdateAtRef.current > 100) {
          scopeUpdateAtRef.current = currentTime;
          const markers = engine.targets.map((target) => {
            const projected = target.mesh.position.clone().project(engine.camera);
            return {
              id: target.id,
              x: (projected.x * 0.5 + 0.5) * window.innerWidth,
              y: (-projected.y * 0.5 + 0.5) * window.innerHeight,
              hidden: !target.mesh.visible,
            };
          }).filter((marker) => {
            const distance = Math.hypot(aimCursorRef.current.x - marker.x, aimCursorRef.current.y - marker.y);
            return distance <= Math.min(window.innerWidth, window.innerHeight) * 0.24;
          });
          setScopeMarkers(markers);
        }

        // Update Particle Sparks
        const posAttr = engine.particles.geometry.attributes.position;
        let pChanged = false;
        for (let i = 0; i < engine.particleCount; i++) {
          if (engine.particleLifetimes[i] > 0) {
            engine.particleLifetimes[i] -= dt;
            engine.particlePositions[i * 3 + 0] += engine.particleVelocities[i * 3 + 0] * dt;
            engine.particlePositions[i * 3 + 1] += engine.particleVelocities[i * 3 + 1] * dt;
            engine.particlePositions[i * 3 + 2] += engine.particleVelocities[i * 3 + 2] * dt;
            pChanged = true;
          } else {
            engine.particlePositions[i * 3 + 1] = -100;
          }
        }
        if (pChanged) {
          posAttr.needsUpdate = true;
        }

        renderer.render(scene, camera);
      }

      engineRef.current!.animationFrameId = requestAnimationFrame(loop);
    };

    engineRef.current.animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (engineRef.current) {
        cancelAnimationFrame(engineRef.current.animationFrameId);
        renderer.dispose();
      }
    };
  }, []);

  // -------------------------------------------------------------
  // Particle Spawner
  // -------------------------------------------------------------
  const spawnHitSparks = (pos: THREE.Vector3) => {
    const engine = engineRef.current;
    if (!engine) return;

    let spawned = 0;
    for (let i = 0; i < engine.particleCount && spawned < 28; i++) {
      if (engine.particleLifetimes[i] <= 0) {
        engine.particlePositions[i * 3 + 0] = pos.x;
        engine.particlePositions[i * 3 + 1] = pos.y;
        engine.particlePositions[i * 3 + 2] = pos.z;

        // Radial velocity burst
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 5 + Math.random() * 9;

        engine.particleVelocities[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * speed;
        engine.particleVelocities[i * 3 + 1] = Math.cos(phi) * speed;
        engine.particleVelocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;

        engine.particleLifetimes[i] = 0.5 + Math.random() * 0.25;
        spawned++;
      }
    }
  };

  // -------------------------------------------------------------
  // Aim Mode Target Spawning Logic
  // -------------------------------------------------------------
  const spawnWaveTargets = (waveNum: number, diff: Difficulty) => {
    const engine = engineRef.current;
    if (!engine) return;

    // Difficulty multipliers
    const speedMult = diff === "EASY" ? 0.05 : diff === "NORMAL" ? 0.08 : 0.12;
    const waveCount = 3 + waveNum;

    for (let i = 0; i < waveCount; i++) {
      const spriteMat = new THREE.SpriteMaterial({
        map: engine.targetTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(spriteMat);
      
      // Prominent target size (2.8 units)
      const baseScale = 2.55;
      sprite.scale.set(baseScale, baseScale, 1);

      // Camera-safe launch volume: each target locks its x/y position and flies
      // straight toward the player on the z-axis with no lateral drift. The
      // range is calculated from the camera frustum so the full sprite remains
      // visible even at the breach line.
      const safeZ = 4.0;
      const distanceToCamera = engine.camera.position.z - safeZ;
      const halfHeightAtSafeZ = Math.tan(THREE.MathUtils.degToRad(engine.camera.fov / 2)) * distanceToCamera;
      const halfWidthAtSafeZ = halfHeightAtSafeZ * engine.camera.aspect;
      const targetHalfSize = baseScale / 2;
      const viewportMargin = 0.35;
      const safeX = Math.max(0.8, halfWidthAtSafeZ - targetHalfSize - viewportMargin);
      const safeYMin = engine.camera.position.y - halfHeightAtSafeZ + targetHalfSize + viewportMargin;
      const safeYMax = engine.camera.position.y + halfHeightAtSafeZ - targetHalfSize - viewportMargin;
      const minX = -safeX;
      const maxX = safeX;
      const minY = Math.max(0.8, safeYMin);
      const maxY = Math.max(minY + 0.4, safeYMax);
      const minZ = -54;
      const maxZ = -20;

      const posX = minX + Math.random() * (maxX - minX);
      const posY = minY + Math.random() * (maxY - minY);
      const posZ = minZ + Math.random() * (maxZ - minZ);

      sprite.position.set(posX, posY, posZ);

      engine.scene.add(sprite);
      engine.targets.push({
        mesh: sprite,
        speed: speedMult + waveNum * 0.008,
        hp: 1,
        id: Date.now() + Math.random(),
        pulseOffset: Math.random() * 10,
        baseScale,
      });
    }
  };

  const spawnSniperTarget = () => {
    const engine = engineRef.current;
    if (!engine) return;

    clearTargets();
    const spriteMat = new THREE.SpriteMaterial({
      map: engine.targetTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 1,
    });
    const sprite = new THREE.Sprite(spriteMat);
    const baseScale = 2.35;
    sprite.scale.set(baseScale, baseScale, 1);
    sprite.visible = scopedRef.current;

    // Random position inside the camera-safe frustum. The target moves on
    // screen but never travels outside this generous sniper practice area.
    const safeZ = -16;
    const distanceToCamera = engine.camera.position.z - safeZ;
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(engine.camera.fov / 2)) * distanceToCamera;
    const halfWidth = halfHeight * engine.camera.aspect;
    const margin = baseScale / 2 + 0.7;
    const safeX = Math.max(1, halfWidth - margin);
    const safeYMin = engine.camera.position.y - halfHeight + margin;
    const safeYMax = engine.camera.position.y + halfHeight - margin;

    sprite.position.set(
      THREE.MathUtils.randFloat(-safeX, safeX),
      THREE.MathUtils.randFloat(Math.max(1, safeYMin), Math.max(safeYMin + 0.5, safeYMax)),
      safeZ,
    );
    sprite.userData = {
      phase: Math.random() * Math.PI * 2,
      elapsed: 0,
      hidden: false,
    };
    engine.scene.add(sprite);
    engine.targets.push({
      mesh: sprite,
      speed: 0,
      hp: 1,
      id: Date.now() + Math.random(),
      pulseOffset: Math.random() * 10,
      baseScale,
    });
  };

  // Clear 3D active targets
  const clearTargets = () => {
    const engine = engineRef.current;
    if (!engine) return;
    for (const item of engine.targets) {
      engine.scene.remove(item.mesh);
    }
    engine.targets = [];
  };

  // -------------------------------------------------------------
  // Start Modes
  // -------------------------------------------------------------
  const startAimMode = () => {
    clearTargets();
    activeModeRef.current = "AIM";
    scopedRef.current = false;
    setIsScoped(false);
    setScopeMarkers([]);
    setCurrentMode("AIM");
    setIsPlaying(true);
    setIsGameOver(false);
    setGameOverReason("");

    setAimScore(0);
    setAimKills(0);
    setAimWave(1);
    setAimCombo(0);
    setMaxCombo(0);
    setAimShots(0);
    setAimHits(0);

    spawnWaveTargets(1, difficulty);
  };

  const startClickMode = () => {
    clearTargets();
    activeModeRef.current = "CLICK";
    scopedRef.current = false;
    setIsScoped(false);
    setScopeMarkers([]);
    setCurrentMode("CLICK");
    setIsPlaying(true);
    setIsGameOver(false);
    setGameOverReason("");

    setClickCount(0);
    setClickTimeLeft(10);
    setClickPeakCPS(0);
  };

  const startSniperMode = () => {
    activeModeRef.current = "SNIPER";
    scopedRef.current = false;
    setIsScoped(false);
    setScopeMarkers([]);
    setCurrentMode("SNIPER");
    setIsPlaying(true);
    setIsGameOver(false);
    setGameOverReason("");
    setSniperTimeLeft(30);
    setSniperKills(0);
    setSniperShots(0);
    spawnSniperTarget();
  };

  // Trigger Game Over
  const triggerGameOver = (reason: string) => {
    setIsPlaying(false);
    activeModeRef.current = null;
    scopedRef.current = false;
    setIsScoped(false);
    setScopeMarkers([]);
    setIsGameOver(true);
    setGameOverReason(reason);
    soundFX.playFanfare(false);

    // Update records
    if (currentMode === "AIM") {
      setAimKills((prevKills) => {
        if (prevKills > highScores.aimKills) {
          updateHighScores({ aimKills: prevKills });
        }
        return prevKills;
      });
      setAimWave((prevWave) => {
        if (prevWave > highScores.aimWave) {
          updateHighScores({ aimWave: prevWave });
        }
        return prevWave;
      });
    }
  };

  // Click and sniper countdown timers
  useEffect(() => {
    if (!isPlaying || (currentMode !== "CLICK" && currentMode !== "SNIPER")) return;

    const timer = setInterval(() => {
      if (currentMode === "SNIPER") {
        setSniperTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsPlaying(false);
            setIsGameOver(true);
            activeModeRef.current = null;
            setGameOverReason("30초 저격 훈련 시간이 종료되었습니다!");
            soundFX.playFanfare(true);
            confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
            return 0;
          }
          prev <= 4 ? soundFX.playTick(true) : soundFX.playTick(false);
          return prev - 1;
        });
      } else {
        setClickTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsPlaying(false);
            setIsGameOver(true);
            activeModeRef.current = null;
            setGameOverReason("10초 제한 시간이 종료되었습니다!");
            soundFX.playFanfare(true);
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            return 0;
          }
          prev <= 4 ? soundFX.playTick(true) : soundFX.playTick(false);
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, currentMode]);

  // Click Mode Update High Scores on finish
  useEffect(() => {
    if (currentMode === "CLICK" && isGameOver && clickTimeLeft === 0) {
      const cps = parseFloat((clickCount / 10).toFixed(1));
      if (clickCount > highScores.clickCount) {
        updateHighScores({ clickCount, clickCPS: cps });
      }
    }
  }, [isGameOver, currentMode, clickTimeLeft, clickCount, highScores.clickCount, updateHighScores]);

  // -------------------------------------------------------------
  // Mouse & Shooting Interactions
  // -------------------------------------------------------------
  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const previous = lastMouseRef.current;
    const sensitivity = scopedRef.current ? 0.42 : 1;
    const nextX = scopedRef.current ? previous.x + (e.clientX - previous.x) * sensitivity : e.clientX;
    const nextY = scopedRef.current ? previous.y + (e.clientY - previous.y) * sensitivity : e.clientY;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    aimCursorRef.current = { x: nextX, y: nextY };
    setCursorPos({ x: nextX, y: nextY });

    const engine = engineRef.current;
    if (!engine) return;
    engine.mouseRay.x = (nextX / window.innerWidth) * 2 - 1;
    engine.mouseRay.y = -(nextY / window.innerHeight) * 2 + 1;
  };

  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 2 && currentMode === "SNIPER" && isPlaying) {
      scopedRef.current = true;
      setIsScoped(true);
      return;
    }
    if (e.button !== 0) return;
    setCursorDown(true);

    if (!isPlaying) return;
    if (currentMode === "SNIPER" && !scopedRef.current) return;

    if (currentMode === "AIM" || currentMode === "SNIPER") {
      soundFX.playLaserShoot();
      setAimShots((s) => s + 1);
      if (currentMode === "SNIPER") {
        setSniperShots((s) => s + 1);
      }

      const engine = engineRef.current;
      if (!engine) return;

      engine.raycaster.setFromCamera(engine.mouseRay, engine.camera);
      const aimPoint = aimCursorRef.current;
      const scopeRadius = Math.min(window.innerWidth, window.innerHeight) * 0.24;
      const isInsideScope = (mesh: THREE.Sprite) => {
        if (currentMode !== "SNIPER") return true;
        const projected = mesh.position.clone().project(engine.camera);
        const screenX = (projected.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-projected.y * 0.5 + 0.5) * window.innerHeight;
        return Math.hypot(aimPoint.x - screenX, aimPoint.y - screenY) <= scopeRadius;
      };
      const meshes = engine.targets.filter((t) => t.mesh.visible && isInsideScope(t.mesh)).map((t) => t.mesh);
      const intersects = engine.raycaster.intersectObjects(meshes);

      // Sprite raycasts can become overly strict at long distance. Add a
      // forgiving screen-space check so a click on the visible target still
      // counts even when the 3D ray misses the transparent edge pixels.
      let hitTarget = intersects.length > 0 ? intersects[0].object as THREE.Sprite : null;
      if (!hitTarget) {
        let closestTarget: THREE.Sprite | null = null;
        let closestPixelDistance = Number.POSITIVE_INFINITY;
        for (const target of engine.targets) {
          if (!target.mesh.visible) continue;
          const projected = target.mesh.position.clone().project(engine.camera);
          if (projected.z < -1 || projected.z > 1) continue;

          const targetScreenX = (projected.x * 0.5 + 0.5) * window.innerWidth;
          const targetScreenY = (-projected.y * 0.5 + 0.5) * window.innerHeight;
          const pixelDistance = Math.hypot(aimPoint.x - targetScreenX, aimPoint.y - targetScreenY);
          const cameraDistance = engine.camera.position.distanceTo(target.mesh.position);
          const hitRadius = Math.max(26, Math.min(78, 88 - cameraDistance * 0.85));

          const insideScope = currentMode !== "SNIPER" || pixelDistance <= scopeRadius;
          if (insideScope && pixelDistance <= hitRadius && pixelDistance < closestPixelDistance) {
            closestTarget = target.mesh;
            closestPixelDistance = pixelDistance;
          }
        }
        hitTarget = closestTarget;
      }

      if (hitTarget) {
        // Target hit!
        const hitSprite = hitTarget;
        const hitPos = hitSprite.position.clone();

        spawnHitSparks(hitPos);

        // Remove from scene & targets list
        engine.scene.remove(hitSprite);
        engine.targets = engine.targets.filter((t) => t.mesh !== hitSprite);

        if (currentMode === "SNIPER") {
          setSniperKills((kills) => {
            const nextKills = kills + 1;
            if (nextKills % 5 === 0) {
              confetti({
                particleCount: 45,
                spread: 55,
                origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
              });
            }
            return nextKills;
          });
          soundFX.playTargetHit(sniperKills + 1);
          setTimeout(() => {
            if (activeModeRef.current === "SNIPER" && isPlaying) {
              spawnSniperTarget();
            }
          }, 220);
          return;
        }

        // Update stats
        setAimHits((h) => h + 1);
        setAimKills((k) => {
          const nextKills = k + 1;
          if (nextKills > highScores.aimKills) {
            updateHighScores({ aimKills: nextKills });
          }
          return nextKills;
        });

        setAimCombo((c) => {
          const nextCombo = c + 1;
          setMaxCombo((m) => Math.max(m, nextCombo));
          soundFX.playTargetHit(nextCombo);
          setAimScore((sc) => sc + 100 * nextCombo);
          return nextCombo;
        });

        // Wave clear check
        if (engine.targets.length === 0) {
          setAimWave((w) => {
            const nextWave = w + 1;
            soundFX.playFanfare(true);
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight },
            });
            setTimeout(() => {
              if (isPlaying) {
                spawnWaveTargets(nextWave, difficulty);
              }
            }, 350);
            return nextWave;
          });
        }
      } else {
        // Missed shot resets combo
        setAimCombo(0);
      }
    } else if (currentMode === "CLICK") {
      soundFX.playCoreClick();
      setClickCount((c) => {
        const next = c + 1;
        const elapsed = Math.max(0.1, 10 - clickTimeLeft);
        const currentCPS = parseFloat((next / elapsed).toFixed(1));
        setClickPeakCPS((prev) => Math.max(prev, currentCPS));
        return next;
      });
      // Visual pulse
      setClickScale(1.15);
      setTimeout(() => setClickScale(1), 70);
    }
  };

  const handleContainerMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    setCursorDown(false);
    if (e.button === 2) {
      scopedRef.current = false;
      setIsScoped(false);
      setScopeMarkers([]);
    }
  };

  const toggleSound = () => {
    const isMuted = soundFX.toggleMute();
    setMuted(isMuted);
  };

  // Accuracy calculation
  const accuracy = aimShots > 0 ? ((aimHits / aimShots) * 100).toFixed(1) : "100.0";

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none bg-[#03040b] text-white font-sans"
      onMouseMove={handleContainerMouseMove}
      onMouseDown={handleContainerMouseDown}
      onMouseUp={handleContainerMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{ cursor: isPlaying ? "none" : "default" }}
    >
      {/* 3D WebGL Canvas Layer */}
      <div ref={mountRef} className="absolute inset-0 z-0 pointer-events-none" />

      {isScoped && currentMode === "SNIPER" && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at ${cursorPos.x}px ${cursorPos.y}px, transparent 0 23%, rgba(2,3,11,0.42) 24%, rgba(2,3,11,0.82) 58%)`,
            }}
          />
          <div className="absolute inset-0 border-[18px] border-black/70" />
          <div className="absolute w-[min(48vw,48vh)] h-[min(48vw,48vh)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-violet-300/80 shadow-[0_0_0_9999px_rgba(2,3,11,0.26),0_0_24px_rgba(167,139,250,0.8)]" style={{ left: cursorPos.x, top: cursorPos.y }} />
          <div className="absolute -translate-x-1/2 -translate-y-1/2 text-violet-200/80 text-xs font-mono tracking-[0.35em]" style={{ left: cursorPos.x, top: cursorPos.y }}>
            SCOPE ACTIVE
          </div>
          {scopeMarkers.map((marker) => (
            <div
              key={marker.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 ${
                marker.hidden ? "border-amber-300 border-dashed animate-pulse" : "border-red-400 shadow-[0_0_18px_#ff3355]"
              }`}
              style={{ left: marker.x, top: marker.y }}
            >
              <span className={`absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono ${marker.hidden ? "text-amber-200" : "text-red-200"}`}>
                {marker.hidden ? "CLOAKED" : "TARGET"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Cyber Grid Overlay Scanline Texture */}
      <div
        className="absolute inset-0 z-1 pointer-events-none opacity-20 mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.1) 0%, transparent 70%), linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 50%)",
          backgroundSize: "100% 100%, 100% 4px",
        }}
      />

      {/* Custom Neon Crosshair Cursor during gameplay */}
      {isPlaying && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
          style={{
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
            transform: `translate(-50%, -50%) scale(${cursorDown ? 0.85 : 1})`,
          }}
        >
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Outer rings */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/70 animate-pulse shadow-[0_0_15px_#00f0ff]" />
            <div className="absolute w-7 h-7 rounded-full border border-pink-500/80" />
            {/* Center dot */}
            <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#ffffff]" />
            {/* Cross ticks */}
            <div className="absolute w-3.5 h-[2px] -left-1.5 bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
            <div className="absolute w-3.5 h-[2px] -right-1.5 bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
            <div className="absolute h-3.5 w-[2px] -top-1.5 bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
            <div className="absolute h-3.5 w-[2px] -bottom-1.5 bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
          </div>
        </div>
      )}

      {/* Top Floating Header & Controls */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <Crosshair className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-pink-500">
              NEON // AIM TRAINER
            </h1>
            <p className="text-xs text-cyan-300/60 font-mono tracking-widest">
              CYBERNETIC REFLEX & CLICK SIMULATION
            </p>
          </div>
        </div>

        {/* Top Right Quick Bar */}
        <div className="flex items-center gap-3">
          {isPlaying && (
            <button
              onClick={() => {
                setIsPlaying(false);
                clearTargets();
                setCurrentMode(null);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white hover:border-cyan-400 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Home className="w-3.5 h-3.5" /> 로비
            </button>
          )}

          <button
            onClick={toggleSound}
            className={`p-2 rounded-lg border transition-all ${
              muted
                ? "bg-red-500/10 border-red-500/40 text-red-400"
                : "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 hover:shadow-[0_0_12px_rgba(0,240,255,0.4)]"
            }`}
            title={muted ? "음소거 해제" : "음소거"}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 1. LOBBY SCREEN (Clean Glassmorphism Cyberpunk Dashboard) */}
      {/* ========================================================= */}
      {!isPlaying && !isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-4xl p-8 rounded-2xl bg-slate-950/80 border border-cyan-500/40 shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Banner */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-xs font-mono text-cyan-300">
                <Sparkles className="w-3.5 h-3.5" /> REFINED CYBERPUNK EDITION
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_20px_rgba(0,240,255,0.6)]">
                사격 훈련 시뮬레이터
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                반응 속도, 정밀한 에임 트래킹, 고속 연타 능력을 테스트하고 최고 기록을 경신하세요.
              </p>
            </div>

            {/* Mode Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Aim Mode Button Card */}
              <div
                onClick={startAimMode}
                className="group relative cursor-pointer p-5 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,240,255,0.35)] transition-all flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-300 group-hover:scale-110 transition-transform">
                    <Crosshair className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-700/50">
                    3D TRACKING
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                    🎯 3D 에임 테스트
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    접근하는 네온 타겟을 빠르게 격파하세요. 방어선 도달 전 전파를 막아야 합니다.
                  </p>
                </div>
                <div className="mt-auto pt-3 border-t border-cyan-500/20 flex items-center justify-between text-xs text-cyan-300/80 font-mono">
                  <span>최고 처치: {highScores.aimKills}개</span>
                  <span>웨이브 {highScores.aimWave}</span>
                </div>
              </div>

              {/* Click CPS Mode Button Card */}
              <div
                onClick={startClickMode}
                className="group relative cursor-pointer p-5 rounded-xl bg-gradient-to-br from-pink-950/40 to-slate-900/60 border border-pink-500/30 hover:border-pink-400 hover:shadow-[0_0_30px_rgba(255,0,128,0.35)] transition-all flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-pink-500/20 text-pink-300 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-pink-900/50 text-pink-300 border border-pink-700/50">
                    10 SEC CPS
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-pink-300 transition-colors">
                    ⚡ 초고속 연타 테스트
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    10초 동안 코어를 최대한 빠르게 클릭하여 초당 클릭 수(CPS)를 측정합니다.
                  </p>
                </div>
                <div className="mt-auto pt-3 border-t border-pink-500/20 flex items-center justify-between text-xs text-pink-300/80 font-mono">
                  <span>최다 클릭: {highScores.clickCount}회</span>
                  <span>{highScores.clickCPS} CPS</span>
                </div>
              </div>

              {/* Sniper Practice Mode Button Card */}
              <div
                onClick={startSniperMode}
                className="group relative cursor-pointer p-5 rounded-xl bg-gradient-to-br from-violet-950/50 to-slate-900/60 border border-violet-500/30 hover:border-violet-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-violet-500/20 text-violet-300 group-hover:scale-110 transition-transform">
                    <Crosshair className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-violet-900/50 text-violet-300 border border-violet-700/50">
                    30 SEC SNIPER
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                    ◉ 저격 은폐 타겟
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    이동·은폐하는 과녁을 30초 안에 처리하세요. 적중할 때마다 위치가 랜덤으로 바뀝니다.
                  </p>
                </div>
                <div className="mt-auto pt-3 border-t border-violet-500/20 flex items-center justify-between text-xs text-violet-300/80 font-mono">
                  <span>랜덤 스폰</span>
                  <span>이동 + 은폐</span>
                </div>
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">에임 모드 난이도 설정:</span>
              <div className="flex gap-1.5">
                {(["EASY", "NORMAL", "HARD"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                      difficulty === d
                        ? "bg-cyan-500 text-black shadow-[0_0_10px_#00f0ff]"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {d === "EASY" ? "쉬움" : d === "NORMAL" ? "보통" : "어려움"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. IN-GAME HUD - AIM MODE */}
      {/* ========================================================= */}
      {isPlaying && currentMode === "AIM" && (
        <div className="absolute inset-0 pointer-events-none p-6 pt-24 flex flex-col justify-between z-20">
          {/* Top HUD Cards (pt-24 avoids overlapping header) */}
          <div className="flex items-start justify-between">
            {/* Left Box: Kills & Wave */}
            <div className="p-3.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.2)] flex gap-6">
              <div>
                <div className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider">
                  Target Kills
                </div>
                <div className="text-3xl font-black text-white drop-shadow-[0_0_10px_#00f0ff]">
                  {aimKills}
                </div>
              </div>
              <div className="w-[1px] bg-cyan-500/30" />
              <div>
                <div className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider">
                  Wave Level
                </div>
                <div className="text-3xl font-black text-cyan-300">
                  {aimWave}
                </div>
              </div>
            </div>

            {/* Right Box: Combo & Accuracy */}
            <div className="p-3.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-pink-500/40 shadow-[0_0_20px_rgba(255,0,128,0.2)] flex gap-6 text-right">
              <div>
                <div className="text-[10px] font-mono uppercase text-pink-400 tracking-wider">
                  Accuracy
                </div>
                <div className="text-3xl font-black text-pink-300">
                  {accuracy}%
                </div>
              </div>
              <div className="w-[1px] bg-pink-500/30" />
              <div>
                <div className="text-[10px] font-mono uppercase text-pink-400 tracking-wider flex items-center justify-end gap-1">
                  <Flame className="w-3 h-3 text-amber-400 animate-bounce" /> Combo
                </div>
                <div className="text-3xl font-black text-amber-300 drop-shadow-[0_0_12px_#ffbe0b]">
                  x{aimCombo}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Proximity Alert Bar */}
          <div className="mx-auto w-full max-w-md p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/60 flex flex-col gap-1.5 text-center">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> 가장 가까운 표적 거리
              </span>
              <span
                className={`font-bold ${
                  closestEnemyDist < 6
                    ? "text-red-400 animate-pulse"
                    : closestEnemyDist < 12
                    ? "text-amber-300"
                    : "text-cyan-300"
                }`}
              >
                {closestEnemyDist}m
              </span>
            </div>
            {/* Visual Danger Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  closestEnemyDist < 6 ? "bg-red-500 shadow-[0_0_8px_#ff0055]" : "bg-cyan-400"
                }`}
                style={{
                  width: `${Math.max(0, Math.min(100, (1 - closestEnemyDist / 25) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. IN-GAME HUD - SNIPER MODE */}
      {/* ========================================================= */}
      {isPlaying && currentMode === "SNIPER" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-6 pt-24 pointer-events-none">
          <div className="p-4 rounded-xl bg-slate-950/88 backdrop-blur-md border border-violet-400/50 shadow-[0_0_24px_rgba(139,92,246,0.3)] flex items-center gap-8">
            <div className="text-center">
              <div className="text-[10px] font-mono text-violet-300 tracking-wider">SNIPER TIMER</div>
              <div className={`text-4xl font-black ${sniperTimeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white"}`}>
                {sniperTimeLeft}s
              </div>
            </div>
            <div className="w-[1px] h-10 bg-violet-500/30" />
            <div className="text-center">
              <div className="text-[10px] font-mono text-cyan-300 tracking-wider">TARGETS DOWN</div>
              <div className="text-4xl font-black text-cyan-300 drop-shadow-[0_0_10px_#00f0ff]">{sniperKills}</div>
            </div>
            <div className="w-[1px] h-10 bg-violet-500/30" />
            <div className="text-center">
              <div className="text-[10px] font-mono text-amber-300 tracking-wider">SHOT ACCURACY</div>
              <div className="text-4xl font-black text-amber-300">
                {sniperShots > 0 ? ((sniperKills / sniperShots) * 100).toFixed(0) : "100"}%
              </div>
            </div>
          </div>

          <div className="mb-6 px-4 py-2 rounded-lg bg-slate-950/75 border border-violet-500/30 text-xs font-mono text-violet-200">
            은폐 중인 과녁은 잠시 사라집니다 · 한 발 명중 시 다음 위치로 재배치
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. IN-GAME HUD - CLICK CPS MODE */}
      {/* ========================================================= */}
      {isPlaying && currentMode === "CLICK" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-8 pt-24 pointer-events-none">
          {/* Top Timer Bar */}
          <div className="p-4 rounded-xl bg-slate-950/85 backdrop-blur-md border border-pink-500/40 shadow-[0_0_20px_rgba(255,0,128,0.2)] flex items-center gap-8 pointer-events-auto">
            <div className="text-center">
              <div className="text-[10px] font-mono text-pink-400 tracking-wider">
                TIME REMAINING
              </div>
              <div
                className={`text-4xl font-black ${
                  clickTimeLeft <= 3 ? "text-red-400 animate-pulse" : "text-white"
                }`}
              >
                {clickTimeLeft}s
              </div>
            </div>
            <div className="w-[1px] h-10 bg-slate-800" />
            <div className="text-center">
              <div className="text-[10px] font-mono text-cyan-400 tracking-wider">
                TOTAL CLICKS
              </div>
              <div className="text-4xl font-black text-cyan-300 drop-shadow-[0_0_10px_#00f0ff]">
                {clickCount}
              </div>
            </div>
            <div className="w-[1px] h-10 bg-slate-800" />
            <div className="text-center">
              <div className="text-[10px] font-mono text-amber-400 tracking-wider">
                PEAK CPS
              </div>
              <div className="text-4xl font-black text-amber-300">
                {clickPeakCPS}
              </div>
            </div>
          </div>

          {/* Central Interactive Power Core Button */}
          <div className="my-auto pointer-events-auto flex flex-col items-center gap-4">
            <div
              className="relative cursor-pointer group transition-transform duration-75 select-none"
              style={{ transform: `scale(${clickScale})` }}
            >
              {/* Outer Energy Glow */}
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 opacity-60 blur-xl group-hover:opacity-100 transition-opacity" />
              {/* Image Core */}
              <img
                src="/manus-storage/click_core_c60c52c3.png"
                alt="Click Core"
                className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border-2 border-pink-400/80 shadow-[0_0_40px_rgba(255,0,128,0.6)] group-hover:scale-105 active:scale-95 transition-all"
                draggable={false}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs font-black tracking-widest text-white/90 drop-shadow-[0_0_8px_#ffffff]">
                  CLICK ME!
                </span>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-400 tracking-widest">
              RAPID PULSE PROTOCOL ACTIVE
            </div>
          </div>

          {/* Bottom Tips */}
          <div className="text-xs font-mono text-slate-500">
            화면의 아무 곳이나 클릭하거나 중앙 코어를 광속으로 연타하세요!
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. GAME OVER & RESULTS SCREEN */}
      {/* ========================================================= */}
      {isGameOver && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-black/75 backdrop-blur-md">
          <div className="relative w-full max-w-md p-8 rounded-2xl bg-slate-950/90 border border-cyan-500/50 shadow-[0_0_50px_rgba(0,240,255,0.3)] flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Title */}
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2 shadow-[0_0_15px_#00f0ff]">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
                훈련 결과 리포트
              </h2>
              <p className="text-xs text-slate-400">{gameOverReason}</p>
            </div>

            {/* Results Grid */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              {currentMode === "AIM" ? (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">최종 처치 수</span>
                    <span className="font-bold text-cyan-300 text-lg">{aimKills}개</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">도달 웨이브</span>
                    <span className="font-bold text-cyan-300 text-lg">{aimWave} 웨이브</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">사격 명중률</span>
                    <span className="font-bold text-pink-300 text-lg">{accuracy}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">최대 콤보</span>
                    <span className="font-bold text-amber-300 text-lg">x{maxCombo}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
                    <span className="text-slate-400">훈련 점수</span>
                    <span className="font-black text-white text-xl">{aimScore.toLocaleString()} pts</span>
                  </div>
                </>
              ) : currentMode === "SNIPER" ? (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">처리한 은폐 과녁</span>
                    <span className="font-bold text-violet-300 text-lg">{sniperKills}개</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">총 발사 수</span>
                    <span className="font-bold text-cyan-300 text-lg">{sniperShots}발</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">저격 명중률</span>
                    <span className="font-bold text-pink-300 text-lg">
                      {sniperShots > 0 ? ((sniperKills / sniperShots) * 100).toFixed(1) : "100.0"}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
                    <span className="text-slate-400">훈련 판정</span>
                    <span className="font-black text-amber-300 text-lg">
                      {sniperKills >= 15 ? "ELITE SNIPER" : sniperKills >= 8 ? "SHARPSHOOTER" : "RECRUIT"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">총 클릭 수</span>
                    <span className="font-bold text-cyan-300 text-lg">{clickCount} 회</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">평균 초당 클릭 수 (CPS)</span>
                    <span className="font-bold text-pink-300 text-lg">
                      {(clickCount / 10).toFixed(1)} 회/초
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">순간 최고 속도</span>
                    <span className="font-bold text-amber-300 text-lg">{clickPeakCPS} CPS</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
                    <span className="text-slate-400">연타 티어 판정</span>
                    <span className="font-black text-emerald-400 text-lg">
                      {clickCount >= 90
                        ? "👑 전설 (PRO ESPORTS)"
                        : clickCount >= 70
                        ? "💎 다이아몬드 (HIGH TIER)"
                        : clickCount >= 50
                        ? "⚡ 골드 (AVERAGE)"
                        : "🌱 일반 (NOVICE)"}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={currentMode === "AIM" ? startAimMode : currentMode === "SNIPER" ? startSniperMode : startClickMode}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-sm flex items-center justify-center gap-2 hover:shadow-[0_0_20px_#00f0ff] transition-all"
              >
                <RotateCcw className="w-4 h-4" /> 다시 도전
              </button>
              <button
                onClick={() => {
                  setIsGameOver(false);
                  activeModeRef.current = null;
                  setCurrentMode(null);
                  clearTargets();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white font-bold text-sm flex items-center justify-center gap-2 hover:border-cyan-400 transition-all"
              >
                <Home className="w-4 h-4" /> 메인 로비
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
