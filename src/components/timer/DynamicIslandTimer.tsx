import React from 'react';
import { Play, Pause, CheckCircle2, Maximize2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DynamicIslandTimer: React.FC = () => {
  const { activeTimer, resumeTimer, pauseTimer, expandTimer, finishTimer } = useApp();

  if (!activeTimer) return null;

  const minutes = Math.floor(activeTimer.elapsedSeconds / 60);
  const seconds = activeTimer.elapsedSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/90 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl text-white dynamic-island-shadow border border-white/15 select-none hover:scale-[1.02] transition-transform">
        {/* Pulsing indicator */}
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={expandTimer}>
          <span className="relative flex h-2.5 w-2.5">
            {activeTimer.isRunning && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activeTimer.isRunning ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </span>
          <span className="text-xs font-semibold tracking-wide max-w-[100px] sm:max-w-[140px] truncate text-neutral-200">
            {activeTimer.subject}
          </span>
        </div>

        {/* Time display */}
        <div
          onClick={expandTimer}
          className="font-mono text-sm sm:text-base font-bold text-white tracking-wider cursor-pointer px-1"
        >
          {timeFormatted}
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-1">
          {activeTimer.isRunning ? (
            <button
              onClick={pauseTimer}
              className="p-1 rounded-full hover:bg-white/20 text-neutral-300 hover:text-white transition-colors"
              title="Duraklat"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={resumeTimer}
              className="p-1 rounded-full hover:bg-white/20 text-emerald-400 hover:text-emerald-300 transition-colors"
              title="Devam Et"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          <button
            onClick={finishTimer}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer ml-1"
            title="Çalışmayı Tamamla ve Soru Girişi Yap"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bitir</span>
          </button>

          <button
            onClick={expandTimer}
            className="p-1 rounded-full hover:bg-white/20 text-neutral-400 hover:text-white transition-colors"
            title="Büyüt"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
