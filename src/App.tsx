import { useEffect, useRef, useState } from 'react';
import { CameraMode, SceneMetrics } from './types';
import { SceneDirector } from './scene/SceneDirector';
import { ViewportOverlay } from './components/ViewportOverlay';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const directorRef = useRef<SceneDirector | null>(null);

  const [currentMode, setCurrentMode] = useState<CameraMode>('follow');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [metrics, setMetrics] = useState<SceneMetrics>({
    fps: 60,
    drawCalls: 0,
    triangles: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const director = new SceneDirector(containerRef.current);
    directorRef.current = director;

    director.onMetricsUpdate = (newMetrics) => {
      setMetrics(newMetrics);
    };

    return () => {
      director.destroy();
      directorRef.current = null;
    };
  }, []);

  const handleSelectMode = (mode: CameraMode) => {
    setCurrentMode(mode);
    if (directorRef.current) {
      directorRef.current.setCameraMode(mode);
    }
  };

  const handleTogglePlay = () => {
    if (directorRef.current) {
      directorRef.current.togglePlay();
      setIsPlaying(directorRef.current.isTrainPlaying);
    }
  };

  const handleCycleSpeed = () => {
    const speeds = [0.5, 1.0, 2.0];
    const currentIndex = speeds.indexOf(speedMultiplier);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setSpeedMultiplier(nextSpeed);
    if (directorRef.current) {
      directorRef.current.setSpeed(nextSpeed);
    }
  };

  const [isHighQuality, setIsHighQuality] = useState<boolean>(true);

  const handleStopAtStation = () => {
    if (directorRef.current) {
      directorRef.current.stopAtStation();
      setIsPlaying(false);
    }
  };

  const handleToggleQuality = () => {
    if (directorRef.current) {
      const newQuality = directorRef.current.toggleQuality();
      setIsHighQuality(newQuality);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Retro HUD & Camera Controls */}
      <ViewportOverlay
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        speedMultiplier={speedMultiplier}
        onCycleSpeed={handleCycleSpeed}
        onStopAtStation={handleStopAtStation}
        metrics={metrics}
        isHighQuality={isHighQuality}
        onToggleQuality={handleToggleQuality}
      />
    </main>
  );
}
