import React, { useState } from 'react';
import { CameraMode, SceneMetrics } from '../types';
import {
  Camera,
  Eye,
  Compass,
  Play,
  Pause,
  Gauge,
  HelpCircle,
  Activity,
  Layers,
  MapPin,
  Sparkles,
  Sun,
} from 'lucide-react';

interface ViewportOverlayProps {
  currentMode: CameraMode;
  onSelectMode: (mode: CameraMode) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speedMultiplier: number;
  onCycleSpeed: () => void;
  onStopAtStation: () => void;
  metrics: SceneMetrics;
  isHighQuality: boolean;
  onToggleQuality: () => void;
}

export const ViewportOverlay: React.FC<ViewportOverlayProps> = ({
  currentMode,
  onSelectMode,
  isPlaying,
  onTogglePlay,
  speedMultiplier,
  onCycleSpeed,
  onStopAtStation,
  metrics,
  isHighQuality,
  onToggleQuality,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 text-stone-100 font-sans select-none z-10">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="bg-stone-900/85 backdrop-blur-md border border-stone-700/60 rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-3 pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm sm:text-base tracking-wide text-amber-100">
                舊大埔墟火車站 3D (1971)
              </h1>
              <span className="text-[10px] font-mono uppercase bg-amber-950/80 text-amber-400 border border-amber-800/60 px-1.5 py-0.5 rounded">
                Stage 1A 測試版
              </span>
            </div>
            <p className="text-xs text-stone-400">
              空間構圖・三視角平滑轉場・大阪城視覺質感參考
            </p>
          </div>
        </div>

        {/* Right Top Status & Diagnostic Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Quality Mode Toggle Button */}
          <button
            onClick={onToggleQuality}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border backdrop-blur-md transition-all flex items-center gap-1.5 shadow ${
              isHighQuality
                ? 'bg-amber-950/70 border-amber-600/70 text-amber-200'
                : 'bg-stone-900/80 border-stone-700/60 text-stone-300 hover:bg-stone-800'
            }`}
            title="切換渲染品質 (柔和陰影高質 / 節能順暢模式)"
          >
            {isHighQuality ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">柔和陰影 (高質)</span>
                <span className="sm:hidden">高質</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">節能模式 (極速)</span>
                <span className="sm:hidden">節能</span>
              </>
            )}
          </button>

          {/* Performance Diagnostics Button */}
          <button
            onClick={() => setShowDiagnostics((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border backdrop-blur-md transition-all flex items-center gap-1.5 shadow ${
              showDiagnostics
                ? 'bg-amber-900/70 border-amber-500 text-amber-200'
                : 'bg-stone-900/75 border-stone-700/60 text-stone-300 hover:bg-stone-800'
            }`}
            title="開關效能診斷資訊"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>{metrics.fps} FPS</span>
            <span className="text-stone-400 text-[10px] hidden sm:inline">
              | {metrics.drawCalls} DC
            </span>
          </button>

          <button
            onClick={() => setShowHelp((prev) => !prev)}
            className="p-2 rounded-lg bg-stone-900/75 border border-stone-700/60 text-stone-300 hover:text-stone-100 hover:bg-stone-800 backdrop-blur-md transition-all shadow"
            title="操作與視覺規格說明"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Diagnostics Flyout */}
      {showDiagnostics && (
        <div className="self-end mt-2 bg-stone-950/95 border border-stone-800 rounded-xl p-3.5 text-xs font-mono space-y-2 shadow-2xl backdrop-blur-md pointer-events-auto max-w-sm">
          <div className="text-amber-400 font-semibold flex items-center gap-1.5 border-b border-stone-800 pb-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>WebGL 渲染與視覺規格指標</span>
          </div>
          <div className="flex justify-between text-stone-300">
            <span>畫面幀率 (FPS):</span>
            <span className="text-emerald-400 font-bold">{metrics.fps}</span>
          </div>
          <div className="flex justify-between text-stone-300">
            <span>繪製呼叫 (Draw Calls):</span>
            <span className="text-amber-300 font-bold">{metrics.drawCalls}</span>
          </div>
          <div className="flex justify-between text-stone-300">
            <span>三角形面數:</span>
            <span className="text-stone-400">
              {metrics.triangles.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-stone-300">
            <span>色調映射:</span>
            <span className="text-stone-300 font-sans text-[11px]">ACESFilmic (防死白)</span>
          </div>
          <div className="flex justify-between text-stone-300">
            <span>自然環境反射:</span>
            <span className="text-emerald-400 font-sans text-[11px]">已啟用 (Procedural PMREM)</span>
          </div>
          <div className="flex justify-between text-stone-300">
            <span>像素採樣上限:</span>
            <span className="text-stone-400">封頂 2.0x (防 iPhone 降頻)</span>
          </div>
          <div className="border-t border-stone-800/80 pt-1.5 text-[10px] text-stone-400 font-sans leading-tight">
            視覺風格參考大阪城小火車質感；暖色陽光為視覺設定，模型色彩為占位色。
          </div>
        </div>
      )}

      {/* Top Banner Notice: Stage 1A Historical Disclaimer Badge (Unobtrusive) */}
      <div className="self-start mt-2 pointer-events-auto transition-all max-w-sm">
        <div className="bg-stone-900/85 border border-stone-700/80 backdrop-blur-md rounded-xl p-2.5 text-xs text-stone-300 shadow-xl flex items-start gap-2">
          <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-semibold text-amber-300 text-[11px]">
              【Stage 1A 構圖、光影與占位幾何階段】
            </span>
            <p className="mt-0.5 text-stone-400 text-[10px]">
              光影質感參考大阪城小火車（暖色午後斜光・柔和陰影）；列車與建築皆為程序化占位模型，非最終歷史定案。
            </p>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 pointer-events-auto">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-semibold text-base text-amber-200 flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                三種視角操作與大阪城視覺規格
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-stone-400 hover:text-stone-200 text-sm px-2 py-1 rounded bg-stone-800"
              >
                關閉
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-300">
              <div>
                <strong className="text-amber-300">七、視覺風格規範（參考大阪城小火車網站）：</strong>
                <ul className="list-disc list-inside text-stone-400 mt-1 space-y-1">
                  <li><span className="text-stone-200">光照與陰影：</span>DirectionalLight 斜射午後暖光 + PCFSoftShadowMap 柔和陰影 + HemisphereLight 大地天空漫射，避免過曝與死白。</li>
                  <li><span className="text-stone-200">材質與反射：</span>MeshStandardMaterial PBR 分級——鋼軌與車輪保留高金屬感高光反射，地面、磚牆與道碴使用高粗糙度啞光，輔以輕量環境反射。</li>
                  <li><span className="text-stone-200">色調與大氣：</span>ACESFilmicToneMapping + 暖色大氣霧效（FogExp2），不引入昂貴 PostProcessing 確保手機 60 FPS。</li>
                  <li><span className="text-stone-200">歷史準確性界限：</span>大阪城僅作視覺風格參考；暖色午後光照為遊戲視覺設定，模型色彩均為占位色。</li>
                </ul>
              </div>

              <div className="border-t border-stone-800 pt-2">
                <strong className="text-amber-300">鏡頭控制指南：</strong>
                <p className="text-stone-400 mt-1">
                  • <strong>A. 第一身乘客：</strong>鎖定車廂靠窗坐姿視線，滑鼠或單指滑動環顧窗外月台。<br/>
                  • <strong>B. 第三身追隨：</strong>經典斜 45° 追隨視角，平滑跟隨列車在路軌上馳騁。<br/>
                  • <strong>C. 高空俯瞰：</strong>360° 旋轉鳥瞰站場全局，滑鼠滾輪或雙指縮放畫面。
                </p>
              </div>

              <div className="border-t border-stone-800 pt-2 text-stone-400">
                <span className="text-amber-400 font-medium">平滑轉場技術：</span>
                切換視角時採用 1.2 秒三次 Hermite 平滑曲線內插，避免生硬跳躍。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-auto">
        {/* Left: Camera Mode Switcher */}
        <div className="bg-stone-900/90 border border-stone-700/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-1 w-full sm:w-auto justify-center">
          <button
            onClick={() => onSelectMode('passenger')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              currentMode === 'passenger'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>第一身乘客 (A)</span>
          </button>

          <button
            onClick={() => onSelectMode('follow')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              currentMode === 'follow'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>第三身追隨 (B)</span>
          </button>

          <button
            onClick={() => onSelectMode('orbit')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              currentMode === 'orbit'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>高空俯瞰 (C)</span>
          </button>
        </div>

        {/* Right: Train Controls & Actions */}
        <div className="bg-stone-900/90 border border-stone-700/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-1.5">
          <button
            onClick={onTogglePlay}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-stone-800 hover:bg-stone-750 text-stone-200 transition-colors shadow-sm"
            title={isPlaying ? '暫停列車運動' : '啟動列車行駛'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">暫停</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">行駛</span>
              </>
            )}
          </button>

          <button
            onClick={onCycleSpeed}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-stone-800 hover:bg-stone-750 text-stone-200 transition-colors shadow-sm"
            title="調整列車運行倍速"
          >
            <Gauge className="w-4 h-4 text-amber-300" />
            <span>{speedMultiplier}x 速</span>
          </button>

          <button
            onClick={onStopAtStation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-amber-900/50 hover:bg-amber-900/80 text-amber-200 border border-amber-700/60 transition-colors shadow-sm"
            title="將列車精確停靠於大埔墟站第一月台"
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>進站停靠</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
