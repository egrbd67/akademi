import React, { useState } from 'react';
import {
  Shield,
  GraduationCap,
  ArrowRight,
  Lock,
  Hash,
  Layers,
  AlertCircle,
  UserPlus,
  LogIn,
  User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getThemeStyles } from '../theme/ThemeCustomizerModal';

export const AuthScreen: React.FC = () => {
  const {
    loginTeacherWithGoogle,
    registerTeacherAccount,
    loginTeacherCredentials,
    loginStudentWithClassCode,
    loginStudentDirect,
    boxTheme
  } = useApp();

  const themeStyles = getThemeStyles(boxTheme);

  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');
  const [teacherMode, setTeacherMode] = useState<'login' | 'register'>('login');

  // Teacher Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Teacher Register state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBranch, setRegBranch] = useState('Matematik');

  // Student join inputs
  const [classCode, setClassCode] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isDirectLogin, setIsDirectLogin] = useState(false);

  // Status
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!loginUsername.trim()) {
      setErrorMsg('Lütfen kullanıcı adınızı girin.');
      return;
    }
    if (loginPassword.trim().length < 4) {
      setErrorMsg('Şifre en az 4 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginTeacherCredentials(loginUsername, loginPassword);
      if (!res.success) {
        setErrorMsg(res.error || 'Giriş başarısız oldu.');
      }
    } catch {
      setErrorMsg('Giriş yapılırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!regName.trim()) {
      setErrorMsg('Lütfen ad ve soyadınızı girin.');
      return;
    }
    if (regUsername.trim().length < 3) {
      setErrorMsg('Kullanıcı adı en az 3 karakter olmalıdır.');
      return;
    }
    if (regPassword.trim().length < 4) {
      setErrorMsg('Şifre en az 4 karakter olmalıdır.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerTeacherAccount({
        username: regUsername,
        name: regName,
        password: regPassword,
        branch: regBranch
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Kayıt oluşturulamadı.');
      }
    } catch {
      setErrorMsg('Kayıt sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherGoogle = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await loginTeacherWithGoogle();
      if (!res.success) {
        setErrorMsg(res.error || 'Google ile giriş başarısız oldu.');
      }
    } catch {
      setErrorMsg('Google ile bağlanırken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

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
        setErrorMsg('Lütfen Sınıf Kodunu girin.');
        return;
      }
      if (studentNumber.length < 5 || password.length < 4) {
        setErrorMsg('Lütfen 5 haneli Numara ve 4 haneli Şifrenizi girin.');
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
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] flex flex-col justify-center items-center p-4 sm:p-6 select-none transition-colors duration-200">
      <div className="w-full max-w-xl mx-auto space-y-5">
        {/* Başlık */}
        <div className="text-center space-y-2">
          <div
            style={{ backgroundColor: `${themeStyles.accentColor}18`, color: themeStyles.accentColor }}
            className="inline-flex items-center gap-2 p-1.5 pr-3 rounded-full text-xs font-bold"
          >
            <span
              style={{ backgroundColor: themeStyles.accentColor }}
              className="w-6 h-6 rounded-full text-white flex items-center justify-center font-black text-xs"
            >
              A
            </span>
            <span>Akademi Takip</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Koçluk & Ders Takip Sistemi
          </h1>
        </div>

        {/* Giriş & Kayıt Kartı */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/10 dark:border-white/10 shadow-xl overflow-hidden p-5 sm:p-7">
          {/* Rol Seçimi */}
          <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 mb-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('teacher');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'teacher'
                  ? 'bg-white dark:bg-[#2C2C2E] text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Öğretmen</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setErrorMsg(null);
              }}
              style={activeTab === 'student' ? { color: themeStyles.accentColor } : undefined}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-white dark:bg-[#2C2C2E] shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Öğrenci</span>
            </button>
          </div>

          {/* ÖĞRETMEN GİRİŞ & KAYIT */}
          {activeTab === 'teacher' && (
            <div className="space-y-4 text-left">
              {/* Giriş Yap / Yeni Hesap Aç Seçimi */}
              <div className="flex p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setTeacherMode('login');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    teacherMode === 'login'
                      ? 'bg-white dark:bg-[#2C2C2E] text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Giriş Yap</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTeacherMode('register');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    teacherMode === 'register'
                      ? 'bg-white dark:bg-[#2C2C2E] text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Yeni Hesap Aç (Kayıt Ol)</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. ÖĞRETMEN GİRİŞ FORMU */}
              {teacherMode === 'login' ? (
                <form onSubmit={handleTeacherLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Kullanıcı Adı veya Ad Soyad
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={loginUsername}
                        onChange={e => setLoginUsername(e.target.value)}
                        placeholder="kullaniciadi"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/5 font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Şifre
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="••••"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/5 font-mono text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !loginUsername.trim() || loginPassword.trim().length < 4}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    <span>{isLoading ? 'Giriş Yapılıyor...' : 'Kullanıcı Adı ile Giriş Yap'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* 2. YENİ ÖĞRETMEN KAYIT FORMU */
                <form onSubmit={handleTeacherRegister} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Ad Soyad *
                      </label>
                      <input
                        type="text"
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        placeholder="Ad Soyad"
                        className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/5 font-semibold text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Kullanıcı Adı *
                      </label>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={e => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        placeholder="kullaniciadi"
                        className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/5 font-mono font-bold text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Şifre (En az 4 karakter) *
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        placeholder="••••"
                        className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/5 font-mono text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        Branş
                      </label>
                      <select
                        value={regBranch}
                        onChange={e => setRegBranch(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/5 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none"
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

                  <button
                    type="submit"
                    disabled={isLoading || !regName.trim() || regUsername.trim().length < 3 || regPassword.trim().length < 4}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isLoading ? 'Hesap Açılıyor...' : 'Yeni Öğretmen Hesabı Oluştur'}</span>
                  </button>
                </form>
              )}

              {/* VEYA GOOGLE İLE GİRİŞ / KAYIT */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/10 dark:border-white/10" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="px-2 bg-white dark:bg-[#1C1C1E] text-neutral-400 font-semibold">
                    veya
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTeacherGoogle}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-95 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer"
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
                <span>Google Hesabı Seçerek {teacherMode === 'register' ? 'Kayıt Ol' : 'Giriş Yap'}</span>
              </button>
            </div>
          )}

          {/* ÖĞRENCİ GİRİŞİ */}
          {activeTab === 'student' && (
            <form onSubmit={handleStudentLogin} className="space-y-4 text-left">
              {!isDirectLogin && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Sınıf Kodu *</span>
                  </label>
                  <input
                    type="text"
                    value={classCode}
                    onChange={e => {
                      setClassCode(e.target.value.toUpperCase());
                      setErrorMsg(null);
                    }}
                    placeholder="AKD-0000"
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-xs font-mono font-bold tracking-wider text-neutral-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

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
                    placeholder="10000"
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-center font-mono text-sm font-bold tracking-widest text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    placeholder="••••"
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-center font-mono text-sm font-bold tracking-widest text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <button
                  type="button"
                  onClick={() => setIsDirectLogin(!isDirectLogin)}
                  className="hover:text-blue-500 underline cursor-pointer"
                >
                  {isDirectLogin ? 'Sınıf Kodu ile Katıl' : 'Sınıf Kodum Yok, Doğrudan No ile Gir'}
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
                className="w-full py-3 rounded-xl disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isLoading ? 'Giriş Yapılıyor...' : 'Öğrenci Girişi Yap'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
