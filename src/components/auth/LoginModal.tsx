import React, { useState } from 'react';
import { X, AlertCircle, Lock, Hash, ArrowRight, Shield, UserPlus, LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const {
    setRole,
    setCurrentStudentId,
    cloudLoginWithStudentCredentials,
    loginTeacherCredentials,
    registerTeacherAccount,
    loginTeacherWithGoogle
  } = useApp();

  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [teacherMode, setTeacherMode] = useState<'login' | 'register'>('login');

  const [classCode, setClassCode] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');

  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCode = classCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Lütfen kurumunuzdan aldığınız AKD Sınıf Kodunu girin.');
      return;
    }

    if (studentNumber.length < 5 || password.length < 4) {
      setErrorMessage('Lütfen 5 haneli Numara ve 4 haneli Şifrenizi girin.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await cloudLoginWithStudentCredentials(cleanCode, studentNumber.trim(), password.trim());
      if (res.success && res.student) {
        setRole('student');
        setCurrentStudentId(res.student.id);
        onClose();
      } else {
        setErrorMessage(res.message || 'Geçersiz Sınıf Kodu, Numara veya Şifre!');
      }
    } catch {
      setErrorMessage('Giriş yapılırken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      if (teacherMode === 'login') {
        const res = await loginTeacherCredentials(teacherUsername, teacherPassword);
        if (res.success) {
          onClose();
        } else {
          setErrorMessage(res.error || 'Öğretmen girişi başarısız.');
        }
      } else {
        const res = await registerTeacherAccount({
          username: teacherUsername,
          name: teacherName,
          password: teacherPassword
        });
        if (res.success) {
          onClose();
        } else {
          setErrorMessage(res.error || 'Kayıt başarısız.');
        }
      }
    } catch {
      setErrorMessage('İşlem sırasında hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherGoogle = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await loginTeacherWithGoogle();
      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || 'Google girişi başarısız.');
      }
    } catch {
      setErrorMessage('Google girişi başarısız.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-7 text-center select-none">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white mb-4">
          Hesap Girişi
        </h2>

        <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 mb-5">
          <button
            onClick={() => {
              setActiveTab('student');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'student'
                ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500'
            }`}
          >
            Öğrenci Girişi
          </button>
          <button
            onClick={() => {
              setActiveTab('teacher');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'teacher'
                ? 'bg-white dark:bg-[#2C2C2E] text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-neutral-500'
            }`}
          >
            Öğretmen Giriş / Kayıt
          </button>
        </div>

        {activeTab === 'student' && (
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Kurum / AKD Sınıf Kodu *
                </label>
                <input
                  type="text"
                  value={classCode}
                  onChange={e => {
                    setClassCode(e.target.value.toUpperCase());
                    setErrorMessage('');
                  }}
                  placeholder="AKD-XXXX"
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white font-mono font-bold text-sm text-center uppercase tracking-widest"
                  autoFocus
                  required
                />
              </div>

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
                    setErrorMessage('');
                  }}
                  placeholder="10000"
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white font-mono font-bold text-base text-center tracking-widest"
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
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value.replace(/\D/g, ''));
                    setErrorMessage('');
                  }}
                  placeholder="••••"
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white font-mono font-bold text-base text-center tracking-widest"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="text-xs text-rose-500 flex items-center justify-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || studentNumber.length < 5 || password.length < 4}
              className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Doğrulanıyor...' : 'Giriş Yap'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {activeTab === 'teacher' && (
          <div className="space-y-3.5 text-left">
            <div className="flex p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setTeacherMode('login');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                  teacherMode === 'login'
                    ? 'bg-white dark:bg-[#2C2C2E] text-indigo-600 dark:text-indigo-400'
                    : 'text-neutral-500'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Giriş Yap</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTeacherMode('register');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                  teacherMode === 'register'
                    ? 'bg-white dark:bg-[#2C2C2E] text-indigo-600 dark:text-indigo-400'
                    : 'text-neutral-500'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Yeni Kayıt</span>
              </button>
            </div>

            <form onSubmit={handleTeacherSubmit} className="space-y-3">
              {teacherMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherName}
                    onChange={e => setTeacherName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  required
                  value={teacherUsername}
                  onChange={e => setTeacherUsername(e.target.value)}
                  placeholder="kullaniciadi"
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Şifre
                </label>
                <input
                  type="password"
                  required
                  value={teacherPassword}
                  onChange={e => setTeacherPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white"
                />
              </div>

              {errorMessage && (
                <div className="text-xs text-rose-500 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>{teacherMode === 'register' ? 'Öğretmen Hesabı Oluştur' : 'Giriş Yap'}</span>
              </button>
            </form>

            <button
              type="button"
              onClick={handleTeacherGoogle}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Google Hesabı Seçerek Bağlan</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
