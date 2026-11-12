import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Plus,
  BarChart3,
  ArrowRight,
  Award,
  CheckCircle2,
  BookOpen,
  Calendar,
  Send,
  Trash2,
  Sparkles,
  User,
  Edit2,
  X,
  Check,
  Layers,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { ErrorReason, ExamErrorTag, ExamType, TrialExam } from '../../types';
import { normalizeSubjectName, EXAM_TYPE_DEFAULT_SECTIONS } from '../../constants/subjects';

const ERROR_COLORS: Record<string, string> = {
  Bilgi_Eksigi: '#FF3B30',
  Dikkat_Hatasi: '#FF9500',
  Sure_Yetismedi: '#007AFF',
  Islem_Hatasi: '#AF52DE',
  Kavram_Yanilsisi: '#34C759',
  'Bilgi Eksikliği': '#FF3B30',
  'Dikkat / Okuma Hatası': '#FF9500',
  'Süre Yetişmedi': '#007AFF',
  'İşlem Hatası': '#AF52DE',
  'Soru Kökünü Yanlış Anlama': '#34C759'
};

const ERROR_LABELS: Record<string, string> = {
  Bilgi_Eksigi: 'Bilgi Eksiği',
  Dikkat_Hatasi: 'Dikkat Hatası',
  Sure_Yetismedi: 'Süre Yetişmedi',
  Islem_Hatasi: 'İşlem Hatası',
  Kavram_Yanilsisi: 'Kavram Yanılgısı',
  'Bilgi Eksikliği': 'Bilgi Eksiği',
  'Dikkat / Okuma Hatası': 'Dikkat Hatası',
  'Süre Yetişmedi': 'Süre Yetişmedi',
  'İşlem Hatası': 'İşlem Hatası',
  'Soru Kökünü Yanlış Anlama': 'Kavram Yanılgısı'
};

interface EditableQuestionRecord {
  kind: 'focus' | 'schedule';
  rawId: string;
  studentId: string;
  studentName: string;
  dateLabel: string;
  timestampMs: number;
  subject: string;
  topic: string;
  durationMinutes: number;
  correct: number;
  wrong: number;
  blank: number;
  net: number;
  note?: string;
}

export const TrialAnalysisView: React.FC = () => {
  const {
    role,
    currentStudent,
    currentStudentId,
    setCurrentStudentId,
    students,
    subjects,
    addSubjectVariable,
    trialExams,
    addTrialExam,
    updateTrialExam,
    deleteTrialExam,
    focusSessions,
    addFocusSession,
    updateFocusSession,
    deleteFocusSession,
    schedules,
    updateScheduleItem,
    deleteScheduleItem,
    homeworks,
    addScheduleItem,
    addHomework
  } = useApp();

  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [confirmDeleteExamId, setConfirmDeleteExamId] = useState<string | null>(null);

  const [selectedCrossSubject, setSelectedCrossSubject] = useState<string>('ALL');
  const [newSubjectVarDraft, setNewSubjectVarDraft] = useState<string>('');
  const [isAddingSubjectVar, setIsAddingSubjectVar] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Add / Edit Question Record Modal State
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [editingQuestionRecord, setEditingQuestionRecord] = useState<EditableQuestionRecord | null>(null);
  const [qSubject, setQSubject] = useState<string>('Matematik');
  const [qTopic, setQTopic] = useState<string>('Soru Çözümü');
  const [qDurationMinutes, setQDurationMinutes] = useState<number>(30);
  const [qCorrect, setQCorrect] = useState<number>(20);
  const [qWrong, setQWrong] = useState<number>(2);
  const [qBlank, setQBlank] = useState<number>(0);
  const [qNote, setQNote] = useState<string>('');
  const [confirmDeleteQuestionKey, setConfirmDeleteQuestionKey] = useState<string | null>(null);

  // Action modal state for Red Alert -> Assign to Schedule or Homework
  const [redAlertActionModal, setRedAlertActionModal] = useState<{
    isOpen: boolean;
    subject: string;
    topic: string;
    targetType: 'schedule' | 'homework';
  } | null>(null);

  const [actionDay, setActionDay] = useState<number>(6);
  const [actionTime, setActionTime] = useState<string>('11:00 - 12:30');
  const [actionSource, setActionSource] = useState<string>('3D Yayınları Soru Bankası');
  const [actionQuestionCount, setActionQuestionCount] = useState<number>(50);

  // New / Edit Trial Exam Form State
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDate, setNewExamDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newExamType, setNewExamType] = useState<ExamType>('TYT');

  // Dynamic sections for exam entry using shared subject variables
  const [examSections, setExamSections] = useState<
    Array<{ name: string; correct: number; wrong: number; blank: number }>
  >([
    { name: 'Türkçe', correct: 30, wrong: 6, blank: 4 },
    { name: 'Matematik', correct: 28, wrong: 4, blank: 8 },
    { name: 'Fizik', correct: 5, wrong: 1, blank: 1 },
    { name: 'Kimya', correct: 5, wrong: 1, blank: 1 },
    { name: 'Biyoloji', correct: 4, wrong: 1, blank: 1 },
    { name: 'Tarih', correct: 4, wrong: 1, blank: 0 },
    { name: 'Coğrafya', correct: 4, wrong: 1, blank: 0 },
  ]);

  // Error tags to attach to the exam
  const [errorTags, setErrorTags] = useState<ExamErrorTag[]>([
    { subject: 'Matematik', topic: 'Fonksiyonlar', reason: 'Sure_Yetismedi', count: 2 },
    { subject: 'Fizik', topic: 'Optik', reason: 'Bilgi_Eksigi', count: 2 },
  ]);

  const [draftTagSubject, setDraftTagSubject] = useState('Matematik');
  const [draftTagTopic, setDraftTagTopic] = useState('');
  const [draftTagReason, setDraftTagReason] = useState<ErrorReason>('Bilgi_Eksigi');
  const [draftTagCount, setDraftTagCount] = useState(1);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Student exams sorted chronologically
  const studentExams = useMemo(() => {
    if (!currentStudent) return [];
    return trialExams
      .filter(e => e.studentId === currentStudent.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [trialExams, currentStudent]);

  // All editable question records for current student (FocusSessions + Completed Schedules with questions)
  const studentQuestionRecords = useMemo<EditableQuestionRecord[]>(() => {
    if (!currentStudent) return [];
    const list: EditableQuestionRecord[] = [];

    focusSessions
      .filter(f => f.studentId === currentStudent.id)
      .forEach(sess => {
        const c = sess.solvedQuestions?.correct ?? 0;
        const w = sess.solvedQuestions?.wrong ?? 0;
        const b = sess.solvedQuestions?.blank ?? 0;
        const net = sess.solvedQuestions?.net ?? Number(Math.max(0, c - w / 4).toFixed(2));
        list.push({
          kind: 'focus',
          rawId: sess.id,
          studentId: sess.studentId,
          studentName: sess.studentName || currentStudent.name,
          dateLabel: new Date(sess.completedAt).toLocaleString('tr-TR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          }),
          timestampMs: new Date(sess.completedAt).getTime() || 0,
          subject: normalizeSubjectName(sess.subject),
          topic: sess.topic || 'Konu Çalışması',
          durationMinutes: sess.durationMinutes || 0,
          correct: c,
          wrong: w,
          blank: b,
          net,
          note: sess.studentNote
        });
      });

    schedules
      .filter(s => s.studentId === currentStudent.id && s.status === 'completed' && s.solvedQuestions)
      .forEach(sch => {
        const c = sch.solvedQuestions?.correct ?? 0;
        const w = sch.solvedQuestions?.wrong ?? 0;
        const b = sch.solvedQuestions?.blank ?? 0;
        const net = sch.solvedQuestions?.net ?? Number(Math.max(0, c - w / 4).toFixed(2));
        list.push({
          kind: 'schedule',
          rawId: sch.id,
          studentId: sch.studentId,
          studentName: currentStudent.name,
          dateLabel: sch.updatedAt
            ? new Date(sch.updatedAt).toLocaleString('tr-TR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })
            : `${sch.sessionNumber || 1}. Oturum`,
          timestampMs: sch.updatedAt ? new Date(sch.updatedAt).getTime() || 0 : 0,
          subject: normalizeSubjectName(sch.subject),
          topic: sch.topic || 'Program Ders Oturumu',
          durationMinutes: sch.actualDurationMinutes || 0,
          correct: c,
          wrong: w,
          blank: b,
          net,
          note: sch.sourceBook ? `Kaynak: ${sch.sourceBook}` : undefined
        });
      });

    return list.sort((a, b) => b.timestampMs - a.timestampMs);
  }, [focusSessions, schedules, currentStudent]);

  // Unified Cross-Subject Analysis (Denemeler + Ders/Soru Kayıtları aynı ders değişkeni üzerinde)
  const crossSubjectAnalysis = useMemo(() => {
    if (!currentStudent) return [];

    const statsMap = new Map<
      string,
      {
        subject: string;
        examAppearanceCount: number;
        examCorrect: number;
        examWrong: number;
        examBlank: number;
        examTotalNet: number;
        studyRecordCount: number;
        studyCorrect: number;
        studyWrong: number;
        studyBlank: number;
        studyTotalNet: number;
        studyMinutes: number;
        topicsSet: Set<string>;
      }
    >();

    const ensureSubject = (rawName: string) => {
      const canonical = normalizeSubjectName(rawName);
      if (!statsMap.has(canonical)) {
        statsMap.set(canonical, {
          subject: canonical,
          examAppearanceCount: 0,
          examCorrect: 0,
          examWrong: 0,
          examBlank: 0,
          examTotalNet: 0,
          studyRecordCount: 0,
          studyCorrect: 0,
          studyWrong: 0,
          studyBlank: 0,
          studyTotalNet: 0,
          studyMinutes: 0,
          topicsSet: new Set<string>()
        });
      }
      return statsMap.get(canonical)!;
    };

    // 1. Aggregate Trial Exam Sections by normalized subject variable
    studentExams.forEach(exam => {
      (exam.sections || []).forEach(sec => {
        const entry = ensureSubject(sec.name);
        entry.examAppearanceCount += 1;
        entry.examCorrect += Number(sec.correct) || 0;
        entry.examWrong += Number(sec.wrong) || 0;
        entry.examBlank += Number(sec.blank) || 0;
        entry.examTotalNet += Number(sec.net) || 0;
      });
      (exam.errorTags || []).forEach(tag => {
        const entry = ensureSubject(tag.subject);
        if (tag.topic) entry.topicsSet.add(tag.topic);
      });
    });

    // 2. Aggregate Focus / Schedule Question Records by normalized subject variable
    studentQuestionRecords.forEach(rec => {
      const entry = ensureSubject(rec.subject);
      entry.studyRecordCount += 1;
      entry.studyCorrect += rec.correct;
      entry.studyWrong += rec.wrong;
      entry.studyBlank += rec.blank;
      entry.studyTotalNet += rec.net;
      entry.studyMinutes += rec.durationMinutes;
      if (rec.topic) entry.topicsSet.add(rec.topic);
    });

    // 3. Also include Submitted Homeworks
    homeworks
      .filter(h => h.studentId === currentStudent.id && h.studentSubmission)
      .forEach(hw => {
        const sub = hw.studentSubmission!;
        const entry = ensureSubject(hw.subject);
        entry.studyRecordCount += 1;
        entry.studyCorrect += sub.correct || 0;
        entry.studyWrong += sub.wrong || 0;
        entry.studyBlank += sub.blank || 0;
        entry.studyTotalNet += sub.net || 0;
        if (hw.topic) entry.topicsSet.add(hw.topic);
      });

    return Array.from(statsMap.values())
      .map(item => {
        const examQuestions = item.examCorrect + item.examWrong + item.examBlank;
        const studyQuestions = item.studyCorrect + item.studyWrong + item.studyBlank;
        const combinedCorrect = item.examCorrect + item.studyCorrect;
        const combinedWrong = item.examWrong + item.studyWrong;
        const combinedBlank = item.examBlank + item.studyBlank;
        const combinedQuestions = examQuestions + studyQuestions;
        const combinedNet = Number((item.examTotalNet + item.studyTotalNet).toFixed(2));
        const examAvgNet = item.examAppearanceCount > 0
          ? Number((item.examTotalNet / item.examAppearanceCount).toFixed(2))
          : 0;
        const examAccuracy = examQuestions > 0
          ? Math.round((item.examCorrect / examQuestions) * 100)
          : 0;
        const studyAccuracy = studyQuestions > 0
          ? Math.round((item.studyCorrect / studyQuestions) * 100)
          : 0;
        const combinedAccuracy = combinedQuestions > 0
          ? Math.round((combinedCorrect / combinedQuestions) * 100)
          : 0;

        return {
          ...item,
          examQuestions,
          studyQuestions,
          combinedCorrect,
          combinedWrong,
          combinedBlank,
          combinedQuestions,
          combinedNet,
          examAvgNet,
          examAccuracy,
          studyAccuracy,
          combinedAccuracy,
          topics: Array.from(item.topicsSet)
        };
      })
      .sort((a, b) => b.combinedQuestions - a.combinedQuestions || b.studyMinutes - a.studyMinutes);
  }, [currentStudent, studentExams, studentQuestionRecords, homeworks]);

  // Line Chart Data: Net progression over time
  const netProgressionData = useMemo(() => {
    return studentExams.map(exam => ({
      name: exam.title.replace('Özdebir ', '').replace('3D ', '').replace('Bilgi Sarmal ', ''),
      fullTitle: exam.title,
      date: new Date(exam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      net: exam.totalNet,
      correct: exam.totalCorrect,
      wrong: exam.totalWrong
    }));
  }, [studentExams]);

  // Error reason distribution
  const errorDistributionData = useMemo(() => {
    const counts: Record<string, number> = {
      Bilgi_Eksigi: 0,
      Dikkat_Hatasi: 0,
      Sure_Yetismedi: 0,
      Islem_Hatasi: 0,
      Kavram_Yanilsisi: 0
    };

    studentExams.forEach(exam => {
      (exam.errorTags || []).forEach(tag => {
        counts[tag.reason] = (counts[tag.reason] || 0) + tag.count;
      });
    });

    return Object.keys(counts)
      .map(key => ({
        reasonKey: key,
        name: ERROR_LABELS[key] || key,
        value: counts[key],
        fill: ERROR_COLORS[key] || '#007AFF'
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [studentExams]);

  // Chronic Error Detection Engine: Topic missed in >= 2 exams or >= 3 total errors
  const chronicErrors = useMemo(() => {
    const topicMap: Record<
      string,
      {
        subject: string;
        topic: string;
        totalErrors: number;
        examOccurrences: number;
        reasons: Record<string, number>;
      }
    > = {};

    studentExams.forEach(exam => {
      const seenInThisExam = new Set<string>();
      (exam.errorTags || []).forEach(tag => {
        const canonicalSubj = normalizeSubjectName(tag.subject);
        const key = `${canonicalSubj}___${tag.topic.trim().toLowerCase()}`;
        if (!topicMap[key]) {
          topicMap[key] = {
            subject: canonicalSubj,
            topic: tag.topic.trim(),
            totalErrors: 0,
            examOccurrences: 0,
            reasons: {}
          };
        }
        topicMap[key].totalErrors += tag.count;
        const rLabel = ERROR_LABELS[tag.reason] || tag.reason;
        topicMap[key].reasons[rLabel] =
          (topicMap[key].reasons[rLabel] || 0) + tag.count;

        if (!seenInThisExam.has(key)) {
          topicMap[key].examOccurrences += 1;
          seenInThisExam.add(key);
        }
      });
    });

    return Object.values(topicMap)
      .filter(item => item.examOccurrences >= 2 || item.totalErrors >= 3)
      .sort((a, b) => b.totalErrors - a.totalErrors);
  }, [studentExams]);

  // Overall stats
  const latestExam = studentExams[studentExams.length - 1];
  const previousExam = studentExams.length > 1 ? studentExams[studentExams.length - 2] : null;
  const netDiff = latestExam && previousExam ? +(latestExam.totalNet - previousExam.totalNet).toFixed(2) : 0;
  const highestNet = studentExams.length > 0 ? Math.max(...studentExams.map(e => e.totalNet)) : 0;

  // Dynamic calculation for New / Edit Exam Modal
  const newExamTotals = useMemo(() => {
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalBlank = 0;
    let totalNet = 0;

    const computedSections = examSections.map(sec => {
      const net = Number(Math.max(0, sec.correct - sec.wrong / 4).toFixed(2));
      totalCorrect += sec.correct;
      totalWrong += sec.wrong;
      totalBlank += sec.blank;
      totalNet += net;
      return { ...sec, name: normalizeSubjectName(sec.name), net };
    });

    return {
      totalCorrect,
      totalWrong,
      totalBlank,
      totalNet: Number(totalNet.toFixed(2)),
      computedSections
    };
  }, [examSections]);

  const handleOpenNewExamModal = () => {
    setEditingExamId(null);
    setNewExamTitle('');
    setNewExamDate(new Date().toISOString().split('T')[0]);
    setNewExamType('TYT');
    setExamSections([
      { name: 'Türkçe', correct: 30, wrong: 6, blank: 4 },
      { name: 'Matematik', correct: 28, wrong: 4, blank: 8 },
      { name: 'Fizik', correct: 5, wrong: 1, blank: 1 },
      { name: 'Kimya', correct: 5, wrong: 1, blank: 1 },
      { name: 'Biyoloji', correct: 4, wrong: 1, blank: 1 },
      { name: 'Tarih', correct: 4, wrong: 1, blank: 0 },
      { name: 'Coğrafya', correct: 4, wrong: 1, blank: 0 },
    ]);
    setErrorTags([]);
    setIsAddExamModalOpen(true);
  };

  const handleOpenEditExamModal = (exam: TrialExam) => {
    setEditingExamId(exam.id);
    setNewExamTitle(exam.title);
    setNewExamDate(exam.date);
    setNewExamType(exam.examType);
    setExamSections(
      (exam.sections || []).map(sec => ({
        name: normalizeSubjectName(sec.name),
        correct: sec.correct,
        wrong: sec.wrong,
        blank: sec.blank
      }))
    );
    setErrorTags(
      (exam.errorTags || []).map(t => ({
        ...t,
        subject: normalizeSubjectName(t.subject)
      }))
    );
    setIsAddExamModalOpen(true);
  };

  const handleSelectExamTypePreset = (type: 'TYT' | 'AYT' | 'LGS' | 'Branş') => {
    setNewExamType(type);
    if (!editingExamId) {
      const defaults = EXAM_TYPE_DEFAULT_SECTIONS[type] || ['Matematik'];
      setExamSections(
        defaults.map(name => ({
          name,
          correct: 0,
          wrong: 0,
          blank: 0
        }))
      );
    }
  };

  const handleAddErrorTagToDraft = () => {
    if (!draftTagTopic.trim()) return;
    const canonicalSubject = normalizeSubjectName(draftTagSubject);
    addSubjectVariable(canonicalSubject);
    setErrorTags(prev => [
      ...prev,
      {
        subject: canonicalSubject,
        topic: draftTagTopic.trim(),
        reason: draftTagReason,
        count: Math.max(1, draftTagCount)
      }
    ]);
    setDraftTagTopic('');
    setDraftTagCount(1);
  };

  const handleRemoveErrorTagFromDraft = (idx: number) => {
    setErrorTags(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveTrialExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    newExamTotals.computedSections.forEach(s => addSubjectVariable(s.name));

    if (editingExamId) {
      await updateTrialExam(editingExamId, {
        title: newExamTitle.trim() || `${newExamType} Deneme Sınavı`,
        date: newExamDate,
        examType: newExamType,
        totalCorrect: newExamTotals.totalCorrect,
        totalWrong: newExamTotals.totalWrong,
        totalBlank: newExamTotals.totalBlank,
        totalNet: newExamTotals.totalNet,
        sections: newExamTotals.computedSections,
        errorTags
      });
      showNotice('Deneme sınavı kaydı güncellendi.');
    } else {
      await addTrialExam({
        studentId: currentStudent.id,
        title: newExamTitle.trim() || `${newExamType} Deneme Sınavı`,
        date: newExamDate,
        examType: newExamType,
        totalCorrect: newExamTotals.totalCorrect,
        totalWrong: newExamTotals.totalWrong,
        totalBlank: newExamTotals.totalBlank,
        totalNet: newExamTotals.totalNet,
        sections: newExamTotals.computedSections,
        errorTags
      });
      showNotice('Yeni deneme sınavı kaydedildi.');
    }

    setIsAddExamModalOpen(false);
    setEditingExamId(null);
    setNewExamTitle('');
  };

  const handleOpenNewQuestionRecordModal = (defaultSubj?: string) => {
    setEditingQuestionRecord(null);
    setQSubject(defaultSubj && defaultSubj !== 'ALL' ? defaultSubj : 'Matematik');
    setQTopic('Soru Çözümü');
    setQDurationMinutes(30);
    setQCorrect(20);
    setQWrong(2);
    setQBlank(0);
    setQNote('');
    setIsQuestionModalOpen(true);
  };

  const handleOpenEditQuestionRecordModal = (rec: EditableQuestionRecord) => {
    setEditingQuestionRecord(rec);
    setQSubject(normalizeSubjectName(rec.subject));
    setQTopic(rec.topic);
    setQDurationMinutes(rec.durationMinutes || 25);
    setQCorrect(rec.correct);
    setQWrong(rec.wrong);
    setQBlank(rec.blank);
    setQNote(rec.note || '');
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestionRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;
    const canonicalSubj = normalizeSubjectName(qSubject);
    addSubjectVariable(canonicalSubj);
    const c = Math.max(0, Number(qCorrect) || 0);
    const w = Math.max(0, Number(qWrong) || 0);
    const b = Math.max(0, Number(qBlank) || 0);
    const net = Number(Math.max(0, c - w / 4).toFixed(2));
    const durMins = Math.max(1, Math.round(Number(qDurationMinutes) || 1));

    if (editingQuestionRecord) {
      if (editingQuestionRecord.kind === 'focus') {
        await updateFocusSession(editingQuestionRecord.rawId, {
          subject: canonicalSubj,
          topic: qTopic.trim() || 'Soru Çözümü',
          durationMinutes: durMins,
          durationSeconds: durMins * 60,
          solvedQuestions: { correct: c, wrong: w, blank: b, net },
          studentNote: qNote.trim() || ''
        });
      } else {
        await updateScheduleItem(editingQuestionRecord.rawId, {
          subject: canonicalSubj,
          topic: qTopic.trim() || 'Program Ders Oturumu',
          actualDurationMinutes: durMins,
          solvedQuestions: { correct: c, wrong: w, blank: b, net }
        });
      }
      showNotice(`"${canonicalSubj} • ${qTopic}" soru kaydı güncellendi.`);
    } else {
      await addFocusSession({
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        subject: canonicalSubj,
        topic: qTopic.trim() || 'Soru Çözümü',
        durationMinutes: durMins,
        durationSeconds: durMins * 60,
        mode: 'stopwatch',
        solvedQuestions: { correct: c, wrong: w, blank: b, net },
        studentNote: qNote.trim() || undefined,
        sentToTeacher: true
      });
      showNotice(`"${canonicalSubj} • ${qTopic}" soru kaydı eklendi.`);
    }

    setIsQuestionModalOpen(false);
    setEditingQuestionRecord(null);
  };

  const handleDeleteQuestionRecord = async (rec: EditableQuestionRecord) => {
    if (rec.kind === 'focus') {
      await deleteFocusSession(rec.rawId);
    } else {
      await deleteScheduleItem(rec.rawId);
    }
    setConfirmDeleteQuestionKey(null);
    showNotice('Soru kaydı silindi.');
  };

  const handleExecuteRedAlertAction = () => {
    if (!redAlertActionModal || !currentStudent) return;
    const canonicalSubject = normalizeSubjectName(redAlertActionModal.subject);
    addSubjectVariable(canonicalSubject);

    if (redAlertActionModal.targetType === 'schedule') {
      addScheduleItem({
        studentId: currentStudent.id,
        dayOfWeek: actionDay,
        timeRange: actionTime,
        subject: canonicalSubject,
        topic: `${redAlertActionModal.topic} (Telafi Etüdü)`,
        sourceBook: actionSource,
        targetType: 'question',
        targetValue: actionQuestionCount,
        actualDurationMinutes: 0,
        teacherNote: 'Deneme sınavlarındaki kronik hata analizi sonucunda programa eklendi.',
        status: 'pending'
      });
      showNotice(`"${canonicalSubject} - ${redAlertActionModal.topic}" konusu haftalık programa eklendi.`);
    } else {
      addHomework({
        studentId: currentStudent.id,
        title: `${redAlertActionModal.topic} Telafi Soru Çözümü`,
        subject: canonicalSubject,
        topic: redAlertActionModal.topic,
        sourceBook: actionSource,
        pageRange: 'Konu Testleri 1-3',
        targetQuestionCount: actionQuestionCount,
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        teacherNote: 'Deneme analizinde tespit edilen eksikleri kapatmak için atandı.',
        status: 'pending'
      });
      showNotice(`"${canonicalSubject} - ${redAlertActionModal.topic}" telafi ödevi öğrenciye gönderildi.`);
    }

    setRedAlertActionModal(null);
  };

  // If no student exists at all
  if (!currentStudent) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 text-center max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-4 font-bold">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
          Deneme Sınavı & Ders Analizi
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Deneme sınavı net grafikleri ve ders bazlı soru analizi için lütfen önce Yönetim panelinden bir öğrenci ekleyin.
        </p>
      </div>
    );
  }

  const filteredCrossSubjectRows = selectedCrossSubject === 'ALL'
    ? crossSubjectAnalysis
    : crossSubjectAnalysis.filter(r => r.subject === selectedCrossSubject);

  const filteredQuestionRecords = selectedCrossSubject === 'ALL'
    ? studentQuestionRecords
    : studentQuestionRecords.filter(r => r.subject === selectedCrossSubject);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-black/5 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Deneme & Ortak Ders Analizi
            </h1>
            {role === 'teacher' && students.length > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-neutral-200/80 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-neutral-500 dark:text-neutral-400 font-medium">Öğrenci:</span>
                <select
                  value={currentStudentId || currentStudent?.id}
                  onChange={e => setCurrentStudentId(e.target.value)}
                  className="bg-transparent font-bold text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {students.map(st => (
                    <option key={st.id} value={st.id} className="text-neutral-900 dark:text-white bg-white dark:bg-neutral-900">
                      {st.name} ({st.pin})
                    </option>
                  ))}
                </select>
              </div>
            ) : currentStudent ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {currentStudent.name} • {currentStudent.targetExam}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Deneme sınavları ve ders/soru kayıtları ortak ders değişkenleri altında birleştirilerek analiz edilir.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => handleOpenNewQuestionRecordModal(selectedCrossSubject)}
            className="px-3.5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Soru Kaydı Ekle</span>
          </button>

          <button
            onClick={handleOpenNewExamModal}
            className="px-4 py-2.5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Deneme Sonucu Gir</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="p-1 rounded-lg hover:bg-emerald-500/20 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Son Deneme Neti</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono">
              {latestExam ? latestExam.totalNet : '0'}
            </span>
            {netDiff !== 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                netDiff > 0 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              }`}>
                {netDiff > 0 ? `+${netDiff}` : netDiff} Net
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1 truncate">
            {latestExam ? latestExam.title : 'Henüz deneme yok'}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">En Yüksek Rekor Net</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {highestNet}
            </span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Toplam {studentExams.length} deneme sınavı
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Ortak Ders Değişkeni</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {subjects.length}
            </span>
            <span className="text-xs text-blue-500 font-semibold">Ders</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Deneme + Ders ortak değişkeni
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Kayıtlı Soru Çözümü</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {studentQuestionRecords.length}
            </span>
            <span className="text-xs font-semibold text-indigo-500">Kayıt</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Düzenlenebilir ve silinebilir
          </p>
        </div>
      </div>

      {/* ORTAK DERS DEĞİŞKENLERİ & DERS BAZLI BİRLEŞİK ANALİZ (DENEME + SORU/DERS KAYITLARI) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white">
                Ortak Ders Değişkenleri Üzerinden Birleşik Performans Analizi
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Deneme sınavlarında ve ders/odak çalışmalarında girilen aynı ders değişkenleri otomatik eşleştirilir ve birlikte analiz edilir.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAddingSubjectVar ? (
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-xl border border-blue-500/30">
                <input
                  type="text"
                  value={newSubjectVarDraft}
                  onChange={e => setNewSubjectVarDraft(e.target.value)}
                  placeholder="Yeni ders değişkeni..."
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-900 dark:text-white focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSubjectVarDraft.trim()) {
                      const norm = normalizeSubjectName(newSubjectVarDraft.trim());
                      addSubjectVariable(norm);
                      setSelectedCrossSubject(norm);
                      setNewSubjectVarDraft('');
                      setIsAddingSubjectVar(false);
                      showNotice(`"${norm}" ortak ders değişkeni olarak eklendi.`);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer"
                >
                  Ekle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSubjectVar(false);
                    setNewSubjectVarDraft('');
                  }}
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-neutral-500 cursor-pointer"
                >
                  İptal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingSubjectVar(true)}
                className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Ders Değişkeni Tanımla</span>
              </button>
            )}
          </div>
        </div>

        {/* Shared Subject Variable Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCrossSubject('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCrossSubject === 'ALL'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Tüm Dersler ({crossSubjectAnalysis.length})
          </button>

          {subjects.map(subj => {
            const stat = crossSubjectAnalysis.find(s => s.subject === subj);
            const isSelected = selectedCrossSubject === subj;
            return (
              <button
                key={subj}
                type="button"
                onClick={() => setSelectedCrossSubject(isSelected ? 'ALL' : subj)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                <span>{subj}</span>
                {stat && stat.combinedQuestions > 0 && (
                  <span className={`font-mono text-[10px] ${isSelected ? 'text-white/90' : 'text-blue-500'}`}>
                    · {stat.combinedQuestions}S
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Cross-Subject Comparison Chart (when multiple subjects have data) */}
        {filteredCrossSubjectRows.length > 0 && (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredCrossSubjectRows}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C1C1E',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="examAccuracy"
                  name="Deneme Başarı %"
                  fill="#007AFF"
                  radius={[6, 6, 0, 0]}
                  barSize={22}
                />
                <Bar
                  dataKey="studyAccuracy"
                  name="Ders/Soru Çözüm Başarı %"
                  fill="#34C759"
                  radius={[6, 6, 0, 0]}
                  barSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Cross-Subject Unified Table */}
        {filteredCrossSubjectRows.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            Seçili ders değişkeni için henüz deneme veya soru çözümü verisi bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-neutral-400 border-b border-black/5 dark:border-white/5 font-semibold">
                  <th className="py-2.5 pr-3">Ders Değişkeni</th>
                  <th className="py-2.5 px-3 text-right">Deneme (Ort. Net / Başarı)</th>
                  <th className="py-2.5 px-3 text-right">Soru/Odak Çözümü (Net / Başarı)</th>
                  <th className="py-2.5 px-3 text-right">Birleşik Toplam Soru (D/Y/B)</th>
                  <th className="py-2.5 px-3 text-right">Toplam Net</th>
                  <th className="py-2.5 px-3 text-right">Çalışma Süresi</th>
                  <th className="py-2.5 pl-3 text-right">Genel Başarı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono tabular-nums">
                {filteredCrossSubjectRows.map(row => (
                  <tr
                    key={row.subject}
                    onClick={() =>
                      setSelectedCrossSubject(prev => (prev === row.subject ? 'ALL' : row.subject))
                    }
                    className={`cursor-pointer transition-colors ${
                      selectedCrossSubject === row.subject
                        ? 'bg-blue-500/10'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <td className="py-3 pr-3 font-sans">
                      <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <span>{row.subject}</span>
                        {row.topics.length > 0 && (
                          <span className="text-[10px] font-normal text-neutral-400 truncate max-w-[180px]">
                            ({row.topics.slice(0, 2).join(', ')})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {row.examAppearanceCount > 0 ? (
                        <div>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {row.examAvgNet} Net
                          </span>
                          <span className="text-neutral-400 text-[11px] ml-1.5">
                            (%{row.examAccuracy} · {row.examAppearanceCount} deneme)
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {row.studyQuestions > 0 ? (
                        <div>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {Number(row.studyTotalNet.toFixed(2))} Net
                          </span>
                          <span className="text-neutral-400 text-[11px] ml-1.5">
                            (%{row.studyAccuracy} · {row.studyQuestions} soru)
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {row.combinedQuestions}
                      </span>
                      <span className="text-[11px] text-neutral-500 ml-1">
                        ({row.combinedCorrect}D/{row.combinedWrong}Y/{row.combinedBlank}B)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-indigo-600 dark:text-indigo-400">
                      {row.combinedNet} Net
                    </td>
                    <td className="py-3 px-3 text-right text-neutral-600 dark:text-neutral-300">
                      {row.studyMinutes > 0 ? `${row.studyMinutes} dk` : '-'}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-lg font-bold text-xs ${
                          row.combinedAccuracy >= 75
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : row.combinedAccuracy >= 50
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        %{row.combinedAccuracy}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SORU VE ÇALIŞMA KAYITLARI YÖNETİMİ (DÜZENLE & SİL) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Soru Çözüm & Ders Kayıtları ({selectedCrossSubject === 'ALL' ? 'Tüm Dersler' : selectedCrossSubject})
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Girilen soru kayıtlarını buradan düzenleyebilir, ders değişkenini değiştirebilir veya silebilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenNewQuestionRecordModal(selectedCrossSubject)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Soru Kaydı Ekle</span>
          </button>
        </div>

        {filteredQuestionRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            Bu ders değişkeni için henüz soru çözümü kaydı bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-neutral-400 border-b border-black/5 dark:border-white/5 font-semibold">
                  <th className="py-2 pr-3">Tarih</th>
                  <th className="py-2 px-3">Ders Değişkeni</th>
                  <th className="py-2 px-3">Konu</th>
                  <th className="py-2 px-3 text-right">Süre</th>
                  <th className="py-2 px-3 text-right">Doğru / Yanlış / Boş</th>
                  <th className="py-2 px-3 text-right">Net</th>
                  <th className="py-2 pl-3 text-right">Düzenle / Sil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono tabular-nums">
                {filteredQuestionRecords.map(rec => {
                  const rowKey = `${rec.kind}_${rec.rawId}`;
                  const qTotal = rec.correct + rec.wrong + rec.blank;
                  return (
                    <tr key={rowKey} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30">
                      <td className="py-2.5 pr-3 text-neutral-400 whitespace-nowrap">
                        {rec.dateLabel}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px]">
                          {rec.subject}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans font-medium text-neutral-900 dark:text-white">
                        {rec.topic}
                        {rec.note && (
                          <span className="block text-[10px] text-neutral-400 italic truncate max-w-xs">
                            "{rec.note}"
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                        {rec.durationMinutes > 0 ? `${rec.durationMinutes} dk` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className="font-bold text-neutral-900 dark:text-white">{qTotal} Soru</span>
                        <span className="text-neutral-500 ml-1.5">
                          ({rec.correct}D / {rec.wrong}Y / {rec.blank}B)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {rec.net} Net
                      </td>
                      <td className="py-2.5 pl-3 text-right font-sans whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuestionRecordModal(rec)}
                            className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-blue-500/15 text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Düzenle</span>
                          </button>

                          {confirmDeleteQuestionKey === rowKey ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px]">
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestionRecord(rec)}
                                className="font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                              >
                                Sil
                              </button>
                              <span className="text-neutral-300 dark:text-neutral-600">|</span>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteQuestionKey(null)}
                                className="font-semibold text-neutral-500 cursor-pointer"
                              >
                                Vazgeç
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteQuestionKey(rowKey)}
                              className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-500/15 text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                              title="Soru Kaydını Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RED ALERT ENGINE: KRONİK HATA TESPİT MOTORU */}
      {chronicErrors.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent border-2 border-rose-500/30 shadow-lg shadow-rose-500/5">
          <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/30 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500 text-white">
                    Akıllı Uyarı Sistemi
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white">
                    Kronik Hata ve Konu Eksikleri Tespit Edildi!
                  </h2>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                  Aşağıdaki konularda birden fazla deneme sınavında tekrarlayan yanlışlar bulundu. Tek tıkla telafi ataması yapabilirsiniz.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {chronicErrors.map((err, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md border border-rose-500/20 flex flex-col justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      {err.subject}
                    </span>
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 font-mono">
                      {err.examOccurrences} Denemede • Toplam {err.totalErrors} Yanlış
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white mt-2">
                    {err.topic}
                  </h3>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(err.reasons).map(([rName, count]) => (
                      <span
                        key={rName}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                      >
                        {rName}: <strong>{count} soru</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {role === 'teacher' ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                    <button
                      onClick={() =>
                        setRedAlertActionModal({
                          isOpen: true,
                          subject: err.subject,
                          topic: err.topic,
                          targetType: 'schedule'
                        })
                      }
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Programa Etüt Ekle</span>
                    </button>
                    <button
                      onClick={() =>
                        setRedAlertActionModal({
                          isOpen: true,
                          subject: err.subject,
                          topic: err.topic,
                          targetType: 'homework'
                        })
                      }
                      className="flex-1 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Telafi Ödevi Ata</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                    <span>Öncelikli tekrar edilmesi gereken konu</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Net Progression Area Chart */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span>Deneme Net Gelişim Grafiği</span>
              </h3>
              <p className="text-xs text-neutral-500">Son denemelerdeki toplam net ivmesi</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netProgressionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#007AFF" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#007AFF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C1C1E',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="net"
                  name="Toplam Net"
                  stroke="#007AFF"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorNet)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Reasons Distribution */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-500" />
              <span>Neden Yanlış Yapıyorum?</span>
            </h3>
            <p className="text-xs text-neutral-500">Etiketlenen hataların kök neden dağılımı</p>
          </div>

          {errorDistributionData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-neutral-400">
              Henüz hata etiketi verisi bulunmuyor.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={errorDistributionData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1C1C1E',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '14px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="value" name="Yanlış Soru Sayısı" radius={[0, 8, 8, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Exam History List (with Edit & Delete) */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-neutral-900 dark:text-white px-1">
          Kayıtlı Deneme Sınavları ({studentExams.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...studentExams].reverse().map(exam => (
            <div
              key={exam.id}
              className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {exam.examType}
                  </span>
                  <h4 className="text-base font-bold text-neutral-900 dark:text-white mt-1">
                    {exam.title}
                  </h4>
                  <span className="text-xs text-neutral-400">
                    {new Date(exam.date).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <div className="text-right px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                      Toplam Net
                    </div>
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {exam.totalNet}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditExamModal(exam)}
                      className="p-2 rounded-xl text-neutral-500 hover:text-blue-600 hover:bg-blue-500/10 transition-colors cursor-pointer"
                      title="Deneme Sınavını Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {confirmDeleteExamId === exam.id ? (
                      <div className="flex flex-col gap-1 bg-rose-500/10 p-1.5 rounded-xl border border-rose-500/30 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            deleteTrialExam(exam.id);
                            setConfirmDeleteExamId(null);
                            showNotice('Deneme sınavı silindi.');
                          }}
                          className="font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          Sil
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteExamId(null)}
                          className="font-semibold text-neutral-500 cursor-pointer"
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteExamId(exam.id)}
                        className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Deneme Sınavını Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Section pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {exam.sections.map((sec, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-black/5 dark:border-white/5"
                  >
                    <div className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 truncate">
                      {normalizeSubjectName(sec.name)}
                    </div>
                    <div className="text-sm font-extrabold text-neutral-900 dark:text-white font-mono mt-0.5">
                      {sec.net} Net
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      {sec.correct}D / {sec.wrong}Y
                    </div>
                  </div>
                ))}
              </div>

              {/* Error Tags */}
              {(exam.errorTags || []).length > 0 && (
                <div className="pt-2 border-t border-black/5 dark:border-white/5">
                  <div className="text-[11px] font-semibold text-neutral-400 mb-1.5">
                    Kaydedilen Hata Etiketleri:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(exam.errorTags || []).map((t, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium"
                      >
                        {normalizeSubjectName(t.subject)} • <strong>{t.topic}</strong> ({ERROR_LABELS[t.reason] || t.reason} - {t.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: ADD / EDIT QUESTION RECORD */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5 dark:border-white/5">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {editingQuestionRecord ? 'Soru Kaydını Düzenle' : 'Yeni Soru Kaydı Ekle'}
                </h3>
                <p className="text-xs text-neutral-500">
                  Seçilen ders değişkeni üzerinden denemelerle ortak analiz edilir
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsQuestionModalOpen(false);
                  setEditingQuestionRecord(null);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestionRecord} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Ders Değişkeni
                  </label>
                  <select
                    value={qSubject}
                    onChange={e => setQSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-bold text-neutral-900 dark:text-white focus:outline-none"
                  >
                    {subjects.map(subj => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                    Konu Başlığı
                  </label>
                  <input
                    type="text"
                    value={qTopic}
                    onChange={e => setQTopic(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-bold text-neutral-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <div>
                    <label className="block font-bold text-neutral-900 dark:text-white">
                      Çalışma Süresi (Dakika)
                    </label>
                    <span className="text-[11px] text-neutral-500">Kayıtlı çalışma süresi</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={qDurationMinutes}
                    onChange={e => setQDurationMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-20 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/15 text-center font-extrabold font-mono text-sm text-blue-600 dark:text-blue-400 focus:outline-none"
                    required
                  />
                  <span className="text-xs font-bold text-neutral-500">dk</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-black/5 dark:border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">Soru Sayıları</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    Net: {Math.max(0, Number((qCorrect - qWrong / 4).toFixed(2)))}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-center">
                    <label className="block text-[10px] font-bold text-emerald-600 mb-1">Doğru</label>
                    <input
                      type="number"
                      min={0}
                      value={qCorrect}
                      onChange={e => setQCorrect(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-transparent text-center font-mono font-bold text-sm text-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-rose-500/10 text-center">
                    <label className="block text-[10px] font-bold text-rose-600 mb-1">Yanlış</label>
                    <input
                      type="number"
                      min={0}
                      value={qWrong}
                      onChange={e => setQWrong(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-transparent text-center font-mono font-bold text-sm text-rose-600 focus:outline-none"
                    />
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-500/10 text-center">
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1">Boş</label>
                    <input
                      type="number"
                      min={0}
                      value={qBlank}
                      onChange={e => setQBlank(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-transparent text-center font-mono font-bold text-sm text-neutral-600 dark:text-neutral-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1">Not</label>
                <textarea
                  value={qNote}
                  onChange={e => setQNote(e.target.value)}
                  placeholder="Kısa not..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuestionModalOpen(false);
                    setEditingQuestionRecord(null);
                  }}
                  className="px-4 py-2 rounded-xl text-neutral-500 font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RED ALERT -> ASSIGN TO SCHEDULE OR HOMEWORK */}
      {redAlertActionModal && redAlertActionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {redAlertActionModal.targetType === 'schedule'
                    ? 'Haftalık Programa Telafi Etüdü Ekle'
                    : 'Öğrenciye Telafi Ödevi Gönder'}
                </h3>
                <p className="text-xs text-rose-500 font-semibold">
                  {redAlertActionModal.subject} • {redAlertActionModal.topic}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs mt-4">
              {redAlertActionModal.targetType === 'schedule' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Gün Seçin
                    </label>
                    <select
                      value={actionDay}
                      onChange={e => setActionDay(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                    >
                      <option value={1}>Pazartesi</option>
                      <option value={2}>Salı</option>
                      <option value={3}>Çarşamba</option>
                      <option value={4}>Perşembe</option>
                      <option value={5}>Cuma</option>
                      <option value={6}>Cumartesi</option>
                      <option value={7}>Pazar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Saat Aralığı
                    </label>
                    <input
                      type="text"
                      value={actionTime}
                      onChange={e => setActionTime(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Çözülecek Kaynak Kitap
                </label>
                <input
                  type="text"
                  value={actionSource}
                  onChange={e => setActionSource(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Hedef Soru Sayısı
                </label>
                <input
                  type="number"
                  value={actionQuestionCount}
                  onChange={e => setActionQuestionCount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  onClick={() => setRedAlertActionModal(null)}
                  className="px-4 py-2 rounded-xl text-neutral-500 font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  onClick={handleExecuteRedAlertAction}
                  className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Onayla ve Ata</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD / EDIT TRIAL EXAM */}
      {isAddExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-6 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
                  {editingExamId ? 'Deneme Sınavı Sonucunu Düzenle' : 'Yeni Deneme Sınavı Sonucu Gir'}
                </h3>
                <p className="text-xs text-neutral-500">
                  Bölüm dersleri ortak ders değişkenleriyle eşleştirilir; D/Y girildiğinde net otomatik hesaplanır
                </p>
              </div>
              <div className="text-right px-3 py-1 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <span className="text-[10px] font-bold uppercase block">Hesaplanan Net</span>
                <span className="text-xl font-black font-mono">{newExamTotals.totalNet}</span>
              </div>
            </div>

            <form onSubmit={handleSaveTrialExam} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block font-semibold mb-1">Sınav Türü</label>
                  <select
                    value={newExamType}
                    onChange={e => handleSelectExamTypePreset(e.target.value as 'TYT' | 'AYT' | 'LGS' | 'Branş')}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 font-bold"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                    <option value="LGS">LGS</option>
                    <option value="Branş">Branş Denemesi</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block font-semibold mb-1">Deneme Adı / Yayın</label>
                  <input
                    type="text"
                    value={newExamTitle}
                    onChange={e => setNewExamTitle(e.target.value)}
                    placeholder="Örn: 3D Türkiye Geneli TYT-3"
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block font-semibold mb-1">Tarih</label>
                  <input
                    type="date"
                    value={newExamDate}
                    onChange={e => setNewExamDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5"
                    required
                  />
                </div>
              </div>

              {/* Section Scores using Shared Subject Variables */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                    Ders Bazlı Doğru / Yanlış / Boş (Ortak Ders Değişkenleri)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setExamSections(prev => [
                        ...prev,
                        { name: subjects[0] || 'Matematik', correct: 0, wrong: 0, blank: 0 }
                      ])
                    }
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Ders Bölümü Ekle</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {examSections.map((sec, idx) => {
                    const secNet = Math.max(0, +(sec.correct - sec.wrong / 4).toFixed(2));
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-black/5 dark:border-white/5"
                      >
                        <div className="col-span-4">
                          <select
                            value={normalizeSubjectName(sec.name)}
                            onChange={e => {
                              const val = e.target.value;
                              setExamSections(prev =>
                                prev.map((s, i) => (i === idx ? { ...s, name: val } : s))
                              );
                            }}
                            className="w-full p-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 font-bold text-neutral-900 dark:text-white"
                          >
                            {subjects.map(subj => (
                              <option key={subj} value={subj}>
                                {subj}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-emerald-600 block">Doğru</label>
                          <input
                            type="number"
                            min="0"
                            value={sec.correct}
                            onChange={e => {
                              const val = Math.max(0, Number(e.target.value));
                              setExamSections(prev =>
                                prev.map((s, i) => (i === idx ? { ...s, correct: val } : s))
                              );
                            }}
                            className="w-full p-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 font-mono font-bold text-emerald-600 text-center"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-rose-500 block">Yanlış</label>
                          <input
                            type="number"
                            min="0"
                            value={sec.wrong}
                            onChange={e => {
                              const val = Math.max(0, Number(e.target.value));
                              setExamSections(prev =>
                                prev.map((s, i) => (i === idx ? { ...s, wrong: val } : s))
                              );
                            }}
                            className="w-full p-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 font-mono font-bold text-rose-500 text-center"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-neutral-400 block">Boş</label>
                          <input
                            type="number"
                            min="0"
                            value={sec.blank}
                            onChange={e => {
                              const val = Math.max(0, Number(e.target.value));
                              setExamSections(prev =>
                                prev.map((s, i) => (i === idx ? { ...s, blank: val } : s))
                              );
                            }}
                            className="w-full p-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 font-mono text-center"
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-1.5">
                          <div className="text-right">
                            <span className="text-[10px] text-neutral-400 block">Net</span>
                            <span className="font-mono font-extrabold text-sm text-blue-600 dark:text-blue-400">
                              {secNet}
                            </span>
                          </div>
                          {examSections.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExamSections(prev => prev.filter((_, i) => i !== idx))
                              }
                              className="p-1 rounded-lg text-neutral-400 hover:text-rose-500 cursor-pointer"
                              title="Bölümü Kaldır"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Error Tagging Builder */}
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Yanlış Yapılan Konu & Hata Nedeni Ekle</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <select
                    value={draftTagSubject}
                    onChange={e => setDraftTagSubject(e.target.value)}
                    className="sm:col-span-3 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 font-bold"
                  >
                    {subjects.map(subj => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={draftTagTopic}
                    onChange={e => setDraftTagTopic(e.target.value)}
                    placeholder="Konu (Örn: Türev, Optik)"
                    className="sm:col-span-4 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10"
                  />
                  <select
                    value={draftTagReason}
                    onChange={e => setDraftTagReason(e.target.value as ErrorReason)}
                    className="sm:col-span-3 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10"
                  >
                    <option value="Bilgi_Eksigi">Bilgi Eksiği</option>
                    <option value="Dikkat_Hatasi">Dikkat Hatası</option>
                    <option value="Sure_Yetismedi">Süre Yetişmedi</option>
                    <option value="Islem_Hatasi">İşlem Hatası</option>
                    <option value="Kavram_Yanilsisi">Kavram Yanılgısı</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddErrorTagToDraft}
                    className="sm:col-span-2 py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold cursor-pointer"
                  >
                    + Ekle
                  </button>
                </div>

                {errorTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {errorTags.map((t, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-900 border border-rose-500/20 text-rose-600 dark:text-rose-400"
                      >
                        <span>
                          {t.subject} • <strong>{t.topic}</strong> ({ERROR_LABELS[t.reason]})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveErrorTagFromDraft(i)}
                          className="hover:text-rose-800 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddExamModalOpen(false);
                    setEditingExamId(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-neutral-500 font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingExamId ? 'Değişiklikleri Kaydet' : 'Denemeyi Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
