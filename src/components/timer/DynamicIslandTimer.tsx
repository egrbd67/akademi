import React from 'react';
import { Play, Pause, CheckCircle2, Maximize2, X, Zap, Timer, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DynamicIslandTimer: React.FC = () => {
  const {
    activeTimer,
    isTimerModalOpen,
    resumeTimer,
    pauseTimer,
    expandTimer,
    hideTimerPopup,
    finishTimer
  } = useApp();

  if (!activeTimer || activeTimer.isPopupHidden || isTimerModalOpen) return null;

  const isPomodoro = activeTimer.mode === 'pomodoro';
  const totalTargetSec = (activeTimer.initialDurationMinutes || 25) * 60;
  const displaySeconds = isPomodoro
    ? Math.max(0, totalTargetSec - activeTimer.elapsedSeconds)
    : activeTimer.elapsedSeconds;

  const hours = Math.floor(displaySeconds / 3600);
  const minutes = Math.floor((displaySeconds % 3600) / 60);
  const seconds = displaySeconds % 60;
  const timeFormatted = hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const progressPercent = isPomodoro
    ? Math.min(100, (activeTimer.elapsedSeconds / totalTargetSec) * 100)
    : Math.min(100, (activeTimer.elapsedSeconds / 300) * 100);

  const isFiveMinReached = activeTimer.elapsedSeconds >= 300;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-1.5rem)] max-w-xs sm:max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300 select-none">
      <div className="rounded-2xl bg-neutral-900/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl text-white shadow-2xl border border-white/15 p-3.5 space-y-2.5">
        {/* Top bar: status + mode + expand + close (keep counting in background) */}
        <div className="flex items-center justify-between gap-2">
          <div
            onClick={expandTimer}
            className="flex items-center gap-2 min-w-0 cursor-pointer"
            title="Tam Ekran Odak Sayacını Aç"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {activeTimer.isRunning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  activeTimer.isRunning ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 truncate">
              {isPomodoro ? <Timer className="w-3 h-3 shrink-0" /> : <Clock className="w-3 h-3 shrink-0" />}
              <span>{activeTimer.isRunning ? 'Odak Modu Aktif' : 'Duraklatıldı'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={expandTimer}
              className="p-1.5 rounded-lg hover:bg-white/15 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Tam Ekran Aç"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={hideTimerPopup}
              className="p-1.5 rounded-lg hover:bg-white/15 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Pop-up'ı Kapat (Arka Planda Saymaya Devam Eder)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle: Subject/Topic + Live Timer */}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <div className="min-w-0 flex-1 cursor-pointer" onClick={expandTimer}>
            <div className="font-bold text-sm text-white truncate">
              {activeTimer.subject}
            </div>
            <div className="text-xs text-neutral-400 truncate">
              {activeTimer.topic || 'Konu Çalışması'}
            </div>
            <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400">
              <Zap className="w-3 h-3" />
              <span>{isFiveMinReached ? '5+ Dk Tamamlandı (+1 Seri)' : '5 Dk Odak = +1 Seri'}</span>
            </div>
          </div>

          <div
            onClick={expandTimer}
            className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight cursor-pointer shrink-0"
          >
            {timeFormatted}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Bottom Controls + Background hint */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[10px] text-neutral-400 truncate">
            Kapatılsa da arka planda sayar
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {activeTimer.isRunning ? (
              <button
                onClick={pauseTimer}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Duraklat"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Duraklat</span>
              </button>
            ) : (
              <button
                onClick={resumeTimer}
                className="px-2.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Devam Et"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Devam</span>
              </button>
            )}

            <button
              onClick={finishTimer}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
              title="Çalışmayı Tamamla ve Soru Girişi Yap"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Bitir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

