import * as THREE from 'three';
import { TrackKinematics } from './TrackKinematics';

/**
 * Stage 1A Placeholder Geometries:
 * All models are explicitly labeled as procedural placeholders (占位模型)
 * designed for spatial composition, scale verification, and camera testing.
 * No unverified historical assets or unverified liveries are claimed as final.
 */
export class ScenePlaceholders {
  public group: THREE.Group;
  public trainGroup: THREE.Group;

  // Individual train components
  public locoNode!: THREE.Group;
  public coach1Node!: THREE.Group;
  public coach2Node!: THREE.Group;
  public passengerSeatNode!: THREE.Object3D; // Camera A anchor

  // Track reference
  private trackKinematics: TrackKinematics;

  // Cache materials for reuse and high performance
  private materials: { [key: string]: THREE.Material } = {};

  constructor(trackKinematics: TrackKinematics) {
    this.trackKinematics = trackKinematics;
    this.group = new THREE.Group();
    this.trainGroup = new THREE.Group();
    this.group.add(this.trainGroup);

    this.initMaterials();
    this.buildTerrainAndDistantHills();
    this.buildTrackSystem();
    this.buildStationMassing();
    this.buildTrainPlaceholders();
  }

  private initMaterials() {
    this.materials['ground'] = new THREE.MeshStandardMaterial({
      color: 0x6e7855,
      roughness: 0.9,
      metalness: 0.05,
    });
    this.materials['riverbed'] = new THREE.MeshStandardMaterial({
      color: 0x47594a,
      roughness: 0.75,
      metalness: 0.08,
    });
    this.materials['ballast'] = new THREE.MeshStandardMaterial({
      color: 0x58534e,
      roughness: 0.98,
      metalness: 0.0,
    });
    this.materials['rail'] = new THREE.MeshStandardMaterial({
      color: 0x949da8, // Steel rail with bright specular reflection
      roughness: 0.26,
      metalness: 0.85,
    });
    this.materials['sleeper'] = new THREE.MeshStandardMaterial({
      color: 0x3c3026,
      roughness: 0.92,
      metalness: 0.0,
    });
    this.materials['stationWall'] = new THREE.MeshStandardMaterial({
      color: 0x767b7e, // Matte heritage brick
      roughness: 0.88,
      metalness: 0.0,
    });
    this.materials['stationRoof'] = new THREE.MeshStandardMaterial({
      color: 0x3b4e47, // Traditional pitched roof with gentle glazed sheen
      roughness: 0.52,
      metalness: 0.12,
    });
    this.materials['platform'] = new THREE.MeshStandardMaterial({
      color: 0x9e9a92, // Concrete platform
      roughness: 0.85,
      metalness: 0.0,
    });
    this.materials['canopy'] = new THREE.MeshStandardMaterial({
      color: 0x616d64,
      roughness: 0.62,
      metalness: 0.18,
    });

    // Train placeholder materials (explicitly neutral placeholder palette)
    this.materials['locoBody'] = new THREE.MeshStandardMaterial({
      color: 0x394339, // Muted slate-olive placeholder
      roughness: 0.48,
      metalness: 0.22,
    });
    this.materials['locoTrim'] = new THREE.MeshStandardMaterial({
      color: 0xc29d32, // Muted amber-gold indicator
      roughness: 0.38,
      metalness: 0.22,
    });
    this.materials['coachBody'] = new THREE.MeshStandardMaterial({
      color: 0x3e473e, // Neutral coach body
      roughness: 0.52,
      metalness: 0.18,
    });
    this.materials['coachRoof'] = new THREE.MeshStandardMaterial({
      color: 0x2b302d,
      roughness: 0.65,
      metalness: 0.2,
    });
    this.materials['trainChassis'] = new THREE.MeshStandardMaterial({
      color: 0x202224,
      roughness: 0.78,
      metalness: 0.5,
    });
    this.materials['wheel'] = new THREE.MeshStandardMaterial({
      color: 0x222629,
      roughness: 0.36,
      metalness: 0.75,
    });
    this.materials['windowGlass'] = new THREE.MeshStandardMaterial({
      color: 0xaecbdc,
      roughness: 0.08,
      metalness: 0.9,
      transparent: true,
      opacity: 0.65,
    });
    this.materials['treeFoliage'] = new THREE.MeshStandardMaterial({
      color: 0x3a5436,
      roughness: 0.88,
      metalness: 0.0,
      flatShading: true,
    });
    this.materials['treeTrunk'] = new THREE.MeshStandardMaterial({
      color: 0x503e32,
      roughness: 0.92,
      metalness: 0.0,
    });
    this.materials['distantHills'] = new THREE.MeshStandardMaterial({
      color: 0x485c4a,
      roughness: 0.96,
      metalness: 0.0,
      flatShading: true,
    });
  }

  /**
   * 1. Ground, riverbed, and distant hills composition
   */
  private buildTerrainAndDistantHills() {
    // Main ground plane
    const groundGeo = new THREE.PlaneGeometry(500, 500, 32, 32);
    const ground = new THREE.Mesh(groundGeo, this.materials['ground']);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Lam Tsuen River depression/waterway representation in the north
    const riverGeo = new THREE.BoxGeometry(400, 0.4, 25);
    const river = new THREE.Mesh(riverGeo, this.materials['riverbed']);
    river.position.set(0, -0.22, 115);
    river.rotation.y = 0.08;
    this.group.add(river);

    // Distant mountain range (Tai Mo Shan & Pat Sin Leng direction backdrops)
    // Providing essential depth and landscape framing as in the Osaka reference
    const hillsGroup = new THREE.Group();
    const hillConfigs = [
      { x: -160, z: -180, r: 120, h: 48 },
      { x: -80, z: -220, r: 140, h: 62 },
      { x: 40, z: -250, r: 160, h: 70 },
      { x: 160, z: -200, r: 130, h: 55 },
      { x: -180, z: 120, r: 110, h: 42 },
      { x: -120, z: 220, r: 140, h: 58 },
      { x: 60, z: 260, r: 150, h: 65 },
      { x: 180, z: 200, r: 130, h: 50 },
    ];

    hillConfigs.forEach((cfg) => {
      const coneGeo = new THREE.ConeGeometry(cfg.r, cfg.h, 7);
      const hill = new THREE.Mesh(coneGeo, this.materials['distantHills']);
      hill.position.set(cfg.x, cfg.h / 2 - 5, cfg.z);
      hillsGroup.add(hill);
    });
    this.group.add(hillsGroup);

    // A few rural trees along the station edge to establish natural scale
    const treeGroup = new THREE.Group();
    const treePositions = [
      [-15, 0, -35],
      [-18, 0, -10],
      [-22, 0, 25],
      [-16, 0, 50],
      [14, 0, -45],
      [16, 0, 30],
      [22, 0, 75],
    ];

    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3.5, 6);
    const foliageGeo = new THREE.DodecahedronGeometry(2.8, 1);

    treePositions.forEach(([x, y, z]) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, this.materials['treeTrunk']);
      trunk.position.y = 1.75;
      trunk.castShadow = true;
      tree.add(trunk);

      const foliage = new THREE.Mesh(foliageGeo, this.materials['treeFoliage']);
      foliage.position.y = 4.2;
      foliage.castShadow = true;
      tree.add(foliage);

      tree.position.set(x, y, z);
      treeGroup.add(tree);
    });
    this.group.add(treeGroup);
  }

  /**
   * 2. High-performance track system (Rails + Instanced Sleepers)
   */
  private buildTrackSystem() {
    const samples = this.trackKinematics.getTrackSamples(600);
    const sleeperSpacing = 0.85; // meters between sleepers
    const sleeperCount = Math.floor(this.trackKinematics.totalLength / sleeperSpacing);

    // InstancedMesh for sleepers (Draw call = 1 for all sleepers!)
    const sleeperGeo = new THREE.BoxGeometry(2.4, 0.14, 0.24);
    const sleeperMesh = new THREE.InstancedMesh(
      sleeperGeo,
      this.materials['sleeper'],
      sleeperCount
    );
    sleeperMesh.castShadow = true;
    sleeperMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const trackUp = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < sleeperCount; i++) {
      const dist = i * sleeperSpacing;
      const pos = this.trackKinematics.getPointAtDistance(dist);
      const tangent = this.trackKinematics.getTangentAtDistance(dist).normalize();
      const normal = new THREE.Vector3().crossVectors(trackUp, tangent).normalize();

      dummy.position.copy(pos);
      dummy.position.y = 0.08; // slightly above ballast

      // Align rotation to track orientation
      const matrix = new THREE.Matrix4();
      matrix.makeBasis(normal, trackUp, tangent);
      dummy.rotation.setFromRotationMatrix(matrix);
      dummy.updateMatrix();

      sleeperMesh.setMatrixAt(i, dummy.matrix);
    }
    sleeperMesh.instanceMatrix.needsUpdate = true;
    this.group.add(sleeperMesh);

    // Continuous rails (Left & Right rail using TubeGeometry along offset curves)
    const gaugeHalf = 1.435 / 2; // standard gauge ~1.435m
    const leftPoints: THREE.Vector3[] = [];
    const rightPoints: THREE.Vector3[] = [];

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const leftPt = s.position.clone().addScaledVector(s.normal, -gaugeHalf);
      leftPt.y = 0.22;
      const rightPt = s.position.clone().addScaledVector(s.normal, gaugeHalf);
      rightPt.y = 0.22;

      leftPoints.push(leftPt);
      rightPoints.push(rightPt);
    }

    const leftRailCurve = new THREE.CatmullRomCurve3(leftPoints, true);
    const rightRailCurve = new THREE.CatmullRomCurve3(rightPoints, true);

    const railGeoLeft = new THREE.TubeGeometry(leftRailCurve, 300, 0.045, 6, true);
    const railGeoRight = new THREE.TubeGeometry(rightRailCurve, 300, 0.045, 6, true);

    const railMeshLeft = new THREE.Mesh(railGeoLeft, this.materials['rail']);
    const railMeshRight = new THREE.Mesh(railGeoRight, this.materials['rail']);
    railMeshLeft.castShadow = true;
    railMeshRight.castShadow = true;

    this.group.add(railMeshLeft);
    this.group.add(railMeshRight);

    // Ballast trackbed under station area
    const ballastGeo = new THREE.BoxGeometry(3.6, 0.16, 120);
    const ballast = new THREE.Mesh(ballastGeo, this.materials['ballast']);
    ballast.position.set(0, 0.06, 0);
    ballast.receiveShadow = true;
    this.group.add(ballast);
  }

  /**
   * 3. Station Platform & 1913 Lingnan Pitched Roof Building Massing Placeholder
   */
  private buildStationMassing() {
    const stationGroup = new THREE.Group();

    // Platform 1 (running on West side of track, length ~65m, width ~4.5m, height ~0.75m)
    const platformGeo = new THREE.BoxGeometry(4.6, 0.75, 70);
    const platform = new THREE.Mesh(platformGeo, this.materials['platform']);
    platform.position.set(-3.7, 0.375, 0);
    platform.receiveShadow = true;
    platform.castShadow = true;
    stationGroup.add(platform);

    // Platform stone curb / safety line indicator
    const curbGeo = new THREE.BoxGeometry(0.2, 0.04, 70);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xded8ce, roughness: 0.7 });
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(-1.45, 0.76, 0);
    stationGroup.add(curb);

    // Platform Canopy Placeholder (波浪雨棚占位幾何)
    const canopyGroup = new THREE.Group();
    const canopyRoofGeo = new THREE.BoxGeometry(4.0, 0.15, 34);
    const canopyRoof = new THREE.Mesh(canopyRoofGeo, this.materials['canopy']);
    canopyRoof.position.set(-3.7, 3.8, 0);
    canopyRoof.castShadow = true;
    canopyRoof.receiveShadow = true;
    canopyGroup.add(canopyRoof);

    // Canopy support posts (set back from platform edge with safety clearance)
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.1, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x3a3f3a, roughness: 0.6 });
    [-15, -7.5, 7.5, 15].forEach((z) => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(-2.4, 2.25, z);
      post.castShadow = true;
      canopyGroup.add(post);
    });

    // Vintage station nameplate placeholder on canopy
    const signGeo = new THREE.BoxGeometry(0.1, 0.5, 3.2);
    const signMat = new THREE.MeshStandardMaterial({ color: 0x1b2838, roughness: 0.5 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(-1.75, 3.2, 0);
    canopyGroup.add(sign);

    stationGroup.add(canopyGroup);

    // 1913 Station Building Main Massing (Chinese Lingnan Pitched Roof Archetype)
    // Main hall block (approx 24m long, 10m wide, 6m wall height)
    const buildingGroup = new THREE.Group();
    const hallGeo = new THREE.BoxGeometry(10, 5.8, 24);
    const hall = new THREE.Mesh(hallGeo, this.materials['stationWall']);
    hall.position.set(-11.5, 2.9, 0);
    hall.castShadow = true;
    hall.receiveShadow = true;
    buildingGroup.add(hall);

    // Traditional Chinese pitched roof massing (金字歇山頂幾何占位)
    // Triangular prism / roof extrusion
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-5.8, 0);
    roofShape.lineTo(0, 3.6); // ridge height
    roofShape.lineTo(5.8, 0);
    roofShape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 26,
      bevelEnabled: true,
      bevelThickness: 0.6,
      bevelSize: 0.4,
      bevelSegments: 2,
    };
    const roofGeo = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
    const roof = new THREE.Mesh(roofGeo, this.materials['stationRoof']);
    roof.rotation.y = Math.PI / 2;
    roof.position.set(-11.5, 5.8, -13);
    roof.castShadow = true;
    roof.receiveShadow = true;
    buildingGroup.add(roof);

    // Roof ridge ornament placeholder (正脊博古飾幾何)
    const ridgeGeo = new THREE.BoxGeometry(0.4, 0.5, 26);
    const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x2b3831, roughness: 0.5 });
    const ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
    ridge.position.set(-11.5, 9.6, 0);
    buildingGroup.add(ridge);

    // Station entrance arcade / portico arch placeholder (券廊幾何)
    const porchGeo = new THREE.BoxGeometry(3, 4.0, 8);
    const porch = new THREE.Mesh(porchGeo, this.materials['stationWall']);
    porch.position.set(-17.8, 2.0, 0);
    buildingGroup.add(porch);

    stationGroup.add(buildingGroup);

    // Semaphore signal placeholder at north exit
    const signalGroup = new THREE.Group();
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 7.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 3.75;
    pole.castShadow = true;
    signalGroup.add(pole);

    // Semaphore arm (red/white placeholder)
    const armGeo = new THREE.BoxGeometry(0.08, 0.35, 1.6);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xba2828, roughness: 0.4 });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0, 6.2, 0.7);
    signalGroup.add(arm);

    signalGroup.position.set(2.4, 0, 42);
    stationGroup.add(signalGroup);

    this.group.add(stationGroup);
  }

  /**
   * 4. Train Placeholder Models (1 Locomotive + 2 Coaches)
   * Strictly configured as replaceable modular placeholder assemblies.
   */
  private buildTrainPlaceholders() {
    // A. Locomotive Placeholder (G12 Envelope Massing)
    this.locoNode = new THREE.Group();

    // Chassis / frame
    const chassisGeo = new THREE.BoxGeometry(2.9, 0.5, 13.5);
    const chassis = new THREE.Mesh(chassisGeo, this.materials['trainChassis']);
    chassis.position.y = 1.0;
    chassis.castShadow = true;
    this.locoNode.add(chassis);

    // Front Long Hood (Engine Compartment)
    const longHoodGeo = new THREE.BoxGeometry(2.6, 2.4, 8.5);
    const longHood = new THREE.Mesh(longHoodGeo, this.materials['locoBody']);
    longHood.position.set(0, 2.45, 1.8);
    longHood.castShadow = true;
    this.locoNode.add(longHood);

    // Driver Cab (Elevated offset structure)
    const cabGeo = new THREE.BoxGeometry(2.8, 2.85, 2.8);
    const cab = new THREE.Mesh(cabGeo, this.materials['locoBody']);
    cab.position.set(0, 2.65, -3.8);
    cab.castShadow = true;
    this.locoNode.add(cab);

    // Cab Windows
    const cabWindowGeo = new THREE.BoxGeometry(2.84, 0.8, 1.8);
    const cabWindow = new THREE.Mesh(cabWindowGeo, this.materials['windowGlass']);
    cabWindow.position.set(0, 3.2, -3.8);
    this.locoNode.add(cabWindow);

    // Rear Short Hood
    const shortHoodGeo = new THREE.BoxGeometry(2.6, 2.2, 1.6);
    const shortHood = new THREE.Mesh(shortHoodGeo, this.materials['locoBody']);
    shortHood.position.set(0, 2.35, -5.9);
    shortHood.castShadow = true;
    this.locoNode.add(shortHood);

    // Placeholder warning stripe band on hood
    const stripeGeo = new THREE.BoxGeometry(2.64, 0.25, 8.55);
    const stripe = new THREE.Mesh(stripeGeo, this.materials['locoTrim']);
    stripe.position.set(0, 2.2, 1.8);
    this.locoNode.add(stripe);

    // Headlight / searchlight
    const headlightGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12);
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xfff6bd,
      emissive: 0xffea85,
      emissiveIntensity: 0.6,
    });
    const headlight = new THREE.Mesh(headlightGeo, headlightMat);
    headlight.rotation.x = Math.PI / 2;
    headlight.position.set(0, 3.2, 6.1);
    this.locoNode.add(headlight);

    // Bogies / Wheels
    this.addBogies(this.locoNode, [-3.8, 3.8]);

    this.trainGroup.add(this.locoNode);

    // B. Coach 1 Placeholder (with Passenger Seat Camera Node)
    this.coach1Node = this.createCoachPlaceholder(true);
    this.trainGroup.add(this.coach1Node);

    // Set up Passenger View Anchor Node inside Coach 1:
    // Placed at sitting eye height (~1.92m above rail level, comfortably above window sill at 1.58m)
    this.passengerSeatNode = new THREE.Object3D();
    this.passengerSeatNode.position.set(-1.20, 2.25, 0.0); // seated right at the open window
    this.passengerSeatNode.rotation.y = -Math.PI / 2;      // facing left towards window
    this.coach1Node.add(this.passengerSeatNode);

    // C. Coach 2 Placeholder
    this.coach2Node = this.createCoachPlaceholder(false);
    this.trainGroup.add(this.coach2Node);
  }

  private createCoachPlaceholder(isLeadCoach: boolean = false): THREE.Group {
    const coach = new THREE.Group();

    // Chassis
    const chassisGeo = new THREE.BoxGeometry(2.8, 0.35, 15.6);
    const chassis = new THREE.Mesh(chassisGeo, this.materials['trainChassis']);
    chassis.position.y = 0.95;
    chassis.castShadow = true;
    coach.add(chassis);

    // Floor
    const floorGeo = new THREE.BoxGeometry(2.6, 0.1, 15.2);
    const floor = new THREE.Mesh(floorGeo, this.materials['sleeper']);
    floor.position.y = 1.15;
    floor.receiveShadow = true;
    coach.add(floor);

    // Arched roof top (outer shell)
    const roofGeo = new THREE.CylinderGeometry(1.42, 1.42, 15.4, 16, 1, false, 0, Math.PI);
    const roof = new THREE.Mesh(roofGeo, this.materials['coachRoof']);
    roof.rotation.z = Math.PI / 2;
    roof.rotation.y = Math.PI / 2;
    roof.position.set(0, 3.45, 0);
    roof.castShadow = true;
    coach.add(roof);

    // Ceiling inner board
    const ceilingGeo = new THREE.BoxGeometry(2.5, 0.08, 15.2);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x827d75, roughness: 0.8 });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.set(0, 3.35, 0);
    coach.add(ceiling);

    // End walls (front & back with door apertures)
    const endWallGeo = new THREE.BoxGeometry(2.6, 2.2, 0.2);
    [-7.6, 7.6].forEach((z) => {
      const endWall = new THREE.Mesh(endWallGeo, this.materials['coachBody']);
      endWall.position.set(0, 2.25, z);
      endWall.castShadow = true;
      coach.add(endWall);
    });

    // Lower side walls (waist level, below windows: Y from 1.2 to 1.95)
    const lowerWallGeo = new THREE.BoxGeometry(0.14, 0.75, 15.2);
    [-1.33, 1.33].forEach((x) => {
      const lowerWall = new THREE.Mesh(lowerWallGeo, this.materials['coachBody']);
      lowerWall.position.set(x, 1.575, 0);
      lowerWall.castShadow = true;
      coach.add(lowerWall);
    });

    // Upper side wall strips (above windows: Y from 2.95 to 3.4)
    const upperWallGeo = new THREE.BoxGeometry(0.14, 0.45, 15.2);
    [-1.33, 1.33].forEach((x) => {
      const upperWall = new THREE.Mesh(upperWallGeo, this.materials['coachBody']);
      upperWall.position.set(x, 3.175, 0);
      upperWall.castShadow = true;
      coach.add(upperWall);
    });

    // Window pillars along sides (creating classic rectangular drop-window rhythm)
    const pillarGeo = new THREE.BoxGeometry(0.14, 1.0, 0.35);
    const windowGlassGeo = new THREE.BoxGeometry(0.04, 0.95, 1.4);

    for (let z = -6.4; z <= 6.4; z += 1.8) {
      [-1.33, 1.33].forEach((x) => {
        const pillar = new THREE.Mesh(pillarGeo, this.materials['coachBody']);
        pillar.position.set(x, 2.45, z);
        coach.add(pillar);

        // Subtle semi-transparent window glass
        if (z < 6.0) {
          const glass = new THREE.Mesh(windowGlassGeo, this.materials['windowGlass']);
          glass.position.set(x, 2.45, z + 0.9);
          coach.add(glass);
        }
      });
    }

    // If lead coach, add interior seats for the passenger view!
    if (isLeadCoach) {
      const seatMat = new THREE.MeshStandardMaterial({ color: 0x47392b, roughness: 0.8 });
      for (let z = -5.4; z <= 5.4; z += 1.8) {
        // Left bench (window side)
        const benchGeo = new THREE.BoxGeometry(0.9, 0.45, 0.65);
        const bench = new THREE.Mesh(benchGeo, seatMat);
        bench.position.set(-0.75, 1.425, z);
        bench.receiveShadow = true;
        coach.add(bench);

        // Bench backrest
        const backGeo = new THREE.BoxGeometry(0.9, 0.6, 0.12);
        const back = new THREE.Mesh(backGeo, seatMat);
        back.position.set(-0.75, 1.85, z - 0.28);
        coach.add(back);
      }
    }

    // Bogies / Wheels
    this.addBogies(coach, [-5.0, 5.0]);

    return coach;
  }

  private addBogies(parent: THREE.Group, zOffsets: number[]) {
    const wheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.22, 14);
    wheelGeo.rotateZ(Math.PI / 2);

    zOffsets.forEach((z) => {
      const bogieFrameGeo = new THREE.BoxGeometry(2.5, 0.2, 2.4);
      const bogieFrame = new THREE.Mesh(bogieFrameGeo, this.materials['trainChassis']);
      bogieFrame.position.set(0, 0.5, z);
      parent.add(bogieFrame);

      // 4 wheels per bogie
      [-0.8, 0.8].forEach((wheelZ) => {
        [-1.05, 1.05].forEach((wheelX) => {
          const wheel = new THREE.Mesh(wheelGeo, this.materials['wheel']);
          wheel.position.set(wheelX, 0.44, z + wheelZ);
          parent.add(wheel);
        });
      });
    });
  }

  /**
   * Update train positions along the track curve
   */
  public updateTrainMotion(locoDist: number) {
    const coach1Dist = locoDist - 16.0;
    const coach2Dist = locoDist - 32.5;

    this.positionTrainUnit(this.locoNode, locoDist);
    this.positionTrainUnit(this.coach1Node, coach1Dist);
    this.positionTrainUnit(this.coach2Node, coach2Dist);
  }

  private positionTrainUnit(unit: THREE.Group, dist: number) {
    const pos = this.trackKinematics.getPointAtDistance(dist);
    const tangent = this.trackKinematics.getTangentAtDistance(dist).normalize();

    unit.position.copy(pos);

    // Orient unit along track tangent
    const angle = Math.atan2(tangent.x, tangent.z);
    unit.rotation.set(0, angle, 0);
  }
}
