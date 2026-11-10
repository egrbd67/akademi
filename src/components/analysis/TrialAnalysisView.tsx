import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';
import {
  BarChart3,
  Plus,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Layers,
  Trash2,
  CheckCircle2,
  Award,
  ArrowUpRight,
  BookOpen,
  Send
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TrialExam, ExamType, ErrorReason, ExamSectionResult, ExamQuestionError } from '../../types';
import { exportTrialExamsToExcel } from '../../utils/excelExport';

const PIE_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'];

interface TrialAnalysisViewProps {
  onAssignHomeworkFromTopic?: (subject: string, topic: string) => void;
}

export const TrialAnalysisView: React.FC<TrialAnalysisViewProps> = ({ onAssignHomeworkFromTopic }) => {
  const { currentStudent, trialExams, addTrialExam, deleteTrialExam, addHomework, addScheduleItem } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [examTypeFilter, setExamTypeFilter] = useState<string>('ALL');

  // Quick action modal for Red Alert topic
  const [quickActionModal, setQuickActionModal] = useState<{
    isOpen: boolean;
    subject: string;
    topic: string;
    errorCount: number;
  } | null>(null);

  // New Exam Form State
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examType, setExamType] = useState<ExamType>('TYT');
  const [sections, setSections] = useState<Array<{ name: string; correct: number; wrong: number; blank: number }>>([
    { name: 'Türkçe', correct: 35, wrong: 4, blank: 1 },
    { name: 'Temel Matematik', correct: 32, wrong: 5, blank: 3 },
    { name: 'Fen Bilimleri', correct: 16, wrong: 3, blank: 1 },
    { name: 'Sosyal Bilimler', correct: 17, wrong: 2, blank: 1 },
  ]);

  // Dynamic error tags input during exam creation
  const [examErrors, setExamErrors] = useState<ExamQuestionError[]>([
    {
      id: 'err-new-1',
      subject: 'Temel Matematik',
      topic: 'Türev',
      status: 'wrong',
      errorReason: 'Bilgi Eksikliği',
      notes: 'Türevin geometrik yorumunda teğet eğimi formülü unutuldu.',
    },
    {
      id: 'err-new-2',
      subject: 'Fen Bilimleri',
      topic: 'Optik',
      status: 'wrong',
      errorReason: 'Süre Yetişmedi',
      notes: 'Soruya son 1 dakikada bakabildim.',
    },
  ]);

  const [newErrorSubject, setNewErrorSubject] = useState('Temel Matematik');
  const [newErrorTopic, setNewErrorTopic] = useState('');
  const [newErrorStatus, setNewErrorStatus] = useState<'wrong' | 'blank'>('wrong');
  const [newErrorReason, setNewErrorReason] = useState<ErrorReason>('Bilgi Eksikliği');

  // Filter exams for student
  const studentExams = useMemo(() => {
    if (!currentStudent) return [];
    return trialExams
      .filter(e => e.studentId === currentStudent.id)
      .filter(e => examTypeFilter === 'ALL' || e.examType === examTypeFilter)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [trialExams, currentStudent, examTypeFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    if (studentExams.length === 0) {
      return { totalExams: 0, latestNet: 0, avgNet: 0, bestNet: 0, totalErrors: 0 };
    }
    const totalExams = studentExams.length;
    const latestNet = studentExams[studentExams.length - 1].totalNet;
    const allNets = studentExams.map(e => e.totalNet);
    const avgNet = Number((allNets.reduce((a, b) => a + b, 0) / totalExams).toFixed(2));
    const bestNet = Math.max(...allNets);
    const totalErrors = studentExams.reduce((acc, curr) => acc + curr.errors.length, 0);

    return { totalExams, latestNet, avgNet, bestNet, totalErrors };
  }, [studentExams]);

  // Chart 1: Net progress line data
  const progressLineData = useMemo(() => {
    return studentExams.map(e => ({
      name: e.title.length > 18 ? e.title.substring(0, 16) + '...' : e.title,
      tarih: e.date.substring(5),
      net: e.totalNet,
      tamAd: e.title,
    }));
  }, [studentExams]);

  // Chart 2: Error Reason Breakdown (Pie Chart)
  const errorReasonData = useMemo(() => {
    const counts: Record<string, number> = {};
    studentExams.forEach(e => {
      e.errors.forEach(err => {
        counts[err.errorReason] = (counts[err.errorReason] || 0) + 1;
      });
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [studentExams]);

  // Chart 3: Red Alert Topics (Kırmızı Alarm Konuları - Most failed topics)
  const redAlertTopics = useMemo(() => {
    const map: Record<string, { subject: string; topic: string; count: number; reasons: Record<string, number> }> = {};

    studentExams.forEach(e => {
      e.errors.forEach(err => {
        const key = `${err.subject}___${err.topic}`;
        if (!map[key]) {
          map[key] = {
            subject: err.subject,
            topic: err.topic,
            count: 0,
            reasons: {},
          };
        }
        map[key].count += 1;
        map[key].reasons[err.errorReason] = (map[key].reasons[err.errorReason] || 0) + 1;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [studentExams]);

  if (!currentStudent) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 text-center max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto mb-4 font-bold">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
          Deneme ve Soru Analizi
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
          Henüz seçili bir öğrenci bulunmuyor. Deneme sınavı sonuçları, gelişim grafikleri ve kırmızı alarm konularını görüntülemek için Kullanıcı Paneli'nden bir öğrenci seçin.
        </p>
      </div>
    );
  }

  // Handle Export Excel
  const handleExportExcel = () => {
    exportTrialExamsToExcel(studentExams, currentStudent);
  };

  const handlePrint = () => {
    window.print();
  };

  // Add Section Row in Modal
  const handleUpdateSection = (index: number, field: string, value: number | string) => {
    setSections(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddSectionRow = () => {
    setSections(prev => [...prev, { name: 'Yeni Ders', correct: 20, wrong: 2, blank: 0 }]);
  };

  // Add Error Tag to modal
  const handleAddErrorTag = () => {
    if (!newErrorTopic.trim()) return;
    setExamErrors(prev => [
      ...prev,
      {
        id: `err-${Date.now()}`,
        subject: newErrorSubject,
        topic: newErrorTopic.trim(),
        status: newErrorStatus,
        errorReason: newErrorReason,
      },
    ]);
    setNewErrorTopic('');
  };

  // Submit New Trial Exam
  const handleCreateTrialExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) return;

    // Calculate section nets and total
    let totalC = 0;
    let totalW = 0;
    let totalB = 0;
    let totalNet = 0;

    const computedSections: ExamSectionResult[] = sections.map(sec => {
      const c = Number(sec.correct) || 0;
      const w = Number(sec.wrong) || 0;
      const b = Number(sec.blank) || 0;
      const net = Number((c - w / 4).toFixed(2));
      totalC += c;
      totalW += w;
      totalB += b;
      totalNet += net;
      return {
        name: sec.name,
        correct: c,
        wrong: w,
        blank: b,
        net,
      };
    });

    addTrialExam({
      studentId: currentStudent.id,
      title: examTitle.trim(),
      date: examDate,
      examType,
      sections: computedSections,
      totalCorrect: totalC,
      totalWrong: totalW,
      totalBlank: totalB,
      totalNet: Number(totalNet.toFixed(2)),
      errors: examErrors,
    });

    setIsAddModalOpen(false);
    // Reset form
    setExamTitle('');
    setExamErrors([]);
  };

  // Execute Red Alert 1-Click Action
  const handleExecuteRedAlertAction = (actionType: 'homework' | 'schedule') => {
    if (!quickActionModal) return;
    const { subject, topic } = quickActionModal;

    if (actionType === 'homework') {
      addHomework({
        studentId: currentStudent.id,
        title: `🔴 Kırmızı Alarm Konu Tekrarı: ${topic}`,
        description: `Denemelerde en çok yanlış yapılan "${topic}" konusu için eksik kapatma ve pekiştirme testi.`,
        subject,
        topic,
        sourceBook: 'Hata Defteri & Branş Soru Bankası',
        targetQuestionCount: 50,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
      });
      alert(`"${topic}" konusu için ${currentStudent.name} adlı öğrenciye 50 soruluk ek ödev başarıyla atandı!`);
    } else {
      addScheduleItem({
        studentId: currentStudent.id,
        dayOfWeek: 2, // Salı
        timeRange: '16:00 - 17:30',
        subject,
        topic: `🔴 Telafi Çalışması: ${topic}`,
        sourceBook: 'Konu Özeti & Soru Bankası',
        targetType: 'question',
        targetValue: 40,
        actualDurationMinutes: 0,
        teacherNote: 'Deneme hata analizi doğrultusunda acil telafi programı olarak eklendi.',
        status: 'pending',
      });
      alert(`"${topic}" konusu haftalık çalışma programına eklendi!`);
    }

    setQuickActionModal(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto print-container">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/5 dark:border-white/5 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Deneme Sınavı & Soru Analizi
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {currentStudent.name}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Net gelişim grafiği, hata nedenleri dağılımı ve kırmızı alarmlı eksik konular
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sınav Türü Filtresi */}
          <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold">
            {['ALL', 'TYT', 'AYT', 'LGS'].map(type => (
              <button
                key={type}
                onClick={() => setExamTypeFilter(type)}
                className={`px-3 py-1 rounded-xl transition-all ${
                  examTypeFilter === type
                    ? 'bg-white dark:bg-[#1C1C1E] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {type === 'ALL' ? 'Tümü' : type}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Deneme Ekle</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Excel (.xlsx) Olarak İndir"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden md:inline">Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="A4 Formatında Yazdır"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden md:inline">Yazdır</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 no-print">
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <div className="text-neutral-400 text-xs font-semibold mb-1">Son Deneme Neti</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight font-mono">
            {stats.latestNet} <span className="text-xs font-normal text-neutral-400">Net</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Sürekli yükseliş eğilimi</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <div className="text-neutral-400 text-xs font-semibold mb-1">Ortalama Net</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-mono">
            {stats.avgNet} <span className="text-xs font-normal text-neutral-400">Net</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Toplam {stats.totalExams} deneme sınavı
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <div className="text-neutral-400 text-xs font-semibold mb-1">En Yüksek Net (Zirve)</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 tracking-tight font-mono">
            {stats.bestNet} <span className="text-xs font-normal text-neutral-400">Net</span>
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1 font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>Kişisel Rekor</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <div className="text-neutral-400 text-xs font-semibold mb-1">Etiketlenen Hata / Boş</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-500 tracking-tight font-mono">
            {stats.totalErrors} <span className="text-xs font-normal text-neutral-400">Soru</span>
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">
            Derinlemesine analiz edildi
          </div>
        </div>
      </div>

      {/* Two Detailed Charts: Line Chart & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Net Progress Over Time (2 cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                  1. Net Gelişim Grafiği (Zaman İçindeki Değişim)
                </h3>
                <p className="text-xs text-neutral-400">Her denemenin toplam net performansı</p>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressLineData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#8E8E93' }}
                  axisLine={{ stroke: '#88888820' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8E8E93' }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C1C1E',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FFF',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  }}
                  formatter={(value: any) => [`${value} Net`, 'Toplam Net']}
                  labelFormatter={(_label, payload) => payload?.[0]?.payload?.tamAd || ''}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#007AFF"
                  strokeWidth={3.5}
                  dot={{ r: 5, fill: '#007AFF', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 8, stroke: '#007AFF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Error Reason Distribution (Pie Chart) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                  2. Hata Nedenleri Dağılımı
                </h3>
                <p className="text-xs text-neutral-400">Yanlış & Boş bırakma gerekçeleri</p>
              </div>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={errorReasonData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {errorReasonData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1C1C1E',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#FFF',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 pt-3 border-t border-black/5 dark:border-white/5 text-xs">
            {errorReasonData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span className="truncate max-w-[160px]">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-neutral-900 dark:text-white">{item.value} adet</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Kırmızı Alarm Konuları (Red Alert Topics) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <span>3. Kırmızı Alarm Konuları (Öncelikli Eksikler)</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  Acil Müdahale
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                En çok yanlış veya boş yapılan konular; tek tıkla telafi ödevi veya programa ekleyin
              </p>
            </div>
          </div>
        </div>

        {redAlertTopics.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            Henüz analiz edilecek kırmızı alarm konusu kaydedilmedi.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {redAlertTopics.map((item, idx) => (
              <div
                key={`${item.subject}-${item.topic}`}
                className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-black/5 dark:border-white/5 hover:border-rose-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-neutral-400">
                      #{idx + 1} Öncelik
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                      {item.count} Hata / Boş
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {item.subject}
                  </div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white mt-0.5 mb-2">
                    {item.topic}
                  </h4>

                  {/* Reasons pills */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {Object.entries(item.reasons).map(([reason, count]) => (
                      <span
                        key={reason}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                      >
                        {reason}: {count}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 1-Click Action Button */}
                <button
                  onClick={() =>
                    setQuickActionModal({
                      isOpen: true,
                      subject: item.subject,
                      topic: item.topic,
                      errorCount: item.count,
                    })
                  }
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tek Tıkla Ek Ödev / Program Ata</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trial Exam List (Cards / Details) */}
      <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs p-6">
        <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-4">
          Girilen Tüm Denemeler ({studentExams.length})
        </h3>

        <div className="space-y-4">
          {studentExams.map(exam => (
            <div
              key={exam.id}
              className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-black/5 dark:border-white/5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-neutral-900 dark:text-white">
                      {exam.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {exam.examType}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Sınav Tarihi: {exam.date} • Toplam {exam.totalCorrect} Doğru / {exam.totalWrong} Yanlış / {exam.totalBlank} Boş
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-neutral-400">Toplam Net</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                      {exam.totalNet} Net
                    </div>
                  </div>

                  {deleteTrialExam && (
                    deletingExamId === exam.id ? (
                      <div className="flex items-center gap-1 animate-in fade-in">
                        <button
                          onClick={() => {
                            deleteTrialExam(exam.id);
                            setDeletingExamId(null);
                          }}
                          className="px-2 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs cursor-pointer"
                        >
                          Sil
                        </button>
                        <button
                          onClick={() => setDeletingExamId(null)}
                          className="px-1.5 py-1 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[11px] font-semibold cursor-pointer"
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingExamId(exam.id)}
                        className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Sections Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-black/5 dark:border-white/5">
                {exam.sections.map(sec => (
                  <div key={sec.name} className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 text-xs">
                    <div className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {sec.name}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-neutral-400 text-[11px]">
                        {sec.correct}D {sec.wrong}Y
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {sec.net} Net
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error Tags in this exam */}
              {exam.errors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                  <div className="text-[11px] font-bold text-neutral-400 mb-1.5">
                    Hata / Boş Konu Etiketleri:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {exam.errors.map(err => (
                      <div
                        key={err.id}
                        className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs flex items-center gap-2"
                      >
                        <span className={`w-2 h-2 rounded-full ${err.status === 'wrong' ? 'bg-rose-500' : 'bg-neutral-400'}`} />
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">
                          {err.topic}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold">
                          {err.errorReason}
                        </span>
                        {err.notes && (
                          <span className="text-[11px] text-neutral-400 italic">
                            ({err.notes})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Yeni Deneme Sınavı Ekle */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
              Yeni Deneme Sınavı ve Soru Analizi Ekle
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Ders bazlı Doğru, Yanlış ve Boşları girin. Netler otomatik hesaplanır.
            </p>

            <form onSubmit={handleCreateTrialExam} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Deneme Adı / Yayın
                  </label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={e => setExamTitle(e.target.value)}
                    placeholder="Örn: 3D Türkiye Geneli TYT-4"
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Sınav Türü
                  </label>
                  <select
                    value={examType}
                    onChange={e => setExamType(e.target.value as ExamType)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                    <option value="LGS">LGS</option>
                    <option value="Branş">Branş Denemesi</option>
                    <option value="MSÜ">MSÜ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Uygulanma Tarihi
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                  required
                />
              </div>

              {/* Sections Table Inputs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-neutral-800 dark:text-neutral-200">
                    Ders Bazlı Sonuçlar (Doğru / Yanlış / Boş / Net)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSectionRow}
                    className="text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ders Ekle</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {sections.map((sec, idx) => {
                    const c = Number(sec.correct) || 0;
                    const w = Number(sec.wrong) || 0;
                    const net = (c - w / 4).toFixed(2);
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/60"
                      >
                        <input
                          type="text"
                          value={sec.name}
                          onChange={e => handleUpdateSection(idx, 'name', e.target.value)}
                          className="col-span-4 p-1.5 rounded-lg bg-white dark:bg-neutral-700 font-semibold text-xs"
                          placeholder="Ders Adı"
                        />
                        <div className="col-span-2 flex items-center gap-1">
                          <span className="text-[10px] text-emerald-500 font-bold">D:</span>
                          <input
                            type="number"
                            min="0"
                            value={sec.correct}
                            onChange={e => handleUpdateSection(idx, 'correct', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg bg-white dark:bg-neutral-700 font-bold text-xs"
                          />
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <span className="text-[10px] text-rose-500 font-bold">Y:</span>
                          <input
                            type="number"
                            min="0"
                            value={sec.wrong}
                            onChange={e => handleUpdateSection(idx, 'wrong', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg bg-white dark:bg-neutral-700 font-bold text-xs"
                          />
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <span className="text-[10px] text-neutral-400 font-bold">B:</span>
                          <input
                            type="number"
                            min="0"
                            value={sec.blank}
                            onChange={e => handleUpdateSection(idx, 'blank', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg bg-white dark:bg-neutral-700 font-bold text-xs"
                          />
                        </div>
                        <div className="col-span-2 text-right font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                          {net} N
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Error & Topic Analysis Input */}
              <div className="pt-2 border-t border-black/5 dark:border-white/5">
                <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  Eksik Konu ve Hata Nedeni Etiketleme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
                  <select
                    value={newErrorSubject}
                    onChange={e => setNewErrorSubject(e.target.value)}
                    className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-medium"
                  >
                    {sections.map(s => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={newErrorTopic}
                    onChange={e => setNewErrorTopic(e.target.value)}
                    placeholder="Konu (Örn: Türev, Optik)"
                    className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs"
                  />

                  <select
                    value={newErrorReason}
                    onChange={e => setNewErrorReason(e.target.value as ErrorReason)}
                    className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-medium"
                  >
                    <option value="Bilgi Eksikliği">Bilgi Eksikliği</option>
                    <option value="Dikkat / Okuma Hatası">Dikkat / Okuma Hatası</option>
                    <option value="Süre Yetişmedi">Süre Yetişmedi</option>
                    <option value="İşlem Hatası">İşlem Hatası</option>
                    <option value="Soru Kökünü Yanlış Anlama">Soru Kökü Hatası</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleAddErrorTag}
                    className="p-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs"
                  >
                    Etiket Ekle
                  </button>
                </div>

                {/* Tagged list */}
                {examErrors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/40">
                    {examErrors.map((err, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center gap-1"
                      >
                        {err.topic} ({err.errorReason})
                        <button
                          type="button"
                          onClick={() => setExamErrors(prev => prev.filter((_, idx) => idx !== i))}
                          className="ml-1 text-neutral-400 hover:text-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 font-semibold text-xs"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25"
                >
                  Denemeyi Kaydet & Analiz Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Red Alert Action (Tek Tıkla Ek Ödev / Program Ata) */}
      {quickActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-6 sm:p-8">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold mb-3">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>

            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
              Kırmızı Alarm Konusu Müdahalesi
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              <strong className="text-neutral-900 dark:text-white">{quickActionModal.topic}</strong> konusunda denemelerde toplam {quickActionModal.errorCount} hata tespit edildi.
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleExecuteRedAlertAction('homework')}
                className="w-full p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 hover:bg-rose-500/10 border border-black/5 dark:border-white/5 text-left transition-all active:scale-98 cursor-pointer"
              >
                <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-bold text-sm">
                  <span>1. Telafi Ödevi Olarak Ata (50 Soru)</span>
                  <BookOpen className="w-4 h-4" />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Öğrencinin ödev takip listesine 3 gün teslim süreli pekiştirme ödevi ekler.
                </p>
              </button>

              <button
                onClick={() => handleExecuteRedAlertAction('schedule')}
                className="w-full p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 hover:bg-blue-500/10 border border-black/5 dark:border-white/5 text-left transition-all active:scale-98 cursor-pointer"
              >
                <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold text-sm">
                  <span>2. Haftalık Çalışma Programına Ekle</span>
                  <Layers className="w-4 h-4" />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Öğrencinin haftalık takviminde Salı gününe 40 soruluk telafi dersi olarak yerleştirir.
                </p>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setQuickActionModal(null)}
                className="px-4 py-2 rounded-xl text-neutral-500 text-xs font-semibold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
