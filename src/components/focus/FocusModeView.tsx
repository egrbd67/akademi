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
  Maximize2,
  Edit2,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import { useApp, playFocusFinishSound } from '../../context/AppContext';
import { FocusSession, SolvedQuestions } from '../../types';
import { getThemeStyles } from '../theme/ThemeCustomizerModal';
import { normalizeSubjectName } from '../../constants/subjects';

export const FocusModeView: React.FC = () => {
  const {
    role,
    currentStudent,
    students,
    subjects,
    addSubjectVariable,
    focusSessions,
    addFocusSession,
    updateFocusSession,
    deleteFocusSession,
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

  const [selectedSubject, setSelectedSubject] = useState<string>(
    normalizeSubjectName(activeTimer?.subject || 'Matematik')
  );
  const [selectedTopic, setSelectedTopic] = useState<string>(activeTimer?.topic || 'Konu Çalışması');
  const [isAddingCustomSubject, setIsAddingCustomSubject] = useState<boolean>(false);
  const [newSubjectInput, setNewSubjectInput] = useState<string>('');

  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [manualDurationMinutes, setManualDurationMinutes] = useState<number>(25);
  const [studentNote, setStudentNote] = useState<string>('');
  const [solvedCorrect, setSolvedCorrect] = useState<number>(0);
  const [solvedWrong, setSolvedWrong] = useState<number>(0);
  const [solvedBlank, setSolvedBlank] = useState<number>(0);

  const [activeFeedbackSessionId, setActiveFeedbackSessionId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [filterStudentId, setFilterStudentId] = useState<string>('ALL');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');

  // Edit & Delete States for Focus / Question Records
  const [editingSession, setEditingSession] = useState<FocusSession | null>(null);
  const [editSubject, setEditSubject] = useState<string>('Matematik');
  const [editTopic, setEditTopic] = useState<string>('');
  const [editDurationMinutes, setEditDurationMinutes] = useState<number>(25);
  const [editCorrect, setEditCorrect] = useState<number>(0);
  const [editWrong, setEditWrong] = useState<number>(0);
  const [editBlank, setEditBlank] = useState<number>(0);
  const [editNote, setEditNote] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Keep local form fields synced when an activeTimer is already running from Schedule/Homework or FocusMode
  useEffect(() => {
    if (activeTimer) {
      setMode(activeTimer.mode);
      if (activeTimer.initialDurationMinutes) {
        setTargetMinutes(activeTimer.initialDurationMinutes);
      }
      if (activeTimer.subject) setSelectedSubject(normalizeSubjectName(activeTimer.subject));
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

  const handleAddNewSubjectVariable = () => {
    const clean = newSubjectInput.trim();
    if (!clean) return;
    const norm = normalizeSubjectName(clean);
    addSubjectVariable(norm);
    setSelectedSubject(norm);
    setNewSubjectInput('');
    setIsAddingCustomSubject(false);
  };

  const handleStart = () => {
    const canonicalSubject = normalizeSubjectName(selectedSubject);
    if (activeTimer) {
      updateTimerState({
        subject: canonicalSubject,
        topic: selectedTopic.trim() || 'Konu Çalışması',
        mode,
        initialDurationMinutes: targetMinutes,
        isPopupHidden: false
      });
      resumeTimer();
    } else {
      startTimer({
        subject: canonicalSubject,
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
    const canonicalSubject = normalizeSubjectName(selectedSubject);
    if (activeTimer) {
      updateTimerState({
        subject: canonicalSubject,
        topic: selectedTopic.trim() || 'Konu Çalışması',
        mode,
        initialDurationMinutes: targetMinutes
      });
      expandTimer();
    } else {
      startTimer({
        subject: canonicalSubject,
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
    const defaultMins = elapsedSeconds > 0
      ? Math.max(1, Math.round(elapsedSeconds / 60))
      : Math.max(1, targetMinutes || 25);
    setManualDurationMinutes(defaultMins);
    setIsReportModalOpen(true);
  };

  const handleSubmitFocusReport = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSt = currentStudent || students[0];
    if (!targetSt) return;

    const finalSubject = normalizeSubjectName(selectedSubject);
    addSubjectVariable(finalSubject);
    const finalTopic = selectedTopic.trim() || 'Konu Çalışması';
    const durationMins = Math.max(1, Math.round(Number(manualDurationMinutes) || 1));

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
      durationSeconds: durationMins * 60,
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

  const handleOpenEditModal = (sess: FocusSession) => {
    setEditingSession(sess);
    setEditSubject(normalizeSubjectName(sess.subject));
    setEditTopic(sess.topic || 'Konu Çalışması');
    setEditDurationMinutes(Math.max(1, sess.durationMinutes || 25));
    setEditCorrect(sess.solvedQuestions?.correct ?? 0);
    setEditWrong(sess.solvedQuestions?.wrong ?? 0);
    setEditBlank(sess.solvedQuestions?.blank ?? 0);
    setEditNote(sess.studentNote || '');
  };

  const handleSaveEditedSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    const canonicalSubject = normalizeSubjectName(editSubject);
    addSubjectVariable(canonicalSubject);
    const cleanTopic = editTopic.trim() || 'Konu Çalışması';
    const durationMins = Math.max(1, Math.round(Number(editDurationMinutes) || 1));
    const c = Math.max(0, Number(editCorrect) || 0);
    const w = Math.max(0, Number(editWrong) || 0);
    const b = Math.max(0, Number(editBlank) || 0);
    const net = Number(Math.max(0, c - w / 4).toFixed(2));

    await updateFocusSession(editingSession.id, {
      subject: canonicalSubject,
      topic: cleanTopic,
      durationMinutes: durationMins,
      durationSeconds: durationMins * 60,
      solvedQuestions: {
        correct: c,
        wrong: w,
        blank: b,
        net
      },
      studentNote: editNote.trim() || ''
    });

    setEditingSession(null);
  };

  const handleConfirmDeleteSession = async (id: string) => {
    await deleteFocusSession(id);
    setConfirmDeleteId(null);
  };

  const handleSendTeacherFeedback = (sessionId: string) => {
    if (!feedbackText.trim()) return;
    giveTeacherFeedbackToFocusSession(sessionId, feedbackText.trim());
    setFeedbackText('');
    setActiveFeedbackSessionId(null);
  };

  const filteredFocusSessions = useMemo(() => {
    let base: FocusSession[] = [];
    if (role === 'student') {
      if (!currentStudent?.id) return [];
      base = focusSessions.filter(s => s.studentId === currentStudent.id);
    } else {
      const ownStudentIds = new Set(students.map(s => s.id));
      const teacherSessions = focusSessions.filter(s => ownStudentIds.has(s.studentId));
      base = filterStudentId === 'ALL'
        ? teacherSessions
        : teacherSessions.filter(s => s.studentId === filterStudentId);
    }
    if (filterSubject !== 'ALL') {
      return base.filter(s => normalizeSubjectName(s.subject) === filterSubject);
    }
    return base;
  }, [focusSessions, filterStudentId, filterSubject, role, currentStudent?.id, students]);

  const sessionStats = useMemo(() => {
    const totalMinutes = filteredFocusSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const todayReports = filteredFocusSessions.filter(s => s.completedAt.startsWith(todayStr)).length;
    const totalQuestions = filteredFocusSessions.reduce((acc, curr) => {
      if (!curr.solvedQuestions) return acc;
      return acc + curr.solvedQuestions.correct + curr.solvedQuestions.wrong + curr.solvedQuestions.blank;
    }, 0);
    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      totalReports: filteredFocusSessions.length,
      todayReports,
      totalQuestions
    };
  }, [filteredFocusSessions, todayStr]);

  return (
    <div className="space-y-5 max-w-5xl mx-auto select-none">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
            Odak Modu & Soru Kayıtları
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

        {/* Ortak Ders Değişkeni Seçimi ve Konu */}
        <div className="max-w-lg mx-auto mb-5 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1/2 flex items-center gap-1">
              <select
                value={selectedSubject}
                onChange={e => {
                  if (e.target.value === '__ADD_NEW__') {
                    setIsAddingCustomSubject(true);
                  } else {
                    setSelectedSubject(e.target.value);
                  }
                }}
                disabled={isRunning}
                className="w-full p-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-bold text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {subjects.map(subj => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
                <option value="__ADD_NEW__">+ Yeni Ders Değişkeni Ekle...</option>
              </select>
            </div>
            <input
              type="text"
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
              placeholder="Konu Başlığı"
              disabled={isRunning}
              className="w-1/2 p-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-center font-bold text-neutral-900 dark:text-white"
            />
          </div>

          {isAddingCustomSubject && (
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <input
                type="text"
                value={newSubjectInput}
                onChange={e => setNewSubjectInput(e.target.value)}
                placeholder="Yeni ders adı (Örn: Paragraf, Analitik Geometri)"
                className="flex-1 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-blue-500/40 text-xs font-bold text-neutral-900 dark:text-white"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddNewSubjectVariable}
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
              >
                Ekle
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCustomSubject(false);
                  setNewSubjectInput('');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-bold cursor-pointer"
              >
                İptal
              </button>
            </div>
          )}
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
                  Çalışmayı Kaydet & Öğretmene Gönder
                </h3>
                <p className="text-xs text-neutral-500">
                  Çalıştığınız süreyi ve çözdüğünüz soruları aşağıdan girebilirsiniz
                  {manualDurationMinutes >= 5 && !isStreakEarnedToday ? ' • +1 Seri' : ''}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitFocusReport} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Ders Değişkeni
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-bold text-neutral-900 dark:text-white focus:outline-none"
                  >
                    {subjects.map(subj => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
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

              {/* Çalışma Süresi (Dakika) Giriş Alanı */}
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-between gap-3">
                <div>
                  <label className="block font-bold text-neutral-900 dark:text-white">
                    Çalışma Süresi (Dakika)
                  </label>
                  <span className="text-[11px] text-neutral-500">
                    Öğretmene gönderilecek odak süresi
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setManualDurationMinutes(prev => Math.max(1, (Number(prev) || 1) - 5))}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold font-mono cursor-pointer hover:opacity-80"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={manualDurationMinutes}
                    onChange={e => setManualDurationMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-20 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/15 text-center font-extrabold font-mono text-sm text-blue-600 dark:text-blue-400 focus:outline-none"
                    required
                  />
                  <span className="text-xs font-bold text-neutral-500">dk</span>
                  <button
                    type="button"
                    onClick={() => setManualDurationMinutes(prev => Math.min(720, (Number(prev) || 0) + 5))}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold font-mono cursor-pointer hover:opacity-80"
                  >
                    +5
                  </button>
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
                      className="w-full bg-transparent text-center font-mono font-bold text-sm text-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-rose-500/10 text-center">
                    <label className="block text-[10px] font-bold text-rose-600 mb-1">Yanlış</label>
                    <input
                      type="number"
                      min={0}
                      value={solvedWrong}
                      onChange={e => setSolvedWrong(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-transparent text-center font-mono font-bold text-sm text-rose-600 focus:outline-none"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-500/10 text-center">
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1">Boş</label>
                    <input
                      type="number"
                      min={0}
                      value={solvedBlank}
                      onChange={e => setSolvedBlank(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-transparent text-center font-mono font-bold text-sm text-neutral-600 dark:text-neutral-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1">Not</label>
                <textarea
                  value={studentNote}
                  onChange={e => setStudentNote(e.target.value)}
                  placeholder="Kısa notunuz..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-500 font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gönder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Soru / Odak Kaydını Düzenleme Modalı */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-500" />
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    Soru & Odak Kaydını Düzenle
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {editingSession.studentName} • {new Date(editingSession.completedAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedSession} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Ders Değişkeni
                  </label>
                  <select
                    value={editSubject}
                    onChange={e => setEditSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-bold text-neutral-900 dark:text-white focus:outline-none"
                  >
                    {subjects.map(subj => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Konu
                  </label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={e => setEditTopic(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-bold text-neutral-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-between gap-3">
                <div>
                  <label className="block font-bold text-neutral-900 dark:text-white">
                    Çalışma Süresi (Dakika)
                  </label>
                  <span className="text-[11px] text-neutral-500">Kayıtlı çalışma süresi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={editDurationMinutes}
                    onChange={e => setEditDurationMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-20 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/15 text-center font-extrabold font-mono text-sm text-blue-600 dark:text-blue-400 focus:outline-none"
                    required
                  />
                  <span className="text-xs font-bold text-neutral-500">dk</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-black/5 dark:border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">Çözülen Soru Sayıları</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    Net: {Math.max(0, Number((editCorrect - editWrong / 4).toFixed(2)))}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-center">
                    <label className="block text-[10px] font-bold text-emerald-600 mb-1">Doğru</label>
                    <input
                      type="number"
                      min={0}
                      value={editCorrect}
                      onChange={e => setEditCorrect(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-transparent text-center font-mono font-bold text-sm text-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-rose-500/10 text-center">
                    <label className="block text-[10px] font-bold text-rose-600 mb-1">Yanlış</label>
                    <input
                      type="number"
                      min={0}
                      value={editWrong}
                      onChange={e => setEditWrong(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-transparent text-center font-mono font-bold text-sm text-rose-600 focus:outline-none"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-500/10 text-center">
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1">Boş</label>
                    <input
                      type="number"
                      min={0}
                      value={editBlank}
                      onChange={e => setEditBlank(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-transparent text-center font-mono font-bold text-sm text-neutral-600 dark:text-neutral-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1">Not</label>
                <textarea
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  placeholder="Kısa notunuz..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 rounded-xl text-neutral-500 font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Değişiklikleri Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Geçmiş Odak & Soru Kayıtları Listesi (Düzenleme ve Silme Özellikli) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
              Odak & Soru Kayıtları
            </h2>
            <p className="text-xs text-neutral-400">
              Toplam {sessionStats.totalHours} saat • {sessionStats.totalQuestions} soru • {sessionStats.totalReports} kayıt (Bugün {sessionStats.todayReports})
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs font-bold"
            >
              <option value="ALL">Tüm Ders Değişkenleri</option>
              {subjects.map(subj => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>

            {role === 'teacher' && (
              <select
                value={filterStudentId}
                onChange={e => setFilterStudentId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs font-bold"
              >
                <option value="ALL">Tüm Öğrenciler</option>
                {students.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {filteredFocusSessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            Henüz odak veya soru kaydı bulunmuyor.
          </div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {filteredFocusSessions.map(sess => {
              const canonicalSubj = normalizeSubjectName(sess.subject);
              const qTotal = sess.solvedQuestions
                ? sess.solvedQuestions.correct + sess.solvedQuestions.wrong + sess.solvedQuestions.blank
                : 0;
              return (
                <div key={sess.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-xs text-neutral-900 dark:text-white">
                        {sess.studentName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                        {canonicalSubj}
                      </span>
                      <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                        {sess.topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold text-xs">
                        {sess.durationMinutes} Dk
                      </span>
                      {sess.solvedQuestions && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                          {qTotal} Soru • {sess.solvedQuestions.correct}D/{sess.solvedQuestions.wrong}Y/{sess.solvedQuestions.blank}B ({sess.solvedQuestions.net} Net)
                        </span>
                      )}
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {new Date(sess.completedAt).toLocaleString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>

                      {/* Düzenle ve Sil Butonları */}
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(sess)}
                          className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-blue-500/15 text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Soru / Odak Kaydını Düzenle"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Düzenle</span>
                        </button>

                        {confirmDeleteId === sess.id ? (
                          <div className="inline-flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/30">
                            <button
                              type="button"
                              onClick={() => handleConfirmDeleteSession(sess.id)}
                              className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                            >
                              Sil
                            </button>
                            <span className="text-neutral-300 dark:text-neutral-600">|</span>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                            >
                              Vazgeç
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(sess.id)}
                            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-500/15 text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Kaydı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {sess.studentNote && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Not: "{sess.studentNote}"
                    </p>
                  )}

                  {sess.teacherFeedback ? (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                      <span className="font-bold">Öğretmen Yorumu: </span>
                      {sess.teacherFeedback}
                    </div>
                  ) : (
                    role === 'teacher' && (
                      <div>
                        {activeFeedbackSessionId === sess.id ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={feedbackText}
                              onChange={e => setFeedbackText(e.target.value)}
                              placeholder="Yorum yazın..."
                              className="flex-1 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs"
                            />
                            <button
                              onClick={() => handleSendTeacherFeedback(sess.id)}
                              className="px-3 py-2 rounded-xl bg-blue-500 text-white font-bold text-xs cursor-pointer"
                            >
                              Gönder
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setActiveFeedbackSessionId(sess.id)}
                            className="text-[11px] font-bold text-blue-500 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Yorum Yaz</span>
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
