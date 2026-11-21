import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Play,
  CheckCircle2,
  Plus,
  FileSpreadsheet,
  Printer,
  Copy,
  BookOpen,
  BookmarkPlus,
  Layers,
  Trash2,
  Target,
  Edit2,
  Sparkles,
  ChevronRight,
  Filter,
  User,
  Users,
  Grid3X3,
  ListFilter,
  AlertCircle,
  Minus,
  Upload,
  Download,
  FileCode,
  Check,
  Circle,
  ClipboardPaste,
  Palette,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ScheduleItem } from '../../types';
import { exportScheduleToExcel, copyScheduleForGoogleSheets, DAY_NAMES, getSubjectColor } from '../../utils/excelExport';
import { BOX_THEMES, getActiveBoxTheme } from '../theme/ThemeCustomizerModal';
import { LeaderboardCard } from '../leaderboard/LeaderboardCard';
import { normalizeSubjectName } from '../../constants/subjects';

const DAYS = [
  { id: 0, label: 'Tüm Hafta' },
  { id: 1, label: 'Pazartesi' },
  { id: 2, label: 'Salı' },
  { id: 3, label: 'Çarşamba' },
  { id: 4, label: 'Perşembe' },
  { id: 5, label: 'Cuma' },
  { id: 6, label: 'Cumartesi' },
  { id: 7, label: 'Pazar' },
];

const SCHEDULE_WEEK_MEMORY_KEY = 'akademi_takip_firebase_v1_schedule_week_memory';

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

interface CalendarWeekBounds {
  mondayKey: string;
  weekEpochIndex: number;
  dateRangeLabel: string;
  nextMondayLabel: string;
}

function getCalendarWeekBounds(now: Date = new Date()): CalendarWeekBounds {
  const localNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = localNow.getDay() === 0 ? 7 : localNow.getDay(); // 1 = Pazartesi ... 7 = Pazar
  const mondayDate = new Date(localNow);
  mondayDate.setDate(localNow.getDate() - (dayOfWeek - 1));
  mondayDate.setHours(0, 0, 0, 0);

  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);

  const nextMondayDate = new Date(mondayDate);
  nextMondayDate.setDate(mondayDate.getDate() + 7);

  const y = mondayDate.getFullYear();
  const m = String(mondayDate.getMonth() + 1).padStart(2, '0');
  const d = String(mondayDate.getDate()).padStart(2, '0');
  const mondayKey = `${y}-${m}-${d}`;

  // Epoch Monday: 2024-01-01 00:00 local
  const epochMonday = new Date(2024, 0, 1, 0, 0, 0, 0);
  const weekEpochIndex = Math.round((mondayDate.getTime() - epochMonday.getTime()) / (7 * 86400000));

  const fmtShort = (dt: Date) =>
    dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });

  return {
    mondayKey,
    weekEpochIndex,
    dateRangeLabel: `${fmtShort(mondayDate)} Pzt – ${fmtShort(sundayDate)} Paz`,
    nextMondayLabel: `${fmtShort(sundayDate)} Pazar 23:59 → ${fmtShort(nextMondayDate)} Pazartesi 00:00`,
  };
}

function resolveRememberedOrAutoWeek(bounds: CalendarWeekBounds): {
  selectedWeek: 1 | 2;
  activeCycleWeek: 1 | 2;
} {
  try {
    const raw = localStorage.getItem(SCHEDULE_WEEK_MEMORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        mondayKey?: string;
        weekEpochIndex?: number;
        activeWeek?: 1 | 2;
        selectedWeek?: 1 | 2;
      };
      if (parsed && (parsed.activeWeek === 1 || parsed.activeWeek === 2)) {
        if (parsed.mondayKey === bounds.mondayKey) {
          // Same Monday-Sunday calendar week: remember exact week chosen by user
          const remembered = parsed.selectedWeek === 1 || parsed.selectedWeek === 2
            ? parsed.selectedWeek
            : parsed.activeWeek;
          return {
            selectedWeek: remembered,
            activeCycleWeek: remembered,
          };
        }
        // Sunday night -> Monday 00:00 transition occurred! Advance week automatically
        const prevIdx = typeof parsed.weekEpochIndex === 'number'
          ? parsed.weekEpochIndex
          : bounds.weekEpochIndex - 1;
        const diffWeeks = Math.abs(bounds.weekEpochIndex - prevIdx);
        const baseWeek = parsed.selectedWeek || parsed.activeWeek;
        const nextWeek: 1 | 2 = diffWeeks % 2 === 1 ? (baseWeek === 1 ? 2 : 1) : baseWeek;
        localStorage.setItem(
          SCHEDULE_WEEK_MEMORY_KEY,
          JSON.stringify({
            mondayKey: bounds.mondayKey,
            weekEpochIndex: bounds.weekEpochIndex,
            activeWeek: nextWeek,
            selectedWeek: nextWeek,
          })
        );
        return {
          selectedWeek: nextWeek,
          activeCycleWeek: nextWeek,
        };
      }
    }
  } catch {}

  const autoWeek: 1 | 2 = Math.abs(bounds.weekEpochIndex) % 2 === 0 ? 1 : 2;
  try {
    localStorage.setItem(
      SCHEDULE_WEEK_MEMORY_KEY,
      JSON.stringify({
        mondayKey: bounds.mondayKey,
        weekEpochIndex: bounds.weekEpochIndex,
        activeWeek: autoWeek,
        selectedWeek: autoWeek,
      })
    );
  } catch {}
  return {
    selectedWeek: autoWeek,
    activeCycleWeek: autoWeek,
  };
}

interface ScheduleViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onNavigateTab }) => {
  const {
    role,
    currentStudent,
    currentStudentId,
    setCurrentStudentId,
    students,
    schedules,
    addScheduleItem,
    updateScheduleItem,
    toggleScheduleItemCompletion,
    deleteScheduleItem,
    templates,
    addTemplate,
    applyTemplateToStudent,
    subjects,
    addSubjectVariable,
    startTimer,
    targetDaysLeft,
    boxTheme,
    setBoxTheme
  } = useApp();

  const selectedBoxTheme = getActiveBoxTheme(boxTheme);
  const [isBoxColorPickerOpen, setIsBoxColorPickerOpen] = useState(false);
  const [colorPickerTargetItem, setColorPickerTargetItem] = useState<ScheduleItem | null>(null);

  // Today Day of Week computation (1 = Pazartesi, 2 = Salı, ..., 7 = Pazar)
  const [weekBounds, setWeekBounds] = useState<CalendarWeekBounds>(() => getCalendarWeekBounds());
  const todayDayOfWeek = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  }, [weekBounds.mondayKey]);
  const todayName = DAY_NAMES[todayDayOfWeek];

  const [selectedDay, setSelectedDay] = useState<number>(0); // 0 = all
  const [selectedWeek, setSelectedWeekState] = useState<1 | 2>(() => {
    return resolveRememberedOrAutoWeek(getCalendarWeekBounds()).selectedWeek;
  });
  const [activeCycleWeek, setActiveCycleWeek] = useState<1 | 2>(() => {
    return resolveRememberedOrAutoWeek(getCalendarWeekBounds()).activeCycleWeek;
  });

  const setSelectedWeek = (week: 1 | 2) => {
    const currentBounds = getCalendarWeekBounds();
    setWeekBounds(currentBounds);
    setSelectedWeekState(week);
    setActiveCycleWeek(week);
    try {
      localStorage.setItem(
        SCHEDULE_WEEK_MEMORY_KEY,
        JSON.stringify({
          mondayKey: currentBounds.mondayKey,
          weekEpochIndex: currentBounds.weekEpochIndex,
          activeWeek: week,
          selectedWeek: week,
        })
      );
    } catch {}
  };

  // Watch for Sunday 23:59 -> Monday 00:00 transition in real time and sync remembered week
  React.useEffect(() => {
    const checkWeekTransition = () => {
      const freshBounds = getCalendarWeekBounds();
      const resolved = resolveRememberedOrAutoWeek(freshBounds);
      setWeekBounds(prev => (prev.mondayKey !== freshBounds.mondayKey ? freshBounds : prev));
      setSelectedWeekState(prev => (prev !== resolved.selectedWeek ? resolved.selectedWeek : prev));
      setActiveCycleWeek(prev => (prev !== resolved.activeCycleWeek ? resolved.activeCycleWeek : prev));
    };

    checkWeekTransition();
    const timer = setInterval(checkWeekTransition, 15000);
    window.addEventListener('focus', checkWeekTransition);
    document.addEventListener('visibilitychange', checkWeekTransition);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', checkWeekTransition);
      document.removeEventListener('visibilitychange', checkWeekTransition);
    };
  }, []);

  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix'); // Default: Dikey A4 Oturum Matrisi
  const [completionFilter, setCompletionFilter] = useState<'all' | 'completed' | 'pending'>('all'); // Oturum tamamlama filtresi
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isApplyTemplateModalOpen, setIsApplyTemplateModalOpen] = useState(false);
  const [copiedAlert, setCopiedAlert] = useState(false);
  const [jsonNotice, setJsonNotice] = useState<string | null>(null);
  const [copiedSession, setCopiedSession] = useState<{
    subject: string;
    topic: string;
    timeRange?: string;
    sourceBook?: string;
    targetType?: 'question' | 'duration';
    targetValue?: number;
    teacherNote?: string;
    customColor?: string;
  } | null>(null);
  const [clipboardNotice, setClipboardNotice] = useState<string | null>(null);

  // New item form state (with sessionNumber and optional time)
  const [targetStudentId, setTargetStudentId] = useState<string>(currentStudentId || (students[0]?.id || ''));
  const [newItemWeek, setNewItemWeek] = useState<'1' | '2' | 'both'>('1');
  const [newItemDay, setNewItemDay] = useState<number>(1);
  const [newItemSession, setNewItemSession] = useState<number>(1);
  const [newItemSubject, setNewItemSubject] = useState<string>('Matematik');
  const [isAddingCustomSubject, setIsAddingCustomSubject] = useState<boolean>(false);
  const [customSubjectDraft, setCustomSubjectDraft] = useState<string>('');
  const [newItemTopic, setNewItemTopic] = useState<string>('');
  const [newItemTime, setNewItemTime] = useState<string>(''); // Optional!
  const [newItemSource, setNewItemSource] = useState<string>('');
  const [newItemTargetType, setNewItemTargetType] = useState<'question' | 'duration'>('question');
  const [newItemTargetVal, setNewItemTargetVal] = useState<number>(40);
  const [newItemNote, setNewItemNote] = useState<string>('');
  const [newItemHue, setNewItemHue] = useState<number>(215);
  const [newItemColor, setNewItemColor] = useState<string>(() => selectedBoxTheme.accentColor || '#3B82F6');
  const [editItemHue, setEditItemHue] = useState<number>(215);

  // Template form state
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Oturum sayısı yönetimi (1. Oturum varsayılan açık, 2, 3, 4, 5... isteğe göre eklenir)
  const [activeSessionCount, setActiveSessionCount] = useState<number>(1);

  // Keep target student in sync with currentStudentId
  React.useEffect(() => {
    if (currentStudentId) {
      setTargetStudentId(currentStudentId);
    } else if (students.length > 0) {
      setTargetStudentId(students[0].id);
    }
  }, [currentStudentId, students]);

  // Active student object
  const activeStudent = useMemo(() => {
    return students.find(s => s.id === (currentStudentId || targetStudentId)) || currentStudent;
  }, [students, currentStudentId, targetStudentId, currentStudent]);

  // Filter schedules for current student
  const studentSchedules = useMemo(() => {
    if (!activeStudent) return [];
    return schedules
      .filter(s => s.studentId === activeStudent.id)
      .sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return (a.sessionNumber || 0) - (b.sessionNumber || 0);
      });
  }, [schedules, activeStudent]);

  // Filter schedules by selected week (1 or 2)
  const currentWeekSchedules = useMemo(() => {
    return studentSchedules.filter(s => !s.weekNumber || s.weekNumber === selectedWeek);
  }, [studentSchedules, selectedWeek]);

  // If student has existing items with higher session numbers, auto-expand to accommodate them
  React.useEffect(() => {
    let max = 1;
    currentWeekSchedules.forEach(item => {
      if (item.sessionNumber && item.sessionNumber > max) {
        max = item.sessionNumber;
      }
    });
    setActiveSessionCount(prev => Math.max(prev, max));
  }, [currentWeekSchedules]);

  // Filtered for day card view
  const displaySchedules = useMemo(() => {
    if (selectedDay === 0) return currentWeekSchedules;
    return currentWeekSchedules.filter(s => s.dayOfWeek === selectedDay);
  }, [currentWeekSchedules, selectedDay]);

  // Effective visible session count: exactly user's activeSessionCount (minimum 1)
  const visibleSessionsCount = useMemo(() => {
    return Math.max(1, activeSessionCount);
  }, [activeSessionCount]);

  const handleAddSessionColumn = () => {
    setActiveSessionCount(prev => prev + 1);
  };

  const handleRemoveSessionColumn = () => {
    if (activeSessionCount <= 1) return;
    setActiveSessionCount(prev => Math.max(1, prev - 1));
  };

  // Overall weekly metrics
  const stats = useMemo(() => {
    const total = studentSchedules.length;
    const completed = studentSchedules.filter(s => s.status === 'completed').length;
    const totalQuestions = studentSchedules.reduce((acc, curr) => {
      if (curr.solvedQuestions) {
        return acc + curr.solvedQuestions.correct + curr.solvedQuestions.wrong + curr.solvedQuestions.blank;
      }
      return acc;
    }, 0);
    const totalMinutes = studentSchedules.reduce((acc, curr) => acc + (curr.actualDurationMinutes || 0), 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, totalQuestions, totalMinutes, completionRate };
  }, [studentSchedules]);

  // Selected week day-by-day session completion breakdown
  const weekDayBreakdown = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7].map(day => {
      const dayItems = currentWeekSchedules.filter(s => s.dayOfWeek === day);
      const totalCount = dayItems.length;
      const completedCount = dayItems.filter(s => s.status === 'completed').length;
      return {
        day,
        name: DAY_NAMES[day],
        isToday: day === todayDayOfWeek,
        totalCount,
        completedCount,
        isAllDone: totalCount > 0 && completedCount === totalCount,
        isPartial: completedCount > 0 && completedCount < totalCount,
      };
    });
  }, [currentWeekSchedules, todayDayOfWeek]);

  // Current week specific completion metrics
  const currentWeekStats = useMemo(() => {
    const total = currentWeekSchedules.length;
    const completed = currentWeekSchedules.filter(s => s.status === 'completed').length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, rate };
  }, [currentWeekSchedules]);

  // Open modal with specific day and session prefilled
  const handleOpenAddForSlot = (day: number, session: number) => {
    setNewItemWeek(String(selectedWeek) as '1' | '2');
    setNewItemDay(day);
    setNewItemSession(session);
    setNewItemTopic('');
    setNewItemTime('');
    setNewItemSource('');
    setNewItemNote('');
    setIsAddModalOpen(true);
  };

  // Copy session to memory
  const handleCopySession = (item: ScheduleItem) => {
    setCopiedSession({
      subject: item.subject,
      topic: item.topic,
      timeRange: item.timeRange,
      sourceBook: item.sourceBook,
      targetType: item.targetType,
      targetValue: item.targetValue,
      teacherNote: item.teacherNote,
      customColor: item.customColor,
    });
    setClipboardNotice(`"${item.subject} • ${item.topic || 'Ders'}" oturumu kopyalandı! İstediğiniz gün veya oturumdaki "Yapıştır" butonuna tıklayarak aktarabilirsiniz.`);
    setTimeout(() => setClipboardNotice(null), 5000);
  };

  // Paste copied session into target day and session
  const handlePasteSession = async (targetDay: number, targetSessionNumber?: number) => {
    if (!copiedSession || !activeStudent) return;

    let sessionNum = targetSessionNumber;
    if (!sessionNum) {
      const dayItems = currentWeekSchedules.filter(s => s.dayOfWeek === targetDay);
      sessionNum = dayItems.length + 1;
    }

    await addScheduleItem({
      studentId: activeStudent.id,
      weekNumber: selectedWeek,
      dayOfWeek: targetDay,
      sessionNumber: sessionNum,
      subject: copiedSession.subject,
      topic: copiedSession.topic,
      timeRange: copiedSession.timeRange || '',
      sourceBook: copiedSession.sourceBook || '',
      targetType: copiedSession.targetType || 'question',
      targetValue: copiedSession.targetValue || 40,
      actualDurationMinutes: 0,
      teacherNote: copiedSession.teacherNote || '',
      customColor: copiedSession.customColor,
      status: 'pending',
    });

    setClipboardNotice(`"${copiedSession.subject}" oturumu ${DAY_NAMES[targetDay]} ${sessionNum}. Oturuma başarıyla yapıştırıldı!`);
    setTimeout(() => setClipboardNotice(null), 3500);
  };

  const handleClearCopiedSession = () => {
    setCopiedSession(null);
    setClipboardNotice(null);
  };

  const handleApplyItemColor = async (item: ScheduleItem, hexColor: string, scope: 'single' | 'subject' | 'all') => {
    if (scope === 'single') {
      await updateScheduleItem(item.id, { customColor: hexColor });
    } else if (scope === 'subject') {
      const sameSubjectItems = studentSchedules.filter(
        s => normalizeSubjectName(s.subject).toLocaleLowerCase('tr-TR') === normalizeSubjectName(item.subject).toLocaleLowerCase('tr-TR')
      );
      for (const it of sameSubjectItems) {
        await updateScheduleItem(it.id, { customColor: hexColor });
      }
    } else if (scope === 'all') {
      setBoxTheme(hexColor);
      for (const it of studentSchedules) {
        await updateScheduleItem(it.id, { customColor: hexColor });
      }
    }
    setColorPickerTargetItem(null);
  };

  // If no student exists at all
  if (students.length === 0) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 text-center max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-4 font-bold">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
          Haftalık Çalışma Programı
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
          Henüz kayıtlı bir öğrenci bulunmuyor. Haftalık oturum programı oluşturmak ve ders eklemek için lütfen önce bir öğrenci kaydı oluşturun.
        </p>
        <button
          onClick={() => onNavigateTab ? onNavigateTab('users') : undefined}
          className="px-6 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Öğrenci Ekle / Yönetim Paneline Git</span>
        </button>
      </div>
    );
  }

  const handleExportExcel = () => {
    if (!activeStudent) return;
    exportScheduleToExcel(currentWeekSchedules, activeStudent, visibleSessionsCount);
  };

  const handleCopySheets = async () => {
    if (!activeStudent) return;
    const success = await copyScheduleForGoogleSheets(currentWeekSchedules, activeStudent.name, visibleSessionsCount);
    if (success) {
      setCopiedAlert(true);
      setTimeout(() => setCopiedAlert(false), 2500);
    }
  };

  const handleExportJson = () => {
    if (!activeStudent || studentSchedules.length === 0) {
      setJsonNotice('Dışa aktarılacak herhangi bir ders programı bulunamadı.');
      setTimeout(() => setJsonNotice(null), 3000);
      return;
    }

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      studentName: activeStudent.name,
      targetExam: activeStudent.targetExam || 'YKS',
      totalItems: studentSchedules.length,
      items: studentSchedules.map(({ id, studentId, ...rest }) => ({
        ...rest,
        weekNumber: rest.weekNumber || 1
      }))
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeStudent.name.replace(/\s+/g, '_')}_Ders_Programi.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setJsonNotice('Ders programı şablonu .json olarak başarıyla dışa aktarıldı!');
    setTimeout(() => setJsonNotice(null), 3000);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeStudent) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const rawItems: any[] = Array.isArray(parsed) ? parsed : (parsed.items || []);

        if (!Array.isArray(rawItems) || rawItems.length === 0) {
          setJsonNotice('Geçersiz şablon dosyası veya dosya içerisinde ders bulunamadı.');
          setTimeout(() => setJsonNotice(null), 3500);
          return;
        }

        let importedCount = 0;
        rawItems.forEach((item: any) => {
          if (item.subject && item.dayOfWeek) {
            addScheduleItem({
              studentId: activeStudent.id,
              weekNumber: item.weekNumber === 2 ? 2 : 1,
              dayOfWeek: Number(item.dayOfWeek) || 1,
              sessionNumber: Number(item.sessionNumber) || 1,
              timeRange: item.timeRange || undefined,
              subject: String(item.subject).trim(),
              topic: String(item.topic || '').trim() || 'Genel Tekrar',
              sourceBook: item.sourceBook || undefined,
              targetType: item.targetType === 'duration' ? 'duration' : 'question',
              targetValue: Number(item.targetValue) || 40,
              actualDurationMinutes: 0,
              teacherNote: item.teacherNote || undefined,
              status: 'pending',
            });
            importedCount++;
          }
        });

        setJsonNotice(`JSON şablonundan ${importedCount} adet ders başarıyla içe aktarıldı!`);
        setTimeout(() => setJsonNotice(null), 4000);
      } catch (err) {
        setJsonNotice('JSON dosyası okunurken hata oluştu. Lütfen geçerli bir JSON şablonu yükleyin.');
        setTimeout(() => setJsonNotice(null), 3500);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePrint = () => {
    setViewMode('matrix');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCreateScheduleItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;

    const cleanSubject = normalizeSubjectName(newItemSubject.trim() || 'Matematik');
    addSubjectVariable(cleanSubject);
    const cleanTopic = newItemTopic.trim() || 'Konu Çalışması';
    const sessionNum = Number(newItemSession) || 1;
    const weeksToCreate = newItemWeek === 'both' ? [1, 2] : [Number(newItemWeek) as 1 | 2];

    if (sessionNum > activeSessionCount) {
      setActiveSessionCount(sessionNum);
    }

    for (const w of weeksToCreate) {
      await addScheduleItem({
        studentId: activeStudent.id,
        weekNumber: w,
        dayOfWeek: Number(newItemDay),
        sessionNumber: sessionNum,
        timeRange: newItemTime.trim() || undefined,
        subject: cleanSubject,
        topic: cleanTopic,
        sourceBook: newItemSource.trim() || undefined,
        targetType: newItemTargetType,
        targetValue: Number(newItemTargetVal) || 40,
        actualDurationMinutes: 0,
        teacherNote: newItemNote.trim() || undefined,
        customColor: newItemColor || selectedBoxTheme.accentColor,
        status: 'pending',
      });
    }

    setIsAddModalOpen(false);
    setNewItemTopic('');
    setNewItemTime('');
    setNewItemSource('');
    setNewItemNote('');
    setJsonNotice(`${activeStudent.name} için ${DAY_NAMES[Number(newItemDay)]} ${sessionNum}. Oturum (${cleanSubject}) seçilen kutucuk rengiyle eklendi.`);
    setTimeout(() => setJsonNotice(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto a4-portrait-container">
      {/* Top Bar with Title, Student Switcher, Add Lesson & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-black/5 dark:border-white/5 no-print">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Haftalık Oturum Programı
            </h1>

            {/* Quick Student Switcher Dropdown */}
            {/* Student Switcher / Badge (Role-aware) */}
            {role === 'teacher' && students.length > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-neutral-200/80 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-neutral-500 dark:text-neutral-400 font-medium">Öğrenci:</span>
                <select
                  value={currentStudentId || activeStudent?.id}
                  onChange={e => setCurrentStudentId(e.target.value)}
                  className="bg-transparent font-bold text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {students.map(st => (
                    <option key={st.id} value={st.id} className="text-neutral-900 dark:text-white bg-white dark:bg-neutral-900">
                      {st.name} ({st.pin})
                    </option>
                  ))}
                </select>
              </div>
            ) : activeStudent ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold">
                <User className="w-3.5 h-3.5" />
                <span>{activeStudent.name} (PIN: {activeStudent.pin})</span>
              </div>
            ) : null}

            {/* Today Indicator Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-xs font-extrabold shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>Bugün: {todayName}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-mono">{todayDayOfWeek}. Gün</span>
            </div>

            {/* Active Week Indicator Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-extrabold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Şu Anki Hafta: {selectedWeek}. Hafta</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-mono">
                {weekBounds.dateRangeLabel}
              </span>
            </div>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Şu an <strong>{selectedWeek}. Hafta ({weekBounds.dateRangeLabel})</strong> programı görüntüleniyor. Her Pazar gecesini Pazartesiye bağlayan gece (00:00) hafta otomatik olarak değişir ve seçili haftanız hatırlanır.
          </p>
        </div>

        {/* Action Buttons: Add Lesson, View Switch, Excel, Print */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Prominent Add Lesson Button for Active Student */}
          <button
            onClick={() => {
              setNewItemWeek(String(selectedWeek) as '1' | '2');
              setNewItemDay(1);
              const dayItems = studentSchedules.filter(s => s.dayOfWeek === 1 && (!s.weekNumber || s.weekNumber === selectedWeek));
              setNewItemSession(dayItems.length + 1);
              setIsAddModalOpen(true);
            }}
            style={{
              backgroundColor: selectedBoxTheme.accentColor,
              boxShadow: `0 4px 14px 0 ${selectedBoxTheme.accentColor}35`
            }}
            className="px-4 py-2.5 rounded-2xl text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Seçili Öğrenciye Oturum Ekle"
          >
            <Plus className="w-4 h-4" />
            <span>Oturum Ekle</span>
          </button>

          {/* View Mode Toggle: Matrix vs Cards */}
          <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5">
            <button
              onClick={() => setViewMode('matrix')}
              style={viewMode === 'matrix' ? { color: selectedBoxTheme.accentColor } : undefined}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-[#1C1C1E] shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Dikey A4 Oturum Matrisi (1. Sütun Günler, Üst Satır Oturumlar)"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Dikey A4 Matris</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              style={viewMode === 'cards' ? { color: selectedBoxTheme.accentColor } : undefined}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-[#1C1C1E] shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Günlük Detaylı Kartlar"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Kart Görünümü</span>
            </button>
          </div>

          {/* JSON Template Export */}
          <button
            onClick={handleExportJson}
            className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 hover:border-violet-500 text-violet-600 dark:text-violet-400 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Tüm 2 Haftalık Programı .json Şablonu Olarak İndir"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">JSON Dışa Aktar</span>
          </button>

          {/* JSON Template Import */}
          <label
            className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 hover:border-violet-500 text-violet-600 dark:text-violet-400 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title=".json Şablon Dosyasından Programı İçe Aktar"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">JSON İçe Aktar</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          {/* Excel Export Button */}
          <button
            onClick={handleExportExcel}
            className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Excel Formatında İndir (.xlsx - 1. Sütun Günler, Üst Satır Oturumlar)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          {/* Print / Save PDF Button (A4 Portrait) */}
          <button
            onClick={handlePrint}
            className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 hover:border-blue-500 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Dikey A4 Olarak Yazdır / PDF Kaydet"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Dikey A4</span>
          </button>

          {/* Copy Google Sheets */}
          <button
            onClick={handleCopySheets}
            className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 hover:border-blue-500 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Google E-Tablolar İçin Kopyala"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {jsonNotice && (
        <div className="p-3 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-700 dark:text-violet-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in no-print">
          <FileCode className="w-4 h-4 text-violet-500" />
          <span>{jsonNotice}</span>
        </div>
      )}

      {copiedAlert && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in no-print">
          <CheckCircle2 className="w-4 h-4" />
          <span>Haftalık oturum matrisi panoya kopyalandı! Google E-Tablolar sayfasına (Ctrl+V) ile yapıştırabilirsiniz.</span>
        </div>
      )}

      {clipboardNotice && (
        <div className="p-3 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in no-print">
          <div className="flex items-center gap-2">
            <ClipboardPaste className="w-4 h-4 text-blue-500" />
            <span>{clipboardNotice}</span>
          </div>
          <button
            onClick={() => setClipboardNotice(null)}
            className="p-1 hover:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {copiedSession && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs shrink-0">
              <ClipboardPaste className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-black tracking-wide flex items-center gap-1.5 flex-wrap">
                <span>Kopyalanan Oturum:</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-md font-mono">{copiedSession.subject} • {copiedSession.topic || 'Ders'}</span>
              </div>
              <p className="text-[11px] text-white/80 mt-0.5">
                İstediğiniz günün boş oturumundaki veya gün kenarındaki "Yapıştır" simgesine tıklayarak bu oturumu aktarabilirsiniz.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handlePasteSession(todayDayOfWeek)}
              className="px-3 py-1.5 rounded-xl bg-white text-blue-700 font-extrabold text-xs shadow-xs hover:bg-neutral-100 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-blue-600" />
              <span>Bugüne ({todayName}) Yapıştır</span>
            </button>
            <button
              onClick={handleClearCopiedSession}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Kopyalamayı İptal Et / Panoyu Temizle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Summary Mini Bar (No print) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 text-center">
          <div className="text-[10px] text-neutral-400 font-semibold">Toplam Ders / Oturum</div>
          <div className="text-lg font-extrabold text-neutral-900 dark:text-white font-mono mt-0.5">
            {stats.total} Oturum
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 text-center">
          <div className="text-[10px] text-neutral-400 font-semibold">Tamamlanan</div>
          <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            {stats.completed} (%{stats.completionRate})
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 text-center">
          <div className="text-[10px] text-neutral-400 font-semibold">Çözülen Toplam Soru</div>
          <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
            {stats.totalQuestions} Soru
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 text-center">
          <div className="text-[10px] text-neutral-400 font-semibold">Sayaçla Çalışılan Süre</div>
          <div className="text-lg font-extrabold text-indigo-500 font-mono mt-0.5">
            {Math.floor(stats.totalMinutes / 60)}s {stats.totalMinutes % 60}d
          </div>
        </div>
      </div>

      {/* Haftalık Oturum Takip Paneli (Öğretmen ve Öğrenci için Günlük Takip ve Tamamlama Durumu) */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-xs space-y-3.5 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: `${selectedBoxTheme.accentColor}18`, color: selectedBoxTheme.accentColor }}
              className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold shrink-0"
            >
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                  {selectedWeek}. Hafta Oturum Takip Çizelgesi ({weekBounds.dateRangeLabel})
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  Aktif Program: {selectedWeek}. Hafta
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {role === 'teacher' ? 'Öğretmen Takip Görünümü' : 'Öğrenci Program Takibi'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {activeStudent?.name} için {selectedWeek}. Hafta oturumları • Pazar gecesi Pazartesi 00:00'da otomatik olarak {selectedWeek === 1 ? '2. Hafta' : '1. Hafta'} programına geçer.
              </p>
            </div>
          </div>

          {/* Completion Ratio Pill & Filter Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-black/5 dark:border-white/5 text-xs font-bold">
              <span className="text-neutral-500 dark:text-neutral-400">Bu Hafta:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                {currentWeekStats.completed}/{currentWeekStats.total} Tamamlandı
              </span>
              <span className="text-neutral-400 font-mono">(%{currentWeekStats.rate})</span>
            </div>

            {/* Completion Filter Tabs */}
            <div className="flex p-0.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCompletionFilter('all')}
                className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                  completionFilter === 'all'
                    ? 'bg-white dark:bg-[#1C1C1E] text-neutral-900 dark:text-white shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Tümü ({currentWeekStats.total})
              </button>
              <button
                type="button"
                onClick={() => setCompletionFilter('completed')}
                className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                  completionFilter === 'completed'
                    ? 'bg-emerald-500 text-white shadow-2xs'
                    : 'text-emerald-600 hover:text-emerald-700'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Yapılanlar ({currentWeekStats.completed})</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletionFilter('pending')}
                className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                  completionFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-neutral-500 hover:text-amber-600'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Bekleyenler ({currentWeekStats.pending})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-emerald-500"
              style={{ width: `${currentWeekStats.rate}%` }}
            />
          </div>
        </div>

        {/* Day-by-Day Quick Tracker Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
          {weekDayBreakdown.map(wb => (
            <button
              key={wb.day}
              type="button"
              onClick={() => setSelectedDay(wb.day)}
              className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                wb.isToday
                  ? 'bg-blue-500/[0.08] dark:bg-blue-500/[0.15] border-blue-500/40 shadow-2xs ring-1 ring-blue-500/30'
                  : selectedDay === wb.day
                  ? 'bg-neutral-100 dark:bg-neutral-800 border-black/15 dark:border-white/15'
                  : 'bg-neutral-50/60 dark:bg-neutral-900/40 border-black/5 dark:border-white/5 hover:border-black/15'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={`font-bold ${wb.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-900 dark:text-white'}`}>
                  {wb.name.substring(0, 3)}
                </span>
                {wb.isToday && (
                  <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-blue-600 text-white">
                    Bugün
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-500">
                  {wb.totalCount > 0 ? `${wb.totalCount} Oturum` : 'Boş'}
                </span>
                {wb.totalCount > 0 && (
                  <span className={`font-bold text-[10px] px-1.5 py-0.2 rounded ${
                    wb.isAllDone
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold'
                      : wb.isPartial
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-400'
                  }`}>
                    {wb.completedCount}/{wb.totalCount} {wb.isAllDone ? '✓' : ''}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="print-only hidden p-4 mb-4 border-b-2 border-neutral-900">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-300">
          <div>
            <h2 className="text-xl font-black tracking-tight text-neutral-900">
              AKADEMİ TAKİP • HAFTALIK DERS VE ÇALIŞMA PROGRAMI
            </h2>
            <p className="text-[10px] text-neutral-500 mt-0.5 font-medium">
              Kişiye Özel Koçluk ve Entegre Oturum Takip Çizelgesi
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono font-bold text-neutral-700 block">
              Tarih: {new Date().toLocaleDateString('tr-TR')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs mt-2 text-neutral-900 font-semibold">
          <div>Öğrenci: <strong className="font-bold">{activeStudent?.name}</strong></div>
          <div>Öğrenci No: <strong className="font-mono">{activeStudent?.studentNumber || activeStudent?.pin}</strong></div>
          <div>Hedef Sınav: <strong className="font-bold">{activeStudent?.targetExam || 'YKS'} ({selectedWeek}. Hafta)</strong></div>
        </div>
      </div>

      {/* VIEW 1: DİKEY A4 OTURUM MATRİSİ (1. SÜTUN GÜNLER, ÜST SATIR 1 2 3... OTURUMLAR) */}
      {viewMode === 'matrix' ? (
        <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 bg-neutral-50 dark:bg-neutral-900/60 border-b border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-3 flex-wrap">
              {/* 1. Hafta / 2. Hafta Butonları - Aktif Hafta Göstergeli ve Hafızalı */}
              <div className="flex p-1 rounded-2xl bg-neutral-200/80 dark:bg-neutral-800 border border-black/10 dark:border-white/10 shadow-xs">
                <button
                  type="button"
                  onClick={() => setSelectedWeek(1)}
                  style={selectedWeek === 1 ? { backgroundColor: selectedBoxTheme.accentColor, color: '#FFFFFF' } : undefined}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedWeek === 1
                      ? 'shadow-xs scale-[1.02]'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="1. Hafta Oturum Programını Görüntüle ve Bu Hafta İçin Hatırla"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>1. Hafta</span>
                  {selectedWeek === 1 && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/25 text-white font-black uppercase">
                      Aktif
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWeek(2)}
                  style={selectedWeek === 2 ? { backgroundColor: selectedBoxTheme.accentColor, color: '#FFFFFF' } : undefined}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedWeek === 2
                      ? 'shadow-xs scale-[1.02]'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="2. Hafta Oturum Programını Görüntüle ve Bu Hafta İçin Hatırla"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>2. Hafta</span>
                  {selectedWeek === 2 && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/25 text-white font-black uppercase">
                      Aktif
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Grid3X3 className="w-4 h-4 text-blue-500" />
                <span className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white">
                  Şu An: {selectedWeek}. Hafta Programı ({weekBounds.dateRangeLabel})
                </span>
              </div>
            </div>

            {/* Oturum Sayısını Dinamik Artırma / Azaltma Butonları */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10 rounded-2xl p-1 shadow-2xs">
                <button
                  onClick={handleRemoveSessionColumn}
                  disabled={visibleSessionsCount <= 1}
                  className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                  title="Son Oturumu Kapat / Kaldır"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="px-3 py-0.5 text-xs font-black font-mono text-neutral-900 dark:text-white min-w-[70px] text-center">
                  {visibleSessionsCount} Oturum
                </div>
                <button
                  onClick={handleAddSessionColumn}
                  className="p-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                  title={`${visibleSessionsCount + 1}. Oturumu Ekle`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleAddSessionColumn}
                className="px-3 py-2 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                title={`${visibleSessionsCount + 1}. Oturumu Programa Ekle`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ {visibleSessionsCount + 1}. Oturumu Ekle</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border-b border-black/10 dark:border-white/10">
                  <th className="p-3 font-extrabold w-28 text-center shrink-0 border-r border-black/5 dark:border-white/5">
                    Günler
                  </th>
                  {Array.from({ length: visibleSessionsCount }).map((_, idx) => (
                    <th key={idx} className="p-3 font-extrabold min-w-[150px] border-r border-black/5 dark:border-white/5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span>{idx + 1}. Oturum</span>
                        {idx + 1 === visibleSessionsCount && visibleSessionsCount > 1 && (
                          <button
                            onClick={handleRemoveSessionColumn}
                            className="p-0.5 hover:bg-rose-500/10 hover:text-rose-500 rounded text-neutral-400 transition-colors no-print ml-1"
                            title="Bu oturum sütununu kapat"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {[1, 2, 3, 4, 5, 6, 7].map(day => {
                  const isToday = day === todayDayOfWeek;
                  const dayName = DAY_NAMES[day];
                  const dayItems = currentWeekSchedules.filter(s => s.dayOfWeek === day);
                  dayItems.sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));
                  const dayCompleted = dayItems.filter(s => s.status === 'completed').length;

                  return (
                    <tr
                      key={day}
                      className={`transition-colors ${
                        isToday
                          ? 'bg-blue-500/[0.06] dark:bg-blue-500/[0.12] ring-1 ring-inset ring-blue-500/25'
                          : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30'
                      }`}
                    >
                      {/* 1. Sütun: Gün Adı & Bugün Rozeti */}
                      <td
                        className={`p-3 font-extrabold text-center border-r border-black/5 dark:border-white/5 align-top ${
                          isToday
                            ? 'bg-blue-500/15 dark:bg-blue-500/25 text-blue-700 dark:text-blue-300'
                            : 'text-neutral-900 dark:text-white bg-neutral-50/70 dark:bg-neutral-900/40'
                        }`}
                      >
                        <div className="sticky left-0 flex flex-col items-center">
                          {isToday && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mb-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-2xs animate-pulse">
                              Bugün
                            </span>
                          )}
                          <span className={`block text-xs ${isToday ? 'font-black text-blue-700 dark:text-blue-300' : ''}`}>
                            {dayName}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            {dayItems.length} Oturum
                          </span>
                          {dayItems.length > 0 && (
                            <span
                              className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded-md ${
                                dayCompleted === dayItems.length
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                                  : dayCompleted > 0
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-500'
                              }`}
                            >
                              {dayCompleted}/{dayItems.length} Yapıldı
                            </span>
                          )}
                          {copiedSession && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePasteSession(day);
                              }}
                              className="mt-1.5 px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
                              title={`Kopyalanan "${copiedSession.subject}" oturumunu ${dayName} gününe yapıştır`}
                            >
                              <ClipboardPaste className="w-2.5 h-2.5" />
                              <span>Yapıştır</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Oturum Sütunları (1, 2, 3...) */}
                      {Array.from({ length: visibleSessionsCount }).map((_, sIdx) => {
                        const sessionNum = sIdx + 1;
                        const item = dayItems.find(s => s.sessionNumber === sessionNum) || (!dayItems.some(s => s.sessionNumber) ? dayItems[sIdx] : undefined);
                        const subjectColor = item ? getSubjectColor(item.subject) : null;
                        const isCompleted = item?.status === 'completed';
                        const itemAccent = item?.customColor || selectedBoxTheme.accentColor;
                        const isDimmed = item && (
                          (completionFilter === 'completed' && !isCompleted) ||
                          (completionFilter === 'pending' && isCompleted)
                        );

                        return (
                          <td
                            key={sIdx}
                            className="p-2 border-r border-black/5 dark:border-white/5 align-top min-h-[95px]"
                          >
                            {item ? (
                              <div
                                style={{
                                  background: isCompleted
                                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.34) 0%, rgba(5, 150, 105, 0.22) 100%)'
                                    : `${itemAccent}22`,
                                  borderColor: isCompleted
                                    ? '#10B981'
                                    : `${itemAccent}75`,
                                  borderLeftWidth: isCompleted ? '5px' : '4px',
                                  borderLeftColor: isCompleted ? '#059669' : itemAccent,
                                  boxShadow: isCompleted
                                    ? '0 6px 18px -3px rgba(16, 185, 129, 0.38), 0 0 0 1px rgba(16, 185, 129, 0.35)'
                                    : undefined,
                                  opacity: isDimmed ? 0.35 : 1,
                                }}
                                className={`p-2.5 rounded-2xl border space-y-1.5 transition-all group relative overflow-hidden ${
                                  isCompleted
                                    ? 'border-2 scale-[1.01]'
                                    : 'shadow-2xs hover:shadow-xs'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span
                                    style={{
                                      backgroundColor: isCompleted ? '#059669' : `${itemAccent}28`,
                                      borderColor: isCompleted ? '#047857' : `${itemAccent}55`,
                                      color: isCompleted
                                        ? '#FFFFFF'
                                        : item.customColor
                                        ? item.customColor
                                        : subjectColor
                                        ? `#${subjectColor.text}`
                                        : itemAccent,
                                    }}
                                    className="font-black text-[10px] leading-tight px-1.5 py-0.5 rounded-md border shadow-2xs"
                                  >
                                    {item.subject}
                                  </span>

                                  {/* Direct Completion Toggle Checkbox / Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleScheduleItemCompletion(item.id);
                                    }}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                                      isCompleted
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-sm shadow-emerald-500/35 ring-1 ring-white/30'
                                        : 'bg-white hover:bg-emerald-50 dark:bg-neutral-800 dark:hover:bg-emerald-950/40 text-neutral-500 hover:text-emerald-600 border border-black/10 dark:border-white/10'
                                    }`}
                                    title={isCompleted ? 'Tamamlandı (Geri almak için tıklayın)' : 'Oturumu Tamamlandı Olarak İşaretle'}
                                  >
                                    {isCompleted ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                                        <span className="tracking-wide">TAMAMLANDI</span>
                                      </>
                                    ) : (
                                      <>
                                        <Circle className="w-3 h-3 text-neutral-400 group-hover:text-emerald-500" />
                                        <span>Tamamla</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div
                                  className={`font-extrabold text-[11px] leading-snug line-clamp-2 transition-all flex items-center gap-1 ${
                                    isCompleted
                                      ? 'text-emerald-950 dark:text-emerald-50'
                                      : 'text-neutral-900 dark:text-white'
                                  }`}
                                >
                                  {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300 stroke-[3] shrink-0" />}
                                  <span>{item.topic}</span>
                                </div>

                                {/* Optional Time if entered */}
                                {item.timeRange && (
                                  <div className={`text-[10px] flex items-center gap-1 font-mono ${
                                    isCompleted ? 'text-emerald-900 dark:text-emerald-100 font-bold' : 'text-neutral-500 dark:text-neutral-400'
                                  }`}>
                                    <Clock className={`w-3 h-3 ${isCompleted ? 'text-emerald-600 dark:text-emerald-300' : 'text-neutral-400'}`} />
                                    <span>{item.timeRange}</span>
                                  </div>
                                )}

                                {/* Target (Question / Duration) */}
                                {item.targetValue && (
                                  <div className={`text-[10px] font-mono flex items-center gap-1 font-bold ${
                                    isCompleted ? 'text-emerald-900 dark:text-emerald-100' : 'text-neutral-600 dark:text-neutral-300'
                                  }`}>
                                    <Target className={`w-3 h-3 ${isCompleted ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-500'}`} />
                                    <span>
                                      {item.targetValue} {item.targetType === 'duration' ? 'Dakika' : 'Soru'}
                                    </span>
                                  </div>
                                )}

                                {/* Interactive Timer Button, Color Picker, Copy & Delete */}
                                <div className="pt-1.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between no-print gap-1">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <button
                                      onClick={() => startTimer({
                                        scheduleItemId: item.id,
                                        subject: item.subject,
                                        topic: item.topic,
                                        mode: item.targetType === 'duration' ? 'pomodoro' : 'stopwatch',
                                        initialMinutes: item.targetValue || 25,
                                      })}
                                      className="p-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                      title="Sayacı Başlat"
                                    >
                                      <Play className="w-2.5 h-2.5 fill-current" />
                                      <span>Sayaç</span>
                                    </button>

                                    {/* Box Color Picker Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setColorPickerTargetItem(item);
                                      }}
                                      style={{
                                        color: isCompleted ? '#047857' : itemAccent,
                                        backgroundColor: isCompleted ? '#10B98128' : `${itemAccent}20`,
                                      }}
                                      className="p-1 rounded-lg hover:opacity-80 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                                      title="Bu Kutucuğun Rengini Yelpazeden Değiştir"
                                    >
                                      <Palette className="w-2.5 h-2.5" />
                                      <span>Renk</span>
                                    </button>

                                    {/* Copy Session Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopySession(item);
                                      }}
                                      className="p-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                      title="Bu Oturumu Kopyala"
                                    >
                                      <Copy className="w-2.5 h-2.5" />
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => deleteScheduleItem(item.id)}
                                    className="text-neutral-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                                    title="Dersi Sil"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Empty slot: Show Paste button if session copied, else + Oturum Ekle */
                              copiedSession ? (
                                <div
                                  style={{ borderColor: `${selectedBoxTheme.accentColor}50` }}
                                  className="w-full h-full min-h-[90px] rounded-2xl border-2 border-dashed bg-blue-500/[0.04] p-1.5 flex flex-col items-center justify-center gap-1.5 transition-all no-print"
                                >
                                  <button
                                    type="button"
                                    onClick={() => handlePasteSession(day, sessionNum)}
                                    className="w-full py-1.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                                    title={`Kopyalanan "${copiedSession.subject}" oturumunu ${dayName} ${sessionNum}. Oturuma yapıştır`}
                                  >
                                    <ClipboardPaste className="w-3 h-3" />
                                    <span>Yapıştır ({copiedSession.subject.slice(0, 7)})</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddForSlot(day, sessionNum)}
                                    className="text-[9px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-semibold cursor-pointer"
                                  >
                                    + Boş Ekle
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleOpenAddForSlot(day, sessionNum)}
                                  style={{
                                    borderColor: `${selectedBoxTheme.accentColor}40`,
                                  }}
                                  className="w-full h-full min-h-[85px] rounded-2xl border border-dashed hover:scale-[1.01] transition-all p-2 group cursor-pointer no-print flex flex-col items-center justify-center gap-1"
                                  title={`${dayName} ${sessionNum}. Oturuma Ders Ekle`}
                                >
                                  <Plus
                                    className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all"
                                    style={{ color: selectedBoxTheme.accentColor }}
                                  />
                                  <span
                                    className="text-[10px] font-bold opacity-80 group-hover:opacity-100"
                                    style={{ color: selectedBoxTheme.accentColor }}
                                  >
                                    + Oturum Ekle
                                  </span>
                                </button>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW 2: GÜNLÜK DETAYLI KARTLAR GÖRÜNÜMÜ */
        <div className="space-y-4">
          {/* Week & Day Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 no-print">
            {/* 1. Hafta / 2. Hafta Butonları */}
            <div className="flex p-1 rounded-2xl bg-neutral-200/80 dark:bg-neutral-800 border border-black/10 dark:border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedWeek(1)}
                style={selectedWeek === 1 ? { backgroundColor: selectedBoxTheme.accentColor, color: '#FFFFFF' } : undefined}
                className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedWeek === 1
                    ? 'shadow-xs scale-[1.02]'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="1. Hafta Programı"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>1. Hafta</span>
                {selectedWeek === 1 && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/25 text-white font-black uppercase">
                    Aktif
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSelectedWeek(2)}
                style={selectedWeek === 2 ? { backgroundColor: selectedBoxTheme.accentColor, color: '#FFFFFF' } : undefined}
                className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedWeek === 2
                    ? 'shadow-xs scale-[1.02]'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="2. Hafta Programı"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>2. Hafta</span>
                {selectedWeek === 2 && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/25 text-white font-black uppercase">
                    Aktif
                  </span>
                )}
              </button>
            </div>

            {/* Day Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {DAYS.map(day => {
                const isTodayDay = day.id === todayDayOfWeek;
                return (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day.id)}
                    style={
                      selectedDay === day.id
                        ? {
                            backgroundColor: selectedBoxTheme.accentColor,
                            boxShadow: `0 2px 8px 0 ${selectedBoxTheme.accentColor}30`,
                            color: '#FFFFFF',
                          }
                        : undefined
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      selectedDay === day.id
                        ? 'shadow-xs'
                        : isTodayDay
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-black/5 dark:border-white/5 hover:bg-neutral-200'
                    }`}
                  >
                    <span>{day.label}</span>
                    {isTodayDay && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Paste Button for Cards View */}
            {copiedSession && (
              <button
                type="button"
                onClick={() => handlePasteSession(selectedDay === 0 ? todayDayOfWeek : selectedDay)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
                title={`Kopyalanan oturumu ${selectedDay === 0 ? DAY_NAMES[todayDayOfWeek] : DAY_NAMES[selectedDay]} gününe yapıştır`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>{selectedDay === 0 ? `${todayName}'ne` : `${DAY_NAMES[selectedDay]}'ne`} Yapıştır</span>
              </button>
            )}
          </div>

          {/* Cards Grid */}
          {(() => {
            const cardItems = displaySchedules.filter(item => {
              if (completionFilter === 'completed') return item.status === 'completed';
              if (completionFilter === 'pending') return item.status !== 'completed';
              return true;
            });

            if (cardItems.length === 0) {
              return (
                <div className="p-8 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 text-center text-neutral-500">
                  <p className="font-bold text-sm">Seçili kriterlere uygun oturum bulunamadı.</p>
                  <p className="text-xs text-neutral-400 mt-1">Oturum eklemek için yukarıdaki "Oturum Ekle" butonunu kullanabilirsiniz.</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cardItems.map(item => {
                  const isCompleted = item.status === 'completed';
                  const isTodayItem = item.dayOfWeek === todayDayOfWeek;
                  const itemAccent = item.customColor || selectedBoxTheme.accentColor;

                  return (
                    <div
                      key={item.id}
                      style={{
                        borderColor: isCompleted ? '#10B981' : `${itemAccent}75`,
                        borderLeftWidth: isCompleted ? '6px' : '5px',
                        borderLeftColor: isCompleted ? '#059669' : itemAccent,
                        background: isCompleted
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.34) 0%, rgba(5, 150, 105, 0.20) 100%)'
                          : `${itemAccent}20`,
                        boxShadow: isCompleted
                          ? '0 8px 22px -4px rgba(16, 185, 129, 0.38), 0 0 0 1px rgba(16, 185, 129, 0.35)'
                          : undefined,
                      }}
                      className={`p-4 rounded-3xl border space-y-2 transition-all group ${
                        isCompleted ? 'border-2 scale-[1.01]' : 'shadow-xs hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span
                            style={{ color: isCompleted ? '#047857' : itemAccent }}
                            className="font-extrabold dark:brightness-125"
                          >
                            {DAY_NAMES[item.dayOfWeek]} {item.sessionNumber ? `• ${item.sessionNumber}. Oturum` : ''}
                          </span>
                          {isTodayItem && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-blue-600 text-white animate-pulse">
                              Bugün
                            </span>
                          )}
                        </div>

                        {/* Status badge */}
                        {isCompleted ? (
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white flex items-center gap-1 shadow-sm shadow-emerald-500/35 ring-1 ring-white/30">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                            <span className="tracking-wide">TAMAMLANDI ✓</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              backgroundColor: `${itemAccent}25`,
                              color: itemAccent,
                              borderColor: `${itemAccent}45`,
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          >
                            Bekliyor
                          </span>
                        )}
                      </div>

                      <h3 className={`font-extrabold text-sm transition-all flex items-center gap-1.5 ${
                        isCompleted ? 'text-emerald-950 dark:text-emerald-50' : 'text-neutral-900 dark:text-white'
                      }`}>
                        {isCompleted && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-300 stroke-[3] shrink-0" />}
                        <span>{item.subject} • {item.topic}</span>
                      </h3>

                      {item.timeRange && (
                        <div className={`text-xs flex items-center gap-1 font-mono ${
                          isCompleted ? 'text-emerald-900 dark:text-emerald-100 font-bold' : 'text-neutral-500'
                        }`}>
                          <Clock className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-600 dark:text-emerald-300' : 'text-neutral-400'}`} />
                          <span>{item.timeRange}</span>
                        </div>
                      )}

                      {item.targetValue && (
                        <div className={`text-xs flex items-center gap-1 font-mono ${
                          isCompleted ? 'text-emerald-900 dark:text-emerald-100 font-bold' : 'text-neutral-500'
                        }`}>
                          <Target className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-500'}`} />
                          <span>{item.targetValue} {item.targetType === 'duration' ? 'Dakika' : 'Soru'}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => startTimer({
                              scheduleItemId: item.id,
                              subject: item.subject,
                              topic: item.topic,
                              mode: item.targetType === 'duration' ? 'pomodoro' : 'stopwatch',
                              initialMinutes: item.targetValue || 25,
                            })}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-all"
                            title="Sayacı Başlat"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Sayaç</span>
                          </button>

                          {/* Quick Toggle Completion Checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleScheduleItemCompletion(item.id)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                              isCompleted
                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm shadow-emerald-500/30'
                                : 'bg-white/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-emerald-50 hover:text-emerald-600 border border-black/10 dark:border-white/10'
                            }`}
                            title={isCompleted ? 'Tamamlandı (Geri almak için tıklayın)' : 'Oturumu Tamamlandı Olarak İşaretle'}
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'text-white' : 'text-neutral-400'}`} />
                            <span>{isCompleted ? 'Yapıldı' : 'Tamamla'}</span>
                          </button>

                          {/* Box Color Picker Button */}
                          <button
                            type="button"
                            onClick={() => setColorPickerTargetItem(item)}
                            style={{
                              backgroundColor: `${itemAccent}22`,
                              color: itemAccent,
                              borderColor: `${itemAccent}45`,
                            }}
                            className="px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="Bu Kutucuğun Rengini Yelpazeden Değiştir"
                          >
                            <Palette className="w-3 h-3" />
                            <span>Renk</span>
                          </button>

                          {/* Copy Session Button */}
                          <button
                            type="button"
                            onClick={() => handleCopySession(item)}
                            className="px-2 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="Bu Oturumu Kopyala"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => deleteScheduleItem(item.id)}
                          className="text-neutral-400 hover:text-rose-500 p-1.5 transition-colors cursor-pointer"
                          title="Oturumu Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Soru Çözme Liderlik Tablosu (Sayfanın altında, ders programının arkasında) */}
      <div className="no-print pt-2">
        <LeaderboardCard />
      </div>

      {/* Dikey A4 Çıktı Alt Bilgisi (Yalnızca Yazdırmada Görünür) */}
      <div className="print-only hidden pt-8 mt-6 border-t border-black text-xs">
        <div className="grid grid-cols-2 gap-8 text-black">
          <div>
            <span className="font-bold block mb-1">Koç / Öğretmen Notu:</span>
            <div className="border border-black h-20 rounded p-2 text-[10px]">
              Oturumlara eksiksiz uyulacak, çözülemeyen sorular haftalık koçluk görüşmesine getirilecek.
            </div>
          </div>
          <div className="flex justify-between items-end pb-2">
            <div>
              <span>Öğrenci İmzası: ___________________</span>
            </div>
            <div>
              <span>Koç İmzası: ___________________</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: SEÇİLİ ÖĞRENCİYE DERS / OTURUM EKLE */}
      {isAddModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in select-none">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-7 min-w-0 break-words">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5 dark:border-white/5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                  Oturum Ekle
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                  <User className="w-3.5 h-3.5" />
                  <span>{activeStudent.name} (No: {activeStudent.studentNumber || activeStudent.pin})</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleCreateScheduleItem} className="space-y-3.5 text-xs sm:text-sm">
              {/* Hafta Seçimi (2 Haftalık Döngü) */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Hafta
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewItemWeek('1')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      newItemWeek === '1'
                        ? 'bg-blue-500 text-white border-blue-500 shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-black/5 dark:border-white/5 hover:bg-neutral-200'
                    }`}
                  >
                    1. Hafta
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItemWeek('2')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      newItemWeek === '2'
                        ? 'bg-blue-500 text-white border-blue-500 shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-black/5 dark:border-white/5 hover:bg-neutral-200'
                    }`}
                  >
                    2. Hafta
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItemWeek('both')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      newItemWeek === 'both'
                        ? 'bg-blue-500 text-white border-blue-500 shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-black/5 dark:border-white/5 hover:bg-neutral-200'
                    }`}
                  >
                    Her İki Hafta
                  </button>
                </div>
              </div>

              {/* Gün ve Oturum Sırası */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Gün
                  </label>
                  <select
                    value={newItemDay}
                    onChange={e => setNewItemDay(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                  >
                    <option value={1}>Pazartesi</option>
                    <option value={2}>Salı</option>
                    <option value={3}>Çarşamba</option>
                    <option value={4}>Perşembe</option>
                    <option value={5}>Cuma</option>
                    <option value={6}>Cumartesi</option>
                    <option value={7}>Pazar</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Oturum Numarası
                  </label>
                  <select
                    value={newItemSession}
                    onChange={e => setNewItemSession(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-bold font-mono"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n}. Oturum</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ortak Ders Değişkeni ve Konu */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Ders Değişkeni
                  </label>
                  <select
                    value={newItemSubject}
                    onChange={e => {
                      if (e.target.value === '__ADD_NEW__') {
                        setIsAddingCustomSubject(true);
                      } else {
                        setNewItemSubject(e.target.value);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-bold"
                  >
                    {subjects.map(subj => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                    <option value="__ADD_NEW__">+ Yeni Ders Değişkeni Ekle...</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Konu Başlığı
                  </label>
                  <input
                    type="text"
                    value={newItemTopic}
                    onChange={e => setNewItemTopic(e.target.value)}
                    placeholder="Konu başlığı"
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                    required
                  />
                </div>
              </div>

              {isAddingCustomSubject && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <input
                    type="text"
                    value={customSubjectDraft}
                    onChange={e => setCustomSubjectDraft(e.target.value)}
                    placeholder="Yeni ders değişkeni adı..."
                    className="flex-1 p-2 rounded-lg bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 text-xs font-bold"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customSubjectDraft.trim()) {
                        const norm = normalizeSubjectName(customSubjectDraft.trim());
                        addSubjectVariable(norm);
                        setNewItemSubject(norm);
                        setCustomSubjectDraft('');
                        setIsAddingCustomSubject(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustomSubject(false);
                      setCustomSubjectDraft('');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-bold cursor-pointer"
                  >
                    İptal
                  </button>
                </div>
              )}

              {/* Saat Aralığı ve Kaynak */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Saat Aralığı
                  </label>
                  <input
                    type="text"
                    value={newItemTime}
                    onChange={e => setNewItemTime(e.target.value)}
                    placeholder="09:00 - 10:30"
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Kaynak
                  </label>
                  <input
                    type="text"
                    value={newItemSource}
                    onChange={e => setNewItemSource(e.target.value)}
                    placeholder="Kaynak adı"
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                  />
                </div>
              </div>

              {/* Hedef Türü ve Miktarı */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Hedef Türü
                  </label>
                  <select
                    value={newItemTargetType}
                    onChange={e => setNewItemTargetType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                  >
                    <option value="question">Soru Sayısı</option>
                    <option value="duration">Çalışma Süresi (Dk)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Hedef Miktarı
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newItemTargetVal}
                    onChange={e => setNewItemTargetVal(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Kutucuk Rengi Seçici (Renk Yelpazesi) */}
              <div className="p-3.5 rounded-2xl bg-neutral-100/90 dark:bg-neutral-800/80 border border-black/10 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-extrabold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Palette className="w-4 h-4" style={{ color: newItemColor }} />
                    <span>Kutucuk Rengi (Renk Yelpazesi)</span>
                  </label>
                  <label className="px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer hover:border-blue-500 transition-all shadow-2xs">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/30"
                      style={{ backgroundColor: newItemColor }}
                    />
                    <span className="font-mono text-[11px]">{newItemColor}</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 underline ml-0.5">Tam Yelpaze</span>
                    <input
                      type="color"
                      value={newItemColor}
                      onChange={e => setNewItemColor(e.target.value.toUpperCase())}
                      className="sr-only"
                    />
                  </label>
                </div>

                {/* Gökkuşağı Renk Yelpazesi Kaydırıcısı (0 - 360 Derece) */}
                <div className="space-y-1.5">
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={newItemHue}
                    onChange={e => {
                      const h = Number(e.target.value);
                      setNewItemHue(h);
                      setNewItemColor(hslToHex(h, 82, 52));
                    }}
                    style={{
                      background:
                        'linear-gradient(to right, #FF0000 0%, #FF8800 12%, #FFFF00 22%, #00CC44 35%, #00CCCC 50%, #0066FF 65%, #8800FF 80%, #FF0088 92%, #FF0000 100%)',
                    }}
                    className="w-full h-4 rounded-full appearance-none cursor-pointer shadow-inner border border-black/15 dark:border-white/20"
                    title="Renk Yelpazesinde Kaydırarak Renk Seçin"
                  />
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                    <span>Yelpaze çubuğunu kaydırarak veya sağ üstteki "Tam Yelpaze"ye tıklayarak istediğiniz rengi seçin</span>
                  </div>
                </div>

                {/* Canlı Kutucuk Önizlemesi */}
                <div
                  style={{
                    backgroundColor: `${newItemColor}22`,
                    borderColor: `${newItemColor}80`,
                    borderLeftWidth: '4px',
                    borderLeftColor: newItemColor,
                  }}
                  className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        backgroundColor: `${newItemColor}28`,
                        borderColor: `${newItemColor}55`,
                        color: newItemColor,
                      }}
                      className="font-black text-[10px] px-2 py-0.5 rounded-md border"
                    >
                      {newItemSubject || 'Ders'}
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[180px]">
                      {newItemTopic || 'Örnek Kutucuk Görünümü'}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                    Canlı Önizleme
                  </span>
                </div>
              </div>

              {/* Not */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Not
                </label>
                <textarea
                  value={newItemNote}
                  onChange={e => setNewItemNote(e.target.value)}
                  placeholder="Not ekleyin..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-500 font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: newItemColor || selectedBoxTheme.accentColor,
                    boxShadow: `0 4px 14px 0 ${(newItemColor || selectedBoxTheme.accentColor)}40`
                  }}
                  className="px-5 py-2.5 rounded-2xl text-white font-bold cursor-pointer"
                >
                  Oturumu Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KUTUCUK RENGİNİ YELPAZEDEN DEĞİŞTİR (MEVCUT KUTUCUKLAR İÇİN) */}
      {colorPickerTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in select-none">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                  style={{ backgroundColor: colorPickerTargetItem.customColor || selectedBoxTheme.accentColor }}
                >
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white">
                    Kutucuk Rengini Yelpazeden Seç
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {DAY_NAMES[colorPickerTargetItem.dayOfWeek]} • {colorPickerTargetItem.sessionNumber || 1}. Oturum ({colorPickerTargetItem.subject})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setColorPickerTargetItem(null)}
                className="p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {colorPickerTargetItem.status === 'completed' && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Bu oturum "TAMAMLANDI" olarak işaretlendiği için dikkat çekici yeşil renkte görünüyor. Seçtiğiniz renk oturum bekleme durumundayken uygulanır.</span>
              </div>
            )}

            {/* Renk Yelpazesi Kaydırıcısı ve Tam Renk Seçici */}
            <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-black/10 dark:border-white/10 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200">
                  Renk Yelpazesi
                </span>
                <label className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 text-xs font-extrabold text-neutral-800 dark:text-neutral-200 cursor-pointer hover:border-blue-500 transition-all flex items-center gap-1.5 shadow-2xs">
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 dark:border-white/30"
                    style={{ backgroundColor: colorPickerTargetItem.customColor || selectedBoxTheme.accentColor }}
                  />
                  <span>Detaylı Renk Yelpazesi Aç</span>
                  <input
                    type="color"
                    value={colorPickerTargetItem.customColor || selectedBoxTheme.accentColor}
                    onChange={e => {
                      const hex = e.target.value.toUpperCase();
                      setColorPickerTargetItem(prev => prev ? { ...prev, customColor: hex } : null);
                    }}
                    className="sr-only"
                  />
                </label>
              </div>

              <input
                type="range"
                min={0}
                max={360}
                value={editItemHue}
                onChange={e => {
                  const h = Number(e.target.value);
                  setEditItemHue(h);
                  const hex = hslToHex(h, 82, 52);
                  setColorPickerTargetItem(prev => prev ? { ...prev, customColor: hex } : null);
                }}
                style={{
                  background:
                    'linear-gradient(to right, #FF0000 0%, #FF8800 12%, #FFFF00 22%, #00CC44 35%, #00CCCC 50%, #0066FF 65%, #8800FF 80%, #FF0088 92%, #FF0000 100%)',
                }}
                className="w-full h-5 rounded-full appearance-none cursor-pointer shadow-inner border border-black/15 dark:border-white/20"
              />

              {/* Canlı Önizleme */}
              <div
                style={{
                  backgroundColor: `${colorPickerTargetItem.customColor || selectedBoxTheme.accentColor}24`,
                  borderColor: `${colorPickerTargetItem.customColor || selectedBoxTheme.accentColor}80`,
                  borderLeftWidth: '4px',
                  borderLeftColor: colorPickerTargetItem.customColor || selectedBoxTheme.accentColor,
                }}
                className="p-3 rounded-xl border flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      backgroundColor: `${colorPickerTargetItem.customColor || selectedBoxTheme.accentColor}28`,
                      borderColor: `${colorPickerTargetItem.customColor || selectedBoxTheme.accentColor}55`,
                      color: colorPickerTargetItem.customColor || selectedBoxTheme.accentColor,
                    }}
                    className="font-black text-[10px] px-2 py-0.5 rounded-md border"
                  >
                    {colorPickerTargetItem.subject}
                  </span>
                  <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[160px]">
                    {colorPickerTargetItem.topic}
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold text-neutral-500">
                  {colorPickerTargetItem.customColor || selectedBoxTheme.accentColor}
                </span>
              </div>
            </div>

            {/* Uygulama Kapsamı Butonları */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleApplyItemColor(
                      colorPickerTargetItem,
                      colorPickerTargetItem.customColor || selectedBoxTheme.accentColor,
                      'single'
                    )
                  }
                  style={{
                    backgroundColor: colorPickerTargetItem.customColor || selectedBoxTheme.accentColor,
                  }}
                  className="py-2.5 px-3 rounded-xl text-white font-bold text-xs shadow-sm cursor-pointer active:scale-95 transition-all text-center"
                >
                  Bu Kutucuğa Uygula
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyItemColor(
                      colorPickerTargetItem,
                      colorPickerTargetItem.customColor || selectedBoxTheme.accentColor,
                      'subject'
                    )
                  }
                  className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold text-xs border border-black/10 dark:border-white/10 cursor-pointer active:scale-95 transition-all text-center"
                >
                  Tüm "{colorPickerTargetItem.subject}"
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyItemColor(
                      colorPickerTargetItem,
                      colorPickerTargetItem.customColor || selectedBoxTheme.accentColor,
                      'all'
                    )
                  }
                  className="py-2.5 px-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs cursor-pointer active:scale-95 transition-all text-center"
                >
                  Tüm Kutucuklara
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
