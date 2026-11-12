import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Key,
  Flame,
  Snowflake,
  AlertTriangle,
  Calendar,
  CheckSquare,
  BarChart3,
  Edit2,
  Trash2,
  UserCheck,
  Shield,
  ArrowRight,
  Target,
  Phone,
  Sparkles,
  X,
  Copy,
  CheckCircle2,
  BookOpen,
  Layers,
  Trophy,
  Activity,
  Clock,
  ArrowUpDown,
  ListOrdered,
  LayoutGrid,
  List
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, ScheduleItem, Homework, TrialExam, ExamType } from '../../types';
import { ClassroomsModal } from '../classrooms/ClassroomsModal';
import { TeacherStudyTrackerView } from '../students/TeacherStudyTrackerView';
import { getThemeStyles } from '../theme/ThemeCustomizerModal';

interface UserManagementPanelProps {
  onNavigateTab: (tab: string) => void;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ onNavigateTab }) => {
  const {
    role,
    setRole,
    students,
    currentStudentId,
    setCurrentStudentId,
    addStudent,
    updateStudent,
    deleteStudent,
    schedules,
    addScheduleItem,
    homeworks,
    addHomework,
    trialExams,
    addTrialExam,
    classrooms,
    assignStudentToClassrooms,
    activities,
    focusSessions,
    addTeacherDailyStreak,
    updateStudentStreakCount,
    boxTheme
  } = useApp();

  const themeStyles = getThemeStyles(boxTheme);
  const todayStr = new Date().toISOString().split('T')[0];

  // View mode: Grid Cards vs List View vs Ranking Table vs Real-Time Audit Feed vs Study Tracker
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'ranking' | 'activities' | 'study_tracker'>('grid');
  const [trackerStudentId, setTrackerStudentId] = useState<string>('ALL');
  const [rankingSort, setRankingSort] = useState<'score' | 'questions' | 'duration' | 'streak' | 'name'>('score');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE_STREAK' | 'FROZEN' | 'PENDING'>('ALL');
  const [classroomFilter, setClassroomFilter] = useState<string>('ALL');

  // Modals state
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isClassroomsModalOpen, setIsClassroomsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStudentStreakCount, setEditStudentStreakCount] = useState<number>(0);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [programTargetStudent, setProgramTargetStudent] = useState<Student | null>(null);
  const [homeworkTargetStudent, setHomeworkTargetStudent] = useState<Student | null>(null);
  const [examTargetStudent, setExamTargetStudent] = useState<Student | null>(null);

  // New Student Form State (No photo!)
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState(() => Math.floor(10000 + Math.random() * 90000).toString());
  const [newStudentPassword, setNewStudentPassword] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [newStudentPin, setNewStudentPin] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [newStudentExam, setNewStudentExam] = useState('YKS (Sayısal)');
  const [newStudentDailyTarget, setNewStudentDailyTarget] = useState<number>(100);
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentNotes, setNewStudentNotes] = useState('');
  const [newStudentClassroomIds, setNewStudentClassroomIds] = useState<string[]>([]);
  const [editStudentClassroomIds, setEditStudentClassroomIds] = useState<string[]>([]);

  // Special Program Form State for selected student
  const [programDay, setProgramDay] = useState(1);
  const [programSession, setProgramSession] = useState(1);
  const [programTime, setProgramTime] = useState('');
  const [programSubject, setProgramSubject] = useState('Matematik');
  const [programTopic, setProgramTopic] = useState('');
  const [programSource, setProgramSource] = useState('');
  const [programTargetType, setProgramTargetType] = useState<'question' | 'duration'>('question');
  const [programTargetVal, setProgramTargetVal] = useState(40);
  const [programNote, setProgramNote] = useState('');

  // Special Homework Form State
  const [hwTitle, setHwTitle] = useState('');
  const [hwSubject, setHwSubject] = useState('Matematik');
  const [hwTopic, setHwTopic] = useState('');
  const [hwSource, setHwSource] = useState('');
  const [hwTargetCount, setHwTargetCount] = useState(50);
  const [hwDueDate, setHwDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [hwDesc, setHwDesc] = useState('');

  // Special Exam Form State
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState<ExamType>('TYT');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examCorrect, setExamCorrect] = useState(90);
  const [examWrong, setExamWrong] = useState(12);
  const [examBlank, setExamBlank] = useState(6);

  // Copy feedback
  const [copiedBadge, setCopiedBadge] = useState<string | null>(null);

  // Helper to get initials (e.g. "Ali Demir" -> "AD")
  const getInitials = (name: string) => {
    if (!name) return 'ÖG';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Filter students based on search query and status filter
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        st.name.toLowerCase().includes(q) ||
        (st.studentNumber && st.studentNumber.includes(q)) ||
        (st.password && st.password.includes(q)) ||
        st.pin.includes(q) ||
        (st.targetExam && st.targetExam.toLowerCase().includes(q)) ||
        st.phone.includes(q);

      if (!matchSearch) return false;

      if (filterType === 'ACTIVE_STREAK') return st.streak.status === 'active' && st.streak.count > 0;
      if (filterType === 'FROZEN') return st.streak.status === 'frozen';
      if (classroomFilter !== 'ALL') {
        const studentClasses = st.classroomIds || [];
        if (!studentClasses.includes(classroomFilter)) return false;
      }

      return true;
    });
  }, [students, searchTerm, filterType, classroomFilter]);

  // Compute rankings & statistics for each student
  const rankedStudents = useMemo(() => {
    return filteredStudents.map(st => {
      // Questions from completed schedules or question activities
      const questionActs = activities.filter(a => a.studentId === st.id && a.type === 'question_solved');
      const questionsCount = questionActs.reduce((acc, a) => {
        const match = a.detail.match(/(\d+)\s+soru/);
        return acc + (match ? parseInt(match[1], 10) : 35);
      }, 0);

      // Focus session minutes
      const studentFocus = focusSessions.filter(f => f.studentId === st.id);
      const totalFocusMinutes = studentFocus.reduce((acc, f) => acc + (f.durationMinutes || 0), 0);

      const streakDays = st.streak.count || 0;
      const rankScore = (questionsCount * 3) + totalFocusMinutes + (streakDays * 25);

      return {
        student: st,
        questionsCount,
        totalFocusMinutes,
        streakDays,
        rankScore,
      };
    }).sort((a, b) => {
      if (rankingSort === 'score') return b.rankScore - a.rankScore;
      if (rankingSort === 'questions') return b.questionsCount - a.questionsCount;
      if (rankingSort === 'duration') return b.totalFocusMinutes - a.totalFocusMinutes;
      if (rankingSort === 'streak') return b.streakDays - a.streakDays;
      if (rankingSort === 'name') return a.student.name.localeCompare(b.student.name);
      return 0;
    });
  }, [filteredStudents, activities, focusSessions, rankingSort]);

  // Filter activities for Audit Feed
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      if (activityTypeFilter === 'ALL') return true;
      return act.type === activityTypeFilter;
    });
  }, [activities, activityTypeFilter]);

  // Handler: Add Student
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const sNo = newStudentNumber.trim() || Math.floor(10000 + Math.random() * 90000).toString();
    const sPass = newStudentPassword.trim() || Math.floor(1000 + Math.random() * 9000).toString();

    addStudent({
      name: newStudentName.trim(),
      studentNumber: sNo,
      password: sPass,
      pin: `${sNo}${sPass}`.substring(0, 6),
      targetExam: newStudentExam,
      dailyQuestionTarget: Number(newStudentDailyTarget) || 100,
      phone: newStudentPhone.trim() || '-',
      notes: newStudentNotes.trim() || '',
      classroomIds: newStudentClassroomIds,
    });

    setIsAddStudentModalOpen(false);
    setNewStudentName('');
    setNewStudentDailyTarget(100);
    setNewStudentPhone('');
    setNewStudentNotes('');
    setNewStudentClassroomIds([]);
    setNewStudentNumber(Math.floor(10000 + Math.random() * 90000).toString());
    setNewStudentPassword(Math.floor(1000 + Math.random() * 9000).toString());
  };

  // Handler: Update Student
  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    updateStudent(editingStudent.id, {
      name: editingStudent.name,
      studentNumber: editingStudent.studentNumber || editingStudent.pin.substring(0, 5),
      password: editingStudent.password || editingStudent.pin.substring(editingStudent.pin.length - 4),
      pin: editingStudent.pin,
      targetExam: editingStudent.targetExam,
      dailyQuestionTarget: Number(editingStudent.dailyQuestionTarget) || 100,
      phone: editingStudent.phone,
      notes: editingStudent.notes,
      classroomIds: editStudentClassroomIds,
    });

    if (editStudentStreakCount !== (editingStudent.streak?.count || 0)) {
      await updateStudentStreakCount(editingStudent.id, Math.max(0, Number(editStudentStreakCount) || 0));
    }

    setEditingStudent(null);
  };

  // Handler: Add Program specifically for this student
  const handleCreateProgramForStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programTargetStudent || !programTopic.trim()) return;

    addScheduleItem({
      studentId: programTargetStudent.id,
      dayOfWeek: Number(programDay),
      sessionNumber: Number(programSession),
      timeRange: programTime.trim() || undefined,
      subject: programSubject,
      topic: programTopic.trim(),
      sourceBook: programSource.trim() || 'Ders Notları & Soru Bankası',
      targetType: programTargetType,
      targetValue: Number(programTargetVal),
      actualDurationMinutes: 0,
      teacherNote: programNote.trim(),
      status: 'pending',
    });

    setActionNotice(`"${programTopic}" dersi ${programTargetStudent.name} adlı öğrencinin programına eklendi.`);
    setTimeout(() => setActionNotice(null), 3500);
    setProgramTargetStudent(null);
    setProgramTopic('');
    setProgramSource('');
    setProgramNote('');
  };

  // Handler: Add Homework specifically for this student
  const handleCreateHomeworkForStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeworkTargetStudent || !hwTitle.trim() || !hwTopic.trim()) return;

    addHomework({
      studentId: homeworkTargetStudent.id,
      title: hwTitle.trim(),
      description: hwDesc.trim() || 'Verilen sorular eksiksiz çözülecek.',
      subject: hwSubject,
      topic: hwTopic.trim(),
      sourceBook: hwSource.trim() || 'Kaynak Kitap',
      targetQuestionCount: Number(hwTargetCount),
      dueDate: hwDueDate,
      status: 'pending',
    });

    setActionNotice(`"${hwTitle}" ödevi ${homeworkTargetStudent.name} adlı öğrenciye atandı.`);
    setTimeout(() => setActionNotice(null), 3500);
    setHomeworkTargetStudent(null);
    setHwTitle('');
    setHwTopic('');
    setHwDesc('');
  };

  // Handler: Add Trial Exam for this student
  const handleCreateExamForStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTargetStudent || !examTitle.trim()) return;

    const net = Number((examCorrect - examWrong / 4).toFixed(2));
    addTrialExam({
      studentId: examTargetStudent.id,
      title: examTitle.trim(),
      date: examDate,
      examType,
      sections: [
        { name: 'Genel Değerlendirme', correct: examCorrect, wrong: examWrong, blank: examBlank, net }
      ],
      totalCorrect: examCorrect,
      totalWrong: examWrong,
      totalBlank: examBlank,
      totalNet: net,
      errors: [],
    });

    setActionNotice(`"${examTitle}" (${net} Net) ${examTargetStudent.name} öğrencisinin denemelerine eklendi.`);
    setTimeout(() => setActionNotice(null), 3500);
    setExamTargetStudent(null);
    setExamTitle('');
  };

  const handleCopyCreds = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBadge(`${type}-${text}`);
    setTimeout(() => setCopiedBadge(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Öğrenciler
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsClassroomsModalOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 border border-indigo-500/20 transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Sınıfları Yönet"
          >
            <Layers className="w-4 h-4" />
            <span>Sınıfları Yönet ({classrooms.length})</span>
          </button>

          <button
            onClick={() => {
              setNewStudentPin(Math.floor(100000 + Math.random() * 900000).toString());
              setNewStudentClassroomIds([]);
              setIsAddStudentModalOpen(true);
            }}
            style={themeStyles.primaryBtn}
            className="px-4 py-2.5 rounded-2xl text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Öğrenci Ekle</span>
          </button>
        </div>
      </div>

      {/* View Mode Bar: Kart Görünümü vs Liste Görünümü vs Sıralama Listesi vs Canlı Öğrenci Akışı */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center flex-wrap p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/5 w-full md:w-auto gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-[#2C2C2E] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kart Görünümü ({students.length})</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white dark:bg-[#2C2C2E] text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Liste Görünümü</span>
          </button>

          <button
            onClick={() => setViewMode('ranking')}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'ranking'
                ? 'bg-white dark:bg-[#2C2C2E] text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Sıralama</span>
          </button>

          <button
            onClick={() => {
              setTrackerStudentId('ALL');
              setViewMode('study_tracker');
            }}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'study_tracker'
                ? 'bg-white dark:bg-[#2C2C2E] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>Bugün & 1 Hafta Takip</span>
          </button>

          <button
            onClick={() => setViewMode('activities')}
            className={`flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'activities'
                ? 'bg-white dark:bg-[#2C2C2E] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Canlı Akış ({activities.length})</span>
          </button>
        </div>
      </div>

      {viewMode === 'study_tracker' && (
        <TeacherStudyTrackerView initialStudentId={trackerStudentId} compact />
      )}

      {/* Search Bar & Filter Chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Öğrenci ara (İsim, numara, sınav)..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Chips: Status & Classrooms */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: `Tüm Öğrenciler (${students.length})` },
              { id: 'ACTIVE_STREAK', label: '🔥 Aktif Serililer' },
              { id: 'FROZEN', label: '❄️ Dondurulanlar' },
              { id: 'PENDING', label: '⚠️ Onay Bekleyenler' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'bg-white dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-black/5 dark:border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-neutral-400 font-semibold">
            {filteredStudents.length} öğrenci listeleniyor
          </span>
        </div>

        {/* Classroom Filter Chips if any classrooms defined */}
        {classrooms.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-neutral-400 mr-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-500" />
              <span>Sınıf Filtresi:</span>
            </span>
            <button
              onClick={() => setClassroomFilter('ALL')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                classroomFilter === 'ALL'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-white dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-400 border border-black/5 dark:border-white/5'
              }`}
            >
              Tümü
            </button>
            {classrooms.map(c => (
              <button
                key={c.id}
                onClick={() => setClassroomFilter(c.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                  classroomFilter === c.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-400 border border-black/5 dark:border-white/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || '#3B82F6' }} />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW: AUDIT FEED (CANLI ÖĞRENCİ HAREKETLERİ) */}
      {viewMode === 'activities' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>Canlı Öğrenci Hareketleri (Audit Feed)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Öğrencilerin soru çözümleri, tamamlanan sayaç oturumları ve sınıf girişleri Firebase üzerinden canlı akar.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {[
                { id: 'ALL', label: 'Tüm Olaylar' },
                { id: 'question_solved', label: 'Soru Çözümleri' },
                { id: 'focus_completed', label: 'Odak Sayaç' },
                { id: 'joined_class', label: 'Sınıfa Katılma' },
                { id: 'streak_active', label: 'Seri & Giriş' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActivityTypeFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    activityTypeFilter === f.id
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1C1C1E] border border-dashed border-black/10 dark:border-white/10 space-y-2">
              <Activity className="w-10 h-10 text-neutral-400 mx-auto" />
              <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                Henüz kayıtlı öğrenci hareketi yok
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                Öğrenciler soru girdiğinde, odak sayacını tamamladığında veya sınıfa katıldığında hareketleri anlık burada listelenecektir.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredActivities.map(act => (
                <div
                  key={act.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs flex items-start justify-between gap-3 hover:border-black/15 dark:hover:border-white/15 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                      act.type === 'question_solved'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : act.type === 'focus_completed'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : act.type === 'joined_class'
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {act.type === 'question_solved' ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : act.type === 'focus_completed' ? (
                        <Clock className="w-4 h-4" />
                      ) : act.type === 'joined_class' ? (
                        <Layers className="w-4 h-4" />
                      ) : (
                        <Flame className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                          {act.studentName}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {act.title}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                        {act.detail}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-neutral-400 whitespace-nowrap shrink-0 mt-1">
                    {new Date(act.timestamp).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: RANKING TABLE (SIRALAMA LİSTESİ) */}
      {viewMode === 'ranking' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-neutral-400 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sıralama Ölçütü:</span>
              </span>
              {[
                { id: 'score', label: '🏆 Başarı Puanı' },
                { id: 'questions', label: '📝 Çözülen Soru' },
                { id: 'duration', label: '⏱️ Odak Süresi' },
                { id: 'streak', label: '🔥 Seri Gün' },
                { id: 'name', label: '🔤 İsim' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setRankingSort(opt.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    rankingSort === opt.id
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-400 border border-black/5 dark:border-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-neutral-400 font-semibold">
              {rankedStudents.length} öğrenci listelendi
            </span>
          </div>

          <div className="w-full overflow-x-auto rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[760px]">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 text-[11px] uppercase tracking-wider text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/30">
                  <th className="py-3.5 px-4 font-bold text-center w-12">Sıra</th>
                  <th className="py-3.5 px-4 font-bold">Öğrenci</th>
                  <th className="py-3.5 px-3 font-bold text-center">Giriş (No / Şifre)</th>
                  <th className="py-3.5 px-3 font-bold">Sınıflar</th>
                  <th className="py-3.5 px-3 font-bold">Hedef Sınav</th>
                  <th className="py-3.5 px-3 font-bold text-center">Soru Sayısı</th>
                  <th className="py-3.5 px-3 font-bold text-center">Çalışma Süresi</th>
                  <th className="py-3.5 px-3 font-bold text-center">Seri</th>
                  <th className="py-3.5 px-4 font-bold text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {rankedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-neutral-400">
                      Öğrenci bulunamadı.
                    </td>
                  </tr>
                ) : (
                  rankedStudents.map((item, index) => {
                    const st = item.student;
                    const isSelected = st.id === currentStudentId;
                    const stClasses = classrooms.filter(c =>
                      (st.classroomIds || []).includes(c.id) || (c.studentIds || []).includes(st.id)
                    );
                    const stdNo = st.studentNumber || st.pin.substring(0, 5);
                    const stdPass = st.password || st.pin.substring(st.pin.length - 4);

                    return (
                      <tr
                        key={st.id}
                        className={`hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors ${
                          isSelected ? 'bg-blue-500/5' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          {index === 0 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-500 text-white font-extrabold text-xs shadow-xs">
                              🥇
                            </span>
                          ) : index === 1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-400 text-white font-extrabold text-xs shadow-xs">
                              🥈
                            </span>
                          ) : index === 2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-700 text-white font-extrabold text-xs shadow-xs">
                              🥉
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-neutral-400 text-xs">
                              #{index + 1}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {getInitials(st.name)}
                            </div>
                            <div>
                              <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                <span>{st.name}</span>
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                )}
                              </div>
                              <div className="text-[10px] text-neutral-400">{st.phone || '-'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                            <button
                              onClick={() => handleCopyCreds(stdNo, 'no')}
                              className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-1 cursor-pointer"
                              title="Numarayı Kopyala"
                            >
                              <span>No:{stdNo}</span>
                              {copiedBadge === `no-${stdNo}` ? (
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 opacity-50" />
                              )}
                            </button>
                            <button
                              onClick={() => handleCopyCreds(stdPass, 'pass')}
                              className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-1 cursor-pointer"
                              title="Şifreyi Kopyala"
                            >
                              <span>Şifre:{stdPass}</span>
                              {copiedBadge === `pass-${stdPass}` ? (
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 opacity-50" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 flex-wrap max-w-[160px]">
                            {stClasses.length > 0 ? (
                              stClasses.map(c => (
                                <span
                                  key={c.id}
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${c.color || '#3B82F6'}18`,
                                    color: c.color || '#3B82F6'
                                  }}
                                >
                                  {c.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-neutral-400 italic">-</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {st.targetExam || 'YKS'}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            Hedef: {st.dailyQuestionTarget ? `${st.dailyQuestionTarget} Soru` : '100 Soru'}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-xs">
                            {item.questionsCount}
                          </span>
                          <span className="text-[10px] text-neutral-400 ml-1">soru</span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300 text-xs">
                            {item.totalFocusMinutes > 60
                              ? `${Math.floor(item.totalFocusMinutes / 60)} sa ${item.totalFocusMinutes % 60} dk`
                              : `${item.totalFocusMinutes} dk`}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {st.streak.status === 'active' && item.streakDays > 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-500 text-xs">
                              <Flame className="w-3.5 h-3.5 fill-amber-500" />
                              <span>{item.streakDays} Gün</span>
                            </span>
                          ) : st.streak.status === 'frozen' ? (
                            <span className="inline-flex items-center gap-1 font-bold text-cyan-500 text-xs">
                              <Snowflake className="w-3.5 h-3.5" />
                              <span>Donduruldu</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400 text-xs">0 Gün</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setCurrentStudentId(st.id);
                                onNavigateTab('schedule');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-[11px] hover:opacity-90 transition-all cursor-pointer"
                              title="Haftalık Programını Aç"
                            >
                              Program
                            </button>
                            <button
                              onClick={() => {
                                setProgramTargetStudent(st);
                                setProgramTopic('');
                              }}
                              className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                              title="Ders Ekle"
                            >
                              <Plus className="w-3.5 h-3.5 text-blue-500" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingStudent(st);
                                setEditStudentClassroomIds(st.classroomIds || []);
                                setEditStudentStreakCount(st.streak?.count || 0);
                              }}
                              className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                              title="Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {deletingStudentId === st.id ? (
                              <div className="flex items-center gap-1 animate-in fade-in">
                                <button
                                  onClick={() => {
                                    deleteStudent(st.id);
                                    setDeletingStudentId(null);
                                  }}
                                  className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-xs cursor-pointer"
                                  title="Öğrenciyi Kalıcı Olarak Sil"
                                >
                                  Sil
                                </button>
                                <button
                                  onClick={() => setDeletingStudentId(null)}
                                  className="px-1.5 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-semibold cursor-pointer"
                                  title="İptal"
                                >
                                  Vazgeç
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingStudentId(st.id)}
                                className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500 cursor-pointer"
                                title="Öğrenciyi Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: LIST VIEW (ÖĞRENCİ LİSTE GÖRÜNÜMÜ) */}
      {viewMode === 'list' && (
        <div className="w-full overflow-x-auto rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[780px]">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5 text-[11px] uppercase tracking-wider text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/30">
                <th className="py-3.5 px-4 font-bold">Öğrenci</th>
                <th className="py-3.5 px-3 font-bold">Öğrenci No / Kod</th>
                <th className="py-3.5 px-3 font-bold">Şifre & PIN</th>
                <th className="py-3.5 px-3 font-bold">Sınıflar</th>
                <th className="py-3.5 px-3 font-bold">Hedef Sınav</th>
                <th className="py-3.5 px-3 font-bold text-center">Günlük Hedef</th>
                <th className="py-3.5 px-3 font-bold text-center">Seri</th>
                <th className="py-3.5 px-4 font-bold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-400">
                    Öğrenci bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(st => {
                  const isSelected = st.id === currentStudentId;
                  const stClasses = classrooms.filter(c =>
                    (st.classroomIds || []).includes(c.id) || (c.studentIds || []).includes(st.id)
                  );
                  const stdNo = st.studentNumber || st.pin.substring(0, 5);
                  const stdPass = st.password || st.pin.substring(st.pin.length - 4);

                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors ${
                        isSelected ? 'bg-blue-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {getInitials(st.name)}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                              <span>{st.name}</span>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                            </div>
                            <div className="text-[10px] text-neutral-400">{st.phone || '-'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleCopyCreds(stdNo, 'no')}
                          className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-mono font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                          title="Öğrenci Numarasını Kopyala"
                        >
                          <span>No: {stdNo}</span>
                          {copiedBadge === `no-${stdNo}` ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-50" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <button
                            onClick={() => handleCopyCreds(stdPass, 'pass')}
                            className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-1 cursor-pointer"
                            title="Şifreyi Kopyala"
                          >
                            <span>Şifre: {stdPass}</span>
                            {copiedBadge === `pass-${stdPass}` ? (
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 opacity-50" />
                            )}
                          </button>
                          <span className="text-neutral-400">PIN: {st.pin}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 flex-wrap max-w-[160px]">
                          {stClasses.length > 0 ? (
                            stClasses.map(c => (
                              <span
                                key={c.id}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: `${c.color || '#3B82F6'}18`,
                                  color: c.color || '#3B82F6'
                                }}
                              >
                                {c.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-neutral-400">-</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                        {st.targetExam || 'YKS'}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-neutral-700 dark:text-neutral-300">
                        {st.dailyQuestionTarget || 100} Soru
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-500 text-xs font-mono">
                            <Flame className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{st.streak?.count || 0}G</span>
                          </span>
                          {st.streak?.lastActiveDate === todayStr && (st.streak?.count || 0) > 0 ? (
                            <span className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 font-semibold text-[10px]">
                              Bugün Eklendi
                            </span>
                          ) : (
                            <button
                              onClick={async () => {
                                const added = await addTeacherDailyStreak(st.id);
                                if (added) {
                                  setActionNotice(`${st.name}: +1 seri eklendi.`);
                                } else {
                                  setActionNotice(`${st.name} için bugün zaten seri eklenmiş.`);
                                }
                                setTimeout(() => setActionNotice(null), 3000);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 font-bold text-[10px] cursor-pointer"
                              title="+1 Günlük Seri Ekle"
                            >
                              +1 Seri
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setCurrentStudentId(st.id);
                              onNavigateTab('schedule');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-[11px] hover:opacity-90 transition-all cursor-pointer"
                          >
                            Program
                          </button>
                          <button
                            onClick={() => {
                              setEditingStudent(st);
                              setEditStudentClassroomIds(st.classroomIds || []);
                              setEditStudentStreakCount(st.streak?.count || 0);
                            }}
                            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                            title="Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {deletingStudentId === st.id ? (
                            <div className="flex items-center gap-1 animate-in fade-in">
                              <button
                                onClick={() => {
                                  deleteStudent(st.id);
                                  setDeletingStudentId(null);
                                }}
                                className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-xs cursor-pointer"
                              >
                                Sil
                              </button>
                              <button
                                onClick={() => setDeletingStudentId(null)}
                                className="px-1.5 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-semibold cursor-pointer"
                              >
                                İptal
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingStudentId(st.id)}
                              className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500 cursor-pointer"
                              title="Öğrenciyi Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW: CARDS GRID (KART GÖRÜNÜMÜ) */}
      {viewMode === 'grid' && (
        <>
          {students.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 text-center">
              <div className="w-14 h-14 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3 font-bold">
                <UserCheck className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">
                Henüz Kayıtlı Öğrenci Bulunmuyor
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-5">
                Sisteme ilk öğrencinizi ekleyerek başlayın. Öğrenciye özel PIN kodu verilecek ve ona bağımsız çalışma programı hazırlayabileceksiniz.
              </p>
              <button
                onClick={() => {
                  setNewStudentPin(Math.floor(100000 + Math.random() * 900000).toString());
                  setIsAddStudentModalOpen(true);
                }}
                style={themeStyles.primaryBtn}
                className="px-5 py-2.5 rounded-2xl text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>İlk Öğrenciyi Ekle</span>
              </button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 text-center text-xs text-neutral-400">
              "{searchTerm}" aramasına uygun öğrenci bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredStudents.map(st => {
            const isSelected = st.id === currentStudentId;
            const studentSchedules = schedules.filter(s => s.studentId === st.id);
            const studentHws = homeworks.filter(h => h.studentId === st.id);
            const studentExams = trialExams.filter(e => e.studentId === st.id);
            const initials = getInitials(st.name);

            return (
              <div
                key={st.id}
                className={`p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/15'
                }`}
              >
                <div>
                  {/* Student Header: Initials Monogram (NO PHOTO!), Name, PIN */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Clean Monogram Badge (NO PHOTO) */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 text-white dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
                        {initials}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                            {st.name}
                          </h3>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                              Aktif Seçili
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                          {st.targetExam}
                        </div>
                      </div>
                    </div>

                    {/* AKD Code, 5-Digit Number & 4-Digit Password Badges */}
                    <div className="flex flex-col items-end gap-1">
                      {(() => {
                        const stCls = classrooms.find(c => (st.classroomIds || []).includes(c.id));
                        const akdCode = stCls?.code || classrooms[0]?.code;
                        if (!akdCode) return null;
                        return (
                          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500/20 text-xs">
                            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold">AKD:</span>
                            <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-300 tracking-wider">
                              {akdCode}
                            </span>
                            <button
                              onClick={() => handleCopyCreds(akdCode, 'akd')}
                              className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 transition-colors ml-0.5 cursor-pointer"
                              title="AKD Sınıf Kodunu Kopyala"
                            >
                              {copiedBadge === `akd-${akdCode}` ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        );
                      })()}

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs">
                        <span className="text-[10px] text-neutral-400 font-bold">No:</span>
                        <span className="font-mono font-extrabold text-neutral-900 dark:text-white tracking-wider">
                          {st.studentNumber || st.pin.substring(0, 5)}
                        </span>
                        <button
                          onClick={() => handleCopyCreds(st.studentNumber || st.pin.substring(0, 5), 'no')}
                          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors ml-0.5"
                          title="Öğrenci Numarasını Kopyala"
                        >
                          {copiedBadge === `no-${st.studentNumber || st.pin.substring(0, 5)}` ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs">
                        <span className="text-[10px] text-neutral-400 font-bold">Şifre:</span>
                        <span className="font-mono font-bold text-neutral-900 dark:text-white tracking-wider">
                          {st.password || st.pin.substring(st.pin.length - 4)}
                        </span>
                        <button
                          onClick={() => handleCopyCreds(st.password || st.pin.substring(st.pin.length - 4), 'pass')}
                          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors ml-0.5"
                          title="Öğrenci Şifresini Kopyala"
                        >
                          {copiedBadge === `pass-${st.password || st.pin.substring(st.pin.length - 4)}` ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Target details */}
                  <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-black/5 dark:border-white/5 text-xs space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 flex items-center gap-1">
                        <Target className="w-3 h-3 text-rose-500" />
                        <span>Günlük Hedef:</span>
                      </span>
                      <strong className="text-neutral-800 dark:text-neutral-200 font-mono">
                        {st.dailyQuestionTarget ? `${st.dailyQuestionTarget} Soru` : '100 Soru'}
                      </strong>
                    </div>

                    {st.phone && st.phone !== '-' && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-neutral-500">İletişim:</span>
                        <span className="text-neutral-700 dark:text-neutral-300">{st.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Enrolled Classrooms Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3 px-1">
                    <span className="text-[10px] text-neutral-400 font-bold flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-500" />
                      <span>Sınıflar:</span>
                    </span>
                    {classrooms.filter(c => (st.classroomIds || []).includes(c.id) || (c.studentIds || []).includes(st.id)).length === 0 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-400 font-medium">
                        Sınıfsız
                      </span>
                    ) : (
                      classrooms.filter(c => (st.classroomIds || []).includes(c.id) || (c.studentIds || []).includes(st.id)).map(c => (
                        <span
                          key={c.id}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `${c.color || '#3B82F6'}18`,
                            color: c.color || '#3B82F6'
                          }}
                        >
                          {c.name}
                        </span>
                      ))
                    )}
                  </div>

                  {/* Summary counts pill */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                    <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80">
                      <div className="text-[10px] text-neutral-400">Program Dersleri</div>
                      <div className="font-bold font-mono text-neutral-900 dark:text-white mt-0.5">
                        {studentSchedules.length} Ders
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80">
                      <div className="text-[10px] text-neutral-400">Ödevler</div>
                      <div className="font-bold font-mono text-neutral-900 dark:text-white mt-0.5">
                        {studentHws.length} Ödev
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80">
                      <div className="text-[10px] text-neutral-400">Deneme Sınavı</div>
                      <div className="font-bold font-mono text-neutral-900 dark:text-white mt-0.5">
                        {studentExams.length} Deneme
                      </div>
                    </div>
                  </div>
                </div>

                {/* Individual Actions for this Student */}
                <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
                  {/* Top action: Select student & view their weekly schedule */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCurrentStudentId(st.id);
                        onNavigateTab('schedule');
                      }}
                      className="flex-1 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-all cursor-pointer shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Haftalık Programını Aç</span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentStudentId(st.id);
                        setRole('student');
                        onNavigateTab('schedule');
                      }}
                      className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      title="Öğrenci olarak giriş yap ve gör"
                    >
                      <span>Öğrenci Olarak Aç</span>
                    </button>
                  </div>

                  {/* Individual Assignment Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        setProgramTargetStudent(st);
                        setProgramTopic('');
                      }}
                      className="py-1.5 px-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
                      title="Bu öğrenciye özel ders ekle"
                    >
                      <Plus className="w-3 h-3 text-blue-500" />
                      <span>Ders Ekle</span>
                    </button>

                    <button
                      onClick={() => {
                        setHomeworkTargetStudent(st);
                        setHwTitle('');
                        setHwTopic('');
                      }}
                      className="py-1.5 px-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
                      title="Bu öğrenciye ödev ata"
                    >
                      <CheckSquare className="w-3 h-3 text-emerald-500" />
                      <span>Ödev Ata</span>
                    </button>

                    <button
                      onClick={() => {
                        setExamTargetStudent(st);
                        setExamTitle('');
                      }}
                      className="py-1.5 px-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
                      title="Bu öğrenciye deneme sonucu gir"
                    >
                      <BarChart3 className="w-3 h-3 text-purple-500" />
                      <span>Deneme Gir</span>
                    </button>
                  </div>

                  <div className="pt-1.5">
                    <button
                      onClick={() => {
                        setTrackerStudentId(st.id);
                        setViewMode('study_tracker');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Bugün & 1 Hafta Önceki Çalışmalarını Gör</span>
                    </button>
                  </div>

                  {/* Edit / +1 Streak / Delete actions */}
                  <div className="flex items-center justify-between pt-2 text-xs text-neutral-400">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setEditingStudent(st);
                          setEditStudentClassroomIds(st.classroomIds || []);
                          setEditStudentStreakCount(st.streak?.count || 0);
                        }}
                        className="hover:text-blue-500 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Düzenle</span>
                      </button>

                      {st.streak?.lastActiveDate === todayStr && (st.streak?.count || 0) > 0 ? (
                        <span className="text-neutral-400 font-semibold flex items-center gap-1 text-[11px]">
                          <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>Bugün Eklendi ({st.streak?.count || 0}G)</span>
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            const added = await addTeacherDailyStreak(st.id);
                            if (added) {
                              setActionNotice(`${st.name}: +1 seri eklendi.`);
                            } else {
                              setActionNotice(`${st.name} için bugün zaten seri eklenmiş.`);
                            }
                            setTimeout(() => setActionNotice(null), 3000);
                          }}
                          className="text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>+1 Seri ({st.streak?.count || 0}G)</span>
                        </button>
                      )}
                    </div>

                    {deletingStudentId === st.id ? (
                      <div className="flex items-center gap-1 animate-in fade-in">
                        <button
                          onClick={() => {
                            deleteStudent(st.id);
                            setDeletingStudentId(null);
                          }}
                          className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-xs cursor-pointer"
                        >
                          Silinsin
                        </button>
                        <button
                          onClick={() => setDeletingStudentId(null)}
                          className="px-1.5 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-semibold cursor-pointer"
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingStudentId(st.id)}
                        className="hover:text-rose-500 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Öğrenciyi Sil</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  )}

      {/* Modal: Yeni Öğrenci Ekle (NO PHOTO) */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-7 min-w-0 break-words">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
              Yeni Öğrenci Kaydı
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Öğrenci bilgilerini girin. Giriş için 6 haneli özel PIN kodu oluşturulur.
            </p>

            <form onSubmit={handleCreateStudent} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Öğrenci Adı Soyadı
                </label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    5 Haneli Öğrenci No *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      maxLength={5}
                      value={newStudentNumber}
                      onChange={e => setNewStudentNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-mono font-bold text-neutral-900 dark:text-white text-center"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setNewStudentNumber(Math.floor(10000 + Math.random() * 90000).toString())}
                      className="p-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-xs font-bold shrink-0"
                      title="Yeni Numara üret"
                    >
                      Yeni
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    4 Haneli Şifre *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      maxLength={4}
                      value={newStudentPassword}
                      onChange={e => setNewStudentPassword(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-mono font-bold text-neutral-900 dark:text-white text-center"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setNewStudentPassword(Math.floor(1000 + Math.random() * 9000).toString())}
                      className="p-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-xs font-bold shrink-0"
                      title="Yeni Şifre üret"
                    >
                      Yeni
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Hedef Sınav
                </label>
                <select
                  value={newStudentExam}
                  onChange={e => setNewStudentExam(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                >
                  <option value="YKS (Sayısal)">YKS (Sayısal)</option>
                  <option value="YKS (Eşit Ağırlık)">YKS (Eşit Ağırlık)</option>
                  <option value="YKS (Sözel / Dil)">YKS (Sözel / Dil)</option>
                  <option value="LGS">LGS</option>
                  <option value="MSÜ">MSÜ</option>
                  <option value="KPSS">KPSS</option>
                  <option value="DGS / ALES">DGS / ALES</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Günlük Hedef Soru Sayısı
                </label>
                <input
                  type="number"
                  min={1}
                  value={newStudentDailyTarget}
                  onChange={e => setNewStudentDailyTarget(Number(e.target.value))}
                  placeholder="Örn: 100"
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  İletişim Telefon Numarası
                </label>
                <input
                  type="text"
                  value={newStudentPhone}
                  onChange={e => setNewStudentPhone(e.target.value)}
                  placeholder="Örn: 0532 123 45 67"
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Koçluk Notu / Başlangıç Seviyesi
                </label>
                <textarea
                  value={newStudentNotes}
                  onChange={e => setNewStudentNotes(e.target.value)}
                  placeholder="Öğrencinin çalışma alışkanlıkları ve hedefleri..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                />
              </div>

              {/* Multi-classroom assignment */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Dahil Edileceği Sınıflar (Birden fazla seçilebilir)
                </label>
                {classrooms.length === 0 ? (
                  <p className="text-[11px] text-neutral-400 italic">
                    Henüz sınıf tanımlanmadı. "Sınıfları Yönet" butonundan yeni sınıf oluşturabilirsiniz.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5">
                    {classrooms.map(c => {
                      const isChecked = newStudentClassroomIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setNewStudentClassroomIds([...newStudentClassroomIds, c.id]);
                              } else {
                                setNewStudentClassroomIds(newStudentClassroomIds.filter(id => id !== c.id));
                              }
                            }}
                            className="rounded accent-indigo-600"
                          />
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color || '#3B82F6' }} />
                          <span className="truncate">{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  style={themeStyles.primaryBtn}
                  className="px-5 py-2.5 rounded-xl text-white font-bold cursor-pointer"
                >
                  Öğrenciyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Öğrenci Düzenle & PIN Yenile */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-7 min-w-0 break-words">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
              Öğrenci Bilgilerini Düzenle
            </h3>

            <form onSubmit={handleUpdateStudent} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Adı Soyadı
                </label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    5 Haneli Öğrenci No
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      maxLength={5}
                      value={editingStudent.studentNumber || editingStudent.pin.substring(0, 5)}
                      onChange={e => setEditingStudent({
                        ...editingStudent,
                        studentNumber: e.target.value.replace(/\D/g, '')
                      })}
                      className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-mono font-bold text-center"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setEditingStudent({
                        ...editingStudent,
                        studentNumber: Math.floor(10000 + Math.random() * 90000).toString()
                      })}
                      className="p-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-xs font-bold"
                      title="Yeni Numara üret"
                    >
                      Yeni
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    4 Haneli Şifre
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      maxLength={4}
                      value={editingStudent.password || editingStudent.pin.substring(editingStudent.pin.length - 4)}
                      onChange={e => setEditingStudent({
                        ...editingStudent,
                        password: e.target.value.replace(/\D/g, ''),
                        pin: `${editingStudent.studentNumber || ''}${e.target.value.replace(/\D/g, '')}`.substring(0, 6)
                      })}
                      className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-mono font-bold text-center"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newP = Math.floor(1000 + Math.random() * 9000).toString();
                        setEditingStudent({
                          ...editingStudent,
                          password: newP,
                          pin: `${editingStudent.studentNumber || ''}${newP}`.substring(0, 6)
                        });
                      }}
                      className="p-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-xs font-bold"
                      title="Yeni Şifre üret"
                    >
                      Yeni
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Hedef Sınav
                </label>
                <input
                  type="text"
                  value={editingStudent.targetExam}
                  onChange={e => setEditingStudent({ ...editingStudent, targetExam: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Günlük Hedef Soru
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingStudent.dailyQuestionTarget || 100}
                    onChange={e => setEditingStudent({ ...editingStudent, dailyQuestionTarget: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Seri Günü
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editStudentStreakCount}
                    onChange={e => setEditStudentStreakCount(Math.max(0, Number(e.target.value)))}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-mono font-bold text-amber-600 dark:text-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Telefon
                </label>
                <input
                  type="text"
                  value={editingStudent.phone}
                  onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Notlar
                </label>
                <textarea
                  value={editingStudent.notes}
                  onChange={e => setEditingStudent({ ...editingStudent, notes: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                />
              </div>

              {/* Multi-classroom assignment */}
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Dahil Olduğu Sınıflar (Birden fazla seçilebilir)
                </label>
                {classrooms.length === 0 ? (
                  <p className="text-[11px] text-neutral-400 italic">
                    Henüz sınıf tanımlanmadı.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5">
                    {classrooms.map(c => {
                      const isChecked = editStudentClassroomIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setEditStudentClassroomIds([...editStudentClassroomIds, c.id]);
                              } else {
                                setEditStudentClassroomIds(editStudentClassroomIds.filter(id => id !== c.id));
                              }
                            }}
                            className="rounded accent-indigo-600"
                          />
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color || '#3B82F6' }} />
                          <span className="truncate">{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold"
                >
                  Güncellemeleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bu Öğrenciye Özel Haftalık Ders / Program Ekle */}
      {programTargetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-7 min-w-0 break-words">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
              Özel Program Ekle: {programTargetStudent.name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Bu ders sadece <strong className="text-neutral-900 dark:text-white">{programTargetStudent.name}</strong> öğrencisinin haftalık programına eklenecektir.
            </p>

            <form onSubmit={handleCreateProgramForStudent} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Gün
                  </label>
                  <select
                    value={programDay}
                    onChange={e => setProgramDay(Number(e.target.value))}
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
                    Oturum Sırası
                  </label>
                  <select
                    value={programSession}
                    onChange={e => setProgramSession(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-mono font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n}. Oturum</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Saat Aralığı <span className="font-normal text-neutral-400">(İsteğe Bağlı)</span>
                </label>
                <input
                  type="text"
                  value={programTime}
                  onChange={e => setProgramTime(e.target.value)}
                  placeholder="Örn: 09:00 - 10:30 (Boş bırakılabilir)"
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Ders Adı
                  </label>
                  <input
                    type="text"
                    value={programSubject}
                    onChange={e => setProgramSubject(e.target.value)}
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
                    value={programTopic}
                    onChange={e => setProgramTopic(e.target.value)}
                    placeholder="Örn: Fonksiyonlar ve Grafik Çizimi"
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Kaynak Kitap / Fasikül
                </label>
                <input
                  type="text"
                  value={programSource}
                  onChange={e => setProgramSource(e.target.value)}
                  placeholder="Örn: 3D Soru Bankası Test 4-6"
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Hedef Türü
                  </label>
                  <select
                    value={programTargetType}
                    onChange={e => setProgramTargetType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                  >
                    <option value="question">Soru Sayısı</option>
                    <option value="duration">Çalışma Süresi (Dk)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Hedef Miktar
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={programTargetVal}
                    onChange={e => setProgramTargetVal(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Öğretmen Notu
                </label>
                <input
                  type="text"
                  value={programNote}
                  onChange={e => setProgramNote(e.target.value)}
                  placeholder="Örn: Süre tutarak çöz, takıldığın soruları işaretle."
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setProgramTargetStudent(null)}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold"
                >
                  Programa Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bu Öğrenciye Özel Ödev Ata */}
      {homeworkTargetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-7 min-w-0 break-words">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
              Özel Ödev Ata: {homeworkTargetStudent.name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Öğrencinin ödev takip listesine eklenecektir.
            </p>

            <form onSubmit={handleCreateHomeworkForStudent} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Ödev Başlığı
                </label>
                <input
                  type="text"
                  value={hwTitle}
                  onChange={e => setHwTitle(e.target.value)}
                  placeholder="Örn: Polinomlar Karma Test 1-3"
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Ders
                  </label>
                  <input
                    type="text"
                    value={hwSubject}
                    onChange={e => setHwSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Konu
                  </label>
                  <input
                    type="text"
                    value={hwTopic}
                    onChange={e => setHwTopic(e.target.value)}
                    placeholder="Polinomlar"
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Hedef Soru
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={hwTargetCount}
                    onChange={e => setHwTargetCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Son Teslim Tarihi
                  </label>
                  <input
                    type="date"
                    value={hwDueDate}
                    onChange={e => setHwDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Kaynak Kitap
                </label>
                <input
                  type="text"
                  value={hwSource}
                  onChange={e => setHwSource(e.target.value)}
                  placeholder="Örn: Orijinal AYT Matematik"
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Açıklama / Yönerge
                </label>
                <textarea
                  value={hwDesc}
                  onChange={e => setHwDesc(e.target.value)}
                  rows={2}
                  placeholder="Detaylar..."
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setHomeworkTargetStudent(null)}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                >
                  Ödevi Ata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bu Öğrenciye Özel Deneme Sınavı Ekle */}
      {examTargetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-7 min-w-0 break-words">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
              Deneme Sonucu Ekle: {examTargetStudent.name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Öğrencinin deneme ve soru analiz kayıtlarına işlenecektir.
            </p>

            <form onSubmit={handleCreateExamForStudent} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Deneme Adı / Yayın
                  </label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={e => setExamTitle(e.target.value)}
                    placeholder="Örn: Özdebir TYT-1"
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Tür
                  </label>
                  <select
                    value={examType}
                    onChange={e => setExamType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                    <option value="LGS">LGS</option>
                    <option value="Branş">Branş</option>
                    <option value="MSÜ">MSÜ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tarih
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-2.5 rounded-xl bg-emerald-500/10">
                  <span className="text-[10px] font-bold text-emerald-600 block mb-1">Doğru</span>
                  <input
                    type="number"
                    min="0"
                    value={examCorrect}
                    onChange={e => setExamCorrect(Number(e.target.value))}
                    className="w-full text-center font-bold text-base text-emerald-600 bg-transparent"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/10">
                  <span className="text-[10px] font-bold text-rose-600 block mb-1">Yanlış</span>
                  <input
                    type="number"
                    min="0"
                    value={examWrong}
                    onChange={e => setExamWrong(Number(e.target.value))}
                    className="w-full text-center font-bold text-base text-rose-600 bg-transparent"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-800">
                  <span className="text-[10px] font-bold text-neutral-500 block mb-1">Boş</span>
                  <input
                    type="number"
                    min="0"
                    value={examBlank}
                    onChange={e => setExamBlank(Number(e.target.value))}
                    className="w-full text-center font-bold text-base text-neutral-700 dark:text-neutral-300 bg-transparent"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex justify-between">
                <span>Hesaplanan Net:</span>
                <span className="font-mono text-base">
                  {(examCorrect - examWrong / 4).toFixed(2)} Net
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setExamTargetStudent(null)}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold"
                >
                  Denemeyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classrooms & Multi-Class Memberships Modal */}
      <ClassroomsModal
        isOpen={isClassroomsModalOpen}
        onClose={() => setIsClassroomsModalOpen(false)}
      />
    </div>
  );
};
