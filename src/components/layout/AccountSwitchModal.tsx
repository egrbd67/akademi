import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  UserCheck,
  Shield,
  Search,
  Key,
  Copy,
  Check,
  Flame,
  Snowflake,
  AlertTriangle,
  Plus,
  RefreshCw,
  Layers,
  ArrowRight,
  Sparkles,
  Cloud,
  CheckCircle2,
  Lock,
  Hash,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { getThemeStyles } from '../theme/ThemeCustomizerModal';

interface AccountSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenClassroomsModal?: () => void;
  onNavigateTab: (tab: string) => void;
}

export const AccountSwitchModal: React.FC<AccountSwitchModalProps> = ({
  isOpen,
  onClose,
  onOpenClassroomsModal,
  onNavigateTab,
}) => {
  const {
    role,
    setRole,
    currentStudentId,
    setCurrentStudentId,
    students,
    classrooms,
    currentTeacher,
    isCloudSyncing,
    lastCloudSync,
    syncWithCloud,
    cloudLoginWithStudentCredentials,
    loginTeacherCredentials,
    boxTheme
  } = useApp();

  const themeStyles = getThemeStyles(boxTheme);

  const [activeTab, setActiveTab] = useState<'switch_list' | 'student_login' | 'teacher_login'>('switch_list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  // Teacher name and password input state
  const [teacherNameInput, setTeacherNameInput] = useState('');
  const [teacherPasswordInput, setTeacherPasswordInput] = useState('');
  const [teacherBranchInput, setTeacherBranchInput] = useState('Matematik');
  const [teacherLoginError, setTeacherLoginError] = useState<string | null>(null);
  const [teacherLoginSuccess, setTeacherLoginSuccess] = useState<string | null>(null);
  const [isTeacherLoading, setIsTeacherLoading] = useState(false);

  // Student 5-digit number and 4-digit password input state
  const [studentNumberInput, setStudentNumberInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState<string | null>(null);

  // Initials generator (strictly no photos)
  const getInitials = (name: string) => {
    if (!name) return 'ÖG';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Filter students based on search and classroom
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        st.name.toLowerCase().includes(q) ||
        (st.studentNumber && st.studentNumber.includes(q)) ||
        (st.password && st.password.includes(q)) ||
        st.pin.includes(q) ||
        (st.targetExam && st.targetExam.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedClassFilter !== 'ALL') {
        const studentClasses = st.classroomIds || [];
        const isInSelectedClass = studentClasses.includes(selectedClassFilter);
        if (!isInSelectedClass) return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedClassFilter]);

  // Switch to teacher
  const handleSelectTeacher = () => {
    setRole('teacher');
    onClose();
  };

  // Switch to specific student
  const handleSelectStudent = (studentId: string) => {
    setCurrentStudentId(studentId);
    setRole('student');
    onClose();
  };

  // Student 5-digit number and 4-digit password cloud login
  const handleStudentCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNumberInput.trim() || !passwordInput.trim()) return;

    setLoginError(null);
    setLoginSuccess(null);
    setIsLoading(true);

    try {
      const res = await cloudLoginWithStudentCredentials(
        studentNumberInput.trim(),
        passwordInput.trim()
      );
      if (res.success && res.student) {
        setLoginSuccess(`Giriş başarılı! Hoş geldin, ${res.student.name}`);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setLoginError(res.message || 'Geçersiz 5 haneli Numara veya 4 haneli Şifre!');
      }
    } catch {
      setLoginError('Bulut sunucusu ile bağlantı kurulamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  // Teacher Name & Password login handler
  const handleTeacherCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherNameInput.trim() || !teacherPasswordInput.trim()) return;

    setTeacherLoginError(null);
    setTeacherLoginSuccess(null);
    setIsTeacherLoading(true);

    try {
      const res = await loginTeacherCredentials(
        teacherNameInput.trim(),
        teacherPasswordInput.trim(),
        teacherBranchInput
      );
      if (res.success && res.teacher) {
        setTeacherLoginSuccess(`Giriş başarılı! Hoş geldiniz, Sn. ${res.teacher.name}`);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setTeacherLoginError(res.error || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
      }
    } catch {
      setTeacherLoginError('Giriş yapılırken sunucu hatası oluştu.');
    } finally {
      setIsTeacherLoading(false);
    }
  };

  const handleCopy = (e: React.MouseEvent, text: string, label: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedBadge(`${label}-${text}`);
    setTimeout(() => setCopiedBadge(null), 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-xl bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden flex flex-col max-h-[88vh] my-auto">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: `${themeStyles.accentColor}18`, color: themeStyles.accentColor }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold"
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                Kullanıcı Değiştir ve Giriş
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Bulut Canlı Senkron</span>
                </span>
                {lastCloudSync && (
                  <span className="text-[10px] text-neutral-400">
                    • {lastCloudSync}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => syncWithCloud()}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-blue-500 transition-colors"
              title="Bulutla Hemen Eşitle"
            >
              <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin text-blue-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection: Öğretmen Girişi / Öğrenci Girişi / Kayıtlı Hesaplar */}
        <div className="px-4 sm:px-6 pt-3">
          <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/5">
            <button
              onClick={() => {
                setActiveTab('switch_list');
                setLoginError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'switch_list'
                  ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Kayıtlı Hesaplar
            </button>
            <button
              onClick={() => {
                setActiveTab('teacher_login');
                setLoginError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'teacher_login'
                  ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Öğretmen Girişi
            </button>
            <button
              onClick={() => {
                setActiveTab('student_login');
                setLoginError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'student_login'
                  ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Öğrenci Girişi
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: KAYITLI HESAPLAR VE HIZLI GEÇİŞ LİSTESİ */}
          {activeTab === 'switch_list' && (
            <div className="space-y-4">
              {/* TEACHER ACCOUNT CARD */}
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-2 px-1">
                  Koç & Öğretmen Hesabı
                </div>
                <div
                  onClick={handleSelectTeacher}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    role === 'teacher'
                      ? 'bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/30'
                      : 'bg-neutral-50 dark:bg-neutral-900/40 border-black/5 dark:border-white/5 hover:border-indigo-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/20 shrink-0">
                      Ö
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white">
                          Öğretmen & Rehberlik Koçu
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                          Tam Yetki
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Tüm sınıfları, çalışma programlarını, ödevleri ve denemeleri yönetin
                      </p>
                    </div>
                  </div>

                  {role === 'teacher' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aktif</span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                      Geçiş Yap →
                    </span>
                  )}
                </div>
              </div>

              {/* REGISTERED STUDENTS LIST */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                    Kayıtlı Öğrenci Hesapları ({students.length})
                  </div>
                  {role === 'teacher' && onOpenClassroomsModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenClassroomsModal();
                      }}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Sınıfları Yönet</span>
                    </button>
                  )}
                </div>

                {/* Search and Classroom Filter Bar */}
                {students.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="İsim, 5 haneli Numara veya 4 haneli şifre ara..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-900 dark:text-white border border-black/5 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Classroom Filter Chips if any classrooms exist */}
                    {classrooms.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                        <button
                          onClick={() => setSelectedClassFilter('ALL')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                            selectedClassFilter === 'ALL'
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          Tüm Sınıflar
                        </button>
                        {classrooms.map(c => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedClassFilter(c.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                              selectedClassFilter === c.id
                                ? 'bg-blue-500 text-white shadow-xs'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color || '#3B82F6' }} />
                            <span>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Students List Feed */}
                {students.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900/40 space-y-2">
                    <Users className="w-8 h-8 text-neutral-400 mx-auto" />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Henüz sisteme kayıtlı öğrenci bulunmuyor.
                    </p>
                    {role === 'teacher' && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateTab('users');
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                      >
                        + İlk Öğrenciyi Ekle
                      </button>
                    )}
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-400 bg-neutral-50 dark:bg-neutral-900/40 rounded-2xl">
                    Aramanıza uygun öğrenci bulunamadı.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {filteredStudents.map(st => {
                      const isCurrent = role === 'student' && currentStudentId === st.id;
                      const stClasses = classrooms.filter(c =>
                        (st.classroomIds || []).includes(c.id) || (c.studentIds || []).includes(st.id)
                      );
                      const stdNo = st.studentNumber || st.pin.substring(0, 5);
                      const stdPass = st.password || st.pin.substring(st.pin.length - 4);

                      return (
                        <div
                          key={st.id}
                          onClick={() => handleSelectStudent(st.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isCurrent
                              ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/30'
                              : 'bg-neutral-50 dark:bg-neutral-900/40 border-black/5 dark:border-white/5 hover:border-blue-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Monogram Badge (NO PHOTO) */}
                            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-center font-bold text-xs tracking-wider shrink-0">
                              {getInitials(st.name)}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                                  {st.name}
                                </span>
                                {st.streak.status === 'active' && st.streak.count > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                                    <Flame className="w-3 h-3 fill-amber-500" />
                                    {st.streak.count}G
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 flex-wrap text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                <span className="font-medium text-blue-600 dark:text-blue-400">{st.targetExam}</span>
                                <span>•</span>

                                {/* 5-digit Student Number badge */}
                                <span
                                  onClick={e => handleCopy(e, stdNo, 'no')}
                                  className="font-mono font-bold bg-neutral-200/80 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[10px] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title="5 Haneli Numarayı Kopyala"
                                >
                                  No: {stdNo}
                                  {copiedBadge === `no-${stdNo}` ? (
                                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5 opacity-60" />
                                  )}
                                </span>

                                {/* 4-digit Password badge */}
                                <span
                                  onClick={e => handleCopy(e, stdPass, 'pw')}
                                  className="font-mono font-bold bg-neutral-200/80 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[10px] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title="4 Haneli Şifreyi Kopyala"
                                >
                                  Şifre: {stdPass}
                                  {copiedBadge === `pw-${stdPass}` ? (
                                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5 opacity-60" />
                                  )}
                                </span>
                              </div>

                              {/* Enrolled Classrooms Badges */}
                              {stClasses.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap mt-1">
                                  {stClasses.map(c => (
                                    <span
                                      key={c.id}
                                      className="text-[9px] font-bold px-1.5 py-0.2 rounded-md"
                                      style={{
                                        backgroundColor: `${c.color || '#3B82F6'}18`,
                                        color: c.color || '#3B82F6'
                                      }}
                                    >
                                      {c.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {isCurrent ? (
                            <div
                              style={{ backgroundColor: `${themeStyles.accentColor}18`, color: themeStyles.accentColor }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs shrink-0"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aktif</span>
                            </div>
                          ) : (
                            <span
                              style={{ color: 'inherit' }}
                              className="text-xs font-semibold text-neutral-400 hover:opacity-80 shrink-0"
                            >
                              Seç →
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ÖĞRETMEN GİRİŞİ (AD SOYAD VE ŞİFRE İLE) */}
          {activeTab === 'teacher_login' && (
            <form onSubmit={handleTeacherCredentialLogin} className="p-4 sm:p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900/60 border border-black/5 dark:border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                    Öğretmen Bilgileri ile Giriş
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Öğretmen ad soyadınızı ve şifrenizi girerek giriş yapın.
                  </p>
                </div>
              </div>

              {/* Already logged in banner if currentTeacher exists */}
              {role === 'teacher' && currentTeacher && (
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-indigo-700 dark:text-indigo-300">
                      Mevcut Hesap: {currentTeacher.name}
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Branş: {currentTeacher.branch || 'Öğretmen'} • Aktif
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                  >
                    Devam Et
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {/* Öğretmen Adı Soyadı */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Öğretmen Adı Soyadı *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherNameInput}
                    onChange={e => {
                      setTeacherNameInput(e.target.value);
                      setTeacherLoginError(null);
                    }}
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Giriş Şifresi */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Giriş Şifresi *</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={teacherPasswordInput}
                      onChange={e => {
                        setTeacherPasswordInput(e.target.value);
                        setTeacherLoginError(null);
                      }}
                      placeholder="En az 4 karakter"
                      className="w-full p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Branş */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Branş</span>
                    </label>
                    <select
                      value={teacherBranchInput}
                      onChange={e => setTeacherBranchInput(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Matematik">Matematik</option>
                      <option value="Geometri">Geometri</option>
                      <option value="Fizik">Fizik</option>
                      <option value="Kimya">Kimya</option>
                      <option value="Biyoloji">Biyoloji</option>
                      <option value="Türkçe & Edebiyat">Türkçe & Edebiyat</option>
                      <option value="Tarih">Tarih</option>
                      <option value="Coğrafya">Coğrafya</option>
                      <option value="Felsefe">Felsefe</option>
                      <option value="Yabancı Dil">Yabancı Dil</option>
                      <option value="Rehberlik & Koçluk">Rehberlik & Koçluk</option>
                    </select>
                  </div>
                </div>
              </div>

              {teacherLoginError && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{teacherLoginError}</span>
                </div>
              )}

              {teacherLoginSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{teacherLoginSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isTeacherLoading || !teacherNameInput.trim() || !teacherPasswordInput.trim()}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Shield className="w-4 h-4" />
                <span>{isTeacherLoading ? 'Doğrulanıyor...' : 'Öğretmen Olarak Giriş Yap'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: ÖĞRENCİ GİRİŞİ (5 HANELİ NUMARA + 4 HANELİ ŞİFRE) */}
          {activeTab === 'student_login' && (
            <form onSubmit={handleStudentCredentialLogin} className="p-4 sm:p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900/60 border border-black/5 dark:border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: `${themeStyles.accentColor}18`, color: themeStyles.accentColor }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold"
                >
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                    Öğrenci Bilgileri ile Giriş
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Öğretmeninizin size verdiği 5 haneli numara ve 4 haneli şifrenizi girin.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 5-Haneli Numara */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-blue-500" />
                    <span>5 Haneli Öğrenci No *</span>
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={studentNumberInput}
                    onChange={e => {
                      setStudentNumberInput(e.target.value.replace(/\D/g, ''));
                      setLoginError(null);
                    }}
                    placeholder="Örn: 10482"
                    className="w-full p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-center font-mono text-lg font-bold tracking-widest text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* 4-Haneli Şifre */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-blue-500" />
                    <span>4 Haneli Şifre *</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={passwordInput}
                    onChange={e => {
                      setPasswordInput(e.target.value.replace(/\D/g, ''));
                      setLoginError(null);
                    }}
                    placeholder="Örn: 3821"
                    className="w-full p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-center font-mono text-lg font-bold tracking-widest text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || studentNumberInput.length < 5 || passwordInput.length < 4}
                style={themeStyles.primaryBtn}
                className="w-full py-3.5 rounded-2xl disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{isLoading ? 'Doğrulanıyor...' : 'Öğrenci Girişi Yap'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-neutral-400 text-center">
                Numaranızı veya şifrenizi unuttuysanız öğretmeniniz "Kayıtlı Hesaplar" listesinden size tekrar iletebilir.
              </p>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2 bg-neutral-50/50 dark:bg-neutral-900/30">
          <div className="text-[11px] text-neutral-400">
            {role === 'teacher' ? '👨‍🏫 Öğretmen Modu Açık' : '👤 Öğrenci Modu Açık'}
          </div>

          <div className="flex items-center gap-2">
            {role === 'teacher' && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('users');
                }}
                className="px-3 py-1.5 rounded-xl bg-neutral-200/80 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-300 transition-colors"
              >
                + Yeni Öğrenci Ekle
              </button>
            )}
            <button
              onClick={onClose}
              style={themeStyles.primaryBtn}
              className="px-4 py-1.5 rounded-xl text-white text-xs font-bold cursor-pointer transition-all active:scale-95"
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
