import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from '../firebase';
import {
  Role,
  Student,
  Teacher,
  Classroom,
  ScheduleItem,
  ScheduleTemplate,
  TrialExam,
  Homework,
  Announcement,
  AnnouncementComment,
  NotificationItem,
  ActiveTimerSession,
  SolvedQuestions,
  FocusSession,
  ActivityLog,
  BackgroundTheme,
  BoxColorTheme,
  StreakStatus,
  AssignedExam
} from '../types';
import {
  subscribeToCollection,
  saveStudentToFirestore,
  updateStudentInFirestore,
  deleteStudentFromFirestore,
  saveClassroomToFirestore,
  updateClassroomInFirestore,
  deleteClassroomFromFirestore,
  saveTeacherToFirestore,
  updateTeacherInFirestore,
  deleteTeacherFromFirestore,
  saveActivityLogToFirestore,
  saveScheduleItemToFirestore,
  updateScheduleItemInFirestore,
  deleteScheduleItemFromFirestore,
  saveHomeworkToFirestore,
  updateHomeworkInFirestore,
  saveFocusSessionToFirestore,
  saveAnnouncementToFirestore,
  updateAnnouncementInFirestore,
  deleteAnnouncementFromFirestore,
  saveAssignedExamToFirestore,
  deleteAssignedExamFromFirestore,
  saveTrialExamToFirestore,
  deleteTrialExamFromFirestore
} from '../services/firestoreService';

interface QuestionEntryState {
  isOpen: boolean;
  scheduleItemId?: string;
  homeworkId?: string;
  durationMinutes: number;
  durationSeconds?: number;
  mode?: 'stopwatch' | 'pomodoro';
  subject: string;
  topic: string;
}

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  isLoggedIn: boolean;
  isAuthReady: boolean;
  firebaseUser: User | null;
  currentTeacher: Teacher | null;
  currentStudent: Student | undefined;
  currentStudentId: string;
  setCurrentStudentId: (id: string) => void;

  // Authentication
  loginTeacherWithGoogle: () => Promise<{ success: boolean; error?: string; teacher?: Teacher }>;
  registerTeacherAccount: (params: { username: string; name: string; password: string; branch?: string }) => Promise<{ success: boolean; error?: string; teacher?: Teacher }>;
  loginTeacherCredentials: (usernameOrName: string, password: string, branch?: string) => Promise<{ success: boolean; error?: string; teacher?: Teacher }>;
  loginStudentWithClassCode: (classCode: string, studentNumber: string, password: string) => Promise<{ success: boolean; message?: string; student?: Student }>;
  cloudLoginWithStudentCredentials: (classCode: string, studentNumber: string, password: string) => Promise<{ success: boolean; message?: string; student?: Student }>;
  logout: () => Promise<void>;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  bgTheme: BackgroundTheme;
  setBgTheme: (theme: BackgroundTheme) => void;
  boxTheme: BoxColorTheme;
  setBoxTheme: (theme: BoxColorTheme) => void;

  // Students
  students: Student[];
  addStudent: (data: Omit<Student, 'id' | 'streak'>) => Promise<string>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  // Classrooms
  classrooms: Classroom[];
  addClassroom: (data: Omit<Classroom, 'id' | 'createdAt'>) => Promise<string>;
  updateClassroom: (id: string, updates: Partial<Classroom>) => Promise<void>;
  deleteClassroom: (id: string) => Promise<void>;
  assignStudentToClassrooms: (studentId: string, classroomIds: string[]) => Promise<void>;

  // Teachers
  teachers: Teacher[];
  addTeacher: (data: Omit<Teacher, 'id'>) => Promise<string>;
  updateTeacher: (id: string, updates: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;

  // Activity stream
  activities: ActivityLog[];
  logActivity: (data: Omit<ActivityLog, 'id' | 'timestamp'>) => Promise<void>;

  // Schedule
  schedules: ScheduleItem[];
  addScheduleItem: (item: Omit<ScheduleItem, 'id'>) => Promise<string>;
  updateScheduleItem: (id: string, updates: Partial<ScheduleItem>) => Promise<void>;
  toggleScheduleItemCompletion: (id: string) => Promise<void>;
  deleteScheduleItem: (id: string) => Promise<void>;

  // Templates
  templates: ScheduleTemplate[];
  addTemplate: (tpl: Omit<ScheduleTemplate, 'id'>) => void;
  applyTemplateToStudent: (templateId: string, studentId: string) => void;

  // Trial Exams
  trialExams: TrialExam[];
  addTrialExam: (exam: Omit<TrialExam, 'id'>) => Promise<string>;
  deleteTrialExam: (id: string) => Promise<void>;

  // Homeworks
  homeworks: Homework[];
  addHomework: (hw: Omit<Homework, 'id'>) => Promise<string>;
  updateHomework: (id: string, updates: Partial<Homework>) => Promise<void>;

  // Focus Sessions
  focusSessions: FocusSession[];
  addFocusSession: (session: Omit<FocusSession, 'id' | 'completedAt' | 'sentToTeacher'> & { sentToTeacher?: boolean }) => Promise<void>;
  giveTeacherFeedbackToFocusSession: (sessionId: string, feedback: string) => Promise<void>;

  // Announcements & Notifications
  announcements: Announcement[];
  addAnnouncement: (ann: Omit<Announcement, 'id'>) => Promise<string>;
  deleteAnnouncement: (id: string) => Promise<void>;
  toggleAnnouncementRead: (announcementId: string, studentId: string) => Promise<void>;
  addAnnouncementComment: (announcementId: string, content: string, parentId?: string, replyToName?: string) => Promise<void>;
  deleteAnnouncementComment: (announcementId: string, commentId: string) => Promise<void>;
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Assigned Exams & Targets
  assignedExams: AssignedExam[];
  upcomingExam: AssignedExam | null;
  addAssignedExam: (exam: Omit<AssignedExam, 'id'>) => Promise<string>;
  deleteAssignedExam: (id: string) => Promise<void>;
  updateStudentDailyQuestionTarget: (studentId: string, target: number) => Promise<void>;

  // Timer
  activeTimer: ActiveTimerSession | null;
  startTimer: (params: {
    scheduleItemId?: string;
    homeworkId?: string;
    subject: string;
    topic: string;
    mode?: 'stopwatch' | 'pomodoro';
    initialMinutes?: number;
    openModal?: boolean;
    autoStart?: boolean;
  }) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  minimizeTimer: () => void;
  expandTimer: () => void;
  hideTimerPopup: () => void;
  showTimerPopup: () => void;
  updateTimerState: (updates: Partial<ActiveTimerSession>) => void;
  finishTimer: () => void;
  cancelTimer: () => void;
  isTimerModalOpen: boolean;
  setIsTimerModalOpen: (open: boolean) => void;

  // Question Entry Sheet
  questionEntryModal: QuestionEntryState | null;
  closeQuestionEntryModal: () => void;
  submitQuestionEntry: (results: SolvedQuestions, customSubject?: string, customTopic?: string, studentNote?: string) => void;

  // Streaks & Recovery
  incrementStreakForStudent: (studentId: string) => void;
  addTeacherDailyStreak: (studentId: string) => Promise<boolean>;
  updateStudentStreakCount: (studentId: string, newCount: number) => Promise<void>;
  requestStreakRecovery: (studentId: string, excuse: string) => void;
  approveStreakRecovery: (studentId: string) => void;
  rejectStreakRecovery: (studentId: string) => void;
  simulateDayPass: (action: 'today_solved' | 'miss_one_day' | 'miss_three_days') => void;

  targetDaysLeft: number;
  hasCompletedIntro: boolean;
  setHasCompletedIntro: (completed: boolean) => void;

  // Firebase status
  isFirestoreReady: boolean;
  syncWithCloud: () => Promise<void>;
  isCloudSyncing: boolean;
  lastCloudSync: string | null;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'akademi_takip_firebase_v1_';

let lastFinishChimeTimestamp = 0;

export const playFocusFinishSound = () => {
  const now = Date.now();
  if (now - lastFinishChimeTimestamp < 800) return;
  lastFinishChimeTimestamp = now;

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const notes = [
      { freq: 659.25, start: 0, duration: 0.22, gain: 0.14 },     // E5
      { freq: 987.77, start: 0.12, duration: 0.26, gain: 0.16 },  // B5
      { freq: 1318.51, start: 0.25, duration: 0.48, gain: 0.18 }, // E6
    ];

    const startTime = ctx.currentTime + 0.02;

    notes.forEach(({ freq, start, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + start);

      gainNode.gain.setValueAtTime(0.0001, startTime + start);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + start + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime + start);
      osc.stop(startTime + start + duration + 0.02);
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);
  } catch {
    // Ignore audio errors if blocked by browser autoplay policy
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state: Dark mode, Background color customization, Box/Card color customization
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}dark_mode`);
    return saved !== null ? saved === 'true' : false;
  });

  const [bgTheme, setBgThemeState] = useState<BackgroundTheme>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}bg_theme`);
    return (saved as BackgroundTheme) || 'default';
  });

  const [boxTheme, setBoxThemeState] = useState<BoxColorTheme>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}box_theme`);
    return (saved as BoxColorTheme) || 'blue';
  });


  // Auth & Roles
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(() => {
    try {
      const t = localStorage.getItem(`${STORAGE_PREFIX}teacher_session`);
      return t ? JSON.parse(t) : null;
    } catch {
      return null;
    }
  });
  const [savedStudentSession, setSavedStudentSession] = useState<Student | null>(() => {
    try {
      const s = localStorage.getItem(`${STORAGE_PREFIX}student_session`);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const [role, setRoleState] = useState<Role>(() => {
    if (savedStudentSession) return 'student';
    return 'teacher';
  });

  const [currentStudentId, setCurrentStudentIdState] = useState<string>(() => {
    return savedStudentSession?.id || '';
  });

  // Firestore Real-Time Raw Collections (Isolated per teacher via useMemo below)
  const [rawStudents, setRawStudents] = useState<Student[]>([]);
  const [rawClassrooms, setRawClassrooms] = useState<Classroom[]>([]);
  const [rawTeachers, setRawTeachers] = useState<Teacher[]>([]);
  const [rawSchedules, setRawSchedules] = useState<ScheduleItem[]>([]);
  const [rawHomeworks, setRawHomeworks] = useState<Homework[]>([]);
  const [rawTrialExams, setRawTrialExams] = useState<TrialExam[]>([]);
  const [rawFocusSessions, setRawFocusSessions] = useState<FocusSession[]>([]);
  const [rawActivities, setRawActivities] = useState<ActivityLog[]>([]);
  const [rawAnnouncements, setRawAnnouncements] = useState<Announcement[]>([]);
  const [rawAssignedExams, setRawAssignedExams] = useState<AssignedExam[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);

  // Connectivity
  const [isFirestoreReady, setIsFirestoreReady] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);

  // Intro
  const [hasCompletedIntro, setHasCompletedIntroState] = useState<boolean>(() => {
    return localStorage.getItem(`${STORAGE_PREFIX}has_completed_intro`) === 'true';
  });

  const setHasCompletedIntro = useCallback((completed: boolean) => {
    setHasCompletedIntroState(completed);
    localStorage.setItem(`${STORAGE_PREFIX}has_completed_intro`, completed ? 'true' : 'false');
  }, []);

  // Timer & Question entry
  const [activeTimer, setActiveTimer] = useState<ActiveTimerSession | null>(null);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [questionEntryModal, setQuestionEntryModal] = useState<QuestionEntryState | null>(null);

  // Initialize Dark Mode in DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(`${STORAGE_PREFIX}dark_mode`, isDarkMode ? 'true' : 'false');
  }, [isDarkMode]);

  // Global background timer interval (continues counting across all tabs and even when popup is hidden)
  useEffect(() => {
    if (!activeTimer?.isRunning) return;
    const interval = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev || !prev.isRunning) return prev;
        const nextElapsed = prev.elapsedSeconds + 1;
        if (prev.mode === 'pomodoro' && nextElapsed >= (prev.initialDurationMinutes || 25) * 60) {
          playFocusFinishSound();
          return {
            ...prev,
            elapsedSeconds: (prev.initialDurationMinutes || 25) * 60,
            isRunning: false
          };
        }
        return {
          ...prev,
          elapsedSeconds: nextElapsed
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer?.isRunning]);



  // Subscribe to all Firestore collections in real time
  useEffect(() => {
    testFirestoreConnection().then(ok => setIsFirestoreReady(ok));

    const unsubStudents = subscribeToCollection<Student>('students', items => {
      setRawStudents(items);
      setLastCloudSync(new Date().toLocaleTimeString('tr-TR'));
    });

    const unsubClassrooms = subscribeToCollection<Classroom>('classrooms', items => {
      setRawClassrooms(items);
    });

    const unsubTeachers = subscribeToCollection<Teacher>('teachers', items => {
      setRawTeachers(items);
    });

    const unsubSchedules = subscribeToCollection<ScheduleItem>('schedules', items => {
      setRawSchedules(items);
    });

    const unsubHomeworks = subscribeToCollection<Homework>('homeworks', items => {
      setRawHomeworks(items);
    });

    const unsubExams = subscribeToCollection<TrialExam>('trialExams', items => {
      setRawTrialExams(items);
    });

    const unsubFocus = subscribeToCollection<FocusSession>('focusSessions', items => {
      setRawFocusSessions(items);
    });

    const unsubActivities = subscribeToCollection<ActivityLog>('activities', items => {
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRawActivities(items);
    });

    const unsubAnnouncements = subscribeToCollection<Announcement>('announcements', items => {
      setRawAnnouncements(items);
    });

    const unsubAssignedExams = subscribeToCollection<AssignedExam>('assigned_exams', items => {
      items.sort((a, b) => a.examDate.localeCompare(b.examDate));
      setRawAssignedExams(items);
    });

    return () => {
      unsubStudents();
      unsubClassrooms();
      unsubTeachers();
      unsubSchedules();
      unsubHomeworks();
      unsubExams();
      unsubFocus();
      unsubActivities();
      unsubAnnouncements();
      unsubAssignedExams();
    };
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let savedTch: Teacher | null = null;
        let savedStd: Student | null = null;
        try {
          const tRaw = localStorage.getItem(`${STORAGE_PREFIX}teacher_session`);
          if (tRaw) savedTch = JSON.parse(tRaw);
          const sRaw = localStorage.getItem(`${STORAGE_PREFIX}student_session`);
          if (sRaw) savedStd = JSON.parse(sRaw);
        } catch {}

        if (savedStd) {
          setFirebaseUser(null);
          setIsAuthReady(true);
          return;
        }
        if (savedTch && savedTch.authProvider === 'password' && savedTch.id !== user.uid) {
          setFirebaseUser(null);
          setCurrentTeacher(savedTch);
          setIsAuthReady(true);
          return;
        }

        setFirebaseUser(user);
        const teacherName = user.displayName || user.email?.split('@')[0] || 'Öğretmen';
        const defaultUsername = (user.email?.split('@')[0] || user.uid.slice(0, 6)).toLowerCase();
        const teacherProfile: Teacher = {
          id: user.uid,
          uid: user.uid,
          username: savedTch?.id === user.uid && savedTch?.username ? savedTch.username : defaultUsername,
          name: savedTch?.id === user.uid && savedTch?.name ? savedTch.name : teacherName,
          email: user.email || '',
          photoURL: user.photoURL || undefined,
          branch: savedTch?.id === user.uid && savedTch?.branch ? savedTch.branch : 'Koçluk & Rehberlik',
          authProvider: 'google',
          createdAt: savedTch?.createdAt || new Date().toISOString()
        };
        setCurrentTeacher(teacherProfile);
        setRoleState('teacher');
        setSavedStudentSession(null);
        localStorage.removeItem(`${STORAGE_PREFIX}student_session`);
        localStorage.setItem(`${STORAGE_PREFIX}teacher_session`, JSON.stringify(teacherProfile));
        saveTeacherToFirestore(teacherProfile);
      } else {
        setFirebaseUser(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, []);

  // Keep currentTeacher synced with live Firestore updates
  useEffect(() => {
    if (!currentTeacher) return;
    const liveTch = rawTeachers.find(t => t.id === currentTeacher.id);
    if (liveTch && (liveTch.name !== currentTeacher.name || liveTch.branch !== currentTeacher.branch || liveTch.username !== currentTeacher.username)) {
      setCurrentTeacher(liveTch);
      localStorage.setItem(`${STORAGE_PREFIX}teacher_session`, JSON.stringify(liveTch));
    }
  }, [rawTeachers, currentTeacher]);

  // Current student object resolution (strictly scoped to logged-in student or active teacher's students)
  const currentStudent = useMemo(() => {
    if (savedStudentSession) {
      const live = rawStudents.find(s => s.id === savedStudentSession.id);
      return live || savedStudentSession;
    }
    const teacherId = currentTeacher?.id || firebaseUser?.uid || '';
    if (currentStudentId) {
      const found = rawStudents.find(s => s.id === currentStudentId);
      if (found && (!teacherId || found.teacherUid === teacherId)) {
        return found;
      }
    }
    if (role === 'student' && teacherId) {
      const ownStudents = rawStudents.filter(s => s.teacherUid === teacherId);
      if (ownStudents.length > 0) return ownStudents[0];
    }
    return undefined;
  }, [rawStudents, currentStudentId, savedStudentSession, role, currentTeacher, firebaseUser]);

  // Active Teacher ID for strict multi-tenant data isolation
  const activeTeacherId = useMemo(() => {
    if (role === 'teacher') {
      if (currentTeacher?.id) return currentTeacher.id;
      return firebaseUser?.uid || '';
    }
    if (currentStudent?.teacherUid) return currentStudent.teacherUid;
    if (currentTeacher?.id) return currentTeacher.id;
    return '';
  }, [role, currentTeacher, firebaseUser, currentStudent]);

  // Cloud Sync for Theme Preferences (cross-device & session persistence)
  const syncThemeConfigToCloud = useCallback(async (updates: { bgTheme?: BackgroundTheme; boxTheme?: BoxColorTheme; isDarkMode?: boolean }) => {
    const effectiveBg = updates.bgTheme ?? bgTheme;
    const effectiveBox = updates.boxTheme ?? boxTheme;
    const effectiveDark = updates.isDarkMode ?? isDarkMode;
    const newConfig = {
      bgTheme: effectiveBg,
      boxTheme: effectiveBox,
      isDarkMode: effectiveDark,
    };

    if (role === 'teacher' && currentTeacher?.id) {
      try {
        await updateTeacherInFirestore(currentTeacher.id, { themeConfig: newConfig });
        setCurrentTeacher(prev => prev ? { ...prev, themeConfig: newConfig } : null);
        const stored = localStorage.getItem(`${STORAGE_PREFIX}teacher_session`);
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem(`${STORAGE_PREFIX}teacher_session`, JSON.stringify({ ...parsed, themeConfig: newConfig }));
        }
      } catch (err) {
        console.warn('Teacher theme sync to Firestore failed:', err);
      }
    } else if (role === 'student' && currentStudent?.id) {
      try {
        await updateStudentInFirestore(currentStudent.id, { themeConfig: newConfig });
        setSavedStudentSession(prev => prev ? { ...prev, themeConfig: newConfig } : null);
        const stored = localStorage.getItem(`${STORAGE_PREFIX}student_session`);
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem(`${STORAGE_PREFIX}student_session`, JSON.stringify({ ...parsed, themeConfig: newConfig }));
        }
      } catch (err) {
        console.warn('Student theme sync to Firestore failed:', err);
      }
    }
  }, [role, currentTeacher, currentStudent, bgTheme, boxTheme, isDarkMode]);

  const setBgTheme = useCallback((theme: BackgroundTheme) => {
    setBgThemeState(theme);
    localStorage.setItem(`${STORAGE_PREFIX}bg_theme`, theme);
    syncThemeConfigToCloud({ bgTheme: theme });
  }, [syncThemeConfigToCloud]);

  const setBoxTheme = useCallback((theme: BoxColorTheme) => {
    setBoxThemeState(theme);
    localStorage.setItem(`${STORAGE_PREFIX}box_theme`, theme);
    syncThemeConfigToCloud({ boxTheme: theme });
  }, [syncThemeConfigToCloud]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const next = !prev;
      syncThemeConfigToCloud({ isDarkMode: next });
      return next;
    });
  }, [syncThemeConfigToCloud]);

  // Synchronize theme preferences across devices when profile is loaded or changed in Firestore
  useEffect(() => {
    const activeConfig = role === 'teacher' ? currentTeacher?.themeConfig : currentStudent?.themeConfig;
    if (activeConfig) {
      if (activeConfig.bgTheme && activeConfig.bgTheme !== bgTheme) {
        setBgThemeState(activeConfig.bgTheme);
        localStorage.setItem(`${STORAGE_PREFIX}bg_theme`, activeConfig.bgTheme);
      }
      if (activeConfig.boxTheme && activeConfig.boxTheme !== boxTheme) {
        setBoxThemeState(activeConfig.boxTheme);
        localStorage.setItem(`${STORAGE_PREFIX}box_theme`, activeConfig.boxTheme);
      }
      if (typeof activeConfig.isDarkMode === 'boolean' && activeConfig.isDarkMode !== isDarkMode) {
        setIsDarkMode(activeConfig.isDarkMode);
        localStorage.setItem(`${STORAGE_PREFIX}dark_mode`, activeConfig.isDarkMode ? 'true' : 'false');
      }
    }
  }, [
    role,
    currentTeacher?.id,
    currentTeacher?.themeConfig?.bgTheme,
    currentTeacher?.themeConfig?.boxTheme,
    currentTeacher?.themeConfig?.isDarkMode,
    currentStudent?.id,
    currentStudent?.themeConfig?.bgTheme,
    currentStudent?.themeConfig?.boxTheme,
    currentStudent?.themeConfig?.isDarkMode
  ]);

  // Strictly isolated collections per account
  const teachers = useMemo(() => {
    if (!currentTeacher) return [];
    const live = rawTeachers.find(t => t.id === currentTeacher.id);
    return [live || currentTeacher];
  }, [rawTeachers, currentTeacher]);

  const students = useMemo(() => {
    if (!activeTeacherId) {
      if (role === 'student' && currentStudent) return [currentStudent];
      return [];
    }
    return rawStudents.filter(s => s.teacherUid === activeTeacherId);
  }, [rawStudents, activeTeacherId, role, currentStudent]);

  const classrooms = useMemo(() => {
    if (!activeTeacherId) return [];
    return rawClassrooms.filter(c => c.teacherUid === activeTeacherId);
  }, [rawClassrooms, activeTeacherId]);

  const studentIdsSet = useMemo(() => new Set(students.map(s => s.id)), [students]);

  const schedules = useMemo(() => {
    if (!activeTeacherId && studentIdsSet.size === 0) return [];
    return rawSchedules.filter(sch => studentIdsSet.has(sch.studentId));
  }, [rawSchedules, activeTeacherId, studentIdsSet]);

  const homeworks = useMemo(() => {
    if (!activeTeacherId) return [];
    return rawHomeworks.filter(hw => studentIdsSet.has(hw.studentId) && (!hw.teacherUid || hw.teacherUid === activeTeacherId));
  }, [rawHomeworks, activeTeacherId, studentIdsSet]);

  const trialExams = useMemo(() => {
    if (!activeTeacherId) return [];
    return rawTrialExams.filter(ex => studentIdsSet.has(ex.studentId) && (!ex.teacherUid || ex.teacherUid === activeTeacherId));
  }, [rawTrialExams, activeTeacherId, studentIdsSet]);

  const focusSessions = useMemo(() => {
    if (role === 'student') {
      if (!currentStudent?.id) return [];
      return rawFocusSessions.filter(f => f.studentId === currentStudent.id);
    }
    if (!activeTeacherId) return [];
    return rawFocusSessions.filter(
      f => studentIdsSet.has(f.studentId) && (!f.teacherUid || f.teacherUid === activeTeacherId)
    );
  }, [rawFocusSessions, role, currentStudent?.id, activeTeacherId, studentIdsSet]);

  const activities = useMemo(() => {
    if (role === 'student') {
      if (!currentStudent?.id) return [];
      return rawActivities.filter(a => a.studentId === currentStudent.id);
    }
    if (!activeTeacherId) return [];
    return rawActivities.filter(
      a => studentIdsSet.has(a.studentId) && (!a.teacherUid || a.teacherUid === activeTeacherId)
    );
  }, [rawActivities, role, currentStudent?.id, activeTeacherId, studentIdsSet]);

  const announcements = useMemo(() => {
    if (!activeTeacherId) return [];
    return rawAnnouncements.filter(ann => ann.teacherUid === activeTeacherId);
  }, [rawAnnouncements, activeTeacherId]);

  const assignedExams = useMemo(() => {
    if (!activeTeacherId) return [];
    return rawAssignedExams.filter(ex => ex.teacherUid === activeTeacherId);
  }, [rawAssignedExams, activeTeacherId]);

  // Keep notifications strictly scoped to the active teacher's announcements
  useEffect(() => {
    setNotifications(prev => {
      const existingMap = new Map(prev.map(n => [n.id, n]));
      return announcements.map(ann => {
        const notifId = `notif_ann_${ann.id}`;
        const prevNotif = existingMap.get(notifId);
        return {
          id: notifId,
          title: `Duyuru: ${ann.title}`,
          message: `${ann.authorName || 'Öğretmen'}: ${ann.content}`,
          date: ann.date,
          read: prevNotif ? prevNotif.read : (currentStudent ? (ann.readBy || []).includes(currentStudent.id) : false),
          type: 'system'
        };
      });
    });
  }, [announcements, currentStudent]);

  const setCurrentStudentId = useCallback((id: string) => {
    setCurrentStudentIdState(id);
    const found = students.find(s => s.id === id);
    if (found && role === 'student' && !currentTeacher) {
      setSavedStudentSession(found);
      localStorage.setItem(`${STORAGE_PREFIX}student_session`, JSON.stringify(found));
    }
  }, [students, role, currentTeacher]);

  // Is logged in computation
  const isLoggedIn = useMemo(() => {
    if (role === 'teacher') {
      return !!currentTeacher || !!firebaseUser;
    }
    if (role === 'student') {
      return !!savedStudentSession || !!currentStudent;
    }
    return false;
  }, [role, firebaseUser, currentTeacher, savedStudentSession, currentStudent]);

  // Teacher Login / Register with Google (Always opens Google Account Picker so different teachers can sign in)
  const loginTeacherWithGoogle = useCallback(async () => {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const existing = rawTeachers.find(t => t.id === user.uid || t.uid === user.uid);
      const teacherName = user.displayName || existing?.name || user.email?.split('@')[0] || 'Öğretmen';
      const username = existing?.username || (user.email?.split('@')[0] || user.uid.slice(0, 6)).toLowerCase();

      const teacherProfile: Teacher = {
        id: user.uid,
        uid: user.uid,
        username,
        name: teacherName,
        email: user.email || existing?.email || '',
        photoURL: user.photoURL || undefined,
        branch: existing?.branch || 'Koçluk & Rehberlik',
        authProvider: 'google',
        createdAt: existing?.createdAt || new Date().toISOString()
      };
      if (existing?.themeConfig) {
        if (existing.themeConfig.bgTheme) setBgThemeState(existing.themeConfig.bgTheme);
        if (existing.themeConfig.boxTheme) setBoxThemeState(existing.themeConfig.boxTheme);
        if (typeof existing.themeConfig.isDarkMode === 'boolean') setIsDarkMode(existing.themeConfig.isDarkMode);
      }
      await saveTeacherToFirestore(teacherProfile);
      setCurrentTeacher(teacherProfile);
      setRoleState('teacher');
      setSavedStudentSession(null);
      setCurrentStudentIdState('');
      localStorage.setItem(`${STORAGE_PREFIX}teacher_session`, JSON.stringify(teacherProfile));
      localStorage.removeItem(`${STORAGE_PREFIX}student_session`);
      return { success: true, teacher: teacherProfile };
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      return { success: false, error: err.message || 'Google girişi tamamlanamadı' };
    }
  }, [rawTeachers]);

  // Register a brand new Teacher Account in Firebase with Username, Name, Password & Branch
  const registerTeacherAccount = useCallback(async (params: {
    username: string;
    name: string;
    password: string;
    branch?: string;
  }) => {
    const cleanUsername = params.username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanName = params.name.trim();
    const cleanPass = params.password.trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'Kullanıcı adı en az 3 karakter olmalıdır.' };
    }
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Lütfen ad ve soyadınızı girin.' };
    }
    if (!cleanPass || cleanPass.length < 4) {
      return { success: false, error: 'Şifre en az 4 karakter olmalıdır.' };
    }

    const duplicate = rawTeachers.find(
      t => (t.username || '').trim().toLowerCase() === cleanUsername
    );
    if (duplicate) {
      return {
        success: false,
        error: `"${cleanUsername}" kullanıcı adı zaten kayıtlı. Lütfen farklı bir kullanıcı adı seçin veya Giriş Yap sekmesini kullanın.`
      };
    }

    // Sign out of any previous Google auth session so it doesn't override this teacher account
    if (auth.currentUser) {
      try {
        await signOut(auth);
      } catch {}
    }

    const newId = `tch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTeacher: Teacher = {
      id: newId,
      username: cleanUsername,
      name: cleanName,
      password: cleanPass,
      branch: params.branch?.trim() || 'Koçluk & Rehberlik',
      authProvider: 'password',
      createdAt: new Date().toISOString()
    };

    await saveTeacherToFirestore(newTeacher);
    setRawTeachers(prev => [...prev.filter(t => t.id !== newId), newTeacher]);
    setFirebaseUser(null);
    setCurrentTeacher(newTeacher);
    setRoleState('teacher');
    setSavedStudentSession(null);
    setCurrentStudentIdState('');
    localStorage.setItem(`${STORAGE_PREFIX}teacher_session`, JSON.stringify(newTeacher));
    localStorage.removeItem(`${STORAGE_PREFIX}student_session`);
    return { success: true, teacher: newTeacher };
  }, [rawTeachers]);

  // Teacher Login with Username (or Full Name) & Password
  const loginTeacherCredentials = useCallback(async (usernameOrName: string, password: string, branch?: string) => {
    const cleanQuery = usernameOrName.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanQuery || cleanQuery.length < 2) {
      return { success: false, error: 'Lütfen kullanıcı adınızı (veya ad soyadınızı) girin.' };
    }
    if (!cleanPass || cleanPass.length < 4) {
      return { success: false, error: 'Şifre en az 4 karakter olmalıdır.' };
    }

    // Match by username, name, or email
    const existing = rawTeachers.find(t => {
      const uMatch = (t.username || '').trim().toLowerCase() === cleanQuery;
      const nMatch = (t.name || '').trim().toLowerCase() === cleanQuery;
      const eMatch = (t.email || '').trim().toLowerCase() === cleanQuery;
      return uMatch || nMatch || eMatch;
    });

    if (!existing) {
      return {
        success: false,
        error: 'Bu kullanıcı adına ait öğretmen hesabı bulunamadı. Yeni hesap açmak için "Kayıt Ol" sekmesini kullanın.'
      };
    }

    if (existing.password && existing.password !== cleanPass) {
      return { success: false, error: 'Girilen şifre hatalı!' };
    }

    // If this teacher had no password yet, set it
    const updatedTeacher: Teacher = {
      ...existing,
      username: existing.username || cleanQuery.replace(/\s+/g, ''),
      password: existing.password || cleanPass,
      branch: existing.branch || branch || 'Koçluk & Rehberlik',
      authProvider: existing.authProvider || 'password'
    };

    if (!existing.password || !existing.username) {
      await saveTeacherToFirestore(updatedTeacher);
    }

    if (auth.currentUser && existing.uid !== auth.currentUser.uid) {
      try {
        await signOut(auth);
      } catch {}
      setFirebaseUser(null);
    }

    if (existing.themeConfig) {
      if (existing.themeConfig.bgTheme) setBgThemeState(existing.themeConfig.bgTheme);
      if (existing.themeConfig.boxTheme) setBoxThemeState(existing.themeConfig.boxTheme);
      if (typeof existing.themeConfig.isDarkMode === 'boolean') setIsDarkMode(existing.themeConfig.isDarkMode);
    }

    setCurrentTeacher(updatedTeacher);
    setRoleState('teacher');
    setSavedStudentSession(null);
    setCurrentStudentIdState('');
    localStorage.setItem(`${STORAGE_PREFIX}teacher_session`, JSON.stringify(updatedTeacher));
    localStorage.removeItem(`${STORAGE_PREFIX}student_session`);
    return { success: true, teacher: updatedTeacher };
  }, [rawTeachers]);

  // Student Login with Class Code + 5-digit number + 4-digit password
  const loginStudentWithClassCode = useCallback(async (
    classCode: string,
    studentNumber: string,
    password: string
  ) => {
    const cleanCode = classCode.trim().toUpperCase();
    const cleanNo = studentNumber.trim();
    const cleanPass = password.trim();

    // 1. Find classroom across all classrooms
    const classroom = rawClassrooms.find(c => (c.code || '').trim().toUpperCase() === cleanCode);
    if (!classroom) {
      return { success: false, message: 'Geçersiz sınıf kodu! Lütfen öğretmeninizden aldığınız sınıf kodunu kontrol edin.' };
    }

    // 2. Find student belonging to this classroom's teacher
    const matched = rawStudents.find(s => {
      const sameTeacher = !classroom.teacherUid || !s.teacherUid || s.teacherUid === classroom.teacherUid;
      const matchNum = (s.studentNumber || s.pin.substring(0, 5)).trim() === cleanNo;
      const matchPass = (s.password || s.pin.substring(s.pin.length - 4)).trim() === cleanPass;
      return sameTeacher && matchNum && matchPass;
    });

    if (!matched) {
      return { success: false, message: 'Bu sınıf için 5 haneli Numara veya 4 haneli Şifre hatalı!' };
    }

    // Ensure student is in classroom and linked to classroom's teacherUid
    const curClasses = matched.classroomIds || [];
    const updatedStudent: Student = {
      ...matched,
      teacherUid: matched.teacherUid || classroom.teacherUid,
      classroomIds: curClasses.includes(classroom.id) ? curClasses : [...curClasses, classroom.id]
    };

    if (!curClasses.includes(classroom.id) || (!matched.teacherUid && classroom.teacherUid)) {
      await updateStudentInFirestore(matched.id, {
        classroomIds: updatedStudent.classroomIds,
        teacherUid: updatedStudent.teacherUid
      });
    }

    // Apply student's personal saved theme across devices
    if (matched.themeConfig) {
      if (matched.themeConfig.bgTheme) setBgThemeState(matched.themeConfig.bgTheme);
      if (matched.themeConfig.boxTheme) setBoxThemeState(matched.themeConfig.boxTheme);
      if (typeof matched.themeConfig.isDarkMode === 'boolean') setIsDarkMode(matched.themeConfig.isDarkMode);
    }

    // Log student activity
    const activityId = `act_${Date.now()}`;
    await saveActivityLogToFirestore({
      id: activityId,
      studentId: matched.id,
      studentName: matched.name,
      teacherUid: updatedStudent.teacherUid || classroom.teacherUid,
      type: 'joined_class',
      title: 'Sınıfa Katıldı',
      detail: `${matched.name}, "${classroom.name}" sınıfına başarıyla giriş yaptı.`,
      timestamp: new Date().toISOString()
    });

    if (auth.currentUser) {
      try {
        await signOut(auth);
      } catch {}
    }
    setFirebaseUser(null);
    setCurrentTeacher(null);
    localStorage.removeItem(`${STORAGE_PREFIX}teacher_session`);

    setSavedStudentSession(updatedStudent);
    setCurrentStudentIdState(updatedStudent.id);
    setRoleState('student');
    localStorage.setItem(`${STORAGE_PREFIX}student_session`, JSON.stringify(updatedStudent));

    return { success: true, student: updatedStudent };
  }, [rawClassrooms, rawStudents]);

  // Logout (Immediately clears session state & signs out of Firebase)
  const logout = useCallback(async () => {
    localStorage.removeItem(`${STORAGE_PREFIX}teacher_session`);
    localStorage.removeItem(`${STORAGE_PREFIX}student_session`);
    setFirebaseUser(null);
    setCurrentTeacher(null);
    setSavedStudentSession(null);
    setCurrentStudentIdState('');
    setActiveTimer(null);
    setIsTimerModalOpen(false);
    setQuestionEntryModal(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Signout error:', e);
    }
  }, []);

  // Student mutations
  const addStudent = useCallback(async (data: Omit<Student, 'id' | 'streak'>) => {
    const id = `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ownerTeacherId = currentTeacher?.id || firebaseUser?.uid || '';
    const newStudent: Student = {
      ...data,
      id,
      teacherUid: ownerTeacherId,
      createdAt: new Date().toISOString(),
      streak: {
        count: 0,
        status: 'active',
        lastActiveDate: '',
        frozenDays: 0,
      }
    };
    setRawStudents(prev => [...prev, newStudent]);
    await saveStudentToFirestore(newStudent);
    return id;
  }, [firebaseUser, currentTeacher]);

  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    setRawStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    await updateStudentInFirestore(id, updates);
  }, []);

  const deleteStudent = useCallback(async (id: string) => {
    setRawStudents(prev => prev.filter(s => s.id !== id));
    await deleteStudentFromFirestore(id);
  }, []);

  // Classroom mutations
  const addClassroom = useCallback(async (data: Omit<Classroom, 'id' | 'createdAt'>) => {
    const id = `cls_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = data.code || `AKD-${randomSuffix}`;
    const ownerTeacherId = currentTeacher?.id || firebaseUser?.uid || '';

    const newClass: Classroom = {
      ...data,
      id,
      code,
      teacherUid: ownerTeacherId,
      createdAt: new Date().toISOString()
    };
    setRawClassrooms(prev => [...prev, newClass]);
    await saveClassroomToFirestore(newClass);
    return id;
  }, [firebaseUser, currentTeacher]);

  const updateClassroom = useCallback(async (id: string, updates: Partial<Classroom>) => {
    setRawClassrooms(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    await updateClassroomInFirestore(id, updates);
  }, []);

  const deleteClassroom = useCallback(async (id: string) => {
    setRawClassrooms(prev => prev.filter(c => c.id !== id));
    try {
      await deleteClassroomFromFirestore(id);
    } catch (err) {
      console.error('Failed to delete classroom from Firestore:', err);
    }
  }, []);

  const assignStudentToClassrooms = useCallback(async (studentId: string, classroomIds: string[]) => {
    setRawStudents(prev => prev.map(s => s.id === studentId ? { ...s, classroomIds } : s));
    await updateStudentInFirestore(studentId, { classroomIds });
  }, []);

  // Teacher mutations
  const addTeacher = useCallback(async (data: Omit<Teacher, 'id'>) => {
    const id = `tch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTch: Teacher = { ...data, id, createdAt: new Date().toISOString() };
    await saveTeacherToFirestore(newTch);
    return id;
  }, []);

  const updateTeacher = useCallback(async (id: string, updates: Partial<Teacher>) => {
    await saveTeacherToFirestore({ ...updates, id } as Teacher);
  }, []);

  const deleteTeacher = useCallback(async (id: string) => {
    setRawTeachers(prev => prev.filter(t => t.id !== id));
    await deleteTeacherFromFirestore(id);
  }, []);

  // Activity logger
  const logActivity = useCallback(async (data: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const logItem: ActivityLog = {
      ...data,
      id,
      teacherUid: data.teacherUid || activeTeacherId,
      timestamp: new Date().toISOString()
    };
    setRawActivities(prev => [logItem, ...prev]);
    await saveActivityLogToFirestore(logItem);
  }, [activeTeacherId]);

  // Schedule mutations
  const addScheduleItem = useCallback(async (item: Omit<ScheduleItem, 'id'>) => {
    const id = `sch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newItem: ScheduleItem = {
      ...item,
      id,
      teacherNote: item.teacherNote || '',
      status: item.status || 'pending',
      updatedAt: new Date().toISOString()
    };
    setRawSchedules(prev => [...prev, newItem]);
    await saveScheduleItemToFirestore(newItem);
    return id;
  }, []);

  const updateScheduleItem = useCallback(async (id: string, updates: Partial<ScheduleItem>) => {
    const updatedAt = new Date().toISOString();
    setRawSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt } : s));
    await updateScheduleItemInFirestore(id, { ...updates, updatedAt });
  }, []);

  const toggleScheduleItemCompletion = useCallback(async (id: string) => {
    const item = rawSchedules.find(s => s.id === id);
    if (!item) return;
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    const updatedAt = new Date().toISOString();
    setRawSchedules(prev => prev.map(s => s.id === id ? { ...s, status: newStatus, updatedAt } : s));
    await updateScheduleItemInFirestore(id, { status: newStatus, updatedAt });

    // When a student marks a lesson completed, write a friendly activity log entry
    if (newStatus === 'completed' && currentStudent) {
      await logActivity({
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        teacherUid: activeTeacherId,
        type: 'focus_completed',
        title: `${item.subject} • Oturum Tamamlandı`,
        detail: `${currentStudent.name}, ${item.subject} - ${item.topic || 'Ders'} oturumunu başarıyla tamamladı olarak işaretledi.`
      });
    }
  }, [rawSchedules, currentStudent, activeTeacherId, logActivity]);

  const deleteScheduleItem = useCallback(async (id: string) => {
    setRawSchedules(prev => prev.filter(s => s.id !== id));
    await deleteScheduleItemFromFirestore(id);
  }, []);

  // Homework mutations
  const addHomework = useCallback(async (hw: Omit<Homework, 'id'>) => {
    const id = `hw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ownerTeacherId = currentTeacher?.id || firebaseUser?.uid || activeTeacherId;
    const newHw: Homework = {
      ...hw,
      id,
      teacherUid: ownerTeacherId,
      status: hw.status || 'pending'
    };
    setRawHomeworks(prev => [...prev, newHw]);
    await saveHomeworkToFirestore(newHw);
    return id;
  }, [firebaseUser, currentTeacher, activeTeacherId]);

  const updateHomework = useCallback(async (id: string, updates: Partial<Homework>) => {
    setRawHomeworks(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
    await updateHomeworkInFirestore(id, updates);
  }, []);

  // Trial Exam mutations
  const addTrialExam = useCallback(async (exam: Omit<TrialExam, 'id'>) => {
    const id = `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ownerTeacherId = currentTeacher?.id || firebaseUser?.uid || currentStudent?.teacherUid || activeTeacherId;
    const newExam: TrialExam = {
      ...exam,
      id,
      teacherUid: ownerTeacherId
    };
    setRawTrialExams(prev => [...prev, newExam]);
    await saveTrialExamToFirestore(newExam);

    // Also log activity to teacher
    if (currentStudent) {
      await logActivity({
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        teacherUid: currentStudent.teacherUid || ownerTeacherId,
        type: 'exam_recorded',
        title: 'Deneme Sınavı Kaydedildi',
        detail: `${currentStudent.name}, "${newExam.title}" denemesinden ${newExam.totalNet} net yaptı.`
      });
    }

    return id;
  }, [firebaseUser, currentTeacher, currentStudent, activeTeacherId, logActivity]);

  const deleteTrialExam = useCallback(async (id: string) => {
    setRawTrialExams(prev => prev.filter(e => e.id !== id));
    await deleteTrialExamFromFirestore(id);
  }, []);

  // Focus Session mutations
  const addFocusSession = useCallback(async (session: Omit<FocusSession, 'id' | 'completedAt' | 'sentToTeacher'> & { sentToTeacher?: boolean }) => {
    const id = `fcs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const targetSt = students.find(s => s.id === session.studentId) || (currentStudent?.id === session.studentId ? currentStudent : undefined);
    const ownerTeacherId = session.teacherUid || targetSt?.teacherUid || activeTeacherId;
    const newSession: FocusSession = {
      ...session,
      id,
      teacherUid: ownerTeacherId,
      completedAt: new Date().toISOString(),
      sentToTeacher: true
    };
    setRawFocusSessions(prev => [newSession, ...prev]);
    await saveFocusSessionToFirestore(newSession);

    // Otomatik Seri Kuralı: Öğrenci odak modunda 5 dakika (300 sn) ve üzeri geçirirse günde en fazla 1 kez +1 seri kazanır
    const isFiveMinOrMore = session.durationMinutes >= 5 || (session.durationSeconds || 0) >= 300;
    const todayStr = new Date().toISOString().split('T')[0];
    const alreadyEarnedToday = (targetSt?.streak?.lastActiveDate === todayStr) && ((targetSt?.streak?.count || 0) > 0);
    const earnedStreakNow = Boolean(isFiveMinOrMore && targetSt && !alreadyEarnedToday);

    if (earnedStreakNow && targetSt) {
      const updatedStreak = {
        ...targetSt.streak,
        count: (targetSt.streak?.count || 0) + 1,
        status: 'active' as StreakStatus,
        lastActiveDate: todayStr
      };
      setRawStudents(prev => prev.map(s => s.id === targetSt.id ? { ...s, streak: updatedStreak } : s));
      await updateStudentInFirestore(targetSt.id, { streak: updatedStreak });
    }

    const qText = session.solvedQuestions
      ? ` • ${session.solvedQuestions.correct}D / ${session.solvedQuestions.wrong}Y / ${session.solvedQuestions.blank}B (${session.solvedQuestions.net} Net)`
      : '';

    // Log activity to teacher immediately
    await logActivity({
      studentId: session.studentId,
      studentName: session.studentName,
      teacherUid: ownerTeacherId,
      type: session.solvedQuestions ? 'question_solved' : 'focus_completed',
      title: `${session.subject} • ${session.topic}`,
      detail: `${session.studentName}, ${session.durationMinutes} dk odaklandı${qText}.${earnedStreakNow ? ' (+1 Gün Seri)' : ''}`
    });
  }, [logActivity, students, currentStudent, activeTeacherId]);

  const giveTeacherFeedbackToFocusSession = useCallback(async (sessionId: string, feedback: string) => {
    const session = focusSessions.find(f => f.id === sessionId);
    if (session) {
      await saveFocusSessionToFirestore({
        ...session,
        teacherFeedback: feedback,
        teacherFeedbackAt: new Date().toISOString()
      });
    }
  }, [focusSessions]);

  // Announcements
  const addAnnouncement = useCallback(async (ann: Omit<Announcement, 'id'>) => {
    const id = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const dateStr = new Date().toLocaleDateString('tr-TR');
    const ownerTeacherId = currentTeacher?.id || firebaseUser?.uid || activeTeacherId;
    const newAnn: Announcement = {
      ...ann,
      id,
      teacherUid: ownerTeacherId,
      date: dateStr,
      readBy: []
    };
    setRawAnnouncements(prev => [newAnn, ...prev]);
    await saveAnnouncementToFirestore(newAnn);
    return id;
  }, [firebaseUser, currentTeacher, activeTeacherId]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    setRawAnnouncements(prev => prev.filter(a => a.id !== id));
    setNotifications(prev => prev.filter(n => n.id !== `notif_ann_${id}`));
    await deleteAnnouncementFromFirestore(id);
  }, []);

  const toggleAnnouncementRead = useCallback(async (announcementId: string, studentId: string) => {
    const targetAnn = announcements.find(a => a.id === announcementId);
    if (!targetAnn) return;
    const currentReads = targetAnn.readBy || [];
    const isAlreadyRead = currentReads.includes(studentId);
    const updatedReads = isAlreadyRead
      ? currentReads.filter(id => id !== studentId)
      : [...currentReads, studentId];

    setRawAnnouncements(prev => prev.map(a => a.id === announcementId ? { ...a, readBy: updatedReads } : a));
    if (!isAlreadyRead) {
      setNotifications(prev => prev.map(n => n.id === `notif_ann_${announcementId}` ? { ...n, read: true } : n));
    }
    await updateAnnouncementInFirestore(announcementId, { readBy: updatedReads });
  }, [announcements]);

  const addAnnouncementComment = useCallback(async (
    announcementId: string,
    content: string,
    parentId?: string,
    replyToName?: string
  ) => {
    const cleanText = content.trim();
    if (!cleanText) return;
    const targetAnn = announcements.find(a => a.id === announcementId);
    if (!targetAnn) return;

    const authorId = role === 'teacher'
      ? (currentTeacher?.id || firebaseUser?.uid || 'teacher')
      : (currentStudent?.id || 'student');
    const authorName = role === 'teacher'
      ? (currentTeacher?.name || firebaseUser?.displayName || 'Öğretmen')
      : (currentStudent?.name || 'Öğrenci');

    const newComment: AnnouncementComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      authorId,
      authorName,
      authorRole: role,
      content: cleanText,
      createdAt: new Date().toISOString(),
      ...(parentId ? { parentId } : {}),
      ...(replyToName ? { replyToName } : {})
    };

    const updatedComments = [...(targetAnn.comments || []), newComment];
    setRawAnnouncements(prev =>
      prev.map(a => a.id === announcementId ? { ...a, comments: updatedComments } : a)
    );
    await updateAnnouncementInFirestore(announcementId, { comments: updatedComments });

    if (role === 'student' && currentStudent) {
      await logActivity({
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        teacherUid: targetAnn.teacherUid || activeTeacherId,
        type: 'focus_completed',
        title: `Duyuru Yorumu • ${targetAnn.title}`,
        detail: `${currentStudent.name}: "${cleanText}"`
      });
    }
  }, [announcements, role, currentTeacher, firebaseUser, currentStudent, activeTeacherId, logActivity]);

  const deleteAnnouncementComment = useCallback(async (announcementId: string, commentId: string) => {
    const targetAnn = announcements.find(a => a.id === announcementId);
    if (!targetAnn) return;
    const updatedComments = (targetAnn.comments || []).filter(
      c => c.id !== commentId && c.parentId !== commentId
    );
    setRawAnnouncements(prev =>
      prev.map(a => a.id === announcementId ? { ...a, comments: updatedComments } : a)
    );
    await updateAnnouncementInFirestore(announcementId, { comments: updatedComments });
  }, [announcements]);

  // Assigned Exams
  const addAssignedExam = useCallback(async (exam: Omit<AssignedExam, 'id'>) => {
    const id = `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ownerTeacherId = currentTeacher?.id || firebaseUser?.uid || activeTeacherId;
    const newExam: AssignedExam = {
      ...exam,
      id,
      teacherUid: ownerTeacherId,
      createdAt: new Date().toISOString()
    };
    setRawAssignedExams(prev => [...prev, newExam].sort((a, b) => a.examDate.localeCompare(b.examDate)));
    await saveAssignedExamToFirestore(newExam);
    return id;
  }, [firebaseUser, currentTeacher, activeTeacherId]);

  const deleteAssignedExam = useCallback(async (id: string) => {
    setRawAssignedExams(prev => prev.filter(e => e.id !== id));
    await deleteAssignedExamFromFirestore(id);
  }, []);

  // Student Daily Question Target
  const updateStudentDailyQuestionTarget = useCallback(async (studentId: string, target: number) => {
    setRawStudents(prev => prev.map(s => s.id === studentId ? { ...s, dailyQuestionTarget: target } : s));
    await updateStudentInFirestore(studentId, { dailyQuestionTarget: target });
  }, []);

  // Templates
  const addTemplate = useCallback((tpl: Omit<ScheduleTemplate, 'id'>) => {
    const id = `tpl_${Date.now()}`;
    setTemplates(prev => [...prev, { ...tpl, id }]);
  }, []);

  const applyTemplateToStudent = useCallback((templateId: string, studentId: string) => {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;
    tpl.items.forEach(async item => {
      await addScheduleItem({ ...item, studentId });
    });
  }, [templates, addScheduleItem]);

  // Notifications
  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Timer handlers
  const startTimer = useCallback((params: {
    scheduleItemId?: string;
    homeworkId?: string;
    subject: string;
    topic: string;
    mode?: 'stopwatch' | 'pomodoro';
    initialMinutes?: number;
    openModal?: boolean;
    autoStart?: boolean;
  }) => {
    setActiveTimer({
      scheduleItemId: params.scheduleItemId,
      homeworkId: params.homeworkId,
      studentId: currentStudent?.id || '',
      subject: params.subject,
      topic: params.topic,
      mode: params.mode || 'stopwatch',
      initialDurationMinutes: params.initialMinutes || 25,
      elapsedSeconds: 0,
      isRunning: params.autoStart !== false,
      isMinimized: !params.openModal,
      isPopupHidden: false,
      startedAt: new Date().toISOString()
    });
    setIsTimerModalOpen(Boolean(params.openModal));
  }, [currentStudent]);

  const pauseTimer = useCallback(() => {
    setActiveTimer(prev => prev ? { ...prev, isRunning: false } : null);
  }, []);

  const resumeTimer = useCallback(() => {
    setActiveTimer(prev => prev ? { ...prev, isRunning: true } : null);
  }, []);

  const resetTimer = useCallback(() => {
    setActiveTimer(prev => prev ? { ...prev, elapsedSeconds: 0, isRunning: false } : null);
  }, []);

  const minimizeTimer = useCallback(() => {
    setActiveTimer(prev => prev ? { ...prev, isMinimized: true, isPopupHidden: false } : null);
    setIsTimerModalOpen(false);
  }, []);

  const expandTimer = useCallback(() => {
    setActiveTimer(prev => prev ? { ...prev, isMinimized: false, isPopupHidden: false } : null);
    setIsTimerModalOpen(true);
  }, []);

  const hideTimerPopup = useCallback(() => {
    setActiveTimer(prev => prev ? { ...prev, isPopupHidden: true, isMinimized: true } : null);
    setIsTimerModalOpen(false);
  }, []);

  const showTimerPopup = useCallback(() => {
    setActiveTimer(prev => prev ? { ...prev, isPopupHidden: false } : null);
  }, []);

  const updateTimerState = useCallback((updates: Partial<ActiveTimerSession>) => {
    setActiveTimer(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const finishTimer = useCallback(() => {
    if (!activeTimer) return;
    playFocusFinishSound();
    const durationMinutes = Math.max(1, Math.round(activeTimer.elapsedSeconds / 60));

    // Open question entry sheet
    setQuestionEntryModal({
      isOpen: true,
      scheduleItemId: activeTimer.scheduleItemId,
      homeworkId: activeTimer.homeworkId,
      durationMinutes,
      durationSeconds: activeTimer.elapsedSeconds,
      mode: activeTimer.mode,
      subject: activeTimer.subject,
      topic: activeTimer.topic
    });

    setIsTimerModalOpen(false);
    setActiveTimer(null);
  }, [activeTimer]);

  const cancelTimer = useCallback(() => {
    setActiveTimer(null);
    setIsTimerModalOpen(false);
  }, []);

  const closeQuestionEntryModal = useCallback(() => {
    setQuestionEntryModal(null);
  }, []);

  // Submit Question Entry
  const submitQuestionEntry = useCallback(async (
    results: SolvedQuestions,
    customSubject?: string,
    customTopic?: string,
    studentNote?: string
  ) => {
    const targetSt = currentStudent || students[0];
    if (!questionEntryModal || !targetSt) return;

    const finalSubject = customSubject?.trim() || questionEntryModal.subject;
    const finalTopic = customTopic?.trim() || questionEntryModal.topic;

    // Update schedule item if linked
    if (questionEntryModal.scheduleItemId) {
      await updateScheduleItem(questionEntryModal.scheduleItemId, {
        subject: finalSubject,
        topic: finalTopic,
        actualDurationMinutes: questionEntryModal.durationMinutes,
        solvedQuestions: results,
        status: 'completed'
      });
    }

    // Update homework item if linked
    if (questionEntryModal.homeworkId) {
      await updateHomework(questionEntryModal.homeworkId, {
        status: 'submitted',
        studentSubmission: {
          ...results,
          submittedAt: new Date().toISOString()
        }
      });
    }

    // Save as focus session in Firestore (automatically handles >= 5 min streak +1 & activity log)
    await addFocusSession({
      studentId: targetSt.id,
      studentName: targetSt.name,
      teacherUid: targetSt.teacherUid,
      subject: finalSubject,
      topic: finalTopic,
      durationMinutes: questionEntryModal.durationMinutes,
      durationSeconds: questionEntryModal.durationSeconds ?? questionEntryModal.durationMinutes * 60,
      mode: questionEntryModal.mode || 'stopwatch',
      solvedQuestions: results,
      studentNote: studentNote?.trim() || undefined,
      sentToTeacher: true
    });

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}

    setQuestionEntryModal(null);
  }, [questionEntryModal, currentStudent, students, updateScheduleItem, updateHomework, addFocusSession]);

  // Streak operations
  const incrementStreakForStudent = useCallback(async (studentId: string) => {
    const st = students.find(s => s.id === studentId);
    if (!st) return;
    const todayStr = new Date().toISOString().split('T')[0];
    if (st.streak?.lastActiveDate === todayStr && (st.streak?.count || 0) > 0) return;
    const updatedStreak = {
      ...st.streak,
      count: (st.streak?.count || 0) + 1,
      status: 'active' as StreakStatus,
      lastActiveDate: todayStr
    };
    setRawStudents(prev => prev.map(s => s.id === studentId ? { ...s, streak: updatedStreak } : s));
    await updateStudentInFirestore(studentId, { streak: updatedStreak });
  }, [students]);

  const addTeacherDailyStreak = useCallback(async (studentId: string): Promise<boolean> => {
    const st = students.find(s => s.id === studentId);
    if (!st) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    // Aynı gün içinde zaten seri eklendiyse tekrar eklenemesin
    if (st.streak?.lastActiveDate === todayStr && (st.streak?.count || 0) > 0) {
      return false;
    }
    const updatedStreak = {
      ...st.streak,
      count: (st.streak?.count || 0) + 1,
      status: 'active' as StreakStatus,
      lastActiveDate: todayStr
    };
    setRawStudents(prev => prev.map(s => s.id === studentId ? { ...s, streak: updatedStreak } : s));
    await updateStudentInFirestore(studentId, { streak: updatedStreak });
    await logActivity({
      studentId: st.id,
      studentName: st.name,
      teacherUid: st.teacherUid,
      type: 'streak_active',
      title: '+1 Gün Seri Eklendi',
      detail: `${st.name} • Toplam: ${updatedStreak.count} Gün`
    });
    return true;
  }, [students, logActivity]);

  const updateStudentStreakCount = useCallback(async (studentId: string, newCount: number) => {
    const st = students.find(s => s.id === studentId);
    if (!st) return;
    const cleanCount = Math.max(0, Math.floor(Number(newCount) || 0));
    const updatedStreak = {
      ...st.streak,
      count: cleanCount,
      status: (cleanCount > 0 ? 'active' : 'lost') as StreakStatus,
      lastActiveDate: cleanCount === 0 ? '' : (st.streak?.lastActiveDate || '')
    };
    setRawStudents(prev => prev.map(s => s.id === studentId ? { ...s, streak: updatedStreak } : s));
    await updateStudentInFirestore(studentId, { streak: updatedStreak });
  }, [students]);

  const requestStreakRecovery = useCallback(async (studentId: string, excuse: string) => {
    const st = students.find(s => s.id === studentId);
    if (!st) return;
    await updateStudentInFirestore(studentId, {
      streak: {
        ...st.streak,
        status: 'pending_recovery',
        excuseNote: excuse,
        requestDate: new Date().toISOString()
      }
    });
  }, [students]);

  const approveStreakRecovery = useCallback(async (studentId: string) => {
    const st = students.find(s => s.id === studentId);
    if (!st) return;
    const updatedStreak = {
      ...st.streak,
      status: 'active' as StreakStatus,
      excuseNote: '',
      requestDate: ''
    };
    setRawStudents(prev => prev.map(s => s.id === studentId ? { ...s, streak: updatedStreak } : s));
    await updateStudentInFirestore(studentId, {
      streak: updatedStreak
    });
  }, [students]);

  const rejectStreakRecovery = useCallback(async (studentId: string) => {
    const st = students.find(s => s.id === studentId);
    if (!st) return;
    const updatedStreak = {
      ...st.streak,
      status: 'lost' as StreakStatus,
      count: 0,
      excuseNote: '',
      requestDate: ''
    };
    setRawStudents(prev => prev.map(s => s.id === studentId ? { ...s, streak: updatedStreak } : s));
    await updateStudentInFirestore(studentId, {
      streak: updatedStreak
    });
  }, [students]);

  const simulateDayPass = useCallback(async (action: 'today_solved' | 'miss_one_day' | 'miss_three_days') => {
    if (!currentStudent) return;
    if (action === 'today_solved') {
      await incrementStreakForStudent(currentStudent.id);
    } else if (action === 'miss_one_day') {
      await updateStudentInFirestore(currentStudent.id, {
        streak: { ...currentStudent.streak, status: 'frozen', frozenDays: 1 }
      });
    } else if (action === 'miss_three_days') {
      await updateStudentInFirestore(currentStudent.id, {
        streak: { ...currentStudent.streak, status: 'pending_recovery', frozenDays: 3 }
      });
    }
  }, [currentStudent, incrementStreakForStudent]);

  // Upcoming Exam (from teacher-assigned exams)
  const upcomingExam = useMemo(() => {
    if (assignedExams.length === 0) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    const futureOrToday = assignedExams
      .filter(e => e.examDate >= todayStr)
      .sort((a, b) => a.examDate.localeCompare(b.examDate));
    return futureOrToday[0] || assignedExams[assignedExams.length - 1] || null;
  }, [assignedExams]);

  // Days left for upcoming exam
  const targetDaysLeft = useMemo(() => {
    if (upcomingExam) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(upcomingExam.examDate);
      target.setHours(0, 0, 0, 0);
      const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 ? diff : 0;
    }
    if (currentStudent?.targetExamDate) {
      const target = new Date(currentStudent.targetExamDate).getTime();
      const now = new Date().getTime();
      const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    }
    return 18;
  }, [upcomingExam, currentStudent]);

  const syncWithCloud = useCallback(async () => {
    setIsCloudSyncing(true);
    await testFirestoreConnection();
    setLastCloudSync(new Date().toLocaleTimeString('tr-TR'));
    setIsCloudSyncing(false);
  }, []);

  const resetAllData = useCallback(() => {
    // Reset local
    setSavedStudentSession(null);
    localStorage.removeItem(`${STORAGE_PREFIX}student_session`);
  }, []);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole: setRoleState,
        isLoggedIn,
        isAuthReady,
        firebaseUser,
        currentTeacher,
        currentStudent,
        currentStudentId,
        setCurrentStudentId,
        loginTeacherWithGoogle,
        registerTeacherAccount,
        loginTeacherCredentials,
        loginStudentWithClassCode,
        cloudLoginWithStudentCredentials: loginStudentWithClassCode,
        logout,
        isDarkMode,
        toggleDarkMode,
        bgTheme,
        setBgTheme,
        boxTheme,
        setBoxTheme,
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        classrooms,
        addClassroom,
        updateClassroom,
        deleteClassroom,
        assignStudentToClassrooms,
        teachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        activities,
        logActivity,
        schedules,
        addScheduleItem,
        updateScheduleItem,
        toggleScheduleItemCompletion,
        deleteScheduleItem,
        templates,
        addTemplate,
        applyTemplateToStudent,
        trialExams,
        addTrialExam,
        deleteTrialExam,
        homeworks,
        addHomework,
        updateHomework,
        focusSessions,
        addFocusSession,
        giveTeacherFeedbackToFocusSession,
        announcements,
        addAnnouncement,
        deleteAnnouncement,
        toggleAnnouncementRead,
        addAnnouncementComment,
        deleteAnnouncementComment,
        assignedExams,
        upcomingExam,
        addAssignedExam,
        deleteAssignedExam,
        updateStudentDailyQuestionTarget,
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        activeTimer,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        minimizeTimer,
        expandTimer,
        hideTimerPopup,
        showTimerPopup,
        updateTimerState,
        finishTimer,
        cancelTimer,
        isTimerModalOpen,
        setIsTimerModalOpen,
        questionEntryModal,
        closeQuestionEntryModal,
        submitQuestionEntry,
        incrementStreakForStudent,
        addTeacherDailyStreak,
        updateStudentStreakCount,
        requestStreakRecovery,
        approveStreakRecovery,
        rejectStreakRecovery,
        simulateDayPass,
        targetDaysLeft,
        hasCompletedIntro,
        setHasCompletedIntro,
        isFirestoreReady,
        syncWithCloud,
        isCloudSyncing,
        lastCloudSync,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
