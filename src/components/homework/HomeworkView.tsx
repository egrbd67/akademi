import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Send,
  MessageSquare,
  BookOpen,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Homework, HomeworkStatus } from '../../types';

export const HomeworkView: React.FC = () => {
  const {
    role,
    currentStudent,
    homeworks,
    addHomework,
    updateHomework,
    startTimer
  } = useApp();

  const [filter, setFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeSubmissionModal, setActiveSubmissionModal] = useState<Homework | null>(null);
  const [activeFeedbackModal, setActiveFeedbackModal] = useState<Homework | null>(null);

  // New Homework Form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubject, setNewSubject] = useState('Matematik');
  const [newTopic, setNewTopic] = useState('');
  const [newSourceBook, setNewSourceBook] = useState('');
  const [newTargetQuestions, setNewTargetQuestions] = useState(50);
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  // Student Submission Form
  const [subCorrect, setSubCorrect] = useState(42);
  const [subWrong, setSubWrong] = useState(5);
  const [subBlank, setSubBlank] = useState(3);
  const [subNote, setSubNote] = useState('');

  // Teacher Feedback Form
  const [feedbackText, setFeedbackText] = useState('');

  // Filter homeworks for current student
  const studentHomeworks = useMemo(() => {
    if (!currentStudent) return [];
    const today = new Date().toISOString().split('T')[0];

    return homeworks
      .filter(h => h.studentId === currentStudent.id)
      .map(h => {
        const isOverdue = h.status === 'pending' && h.dueDate < today;
        return { ...h, isOverdue };
      })
      .filter(h => {
        if (filter === 'ALL') return true;
        if (filter === 'OVERDUE') return h.isOverdue;
        if (filter === 'PENDING') return h.status === 'pending';
        if (filter === 'SUBMITTED') return h.status === 'submitted';
        if (filter === 'APPROVED') return h.status === 'approved';
        return true;
      });
  }, [homeworks, currentStudent, filter]);

  if (!currentStudent) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 text-center max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 font-bold">
          <CheckSquare className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
          Ödev ve Görev Takibi
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
          Henüz seçili bir öğrenci bulunmuyor. Ödevleri görüntülemek, yeni ödev atamak veya ödev teslimi yapmak için Kullanıcı Paneli'nden bir öğrenci seçin.
        </p>
      </div>
    );
  }

  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTopic.trim()) return;

    addHomework({
      studentId: currentStudent.id,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Verilen sorular eksiksiz çözülecek ve yanlışlar kontrol edilecek.',
      subject: newSubject,
      topic: newTopic.trim(),
      sourceBook: newSourceBook.trim() || 'Kaynak Kitap',
      targetQuestionCount: Number(newTargetQuestions),
      dueDate: newDueDate,
      status: 'pending',
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewTopic('');
    setNewDesc('');
  };

  const handleSubmitHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmissionModal) return;

    const net = Number((subCorrect - subWrong / 4).toFixed(2));

    updateHomework(activeSubmissionModal.id, {
      status: 'submitted',
      studentSubmission: {
        correct: subCorrect,
        wrong: subWrong,
        blank: subBlank,
        net,
        studentNote: subNote,
        submittedAt: new Date().toISOString(),
      },
    });

    setActiveSubmissionModal(null);
    setSubNote('');
  };

  const handleApproveHomework = (hwId: string, isApproved: boolean) => {
    updateHomework(hwId, {
      status: isApproved ? 'approved' : 'rejected',
      teacherFeedback: feedbackText || (isApproved ? 'Tebrikler, ödevin başarıyla tamamlandı!' : 'Eksikler tespit edildi, lütfen tekrar çözün.'),
    });
    setActiveFeedbackModal(null);
    setFeedbackText('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/5 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Ödev Takip ve Değerlendirme
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {currentStudent.name}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Son teslim tarihi kontrollü ödevler, gecikme uyarıları ve hoca onayı
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role === 'teacher' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Ödev Ata</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: 'Tüm Ödevler' },
          { id: 'PENDING', label: 'Devam Edenler' },
          { id: 'OVERDUE', label: '⚠️ Gecikenler' },
          { id: 'SUBMITTED', label: 'Hoca Onayı Bekleyen' },
          { id: 'APPROVED', label: 'Tamamlanan & Onaylı' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              filter === tab.id
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                : 'bg-white dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-black/5 dark:border-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Homework Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {studentHomeworks.length === 0 ? (
          <div className="col-span-full py-12 text-center text-neutral-400 text-sm bg-white dark:bg-[#1C1C1E] rounded-3xl border border-black/5 dark:border-white/5">
            Bu kategoride ödev bulunmuyor.
          </div>
        ) : (
          studentHomeworks.map(hw => {
            return (
              <div
                key={hw.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {hw.subject}
                    </span>

                    {/* Status badge */}
                    {hw.isOverdue ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Gecikti</span>
                      </span>
                    ) : hw.status === 'approved' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Onaylandı</span>
                      </span>
                    ) : hw.status === 'submitted' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>İnceleniyor</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        Bekliyor
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-1">
                    {hw.title}
                  </h3>
                  <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-2">
                    Konu: {hw.topic} • Kaynak: {hw.sourceBook}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                    {hw.description}
                  </p>
                </div>

                {/* Details Footer */}
                <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Teslim: <strong>{hw.dueDate}</strong></span>
                    </div>
                    <div className="font-bold text-neutral-900 dark:text-white">
                      Hedef: {hw.targetQuestionCount} Soru
                    </div>
                  </div>

                  {/* If student submitted */}
                  {hw.studentSubmission && (
                    <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-black/5 dark:border-white/5 text-xs">
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span className="text-neutral-600 dark:text-neutral-300">Öğrenci Çözümü:</span>
                        <span className="text-blue-600 dark:text-blue-400 font-mono">
                          {hw.studentSubmission.net} Net
                        </span>
                      </div>
                      <div className="text-neutral-500 text-[11px]">
                        {hw.studentSubmission.correct} Doğru • {hw.studentSubmission.wrong} Yanlış • {hw.studentSubmission.blank} Boş
                      </div>
                      {hw.studentSubmission.studentNote && (
                        <div className="text-neutral-600 dark:text-neutral-400 italic text-[11px] mt-1">
                          "{hw.studentSubmission.studentNote}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Teacher Feedback if any */}
                  {hw.teacherFeedback && (
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-0.5 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Öğretmen Değerlendirmesi:</span>
                      </div>
                      <p className="text-neutral-700 dark:text-neutral-300 text-[11px] italic">
                        "{hw.teacherFeedback}"
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {/* Integrated Study Timer for homework */}
                    {hw.status !== 'approved' && (
                      <button
                        onClick={() => {
                          startTimer({
                            homeworkId: hw.id,
                            subject: hw.subject,
                            topic: hw.topic,
                            mode: 'stopwatch',
                          });
                        }}
                        className="flex-1 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Ödev için entegre sayacı başlat"
                      >
                        <Play className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                        <span>Sayacı Başlat</span>
                      </button>
                    )}

                    {/* Student Submit Button */}
                    {role === 'student' && hw.status !== 'approved' && (
                      <button
                        onClick={() => setActiveSubmissionModal(hw)}
                        className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{hw.status === 'submitted' ? 'Güncelle' : 'Ödevi Tamamla'}</span>
                      </button>
                    )}

                    {/* Teacher Review Button */}
                    {role === 'teacher' && hw.status === 'submitted' && (
                      <button
                        onClick={() => setActiveFeedbackModal(hw)}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>İncele & Onayla</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Yeni Ödev Ata (Teacher) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
              Öğrenciye Yeni Ödev Ata
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Öğrenci: <strong className="text-neutral-900 dark:text-white">{currentStudent.name}</strong>
            </p>

            <form onSubmit={handleCreateHomework} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Ödev Başlığı
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Örn: Limit ve Süreklilik Karma Testler"
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
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
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Konu
                  </label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={e => setNewTopic(e.target.value)}
                    placeholder="Örn: Limit"
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Hedef Soru Sayısı
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newTargetQuestions}
                    onChange={e => setNewTargetQuestions(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Son Teslim Tarihi
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
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
                  value={newSourceBook}
                  onChange={e => setNewSourceBook(e.target.value)}
                  placeholder="Örn: Apotemi Limit Fasikülü Test 1-4"
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Ödev Yönergesi / Açıklama
                </label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Öğrencinin dikkat etmesi gereken noktalar..."
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
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25"
                >
                  Ödevi Ata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ödevi Tamamla & Soru Gir (Student) */}
      {activeSubmissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
              Ödevi Tamamla ve Gönder
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              "{activeSubmissionModal.title}" ödevi için çözülen soru sayılarını girin.
            </p>

            <form onSubmit={handleSubmitHomework} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <label className="text-[11px] font-bold text-emerald-600 block mb-1">Doğru</label>
                  <input
                    type="number"
                    min="0"
                    value={subCorrect}
                    onChange={e => setSubCorrect(Number(e.target.value))}
                    className="w-full text-center font-bold text-lg text-emerald-600 bg-transparent focus:outline-none"
                  />
                </div>
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <label className="text-[11px] font-bold text-rose-600 block mb-1">Yanlış</label>
                  <input
                    type="number"
                    min="0"
                    value={subWrong}
                    onChange={e => setSubWrong(Number(e.target.value))}
                    className="w-full text-center font-bold text-lg text-rose-600 bg-transparent focus:outline-none"
                  />
                </div>
                <div className="p-3 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800">
                  <label className="text-[11px] font-bold text-neutral-500 block mb-1">Boş</label>
                  <input
                    type="number"
                    min="0"
                    value={subBlank}
                    onChange={e => setSubBlank(Number(e.target.value))}
                    className="w-full text-center font-bold text-lg text-neutral-700 dark:text-neutral-300 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-between text-xs font-bold">
                <span>Hesaplanan Net:</span>
                <span className="font-mono text-base">
                  {(subCorrect - subWrong / 4).toFixed(2)} Net
                </span>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Öğretmene Notun (İsteğe Bağlı)
                </label>
                <textarea
                  value={subNote}
                  onChange={e => setSubNote(e.target.value)}
                  placeholder="Örn: Son testteki 2 soruda takıldım, görüşmede soracağım."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubmissionModal(null)}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 font-semibold text-xs"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-md"
                >
                  Ödevi Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ödev Değerlendirme & Onay (Teacher) */}
      {activeFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
              Ödevi Değerlendir & Onayla
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Öğrenci: <strong className="text-neutral-900 dark:text-white">{currentStudent.name}</strong> • "{activeFeedbackModal.title}"
            </p>

            <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 mb-4 text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span>Çözülen Soru:</span>
                <span>{activeFeedbackModal.studentSubmission?.net} Net</span>
              </div>
              <div className="text-neutral-500">
                {activeFeedbackModal.studentSubmission?.correct} Doğru / {activeFeedbackModal.studentSubmission?.wrong} Yanlış / {activeFeedbackModal.studentSubmission?.blank} Boş
              </div>
              {activeFeedbackModal.studentSubmission?.studentNote && (
                <div className="text-neutral-700 dark:text-neutral-300 italic pt-1">
                  Öğrenci notu: "{activeFeedbackModal.studentSubmission.studentNote}"
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Öğretmen Geri Bildirimi
              </label>
              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Örn: Harika çalışma Ali! Yanlış yaptığın 3 sorunun çözümünü yarın birlikte inceleyelim."
                rows={3}
                className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs text-neutral-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleApproveHomework(activeFeedbackModal.id, false)}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold"
              >
                Eksik Olarak İşaretle
              </button>
              <button
                type="button"
                onClick={() => handleApproveHomework(activeFeedbackModal.id, true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
              >
                Onayla & Geri Bildirim Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
