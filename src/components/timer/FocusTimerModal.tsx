import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Minimize2,
  CheckCircle2,
  X,
  BookOpen,
  Timer,
  Clock,
  Sparkles,
  Sliders,
  Check
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
    finishTimer,
    cancelTimer,
    startTimer
  } = useApp();

  const [customMinInput, setCustomMinInput] = useState<string>('');
  const [isEditingCustomMin, setIsEditingCustomMin] = useState<boolean>(false);

  if (!isTimerModalOpen || !activeTimer) return null;

  const isPomodoro = activeTimer.mode === 'pomodoro';
  const totalTargetSec = (activeTimer.initialDurationMinutes || 25) * 60;
  
  // For Pomodoro: time remaining = totalTarget - elapsed
  const displaySeconds = isPomodoro
    ? Math.max(0, totalTargetSec - activeTimer.elapsedSeconds)
    : activeTimer.elapsedSeconds;

  const hours = Math.floor(displaySeconds / 3600);
  const minutes = Math.floor((displaySeconds % 3600) / 60);
  const seconds = displaySeconds % 60;

  const formattedTime = hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Progress for circle
  const progressPercent = isPomodoro
    ? Math.min(100, (activeTimer.elapsedSeconds / totalTargetSec) * 100)
    : ((activeTimer.elapsedSeconds % 3600) / 3600) * 100;

  const handleSwitchMode = (newMode: 'stopwatch' | 'pomodoro') => {
    if (newMode === activeTimer.mode) return;
    startTimer({
      scheduleItemId: activeTimer.scheduleItemId,
      homeworkId: activeTimer.homeworkId,
      subject: activeTimer.subject,
      topic: activeTimer.topic,
      mode: newMode,
      initialMinutes: activeTimer.initialDurationMinutes || 25
    });
  };

  const handleSelectPomodoroPreset = (mins: number) => {
    startTimer({
      scheduleItemId: activeTimer.scheduleItemId,
      homeworkId: activeTimer.homeworkId,
      subject: activeTimer.subject,
      topic: activeTimer.topic,
      mode: 'pomodoro',
      initialMinutes: mins
    });
    setIsEditingCustomMin(false);
  };

  const handleApplyCustomMinutes = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customMinInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 1440) {
      handleSelectPomodoroPreset(parsed);
      setCustomMinInput('');
      setIsEditingCustomMin(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-8 text-center select-none">
        {/* Top actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={minimizeTimer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            title="Dynamic Island Moduna Küçült"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Küçült</span>
          </button>

          <div className="flex items-center gap-1 text-xs font-bold text-neutral-400 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Odaklanma Sayacı</span>
          </div>

          <button
            onClick={cancelTimer}
            className="p-1.5 rounded-full text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Sayacı Kapat / İptal Et"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Lesson Badge */}
        <div className="inline-flex flex-col items-center mb-5">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-sm mb-1.5">
            <BookOpen className="w-4 h-4" />
            <span>{activeTimer.subject}</span>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white max-w-sm mx-auto">
            {activeTimer.topic}
          </h2>
        </div>

        {/* Sayaç Türü Seçimi (Kronometre vs Pomodoro) */}
        <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 max-w-xs mx-auto mb-5">
          <button
            onClick={() => handleSwitchMode('stopwatch')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isPomodoro
                ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Kronometre</span>
          </button>
          <button
            onClick={() => handleSwitchMode('pomodoro')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isPomodoro
                ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Pomodoro (Geri Sayım)</span>
          </button>
        </div>

        {/* If Pomodoro, show preset buttons + CUSTOM MINUTE INPUT */}
        {isPomodoro && (
          <div className="space-y-3 mb-4">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {[15, 20, 25, 30, 40, 50, 60, 90].map(mins => (
                <button
                  key={mins}
                  onClick={() => handleSelectPomodoroPreset(mins)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeTimer.initialDurationMinutes === mins && !isEditingCustomMin
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {mins} dk
                </button>
              ))}

              {/* Custom Minute Button */}
              <button
                onClick={() => {
                  setIsEditingCustomMin(prev => !prev);
                  if (!isEditingCustomMin) setCustomMinInput((activeTimer.initialDurationMinutes || 25).toString());
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isEditingCustomMin
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20'
                }`}
                title="İstediğin dakikayı elle ayarla"
              >
                <Sliders className="w-3 h-3" />
                <span>Özel Dakika</span>
              </button>
            </div>

            {/* Custom Minute Inline Editor */}
            {isEditingCustomMin && (
              <form onSubmit={handleApplyCustomMinutes} className="flex items-center justify-center gap-2 max-w-xs mx-auto animate-in fade-in">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customMinInput}
                  onChange={e => setCustomMinInput(e.target.value)}
                  placeholder="Dakika (Örn: 35)"
                  className="w-28 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-blue-500/40 text-center font-bold text-xs text-neutral-900 dark:text-white focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Ayarla</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Big Circular Clock UI */}
        <div className="relative w-64 h-64 mx-auto my-3 flex items-center justify-center">
          {/* SVG Progress Circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-neutral-200 dark:text-neutral-800"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-blue-500 transition-all duration-500 ease-linear"
              strokeWidth="5"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Time text centered */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-5xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {formattedTime}
            </span>
            <span className="text-xs font-semibold text-neutral-400 mt-2">
              {isPomodoro
                ? activeTimer.isRunning ? `Geri Sayım (${activeTimer.initialDurationMinutes} Dk Hedef)` : 'Duraklatıldı'
                : 'Geçen Toplam Süre'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4 mt-5">
          <button
            onClick={resetTimer}
            className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all active:scale-95 cursor-pointer"
            title="Sıfırla"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {activeTimer.isRunning ? (
            <button
              onClick={pauseTimer}
              className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Duraklat</span>
            </button>
          ) : (
            <button
              onClick={resumeTimer}
              className="px-8 py-3.5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Devam Et</span>
            </button>
          )}

          <button
            onClick={finishTimer}
            className="p-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer"
            title="Çalışmayı Bitir"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>

        {/* Large Prominent Finish Button with Question Prompt */}
        <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5">
          <button
            onClick={finishTimer}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-98 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Soru Çözümünü Tamamla & Sayıları Gir</span>
          </button>
          <p className="text-[11px] text-neutral-400 mt-2">
            Çözülen ders ({activeTimer.subject} • {activeTimer.topic}) ve saat-dakika hoca paneline anında iletilir.
          </p>
        </div>
      </div>
    </div>
  );
};
