import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Shield,
  Search,
  Copy,
  Check,
  Flame,
  RefreshCw,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  Hash,
  GraduationCap,
  UserPlus,
  LogIn,
  LogOut,
  User,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
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
    currentStudent,
    students,
    classrooms,
    currentTeacher,
    logout,
    isCloudSyncing,
    lastCloudSync,
    syncWithCloud,
    cloudLoginWithStudentCredentials,
    loginTeacherCredentials,
    registerTeacherAccount,
    loginTeacherWithGoogle,
    boxTheme
  } = useApp();

  const themeStyles = getThemeStyles(boxTheme);

  const [activeTab, setActiveTab] = useState<'switch_list' | 'teacher_login' | 'student_login'>('switch_list');
  const [teacherSubMode, setTeacherSubMode] = useState<'login' | 'register'>('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  // Teacher Login state
  const [teacherUsernameInput, setTeacherUsernameInput] = useState('');
  const [teacherPasswordInput, setTeacherPasswordInput] = useState('');

  // Teacher Register state
  const [regTeacherName, setRegTeacherName] = useState('');
  const [regTeacherUsername, setRegTeacherUsername] = useState('');
  const [regTeacherPassword, setRegTeacherPassword] = useState('');
  const [regTeacherBranch, setRegTeacherBranch] = useState('Matematik');

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

  const getInitials = (name: string) => {
    if (!name) return 'ÖG';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

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
        if (!studentClasses.includes(selectedClassFilter)) return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedClassFilter]);

  const handleSelectStudent = (studentId: string) => {
    setCurrentStudentId(studentId);
    setRole('student');
    onClose();
  };

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
        setLoginSuccess(`Giriş başarılı: ${res.student.name}`);
        setTimeout(() => onClose(), 500);
      } else {
        setLoginError(res.message || 'Geçersiz 5 haneli Numara veya 4 haneli Şifre!');
      }
    } catch {
      setLoginError('Bağlantı hatası oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherUsernameInput.trim() || !teacherPasswordInput.trim()) return;

    setTeacherLoginError(null);
    setTeacherLoginSuccess(null);
    setIsTeacherLoading(true);

    try {
      const res = await loginTeacherCredentials(
        teacherUsernameInput.trim(),
        teacherPasswordInput.trim()
      );
      if (res.success && res.teacher) {
        setTeacherLoginSuccess(`Aktif öğretmen: ${res.teacher.name}`);
        setTeacherPasswordInput('');
        setTimeout(() => onClose(), 500);
      } else {
        setTeacherLoginError(res.error || 'Giriş yapılamadı.');
      }
    } catch {
      setTeacherLoginError('Giriş yapılırken hata oluştu.');
    } finally {
      setIsTeacherLoading(false);
    }
  };

  const handleTeacherRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regTeacherName.trim() || !regTeacherUsername.trim() || !regTeacherPassword.trim()) return;

    setTeacherLoginError(null);
    setTeacherLoginSuccess(null);
    setIsTeacherLoading(true);

    try {
      const res = await registerTeacherAccount({
        username: regTeacherUsername,
        name: regTeacherName,
        password: regTeacherPassword,
        branch: regTeacherBranch
      });
      if (res.success && res.teacher) {
        setTeacherLoginSuccess(`Yeni öğretmen hesabı açıldı: ${res.teacher.name}`);
        setRegTeacherName('');
        setRegTeacherUsername('');
        setRegTeacherPassword('');
        setTimeout(() => onClose(), 500);
      } else {
        setTeacherLoginError(res.error || 'Kayıt oluşturulamadı.');
      }
    } catch {
      setTeacherLoginError('Kayıt sırasında hata oluştu.');
    } finally {
      setIsTeacherLoading(false);
    }
  };

  const handleTeacherGoogleLogin = async () => {
    setTeacherLoginError(null);
    setTeacherLoginSuccess(null);
    setIsTeacherLoading(true);
    try {
      const res = await loginTeacherWithGoogle();
      if (res.success && res.teacher) {
        setTeacherLoginSuccess(`Google ile bağlanıldı: ${res.teacher.name}`);
        setTimeout(() => onClose(), 500);
      } else {
        setTeacherLoginError(res.error || 'Google girişi tamamlanamadı.');
      }
    } catch {
      setTeacherLoginError('Google ile giriş yapılırken hata oluştu.');
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
        <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: `${themeStyles.accentColor}18`, color: themeStyles.accentColor }}
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
            >
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                Hesap Yönetimi & Geçiş
              </h2>
              {lastCloudSync && (
                <div className="text-[10px] text-neutral-400">
                  Senkron: {lastCloudSync}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => syncWithCloud()}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-blue-500 transition-colors cursor-pointer"
              title="Senkronize Et"
            >
              <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin text-blue-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="px-4 sm:px-5 pt-3">
          <div className="flex p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/5">
            <button
              onClick={() => {
                setActiveTab('switch_list');
                setLoginError(null);
                setTeacherLoginError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'switch_list'
                  ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Aktif Oturum
            </button>
            <button
              onClick={() => {
                setActiveTab('teacher_login');
                setTeacherLoginError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'teacher_login'
                  ? 'bg-white dark:bg-[#2C2C2E] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Öğretmen Giriş / Kayıt
            </button>
            <button
              onClick={() => {
                setActiveTab('student_login');
                setLoginError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'student_login'
                  ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Öğrenci Girişi
            </button>
          </div>
        </div>

        {/* İçerik */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* SEKME 1: AKTİF HESAP & ÖĞRETMENİN KENDİ ÖĞRENCİLERİ */}
          {activeTab === 'switch_list' && (
            <div className="space-y-4">
              {/* AKTİF HESAP KARTI */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Aktif Hesabınız
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Hesaptan Çıkış Yap</span>
                  </button>
                </div>

                {currentTeacher ? (
                  <div
                    onClick={() => {
                      if (role !== 'teacher') {
                        setRole('teacher');
                        onClose();
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      role === 'teacher'
                        ? 'bg-indigo-500/10 border-indigo-500/40'
                        : 'bg-neutral-50 dark:bg-neutral-900/40 border-black/5 dark:border-white/5 hover:border-indigo-500/30 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {getInitials(currentTeacher.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                            {currentTeacher.name}
                          </span>
                          {currentTeacher.username && (
                            <span className="text-[10px] font-mono text-neutral-400">
                              @{currentTeacher.username}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                          <span>{currentTeacher.branch || 'Öğretmen'}</span>
                          <span>•</span>
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                            Kişisel Öğretmen Hesabı (Gizli Veri Alanı)
                          </span>
                        </div>
                      </div>
                    </div>

                    {role === 'teacher' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aktif</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                        Öğretmen Paneline Dön →
                      </span>
                    )}
                  </div>
                ) : currentStudent ? (
                  <div className="p-3.5 rounded-2xl border bg-blue-500/10 border-blue-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {getInitials(currentStudent.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                          {currentStudent.name}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono">
                          Öğrenci No: {currentStudent.studentNumber || currentStudent.pin.substring(0, 5)}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aktif Öğrenci</span>
                    </span>
                  </div>
                ) : null}
              </div>

              {/* SADECE AKTİF ÖĞRETMENİN KENDİ ÖĞRENCİLERİ (Öğretmen oturumu açıksa gösterilir) */}
              {currentTeacher && (
                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      Sizin Öğrencileriniz ({students.length})
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
                        <span>Sınıflarım</span>
                      </button>
                    )}
                  </div>

                  {students.length > 0 && (
                    <div className="space-y-2 mb-3">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Öğrencileriniz arasında ara..."
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-900 dark:text-white border border-black/5 dark:border-white/5 focus:outline-none"
                        />
                      </div>

                      {classrooms.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                          <button
                            onClick={() => setSelectedClassFilter('ALL')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap ${
                              selectedClassFilter === 'ALL'
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                            }`}
                          >
                            Tümü
                          </button>
                          {classrooms.map(c => (
                            <button
                              key={c.id}
                              onClick={() => setSelectedClassFilter(c.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 ${
                                selectedClassFilter === c.id
                                  ? 'bg-blue-500 text-white'
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

                  {students.length === 0 ? (
                    <div className="p-5 text-center rounded-2xl border border-dashed border-black/10 dark:border-white/10 text-xs text-neutral-400">
                      Henüz hesabınıza kayıtlı öğrenci yok.
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="p-5 text-center text-xs text-neutral-400">
                      Öğrenci bulunamadı.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {filteredStudents.map(st => {
                        const isCurrent = role === 'student' && currentStudentId === st.id;
                        const stdNo = st.studentNumber || st.pin.substring(0, 5);
                        const stdPass = st.password || st.pin.substring(st.pin.length - 4);

                        return (
                          <div
                            key={st.id}
                            onClick={() => handleSelectStudent(st.id)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isCurrent
                                ? 'bg-blue-500/10 border-blue-500/40'
                                : 'bg-neutral-50 dark:bg-neutral-900/40 border-black/5 dark:border-white/5 hover:border-blue-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-center font-bold text-xs shrink-0">
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

                                <div className="flex items-center gap-2 flex-wrap text-[11px] text-neutral-500 mt-0.5">
                                  <span
                                    onClick={e => handleCopy(e, stdNo, 'no')}
                                    className="font-mono font-bold bg-neutral-200/80 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[10px] text-neutral-800 dark:text-neutral-200 inline-flex items-center gap-1"
                                  >
                                    No: {stdNo}
                                    {copiedBadge === `no-${stdNo}` ? (
                                      <Check className="w-2.5 h-2.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-2.5 h-2.5 opacity-60" />
                                    )}
                                  </span>

                                  <span
                                    onClick={e => handleCopy(e, stdPass, 'pw')}
                                    className="font-mono font-bold bg-neutral-200/80 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[10px] text-neutral-800 dark:text-neutral-200 inline-flex items-center gap-1"
                                  >
                                    Şifre: {stdPass}
                                    {copiedBadge === `pw-${stdPass}` ? (
                                      <Check className="w-2.5 h-2.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-2.5 h-2.5 opacity-60" />
                                    )}
                                  </span>
                                </div>
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
                              <span className="text-xs font-semibold text-neutral-400 shrink-0">
                                Öğrenci Görünümü →
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SEKME 2: ÖĞRETMEN GİRİŞİ VEYA YENİ ÖĞRETMEN KAYDI */}
          {activeTab === 'teacher_login' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-black/5 dark:border-white/5 space-y-4">
              {/* Alt Seçim: Giriş Yap / Yeni Hesap Aç */}
              <div className="flex p-1 rounded-xl bg-neutral-200/70 dark:bg-neutral-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setTeacherSubMode('login');
                    setTeacherLoginError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                    teacherSubMode === 'login'
                      ? 'bg-white dark:bg-[#2C2C2E] text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-neutral-500'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Öğretmen Girişi</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTeacherSubMode('register');
                    setTeacherLoginError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                    teacherSubMode === 'register'
                      ? 'bg-white dark:bg-[#2C2C2E] text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-neutral-500'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Yeni Öğretmen Kaydı</span>
                </button>
              </div>

              {teacherSubMode === 'login' ? (
                <form onSubmit={handleTeacherCredentialLogin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Kullanıcı Adı veya Ad Soyad
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={teacherUsernameInput}
                        onChange={e => {
                          setTeacherUsernameInput(e.target.value);
                          setTeacherLoginError(null);
                        }}
                        placeholder="kullaniciadi"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Şifre
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={teacherPasswordInput}
                        onChange={e => {
                          setTeacherPasswordInput(e.target.value);
                          setTeacherLoginError(null);
                        }}
                        placeholder="••••"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {teacherLoginError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{teacherLoginError}</span>
                    </div>
                  )}

                  {teacherLoginSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{teacherLoginSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isTeacherLoading || !teacherUsernameInput.trim() || !teacherPasswordInput.trim()}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    <span>{isTeacherLoading ? 'Doğrulanıyor...' : 'Öğretmen Hesabına Giriş Yap'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleTeacherRegister} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Ad Soyad *
                      </label>
                      <input
                        type="text"
                        required
                        value={regTeacherName}
                        onChange={e => {
                          setRegTeacherName(e.target.value);
                          setTeacherLoginError(null);
                        }}
                        placeholder="Ad Soyad"
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Kullanıcı Adı *
                      </label>
                      <input
                        type="text"
                        required
                        value={regTeacherUsername}
                        onChange={e => {
                          setRegTeacherUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                          setTeacherLoginError(null);
                        }}
                        placeholder="kullaniciadi"
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs font-mono font-bold text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Şifre (En az 4 karakter) *
                      </label>
                      <input
                        type="password"
                        required
                        value={regTeacherPassword}
                        onChange={e => {
                          setRegTeacherPassword(e.target.value);
                          setTeacherLoginError(null);
                        }}
                        placeholder="••••"
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Branş
                      </label>
                      <select
                        value={regTeacherBranch}
                        onChange={e => setRegTeacherBranch(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white"
                      >
                        <option value="Matematik">Matematik</option>
                        <option value="Geometri">Geometri</option>
                        <option value="Fizik">Fizik</option>
                        <option value="Kimya">Kimya</option>
                        <option value="Biyoloji">Biyoloji</option>
                        <option value="Türkçe & Edebiyat">Türkçe & Edebiyat</option>
                        <option value="Tarih & Coğrafya">Tarih & Coğrafya</option>
                        <option value="Yabancı Dil">Yabancı Dil</option>
                        <option value="Rehberlik & Koçluk">Rehberlik & Koçluk</option>
                      </select>
                    </div>
                  </div>

                  {teacherLoginError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{teacherLoginError}</span>
                    </div>
                  )}

                  {teacherLoginSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{teacherLoginSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isTeacherLoading || !regTeacherName.trim() || regTeacherUsername.trim().length < 3 || regTeacherPassword.trim().length < 4}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isTeacherLoading ? 'Kaydediliyor...' : 'Yeni Öğretmen Hesabı Oluştur'}</span>
                  </button>
                </form>
              )}

              {/* Google ile Farklı Öğretmen Hesabı Seç / Aç */}
              <div className="pt-2 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={handleTeacherGoogleLogin}
                  disabled={isTeacherLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google Hesabı Seçerek Bağlan</span>
                </button>
              </div>
            </div>
          )}

          {/* SEKME 3: ÖĞRENCİ GİRİŞİ */}
          {activeTab === 'student_login' && (
            <form onSubmit={handleStudentCredentialLogin} className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-black/5 dark:border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: `${themeStyles.accentColor}18`, color: themeStyles.accentColor }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                >
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    Öğrenci Girişi
                  </h3>
                  <p className="text-xs text-neutral-500">
                    5 haneli numara ve 4 haneli şifrenizi girin.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-blue-500" />
                    <span>5 Haneli Öğrenci No</span>
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={studentNumberInput}
                    onChange={e => {
                      setStudentNumberInput(e.target.value.replace(/\D/g, ''));
                      setLoginError(null);
                    }}
                    placeholder="10000"
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-center font-mono text-base font-bold tracking-widest text-neutral-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-blue-500" />
                    <span>4 Haneli Şifre</span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={passwordInput}
                    onChange={e => {
                      setPasswordInput(e.target.value.replace(/\D/g, ''));
                      setLoginError(null);
                    }}
                    placeholder="••••"
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-center font-mono text-base font-bold tracking-widest text-neutral-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || studentNumberInput.length < 5 || passwordInput.length < 4}
                style={themeStyles.primaryBtn}
                className="w-full py-3 rounded-xl disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isLoading ? 'Doğrulanıyor...' : 'Öğrenci Girişi Yap'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2 bg-neutral-50/50 dark:bg-neutral-900/30">
          <div className="text-xs text-neutral-500 font-semibold truncate">
            {role === 'teacher'
              ? `Aktif Öğretmen: ${currentTeacher?.name || '-'}`
              : 'Öğrenci Modu'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıkış Yap</span>
            </button>
            {role === 'teacher' && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('users');
                }}
                className="px-3 py-1.5 rounded-xl bg-neutral-200/80 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold cursor-pointer"
              >
                + Öğrenci Ekle
              </button>
            )}
            <button
              onClick={onClose}
              style={themeStyles.primaryBtn}
              className="px-4 py-1.5 rounded-xl text-white text-xs font-bold cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
