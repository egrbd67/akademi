import React, { useState } from 'react';
import {
  Shield,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Lock,
  Hash,
  Layers,
  AlertCircle,
  CheckCircle2,
  Cloud
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getThemeStyles } from '../theme/ThemeCustomizerModal';

export const AuthScreen: React.FC = () => {
  const {
    loginTeacherWithGoogle,
    loginTeacherCredentials,
    loginStudentWithClassCode,
    loginStudentDirect,
    classrooms,
    students,
    isFirestoreReady,
    boxTheme
  } = useApp();

  const themeStyles = getThemeStyles(boxTheme);

  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');

  // Teacher name & password inputs
  const [teacherName, setTeacherName] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherBranch, setTeacherBranch] = useState('Matematik & Koçluk');
  const [teacherAuthMethod, setTeacherAuthMethod] = useState<'credentials' | 'google'>('credentials');

  // Student join inputs
  const [classCode, setClassCode] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isDirectLogin, setIsDirectLogin] = useState(false);

  // Status
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Teacher Credentials Login (Ad Soyad + Şifre)
  const handleTeacherCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!teacherName.trim()) {
      setErrorMsg('Lütfen ad ve soyadınızı girin.');
      return;
    }
    if (teacherPassword.trim().length < 4) {
      setErrorMsg('Öğretmen şifreniz en az 4 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginTeacherCredentials(teacherName, teacherPassword, teacherBranch);
      if (!res.success) {
        setErrorMsg(res.error || 'Öğretmen girişi başarısız oldu.');
      }
    } catch {
      setErrorMsg('Giriş yapılırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Teacher Login
  const handleTeacherGoogle = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await loginTeacherWithGoogle();
      if (!res.success) {
        setErrorMsg(res.error || 'Google ile giriş başarısız oldu.');
      }
    } catch {
      setErrorMsg('Giriş yapılırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Student Class Code & Credentials
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isDirectLogin) {
      if (studentNumber.length < 5 || password.length < 4) {
        setErrorMsg('Lütfen 5 haneli Numara ve 4 haneli Şifrenizi girin.');
        return;
      }
      setIsLoading(true);
      try {
        const res = await loginStudentDirect(studentNumber, password);
        if (!res.success) {
          setErrorMsg(res.message || 'Geçersiz 5 haneli Numara veya 4 haneli Şifre!');
        }
      } catch {
        setErrorMsg('Öğrenci girişi doğrulanırken hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!classCode.trim()) {
        setErrorMsg('Lütfen öğretmeninizin verdiği Sınıf Kodunu girin.');
        return;
      }
      if (studentNumber.length < 5 || password.length < 4) {
        setErrorMsg('Lütfen 5 haneli Numara ve 4 haneli Şifrenizi eksiksiz girin.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await loginStudentWithClassCode(classCode, studentNumber, password);
        if (!res.success) {
          setErrorMsg(res.message || 'Giriş bilgileri hatalı veya sınıf bulunamadı.');
        }
      } catch {
        setErrorMsg('Giriş doğrulanırken hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 select-none transition-colors duration-200">
      {/* Background Zen Glow */}
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* App Branding Header & Opening Presentation */}
        <div className="text-center space-y-3">
          <div
            style={{ backgroundColor: `${themeStyles.accentColor}18`, color: themeStyles.accentColor }}
            className="inline-flex items-center gap-2 p-1.5 pr-3 rounded-full text-xs font-bold shadow-2xs"
          >
            <span
              style={{ backgroundColor: themeStyles.accentColor }}
              className="w-6 h-6 rounded-full text-white flex items-center justify-center font-black text-xs"
            >
              A
            </span>
            <span>Akademi Takip Koçluk Portali</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Akıllı Koçluk & <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Ders Takip Sistemi</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Öğretmenler için çoklu şube ve oturum yönetimi, öğrenciler için canlı odak sayacı ve kesintisiz bulut senkronizasyonu.
          </p>

          {/* Feature Showcase Pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap pt-1 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
            <span className="px-3 py-1 rounded-full bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-2xs flex items-center gap-1.5">
              <span>⚡</span> Oturum Programı
            </span>
            <span className="px-3 py-1 rounded-full bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-2xs flex items-center gap-1.5">
              <span>⏱️</span> Pomodoro & Sayaç
            </span>
            <span className="px-3 py-1 rounded-full bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-2xs flex items-center gap-1.5">
              <span>📊</span> Deneme & Net Analizi
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Bulut Canlı Senkron</span>
            </span>
          </div>
        </div>

        {/* Auth Role Tabs: 2 Net Seçenek */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/10 dark:border-white/10 shadow-xl overflow-hidden p-6 sm:p-8">
          <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 mb-6">
            <button
              onClick={() => {
                setActiveTab('teacher');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'teacher'
                  ? 'bg-white dark:bg-[#2C2C2E] text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>1. Öğretmen Hesabı (Gmail)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('student');
                setErrorMsg(null);
              }}
              style={activeTab === 'student' ? { color: themeStyles.accentColor } : undefined}
              className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-white dark:bg-[#2C2C2E] shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>2. Sınıfa Katıl (Kod İle)</span>
            </button>
          </div>

          {/* TAB 1: ÖĞRETMEN HESABI AÇMA / GİRİŞ (AD SOYAD & ŞİFRE VEYA GMAIL İLE) */}
          {activeTab === 'teacher' && (
            <div className="space-y-4 text-left">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                  <Shield className="w-5 h-5 text-indigo-500" />
                  <span>Öğretmen & Koç Girişi</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Adınız, soyadınız ve belirlediğiniz şifre ile doğrudan giriş yapın veya Google hesabınızı kullanın.
                </p>
              </div>

              {/* Sub-selector for Teacher Auth Method: Ad Soyad & Şifre vs Gmail */}
              <div className="flex p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setTeacherAuthMethod('credentials');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    teacherAuthMethod === 'credentials'
                      ? 'bg-white dark:bg-[#2C2C2E] text-indigo-600 dark:text-indigo-400 shadow-2xs font-extrabold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Ad Soyad & Şifre ile Giriş
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTeacherAuthMethod('google');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    teacherAuthMethod === 'google'
                      ? 'bg-white dark:bg-[#2C2C2E] text-indigo-600 dark:text-indigo-400 shadow-2xs font-extrabold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Google (Gmail) ile Giriş
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* METHOD 1: AD SOYAD VE ŞİFRE İLE GİRİŞ */}
              {teacherAuthMethod === 'credentials' && (
                <form onSubmit={handleTeacherCredentialsLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Öğretmen Adı Soyadı *
                    </label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={e => setTeacherName(e.target.value)}
                      placeholder="Örn: Ahmet Hoca veya Zeynep Kaya"
                      className="w-full p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/5 font-bold text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center justify-between">
                      <span>Öğretmen Şifresi *</span>
                      <span className="text-[10px] text-neutral-400 font-normal">En az 4 karakter</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={teacherPassword}
                        onChange={e => setTeacherPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/5 font-mono text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Branş / Uzmanlık <span className="font-normal text-neutral-400">(İsteğe Bağlı)</span>
                    </label>
                    <input
                      type="text"
                      value={teacherBranch}
                      onChange={e => setTeacherBranch(e.target.value)}
                      placeholder="Örn: Matematik, Fizik, YKS Koçu..."
                      className="w-full p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/5 text-xs text-neutral-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !teacherName.trim() || teacherPassword.trim().length < 4}
                    className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    <span>{isLoading ? 'Giriş Yapılıyor...' : 'Öğretmen Hesabı ile Giriş Yap'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* METHOD 2: GMAIL İLE GİRİŞ */}
              {teacherAuthMethod === 'google' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1.5">
                    <div className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span>Google Profil & İsim Aktarımı</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      Google ile bağlandığınızda profil adınız (Ad Soyad) ve profil bilgileriniz otomatik olarak alınıp öğretmen hesabınızın resmi adı olarak ayarlanacaktır.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTeacherGoogle}
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-95 font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-black/10 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                    <span>{isLoading ? 'Google ile Bağlanılıyor...' : 'Google (Gmail) ile Giriş Yap'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SINIF KODU VE ÖĞRENCİ NUMARASI / ŞİFRESİ İLE GİRİŞ */}
          {activeTab === 'student' && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-500" />
                  <span>Sınıfa Katıl & Öğrenci Girişi</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Öğretmeninizin size verdiği Sınıf Kodunu ve 5 haneli Numara ile 4 haneli Şifrenizi girin.
                </p>
              </div>

              {!isDirectLogin ? (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Öğretmeninizin Verdiği Sınıf Kodu *</span>
                  </label>
                  <input
                    type="text"
                    value={classCode}
                    onChange={e => {
                      setClassCode(e.target.value.toUpperCase());
                      setErrorMsg(null);
                    }}
                    placeholder="Örn: AKD-4821"
                    className="w-full p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-xs font-mono font-bold tracking-wider text-neutral-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-blue-500" />
                    <span>5 Haneli Öğrenci No *</span>
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={studentNumber}
                    onChange={e => {
                      setStudentNumber(e.target.value.replace(/\D/g, ''));
                      setErrorMsg(null);
                    }}
                    placeholder="Örn: 10482"
                    className="w-full p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-center font-mono text-base font-bold tracking-widest text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-blue-500" />
                    <span>4 Haneli Şifre *</span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value.replace(/\D/g, ''));
                      setErrorMsg(null);
                    }}
                    placeholder="****"
                    className="w-full p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-center font-mono text-base font-bold tracking-widest text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] px-1 text-neutral-400">
                <button
                  type="button"
                  onClick={() => setIsDirectLogin(!isDirectLogin)}
                  className="hover:text-blue-500 underline cursor-pointer"
                >
                  {isDirectLogin ? '← Sınıf Kodu ile Katıl' : 'Sınıf Kodum Yok, Doğrudan No ile Gir →'}
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || studentNumber.length < 5 || password.length < 4}
                style={themeStyles.primaryBtn}
                className="w-full py-3.5 rounded-2xl disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{isLoading ? 'Doğrulanıyor...' : 'Öğrenci Paneline Giriş Yap'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Classrooms / Students Helper for Demo if exists in cloud */}
              {classrooms.length > 0 && (
                <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-1.5 text-left text-xs">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase">
                    Aktif Sınıf Kodları (Örnek):
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {classrooms.slice(0, 3).map(c => (
                      <span
                        key={c.id}
                        onClick={() => setClassCode(c.code || '')}
                        className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-blue-50 dark:hover:bg-neutral-700"
                        title="Kodu forma kopyala"
                      >
                        {c.name}: {c.code || 'AKD-KOD'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
