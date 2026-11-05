import * as THREE from 'three';
import { CameraMode, CameraTransitionState } from '../types';
import { ScenePlaceholders } from './Placeholders';

export class CameraManager {
  public camera: THREE.PerspectiveCamera;
  public currentMode: CameraMode = 'follow'; // default to follow mode like Osaka Train
  public transition: CameraTransitionState = {
    isTransitioning: false,
    progress: 0,
    duration: 1.2,
    startPos: { x: 0, y: 0, z: 0 },
    startTarget: { x: 0, y: 0, z: 0 },
    endPos: { x: 0, y: 0, z: 0 },
    endTarget: { x: 0, y: 0, z: 0 },
  };

  private placeholders: ScenePlaceholders;

  // Working vectors to avoid memory allocation in render loop
  private currentCameraPos = new THREE.Vector3();
  private currentCameraTarget = new THREE.Vector3();
  private desiredCameraPos = new THREE.Vector3();
  private desiredCameraTarget = new THREE.Vector3();
  private tempVec = new THREE.Vector3();
  private tempQuat = new THREE.Quaternion();

  // Mode A: Passenger interactive look-around offsets
  private passengerYaw: number = 0;
  private passengerPitch: number = 0;

  // Mode B: Follow camera orbital offset tweaks
  private followAngleOffset: number = 0;
  private followDistance: number = 22;
  private followHeight: number = 9;

  // Mode C: Aerial Orbit angles
  private orbitTheta: number = 0.8; // Azimuth
  private orbitPhi: number = 1.0;   // Polar (zenith)
  private orbitRadius: number = 55;
  private orbitCenter = new THREE.Vector3(-4, 1.5, 0);

  // Gesture handling state
  private isPointerDown: boolean = false;
  private pointerStartX: number = 0;
  private pointerStartY: number = 0;
  private touchStartDistance: number = 0;

  constructor(camera: THREE.PerspectiveCamera, placeholders: ScenePlaceholders) {
    this.camera = camera;
    this.placeholders = placeholders;

    // Initialize initial position in follow mode
    this.calculateFollowDesired(this.desiredCameraPos, this.desiredCameraTarget);
    this.camera.position.copy(this.desiredCameraPos);
    this.currentCameraPos.copy(this.desiredCameraPos);
    this.currentCameraTarget.copy(this.desiredCameraTarget);
    this.camera.lookAt(this.desiredCameraTarget);
  }

  /**
   * Smoothly switch camera mode with 1.2s ease-in-out transition
   */
  public switchMode(newMode: CameraMode) {
    if (this.currentMode === newMode && !this.transition.isTransitioning) return;

    // Snapshot start position and current view target
    this.transition.startPos = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
    };
    this.transition.startTarget = {
      x: this.currentCameraTarget.x,
      y: this.currentCameraTarget.y,
      z: this.currentCameraTarget.z,
    };

    this.currentMode = newMode;

    // Calculate destination desired position & target
    this.getModeTargetState(newMode, this.desiredCameraPos, this.desiredCameraTarget);
    this.transition.endPos = {
      x: this.desiredCameraPos.x,
      y: this.desiredCameraPos.y,
      z: this.desiredCameraPos.z,
    };
    this.transition.endTarget = {
      x: this.desiredCameraTarget.x,
      y: this.desiredCameraTarget.y,
      z: this.desiredCameraTarget.z,
    };

    this.transition.progress = 0;
    this.transition.isTransitioning = true;
  }

  private getModeTargetState(mode: CameraMode, outPos: THREE.Vector3, outTarget: THREE.Vector3) {
    switch (mode) {
      case 'passenger':
        this.calculatePassengerDesired(outPos, outTarget);
        break;
      case 'follow':
        this.calculateFollowDesired(outPos, outTarget);
        break;
      case 'orbit':
        this.calculateOrbitDesired(outPos, outTarget);
        break;
    }
  }

  /**
   * Per-frame update (delta in seconds)
   */
  public update(delta: number) {
    if (this.transition.isTransitioning) {
      this.transition.progress += delta / this.transition.duration;
      if (this.transition.progress >= 1.0) {
        this.transition.progress = 1.0;
        this.transition.isTransitioning = false;
      }

      // Cubic Smoothstep interpolation
      const t = this.transition.progress;
      const ease = t * t * (3 - 2 * t);

      // Interpolate position
      this.camera.position.x =
        this.transition.startPos.x + (this.transition.endPos.x - this.transition.startPos.x) * ease;
      this.camera.position.y =
        this.transition.startPos.y + (this.transition.endPos.y - this.transition.startPos.y) * ease;
      this.camera.position.z =
        this.transition.startPos.z + (this.transition.endPos.z - this.transition.startPos.z) * ease;

      // Interpolate target
      this.currentCameraTarget.x =
        this.transition.startTarget.x + (this.transition.endTarget.x - this.transition.startTarget.x) * ease;
      this.currentCameraTarget.y =
        this.transition.startTarget.y + (this.transition.endTarget.y - this.transition.startTarget.y) * ease;
      this.currentCameraTarget.z =
        this.transition.startTarget.z + (this.transition.endTarget.z - this.transition.startTarget.z) * ease;

      this.camera.lookAt(this.currentCameraTarget);
      return;
    }

    // Steady-state camera updates
    switch (this.currentMode) {
      case 'passenger': {
        this.calculatePassengerDesired(this.desiredCameraPos, this.desiredCameraTarget);
        this.camera.position.copy(this.desiredCameraPos);
        this.currentCameraTarget.copy(this.desiredCameraTarget);
        this.camera.lookAt(this.currentCameraTarget);
        break;
      }
      case 'follow': {
        this.calculateFollowDesired(this.desiredCameraPos, this.desiredCameraTarget);
        // Smooth dampening to prevent jitter
        this.camera.position.lerp(this.desiredCameraPos, Math.min(1.0, delta * 4.5));
        this.currentCameraTarget.lerp(this.desiredCameraTarget, Math.min(1.0, delta * 5.0));
        this.camera.lookAt(this.currentCameraTarget);
        break;
      }
      case 'orbit': {
        this.calculateOrbitDesired(this.desiredCameraPos, this.desiredCameraTarget);
        this.camera.position.lerp(this.desiredCameraPos, Math.min(1.0, delta * 6.0));
        this.currentCameraTarget.lerp(this.desiredCameraTarget, Math.min(1.0, delta * 6.0));
        this.camera.lookAt(this.currentCameraTarget);
        break;
      }
    }
  }

  /**
   * Mode A: Passenger Window Sitting View
   */
  private calculatePassengerDesired(outPos: THREE.Vector3, outTarget: THREE.Vector3) {
    const seatNode = this.placeholders.passengerSeatNode;
    seatNode.getWorldPosition(outPos);
    seatNode.getWorldQuaternion(this.tempQuat);

    // Direction looking out the coach window with a forward bias (+Z towards locomotive)
    const outWindow = new THREE.Vector3(0, 0, 1).applyQuaternion(this.tempQuat);    // towards platform (-X)
    const forwardTrain = new THREE.Vector3(1, 0, 0).applyQuaternion(this.tempQuat); // towards locomotive (+Z)
    const up = new THREE.Vector3(0, 1, 0);

    // Natural window view: looking out across platform (85%) with a subtle forward gaze (25%)
    const baseDir = outWindow.clone().multiplyScalar(0.85).addScaledVector(forwardTrain, 0.25).normalize();

    const lookDir = baseDir
      .applyAxisAngle(up, this.passengerYaw)
      .applyAxisAngle(forwardTrain, this.passengerPitch)
      .normalize();

    outTarget.copy(outPos).addScaledVector(lookDir, 25.0);
  }

  /**
   * Mode B: Third-Person Cinematic Follow View (Osaka Train Reference)
   * Positioned on the open eastern side (X > 0) looking across the track
   * to beautifully frame the train with Platform 1, Station Building, and Hills in the background.
   */
  private calculateFollowDesired(outPos: THREE.Vector3, outTarget: THREE.Vector3) {
    const locoPos = this.placeholders.locoNode.position;
    const coach1Pos = this.placeholders.coach1Node.position;

    // Follow focus sits between locomotive and first carriage for balanced framing
    outTarget.copy(locoPos).multiplyScalar(0.6).addScaledVector(coach1Pos, 0.4);
    outTarget.y += 2.2;

    // Orbit offset angle
    const angle = this.followAngleOffset;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);

    // Positioned at X = +18 (unoccluded), Z = -14 relative to target
    const baseOffsetX = 18;
    const baseOffsetZ = -14;

    const rotatedX = baseOffsetX * cosA - baseOffsetZ * sinA;
    const rotatedZ = baseOffsetX * sinA + baseOffsetZ * cosA;

    outPos.set(outTarget.x + rotatedX, outTarget.y + this.followHeight, outTarget.z + rotatedZ);
  }

  /**
   * Mode C: High-altitude Aerial Overview
   */
  private calculateOrbitDesired(outPos: THREE.Vector3, outTarget: THREE.Vector3) {
    outTarget.copy(this.orbitCenter);

    const x = this.orbitRadius * Math.sin(this.orbitPhi) * Math.sin(this.orbitTheta);
    const y = this.orbitRadius * Math.cos(this.orbitPhi);
    const z = this.orbitRadius * Math.sin(this.orbitPhi) * Math.cos(this.orbitTheta);

    outPos.set(this.orbitCenter.x + x, this.orbitCenter.y + y, this.orbitCenter.z + z);
  }

  /**
   * Touch & Mouse Interaction Handlers
   */
  public onPointerDown(x: number, y: number) {
    this.isPointerDown = true;
    this.pointerStartX = x;
    this.pointerStartY = y;
  }

  public onPointerMove(x: number, y: number) {
    if (!this.isPointerDown) return;
    const dx = x - this.pointerStartX;
    const dy = y - this.pointerStartY;
    this.pointerStartX = x;
    this.pointerStartY = y;

    if (this.currentMode === 'passenger') {
      // Rotate passenger head
      this.passengerYaw -= dx * 0.005;
      this.passengerPitch -= dy * 0.005;
      // Clamp passenger angles to realistic seated neck mobility
      this.passengerYaw = THREE.MathUtils.clamp(this.passengerYaw, -Math.PI * 0.45, Math.PI * 0.45);
      this.passengerPitch = THREE.MathUtils.clamp(this.passengerPitch, -Math.PI * 0.25, Math.PI * 0.25);
    } else if (this.currentMode === 'follow') {
      // Slight orbit adjustment around the train
      this.followAngleOffset -= dx * 0.006;
      this.followHeight = THREE.MathUtils.clamp(this.followHeight - dy * 0.04, 3.5, 20.0);
    } else if (this.currentMode === 'orbit') {
      // Full spherical orbit
      this.orbitTheta -= dx * 0.008;
      this.orbitPhi = THREE.MathUtils.clamp(this.orbitPhi - dy * 0.008, 0.15, Math.PI / 2 - 0.08);
    }
  }

  public onPointerUp() {
    this.isPointerDown = false;
  }

  public onWheel(deltaY: number) {
    if (this.currentMode === 'orbit') {
      this.orbitRadius = THREE.MathUtils.clamp(this.orbitRadius + deltaY * 0.05, 18, 120);
    } else if (this.currentMode === 'follow') {
      this.followHeight = THREE.MathUtils.clamp(this.followHeight + deltaY * 0.02, 3.5, 22);
    }
  }

  public onTouchPinch(distance: number) {
    if (this.touchStartDistance === 0) {
      this.touchStartDistance = distance;
      return;
    }
    const delta = this.touchStartDistance - distance;
    this.touchStartDistance = distance;

    if (this.currentMode === 'orbit') {
      this.orbitRadius = THREE.MathUtils.clamp(this.orbitRadius + delta * 0.08, 18, 120);
    } else if (this.currentMode === 'follow') {
      this.followHeight = THREE.MathUtils.clamp(this.followHeight + delta * 0.04, 3.5, 22);
    }
  }

  public onTouchPinchEnd() {
    this.touchStartDistance = 0;
  }
}
