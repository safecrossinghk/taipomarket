export type CameraMode = 'passenger' | 'follow' | 'orbit';

export interface CameraTransitionState {
  isTransitioning: boolean;
  progress: number; // 0 to 1
  duration: number; // seconds
  startPos: { x: number; y: number; z: number };
  startTarget: { x: number; y: number; z: number };
  endPos: { x: number; y: number; z: number };
  endTarget: { x: number; y: number; z: number };
}

export interface TrainMotionState {
  distance: number; // distance along track
  speed: number;    // meters per second
  isPlaying: boolean;
  isStoppedAtStation: boolean;
}

export interface SceneMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
}
