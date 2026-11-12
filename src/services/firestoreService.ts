import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  Student,
  Teacher,
  Classroom,
  ScheduleItem,
  Homework,
  TrialExam,
  FocusSession,
  Announcement,
  ActivityLog,
  AssignedExam
} from '../types';

export function cleanForFirestore<T>(obj: T): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  if (typeof obj === 'object') {
    const res: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        res[k] = cleanForFirestore(v);
      }
    }
    return res;
  }
  return obj;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Collections listeners
export function subscribeToCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError?: (err: any) => void
) {
  try {
    const colRef = collection(db, collectionName);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as T));
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collectionName);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, collectionName);
    return () => {};
  }
}

// Student mutations
export async function saveStudentToFirestore(student: Student) {
  const path = `students/${student.id}`;
  try {
    await setDoc(doc(db, 'students', student.id), cleanForFirestore(student));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateStudentInFirestore(id: string, updates: Partial<Student>) {
  const path = `students/${id}`;
  try {
    await updateDoc(doc(db, 'students', id), cleanForFirestore(updates));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteStudentFromFirestore(id: string) {
  const path = `students/${id}`;
  try {
    await deleteDoc(doc(db, 'students', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Classroom mutations
export async function saveClassroomToFirestore(classroom: Classroom) {
  const path = `classrooms/${classroom.id}`;
  try {
    await setDoc(doc(db, 'classrooms', classroom.id), cleanForFirestore(classroom));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateClassroomInFirestore(id: string, updates: Partial<Classroom>) {
  const path = `classrooms/${id}`;
  try {
    await updateDoc(doc(db, 'classrooms', id), cleanForFirestore(updates));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteClassroomFromFirestore(id: string) {
  const path = `classrooms/${id}`;
  try {
    await deleteDoc(doc(db, 'classrooms', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Teacher mutations
export async function saveTeacherToFirestore(teacher: Teacher) {
  const path = `teachers/${teacher.id}`;
  try {
    await setDoc(doc(db, 'teachers', teacher.id), cleanForFirestore(teacher));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateTeacherInFirestore(id: string, updates: Partial<Teacher>) {
  const path = `teachers/${id}`;
  try {
    await updateDoc(doc(db, 'teachers', id), cleanForFirestore(updates));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteTeacherFromFirestore(id: string) {
  const path = `teachers/${id}`;
  try {
    await deleteDoc(doc(db, 'teachers', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Activity Log
export async function saveActivityLogToFirestore(activity: ActivityLog) {
  const path = `activities/${activity.id}`;
  try {
    await setDoc(doc(db, 'activities', activity.id), cleanForFirestore(activity));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Schedules
export async function saveScheduleItemToFirestore(item: ScheduleItem) {
  const path = `schedules/${item.id}`;
  try {
    await setDoc(doc(db, 'schedules', item.id), cleanForFirestore(item));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateScheduleItemInFirestore(id: string, updates: Partial<ScheduleItem>) {
  const path = `schedules/${id}`;
  try {
    await updateDoc(doc(db, 'schedules', id), cleanForFirestore(updates));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteScheduleItemFromFirestore(id: string) {
  const path = `schedules/${id}`;
  try {
    await deleteDoc(doc(db, 'schedules', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Homeworks
export async function saveHomeworkToFirestore(hw: Homework) {
  const path = `homeworks/${hw.id}`;
  try {
    await setDoc(doc(db, 'homeworks', hw.id), cleanForFirestore(hw));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateHomeworkInFirestore(id: string, updates: Partial<Homework>) {
  const path = `homeworks/${id}`;
  try {
    await updateDoc(doc(db, 'homeworks', id), cleanForFirestore(updates));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Trial Exams
export async function saveTrialExamToFirestore(exam: TrialExam) {
  const path = `trialExams/${exam.id}`;
  try {
    await setDoc(doc(db, 'trialExams', exam.id), cleanForFirestore(exam));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateTrialExamInFirestore(id: string, updates: Partial<TrialExam>) {
  const path = `trialExams/${id}`;
  try {
    await updateDoc(doc(db, 'trialExams', id), cleanForFirestore(updates));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteTrialExamFromFirestore(id: string) {
  const path = `trialExams/${id}`;
  try {
    await deleteDoc(doc(db, 'trialExams', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Focus Sessions
export async function saveFocusSessionToFirestore(session: FocusSession) {
  const path = `focusSessions/${session.id}`;
  try {
    await setDoc(doc(db, 'focusSessions', session.id), cleanForFirestore(session));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateFocusSessionInFirestore(id: string, updates: Partial<FocusSession>) {
  const path = `focusSessions/${id}`;
  try {
    await updateDoc(doc(db, 'focusSessions', id), cleanForFirestore(updates));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteFocusSessionFromFirestore(id: string) {
  const path = `focusSessions/${id}`;
  try {
    await deleteDoc(doc(db, 'focusSessions', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Announcements
export async function saveAnnouncementToFirestore(ann: Announcement) {
  const path = `announcements/${ann.id}`;
  try {
    await setDoc(doc(db, 'announcements', ann.id), cleanForFirestore(ann));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateAnnouncementInFirestore(id: string, updates: Partial<Announcement>) {
  const path = `announcements/${id}`;
  try {
    await updateDoc(doc(db, 'announcements', id), cleanForFirestore(updates));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteAnnouncementFromFirestore(id: string) {
  const path = `announcements/${id}`;
  try {
    await deleteDoc(doc(db, 'announcements', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Assigned Exams
export async function saveAssignedExamToFirestore(exam: AssignedExam) {
  const path = `assigned_exams/${exam.id}`;
  try {
    await setDoc(doc(db, 'assigned_exams', exam.id), cleanForFirestore(exam));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteAssignedExamFromFirestore(id: string) {
  const path = `assigned_exams/${id}`;
  try {
    await deleteDoc(doc(db, 'assigned_exams', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
