import React, { useState, useMemo, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Send,
  Clock,
  MessageSquare,
  Zap,
  Sliders,
  Check,
  Eye,
  EyeOff,
  Maximize2
} from 'lucide-react';
import { useApp, playFocusFinishSound } from '../../context/AppContext';
import { SolvedQuestions } from '../../types';
import { getThemeStyles } from '../theme/ThemeCustomizerModal';

export const FocusModeView: React.FC = () => {
  const {
    role,
    currentStudent,
    students,
    focusSessions,
    addFocusSession,
    giveTeacherFeedbackToFocusSession,
    boxTheme,
    activeTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    cancelTimer,
    expandTimer,
    hideTimerPopup,
    showTimerPopup,
    updateTimerState
  } = useApp();

  const themeStyles = getThemeStyles(boxTheme);

  const [mode, setMode] = useState<'pomodoro' | 'stopwatch'>(activeTimer?.mode || 'pomodoro');
  const [targetMinutes, setTargetMinutes] = useState<number>(activeTimer?.initialDurationMinutes || 25);
  const [customTargetInput, setCustomTargetInput] = useState<string>('');
  const [isEditingCustomMin, setIsEditingCustomMin] = useState<boolean>(false);

  const [selectedSubject, setSelectedSubject] = useState<string>(activeTimer?.subject || 'Matematik');
  const [selectedTopic, setSelectedTopic] = useState<string>(activeTimer?.topic || 'Konu Çalışması');

  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [studentNote, setStudentNote] = useState<string>('');
  const [solvedCorrect, setSolvedCorrect] = useState<number>(0);
  const [solvedWrong, setSolvedWrong] = useState<number>(0);
  const [solvedBlank, setSolvedBlank] = useState<number>(0);

  const [activeFeedbackSessionId, setActiveFeedbackSessionId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [filterStudentId, setFilterStudentId] = useState<string>('ALL');

  // Keep local form fields synced when an activeTimer is already running from Schedule/Homework or FocusMode
  useEffect(() => {
    if (activeTimer) {
      setMode(activeTimer.mode);
      if (activeTimer.initialDurationMinutes) {
        setTargetMinutes(activeTimer.initialDurationMinutes);
      }
      if (activeTimer.subject) setSelectedSubject(activeTimer.subject);
      if (activeTimer.topic) setSelectedTopic(activeTimer.topic);
    }
  }, [activeTimer?.mode, activeTimer?.initialDurationMinutes, activeTimer?.subject, activeTimer?.topic]);

  const elapsedSeconds = activeTimer ? activeTimer.elapsedSeconds : 0;
  const isRunning = Boolean(activeTimer?.isRunning);

  const todayStr = new Date().toISOString().split('T')[0];
  const isStreakEarnedToday = Boolean(
    currentStudent?.streak?.lastActiveDate === todayStr && (currentStudent?.streak?.count || 0) > 0
  );

  const totalTargetSec = targetMinutes * 60;
  const displaySeconds = mode === 'pomodoro'
    ? Math.max(0, totalTargetSec - elapsedSeconds)
    : elapsedSeconds;

  const hours = Math.floor(displaySeconds / 3600);
  const minutes = Math.floor((displaySeconds % 3600) / 60);
  const seconds = displaySeconds % 60;

  const formattedTime = hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const progressPercent = mode === 'pomodoro'
    ? Math.min(100, (elapsedSeconds / totalTargetSec) * 100)
    : Math.min(100, ((elapsedSeconds % 3600) / 3600) * 100);

  const handleStart = () => {
    if (activeTimer) {
      updateTimerState({
        subject: selectedSubject.trim() || 'Matematik',
        topic: selectedTopic.trim() || 'Konu Çalışması',
        mode,
        initialDurationMinutes: targetMinutes,
        isPopupHidden: false
      });
      resumeTimer();
    } else {
      startTimer({
        subject: selectedSubject.trim() || 'Matematik',
        topic: selectedTopic.trim() || 'Konu Çalışması',
        mode,
        initialMinutes: targetMinutes,
        openModal: false
      });
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  const handleReset = () => {
    cancelTimer();
  };

  const handleOpenFullscreen = () => {
    if (activeTimer) {
      updateTimerState({
        subject: selectedSubject.trim() || 'Matematik',
        topic: selectedTopic.trim() || 'Konu Çalışması',
        mode,
        initialDurationMinutes: targetMinutes
      });
      expandTimer();
    } else {
      startTimer({
        subject: selectedSubject.trim() || 'Matematik',
        topic: selectedTopic.trim() || 'Konu Çalışması',
        mode,
        initialMinutes: targetMinutes,
        openModal: true,
        autoStart: false
      });
    }
  };

  const handleFinishAndOpenReport = () => {
    playFocusFinishSound();
    if (activeTimer?.isRunning) {
      pauseTimer();
    }
    setIsReportModalOpen(true);
  };

  const handleSubmitFocusReport = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSt = currentStudent || students[0];
    if (!targetSt) return;

    const finalSubject = selectedSubject.trim() || 'Genel Çalışma';
    const finalTopic = selectedTopic.trim() || 'Konu Çalışması';
    const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));

    const net = Number(Math.max(0, solvedCorrect - solvedWrong / 4).toFixed(2));
    const questions: SolvedQuestions = {
      correct: Number(solvedCorrect) || 0,
      wrong: Number(solvedWrong) || 0,
      blank: Number(solvedBlank) || 0,
      net
    };

    addFocusSession({
      studentId: targetSt.id,
      studentName: targetSt.name,
      subject: finalSubject,
      topic: finalTopic,
      durationMinutes: durationMins,
      durationSeconds: elapsedSeconds,
      mode,
      solvedQuestions: questions,
      studentNote: studentNote.trim() || undefined,
      sentToTeacher: true
    });

    setIsReportModalOpen(false);
    cancelTimer();
    setStudentNote('');
    setSolvedCorrect(0);
    setSolvedWrong(0);
    setSolvedBlank(0);
  };

  const handleSendTeacherFeedback = (sessionId: string) => {
    if (!feedbackText.trim()) return;
    giveTeacherFeedbackToFocusSession(sessionId, feedbackText.trim());
    setFeedbackText('');
    setActiveFeedbackSessionId(null);
  };

  const filteredFocusSessions = useMemo(() => {
    if (role === 'student') {
      if (!currentStudent?.id) return [];
      return focusSessions.filter(s => s.studentId === currentStudent.id);
    }
    const ownStudentIds = new Set(students.map(s => s.id));
    const teacherSessions = focusSessions.filter(s => ownStudentIds.has(s.studentId));
    if (filterStudentId === 'ALL') return teacherSessions;
    return teacherSessions.filter(s => s.studentId === filterStudentId);
  }, [focusSessions, filterStudentId, role, currentStudent?.id, students]);

  const sessionStats = useMemo(() => {
    const totalMinutes = filteredFocusSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const todayReports = filteredFocusSessions.filter(s => s.completedAt.startsWith(todayStr)).length;
    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      totalReports: filteredFocusSessions.length,
      todayReports
    };
  }, [filteredFocusSessions, todayStr]);

  return (
    <div className="space-y-5 max-w-5xl mx-auto select-none">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
            Odak Modu
          </h1>
          {activeTimer && (
            <button
              onClick={() => activeTimer.isPopupHidden ? showTimerPopup() : hideTimerPopup()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors cursor-pointer"
              title="Küçük Odak Pop-up'ını Göster veya Gizle (Arka planda saymaya devam eder)"
            >
              {activeTimer.isPopupHidden ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Küçük Pop-up'ı Göster (Arka Planda Sayıyor)</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Pop-up Ekranda Aktif (Gizle)</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            style={{ backgroundColor: `${themeStyles.accentColor}15`, color: themeStyles.accentColor }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isStreakEarnedToday ? 'Bugünkü Seri Kazanıldı' : '5 Dk Odak = +1 Seri'}</span>
          </div>

          <button
            onClick={handleOpenFullscreen}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
            title="Tam Ekran Odak Moduna Geç"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Tam Ekran</span>
          </button>
        </div>
      </div>

      {/* Sayaç Kartı */}
      <div className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 border transition-all ${
        isRunning
          ? 'bg-neutral-950 text-white border-blue-500/40 shadow-xl'
          : 'bg-white dark:bg-[#1C1C1E] text-neutral-900 dark:text-white border-black/5 dark:border-white/5'
      }`}>
        {/* Mod Seçimi */}
        <div className="flex items-center justify-center gap-1.5 max-w-xs mx-auto mb-5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800">
          <button
            onClick={() => {
              if (!isRunning) {
                setMode('pomodoro');
                if (activeTimer) updateTimerState({ mode: 'pomodoro', elapsedSeconds: 0 });
              }
            }}
            disabled={isRunning}
            className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              mode === 'pomodoro'
                ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500'
            }`}
          >
            Geri Sayım
          </button>
          <button
            onClick={() => {
              if (!isRunning) {
                setMode('stopwatch');
                if (activeTimer) updateTimerState({ mode: 'stopwatch', elapsedSeconds: 0 });
              }
            }}
            disabled={isRunning}
            className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              mode === 'stopwatch'
                ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500'
            }`}
          >
            Kronometre
          </button>
        </div>

        {/* Dakika Seçimi */}
        {mode === 'pomodoro' && !isRunning && (
          <div className="space-y-2.5 mb-5">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {[15, 25, 30, 45, 60, 90].map(mins => (
                <button
                  key={mins}
                  onClick={() => {
                    setTargetMinutes(mins);
                    if (activeTimer) {
                      updateTimerState({ initialDurationMinutes: mins, elapsedSeconds: 0 });
                    }
                    setIsEditingCustomMin(false);
                  }}
                  style={
                    targetMinutes === mins && !isEditingCustomMin
                      ? { backgroundColor: themeStyles.accentColor, color: '#FFFFFF' }
                      : undefined
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    targetMinutes === mins && !isEditingCustomMin
                      ? ''
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {mins} Dk
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setIsEditingCustomMin(prev => !prev);
                  if (!isEditingCustomMin) setCustomTargetInput(targetMinutes.toString());
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isEditingCustomMin
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Süre Gir</span>
              </button>
            </div>

            {isEditingCustomMin && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const val = parseInt(customTargetInput, 10);
                  if (!isNaN(val) && val >= 1 && val <= 1440) {
                    setTargetMinutes(val);
                    if (activeTimer) {
                      updateTimerState({ initialDurationMinutes: val, elapsedSeconds: 0 });
                    }
                    setIsEditingCustomMin(false);
                  }
                }}
                className="flex items-center justify-center gap-2 max-w-xs mx-auto"
              >
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={customTargetInput}
                  onChange={e => setCustomTargetInput(e.target.value)}
                  placeholder="Dakika"
                  className="w-32 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-indigo-500/40 text-center font-bold text-xs text-neutral-900 dark:text-white font-mono"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Uygula</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Ders ve Konu */}
        <div className="max-w-md mx-auto mb-5">
          <div className="flex items-center justify-center gap-2">
            <input
              type="text"
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              placeholder="Ders"
              disabled={isRunning}
              className="w-1/2 p-2 rounded-xl text-xs bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-center font-bold"
            />
            <input
              type="text"
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
              placeholder="Konu"
              disabled={isRunning}
              className="w-1/2 p-2 rounded-xl text-xs bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-center font-bold"
            />
          </div>
        </div>

        {/* Sayaç Göstergesi */}
        <div className="relative w-60 h-60 sm:w-64 sm:h-64 mx-auto my-2 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className={isRunning ? 'text-white/10' : 'text-neutral-200 dark:text-neutral-800'}
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-blue-500 transition-all duration-300"
              strokeWidth="4.5"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="focus-clock-font tabular-nums text-4xl sm:text-5xl font-bold tracking-tight">
              {formattedTime}
            </span>
            <span className="text-[11px] font-semibold mt-2 text-neutral-400">
              {elapsedSeconds >= 300
                ? (isStreakEarnedToday ? '5+ Dk Tamamlandı' : '5+ Dk (+1 Seri Hazır)')
                : isRunning ? 'Çalışılıyor' : 'Hazır'}
            </span>
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={handleReset}
            className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 cursor-pointer"
            title="Sıfırla"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {!isRunning ? (
            <button
              onClick={handleStart}
              style={themeStyles.primaryBtn}
              className="px-8 py-3.5 rounded-xl text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Başlat</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Duraklat</span>
            </button>
          )}

          <button
            onClick={handleFinishAndOpenReport}
            className="px-5 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Bitir & Gönder</span>
          </button>

          <button
            onClick={handleOpenFullscreen}
            className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 cursor-pointer"
            title="Tam Ekran Yap"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bitir & Gönder Modalı */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-black/5 dark:border-white/5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Çalışmayı Kaydet
                </h3>
                <p className="text-xs text-neutral-500">
                  Süre: {Math.max(1, Math.round(elapsedSeconds / 60))} dk
                  {elapsedSeconds >= 300 && !isStreakEarnedToday ? ' • +1 Seri' : ''}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitFocusReport} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1">Ders</label>
                  <input
                    type="text"
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-bold text-neutral-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1">Konu</label>
                  <input
                    type="text"
                    value={selectedTopic}
                    onChange={e => setSelectedTopic(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-bold text-neutral-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-black/5 dark:border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">Soru Sayıları</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    Net: {Math.max(0, Number((solvedCorrect - solvedWrong / 4).toFixed(2)))}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-center">
                    <label className="block text-[10px] font-bold text-emerald-600 mb-1">Doğru</label>
                    <input
                      type="number"
                      min={0}
                      value={solvedCorrect}
                      onChange={e => setSolvedCorrect(Math.max(0, Number(e.target.value)))}
                      className="w-full p-1 rounded bg-white dark:bg-neutral-800 text-center font-bold font-mono text-emerald-600"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-rose-500/10 text-center">
                    <label className="block text-[10px] font-bold text-rose-600 mb-1">Yanlış</label>
                    <input
                      type="number"
                      min={0}
                      value={solvedWrong}
                      onChange={e => setSolvedWrong(Math.max(0, Number(e.target.value)))}
                      className="w-full p-1 rounded bg-white dark:bg-neutral-800 text-center font-bold font-mono text-rose-600"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-200/70 dark:bg-neutral-800 text-center">
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1">Boş</label>
                    <input
                      type="number"
                      min={0}
                      value={solvedBlank}
                      onChange={e => setSolvedBlank(Math.max(0, Number(e.target.value)))}
                      className="w-full p-1 rounded bg-white dark:bg-neutral-900 text-center font-bold font-mono text-neutral-700 dark:text-neutral-300"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1">Not</label>
                <input
                  type="text"
                  value={studentNote}
                  onChange={e => setStudentNote(e.target.value)}
                  placeholder="İsteğe bağlı not..."
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-neutral-500 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Geçmiş Odak Seansları */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <h2 className="font-bold text-sm text-neutral-900 dark:text-white">
              Odak Kayıtları ({sessionStats.totalReports} Seans • {sessionStats.totalHours} Saat)
            </h2>
          </div>

          {role === 'teacher' && students.length > 0 && (
            <select
              value={filterStudentId}
              onChange={e => setFilterStudentId(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-semibold"
            >
              <option value="ALL">Tüm Öğrenciler</option>
              {students.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          )}
        </div>

        {filteredFocusSessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            Henüz odak kaydı yok.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredFocusSessions.map(session => (
              <div
                key={session.id}
                className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-black/5 dark:border-white/5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-xs text-neutral-900 dark:text-white mr-2">
                      {session.studentName}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      {session.subject} — {session.topic}
                    </span>
                  </div>

                  <div className="text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {session.durationMinutes} dk
                  </div>
                </div>

                {session.solvedQuestions && (
                  <div className="inline-flex items-center gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-300">
                    <span className="text-emerald-600 font-bold">D:{session.solvedQuestions.correct}</span>
                    <span className="text-rose-500 font-bold">Y:{session.solvedQuestions.wrong}</span>
                    <span className="text-neutral-400">B:{session.solvedQuestions.blank}</span>
                    <span className="text-blue-600 font-bold">Net:{session.solvedQuestions.net}</span>
                  </div>
                )}

                {session.studentNote && (
                  <p className="text-xs text-neutral-500">{session.studentNote}</p>
                )}

                {session.teacherFeedback ? (
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-xs text-indigo-700 dark:text-indigo-300">
                    <strong>Not:</strong> {session.teacherFeedback}
                  </div>
                ) : role === 'teacher' ? (
                  <div>
                    {activeFeedbackSessionId === session.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feedbackText}
                          onChange={e => setFeedbackText(e.target.value)}
                          placeholder="Not yazın..."
                          className="flex-1 p-1.5 rounded-lg text-xs bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10"
                        />
                        <button
                          onClick={() => handleSendTeacherFeedback(session.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs cursor-pointer"
                        >
                          Gönder
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveFeedbackSessionId(session.id);
                          setFeedbackText('');
                        }}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Not Ekle</span>
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
