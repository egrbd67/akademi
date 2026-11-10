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
  FileCode
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ScheduleItem } from '../../types';
import { exportScheduleToExcel, copyScheduleForGoogleSheets, DAY_NAMES, getSubjectColor } from '../../utils/excelExport';
import { BOX_THEMES } from '../theme/ThemeCustomizerModal';
import { LeaderboardCard } from '../leaderboard/LeaderboardCard';

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
    deleteScheduleItem,
    templates,
    addTemplate,
    applyTemplateToStudent,
    startTimer,
    targetDaysLeft,
    boxTheme
  } = useApp();

  const selectedBoxTheme = BOX_THEMES.find(b => b.id === boxTheme) || BOX_THEMES[0];

  const [selectedDay, setSelectedDay] = useState<number>(0); // 0 = all
  const [selectedWeek, setSelectedWeek] = useState<1 | 2>(1); // 1 = 1. Hafta, 2 = 2. Hafta
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix'); // Default: Dikey A4 Oturum Matrisi
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isApplyTemplateModalOpen, setIsApplyTemplateModalOpen] = useState(false);
  const [copiedAlert, setCopiedAlert] = useState(false);
  const [jsonNotice, setJsonNotice] = useState<string | null>(null);

  // New item form state (with sessionNumber and optional time)
  const [targetStudentId, setTargetStudentId] = useState<string>(currentStudentId || (students[0]?.id || ''));
  const [newItemWeek, setNewItemWeek] = useState<'1' | '2' | 'both'>('1');
  const [newItemDay, setNewItemDay] = useState<number>(1);
  const [newItemSession, setNewItemSession] = useState<number>(1);
  const [newItemSubject, setNewItemSubject] = useState<string>('Matematik');
  const [newItemTopic, setNewItemTopic] = useState<string>('');
  const [newItemTime, setNewItemTime] = useState<string>(''); // Optional!
  const [newItemSource, setNewItemSource] = useState<string>('');
  const [newItemTargetType, setNewItemTargetType] = useState<'question' | 'duration'>('question');
  const [newItemTargetVal, setNewItemTargetVal] = useState<number>(40);
  const [newItemNote, setNewItemNote] = useState<string>('');

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

    const cleanSubject = newItemSubject.trim() || 'Matematik';
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
        status: 'pending',
      });
    }

    setIsAddModalOpen(false);
    setNewItemTopic('');
    setNewItemTime('');
    setNewItemSource('');
    setNewItemNote('');
    setJsonNotice(`${activeStudent.name} için ${DAY_NAMES[Number(newItemDay)]} ${sessionNum}. Oturum (${cleanSubject}) eklendi.`);
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
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Dikey A4 ve Excel uyumlu oturum matrisi. Her güne 1, 2, 3... oturum ekleyin, saat isteğe bağlıdır.
          </p>
        </div>

        {/* Action Buttons: Add Lesson, View Switch, Excel, Print */}
        {/* Action Buttons: Add Lesson, View Switch, Excel, Print */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 2 Haftalık Döngü Seçici */}
          <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5">
            <button
              onClick={() => setSelectedWeek(1)}
              style={selectedWeek === 1 ? { backgroundColor: selectedBoxTheme.accentColor, color: '#FFFFFF' } : undefined}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                selectedWeek === 1
                  ? 'shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="1. Hafta Programı"
            >
              1. Hafta
            </button>
            <button
              onClick={() => setSelectedWeek(2)}
              style={selectedWeek === 2 ? { backgroundColor: selectedBoxTheme.accentColor, color: '#FFFFFF' } : undefined}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                selectedWeek === 2
                  ? 'shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="2. Hafta Programı"
            >
              2. Hafta
            </button>
          </div>

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

      {/* Leaderboard Card (Günlük ve Haftalık En Çok Soru Çözenler) */}
      <div className="no-print">
        <LeaderboardCard />
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
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border-b border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <Grid3X3 className="w-4 h-4 text-blue-500" />
              <span className="font-extrabold text-xs text-neutral-900 dark:text-white">
                {selectedWeek}. Hafta Oturum Tablosu ({visibleSessionsCount} Oturum)
              </span>
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
                  const dayName = DAY_NAMES[day];
                  const dayItems = currentWeekSchedules.filter(s => s.dayOfWeek === day);
                  dayItems.sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));

                  return (
                    <tr key={day} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                      {/* 1. Sütun: Gün Adı */}
                      <td className="p-3 font-extrabold text-neutral-900 dark:text-white bg-neutral-50/70 dark:bg-neutral-900/40 text-center border-r border-black/5 dark:border-white/5 align-top">
                        <div className="sticky left-0">
                          <span className="block text-xs">{dayName}</span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            {dayItems.length} Oturum
                          </span>
                        </div>
                      </td>

                      {/* Oturum Sütunları (1, 2, 3...) */}
                      {Array.from({ length: visibleSessionsCount }).map((_, sIdx) => {
                        const sessionNum = sIdx + 1;
                        const item = dayItems.find(s => s.sessionNumber === sessionNum) || (!dayItems.some(s => s.sessionNumber) ? dayItems[sIdx] : undefined);
                        const subjectColor = item ? getSubjectColor(item.subject) : null;
                        const selectedBoxTheme = BOX_THEMES.find(b => b.id === boxTheme) || BOX_THEMES[0];

                        return (
                          <td
                            key={sIdx}
                            className="p-2 border-r border-black/5 dark:border-white/5 align-top min-h-[95px]"
                          >
                            {item ? (
                              <div
                                style={{
                                  backgroundColor: `${selectedBoxTheme.accentColor}18`,
                                  borderColor: `${selectedBoxTheme.accentColor}50`,
                                }}
                                className="p-2.5 rounded-2xl border shadow-2xs space-y-1.5 transition-all group"
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span
                                    style={{
                                      backgroundColor: `${selectedBoxTheme.accentColor}25`,
                                      borderColor: `${selectedBoxTheme.accentColor}40`,
                                      color: subjectColor ? `#${subjectColor.text}` : selectedBoxTheme.accentColor,
                                    }}
                                    className="font-black text-[10px] leading-tight px-1.5 py-0.5 rounded-md border"
                                  >
                                    {item.subject}
                                  </span>
                                  {item.status === 'completed' && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  )}
                                </div>

                                <div className="font-semibold text-neutral-900 dark:text-white text-[11px] leading-snug line-clamp-2">
                                  {item.topic}
                                </div>

                                {/* Optional Time if entered */}
                                {item.timeRange && (
                                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 font-mono">
                                    <Clock className="w-3 h-3 text-neutral-400" />
                                    <span>{item.timeRange}</span>
                                  </div>
                                )}

                                {/* Target (Question / Duration) */}
                                {item.targetValue && (
                                  <div className="text-[10px] font-mono text-neutral-600 dark:text-neutral-300 flex items-center gap-1 font-semibold">
                                    <Target className="w-3 h-3 text-rose-500" />
                                    <span>
                                      {item.targetValue} {item.targetType === 'duration' ? 'Dakika' : 'Soru'}
                                    </span>
                                  </div>
                                )}

                                {/* Interactive Timer Button & Delete for teacher */}
                                <div className="pt-1.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between no-print">
                                  <button
                                    onClick={() => startTimer({
                                      scheduleItemId: item.id,
                                      subject: item.subject,
                                      topic: item.topic,
                                      mode: item.targetType === 'duration' ? 'pomodoro' : 'stopwatch',
                                      initialMinutes: item.targetValue || 25,
                                    })}
                                    className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Sayacı Başlat"
                                  >
                                    <Play className="w-2.5 h-2.5 fill-current" />
                                    <span>Sayaç</span>
                                  </button>

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
                              /* Empty slot: Click to add lesson directly to this slot */
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
          {/* Day Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-print">
            {DAYS.map(day => (
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedDay === day.id
                    ? 'shadow-xs'
                    : 'bg-white dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-400 border border-black/5 dark:border-white/5 hover:bg-neutral-100'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displaySchedules.map(item => (
              <div
                key={item.id}
                style={{
                  borderColor: `${selectedBoxTheme.accentColor}35`,
                  backgroundColor: `${selectedBoxTheme.accentColor}0A`,
                }}
                className="p-4 rounded-3xl bg-white dark:bg-[#1C1C1E] border shadow-xs space-y-2 transition-all"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">
                    {DAY_NAMES[item.dayOfWeek]} {item.sessionNumber ? `• ${item.sessionNumber}. Oturum` : ''}
                  </span>
                  {item.status === 'completed' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                      Tamamlandı
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  {item.subject} • {item.topic}
                </h3>

                {item.timeRange && (
                  <div className="text-xs text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.timeRange}</span>
                  </div>
                )}

                {item.targetValue && (
                  <div className="text-xs text-neutral-500 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-rose-500" />
                    <span>{item.targetValue} {item.targetType === 'duration' ? 'Dakika' : 'Soru'}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => startTimer({
                      scheduleItemId: item.id,
                      subject: item.subject,
                      topic: item.topic,
                      mode: item.targetType === 'duration' ? 'pomodoro' : 'stopwatch',
                      initialMinutes: item.targetValue || 25,
                    })}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Sayacı Başlat</span>
                  </button>

                  <button
                    onClick={() => deleteScheduleItem(item.id)}
                    className="text-neutral-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

              {/* Ders Adı ve Konu */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Ders Adı
                  </label>
                  <input
                    type="text"
                    value={newItemSubject}
                    onChange={e => setNewItemSubject(e.target.value)}
                    placeholder="Ders adı"
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                    required
                  />
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
                    backgroundColor: selectedBoxTheme.accentColor,
                    boxShadow: `0 4px 14px 0 ${selectedBoxTheme.accentColor}35`
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
    </div>
  );
};
