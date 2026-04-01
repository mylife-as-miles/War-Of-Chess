import * as THREE from 'three';

// ============================================================
//  BATTLEFIELD ENVIRONMENT  — fully additive, non-destructive
//  All new content lives in isolated groups below.
//  Import this module at the end of scene.js:
//    import { initEnvironment, updateEnvironment } from './environment.js';
//    initEnvironment(scene, THREE);   // call once after scene setup
//    // inside animate(): updateEnvironment(time);
// ============================================================

let _scene, _THREE;
const embers = [];
const smokeParticles = [];
const brazierLights = [];
const bannerMeshes = [];
const dustParticles = [];
const cheeringFigures = [];
const projectiles = [];

export function initEnvironment(scene, THREE_ref) {
  _scene = scene;
  _THREE = THREE_ref;
  const T = THREE_ref;

  // ── Mood overrides ──────────────────────────────────────────
  scene.background = new T.Color(0x1a1a2e);
  scene.fog = new T.FogExp2(0x2a1a18, 0.012);

  // ── Top-level groups ────────────────────────────────────────
  const environmentGroup   = new T.Group(); environmentGroup.name   = 'environmentGroup';
  const whiteKingdomGroup  = new T.Group(); whiteKingdomGroup.name  = 'whiteKingdomGroup';
  const blackKingdomGroup  = new T.Group(); blackKingdomGroup.name  = 'blackKingdomGroup';
  const warPropsGroup      = new T.Group(); warPropsGroup.name      = 'warPropsGroup';
  const atmosphereGroup    = new T.Group(); atmosphereGroup.name    = 'atmosphereGroup';

  scene.add(environmentGroup, whiteKingdomGroup, blackKingdomGroup, warPropsGroup, atmosphereGroup);

  // ── Shared helpers ──────────────────────────────────────────
  function box(w, h, d, mat)  { const m = new T.Mesh(new T.BoxGeometry(w,h,d), mat); m.castShadow = true; m.receiveShadow = true; return m; }
  function cyl(rt, rb, h, s, mat) { const m = new T.Mesh(new T.CylinderGeometry(rt,rb,h,s), mat); m.castShadow = true; m.receiveShadow = true; return m; }
  function cone(r, h, s, mat) { const m = new T.Mesh(new T.ConeGeometry(r,h,s), mat); m.castShadow = true; return m; }

  // ── Shared materials ────────────────────────────────────────
  const stoneMat     = new T.MeshStandardMaterial({ color: 0x9e9e8e, roughness: 0.88, metalness: 0.05 });
  const ivoryStoneMat= new T.MeshStandardMaterial({ color: 0xe8e0cc, roughness: 0.82, metalness: 0.0  });
  const darkStoneMat = new T.MeshStandardMaterial({ color: 0x2c2c3a, roughness: 0.80, metalness: 0.1  });
  const distantIvoryStoneMat = new T.MeshStandardMaterial({ color: 0xb8b09c, roughness: 0.85, metalness: 0.0 });
  const distantDarkStoneMat = new T.MeshStandardMaterial({ color: 0x1c1c2a, roughness: 0.85, metalness: 0.1 });
  const ironMat      = new T.MeshStandardMaterial({ color: 0x4a4a55, roughness: 0.35, metalness: 0.75 });
  const goldMat      = new T.MeshStandardMaterial({ color: 0xd4a020, roughness: 0.22, metalness: 0.9, emissive: new T.Color(0x6a4000), emissiveIntensity: 0.15 });
  const woodMat      = new T.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.85, metalness: 0.0  });
  const blueBannerMat= new T.MeshStandardMaterial({ color: 0x1a4fa3, roughness: 0.7, metalness: 0.0, side: T.DoubleSide });
  const goldBannerMat= new T.MeshStandardMaterial({ color: 0xd4a020, roughness: 0.6, metalness: 0.0, side: T.DoubleSide });
  const crimsonMat   = new T.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.7, metalness: 0.0, side: T.DoubleSide });
  const darkPurpleMat= new T.MeshStandardMaterial({ color: 0x3d0d5c, roughness: 0.7, metalness: 0.0, side: T.DoubleSide });
  const emberMat     = new T.MeshStandardMaterial({ color: 0xff5500, emissive: new T.Color(0xff2200), emissiveIntensity: 2.5, roughness: 0.5 });
  const smokeMat     = new T.MeshStandardMaterial({ color: 0x555566, roughness: 1.0, transparent: true, opacity: 0.18, depthWrite: false });
  const groundWarMat = new T.MeshStandardMaterial({ color: 0x4a3d28, roughness: 0.95, metalness: 0.0 });

  // ═══════════════════════════════════════════════════════════
  //  GROUND — replace the pastoral green with war-torn earth
  // ═══════════════════════════════════════════════════════════
  const warGround = new T.Mesh(new T.PlaneGeometry(140, 140, 40, 40), groundWarMat);
  warGround.name = 'warGround';
  warGround.rotation.x = -Math.PI / 2;
  warGround.position.y = -0.56;
  warGround.receiveShadow = true;
  // Subtle terrain lumps outside board
  {
    const pos = warGround.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const dist = Math.sqrt(x*x + y*y);
      if (dist > 8) {
        // Create trenches and jagged ridges
        const noise1 = Math.sin(x*0.3)*Math.cos(y*0.28);
        const noise2 = Math.sin(x*0.15 + y*0.11);
        const jagged = Math.abs(noise1) * 2.5 - Math.abs(noise2) * 2.0;
        const h = jagged * 1.2;
        pos.setZ(i, h * Math.min(1,(dist-8)/15));
      }
    }
    pos.needsUpdate = true;
    warGround.geometry.computeVertexNormals();
  }
  environmentGroup.add(warGround);

  // Add jagged rocks around the battlefield
  const rockGeo = new T.DodecahedronGeometry(1, 1);
  for(let i=0; i<40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 12 + Math.random() * 35;
    const rock = new T.Mesh(rockGeo, darkStoneMat);
    rock.position.set(Math.cos(angle)*r, -0.5 + Math.random()*1.5, Math.sin(angle)*r);
    rock.scale.set(1 + Math.random()*2, 2 + Math.random()*3, 1 + Math.random()*2);
    rock.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    environmentGroup.add(rock);
  }

  // Arena border stones — ring of low stone blocks framing the battlefield
  const borderStoneMat = new T.MeshStandardMaterial({ color: 0x6e6455, roughness: 0.92, metalness: 0.0 });
  const borderCount = 28;
  for (let i = 0; i < borderCount; i++) {
    const angle = (i / borderCount) * Math.PI * 2;
    const r = 8.6 + (i % 3 === 0 ? 0.15 : 0);
    const bstone = box(0.55 + (i%2)*0.2, 0.18 + (i%3)*0.08, 0.55, borderStoneMat);
    bstone.name = `borderStone_${i}`;
    bstone.position.set(Math.cos(angle)*r, -0.46, Math.sin(angle)*r);
    bstone.rotation.y = angle;
    environmentGroup.add(bstone);
  }

  // ═══════════════════════════════════════════════════════════
  //  ARENA PLATFORM — raised sacred battlefield under the board
  // ═══════════════════════════════════════════════════════════
  const platformMat = new T.MeshStandardMaterial({ color: 0x7a6a4a, roughness: 0.75, metalness: 0.05 });
  const platform = box(12, 0.22, 12, platformMat);
  platform.name = 'arenaPlatform';
  platform.position.set(0, -0.46, 0);
  environmentGroup.add(platform);

  // Platform edge trim — gold inlay strips
  const trimGeoH = new T.BoxGeometry(12.1, 0.06, 0.12);
  const trimGeoV = new T.BoxGeometry(0.12, 0.06, 12.1);
  [-6, 6].forEach((z, i) => {
    const t = new T.Mesh(trimGeoH, goldMat); t.name = `platformTrimH_${i}`;
    t.position.set(0, -0.34, z); environmentGroup.add(t);
  });
  [-6, 6].forEach((x, i) => {
    const t = new T.Mesh(trimGeoV, goldMat); t.name = `platformTrimV_${i}`;
    t.position.set(x, -0.34, 0); environmentGroup.add(t);
  });

  // ═══════════════════════════════════════════════════════════
  //  HELPER: BANNER POLE
  // ═══════════════════════════════════════════════════════════
  function makeBannerPole(x, z, bannerColor, accentColor, group, nameSuffix) {
    const g = new T.Group(); g.name = `bannerPole_${nameSuffix}`;
    // Pole
    const pole = cyl(0.04, 0.05, 4.5, 6, ironMat); pole.name = 'pole';
    pole.position.y = 1.8; g.add(pole);
    // Finial sphere
    const finial = new T.Mesh(new T.SphereGeometry(0.1, 8, 8), goldMat); finial.name = 'finial';
    finial.position.y = 4.15; g.add(finial);
    
    // Pivot group for banner
    const pivot = new T.Group();
    pivot.position.set(0, 3.1, 0); // Attach to pole
    g.add(pivot);

    // Banner cloth
    const bannerMesh = box(0.9, 1.5, 0.04, new T.MeshStandardMaterial({ color: bannerColor, roughness: 0.7, side: T.DoubleSide }));
    bannerMesh.name = 'bannerCloth';
    bannerMesh.position.set(0.45, 0, 0); pivot.add(bannerMesh);
    // Accent stripe
    const stripe = box(0.9, 0.12, 0.05, new T.MeshStandardMaterial({ color: accentColor, roughness: 0.5 }));
    stripe.name = 'bannerStripe';
    stripe.position.set(0.45, -0.68, 0); pivot.add(stripe);
    // Base block
    const base = box(0.3, 0.2, 0.3, stoneMat); base.name = 'poleBase';
    base.position.y = -0.43; g.add(base);

    g.position.set(x, 0, z);
    group.add(g);
    bannerMeshes.push({ mesh: pivot, offset: Math.random()*Math.PI*2 });
    return g;
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: BRAZIER
  // ═══════════════════════════════════════════════════════════
  function makeBrazier(x, z, group, nameSuffix, isNobleSide) {
    const g = new T.Group(); g.name = `brazier_${nameSuffix}`;
    // Tripod legs
    for (let i = 0; i < 3; i++) {
      const legAngle = (i/3)*Math.PI*2;
      const leg = cyl(0.02, 0.03, 0.8, 4, ironMat); leg.name = `leg_${i}`;
      leg.position.set(Math.cos(legAngle)*0.18, 0.0, Math.sin(legAngle)*0.18);
      leg.rotation.z = 0.22; leg.rotation.y = legAngle;
      g.add(leg);
    }
    // Bowl
    const bowl = new T.Mesh(new T.CylinderGeometry(0.22, 0.12, 0.22, 8, 1, true), ironMat);
    bowl.name = 'bowl'; bowl.position.y = 0.52; bowl.castShadow = true; g.add(bowl);
    // Fire glow
    const fireMat = new T.MeshStandardMaterial({ color: 0xff6600, emissive: new T.Color(isNobleSide ? 0xff8800 : 0xff2200), emissiveIntensity: 3.0, transparent: true, opacity: 0.92 });
    const fire = cone(0.18, 0.38, 6, fireMat); fire.name = 'fire';
    fire.position.y = 0.8; g.add(fire);
    // Inner brighter flame
    const fireMat2 = new T.MeshStandardMaterial({ color: 0xffee00, emissive: new T.Color(0xffcc00), emissiveIntensity: 4.0, transparent: true, opacity: 0.7 });
    const innerFire = cone(0.1, 0.28, 5, fireMat2); innerFire.name = 'innerFire';
    innerFire.position.y = 0.9; g.add(innerFire);
    // Point light
    const fColor = isNobleSide ? 0xffaa44 : 0xff3300;
    const fl = new T.PointLight(fColor, 1.4, 7, 2.0);
    fl.name = 'brazierLight'; fl.position.y = 0.9;
    fl.castShadow = false; g.add(fl);
    brazierLights.push({ light: fl, offset: Math.random()*Math.PI*2, isNobre: isNobleSide });

    g.position.set(x, 0, z);
    group.add(g);
    return g;
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: FORTRESS WALL SEGMENT
  // ═══════════════════════════════════════════════════════════
  function makeWallSegment(x, z, rotY, w, mat, group, nameSuffix, isDark = false) {
    const g = new T.Group(); g.name = `wallSeg_${nameSuffix}`;
    
    // Thicker base for the wall
    const wallBase = box(w, 0.8, 1.0, mat); wallBase.name = 'wallBase';
    wallBase.position.y = -0.05; g.add(wallBase);

    // Main wall body
    const wall = box(w, 2.2, 0.6, mat); wall.name = 'wallBody';
    wall.position.y = 1.45; g.add(wall);
    
    // Walkway behind battlements
    const walkway = box(w, 0.2, 0.8, mat); walkway.name = 'walkway';
    walkway.position.set(0, 2.45, -0.1); g.add(walkway);

    // Battlements (front facing)
    const merlonCount = Math.max(2, Math.floor(w / 1.1));
    for (let i = 0; i < merlonCount; i++) {
      const merlon = box(0.42, 0.65, 0.35, mat); merlon.name = `merlon_${i}`;
      merlon.position.set(-w/2 + 0.55 + i*(w/(merlonCount-0.5||1)), 2.85, 0.15);
      g.add(merlon);
    }
    
    // Defensive spikes/embrasure details
    const spikeMat = isDark ? new T.MeshStandardMaterial({ color: 0x221111, metalness: 0.8, roughness: 0.4 }) : ironMat;
    for (let i = 0; i < merlonCount - 1; i++) {
      const gapX = -w/2 + 0.55 + (i + 0.5)*(w/(merlonCount-0.5||1));
      const spike = cone(0.05, 0.4, 4, spikeMat);
      spike.position.set(gapX, 2.75, 0.15);
      g.add(spike);
    }

    // Arrow slits / murder holes along the wall body
    const slitCount = Math.floor(w / 1.5);
    const slitMat = new T.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });
    for (let i = 0; i < slitCount; i++) {
      const slitX = -w/2 + 0.75 + i*(w/(slitCount-0.5||1));
      const slit = box(0.08, 0.4, 0.65, slitMat);
      slit.position.set(slitX, 1.5, 0.0);
      g.add(slit);
    }

    if (isDark) {
      // Glowing runes
      const runeMat = new T.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff0000, emissiveIntensity: 2.0, transparent: true, opacity: 0.8, depthWrite: false });
      for (let i = 0; i < 3; i++) {
        if (Math.random() > 0.5) {
          const rune = new T.Mesh(new T.PlaneGeometry(0.2, 0.5), runeMat);
          rune.position.set(-w/3 + i*(w/3) + (Math.random()-0.5)*0.5, 1.2 + Math.random()*0.4, 0.31); 
          g.add(rune);
        }
      }
    } else {
      // Decorative shields for white kingdom
      for (let i = 0; i < 3; i++) {
        if (Math.random() > 0.5) {
          const shield = cyl(0.25, 0.25, 0.05, 16, new T.MeshStandardMaterial({ color: 0x1a4fa3, metalness: 0.3, roughness: 0.7 }));
          shield.rotation.x = Math.PI / 2;
          shield.position.set(-w/3 + i*(w/3) + (Math.random()-0.5)*0.5, 1.2 + Math.random()*0.4, 0.31);
          
          const boss = new T.Mesh(new T.SphereGeometry(0.08, 8, 8), goldMat);
          boss.position.z = 0.02;
          shield.add(boss);
          
          g.add(shield);
        }
      }
    }
    
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    group.add(g);
    return g;
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: TOWER
  // ═══════════════════════════════════════════════════════════
  function makeTower(x, z, mat, roofColor, group, nameSuffix, height=4, isDark=false) {
    const g = new T.Group(); g.name = `tower_${nameSuffix}`;
    
    // Thicker base for stability
    const basePlinth = cyl(0.9, 1.1, 0.6, 8, mat); basePlinth.name = 'towerPlinth';
    basePlinth.position.y = 0.3; g.add(basePlinth);

    const base = cyl(0.7, 0.85, height, 8, mat); base.name = 'towerBase';
    base.position.y = height/2 + 0.3; g.add(base);
    
    // Decorative bands
    const band1 = cyl(0.75, 0.75, 0.15, 8, isDark ? darkStoneMat : ivoryStoneMat);
    band1.position.y = height * 0.4; g.add(band1);
    const band2 = cyl(0.72, 0.72, 0.15, 8, isDark ? darkStoneMat : ivoryStoneMat);
    band2.position.y = height * 0.7; g.add(band2);

    // Corbel ring (supports battlements)
    const corbelRing = cyl(0.85, 0.7, 0.4, 8, mat);
    corbelRing.position.y = height + 0.2; g.add(corbelRing);

    // Battlements ring
    for (let i = 0; i < 8; i++) {
      const a = (i/8)*Math.PI*2;
      const m = box(0.25, 0.45, 0.25, mat); m.name = `towerMerlon_${i}`;
      m.position.set(Math.cos(a)*0.75, height+0.6, Math.sin(a)*0.75);
      m.rotation.y = -a;
      g.add(m);
    }
    
    // Roof cone
    const roof = cone(0.95, 1.4, 8, new T.MeshStandardMaterial({ color: roofColor, roughness: 0.65 }));
    roof.name = 'towerRoof';
    roof.position.y = height + 1.2; g.add(roof);
    
    // Roof finial
    const finial = cyl(0.05, 0.05, 0.8, 4, ironMat);
    finial.position.y = height + 2.1; g.add(finial);
    
    // Window slits with glowing interiors
    for (let i = 0; i < 4; i++) {
      const wAngle = (i/4)*Math.PI*2 + Math.PI/4;
      const slitColor = isDark ? 0xff0000 : 0x220011;
      const slitIntensity = isDark ? 3.0 : 0.5;
      const slit = box(0.1, 0.35, 0.12, new T.MeshStandardMaterial({ color: 0x000000, emissive: new T.Color(slitColor), emissiveIntensity: slitIntensity }));
      slit.name = `slit_${i}`;
      slit.position.set(Math.cos(wAngle)*0.72, height*0.6, Math.sin(wAngle)*0.72);
      slit.rotation.y = wAngle; g.add(slit);
    }
    
    // Additional defensive arrow slits lower down
    const lowerSlitMat = new T.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });
    for (let i = 0; i < 8; i++) {
      const wAngle = (i/8)*Math.PI*2;
      const slit = box(0.06, 0.25, 0.1, lowerSlitMat);
      slit.position.set(Math.cos(wAngle)*0.75, height*0.3, Math.sin(wAngle)*0.75);
      slit.rotation.y = wAngle; g.add(slit);
    }

    g.position.set(x, 0, z);
    group.add(g);
    return g;
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: WAR DRUM
  // ═══════════════════════════════════════════════════════════
  function makeWarDrum(x, z, group, nameSuffix) {
    const g = new T.Group(); g.name = `warDrum_${nameSuffix}`;
    const drumBody = cyl(0.35, 0.35, 0.5, 12, woodMat); drumBody.name = 'drumBody';
    drumBody.position.y = 0.1; g.add(drumBody);
    const drumTop = new T.Mesh(new T.CylinderGeometry(0.36,0.36,0.06,12), new T.MeshStandardMaterial({ color: 0xd4b080, roughness: 0.5 }));
    drumTop.name = 'drumTop'; drumTop.position.y = 0.37; g.add(drumTop);
    const drumBot = drumTop.clone(); drumBot.name = 'drumBot'; drumBot.position.y = -0.11; g.add(drumBot);
    // Rope cross-lacing
    for (let i = 0; i < 6; i++) {
      const a = (i/6)*Math.PI*2;
      const rope = cyl(0.01, 0.01, 0.55, 4, new T.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.8 }));
      rope.name = `rope_${i}`; rope.rotation.z = Math.PI/2;
      rope.position.set(Math.cos(a)*0.34, 0.1, Math.sin(a)*0.34);
      g.add(rope);
    }
    // Two drumsticks
    for (let s = -1; s <= 1; s+=2) {
      const stick = cyl(0.025, 0.015, 0.5, 4, woodMat); stick.name = `stick_${s}`;
      stick.rotation.z = s * 0.6; stick.position.set(s*0.2, 0.55, -0.05); g.add(stick);
    }
    // Legs
    for (let i = 0; i < 3; i++) {
      const la = (i/3)*Math.PI*2;
      const leg = cyl(0.03, 0.04, 0.3, 4, woodMat); leg.name = `drumLeg_${i}`;
      leg.position.set(Math.cos(la)*0.28, -0.23, Math.sin(la)*0.28); g.add(leg);
    }
    g.position.set(x, 0, z); group.add(g); return g;
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: STAGING AREA ROCKS
  // ═══════════════════════════════════════════════════════════
  function makeStagingAreaRocks(x, z, isWhite, group, nameSuffix) {
    const rockGroup = new T.Group();
    rockGroup.name = `stagingRocks_${nameSuffix}`;
    rockGroup.position.set(x, 0, z);

    const mat = isWhite ? ivoryStoneMat : darkStoneMat;
    const geo = new T.DodecahedronGeometry(1, 1);

    for (let i = 0; i < 8; i++) {
      const rock = new T.Mesh(geo, mat);
      rock.name = `rock_${i}`;
      const px = (Math.random() - 0.5) * 6;
      const pz = (Math.random() - 0.5) * 4;
      rock.position.set(px, -0.5 + Math.random() * 0.8, pz);
      rock.scale.set(0.5 + Math.random() * 1.5, 0.5 + Math.random() * 1.5, 0.5 + Math.random() * 1.5);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.castShadow = true;
      rock.receiveShadow = true;
      rockGroup.add(rock);
    }

    group.add(rockGroup);
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: CHEERING ARMY
  // ═══════════════════════════════════════════════════════════
  function makeArmy(x, z, rotY, isWhite, group, nameSuffix) {
    const armyGroup = new T.Group();
    armyGroup.name = `army_${nameSuffix}`;
    armyGroup.position.set(x, 0, z);
    armyGroup.rotation.y = rotY;

    const color = isWhite ? 0xdddddd : 0x222222;
    const accentColor = isWhite ? 0x4488cc : 0x882244;
    const mat = new T.MeshStandardMaterial({ color: color, roughness: 0.8 });
    const accentMat = new T.MeshStandardMaterial({ color: accentColor, roughness: 0.6 });

    // Create a cluster of simple figures
    for (let i = 0; i < 15; i++) {
      const figure = new T.Group();
      figure.name = `figure_${i}`;
      const px = (Math.random() - 0.5) * 4;
      const pz = (Math.random() - 0.5) * 3;
      figure.position.set(px, 0, pz);

      // Body
      const body = new T.Mesh(new T.CylinderGeometry(0.1, 0.15, 0.6, 6), mat);
      body.position.y = 0.3;
      body.castShadow = true;
      figure.add(body);

      // Head
      const head = new T.Mesh(new T.SphereGeometry(0.12, 8, 8), mat);
      head.position.y = 0.7;
      head.castShadow = true;
      figure.add(head);

      // Weapon/Banner (randomly assigned)
      if (Math.random() > 0.5) {
        const pole = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 1.2, 4), new T.MeshStandardMaterial({ color: 0x4a3b2c }));
        pole.position.set(0.15, 0.6, 0);
        pole.rotation.z = -0.2 + Math.random() * 0.4;
        pole.castShadow = true;
        figure.add(pole);

        if (Math.random() > 0.5) {
          const banner = new T.Mesh(new T.PlaneGeometry(0.3, 0.5), accentMat);
          banner.position.set(0.3, 1.0, 0);
          banner.castShadow = true;
          figure.add(banner);
          bannerMeshes.push({ mesh: banner, offset: Math.random() * Math.PI * 2 });
        }
      }

      // Add idle cheering animation data
      figure.userData = {
        phase: Math.random() * Math.PI * 2,
        speed: 2 + Math.random() * 3,
        baseY: 0,
        isCheering: true
      };
      cheeringFigures.push(figure);

      armyGroup.add(figure);
    }

    group.add(armyGroup);
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: SHIELD RACK
  // ═══════════════════════════════════════════════════════════
  function makeShieldRack(x, z, rotY, isNoble, group, nameSuffix) {
    const g = new T.Group(); g.name = `shieldRack_${nameSuffix}`;
    // Horizontal bar
    const bar = cyl(0.03, 0.03, 1.6, 4, woodMat); bar.name = 'rackBar';
    bar.rotation.z = Math.PI/2; bar.position.y = 0.65; g.add(bar);
    // Two upright posts
    for (let s = -1; s<=1; s+=2) {
      const post = cyl(0.04, 0.04, 1.4, 4, woodMat); post.name = `post_${s}`;
      post.position.set(s*0.72, 0.22, 0); g.add(post);
    }
    // 3 shields on the rack
    const shieldColors = isNoble ? [0x1a4fa3, 0xe8e0cc, 0xd4a020] : [0x8b0000, 0x2c2c3a, 0x6a006a];
    for (let i = 0; i < 3; i++) {
      const shMat = new T.MeshStandardMaterial({ color: shieldColors[i], roughness: 0.6 });
      let sh;
      // Varied shield designs: some rectangular, some round, some hexagonal
      const randShape = Math.random();
      if (randShape > 0.66) {
        sh = box(0.38, 0.5, 0.06, shMat); // Rectangular
      } else if (randShape > 0.33) {
        sh = cyl(0.25, 0.25, 0.06, 12, shMat); // Round
        sh.rotation.x = Math.PI/2;
      } else {
        sh = cyl(0.25, 0.25, 0.06, 6, shMat); // Hexagonal
        sh.rotation.x = Math.PI/2;
      }
      
      sh.name = `shield_${i}`;
      sh.position.set(-0.55 + i*0.55, 0.6, 0.12);
      // Boss in center
      const boss = new T.Mesh(new T.SphereGeometry(0.07,6,6), ironMat); boss.name = `boss_${i}`;
      boss.position.set(-0.55+i*0.55, 0.6, 0.19); g.add(sh); g.add(boss);
      
      // Add a subtle emblem to some shields
      if (Math.random() > 0.5) {
        const emblemMat = new T.MeshStandardMaterial({ color: isNoble ? 0xd4a020 : 0xff2200, roughness: 0.4, metalness: 0.8 });
        const emblem = box(0.05, 0.3, 0.02, emblemMat);
        emblem.position.set(-0.55+i*0.55, 0.6, 0.16);
        emblem.rotation.z = Math.random() * Math.PI;
        g.add(emblem);
      }
    }
    g.position.set(x, 0, z); g.rotation.y = rotY; group.add(g); return g;
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: STATUE GUARD (low-poly silhouette soldier)
  // ═══════════════════════════════════════════════════════════
  function makeStatueGuard(x, z, rotY, mat, spearColor, group, nameSuffix) {
    const g = new T.Group(); g.name = `guard_${nameSuffix}`;
    // Body
    const body = box(0.42, 0.7, 0.28, mat); body.name = 'guardBody'; body.position.y = 0.5; g.add(body);
    // Head
    const head = new T.Mesh(new T.SphereGeometry(0.2,8,8), mat); head.name = 'guardHead'; head.position.y = 1.15; g.add(head);
    // Helmet
    const helm = cone(0.22, 0.32, 7, mat); helm.name = 'guardHelm'; helm.position.y = 1.38; g.add(helm);
    // Legs
    for (let s=-1;s<=1;s+=2) {
      const leg = box(0.14, 0.55, 0.18, mat); leg.name = `guardLeg_${s}`;
      leg.position.set(s*0.13, -0.05, 0); g.add(leg);
    }
    // Arms
    for (let s=-1;s<=1;s+=2) {
      const arm = box(0.12, 0.48, 0.15, mat); arm.name = `guardArm_${s}`;
      arm.position.set(s*0.28, 0.5, 0); g.add(arm);
    }
    // Spear
    const spearMat = new T.MeshStandardMaterial({ color: spearColor, roughness: 0.4, metalness: 0.6 });
    const shaft = cyl(0.025, 0.025, 2.2, 5, woodMat); shaft.name = 'spearShaft';
    shaft.position.set(0.28, 1.2, 0); g.add(shaft);
    const tip = cone(0.06, 0.28, 5, spearMat); tip.name = 'spearTip';
    tip.position.set(0.28, 2.42, 0); g.add(tip);
    // Shield on arm
    const shMat = new T.MeshStandardMaterial({ color: spearColor, roughness: 0.6 });
    const shieldMesh = box(0.32, 0.44, 0.06, shMat); shieldMesh.name = 'guardShield';
    shieldMesh.position.set(-0.36, 0.5, 0); g.add(shieldMesh);

    g.position.set(x, 0, z); g.rotation.y = rotY; group.add(g); return g;
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: SMOKE COLUMN
  // ═══════════════════════════════════════════════════════════
  function addSmokeColumn(x, y, z, group, nameSuffix) {
    const col = new T.Group(); col.name = `smokeCol_${nameSuffix}`;
    for (let i = 0; i < 6; i++) {
      const puff = new T.Mesh(new T.SphereGeometry(0.5+i*0.35, 7, 7), smokeMat.clone());
      puff.name = `puff_${i}`;
      puff.position.set(Math.sin(i*1.3)*0.4, i*1.1, Math.cos(i*1.1)*0.3);
      puff.userData = { baseY: i*1.1, phase: i*0.8 + Math.random()*2 };
      col.add(puff); smokeParticles.push(puff);
    }
    col.position.set(x, y, z); group.add(col);
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: WALL BANNER
  // ═══════════════════════════════════════════════════════════
  function makeWallBanner(x, y, z, color, group) {
    const pivot = new T.Group();
    pivot.position.set(x, y + 1.0, z); // Pivot at the top of the banner
    group.add(pivot);

    const banner = box(0.8, 2.0, 0.05, new T.MeshStandardMaterial({ color: color, roughness: 0.8 }));
    banner.position.set(0, -1.0, 0); // Hang down from pivot
    pivot.add(banner);
    
    bannerMeshes.push({ mesh: pivot, offset: Math.random()*Math.PI*2 });
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: SIEGE ENGINE (CATAPULT)
  // ═══════════════════════════════════════════════════════════
  function makeCatapult(x, z, rotY, group) {
    const g = new T.Group();
    const base = box(1.5, 0.2, 2.5, woodMat); base.position.y = 0.3; g.add(base);
    for(let wx of [-0.85, 0.85]) {
      for(let wz of [-1.0, 1.0]) {
        const wheel = cyl(0.4, 0.4, 0.1, 8, woodMat);
        wheel.rotation.z = Math.PI/2;
        wheel.position.set(wx, 0.4, wz);
        g.add(wheel);
      }
    }
    const arm = box(0.2, 2.5, 0.2, woodMat);
    arm.position.set(0, 1.5, 0.5);
    arm.rotation.x = -Math.PI/4;
    g.add(arm);
    const bucket = box(0.6, 0.4, 0.6, woodMat);
    bucket.position.set(0, 2.4, -0.4);
    bucket.rotation.x = -Math.PI/4;
    g.add(bucket);
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    group.add(g);
    return g;
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: SIEGE ENGINE (BALLISTA)
  // ═══════════════════════════════════════════════════════════
  function makeBallista(x, z, rotY, group) {
    const g = new T.Group();
    const base = box(1.2, 0.2, 2.0, woodMat); base.position.y = 0.3; g.add(base);
    for(let wx of [-0.7, 0.7]) {
      for(let wz of [-0.8, 0.8]) {
        const wheel = cyl(0.3, 0.3, 0.1, 8, woodMat);
        wheel.rotation.z = Math.PI/2;
        wheel.position.set(wx, 0.3, wz);
        g.add(wheel);
      }
    }
    const stand = box(0.3, 0.8, 0.3, woodMat);
    stand.position.set(0, 0.8, 0);
    g.add(stand);
    
    const bow = box(2.5, 0.1, 0.2, woodMat);
    bow.position.set(0, 1.2, 0.5);
    g.add(bow);
    
    const track = box(0.2, 0.1, 2.5, woodMat);
    track.position.set(0, 1.2, 0);
    g.add(track);
    
    const arrow = cyl(0.05, 0.05, 1.5, 4, ironMat);
    arrow.rotation.x = Math.PI/2;
    arrow.position.set(0, 1.3, 0.2);
    g.add(arrow);

    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    group.add(g);
    return g;
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: CRATER
  // ═══════════════════════════════════════════════════════════
  function makeCrater(x, z, scale, group) {
    const g = new T.Group();
    const craterMat = new T.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 1.0 });
    const rimMat = new T.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
    
    // Dark center
    const center = new T.Mesh(new T.CircleGeometry(0.8 * scale, 12), craterMat);
    center.rotation.x = -Math.PI / 2;
    center.position.y = 0.01;
    g.add(center);
    
    // Raised rim
    const rim = new T.Mesh(new T.TorusGeometry(0.8 * scale, 0.15 * scale, 4, 12), rimMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.05;
    g.add(rim);
    
    g.position.set(x, 0, z);
    group.add(g);
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: SCORCH MARK
  // ═══════════════════════════════════════════════════════════
  function makeScorchMark(x, z, scale, group) {
    const mat = new T.MeshStandardMaterial({ color: 0x111111, roughness: 1.0, transparent: true, opacity: 0.8 });
    const mark = new T.Mesh(new T.CircleGeometry(scale, 8), mat);
    mark.rotation.x = -Math.PI / 2;
    mark.position.set(x, 0.02, z);
    group.add(mark);
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: BONE
  // ═══════════════════════════════════════════════════════════
  function makeBone(x, z, rotY, group) {
    const g = new T.Group();
    const boneMat = new T.MeshStandardMaterial({ color: 0xe0e0d0, roughness: 0.8 });
    
    const shaft = cyl(0.04, 0.04, 0.4, 6, boneMat);
    shaft.rotation.z = Math.PI / 2;
    g.add(shaft);
    
    for (let i of [-1, 1]) {
      const joint1 = new T.Mesh(new T.SphereGeometry(0.06, 6, 6), boneMat);
      joint1.position.set(i * 0.2, 0, 0.03);
      g.add(joint1);
      const joint2 = new T.Mesh(new T.SphereGeometry(0.06, 6, 6), boneMat);
      joint2.position.set(i * 0.2, 0, -0.03);
      g.add(joint2);
    }
    
    g.position.set(x, 0.04, z);
    g.rotation.y = rotY;
    group.add(g);
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: BROKEN SWORD
  // ═══════════════════════════════════════════════════════════
  function makeBrokenSword(x, z, rotY, rotZ, group) {
    const g = new T.Group();
    const bladeMat = new T.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.4 });
    const handleMat = new T.MeshStandardMaterial({ color: 0x332211, roughness: 0.9 });
    const crossguardMat = new T.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.3 });
    
    const handle = cyl(0.03, 0.03, 0.2, 6, handleMat);
    handle.position.y = 0.1;
    g.add(handle);
    
    const guard = box(0.3, 0.05, 0.08, crossguardMat);
    guard.position.y = 0.2;
    g.add(guard);
    
    const blade = box(0.08, 0.5, 0.02, bladeMat);
    blade.position.y = 0.45;
    g.add(blade);
    
    g.position.set(x, 0, z);
    g.rotation.set(0, rotY, rotZ);
    group.add(g);
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: DISCARDED SHIELD
  // ═══════════════════════════════════════════════════════════
  function makeDiscardedShield(x, z, rotY, rotX, isWhite, group) {
    const shieldColor = isWhite ? 0x1a4fa3 : 0x8b0000;
    const shieldMat = new T.MeshStandardMaterial({ color: shieldColor, metalness: 0.3, roughness: 0.7 });
    
    const shield = cyl(0.4, 0.4, 0.08, 12, shieldMat);
    const boss = new T.Mesh(new T.SphereGeometry(0.12, 8, 8), ironMat);
    boss.position.y = 0.04;
    shield.add(boss);
    
    shield.position.set(x, 0.1, z);
    shield.rotation.set(rotX, rotY, 0);
    group.add(shield);
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: RUINED TOWER
  // ═══════════════════════════════════════════════════════════
  function makeRuinedTower(x, z, mat, group, nameSuffix) {
    const g = new T.Group(); g.name = `ruinedTower_${nameSuffix}`;
    
    const basePlinth = cyl(0.9, 1.1, 0.6, 8, mat);
    basePlinth.position.y = 0.3; g.add(basePlinth);

    const base = cyl(0.7, 0.85, 2.5, 8, mat); 
    base.position.y = 1.25 + 0.3; 
    base.rotation.z = 0.1; // slight tilt
    g.add(base);
    
    // Rubble pieces
    for (let i = 0; i < 6; i++) {
      const rubble = box(0.4 + Math.random()*0.3, 0.4 + Math.random()*0.3, 0.4 + Math.random()*0.3, mat);
      rubble.position.set((Math.random()-0.5)*2, Math.random()*0.5, (Math.random()-0.5)*2);
      rubble.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
      g.add(rubble);
    }

    g.position.set(x, 0, z);
    group.add(g);
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPER: BROKEN CHARIOT
  // ═══════════════════════════════════════════════════════════
  function makeBrokenChariot(x, z, rotY, group) {
    const g = new T.Group();
    const body = box(1.2, 0.5, 1.5, woodMat);
    body.position.set(0, 0.4, 0);
    body.rotation.z = 0.2;
    body.rotation.x = -0.3;
    g.add(body);
    
    // Front panel
    const front = box(1.2, 0.8, 0.1, woodMat);
    front.position.set(0, 0.8, -0.7);
    front.rotation.z = 0.2;
    front.rotation.x = -0.3;
    g.add(front);

    const wheel1 = cyl(0.5, 0.5, 0.1, 8, woodMat);
    wheel1.rotation.z = Math.PI/2 + 0.2;
    wheel1.position.set(-0.7, 0.3, 0.2);
    g.add(wheel1);
    
    const wheel2 = cyl(0.5, 0.5, 0.1, 8, woodMat);
    wheel2.rotation.z = Math.PI/2 - 0.5;
    wheel2.rotation.x = Math.PI/2;
    wheel2.position.set(1.0, 0.05, 0.5);
    g.add(wheel2);
    
    // Broken pole
    const pole = cyl(0.05, 0.05, 1.5, 4, woodMat);
    pole.rotation.x = Math.PI/2 + 0.2;
    pole.position.set(0, 0.1, -1.5);
    g.add(pole);

    // Scattered shield
    const shield = cyl(0.3, 0.3, 0.05, 16, new T.MeshStandardMaterial({ color: 0x8b0000, metalness: 0.3, roughness: 0.7 }));
    shield.rotation.x = Math.PI/2 - 0.4;
    shield.rotation.y = 0.5;
    shield.position.set(-1.2, 0.1, -0.5);
    g.add(shield);

    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    group.add(g);
  }

  // ═══════════════════════════════════════════════════════════
  //  WHITE KINGDOM  (z < 0 side — noble, ivory, gold, blue)
  //  White pieces start at rows 0-1 in chess → z = -3.5..-4.5
  //  Noble fortress staged at z = -10 .. -22
  // ═══════════════════════════════════════════════════════════
  const WZ = -1; // z-offset direction for white side

  // Staging area ground patch — lighter sand/marble
  const nobleGround = new T.Mesh(new T.PlaneGeometry(26, 18, 1, 1),
    new T.MeshStandardMaterial({ color: 0x9e8e6e, roughness: 0.9 }));
  nobleGround.name = 'nobleGroundPatch';
  nobleGround.rotation.x = -Math.PI/2; nobleGround.position.set(0, -0.545, -16);
  whiteKingdomGroup.add(nobleGround);

  // Inner fortress wall (midground) z = -10
  makeWallSegment(-5, -10, 0, 4.5, ivoryStoneMat, whiteKingdomGroup, 'wInner_L');
  makeWallSegment( 5, -10, 0, 4.5, ivoryStoneMat, whiteKingdomGroup, 'wInner_R');
  makeWallSegment( 0, -10, 0, 4.0, ivoryStoneMat, whiteKingdomGroup, 'wInner_C');

  // Inner towers at z = -10
  makeTower(-7.8, -10, ivoryStoneMat, 0x1a4fa3, whiteKingdomGroup, 'wInner_L', 4.5);
  makeTower( 7.8, -10, ivoryStoneMat, 0x1a4fa3, whiteKingdomGroup, 'wInner_R', 4.5);
  addSmokeColumn(-7.8, 4.5, -10, whiteKingdomGroup, 'wSmoke_Inner_L');
  addSmokeColumn( 7.8, 4.5, -10, whiteKingdomGroup, 'wSmoke_Inner_R');

  // Defensive emplacements on inner walls
  makeBallista(-5, -10, 0, whiteKingdomGroup).position.y = 2.45;
  makeBallista( 5, -10, 0, whiteKingdomGroup).position.y = 2.45;

  // Outer fortress wall (background) z = -17
  makeWallSegment(-6, -17, 0, 5.5, distantIvoryStoneMat, whiteKingdomGroup, 'wOuter_L');
  makeWallSegment( 6, -17, 0, 5.5, distantIvoryStoneMat, whiteKingdomGroup, 'wOuter_R');
  makeWallSegment( 0, -17, 0, 5.5, distantIvoryStoneMat, whiteKingdomGroup, 'wOuter_C');

  // Outer towers z = -17
  makeTower(-10, -17, distantIvoryStoneMat, 0x1a4fa3, whiteKingdomGroup, 'wOuter_L', 6);
  makeTower( 10, -17, distantIvoryStoneMat, 0x1a4fa3, whiteKingdomGroup, 'wOuter_R', 6);
  makeTower(  0, -22, distantIvoryStoneMat, 0xd4a020, whiteKingdomGroup, 'wOuter_C', 8); // central keep
  
  // Defensive emplacements on outer walls
  makeCatapult(-6, -17, 0, whiteKingdomGroup).position.y = 2.45;
  makeCatapult( 6, -17, 0, whiteKingdomGroup).position.y = 2.45;

  // Wall banners
  makeWallBanner(-3, 1.5, -16.65, 0x1a4fa3, whiteKingdomGroup);
  makeWallBanner( 3, 1.5, -16.65, 0x1a4fa3, whiteKingdomGroup);

  // Noble banner poles flanking board
  makeBannerPole(-7.2, -8, 0x1a4fa3, 0xd4a020, whiteKingdomGroup, 'wL1');
  makeBannerPole( 7.2, -8, 0x1a4fa3, 0xd4a020, whiteKingdomGroup, 'wR1');
  makeBannerPole(-9.5,-13, 0x1a4fa3, 0xffffff, whiteKingdomGroup, 'wL2');
  makeBannerPole( 9.5,-13, 0x1a4fa3, 0xffffff, whiteKingdomGroup, 'wR2');

  // Braziers — noble warm gold fire flanking staging area
  makeBrazier(-5.8, -8.5, whiteKingdomGroup, 'wL1', true);
  makeBrazier( 5.8, -8.5, whiteKingdomGroup, 'wR1', true);
  makeBrazier(-8.5,-12.5, whiteKingdomGroup, 'wL2', true);
  makeBrazier( 8.5,-12.5, whiteKingdomGroup, 'wR2', true);

  // Statue guards flanking the noble approach
  makeStatueGuard(-6.8, -8.8, 0.4, ivoryStoneMat, 0xd4a020, whiteKingdomGroup, 'wGuard_L1');
  makeStatueGuard( 6.8, -8.8,-0.4, ivoryStoneMat, 0xd4a020, whiteKingdomGroup, 'wGuard_R1');
  makeStatueGuard(-9.0,-12.8, 0.3, ivoryStoneMat, 0x1a4fa3, whiteKingdomGroup, 'wGuard_L2');
  makeStatueGuard( 9.0,-12.8,-0.3, ivoryStoneMat, 0x1a4fa3, whiteKingdomGroup, 'wGuard_R2');

  // Shield racks
  makeShieldRack(-10.5, -9.5, 0.3, true, whiteKingdomGroup, 'wRack_L');
  makeShieldRack( 10.5, -9.5,-0.3, true, whiteKingdomGroup, 'wRack_R');
  makeShieldRack(-4, -18, 0, true, whiteKingdomGroup, 'wRack_Inner1');
  makeShieldRack( 4, -18, 0, true, whiteKingdomGroup, 'wRack_Inner2');

  // Cheering armies
  makeArmy(-12, -14, 0.5, true, whiteKingdomGroup, 'wArmy_L');
  makeArmy( 12, -14, -0.5, true, whiteKingdomGroup, 'wArmy_R');

  // Staging area rocks
  makeStagingAreaRocks(-14, -12, true, whiteKingdomGroup, 'wRocks_L');
  makeStagingAreaRocks( 14, -12, true, whiteKingdomGroup, 'wRocks_R');

  // War drums
  makeCatapult(-12, -18, Math.PI/4, whiteKingdomGroup);
  makeCatapult( 12, -18, -Math.PI/4, whiteKingdomGroup);
  makeBrokenChariot(8, -19, -0.5, whiteKingdomGroup);
  makeWarDrum(-11.5,-11, whiteKingdomGroup, 'wDrum_L');
  makeWarDrum( 11.5,-11, whiteKingdomGroup, 'wDrum_R');
  makeWarDrum(  0.0,-13, whiteKingdomGroup, 'wDrum_C');

  // Smoke from towers
  addSmokeColumn(-10, 6, -17.5, whiteKingdomGroup, 'wSmoke_L');
  addSmokeColumn( 10, 6, -17.5, whiteKingdomGroup, 'wSmoke_R');
  addSmokeColumn(  0, 8, -22.5, whiteKingdomGroup, 'wSmoke_C');

  // Noble ambient fill light over white staging
  const nobleLight = new T.PointLight(0x8899ff, 0.6, 25, 1.5);
  nobleLight.name = 'nobleAmbientLight'; nobleLight.position.set(0, 6, -14);
  whiteKingdomGroup.add(nobleLight);

  // ═══════════════════════════════════════════════════════════
  //  BLACK KINGDOM  (z > 0 side — dark, obsidian, crimson)
  //  Black pieces start at rows 6-7 in chess → z = 2.5..3.5
  //  Dark fortress staged at z = +10 .. +22
  // ═══════════════════════════════════════════════════════════

  // Dark staging ground
  const darkGround = new T.Mesh(new T.PlaneGeometry(26, 18, 1, 1),
    new T.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.95 }));
  darkGround.name = 'darkGroundPatch';
  darkGround.rotation.x = -Math.PI/2; darkGround.position.set(0, -0.545, 16);
  blackKingdomGroup.add(darkGround);

  // Inner dark fortress wall z = +10
  makeWallSegment(-5,  10, 0, 4.5, darkStoneMat, blackKingdomGroup, 'bInner_L', true);
  makeWallSegment( 5,  10, 0, 4.5, darkStoneMat, blackKingdomGroup, 'bInner_R', true);
  makeWallSegment( 0,  10, 0, 4.0, darkStoneMat, blackKingdomGroup, 'bInner_C', true);

  // Inner dark towers z = +10
  makeTower(-7.8,  10, darkStoneMat, 0x8b0000, blackKingdomGroup, 'bInner_L', 4.5, true);
  makeTower( 7.8,  10, darkStoneMat, 0x8b0000, blackKingdomGroup, 'bInner_R', 4.5, true);
  addSmokeColumn(-7.8, 4.5, 10, blackKingdomGroup, 'bSmoke_Inner_L');
  addSmokeColumn( 7.8, 4.5, 10, blackKingdomGroup, 'bSmoke_Inner_R');

  // Defensive emplacements on inner walls
  makeBallista(-5, 10, Math.PI, blackKingdomGroup).position.y = 2.45;
  makeBallista( 5, 10, Math.PI, blackKingdomGroup).position.y = 2.45;

  // Outer dark fortress z = +17
  makeWallSegment(-6,  17, 0, 5.5, distantDarkStoneMat, blackKingdomGroup, 'bOuter_L', true);
  makeWallSegment( 6,  17, 0, 5.5, distantDarkStoneMat, blackKingdomGroup, 'bOuter_R', true);
  makeWallSegment( 0,  17, 0, 5.5, distantDarkStoneMat, blackKingdomGroup, 'bOuter_C', true);

  makeTower(-10,  17, distantDarkStoneMat, 0x8b0000, blackKingdomGroup, 'bOuter_L', 6, true);
  makeTower( 10,  17, distantDarkStoneMat, 0x8b0000, blackKingdomGroup, 'bOuter_R', 6, true);
  makeTower(  0,  22, distantDarkStoneMat, 0x3d0d5c, blackKingdomGroup, 'bOuter_C', 8, true); // dark keep

  // Defensive emplacements on outer walls
  makeCatapult(-6, 17, Math.PI, blackKingdomGroup).position.y = 2.45;
  makeCatapult( 6, 17, Math.PI, blackKingdomGroup).position.y = 2.45;

  // Wall banners
  makeWallBanner(-3, 1.5, 16.65, 0x8b0000, blackKingdomGroup);
  makeWallBanner( 3, 1.5, 16.65, 0x8b0000, blackKingdomGroup);

  // Dark banner poles
  makeBannerPole(-7.2,  8, 0x8b0000, 0x3d0d5c, blackKingdomGroup, 'bL1');
  makeBannerPole( 7.2,  8, 0x8b0000, 0x3d0d5c, blackKingdomGroup, 'bR1');
  makeBannerPole(-9.5, 13, 0x8b0000, 0xff3300, blackKingdomGroup, 'bL2');
  makeBannerPole( 9.5, 13, 0x8b0000, 0xff3300, blackKingdomGroup, 'bR2');

  // Braziers — dark crimson fire
  makeBrazier(-5.8,  8.5, blackKingdomGroup, 'bL1', false);
  makeBrazier( 5.8,  8.5, blackKingdomGroup, 'bR1', false);
  makeBrazier(-8.5, 12.5, blackKingdomGroup, 'bL2', false);
  makeBrazier( 8.5, 12.5, blackKingdomGroup, 'bR2', false);

  // Dark statue guards
  makeStatueGuard(-6.8,  8.8, Math.PI-0.4, darkStoneMat, 0x8b0000, blackKingdomGroup, 'bGuard_L1');
  makeStatueGuard( 6.8,  8.8, Math.PI+0.4, darkStoneMat, 0x8b0000, blackKingdomGroup, 'bGuard_R1');
  makeStatueGuard(-9.0, 12.8, Math.PI-0.3, darkStoneMat, 0x3d0d5c, blackKingdomGroup, 'bGuard_L2');
  makeStatueGuard( 9.0, 12.8, Math.PI+0.3, darkStoneMat, 0x3d0d5c, blackKingdomGroup, 'bGuard_R2');

  // Shield racks
  makeShieldRack(-10.5,  9.5, Math.PI-0.3, false, blackKingdomGroup, 'bRack_L');
  makeShieldRack( 10.5,  9.5, Math.PI+0.3, false, blackKingdomGroup, 'bRack_R');
  makeShieldRack(-4, 18, Math.PI, false, blackKingdomGroup, 'bRack_Inner1');
  makeShieldRack( 4, 18, Math.PI, false, blackKingdomGroup, 'bRack_Inner2');

  // Cheering armies
  makeArmy(-12, 14, Math.PI-0.5, false, blackKingdomGroup, 'bArmy_L');
  makeArmy( 12, 14, Math.PI+0.5, false, blackKingdomGroup, 'bArmy_R');

  // Staging area rocks
  makeStagingAreaRocks(-14, 12, false, blackKingdomGroup, 'bRocks_L');
  makeStagingAreaRocks( 14, 12, false, blackKingdomGroup, 'bRocks_R');

  // War drums
  makeCatapult(-12, 18, Math.PI - Math.PI/4, blackKingdomGroup);
  makeCatapult( 12, 18, Math.PI + Math.PI/4, blackKingdomGroup);
  makeBrokenChariot(-8, 19, Math.PI + 0.5, blackKingdomGroup);
  makeWarDrum(-11.5, 11, blackKingdomGroup, 'bDrum_L');
  makeWarDrum( 11.5, 11, blackKingdomGroup, 'bDrum_R');
  makeWarDrum(   0, 13,  blackKingdomGroup, 'bDrum_C');

  // Smoke from dark towers
  addSmokeColumn(-10, 6, 17.5, blackKingdomGroup, 'bSmoke_L');
  addSmokeColumn( 10, 6, 17.5, blackKingdomGroup, 'bSmoke_R');
  addSmokeColumn(  0, 8, 22.5, blackKingdomGroup, 'bSmoke_C');

  // Eerie purple/red ambient for dark side
  const darkLight = new T.PointLight(0xff2200, 0.5, 25, 1.5);
  darkLight.name = 'darkAmbientLight'; darkLight.position.set(0, 6, 14);
  blackKingdomGroup.add(darkLight);

  // ═══════════════════════════════════════════════════════════
  //  SIDE WAR PROPS  (left + right edges, symmetric)
  // ═══════════════════════════════════════════════════════════
  // More banner poles along the sides
  for (let side = -1; side <= 1; side += 2) {
    makeBannerPole(side*11, -5, side < 0 ? 0x1a4fa3 : 0x8b0000, 0xd4a020, warPropsGroup, `side_${side}_1`);
    makeBannerPole(side*11,  0, side < 0 ? 0x1a4fa3 : 0x8b0000, 0xd4a020, warPropsGroup, `side_${side}_2`);
    makeBannerPole(side*11,  5, side < 0 ? 0x1a4fa3 : 0x8b0000, 0xd4a020, warPropsGroup, `side_${side}_3`);
    makeBrazier(side*9.5, -3.5, warPropsGroup, `sideB_${side}_1`, side < 0);
    makeBrazier(side*9.5,  3.5, warPropsGroup, `sideB_${side}_2`, side < 0);
  }

  // Stone rubble piles at corners
  const rubbleMat = new T.MeshStandardMaterial({ color: 0x6b5e4a, roughness: 0.95 });
  const rubblePositions = [[-8,-8],[-8,8],[8,-8],[8,8]];
  rubblePositions.forEach(([rx,rz],ri) => {
    const rg = new T.Group(); rg.name = `rubble_${ri}`;
    for (let k = 0; k < 5; k++) {
      const rock = new T.Mesh(new T.DodecahedronGeometry(0.15+Math.random()*0.2, 0), rubbleMat);
      rock.name = `rubbleRock_${k}`;
      rock.position.set(rx+Math.random()*0.5-0.25, -0.45, rz+Math.random()*0.5-0.25);
      rock.rotation.set(Math.random()*2,Math.random()*2,Math.random()*2);
      rg.add(rock);
    }
    warPropsGroup.add(rg);
  });

  // Add siege engines and broken chariots
  makeCatapult(-14, -6, Math.PI/6, warPropsGroup);
  makeCatapult( 14,  6, -Math.PI/6 + Math.PI, warPropsGroup);
  makeBallista(-16, 2, Math.PI/4, warPropsGroup);
  makeBallista( 16, -2, -Math.PI/4 + Math.PI, warPropsGroup);
  
  makeBrokenChariot(-12, 12, Math.PI/4, warPropsGroup);
  makeBrokenChariot( 13, -10, -Math.PI/3, warPropsGroup);

  // Ruined structures on the edges
  makeRuinedTower(-18, -8, distantIvoryStoneMat, warPropsGroup, 'wRuins_1');
  makeRuinedTower( 18,  8, distantDarkStoneMat, warPropsGroup, 'bRuins_1');

  // Scattered arrows on the battlefield
  for (let i = 0; i < 50; i++) {
    const arrow = cyl(0.02, 0.02, 0.8, 4, woodMat);
    const x = (Math.random() - 0.5) * 30;
    const z = (Math.random() - 0.5) * 20;
    
    // Don't place arrows directly on the board
    if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
    
    arrow.position.set(x, 0.02, z);
    arrow.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.2;
    arrow.rotation.y = Math.random() * Math.PI * 2;
    arrow.rotation.z = (Math.random() - 0.5) * 0.2;
    warPropsGroup.add(arrow);
  }

  // Craters and scorch marks
  for (let i = 0; i < 15; i++) {
    const x = (Math.random() - 0.5) * 35;
    const z = (Math.random() - 0.5) * 20;
    if (Math.abs(x) < 4 && Math.abs(z) < 4) continue;
    
    if (Math.random() > 0.5) {
      makeCrater(x, z, 0.5 + Math.random() * 1.5, warPropsGroup);
    } else {
      makeScorchMark(x, z, 1.0 + Math.random() * 2.0, warPropsGroup);
    }
  }

  // Scattered bones
  for (let i = 0; i < 20; i++) {
    const x = (Math.random() - 0.5) * 30;
    const z = (Math.random() - 0.5) * 18;
    if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
    makeBone(x, z, Math.random() * Math.PI, warPropsGroup);
  }

  // Broken weapons
  for (let i = 0; i < 12; i++) {
    const x = (Math.random() - 0.5) * 28;
    const z = (Math.random() - 0.5) * 18;
    if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
    
    // Some stuck in ground, some lying flat
    const rotX = Math.random() > 0.5 ? Math.PI/2 : Math.random() * 0.5;
    makeBrokenSword(x, z, Math.random() * Math.PI, rotX, warPropsGroup);
  }

  // Discarded shields
  for (let i = 0; i < 10; i++) {
    const x = (Math.random() - 0.5) * 28;
    const z = (Math.random() - 0.5) * 18;
    if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
    
    const isWhite = Math.random() > 0.5;
    const rotX = Math.random() > 0.5 ? -Math.PI/2 : -Math.PI/2 + (Math.random() - 0.5) * 0.4;
    makeDiscardedShield(x, z, Math.random() * Math.PI, rotX, isWhite, warPropsGroup);
  }

  // ═══════════════════════════════════════════════════════════
  //  ATMOSPHERE — embers, distant haze mountains, skyline
  // ═══════════════════════════════════════════════════════════
  // Ember particles (simple small glowing spheres drifting upward)
  const emberGeo = new T.SphereGeometry(0.04, 4, 4);
  const emberPositions = [
    [-5.8,-8.5],[5.8,-8.5],[-8.5,-12.5],[8.5,-12.5],
    [-5.8, 8.5],[5.8, 8.5],[-8.5, 12.5],[8.5, 12.5],
    [-9.5,-3.5],[9.5,-3.5],[-9.5,3.5],[9.5,3.5],
  ];
  emberPositions.forEach(([ex,ez],ei) => {
    for (let k = 0; k < 4; k++) {
      const emb = new T.Mesh(emberGeo, emberMat);
      emb.name = `ember_${ei}_${k}`;
      emb.position.set(ex + Math.random()*0.6-0.3, 0.5+Math.random()*2, ez + Math.random()*0.6-0.3);
      emb.userData = {
        baseX: ex, baseZ: ez,
        phase: Math.random()*Math.PI*2,
        speed: 0.4 + Math.random()*0.6,
        radius: 0.2 + Math.random()*0.3,
      };
      atmosphereGroup.add(emb);
      embers.push(emb);
    }
  });

  // Distant silhouette mountains (very low poly backdrop)
  const mountMat = new T.MeshStandardMaterial({ color: 0x0a0810, roughness: 1.0 });
  const mountAngles = [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2, 1.6, -1.6, Math.PI-0.3, Math.PI, Math.PI+0.3];
  mountAngles.forEach((a, mi) => {
    const dist = 48 + Math.random()*12;
    const h = 5 + Math.random()*9;
    const w = 7 + Math.random()*8;
    const mount = new T.Mesh(new T.ConeGeometry(w, h, 5), mountMat);
    mount.name = `mountain_${mi}`;
    mount.position.set(Math.cos(a)*dist, h*0.3 - 0.55, Math.sin(a)*dist);
    mount.scale.y = 0.55 + Math.random()*0.3;
    atmosphereGroup.add(mount);
  });

  // Wind-blown dust particles
  const dustGeo = new T.PlaneGeometry(0.1, 0.1);
  const dustMat = new T.MeshBasicMaterial({ color: 0xaa9988, transparent: true, opacity: 0.3, side: T.DoubleSide, depthWrite: false });
  for (let i = 0; i < 150; i++) {
    const dust = new T.Mesh(dustGeo, dustMat);
    dust.position.set((Math.random()-0.5)*60, Math.random()*4, (Math.random()-0.5)*60);
    dust.userData = {
      speedX: (Math.random()-0.5)*0.05 + 0.02,
      speedY: (Math.random()-0.5)*0.01,
      speedZ: (Math.random()-0.5)*0.05,
      phase: Math.random()*Math.PI*2
    };
    atmosphereGroup.add(dust);
    dustParticles.push(dust);
  }

  // Distant battle fire glow on horizons (emissive planes)
  const glowMat = new T.MeshStandardMaterial({ color: 0xff3300, emissive: new T.Color(0xff1100), emissiveIntensity: 1.2, transparent: true, opacity: 0.12, depthWrite: false, side: T.DoubleSide });
  [[-18, 0.65], [18, 0.55]].forEach(([gz, gi], gi2) => {
    const gp = new T.Mesh(new T.PlaneGeometry(20, 3), glowMat);
    gp.name = `horizonGlow_${gi2}`;
    gp.position.set(0, 1, gz); gp.rotation.x = -0.15;
    atmosphereGroup.add(gp);
  });

  // ── Update sky shader and fog to war mood ──
  // (skyMat is defined globally in scene.js; we update uniforms after the fact)
  // We use a delayed call since skyMat is defined later in scene.js load order.
  // Instead we expose a patchSky function for scene.js to call.
}

// ═══════════════════════════════════════════════════════════
//  UPDATE — call this every frame from animate()
//  updateEnvironment(time)  where time = performance.now()/1000
// ═══════════════════════════════════════════════════════════
export function updateEnvironment(time) {
  // Brazier flicker
  brazierLights.forEach(({ light, offset, isNobre }) => {
    const flicker = Math.sin(time * 9.3 + offset) * 0.3 + Math.sin(time * 7.1 + offset * 2) * 0.2;
    light.intensity = (isNobre ? 1.4 : 1.2) + flicker * 0.6;
  });

  // Cheering figures
  cheeringFigures.forEach(figure => {
    const ud = figure.userData;
    if (ud.isCheering) {
      figure.position.y = ud.baseY + Math.abs(Math.sin(time * ud.speed + ud.phase)) * 0.2;
      figure.rotation.z = Math.sin(time * ud.speed * 0.5 + ud.phase) * 0.1;
    }
  });

  // Banner sway
  bannerMeshes.forEach(({ mesh, offset }) => {
    mesh.rotation.z = Math.sin(time * 1.5 + offset) * 0.1;
    mesh.rotation.x = Math.sin(time * 2.1 + offset) * 0.05;
  });

  // Ember drift upward and reset
  embers.forEach(emb => {
    const ud = emb.userData;
    emb.position.y += 0.008;
    emb.position.x = ud.baseX + Math.sin(time * ud.speed + ud.phase) * ud.radius;
    emb.position.z = ud.baseZ + Math.cos(time * ud.speed * 0.7 + ud.phase) * ud.radius * 0.5;
    // Fade out at top, reset at bottom
    const h = emb.position.y;
    if (h > 4.5) { emb.position.y = 0.3; }
    emb.material.opacity = 0.6 + Math.sin(time * 6 + ud.phase) * 0.3;
    const scale = 0.5 + (h / 4.5) * 0.5;
    emb.scale.setScalar(scale);
  });

  // Smoke puff drift + gentle oscillation
  smokeParticles.forEach(puff => {
    const ud = puff.userData;
    puff.position.y = ud.baseY + Math.sin(time * 0.4 + ud.phase) * 0.3;
    puff.position.x += 0.001;
    puff.material.opacity = 0.1 + Math.sin(time * 0.3 + ud.phase) * 0.06;
    puff.rotation.y = time * 0.05 + ud.phase;
  });

  // Dust particles blowing in the wind
  dustParticles.forEach(dust => {
    dust.position.x += dust.userData.speedX;
    dust.position.y += dust.userData.speedY + Math.sin(time*2 + dust.userData.phase)*0.005;
    dust.position.z += dust.userData.speedZ;
    if (dust.position.x > 30) dust.position.x -= 60;
    if (dust.position.x < -30) dust.position.x += 60;
    if (dust.position.z > 30) dust.position.z -= 60;
    if (dust.position.z < -30) dust.position.z += 60;
    if (dust.position.y > 3) dust.position.y -= 3;
    if (dust.position.y < 0) dust.position.y += 3;
    dust.rotation.y = time + dust.userData.phase;
    dust.rotation.x = time*0.5 + dust.userData.phase;
  });

  // Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.progress += p.speed * 0.016; // Assuming ~60fps delta
    
    if (p.progress < 0) {
      p.mesh.visible = false;
      continue;
    }
    p.mesh.visible = true;

    if (p.progress >= 1) {
      _scene.remove(p.mesh);
      projectiles.splice(i, 1);
      continue;
    }
    
    // Parabolic arc
    const currentX = p.startX + (p.endX - p.startX) * p.progress;
    const currentZ = p.startZ + (p.endZ - p.startZ) * p.progress;
    const currentY = Math.sin(p.progress * Math.PI) * p.height;
    
    p.mesh.position.set(currentX, currentY, currentZ);
    
    if (p.isFireball) {
      p.mesh.rotation.x += 0.1;
      p.mesh.rotation.y += 0.2;
    } else {
      // Point arrow along trajectory
      const dx = p.endX - p.startX;
      const dz = p.endZ - p.startZ;
      const dy = Math.cos(p.progress * Math.PI) * p.height * Math.PI; // Derivative of sin(t*PI)*h
      
      const angleY = Math.atan2(dx, dz);
      const angleX = Math.atan2(dy, Math.sqrt(dx*dx + dz*dz));
      
      p.mesh.rotation.y = angleY;
      p.mesh.rotation.x = -angleX;
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  PROJECTILES — fire from one side to another on capture
// ═══════════════════════════════════════════════════════════
export function fireProjectile(isWhiteCaptured) {
  if (!_scene || !_THREE) return;
  const T = _THREE;

  // If white is captured, black fires at white. So start at black side (z ~ 12), target white side (z ~ -12)
  const startZ = isWhiteCaptured ? 12 : -12;
  const endZ = isWhiteCaptured ? -12 : 12;

  const isFireball = Math.random() > 0.5;
  const count = isFireball ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 10) + 5;

  for (let i = 0; i < count; i++) {
    const startX = (Math.random() - 0.5) * 16;
    const endX = (Math.random() - 0.5) * 16;
    
    let mesh;
    if (isFireball) {
      mesh = new T.Mesh(
        new T.SphereGeometry(0.3 + Math.random() * 0.2, 8, 8),
        new T.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 2 })
      );
    } else {
      // Arrow
      mesh = new T.Group();
      const shaft = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 1, 4), new T.MeshStandardMaterial({ color: 0x332211 }));
      shaft.rotation.x = Math.PI / 2;
      mesh.add(shaft);
      const head = new T.Mesh(new T.ConeGeometry(0.06, 0.2, 4), new T.MeshStandardMaterial({ color: 0x888888 }));
      head.position.z = 0.5;
      head.rotation.x = Math.PI / 2;
      mesh.add(head);
    }

    mesh.position.set(startX, 4, startZ);
    _scene.add(mesh);

    projectiles.push({
      mesh,
      startX, startZ,
      endX, endZ,
      progress: -Math.random() * 0.2, // Staggered start
      speed: 0.5 + Math.random() * 0.5,
      height: 4 + Math.random() * 6,
      isFireball
    });
  }
}

// ═══════════════════════════════════════════════════════════
//  SKY MOOD PATCH — call after skyMat is available
//  patchSkyForWar(skyMat)
// ═══════════════════════════════════════════════════════════
export function patchSkyForWar(skyMat) {
  if (!skyMat || !skyMat.uniforms) return;
  skyMat.uniforms.uZenithColor.value.set(0x1a1428);
  skyMat.uniforms.uHorizonColor.value.set(0x6b3020);
  skyMat.uniforms.uGroundColor.value.set(0x221510);
  skyMat.uniforms.uSunGlowColor.value.set(0xff6622);
}
