import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Flame,
  Edit2,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { normalizeSubjectName } from '../../constants/subjects';

interface TeacherStudyTrackerViewProps {
  initialStudentId?: string;
  compact?: boolean;
}

export interface UnifiedStudyEntry {
  id: string;
  rawId: string;
  studentId: string;
  studentName: string;
  dateKey: string; // YYYY-MM-DD local
  timeLabel: string;
  timestampMs: number;
  category: 'focus' | 'schedule' | 'homework' | 'exam' | 'activity';
  categoryLabel: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  questionsTotal: number;
  correct?: number;
  wrong?: number;
  blank?: number;
  net?: number;
  note?: string;
}

const toLocalDateKey = (input?: string | Date): string => {
  if (!input) return '';
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    return input.trim();
  }
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) {
    return typeof input === 'string' ? input.split('T')[0] : '';
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeShort = (input?: string): string => {
  if (!input) return '--:--';
  if (/^\d{4}-\d{2}-\d{2}$/.test(input.trim())) return 'Gün İçi';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

const addDaysToDateKey = (dateKey: string, deltaDays: number): string => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + deltaDays);
  return toLocalDateKey(dt);
};

const formatHumanDate = (dateKey: string, todayKey: string): string => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const formatted = dt.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'short'
  });
  if (dateKey === todayKey) return `Bugün (${formatted})`;
  const yesterdayKey = addDaysToDateKey(todayKey, -1);
  if (dateKey === yesterdayKey) return `Dün (${formatted})`;
  const sevenDaysAgoKey = addDaysToDateKey(todayKey, -7);
  if (dateKey === sevenDaysAgoKey) return `1 Hafta Önce (${formatted})`;
  return formatted;
};

const formatShortDayChip = (dateKey: string, refDateKey: string): { top: string; bottom: string } => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const dayMonth = dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
  const weekday = dt.toLocaleDateString('tr-TR', { weekday: 'short' });

  if (dateKey === refDateKey) {
    return { top: 'Seçili Gün', bottom: `${dayMonth} ${weekday}` };
  }
  const oneDayBefore = addDaysToDateKey(refDateKey, -1);
  if (dateKey === oneDayBefore) {
    return { top: '1 Gün Önce', bottom: `${dayMonth} ${weekday}` };
  }
  const sevenDaysBefore = addDaysToDateKey(refDateKey, -7);
  if (dateKey === sevenDaysBefore) {
    return { top: '1 Hafta Önce', bottom: `${dayMonth} ${weekday}` };
  }
  return { top: weekday, bottom: dayMonth };
};

export const TeacherStudyTrackerView: React.FC<TeacherStudyTrackerViewProps> = ({
  initialStudentId = 'ALL',
  compact = false
}) => {
  const {
    students,
    classrooms,
    subjects,
    addSubjectVariable,
    focusSessions,
    updateFocusSession,
    deleteFocusSession,
    schedules,
    updateScheduleItem,
    deleteScheduleItem,
    homeworks,
    updateHomework,
    trialExams,
    deleteTrialExam,
    activities
  } = useApp();

  const todayKey = useMemo(() => toLocalDateKey(new Date()), []);

  const [referenceDateKey, setReferenceDateKey] = useState<string>(todayKey);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || 'ALL');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'student_comparison' | 'day_by_day'>('student_comparison');
  const [focusedHistoryDayKey, setFocusedHistoryDayKey] = useState<string>('ALL_7_DAYS');

  // Edit & Delete State for Question / Study Records
  const [editingEntry, setEditingEntry] = useState<UnifiedStudyEntry | null>(null);
  const [editSubject, setEditSubject] = useState<string>('Matematik');
  const [editTopic, setEditTopic] = useState<string>('');
  const [editDurationMinutes, setEditDurationMinutes] = useState<number>(0);
  const [editCorrect, setEditCorrect] = useState<number>(0);
  const [editWrong, setEditWrong] = useState<number>(0);
  const [editBlank, setEditBlank] = useState<number>(0);
  const [editNote, setEditNote] = useState<string>('');
  const [confirmDeleteEntryId, setConfirmDeleteEntryId] = useState<string | null>(null);

  // Keep selectedStudentId synced if initialStudentId prop changes
  React.useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    }
  }, [initialStudentId]);

  // 7 days prior to referenceDateKey (from referenceDate - 1 day back to referenceDate - 7 days, i.e., 1 week prior)
  const pastSevenDayKeys = useMemo(() => {
    const keys: string[] = [];
    for (let i = 1; i <= 7; i++) {
      keys.push(addDaysToDateKey(referenceDateKey, -i));
    }
    return keys; // [ref-1, ref-2, ..., ref-7 (1 week ago)]
  }, [referenceDateKey]);

  const pastSevenDaysSet = useMemo(() => new Set(pastSevenDayKeys), [pastSevenDayKeys]);
  const oneWeekAgoExactKey = useMemo(() => addDaysToDateKey(referenceDateKey, -7), [referenceDateKey]);

  // Filter students by classroom & search
  const visibleStudents = useMemo(() => {
    return students.filter(st => {
      if (selectedStudentId !== 'ALL' && st.id !== selectedStudentId) return false;
      if (selectedClassroomId !== 'ALL') {
        const clsIds = st.classroomIds || [];
        const clsObj = classrooms.find(c => c.id === selectedClassroomId);
        const inCls = clsIds.includes(selectedClassroomId) || Boolean(clsObj?.studentIds?.includes(st.id));
        if (!inCls) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = st.name.toLowerCase().includes(q);
        const matchNo = (st.studentNumber || st.pin || '').toLowerCase().includes(q);
        if (!matchName && !matchNo) return false;
      }
      return true;
    });
  }, [students, selectedStudentId, selectedClassroomId, classrooms, searchQuery]);

  const visibleStudentIdsSet = useMemo(() => new Set(visibleStudents.map(s => s.id)), [visibleStudents]);

  // Build unified study entries across FocusSessions, Completed Schedules, Submitted Homeworks, TrialExams, and Activities
  const allStudyEntries = useMemo(() => {
    const entries: UnifiedStudyEntry[] = [];
    const studentNameMap = new Map(students.map(s => [s.id, s.name]));

    // Track keys to avoid duplicate activity log entries for the same focus session or exam
    const coveredFocusKeys = new Set<string>();

    // 1. Focus Sessions
    focusSessions.forEach(sess => {
      if (!visibleStudentIdsSet.has(sess.studentId)) return;
      const dKey = toLocalDateKey(sess.completedAt);
      if (!dKey) return;
      const canonicalSubj = normalizeSubjectName(sess.subject);
      const qTotal = sess.solvedQuestions
        ? sess.solvedQuestions.correct + sess.solvedQuestions.wrong + sess.solvedQuestions.blank
        : 0;
      const ts = new Date(sess.completedAt).getTime() || Date.now();
      coveredFocusKeys.add(`${sess.studentId}_${dKey}_${canonicalSubj}_${sess.topic}`);
      coveredFocusKeys.add(`${sess.studentId}_${dKey}_${sess.subject}_${sess.topic}`);

      entries.push({
        id: `focus_${sess.id}`,
        rawId: sess.id,
        studentId: sess.studentId,
        studentName: sess.studentName || studentNameMap.get(sess.studentId) || 'Öğrenci',
        dateKey: dKey,
        timeLabel: formatTimeShort(sess.completedAt),
        timestampMs: ts,
        category: 'focus',
        categoryLabel: 'Odak & Soru Kaydı',
        subject: canonicalSubj,
        topic: sess.topic,
        durationMinutes: sess.durationMinutes || 0,
        questionsTotal: qTotal,
        correct: sess.solvedQuestions?.correct,
        wrong: sess.solvedQuestions?.wrong,
        blank: sess.solvedQuestions?.blank,
        net: sess.solvedQuestions?.net,
        note: sess.studentNote
      });
    });

    // 2. Completed Weekly Schedule Items
    schedules.forEach(sch => {
      if (sch.status !== 'completed') return;
      if (!visibleStudentIdsSet.has(sch.studentId)) return;

      // Determine dateKey from updatedAt, or fallback to current week's matching dayOfWeek
      let dKey = sch.updatedAt ? toLocalDateKey(sch.updatedAt) : '';
      if (!dKey) {
        const now = new Date();
        const currentDow = now.getDay() === 0 ? 7 : now.getDay();
        const diff = sch.dayOfWeek - currentDow;
        const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
        dKey = toLocalDateKey(targetDate);
      }

      const canonicalSubj = normalizeSubjectName(sch.subject);
      const qTotal = sch.solvedQuestions
        ? sch.solvedQuestions.correct + sch.solvedQuestions.wrong + sch.solvedQuestions.blank
        : (sch.targetType === 'question' ? (sch.targetValue || 0) : 0);

      const durMins = sch.actualDurationMinutes || (sch.targetType === 'duration' ? (sch.targetValue || 0) : 0);
      const ts = sch.updatedAt ? (new Date(sch.updatedAt).getTime() || Date.now()) : Date.now();

      entries.push({
        id: `sch_${sch.id}`,
        rawId: sch.id,
        studentId: sch.studentId,
        studentName: studentNameMap.get(sch.studentId) || 'Öğrenci',
        dateKey: dKey,
        timeLabel: sch.updatedAt ? formatTimeShort(sch.updatedAt) : `${sch.sessionNumber || 1}. Oturum`,
        timestampMs: ts,
        category: 'schedule',
        categoryLabel: `${sch.sessionNumber || 1}. Oturum Tamamlandı`,
        subject: canonicalSubj,
        topic: sch.topic || 'Program Ders Oturumu',
        durationMinutes: durMins,
        questionsTotal: qTotal,
        correct: sch.solvedQuestions?.correct,
        wrong: sch.solvedQuestions?.wrong,
        blank: sch.solvedQuestions?.blank,
        net: sch.solvedQuestions?.net,
        note: sch.sourceBook ? `Kaynak: ${sch.sourceBook}` : undefined
      });
    });

    // 3. Submitted / Approved Homeworks
    homeworks.forEach(hw => {
      if (hw.status !== 'submitted' && hw.status !== 'approved') return;
      if (!visibleStudentIdsSet.has(hw.studentId)) return;
      const submittedAt = hw.studentSubmission?.submittedAt || hw.dueDate;
      const dKey = toLocalDateKey(submittedAt);
      if (!dKey) return;

      const canonicalSubj = normalizeSubjectName(hw.subject);
      const sub = hw.studentSubmission;
      const qTotal = sub ? sub.correct + sub.wrong + sub.blank : (hw.targetQuestionCount || 0);
      const ts = submittedAt ? (new Date(submittedAt).getTime() || Date.now()) : Date.now();

      entries.push({
        id: `hw_${hw.id}`,
        rawId: hw.id,
        studentId: hw.studentId,
        studentName: studentNameMap.get(hw.studentId) || 'Öğrenci',
        dateKey: dKey,
        timeLabel: formatTimeShort(submittedAt),
        timestampMs: ts,
        category: 'homework',
        categoryLabel: 'Ödev Teslimi',
        subject: canonicalSubj,
        topic: `${hw.title} (${hw.topic})`,
        durationMinutes: 0,
        questionsTotal: qTotal,
        correct: sub?.correct,
        wrong: sub?.wrong,
        blank: sub?.blank,
        net: sub?.net,
        note: sub?.studentNote
      });
    });

    // 4. Trial Exams
    trialExams.forEach(ex => {
      if (!visibleStudentIdsSet.has(ex.studentId)) return;
      const dKey = toLocalDateKey(ex.date);
      if (!dKey) return;
      const qTotal = (ex.totalCorrect || 0) + (ex.totalWrong || 0) + (ex.totalBlank || 0);
      const ts = new Date(ex.date).getTime() || Date.now();

      entries.push({
        id: `exam_${ex.id}`,
        rawId: ex.id,
        studentId: ex.studentId,
        studentName: studentNameMap.get(ex.studentId) || 'Öğrenci',
        dateKey: dKey,
        timeLabel: 'Deneme',
        timestampMs: ts,
        category: 'exam',
        categoryLabel: `${ex.examType} Deneme Sınavı`,
        subject: ex.examType,
        topic: ex.title,
        durationMinutes: 0,
        questionsTotal: qTotal,
        correct: ex.totalCorrect,
        wrong: ex.totalWrong,
        blank: ex.totalBlank,
        net: ex.totalNet
      });
    });

    // 5. Additional Activity Logs (that aren't duplicate focus/join events)
    activities.forEach(act => {
      if (!visibleStudentIdsSet.has(act.studentId)) return;
      if (act.type === 'joined_class') return; // Don't clutter study report with login events
      const dKey = toLocalDateKey(act.timestamp);
      if (!dKey) return;

      // Skip if this activity is already represented by a FocusSession or TrialExam on the same day
      const parts = act.title.split('•').map(p => p.trim());
      if (parts.length >= 2 && coveredFocusKeys.has(`${act.studentId}_${dKey}_${parts[0]}_${parts[1]}`)) {
        return;
      }
      if (act.type === 'exam_recorded' || act.title.includes('Oturum Tamamlandı')) {
        return;
      }

      const ts = new Date(act.timestamp).getTime() || Date.now();
      entries.push({
        id: `act_${act.id}`,
        rawId: act.id,
        studentId: act.studentId,
        studentName: act.studentName || studentNameMap.get(act.studentId) || 'Öğrenci',
        dateKey: dKey,
        timeLabel: formatTimeShort(act.timestamp),
        timestampMs: ts,
        category: 'activity',
        categoryLabel: 'Aktivite',
        subject: act.title,
        topic: act.detail,
        durationMinutes: 0,
        questionsTotal: 0
      });
    });

    return entries.sort((a, b) => b.timestampMs - a.timestampMs);
  }, [focusSessions, schedules, homeworks, trialExams, activities, students, visibleStudentIdsSet]);

  const handleOpenEditEntry = (entry: UnifiedStudyEntry) => {
    setEditingEntry(entry);
    setEditSubject(normalizeSubjectName(entry.subject));
    setEditTopic(entry.topic || '');
    setEditDurationMinutes(entry.durationMinutes || 0);
    setEditCorrect(entry.correct ?? 0);
    setEditWrong(entry.wrong ?? 0);
    setEditBlank(entry.blank ?? 0);
    setEditNote(entry.note || '');
  };

  const handleSaveEntryChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    const canonicalSubject = normalizeSubjectName(editSubject);
    addSubjectVariable(canonicalSubject);
    const c = Math.max(0, Number(editCorrect) || 0);
    const w = Math.max(0, Number(editWrong) || 0);
    const b = Math.max(0, Number(editBlank) || 0);
    const net = Number(Math.max(0, c - w / 4).toFixed(2));
    const durMins = Math.max(0, Math.round(Number(editDurationMinutes) || 0));

    if (editingEntry.category === 'focus') {
      await updateFocusSession(editingEntry.rawId, {
        subject: canonicalSubject,
        topic: editTopic.trim() || 'Konu Çalışması',
        durationMinutes: Math.max(1, durMins || 1),
        durationSeconds: Math.max(1, durMins || 1) * 60,
        solvedQuestions: { correct: c, wrong: w, blank: b, net },
        studentNote: editNote.trim() || ''
      });
    } else if (editingEntry.category === 'schedule') {
      await updateScheduleItem(editingEntry.rawId, {
        subject: canonicalSubject,
        topic: editTopic.trim() || 'Program Ders Oturumu',
        actualDurationMinutes: durMins,
        solvedQuestions: { correct: c, wrong: w, blank: b, net }
      });
    } else if (editingEntry.category === 'homework') {
      const targetHw = homeworks.find(h => h.id === editingEntry.rawId);
      await updateHomework(editingEntry.rawId, {
        subject: canonicalSubject,
        studentSubmission: {
          correct: c,
          wrong: w,
          blank: b,
          net,
          studentNote: editNote.trim() || '',
          submittedAt: targetHw?.studentSubmission?.submittedAt || new Date().toISOString()
        }
      });
    }

    setEditingEntry(null);
  };

  const handleDeleteEntry = async (entry: UnifiedStudyEntry) => {
    if (entry.category === 'focus') {
      await deleteFocusSession(entry.rawId);
    } else if (entry.category === 'schedule') {
      await deleteScheduleItem(entry.rawId);
    } else if (entry.category === 'exam') {
      await deleteTrialExam(entry.rawId);
    }
    setConfirmDeleteEntryId(null);
  };

  // Split into:
  // 1) Reference Day ("O Gün Yaptıkları")
  // 2) 1 Week Prior ("O Günden 1 Hafta Önceki Çalışmaları" = past 7 days: ref-1 .. ref-7)
  const selectedDayEntries = useMemo(
    () => allStudyEntries.filter(e => e.dateKey === referenceDateKey),
    [allStudyEntries, referenceDateKey]
  );

  const pastWeekEntries = useMemo(
    () => allStudyEntries.filter(e => pastSevenDaysSet.has(e.dateKey)),
    [allStudyEntries, pastSevenDaysSet]
  );

  // Aggregate stats for Top Summary
  const summaryMetrics = useMemo(() => {
    const activeStudentsToday = new Set(selectedDayEntries.map(e => e.studentId)).size;
    const todayQuestions = selectedDayEntries.reduce((sum, e) => sum + e.questionsTotal, 0);
    const todayMinutes = selectedDayEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
    const todaySessionsCount = selectedDayEntries.length;

    const activeStudentsWeek = new Set(pastWeekEntries.map(e => e.studentId)).size;
    const weekQuestions = pastWeekEntries.reduce((sum, e) => sum + e.questionsTotal, 0);
    const weekMinutes = pastWeekEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
    const weekSessionsCount = pastWeekEntries.length;

    // Exact 1 week ago (refDate - 7 days)
    const exactOneWeekAgoEntries = pastWeekEntries.filter(e => e.dateKey === oneWeekAgoExactKey);
    const exactOneWeekAgoQuestions = exactOneWeekAgoEntries.reduce((sum, e) => sum + e.questionsTotal, 0);
    const exactOneWeekAgoMinutes = exactOneWeekAgoEntries.reduce((sum, e) => sum + e.durationMinutes, 0);

    return {
      activeStudentsToday,
      todayQuestions,
      todayMinutes,
      todaySessionsCount,
      activeStudentsWeek,
      weekQuestions,
      weekMinutes,
      weekSessionsCount,
      exactOneWeekAgoEntriesCount: exactOneWeekAgoEntries.length,
      exactOneWeekAgoQuestions,
      exactOneWeekAgoMinutes
    };
  }, [selectedDayEntries, pastWeekEntries, oneWeekAgoExactKey]);

  const getInitials = (name: string) => {
    if (!name) return 'ÖG';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderEntryActions = (item: UnifiedStudyEntry) => {
    const canEdit = item.category === 'focus' || item.category === 'schedule' || item.category === 'homework';
    const canDelete = item.category === 'focus' || item.category === 'schedule' || item.category === 'exam';
    if (!canEdit && !canDelete) return null;

    return (
      <div className="inline-flex items-center gap-1 shrink-0">
        {canEdit && (
          <button
            type="button"
            onClick={() => handleOpenEditEntry(item)}
            className="p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-blue-500/15 text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            title="Soru / Çalışma Kaydını Düzenle"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        )}
        {canDelete && (
          confirmDeleteEntryId === item.id ? (
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[10px]">
              <button
                type="button"
                onClick={() => handleDeleteEntry(item)}
                className="font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Sil
              </button>
              <span className="text-neutral-300 dark:text-neutral-600">|</span>
              <button
                type="button"
                onClick={() => setConfirmDeleteEntryId(null)}
                className="font-semibold text-neutral-500 cursor-pointer"
              >
                İptal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDeleteEntryId(item.id)}
              className="p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-500/15 text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              title="Kaydı Sil"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header & Controls Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
          <div>
            <h2 className={`${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-bold text-neutral-900 dark:text-white`}>
              Günlük ve 1 Hafta Önceki Çalışma Takibi
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Öğrencilerinizin seçili günde yaptıklarını ve o günden 1 hafta önceki (son 7 günlük) çalışmalarını karşılaştırın, soru kayıtlarını düzenleyin veya silin.
            </p>
          </div>

          {/* Date Picker & Quick Navigation */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-black/5 dark:border-white/5">
              <button
                onClick={() => setReferenceDateKey(prev => addDaysToDateKey(prev, -1))}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                title="Önceki Gün"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <input
                  type="date"
                  value={referenceDateKey}
                  max={todayKey}
                  onChange={e => {
                    if (e.target.value) {
                      setReferenceDateKey(e.target.value);
                      setFocusedHistoryDayKey('ALL_7_DAYS');
                    }
                  }}
                  className="bg-transparent text-xs font-bold font-mono text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => {
                  const next = addDaysToDateKey(referenceDateKey, 1);
                  if (next <= todayKey) setReferenceDateKey(next);
                }}
                disabled={referenceDateKey >= todayKey}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 transition-colors cursor-pointer"
                title="Sonraki Gün"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {referenceDateKey !== todayKey && (
              <button
                onClick={() => {
                  setReferenceDateKey(todayKey);
                  setFocusedHistoryDayKey('ALL_7_DAYS');
                }}
                className="px-3 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Bugüne Dön</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Row: Student Select, Classroom Select, Search, View Mode */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2 flex-1">
            {/* Student Filter */}
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">Tüm Öğrenciler ({students.length})</option>
              {students.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.studentNumber || st.pin.substring(0, 5)})
                </option>
              ))}
            </select>

            {/* Classroom Filter */}
            {classrooms.length > 0 && (
              <select
                value={selectedClassroomId}
                onChange={e => setSelectedClassroomId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none"
              >
                <option value="ALL">Tüm Sınıflar</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Öğrenci adı veya numara..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Sub-view Segmented Control */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 self-start md:self-auto">
            <button
              onClick={() => setActiveSubTab('student_comparison')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeSubTab === 'student_comparison'
                  ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Öğrenci Bazlı (O Gün & 1 Hafta Önce)
            </button>
            <button
              onClick={() => setActiveSubTab('day_by_day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeSubTab === 'day_by_day'
                  ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Gün Gün Zaman Çizelgesi
            </button>
          </div>
        </div>
      </div>

      {/* Top KPI Comparison Strip: O Gün vs 1 Hafta Önceki (Son 7 Gün) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: O Gün Yaptıkları */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-semibold text-neutral-900 dark:text-white">
              {referenceDateKey === todayKey ? 'Bugün Yapılan Çalışmalar' : 'Seçili Gün Yapılanlar'}
            </span>
            <span className="font-mono tabular-nums text-[11px]">{referenceDateKey}</span>
          </div>
          <div className="mt-3 flex items-baseline gap-4">
            <div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-neutral-900 dark:text-white">
                {summaryMetrics.todayQuestions}
              </div>
              <div className="text-[11px] text-neutral-500">Çözülen Soru</div>
            </div>
            <div className="h-7 w-px bg-black/5 dark:bg-white/10" />
            <div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-blue-600 dark:text-blue-400">
                {summaryMetrics.todayMinutes} <span className="text-xs font-semibold">dk</span>
              </div>
              <div className="text-[11px] text-neutral-500">Odak & Ders Süresi</div>
            </div>
            <div className="h-7 w-px bg-black/5 dark:bg-white/10" />
            <div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {summaryMetrics.activeStudentsToday}/{visibleStudents.length}
              </div>
              <div className="text-[11px] text-neutral-500">Aktif Öğrenci</div>
            </div>
          </div>
        </div>

        {/* Card 2: Tam 1 Hafta Önceki Gün (7 Gün Önce) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-semibold text-neutral-900 dark:text-white">
              Tam 1 Hafta Önceki Gün
            </span>
            <span className="font-mono tabular-nums text-[11px]">{oneWeekAgoExactKey}</span>
          </div>
          <div className="mt-3 flex items-baseline gap-4">
            <div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-neutral-900 dark:text-white">
                {summaryMetrics.exactOneWeekAgoQuestions}
              </div>
              <div className="text-[11px] text-neutral-500">Çözülen Soru</div>
            </div>
            <div className="h-7 w-px bg-black/5 dark:bg-white/10" />
            <div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                {summaryMetrics.exactOneWeekAgoMinutes} <span className="text-xs font-semibold">dk</span>
              </div>
              <div className="text-[11px] text-neutral-500">Odak & Ders Süresi</div>
            </div>
            <div className="h-7 w-px bg-black/5 dark:bg-white/10" />
            <div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                {summaryMetrics.exactOneWeekAgoEntriesCount}
              </div>
              <div className="text-[11px] text-neutral-500">Kayıtlı Çalışma</div>
            </div>
          </div>
        </div>

        {/* Card 3: O Günden Önceki 1 Haftalık Toplam (Son 7 Gün) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-semibold text-neutral-900 dark:text-white">
              Önceki 7 Gün Toplamı (1 Hafta)
            </span>
            <span className="font-mono tabular-nums text-[11px]">
              {oneWeekAgoExactKey.slice(5)} – {addDaysToDateKey(referenceDateKey, -1).slice(5)}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-4">
            <div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-neutral-900 dark:text-white">
                {summaryMetrics.weekQuestions}
              </div>
              <div className="text-[11px] text-neutral-500">Toplam Soru</div>
            </div>
            <div className="h-7 w-px bg-black/5 dark:bg-white/10" />
            <div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                {summaryMetrics.weekMinutes} <span className="text-xs font-semibold">dk</span>
              </div>
              <div className="text-[11px] text-neutral-500">Toplam Süre</div>
            </div>
            <div className="h-7 w-px bg-black/5 dark:bg-white/10" />
            <div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                {summaryMetrics.weekSessionsCount}
              </div>
              <div className="text-[11px] text-neutral-500">Toplam Oturum</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 7-Day History Filter Strip */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setFocusedHistoryDayKey('ALL_7_DAYS')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              focusedHistoryDayKey === 'ALL_7_DAYS'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Önceki 1 Haftanın Tümü (7 Gün)
          </button>

          <button
            onClick={() => setFocusedHistoryDayKey(oneWeekAgoExactKey)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              focusedHistoryDayKey === oneWeekAgoExactKey
                ? 'bg-blue-600 text-white'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'
            }`}
          >
            Tam 1 Hafta Önce ({oneWeekAgoExactKey.slice(8)}.{oneWeekAgoExactKey.slice(5, 7)})
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {pastSevenDayKeys.map(dKey => {
            const chip = formatShortDayChip(dKey, referenceDateKey);
            const countForDay = pastWeekEntries.filter(e => e.dateKey === dKey).length;
            const isSelected = focusedHistoryDayKey === dKey;
            return (
              <button
                key={dKey}
                onClick={() => setFocusedHistoryDayKey(isSelected ? 'ALL_7_DAYS' : dKey)}
                className={`px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                    : 'bg-neutral-50 dark:bg-neutral-900/50 text-neutral-700 dark:text-neutral-300 border-black/5 dark:border-white/5 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="text-[10px] opacity-75 font-semibold">{chip.top}</div>
                <div className="text-xs font-bold font-mono tabular-nums flex items-center gap-1.5">
                  <span>{chip.bottom}</span>
                  <span className={`text-[10px] ${countForDay > 0 ? 'text-emerald-500 font-extrabold' : 'opacity-40'}`}>
                    · {countForDay}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT: MODE 1 - STUDENT COMPARISON (O GÜN vs 1 HAFTA ÖNCEKİ ÇALIŞMALAR) */}
      {activeSubTab === 'student_comparison' ? (
        visibleStudents.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 text-center text-xs text-neutral-400">
            Seçili filtreye uygun öğrenci bulunamadı.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleStudents.map(st => {
              const stTodayList = selectedDayEntries.filter(e => e.studentId === st.id);
              const stPastWeekAll = pastWeekEntries.filter(e => e.studentId === st.id);
              const stPastWeekFiltered = focusedHistoryDayKey === 'ALL_7_DAYS'
                ? stPastWeekAll
                : stPastWeekAll.filter(e => e.dateKey === focusedHistoryDayKey);

              const todayQ = stTodayList.reduce((s, e) => s + e.questionsTotal, 0);
              const todayMin = stTodayList.reduce((s, e) => s + e.durationMinutes, 0);

              const weekQ = stPastWeekFiltered.reduce((s, e) => s + e.questionsTotal, 0);
              const weekMin = stPastWeekFiltered.reduce((s, e) => s + e.durationMinutes, 0);

              // Group stPastWeekFiltered by dateKey
              const groupedByDate = new Map<string, UnifiedStudyEntry[]>();
              stPastWeekFiltered.forEach(item => {
                const existing = groupedByDate.get(item.dateKey) || [];
                existing.push(item);
                groupedByDate.set(item.dateKey, existing);
              });

              return (
                <div
                  key={st.id}
                  className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 overflow-hidden"
                >
                  {/* Student Header Row */}
                  <div className="px-5 py-3.5 bg-neutral-50/70 dark:bg-neutral-900/40 border-b border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(st.name)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                          <span>{st.name}</span>
                          <span className="text-xs font-normal text-neutral-400 font-mono tabular-nums">
                            · No: {st.studentNumber || st.pin.substring(0, 5)}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                          <span>{st.targetExam || 'YKS'}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            Günlük Hedef: {st.dailyQuestionTarget || 100} Soru
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-amber-500 font-semibold font-mono tabular-nums">
                            <Flame className="w-3 h-3 fill-current" />
                            {st.streak?.count || 0} Gün Seri
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                      <div className="text-right">
                        <div className="text-[11px] text-neutral-400 font-sans">O Gün ({referenceDateKey.slice(8)}.{referenceDateKey.slice(5, 7)})</div>
                        <div className="font-bold text-neutral-900 dark:text-white">
                          {todayQ} soru · {todayMin} dk
                        </div>
                      </div>
                      <div className="h-6 w-px bg-black/10 dark:bg-white/10" />
                      <div className="text-right">
                        <div className="text-[11px] text-neutral-400 font-sans">
                          {focusedHistoryDayKey === 'ALL_7_DAYS'
                            ? 'Önceki 1 Hafta (7 Gün)'
                            : `Seçili Geçmiş (${focusedHistoryDayKey.slice(8)}.${focusedHistoryDayKey.slice(5, 7)})`}
                        </div>
                        <div className="font-bold text-blue-600 dark:text-blue-400">
                          {weekQ} soru · {weekMin} dk
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Two-Column Split: Left = O Gün Yaptıkları | Right = O Günden 1 Hafta Önceki Çalışmaları */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-black/5 dark:divide-white/5">
                    {/* LEFT COLUMN: O GÜN YAPTIKLARI */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>
                            {referenceDateKey === todayKey
                              ? 'Bugün Yaptığı Çalışmalar'
                              : `${formatHumanDate(referenceDateKey, todayKey)} Çalışmaları`}
                          </span>
                        </div>
                        <span className="text-xs font-mono tabular-nums text-neutral-400">
                          {stTodayList.length} kayıt
                        </span>
                      </div>

                      {stTodayList.length === 0 ? (
                        <div className="py-8 text-center text-xs text-neutral-400">
                          Bu gün için henüz tamamlanan çalışma kaydı bulunmuyor.
                        </div>
                      ) : (
                        <div className="divide-y divide-black/5 dark:divide-white/5">
                          {stTodayList.map(item => (
                            <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs">
                              <div className="space-y-0.5 min-w-0">
                                <div className="font-bold text-neutral-900 dark:text-white truncate">
                                  {item.subject} · <span className="font-medium text-neutral-600 dark:text-neutral-300">{item.topic}</span>
                                </div>
                                <div className="text-[11px] text-neutral-500 flex items-center flex-wrap gap-1.5 font-mono tabular-nums">
                                  <span className="font-sans text-neutral-400">{item.categoryLabel}</span>
                                  {item.durationMinutes > 0 && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span>{item.durationMinutes} dk</span>
                                    </>
                                  )}
                                  {item.questionsTotal > 0 && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="text-neutral-800 dark:text-neutral-200 font-semibold">
                                        {item.questionsTotal} soru
                                      </span>
                                    </>
                                  )}
                                  {typeof item.net === 'number' && item.questionsTotal > 0 && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                        {item.correct}D/{item.wrong}Y ({item.net} Net)
                                      </span>
                                    </>
                                  )}
                                </div>
                                {item.note && (
                                  <div className="text-[11px] text-neutral-400 italic truncate">
                                    "{item.note}"
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-mono tabular-nums text-neutral-400">
                                  {item.timeLabel}
                                </span>
                                {renderEntryActions(item)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RIGHT COLUMN: O GÜNDEN 1 HAFTA ÖNCEKİ ÇALIŞMALARI */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>
                            {focusedHistoryDayKey === 'ALL_7_DAYS'
                              ? 'O Günden 1 Hafta Önceki Çalışmaları (Son 7 Gün)'
                              : `${formatHumanDate(focusedHistoryDayKey, todayKey)} Çalışmaları`}
                          </span>
                        </div>
                        <span className="text-xs font-mono tabular-nums text-neutral-400">
                          {stPastWeekFiltered.length} kayıt
                        </span>
                      </div>

                      {stPastWeekFiltered.length === 0 ? (
                        <div className="py-8 text-center text-xs text-neutral-400">
                          Bu tarih aralığında kayıtlı çalışma bulunmuyor.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                          {Array.from(groupedByDate.entries()).map(([dateKey, dayEntries]) => {
                            const dayQ = dayEntries.reduce((s, e) => s + e.questionsTotal, 0);
                            const dayMin = dayEntries.reduce((s, e) => s + e.durationMinutes, 0);
                            return (
                              <div key={dateKey} className="space-y-1.5 pb-2.5 border-b border-black/5 dark:border-white/5 last:border-b-0 last:pb-0">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                                  <span>{formatHumanDate(dateKey, todayKey)}</span>
                                  <span className="font-mono tabular-nums">
                                    {dayQ} soru · {dayMin} dk
                                  </span>
                                </div>
                                <div className="space-y-1.5 pl-2 border-l border-black/10 dark:border-white/10">
                                  {dayEntries.map(item => (
                                    <div key={item.id} className="flex items-start justify-between gap-2 text-xs">
                                      <div className="min-w-0">
                                        <span className="font-semibold text-neutral-900 dark:text-white">
                                          {item.subject}
                                        </span>
                                        <span className="text-neutral-500 dark:text-neutral-400">
                                          {' '}· {item.topic}
                                        </span>
                                        <div className="text-[11px] text-neutral-400 font-mono tabular-nums">
                                          {item.categoryLabel}
                                          {item.durationMinutes > 0 ? ` · ${item.durationMinutes} dk` : ''}
                                          {item.questionsTotal > 0 ? ` · ${item.questionsTotal} soru` : ''}
                                          {typeof item.net === 'number' && item.questionsTotal > 0 ? ` (${item.net} Net)` : ''}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[11px] font-mono tabular-nums text-neutral-400">
                                          {item.timeLabel}
                                        </span>
                                        {renderEntryActions(item)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* MAIN CONTENT: MODE 2 - DAY BY DAY TIMELINE (O GÜN + ÖNCEKİ 7 GÜN) */
        <div className="space-y-4">
          {[referenceDateKey, ...pastSevenDayKeys].map(dKey => {
            const dayItems = allStudyEntries.filter(e => e.dateKey === dKey);
            const dayQ = dayItems.reduce((s, e) => s + e.questionsTotal, 0);
            const dayMin = dayItems.reduce((s, e) => s + e.durationMinutes, 0);
            const isRefDay = dKey === referenceDateKey;
            const isExactOneWeekAgo = dKey === oneWeekAgoExactKey;

            return (
              <div
                key={dKey}
                className={`p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border transition-colors ${
                  isRefDay
                    ? 'border-blue-500/40'
                    : isExactOneWeekAgo
                    ? 'border-indigo-500/40'
                    : 'border-black/5 dark:border-white/5'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <BookOpen className={`w-4 h-4 ${isRefDay ? 'text-blue-500' : 'text-neutral-400'}`} />
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                      {formatHumanDate(dKey, todayKey)}
                    </h3>
                    <span className="text-xs font-mono tabular-nums text-neutral-400">
                      · {dKey}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-neutral-600 dark:text-neutral-300">
                    <span><strong>{dayItems.length}</strong> çalışma</span>
                    <span aria-hidden="true">·</span>
                    <span><strong>{dayQ}</strong> soru</span>
                    <span aria-hidden="true">·</span>
                    <span><strong>{dayMin}</strong> dk</span>
                  </div>
                </div>

                {dayItems.length === 0 ? (
                  <div className="py-4 text-xs text-neutral-400">
                    Bu tarihte kayıtlı çalışma bulunmuyor.
                  </div>
                ) : (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-neutral-400 border-b border-black/5 dark:border-white/5 font-semibold">
                          <th className="py-2 pr-3">Saat</th>
                          <th className="py-2 px-3">Öğrenci</th>
                          <th className="py-2 px-3">Tür</th>
                          <th className="py-2 px-3">Ders & Konu</th>
                          <th className="py-2 px-3 text-right">Süre</th>
                          <th className="py-2 px-3 text-right">Soru / Net</th>
                          <th className="py-2 pl-3 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono tabular-nums">
                        {dayItems.map(item => (
                          <tr key={item.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30">
                            <td className="py-2.5 pr-3 text-neutral-400 whitespace-nowrap">
                              {item.timeLabel}
                            </td>
                            <td className="py-2.5 px-3 font-sans font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                              {item.studentName}
                            </td>
                            <td className="py-2.5 px-3 font-sans text-neutral-500 whitespace-nowrap">
                              {item.categoryLabel}
                            </td>
                            <td className="py-2.5 px-3 font-sans text-neutral-800 dark:text-neutral-200">
                              <span className="font-semibold">{item.subject}</span> · {item.topic}
                            </td>
                            <td className="py-2.5 px-3 text-right text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                              {item.durationMinutes > 0 ? `${item.durationMinutes} dk` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-neutral-900 dark:text-white whitespace-nowrap">
                              {item.questionsTotal > 0
                                ? `${item.questionsTotal} soru${typeof item.net === 'number' ? ` (${item.net} Net)` : ''}`
                                : '-'}
                            </td>
                            <td className="py-2.5 pl-3 text-right whitespace-nowrap font-sans">
                              {renderEntryActions(item)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Soru / Çalışma Kaydı Düzenleme Modalı */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5 dark:border-white/5">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Çalışma & Soru Kaydını Düzenle
                </h3>
                <p className="text-xs text-neutral-500">
                  {editingEntry.studentName} • {editingEntry.categoryLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEntryChanges} className="space-y-3.5 text-xs">
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

              {editingEntry.category !== 'homework' && (
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
                      min={0}
                      max={720}
                      value={editDurationMinutes}
                      onChange={e => setEditDurationMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-20 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/15 text-center font-extrabold font-mono text-sm text-blue-600 dark:text-blue-400 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-neutral-500">dk</span>
                  </div>
                </div>
              )}

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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-xl text-neutral-500 font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
