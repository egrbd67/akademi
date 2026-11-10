import React, { useState } from 'react';
import {
  Shield,
  User,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Lock,
  Hash,
  X,
  Flame,
  CheckCircle2,
  CheckSquare,
  FileSpreadsheet,
  Target,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface IntroModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const IntroModal: React.FC<IntroModalProps> = ({ isOpen, onClose }) => {
  const { role, setRole, students, setCurrentStudentId, setHasCompletedIntro } = useApp();

  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student'>('teacher');
  const [studentNumberInput, setStudentNumberInput] = useState('');
  const [studentPasswordInput, setStudentPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleTeacherSelect = () => {
    setRole('teacher');
    setHasCompletedIntro(true);
    if (onClose) onClose();
  };

  const handleStudentLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (studentNumberInput.trim().length < 5 || studentPasswordInput.trim().length < 4) {
      setErrorMessage('Lütfen 5 haneli Öğrenci Numaranızı ve 4 haneli Şifrenizi eksiksiz girin.');
      return;
    }

    const matched = students.find(s =>
      (s.studentNumber === studentNumberInput.trim() || s.pin.substring(0, 5) === studentNumberInput.trim()) &&
      (s.password === studentPasswordInput.trim() || s.pin.substring(s.pin.length - 4) === studentPasswordInput.trim())
    );

    if (matched) {
      setRole('student');
      setCurrentStudentId(matched.id);
      setHasCompletedIntro(true);
      if (onClose) onClose();
    } else {
      setErrorMessage('Öğrenci numarası veya şifresi hatalı! Lütfen öğretmeninizin atadığı bilgileri kontrol edin.');
    }
  };

  const handleQuickStudentSelect = (studentId: string) => {
    setRole('student');
    setCurrentStudentId(studentId);
    setHasCompletedIntro(true);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 dark:bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300 select-none overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-6 sm:p-9 my-6 text-neutral-900 dark:text-white">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand & Welcoming Header */}
        <div className="text-center max-w-lg mx-auto mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white flex items-center justify-center mx-auto mb-3.5 shadow-xl shadow-blue-500/25 text-3xl font-black">
            A
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Akademi Takip Koçluk Portali</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Hoş Geldiniz!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
            Kişiselleştirilmiş 2 haftalık çalışma oturumları, entegre Pomodoro sayacı, soru analizi ve öğretmen kontrollü istikrar takibi ile başarıya adım atın.
          </p>
        </div>

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-black/5 dark:border-white/5">
            <Calendar className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <div className="font-bold text-[11px] text-neutral-900 dark:text-white">2 Haftalık Program</div>
            <div className="text-[10px] text-neutral-400">Dikey A4 ve JSON</div>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-black/5 dark:border-white/5">
            <Clock className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <div className="font-bold text-[11px] text-neutral-900 dark:text-white">Odak Sayacı</div>
            <div className="text-[10px] text-neutral-400">Pomodoro & Kronometre</div>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-black/5 dark:border-white/5">
            <Flame className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <div className="font-bold text-[11px] text-neutral-900 dark:text-white">Seri & Kurtarma</div>
            <div className="text-[10px] text-neutral-400">Günlük Soru İstikrarı</div>
          </div>
        </div>

        {/* Role Selection Switcher Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
          {/* Card 1: Öğretmen */}
          <div
            onClick={() => {
              setSelectedRole('teacher');
              setErrorMessage('');
            }}
            className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              selectedRole === 'teacher'
                ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 shadow-md ring-2 ring-indigo-500/20'
                : 'border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/15 bg-neutral-50/50 dark:bg-neutral-900/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  Koçluk Modu
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white mb-1">
                Öğretmen / Koç Girişi
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
                Öğrencilerinize 2 haftalık oturum programları oluşturun, geri sayım sayacı ile sınav atayın ve mazeretleri onaylayın.
              </p>
            </div>

            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>Koçluk Paneline Geç</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Öğrenci (Öğretmen Kontrolünde) */}
          <div
            onClick={() => {
              setSelectedRole('student');
              setErrorMessage('');
            }}
            className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              selectedRole === 'student'
                ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 shadow-md ring-2 ring-blue-500/20'
                : 'border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/15 bg-neutral-50/50 dark:bg-neutral-900/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  Öğrenci Modu
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white mb-1">
                Öğrenci Girişi
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
                Öğretmeninizin size verdiği 5 haneli Numara ve 4 haneli Şifre ile oturumlarınıza ve sayaçlarınıza ulaşın.
              </p>
            </div>

            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
              <span>Öğrenci Paneline Geç</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Dynamic Action Area based on selection */}
        {selectedRole === 'teacher' ? (
          <div className="p-4 sm:p-5 rounded-3xl bg-neutral-50 dark:bg-neutral-900/60 border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1.5">
              <Shield className="w-4 h-4" />
              <span>Öğretmen Yetkileriyle Doğrudan Başlayın</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
              Öğretmen hesabınızla öğrenci oluşturabilir, duyuru paylaşabilir, sınav atayabilir ve öğrencilerin soru hedeflerini belirleyebilirsiniz.
            </p>
            <button
              onClick={handleTeacherSelect}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/25 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Öğretmen Olarak Uygulamayı Başlat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleStudentLoginSubmit} className="p-4 sm:p-5 rounded-3xl bg-neutral-50 dark:bg-neutral-900/60 border border-black/5 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>Öğrenci Giriş Bilgileri</span>
              </span>
              <span className="text-[11px] text-neutral-400">Öğretmen kontrolünde</span>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Öğretmeninizin size verdiği 5 haneli Numara ve 4 haneli Şifrenizi giriniz.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-blue-500" />
                  <span>5 Haneli No *</span>
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={studentNumberInput}
                  onChange={e => {
                    setStudentNumberInput(e.target.value.replace(/\D/g, ''));
                    setErrorMessage('');
                  }}
                  placeholder="10482"
                  className="w-full py-2.5 px-3 text-center font-mono text-lg font-extrabold tracking-widest rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  autoFocus
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
                  value={studentPasswordInput}
                  onChange={e => {
                    setStudentPasswordInput(e.target.value.replace(/\D/g, ''));
                    setErrorMessage('');
                  }}
                  placeholder="••••"
                  className="w-full py-2.5 px-3 text-center font-mono text-lg font-extrabold tracking-widest rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="text-xs text-rose-500 flex items-center justify-center gap-1.5 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={studentNumberInput.length < 5 || studentPasswordInput.length < 4}
              className="w-full py-3.5 rounded-2xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Öğrenci Programına Giriş Yap</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* If students exist in system, show quick selection for test */}
            {students.length > 0 ? (
              <div className="pt-3 border-t border-black/5 dark:border-white/5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5 text-center">
                  Veya Kayıtlı Öğrenci Seçerek Başlayın:
                </span>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {students.map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleQuickStudentSelect(st.id)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 hover:border-blue-500 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <div className="w-5 h-5 rounded-md bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-center text-[9px] font-bold">
                        {st.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{st.name}</span>
                      <span className="font-mono text-[10px] text-neutral-400">({st.pin})</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-[11px] text-neutral-400 pt-2">
                Henüz sistemde kayıtlı öğrenci yok. Önce Öğretmen olarak başlayıp öğrenci ekleyebilirsiniz.
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
