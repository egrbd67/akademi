import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Minimize2,
  CheckCircle2,
  EyeOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FocusTimerModal: React.FC = () => {
  const {
    activeTimer,
    isTimerModalOpen,
    pauseTimer,
    resumeTimer,
    resetTimer,
    minimizeTimer,
    hideTimerPopup,
    finishTimer
  } = useApp();

  // Try native browser fullscreen when entering, and allow ESC to exit cleanly
  useEffect(() => {
    if (!isTimerModalOpen || !activeTimer) return;

    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        // Ignore if blocked by iframe permissions; fixed inset-0 z-[100] already fills 100% of viewport
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        minimizeTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTimerModalOpen, activeTimer, minimizeTimer]);

  if (!isTimerModalOpen || !activeTimer) return null;

  const handleExitFullscreen = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    minimizeTimer();
  };

  const handleHideToBackground = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    hideTimerPopup();
  };

  const handleFinishSession = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    finishTimer();
  };

  const isPomodoro = activeTimer.mode === 'pomodoro';
  const totalTargetSec = (activeTimer.initialDurationMinutes || 25) * 60;

  const displaySeconds = isPomodoro
    ? Math.max(0, totalTargetSec - activeTimer.elapsedSeconds)
    : activeTimer.elapsedSeconds;

  const hours = Math.floor(displaySeconds / 3600);
  const minutes = Math.floor((displaySeconds % 3600) / 60);
  const seconds = displaySeconds % 60;

  const formattedTime = hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const progressPercent = isPomodoro
    ? Math.min(100, (activeTimer.elapsedSeconds / totalTargetSec) * 100)
    : Math.min(100, ((activeTimer.elapsedSeconds % 3600) / 3600) * 100);

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen bg-[#07080C] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden">
      {/* Minimal Top Bar: Quiet Lesson Context & Exit Actions */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-400 truncate">
          <span className="font-semibold text-neutral-200 truncate">{activeTimer.subject}</span>
          {activeTimer.topic && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{activeTimer.topic}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleHideToBackground}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            title="Ekrandan Kapat ve Arka Planda Saymaya Devam Et"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Arka Planda Say</span>
          </button>

          <button
            onClick={handleExitFullscreen}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.08] hover:bg-white/[0.15] text-white transition-colors cursor-pointer whitespace-nowrap"
            title="Tam Ekrandan Çık (ESC)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Tam Ekrandan Çık</span>
          </button>
        </div>
      </div>

      {/* Center Focal Anchor: Pure, Distraction-Free Clock */}
      <div className="flex-1 flex flex-col items-center justify-center my-2">
        <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px] lg:w-[520px] lg:h-[520px] max-w-[70vmin] max-h-[70vmin] aspect-square flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              className="text-white/[0.06]"
              strokeWidth="1.75"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              className="text-blue-500 transition-all duration-500 ease-linear"
              strokeWidth="2.25"
              strokeDasharray={289.02}
              strokeDashoffset={289.02 - (289.02 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
            <span className="focus-clock-font tabular-nums text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white">
              {formattedTime}
            </span>
            <span className="text-xs text-neutral-500 mt-3.5 font-semibold tracking-wide">
              {isPomodoro
                ? `Geri Sayım · ${activeTimer.initialDurationMinutes || 25} Dk`
                : 'Kronometre'}
            </span>
          </div>
        </div>
      </div>

      {/* Minimal Bottom Controls */}
      <div className="w-full max-w-md mx-auto flex items-center justify-center gap-3 sm:gap-4 pb-2">
        <button
          onClick={resetTimer}
          className="p-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title="Sıfırla"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {activeTimer.isRunning ? (
          <button
            onClick={pauseTimer}
            className="px-10 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm sm:text-base flex items-center gap-2.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Pause className="w-5 h-5 fill-current" />
            <span>Duraklat</span>
          </button>
        ) : (
          <button
            onClick={resumeTimer}
            className="px-10 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm sm:text-base flex items-center gap-2.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{activeTimer.elapsedSeconds > 0 ? 'Devam Et' : 'Başlat'}</span>
          </button>
        )}

        <button
          onClick={handleFinishSession}
          className="px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          title="Çalışmayı Bitir ve Kaydet"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Bitir</span>
        </button>
      </div>
    </div>
  );
};

