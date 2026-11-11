export type Role = 'teacher' | 'student';

export type BackgroundTheme = 'default' | 'pure_white' | 'deep_black' | 'graphite' | 'slate' | 'cream' | 'navy';
export type BoxColorTheme = 'blue' | 'orange' | 'emerald' | 'purple' | 'rose' | 'amber' | 'cyan';

export interface ThemeConfig {
  bgTheme: BackgroundTheme;
  boxTheme: BoxColorTheme;
}

export type StreakStatus = 'active' | 'frozen' | 'lost' | 'pending_recovery';

export interface Student {
  id: string;
  teacherUid?: string; // Bağlı olduğu öğretmen hesabı
  name: string;
  studentNumber: string; // 5 haneli öğrenci numarası, e.g. "10482"
  password: string; // 4 haneli öğrenci şifresi, e.g. "3821"
  pin: string; // uyumluluk için (şifre ile eşlenir)
  avatar?: string;
  targetExam?: string; // e.g. "YKS 2027 (Sayısal)", "LGS 2026", "MSÜ"
  targetExamDate?: string; // İsteğe bağlı / kaldırılan eski alan
  targetGoal?: string; // İsteğe bağlı / kaldırılan eski alan
  dailyQuestionTarget?: number; // Öğretmenin atadığı günlük hedef soru sayısı, e.g. 150
  phone: string;
  notes: string;
  classroomIds?: string[]; // Birden fazla sınıfta bulunabilir
  themeConfig?: {
    bgTheme: BackgroundTheme;
    boxTheme: BoxColorTheme;
    isDarkMode: boolean;
  };
  streak: {
    count: number;
    status: StreakStatus;
    lastActiveDate: string; // YYYY-MM-DD
    frozenDays: number; // 0, 1, 2, 3+
    excuseNote?: string;
    requestDate?: string;
  };
  createdAt?: string;
  lastActiveAt?: string;
}

export interface Teacher {
  id: string;
  uid?: string; // Firebase Auth UID
  username?: string; // Kullanıcı adı (örn: "ahmethoca")
  name: string;
  password?: string; // Öğretmen giriş şifresi
  email?: string;
  photoURL?: string; // Google Profil resmi
  branch?: string; // Branş: e.g. "Matematik", "Fizik", "Rehberlik & Koçluk"
  phone?: string;
  authProvider?: 'password' | 'google';
  classroomIds?: string[];
  themeConfig?: {
    bgTheme: BackgroundTheme;
    boxTheme: BoxColorTheme;
    isDarkMode: boolean;
  };
  createdAt?: string;
}

export interface Classroom {
  id: string;
  teacherUid?: string;
  code?: string; // Öğretmenin verdiği sınıfa katılma kodu, örn: "AKD-8291"
  name: string; // Örn: "12-A Sayısal", "YKS Derece Grubu", "Mezun EA"
  grade: string; // Örn: "12. Sınıf", "Mezun", "8. Sınıf", "11. Sınıf"
  branch?: string; // Örn: "Sayısal", "Eşit Ağırlık", "Sözel", "LGS"
  description?: string;
  color?: string; // Rozet ve kart teması rengi
  createdAt: string;
  teachers?: string[]; // Bu sınıfa atanan öğretmenlerin adları
  studentIds: string[]; // Bu sınıfa kayıtlı öğrenci ID'leri
}

export interface ActivityLog {
  id: string;
  studentId: string;
  studentName: string;
  teacherUid?: string;
  type: 'focus_completed' | 'question_solved' | 'homework_submitted' | 'exam_recorded' | 'streak_active' | 'joined_class';
  title: string;
  detail: string;
  timestamp: string;
}

export type ScheduleTargetType = 'question' | 'duration';
export type ScheduleItemStatus = 'pending' | 'in_progress' | 'completed' | 'missed';

export interface SolvedQuestions {
  correct: number;
  wrong: number;
  blank: number;
  net: number;
}

export interface ScheduleItem {
  id: string;
  studentId: string;
  weekNumber?: number; // 1 = 1. Hafta, 2 = 2. Hafta (2 haftalık program döngüsü)
  dayOfWeek: number; // 1 = Pazartesi, 2 = Salı, ..., 7 = Pazar
  sessionNumber?: number; // 1, 2, 3, 4... (1. Oturum, 2. Oturum...)
  timeRange?: string; // İsteğe bağlı saat aralığı, e.g. "09:00 - 10:30"
  subject: string; // e.g. "Matematik", "Fizik", "Türkçe"
  topic: string; // e.g. "Türev", "Optik", "Paragraf"
  sourceBook?: string; // e.g. "3D Soru Bankası", "Apotemi", "Karekök"
  targetType?: ScheduleTargetType;
  targetValue?: number; // e.g. 50 (soru) or 60 (dakika)
  actualDurationMinutes: number;
  solvedQuestions?: SolvedQuestions;
  teacherNote?: string;
  status: ScheduleItemStatus;
  updatedAt?: string;
}

export interface FocusSession {
  id: string;
  studentId: string;
  studentName: string;
  teacherUid?: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  durationSeconds: number;
  mode: 'pomodoro' | 'stopwatch';
  solvedQuestions?: SolvedQuestions;
  studentNote?: string;
  completedAt: string;
  sentToTeacher: boolean;
  teacherFeedback?: string;
  teacherFeedbackAt?: string;
}

export interface ScheduleTemplate {
  id: string;
  title: string;
  description: string;
  targetExam: string;
  items: Omit<ScheduleItem, 'id' | 'studentId'>[];
}

export type ExamType = 'TYT' | 'AYT' | 'LGS' | 'Branş' | 'MSÜ' | 'Genel';

export type ErrorReason = 
  | 'Bilgi Eksikliği' 
  | 'Dikkat / Okuma Hatası' 
  | 'Süre Yetişmedi' 
  | 'İşlem Hatası' 
  | 'Soru Kökünü Yanlış Anlama';

export interface ExamSectionResult {
  name: string; // e.g. "Türkçe", "Matematik", "Fen Bilimleri", "Sosyal"
  correct: number;
  wrong: number;
  blank: number;
  net: number;
}

export interface ExamQuestionError {
  id: string;
  subject: string;
  topic: string;
  status: 'wrong' | 'blank';
  errorReason: ErrorReason;
  notes?: string;
}

export interface TrialExam {
  id: string;
  studentId: string;
  teacherUid?: string;
  title: string; // e.g. "Özdebir TYT Deneme-4"
  date: string; // YYYY-MM-DD
  examType: ExamType;
  sections: ExamSectionResult[];
  totalCorrect: number;
  totalWrong: number;
  totalBlank: number;
  totalNet: number;
  errors: ExamQuestionError[];
}

export type HomeworkStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface Homework {
  id: string;
  studentId: string;
  teacherUid?: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  sourceBook: string;
  targetQuestionCount: number;
  dueDate: string; // YYYY-MM-DD
  status: HomeworkStatus;
  studentSubmission?: {
    correct: number;
    wrong: number;
    blank: number;
    net: number;
    studentNote?: string;
    submittedAt: string;
  };
  teacherFeedback?: string;
}

export interface Announcement {
  id: string;
  teacherUid?: string;
  title: string;
  content: string;
  date: string;
  authorName: string;
  urgent?: boolean;
  readBy?: string[]; // Okundu işaretleyen öğrencilerin ID'leri
}

export interface AssignedExam {
  id: string;
  teacherUid?: string;
  title: string; // Örn: "28 Kasım TYT Genel Deneme"
  examDate: string; // YYYY-MM-DD formatında, örn: "2026-11-28"
  examType?: ExamType;
  targetType?: 'all' | 'classroom' | 'student';
  targetId?: string; // classroomId or studentId
  targetName?: string;
  notes?: string;
  createdAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'streak' | 'homework' | 'schedule' | 'exam' | 'system';
}

export interface ActiveTimerSession {
  scheduleItemId?: string;
  homeworkId?: string;
  studentId: string;
  subject: string;
  topic: string;
  mode: 'stopwatch' | 'pomodoro';
  initialDurationMinutes: number; // for Pomodoro
  elapsedSeconds: number;
  isRunning: boolean;
  isMinimized: boolean;
  startedAt?: string;
}
