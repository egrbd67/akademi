import React, { useState } from 'react';
import {
  Users,
  Plus,
  Key,
  Flame,
  Snowflake,
  AlertTriangle,
  ArrowRight,
  Target,
  Calendar,
  Sparkles,
  Phone,
  Bookmark
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { getThemeStyles } from '../theme/ThemeCustomizerModal';

export const StudentsManagerView: React.FC<{ onSelectStudent: (id: string) => void }> = ({ onSelectStudent }) => {
  const { students, addStudent, setCurrentStudentId, currentStudentId, boxTheme } = useApp();
  const themeStyles = getThemeStyles(boxTheme);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetExam, setTargetExam] = useState('YKS 2027 (Sayısal)');
  const [dailyQuestionTarget, setDailyQuestionTarget] = useState<number>(100);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-generate random 6-digit PIN
  const generatePin = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const sNo = Math.floor(10000 + Math.random() * 90000).toString();
    const sPass = Math.floor(1000 + Math.random() * 9000).toString();

    addStudent({
      name: name.trim(),
      studentNumber: sNo,
      password: sPass,
      pin: `${sNo}${sPass}`.substring(0, 6),
      targetExam,
      dailyQuestionTarget: Number(dailyQuestionTarget) || 100,
      phone: phone.trim() || '+90 500 000 00 00',
      notes: notes.trim() || 'Yeni öğrenci kaydı oluşturuldu.',
    });

    setIsAddModalOpen(false);
    setName('');
    setDailyQuestionTarget(100);
    setPhone('');
    setNotes('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/5 dark:border-white/5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Öğrenci Yönetim Paneli
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Sisteme kayıtlı öğrenciler, 6 haneli erişim PIN kodları ve sınav hedefleri
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          style={themeStyles.primaryBtn}
          className="px-4 py-2.5 rounded-2xl text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Öğrenci Ekle</span>
        </button>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map(st => {
          const isSelected = st.id === currentStudentId;
          const { count, status } = st.streak;

          return (
            <div
              key={st.id}
              className={`p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border transition-all ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/15'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-800 text-white dark:bg-neutral-700 flex items-center justify-center font-bold text-sm tracking-wider shrink-0">
                    {st.name.split(/\s+/).map(p => p[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                      {st.name}
                    </h3>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {st.targetExam}
                    </div>
                  </div>
                </div>

                {/* PIN Code Badge */}
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Giriş PIN</span>
                  <div className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-black/5 dark:border-white/5 flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-500" />
                    <span>{st.pin}</span>
                  </div>
                </div>
              </div>

              {/* Goal & Notes */}
              <div className="space-y-2 mb-4 text-xs">
                <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                  <Target className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="font-medium truncate">
                    Günlük Hedef: {st.dailyQuestionTarget ? `${st.dailyQuestionTarget} Soru` : '100 Soru'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{st.phone}</span>
                </div>
                {st.notes && (
                  <p className="text-[11px] text-neutral-400 line-clamp-2 italic pt-1 border-t border-black/5 dark:border-white/5">
                    "{st.notes}"
                  </p>
                )}
              </div>

              {/* Streak & Status Pill */}
              <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5 text-xs">
                <div className="flex items-center gap-1.5">
                  {status === 'active' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{count} Gün Seri</span>
                    </span>
                  )}
                  {status === 'frozen' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold">
                      <Snowflake className="w-3.5 h-3.5" />
                      <span>Donduruldu</span>
                    </span>
                  )}
                  {status === 'pending_recovery' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Onay Bekliyor</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setCurrentStudentId(st.id);
                    onSelectStudent(st.id);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs flex items-center gap-1 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span>Programı Yönet</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Yeni Öğrenci Ekle */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
              Yeni Öğrenci Kaydı
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Öğrenciye otomatik 6 haneli pratik giriş PIN kodu oluşturulacaktır.
            </p>

            <form onSubmit={handleAddStudent} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Öğrenci Adı Soyadı
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Örn: Canan Yıldız"
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Hedef Sınav
                  </label>
                  <select
                    value={targetExam}
                    onChange={e => setTargetExam(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                  >
                    <option value="YKS 2027 (Sayısal)">YKS 2027 (Sayısal)</option>
                    <option value="YKS 2027 (Eşit Ağırlık)">YKS 2027 (Eşit Ağırlık)</option>
                    <option value="LGS 2027">LGS 2027</option>
                    <option value="MSÜ 2027">MSÜ 2027</option>
                    <option value="KPSS 2027">KPSS 2027</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Günlük Hedef Soru Sayısı
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={dailyQuestionTarget}
                    onChange={e => setDailyQuestionTarget(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white font-mono font-bold"
                    placeholder="Örn: 100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Veli / Öğrenci Telefonu
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Örn: +90 532 555 66 77"
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Koçluk Notları / İlk Durum
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Öğrencinin güçlü ve eksik olduğu dersler..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 font-semibold"
                >
                  Vazgeç
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
    </div>
  );
};
