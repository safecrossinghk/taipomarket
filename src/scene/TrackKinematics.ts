import * as THREE from 'three';

/**
 * TrackKinematics defines the 3D railway alignment through Tai Po Market station.
 * Total track length is looped smoothly for continuous testing.
 * Station platform is centered at Z ~ 0 to Z ~ 40, X ~ 0.
 */
export class TrackKinematics {
  public curve: THREE.CatmullRomCurve3;
  public totalLength: number;

  // Station dwell / platform stop bounds along normalized [0, 1] track t
  public stationT: number = 0.52;

  constructor() {
    // A scenic, gentle sweeping curve representative of Tai Po countryside
    // The straight section passes alongside the 1913 station building and Platform 1
    const points = [
      new THREE.Vector3(0, 0, -80),     // South approach (from Sha Tin/Tai Po Kau direction)
      new THREE.Vector3(0, 0, -40),
      new THREE.Vector3(0, 0, 0),       // Station center (Platform 1)
      new THREE.Vector3(0, 0, 45),      // Station north end
      new THREE.Vector3(6, 0, 95),      // North departure toward Fanling / Lam Tsuen River
      new THREE.Vector3(25, 0, 150),    // Sweeping right bend
      new THREE.Vector3(55, 0, 180),
      new THREE.Vector3(85, 0, 150),    // Far countryside loop
      new THREE.Vector3(95, 0, 60),
      new THREE.Vector3(85, 0, -60),
      new THREE.Vector3(60, 0, -140),   // South loop return
      new THREE.Vector3(25, 0, -160),
      new THREE.Vector3(5, 0, -120),
    ];

    this.curve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
    this.totalLength = this.curve.getLength();
  }

  /**
   * Get point on track at distance (meters) along curve
   */
  public getPointAtDistance(distance: number, out = new THREE.Vector3()): THREE.Vector3 {
    let t = (distance % this.totalLength) / this.totalLength;
    if (t < 0) t += 1.0;
    return this.curve.getPointAt(t, out);
  }

  /**
   * Get tangent vector on track at distance
   */
  public getTangentAtDistance(distance: number, out = new THREE.Vector3()): THREE.Vector3 {
    let t = (distance % this.totalLength) / this.totalLength;
    if (t < 0) t += 1.0;
    return this.curve.getTangentAt(t, out);
  }

  /**
   * Sample dense track coordinates for rendering rails and sleepers
   */
  public getTrackSamples(count: number = 400): { position: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3 }[] {
    const samples: { position: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3 }[] = [];
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= count; i++) {
      const u = i / count;
      const position = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const normal = new THREE.Vector3().crossVectors(up, tangent).normalize();
      samples.push({ position, tangent, normal });
    }
    return samples;
  }
}
