import React, { useState } from 'react';
import {
  Layers,
  Users,
  Plus,
  Edit2,
  Trash2,
  Check,
  UserCheck,
  GraduationCap,
  Sparkles,
  Phone,
  BookOpen,
  FolderPlus,
  ShieldCheck,
  Search,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Classroom, Student, Teacher } from '../../types';

const PRESET_COLORS = [
  { name: 'Mavi', hex: '#3B82F6' },
  { name: 'İndigo', hex: '#6366F1' },
  { name: 'Zümrüt Yeşili', hex: '#10B981' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Gül Pembesi', hex: '#F43F5E' },
  { name: 'Mor', hex: '#A855F7' },
];

export const ClassroomsView: React.FC = () => {
  const {
    classrooms,
    addClassroom,
    updateClassroom,
    deleteClassroom,
    students,
    assignStudentToClassrooms,
    teachers,
    addTeacher,
    updateTeacher,
    deleteTeacher,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'classrooms' | 'teachers'>('classrooms');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);

  // Classroom Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Classroom | null>(null);
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('12. Sınıf');
  const [branch, setBranch] = useState('Sayısal');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  // Teacher Modal States
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [teacherBranch, setTeacherBranch] = useState('Matematik');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherClassIds, setTeacherClassIds] = useState<string[]>([]);

  // Multi-Class Assignment Modal for Student
  const [assigningStudent, setAssigningStudent] = useState<Student | null>(null);
  const [studentClassIds, setStudentClassIds] = useState<string[]>([]);

  const getInitials = (name: string) => {
    if (!name) return 'ÖG';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Open Classroom Create
  const handleOpenCreateClass = () => {
    setEditingClass(null);
    setClassName('');
    setGrade('12. Sınıf');
    setBranch('Sayısal');
    setDescription('');
    setSelectedColor('#3B82F6');
    setSelectedStudentIds([]);
    setSelectedTeachers([]);
    setIsClassModalOpen(true);
  };

  // Open Classroom Edit
  const handleOpenEditClass = (cls: Classroom) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setGrade(cls.grade || '12. Sınıf');
    setBranch(cls.branch || 'Sayısal');
    setDescription(cls.description || '');
    setSelectedColor(cls.color || '#3B82F6');
    setSelectedStudentIds(cls.studentIds || []);
    setSelectedTeachers(cls.teachers || []);
    setIsClassModalOpen(true);
  };

  // Save Classroom
  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    if (editingClass) {
      updateClassroom(editingClass.id, {
        name: className.trim(),
        grade,
        branch,
        description: description.trim(),
        color: selectedColor,
        studentIds: selectedStudentIds,
        teachers: selectedTeachers,
      });
    } else {
      addClassroom({
        name: className.trim(),
        grade,
        branch,
        description: description.trim(),
        color: selectedColor,
        studentIds: selectedStudentIds,
        teachers: selectedTeachers,
      });
    }
    setIsClassModalOpen(false);
  };

  // Open Teacher Create
  const handleOpenCreateTeacher = () => {
    setEditingTeacher(null);
    setTeacherName('');
    setTeacherBranch('Matematik');
    setTeacherPhone('');
    setTeacherClassIds([]);
    setIsTeacherModalOpen(true);
  };

  // Open Teacher Edit
  const handleOpenEditTeacher = (tch: Teacher) => {
    setEditingTeacher(tch);
    setTeacherName(tch.name);
    setTeacherBranch(tch.branch || 'Matematik');
    setTeacherPhone(tch.phone || '');
    setTeacherClassIds(tch.classroomIds || []);
    setIsTeacherModalOpen(true);
  };

  // Save Teacher
  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) return;

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, {
        name: teacherName.trim(),
        branch: teacherBranch,
        phone: teacherPhone.trim(),
        classroomIds: teacherClassIds,
      });
    } else {
      addTeacher({
        name: teacherName.trim(),
        branch: teacherBranch,
        phone: teacherPhone.trim(),
        classroomIds: teacherClassIds,
      });
    }

    // Also sync teacher name with selected classrooms
    classrooms.forEach(c => {
      const willHaveTeacher = teacherClassIds.includes(c.id);
      const curTeachers = new Set(c.teachers || []);
      if (willHaveTeacher) {
        curTeachers.add(teacherName.trim());
      } else {
        curTeachers.delete(teacherName.trim());
      }
      updateClassroom(c.id, { teachers: Array.from(curTeachers) });
    });

    setIsTeacherModalOpen(false);
  };

  // Save Student Multi-Class Assignment
  const handleSaveStudentClasses = () => {
    if (!assigningStudent) return;
    assignStudentToClassrooms(assigningStudent.id, studentClassIds);
    setAssigningStudent(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-500" />
            <span>Sınıf, Şube ve Öğretmen Yönetimi</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Öğretmenleri ve sınıfları ekleyin, öğrencileri birden fazla sınıfa dahil edin.
          </p>
        </div>

        {/* Tab Buttons & Create Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-2xl bg-neutral-200/80 dark:bg-neutral-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('classrooms')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'classrooms'
                  ? 'bg-white dark:bg-[#1C1C1E] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Sınıflar & Şubeler ({classrooms.length})
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'teachers'
                  ? 'bg-white dark:bg-[#1C1C1E] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Öğretmenler & Koçlar ({teachers.length})
            </button>
          </div>

          {activeTab === 'classrooms' ? (
            <button
              onClick={handleOpenCreateClass}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/25 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Sınıf Oluştur</span>
            </button>
          ) : (
            <button
              onClick={handleOpenCreateTeacher}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Öğretmen Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW: CLASSROOMS */}
      {activeTab === 'classrooms' && (
        <div className="space-y-6">
          {classrooms.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-black/10 dark:border-white/10 bg-white dark:bg-[#1C1C1E] space-y-3">
              <FolderPlus className="w-12 h-12 text-indigo-400 mx-auto" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Henüz Sınıf Oluşturulmadı
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                Öğrencilerinizi gruplamak ve öğretmenleri sınıflara atamak için yukarıdaki "Yeni Sınıf Oluştur" butonunu kullanın.
              </p>
              <button
                onClick={handleOpenCreateClass}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/25 cursor-pointer"
              >
                + İlk Sınıfı Oluştur
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classrooms.map(cls => {
                const enrolledStudents = students.filter(
                  st => (cls.studentIds || []).includes(st.id) || (st.classroomIds || []).includes(cls.id)
                );

                return (
                  <div
                    key={cls.id}
                    className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs space-y-4 hover:border-indigo-500/30 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Tag & Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: cls.color || '#3B82F6' }}
                          />
                          <div>
                            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                              {cls.name}
                            </h3>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
                              {cls.grade} {cls.branch ? `• ${cls.branch}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditClass(cls)}
                            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-blue-500 transition-colors"
                            title="Sınıfı Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {deletingClassId === cls.id ? (
                            <div className="flex items-center gap-1 animate-in fade-in">
                              <button
                                onClick={() => {
                                  deleteClassroom(cls.id);
                                  setDeletingClassId(null);
                                }}
                                className="px-2 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                                title="Sınıfı Kalıcı Olarak Sil"
                              >
                                Sil
                              </button>
                              <button
                                onClick={() => setDeletingClassId(null)}
                                className="px-1.5 py-1 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[11px] font-semibold hover:bg-neutral-300 cursor-pointer"
                                title="İptal"
                              >
                                Vazgeç
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingClassId(cls.id)}
                              className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Sınıfı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {cls.description && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                          {cls.description}
                        </p>
                      )}

                      {/* Shareable Class Code Box */}
                      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Katılım Kodu:</span>
                          <span className="font-mono font-extrabold text-xs text-blue-600 dark:text-blue-400 tracking-wider">
                            {cls.code || 'AKD-4921'}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(cls.code || '');
                            setCopiedCode(cls.code || '');
                            setTimeout(() => setCopiedCode(null), 2000);
                          }}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:text-blue-500 shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                          title="Öğrencilerle paylaşmak için kodu kopyala"
                        >
                          {copiedCode === cls.code ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedCode === cls.code ? 'Kopyalandı' : 'Kopyala'}</span>
                        </button>
                      </div>

                      {/* Teachers Assigned */}
                      <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 text-xs space-y-1">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Atanmış Öğretmenler:</span>
                        </span>
                        {cls.teachers && cls.teachers.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {cls.teachers.map((tName, i) => (
                              <span
                                key={i}
                                className="font-semibold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded-lg border border-black/5 dark:border-white/5"
                              >
                                {tName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-neutral-400 italic">
                            Henüz öğretmen atanmadı
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enrolled Students Footer */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span>{enrolledStudents.length} Öğrenci Kayıtlı</span>
                      </div>

                      {/* Monogram Initials Stack */}
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {enrolledStudents.slice(0, 4).map(st => (
                          <div
                            key={st.id}
                            title={`${st.name} (No: ${st.studentNumber})`}
                            className="w-7 h-7 rounded-full bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold ring-2 ring-white dark:ring-[#1C1C1E]"
                          >
                            {getInitials(st.name)}
                          </div>
                        ))}
                        {enrolledStudents.length > 4 && (
                          <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white dark:ring-[#1C1C1E]">
                            +{enrolledStudents.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Student Multi-Class Assignment Table / Overview */}
          {students.length > 0 && classrooms.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                    Öğrenci Başına Çoklu Sınıf Üyelikleri
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Öğrenciler birden fazla sınıfta bulunabilir (örneğin hem 12-A hem YKS Derece Grubu).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {students.map(st => {
                  const stClasses = classrooms.filter(c =>
                    (st.classroomIds || []).includes(c.id) || (c.studentIds || []).includes(st.id)
                  );

                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        setAssigningStudent(st);
                        setStudentClassIds(st.classroomIds || []);
                      }}
                      className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-black/5 dark:border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {getInitials(st.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                            {st.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            No: {st.studentNumber} • Şifre: {st.password}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap justify-end max-w-[140px]">
                        {stClasses.length === 0 ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
                            Sınıfsız
                          </span>
                        ) : (
                          stClasses.map(c => (
                            <span
                              key={c.id}
                              className="text-[9px] font-bold px-1.5 py-0.2 rounded-md truncate max-w-[75px]"
                              style={{
                                backgroundColor: `${c.color || '#3B82F6'}20`,
                                color: c.color || '#3B82F6'
                              }}
                            >
                              {c.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: TEACHERS */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          {teachers.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-black/10 dark:border-white/10 bg-white dark:bg-[#1C1C1E] space-y-3">
              <GraduationCap className="w-12 h-12 text-blue-400 mx-auto" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Henüz Öğretmen Kaydı Yok
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                Branş öğretmenlerini ve koçları sisteme ekleyerek sorumlu oldukları sınıfları belirleyin.
              </p>
              <button
                onClick={handleOpenCreateTeacher}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 cursor-pointer"
              >
                + İlk Öğretmeni Ekle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teachers.map(tch => {
                const assignedClasses = classrooms.filter(c =>
                  (tch.classroomIds || []).includes(c.id) || (c.teachers || []).includes(tch.name)
                );

                return (
                  <div
                    key={tch.id}
                    className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
                          {getInitials(tch.name)}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                            {tch.name}
                          </h3>
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 mt-0.5">
                            {tch.branch}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditTeacher(tch)}
                          className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-blue-500 transition-colors"
                          title="Öğretmeni Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {deletingTeacherId === tch.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in">
                            <button
                              onClick={() => {
                                deleteTeacher(tch.id);
                                setDeletingTeacherId(null);
                              }}
                              className="px-2 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                              title="Öğretmeni Kalıcı Olarak Sil"
                            >
                              Sil
                            </button>
                            <button
                              onClick={() => setDeletingTeacherId(null)}
                              className="px-1.5 py-1 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[11px] font-semibold hover:bg-neutral-300 cursor-pointer"
                              title="İptal"
                            >
                              Vazgeç
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingTeacherId(tch.id)}
                            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Öğretmeni Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {tch.phone && (
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{tch.phone}</span>
                      </div>
                    )}

                    {/* Sorumlu Olduğu Sınıflar */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-neutral-400">
                        Sorumlu Olduğu Sınıflar ({assignedClasses.length})
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {assignedClasses.length === 0 ? (
                          <span className="text-[11px] text-neutral-400 italic">Sınıf atanmadı</span>
                        ) : (
                          assignedClasses.map(c => (
                            <span
                              key={c.id}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                              style={{
                                backgroundColor: `${c.color || '#3B82F6'}20`,
                                color: c.color || '#3B82F6'
                              }}
                            >
                              {c.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREATE / EDIT CLASSROOM */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
              {editingClass ? 'Sınıfı Düzenle' : 'Yeni Sınıf Oluştur'}
            </h3>

            <form onSubmit={handleSaveClass} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Sınıf / Grup Adı *
                </label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  placeholder="Örn: 12-A Sayısal, TYT Derece Grubu, LGS 8-B"
                  className="w-full p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs font-semibold text-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Sınıf Seviyesi
                  </label>
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs font-semibold text-neutral-900 dark:text-white"
                  >
                    <option value="12. Sınıf">12. Sınıf</option>
                    <option value="11. Sınıf">11. Sınıf</option>
                    <option value="10. Sınıf">10. Sınıf</option>
                    <option value="9. Sınıf">9. Sınıf</option>
                    <option value="Mezun (YKS)">Mezun (YKS)</option>
                    <option value="8. Sınıf (LGS)">8. Sınıf (LGS)</option>
                    <option value="KPSS / DGS">KPSS / DGS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Alan / Şube
                  </label>
                  <select
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs font-semibold text-neutral-900 dark:text-white"
                  >
                    <option value="Sayısal">Sayısal</option>
                    <option value="Eşit Ağırlık">Eşit Ağırlık</option>
                    <option value="Sözel">Sözel</option>
                    <option value="Yabancı Dil">Yabancı Dil</option>
                    <option value="LGS">LGS</option>
                    <option value="Genel">Genel</option>
                  </select>
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Tema Rengi
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c.hex)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        selectedColor === c.hex ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {selectedColor === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assigned Teachers for this classroom */}
              {teachers.length > 0 && (
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Bu Sınıfa Atanacak Öğretmenler
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 max-h-32 overflow-y-auto">
                    {teachers.map(tch => {
                      const isChecked = selectedTeachers.includes(tch.name);
                      return (
                        <label
                          key={tch.id}
                          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedTeachers([...selectedTeachers, tch.name]);
                              } else {
                                setSelectedTeachers(selectedTeachers.filter(t => t !== tch.name));
                              }
                            }}
                            className="rounded accent-indigo-600"
                          />
                          <span className="truncate">{tch.name} ({tch.branch})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Multi-student selection */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Sınıfa Eklenecek Öğrenciler ({selectedStudentIds.length} Seçili)
                </label>
                {students.length === 0 ? (
                  <div className="p-3 text-center text-xs text-neutral-400 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                    Henüz kayıtlı öğrenci bulunmuyor.
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1 p-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                    {students.map(st => {
                      const isSelected = selectedStudentIds.includes(st.id);
                      return (
                        <div
                          key={st.id}
                          onClick={() => {
                            setSelectedStudentIds(prev =>
                              prev.includes(st.id) ? prev.filter(id => id !== st.id) : [...prev, st.id]
                            );
                          }}
                          className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold'
                              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{st.name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">No: {st.studentNumber}</span>
                          </div>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-neutral-300 dark:border-neutral-600'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/25"
                >
                  Sınıfı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT TEACHER */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 p-6 sm:p-8 space-y-4">
            <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
              {editingTeacher ? 'Öğretmen Bilgilerini Düzenle' : 'Yeni Öğretmen Ekle'}
            </h3>

            <form onSubmit={handleSaveTeacher} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Öğretmen / Koç Adı Soyadı *
                </label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs font-semibold text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Branş
                </label>
                <select
                  value={teacherBranch}
                  onChange={e => setTeacherBranch(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs font-semibold text-neutral-900 dark:text-white"
                >
                  <option value="Matematik">Matematik</option>
                  <option value="Geometri">Geometri</option>
                  <option value="Fizik">Fizik</option>
                  <option value="Kimya">Kimya</option>
                  <option value="Biyoloji">Biyoloji</option>
                  <option value="Türkçe & Edebiyat">Türkçe & Edebiyat</option>
                  <option value="Tarih">Tarih</option>
                  <option value="Coğrafya">Coğrafya</option>
                  <option value="Felsefe">Felsefe</option>
                  <option value="Yabancı Dil">Yabancı Dil</option>
                  <option value="Rehberlik & Koçluk">Rehberlik & Koçluk</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Telefon Numarası
                </label>
                <input
                  type="text"
                  value={teacherPhone}
                  onChange={e => setTeacherPhone(e.target.value)}
                  placeholder="Örn: 0532 123 45 67"
                  className="w-full p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs text-neutral-900 dark:text-white"
                />
              </div>

              {/* Sorumlu Olduğu Sınıflar */}
              {classrooms.length > 0 && (
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Sorumlu Olduğu Sınıflar (Çoklu Seçim)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 max-h-32 overflow-y-auto">
                    {classrooms.map(c => {
                      const isChecked = teacherClassIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setTeacherClassIds([...teacherClassIds, c.id]);
                              } else {
                                setTeacherClassIds(teacherClassIds.filter(id => id !== c.id));
                              }
                            }}
                            className="rounded accent-blue-600"
                          />
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color || '#3B82F6' }} />
                          <span className="truncate">{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/25"
                >
                  Öğretmeni Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN MULTI-CLASS TO STUDENT */}
      {assigningStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 p-6 sm:p-8 space-y-4">
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                {assigningStudent.name} - Sınıf Üyelikleri
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Öğrenci birden fazla sınıfta bulunabilir.
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {classrooms.map(cls => {
                const isChecked = studentClassIds.includes(cls.id);
                return (
                  <div
                    key={cls.id}
                    onClick={() => {
                      setStudentClassIds(prev =>
                        prev.includes(cls.id) ? prev.filter(id => id !== cls.id) : [...prev, cls.id]
                      );
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isChecked
                        ? 'bg-indigo-500/10 border-indigo-500/30'
                        : 'bg-neutral-50 dark:bg-neutral-900/40 border-black/5 dark:border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cls.color || '#3B82F6' }} />
                      <div>
                        <div className="font-bold text-xs text-neutral-900 dark:text-white">{cls.name}</div>
                        <div className="text-[10px] text-neutral-400">{cls.grade} • {cls.branch}</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                      isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-neutral-300 dark:border-neutral-700'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setAssigningStudent(null)}
                className="px-4 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold text-xs"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSaveStudentClasses}
                className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
