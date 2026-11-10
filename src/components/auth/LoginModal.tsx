import React, { useState } from 'react';
import { Key, Users, User, X, CheckCircle2, AlertCircle, Sparkles, Lock, Hash, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { students, setRole, setCurrentStudentId, cloudLoginWithStudentCredentials } = useApp();

  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (studentNumber.length < 5 || password.length < 4) {
      setErrorMessage('Lütfen 5 haneli Numara ve 4 haneli Şifrenizi eksiksiz girin.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await cloudLoginWithStudentCredentials(studentNumber.trim(), password.trim());
      if (res.success && res.student) {
        setRole('student');
        setCurrentStudentId(res.student.id);
        onClose();
      } else {
        setErrorMessage(res.message || 'Geçersiz 5 haneli Numara veya 4 haneli Şifre!');
      }
    } catch {
      setErrorMessage('Giriş yapılırken sunucu hatası oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherLogin = () => {
    setRole('teacher');
    onClose();
  };

  const handleQuickStudentSelect = (studentId: string) => {
    setRole('student');
    setCurrentStudentId(studentId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-8 text-center select-none">
        {/* Top close */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Branding Icon */}
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/25 text-2xl font-black">
          A
        </div>
        <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">
          Akademi<span className="text-blue-500">Takip</span> Giriş Paneli
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 mt-1">
          Öğrenci koçluk, entegre sayaçlı çalışma programı ve deneme analiz portalı
        </p>

        {/* Rol Seçim Sekmesi */}
        <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 mb-6">
          <button
            onClick={() => {
              setActiveTab('student');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'student'
                ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Öğrenci Girişi
          </button>
          <button
            onClick={() => {
              setActiveTab('teacher');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'teacher'
                ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Öğretmen Girişi
          </button>
        </div>

        {/* Tab 1: Student 5-digit No & 4-digit Password */}
        {activeTab === 'student' && (
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-blue-500" />
                  <span>5 Haneli Öğrenci Numaranız</span>
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={studentNumber}
                  onChange={e => {
                    setStudentNumber(e.target.value.replace(/\D/g, ''));
                    setErrorMessage('');
                  }}
                  placeholder="Örn: 10482"
                  className="w-full py-2.5 px-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white font-mono font-bold text-base text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  <span>4 Haneli Şifreniz</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value.replace(/\D/g, ''));
                    setErrorMessage('');
                  }}
                  placeholder="****"
                  className="w-full py-2.5 px-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white font-mono font-bold text-base text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full py-3.5 rounded-2xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Doğrulanıyor...' : 'Programa Giriş Yap'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick test student list */}
            {students.length > 0 && (
              <div className="pt-4 border-t border-black/5 dark:border-white/5 text-left">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                  Kayıtlı Öğrenciler (Hızlı Giriş):
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {students.map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleQuickStudentSelect(st.id)}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-neutral-800 text-white dark:bg-neutral-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {st.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold">{st.name}</span>
                      </div>
                      <span className="font-mono text-[11px] text-neutral-400">
                        No: {st.studentNumber || st.pin.substring(0, 5)} • Şifre: {st.password || st.pin.substring(st.pin.length - 4)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}

        {/* Tab 2: Teacher Google/Demo */}
        {activeTab === 'teacher' && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Öğretmen hesabı ile tüm sınıfları, çalışma programlarını, ödevleri ve deneme analizlerini yönetebilirsiniz.
            </p>

            <button
              type="button"
              onClick={handleTeacherLogin}
              className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 font-bold text-sm flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Öğretmen Paneline Giriş Yap</span>
            </button>

            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Tek tıkla öğretmen paneline geçip tüm öğrencileri ve sınıfları yönetebilirsiniz.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
