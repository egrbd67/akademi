import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Award,
  X,
  Sparkles,
  Plus,
  Minus,
  Clock,
  Target
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { normalizeSubjectName } from '../../constants/subjects';

export const QuestionEntrySheet: React.FC = () => {
  const {
    questionEntryModal,
    closeQuestionEntryModal,
    submitQuestionEntry,
    subjects,
    addSubjectVariable
  } = useApp();

  const [subject, setSubject] = useState<string>('Matematik');
  const [topic, setTopic] = useState<string>('');
  const [isAddingSubject, setIsAddingSubject] = useState<boolean>(false);
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [studentNote, setStudentNote] = useState<string>('');
  const [correct, setCorrect] = useState<number>(30);
  const [wrong, setWrong] = useState<number>(3);
  const [blank, setBlank] = useState<number>(1);

  React.useEffect(() => {
    if (questionEntryModal) {
      setSubject(normalizeSubjectName(questionEntryModal.subject || 'Matematik'));
      setTopic(questionEntryModal.topic || 'Konu Çalışması');
      setDurationMinutes(Math.max(1, questionEntryModal.durationMinutes || 25));
      setStudentNote('');
      setIsAddingSubject(false);
      setNewSubjectName('');
    }
  }, [questionEntryModal]);

  // Auto calculated net = Doğru - Yanlış / 4
  const net = useMemo(() => {
    const rawNet = correct - wrong / 4;
    return Number(Math.max(0, rawNet).toFixed(2));
  }, [correct, wrong]);

  const totalQuestions = correct + wrong + blank;

  if (!questionEntryModal || !questionEntryModal.isOpen) return null;

  const nowTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  const handleAddCustomSubject = () => {
    const clean = newSubjectName.trim();
    if (!clean) return;
    const norm = normalizeSubjectName(clean);
    addSubjectVariable(norm);
    setSubject(norm);
    setNewSubjectName('');
    setIsAddingSubject(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const canonicalSubject = normalizeSubjectName(subject);
    addSubjectVariable(canonicalSubject);
    submitQuestionEntry(
      {
        correct,
        wrong,
        blank,
        net,
      },
      canonicalSubject,
      topic,
      studentNote,
      Math.max(1, Number(durationMinutes) || 1)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-6 sm:p-8 animate-in slide-in-from-bottom-8 duration-300 max-h-[95vh] overflow-y-auto">
        {/* Mobil tutamaç çizgisi */}
        <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/25">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-white">
                Çalışmayı Bitir & Gönder
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Saat {nowTime} • {durationMinutes} dk çalışma
              </p>
            </div>
          </div>

          <button
            onClick={closeQuestionEntryModal}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Counters & Subject/Topic Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Ortak Ders Değişkeni ve Konu Alanları */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Ders Değişkeni
              </label>
              <select
                value={subject}
                onChange={e => {
                  if (e.target.value === '__ADD_NEW__') {
                    setIsAddingSubject(true);
                  } else {
                    setSubject(e.target.value);
                  }
                }}
                className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs font-bold text-neutral-900 dark:text-white focus:outline-none"
              >
                {subjects.map(subj => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
                <option value="__ADD_NEW__">+ Yeni Ders Değişkeni...</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Konu
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Konu"
                className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs font-bold text-neutral-900 dark:text-white"
                required
              />
            </div>
          </div>

          {isAddingSubject && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <input
                type="text"
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
                placeholder="Yeni ders adı girin..."
                className="flex-1 p-2 rounded-lg bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 text-xs font-bold text-neutral-900 dark:text-white"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddCustomSubject}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer"
              >
                Ekle
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingSubject(false);
                  setNewSubjectName('');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-bold cursor-pointer"
              >
                İptal
              </button>
            </div>
          )}

          {/* Çalışma Süresi (Dakika) Giriş Alanı */}
          <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500 shrink-0" />
              <div>
                <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                  Çalışma Süresi (Dakika)
                </span>
                <span className="text-[11px] text-neutral-500">
                  Öğretmene gönderilecek süre
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDurationMinutes(prev => Math.max(1, (Number(prev) || 1) - 5))}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold font-mono cursor-pointer hover:opacity-80"
              >
                -5
              </button>
              <input
                type="number"
                min={1}
                max={720}
                value={durationMinutes}
                onChange={e => setDurationMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/15 text-center font-extrabold font-mono text-sm text-blue-600 dark:text-blue-400 focus:outline-none"
                required
              />
              <span className="text-xs font-bold text-neutral-500">dk</span>
              <button
                type="button"
                onClick={() => setDurationMinutes(prev => Math.min(720, (Number(prev) || 0) + 5))}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold font-mono cursor-pointer hover:opacity-80"
              >
                +5
              </button>
            </div>
          </div>

          {/* Toplam Çözülen Soru Sayısı Başlığı */}
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-rose-500" />
              <span>Çözülen Soru Sayıları</span>
            </label>
            <span className="text-xs font-mono font-extrabold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded-full">
              Toplam: {totalQuestions} Soru
            </span>
          </div>

          {/* Doğru (Correct) */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/25">
            <div>
              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 block">
                Doğru Sayısı
              </span>
              <span className="text-[11px] text-neutral-400">Başarılı çözümler</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCorrect(prev => Math.max(0, prev - 1))}
                className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold hover:bg-emerald-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="0"
                value={correct}
                onChange={e => setCorrect(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 text-center font-bold text-lg text-emerald-600 dark:text-emerald-400 bg-transparent focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setCorrect(prev => prev + 1)}
                className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold hover:bg-emerald-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Yanlış (Wrong) */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/25">
            <div>
              <span className="font-bold text-sm text-rose-600 dark:text-rose-400 block">
                Yanlış Sayısı
              </span>
              <span className="text-[11px] text-neutral-400">4 yanlış 1 doğruyu götürür (-0.25 net)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWrong(prev => Math.max(0, prev - 1))}
                className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold hover:bg-rose-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="0"
                value={wrong}
                onChange={e => setWrong(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 text-center font-bold text-lg text-rose-600 dark:text-rose-400 bg-transparent focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setWrong(prev => prev + 1)}
                className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold hover:bg-rose-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Boş (Blank) */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-500/5 border border-neutral-500/25">
            <div>
              <span className="font-bold text-sm text-neutral-600 dark:text-neutral-400 block">
                Boş Bırakılan
              </span>
              <span className="text-[11px] text-neutral-400">Cevaplanmamış sorular</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBlank(prev => Math.max(0, prev - 1))}
                className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-bold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all active:scale-95 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="0"
                value={blank}
                onChange={e => setBlank(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 text-center font-bold text-lg text-neutral-700 dark:text-neutral-300 bg-transparent focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setBlank(prev => prev + 1)}
                className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-bold hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Net and Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-emerald-500/10 border border-blue-500/20 flex items-center justify-between">
            <div>
              <div className="text-xs text-neutral-600 dark:text-neutral-300 font-semibold">
                Toplam: <strong className="text-neutral-900 dark:text-white font-mono">{totalQuestions} Soru</strong>
              </div>
              <div className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5 font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>Aynı ders değişkeni altında ortak analize işlenecek!</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
                Hesaplanan Net
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {net} <span className="text-xs font-normal">Net</span>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-98 cursor-pointer mt-4"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Sonuçları Kaydet ve Öğretmene Gönder</span>
          </button>
        </form>
      </div>
    </div>
  );
};
