import React, { useState } from 'react';
import {
  X,
  Plus,
  Users,
  Edit2,
  Trash2,
  Check,
  CheckCircle2,
  FolderPlus,
  Layers,
  GraduationCap,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Classroom, Student } from '../../types';

interface ClassroomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent?: (studentId: string) => void;
}

const PRESET_COLORS = [
  { name: 'Mavi', hex: '#3B82F6', bgClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  { name: 'İndigo', hex: '#6366F1', bgClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' },
  { name: 'Zümrüt Yeşili', hex: '#10B981', bgClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  { name: 'Amber', hex: '#F59E0B', bgClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  { name: 'Gül Pembesi', hex: '#F43F5E', bgClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' },
  { name: 'Mor', hex: '#A855F7', bgClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' },
];

export const ClassroomsModal: React.FC<ClassroomsModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent,
}) => {
  const {
    classrooms,
    addClassroom,
    updateClassroom,
    deleteClassroom,
    students,
    assignStudentToClassrooms
  } = useApp();

  // Active view: 'list' | 'create' | 'edit' | 'manage_students'
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit' | 'manage_students'>('list');
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [studentForClassAssignment, setStudentForClassAssignment] = useState<Student | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  // Form State
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('12. Sınıf');
  const [branch, setBranch] = useState('Sayısal');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Student Multi-Class Selection state
  const [studentSelectedClassIds, setStudentSelectedClassIds] = useState<string[]>([]);

  if (!isOpen) return null;

  // Helper to open edit
  const openEdit = (cls: Classroom) => {
    setSelectedClassroom(cls);
    setClassName(cls.name);
    setGrade(cls.grade || '12. Sınıf');
    setBranch(cls.branch || 'Sayısal');
    setDescription(cls.description || '');
    setSelectedColor(cls.color || '#3B82F6');
    setSelectedStudentIds(cls.studentIds || []);
    setActiveView('edit');
  };

  // Helper to open create
  const openCreate = () => {
    setSelectedClassroom(null);
    setClassName('');
    setGrade('12. Sınıf');
    setBranch('Sayısal');
    setDescription('');
    setSelectedColor('#3B82F6');
    setSelectedStudentIds([]);
    setActiveView('create');
  };

  // Helper to open student multi-class assignment
  const openStudentClassAssignment = (student: Student) => {
    setStudentForClassAssignment(student);
    setStudentSelectedClassIds(student.classroomIds || []);
    setActiveView('manage_students');
  };

  // Handle Save Classroom (Create or Update)
  const handleSaveClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    if (activeView === 'create') {
      addClassroom({
        name: className.trim(),
        grade,
        branch,
        description: description.trim(),
        color: selectedColor,
        studentIds: selectedStudentIds,
      });
    } else if (activeView === 'edit' && selectedClassroom) {
      updateClassroom(selectedClassroom.id, {
        name: className.trim(),
        grade,
        branch,
        description: description.trim(),
        color: selectedColor,
        studentIds: selectedStudentIds,
      });
    }

    setActiveView('list');
  };

  // Handle student multi-class toggle
  const toggleClassForStudent = (classId: string) => {
    setStudentSelectedClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  // Save student multi-class assignment
  const handleSaveStudentClasses = () => {
    if (!studentForClassAssignment) return;
    assignStudentToClassrooms(studentForClassAssignment.id, studentSelectedClassIds);
    setStudentForClassAssignment(null);
    setActiveView('list');
  };

  // Toggle student selection for current classroom form
  const toggleStudentSelection = (stId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(stId) ? prev.filter(id => id !== stId) : [...prev, stId]
    );
  };

  const getInitials = (name: string) => {
    if (!name) return 'ÖG';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                Sınıf ve Grup Yönetimi
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Öğretmenler sınıf oluşturabilir ve öğrenciler birden fazla sınıfta yer alabilir.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* VIEW: CLASSROOM LIST */}
          {activeView === 'list' && (
            <div className="space-y-6">
              {/* Top Controls */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                  Toplam {classrooms.length} Sınıf / Grup Tanımlı
                </div>
                <button
                  onClick={openCreate}
                  className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Sınıf Oluştur</span>
                </button>
              </div>

              {/* Classrooms Cards */}
              {classrooms.length === 0 ? (
                <div className="p-8 text-center rounded-3xl border border-dashed border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900/40">
                  <FolderPlus className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white mb-1">
                    Henüz Kayıtlı Sınıf Yok
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-4">
                    Öğrencileri toplu gruplamak, haftalık programları sınıf bazında organize etmek ve ödev atamak için ilk sınıfınızı oluşturun.
                  </p>
                  <button
                    onClick={openCreate}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                  >
                    + İlk Sınıfı Oluştur
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {classrooms.map(cls => {
                    const enrolledStudents = students.filter(
                      st => (cls.studentIds || []).includes(st.id) || (st.classroomIds || []).includes(cls.id)
                    );

                    return (
                      <div
                        key={cls.id}
                        className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-black/5 dark:border-white/5 space-y-3 relative hover:border-indigo-500/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0"
                              style={{ backgroundColor: cls.color || '#3B82F6' }}
                            />
                            <div>
                              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                                {cls.name}
                              </h4>
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                                {cls.grade} {cls.branch ? `• ${cls.branch}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(cls)}
                              className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-blue-500 transition-colors"
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
                                  className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                                  title="Sınıfı Kalıcı Olarak Sil"
                                >
                                  Sil
                                </button>
                                <button
                                  onClick={() => setDeletingClassId(null)}
                                  className="px-1.5 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-semibold hover:bg-neutral-300 cursor-pointer"
                                  title="İptal"
                                >
                                  Vazgeç
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingClassId(cls.id)}
                                className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
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

                        <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-neutral-200/60 dark:bg-neutral-800 text-[11px] font-mono">
                          <span className="text-[10px] text-neutral-400 font-sans font-bold">Katılım Kodu:</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400 tracking-wider">{cls.code || 'AKD-4921'}</span>
                        </div>

                        {/* Enrolled Students preview */}
                        <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{enrolledStudents.length} Kayıtlı Öğrenci</span>
                          </div>

                          {/* Student Initials Stack */}
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {enrolledStudents.slice(0, 4).map(st => (
                              <div
                                key={st.id}
                                title={st.name}
                                className="inline-block w-6 h-6 rounded-full ring-2 ring-white dark:ring-[#1C1C1E] bg-neutral-800 text-white text-[9px] font-bold flex items-center justify-center"
                              >
                                {getInitials(st.name)}
                              </div>
                            ))}
                            {enrolledStudents.length > 4 && (
                              <div className="w-6 h-6 rounded-full bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#1C1C1E]">
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

              {/* Student Multi-Class Management Section */}
              {students.length > 0 && classrooms.length > 0 && (
                <div className="pt-4 border-t border-black/5 dark:border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                    Öğrenci Başına Çoklu Sınıf Atama
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {students.map(st => {
                      const stClasses = classrooms.filter(c =>
                        (st.classroomIds || []).includes(c.id) || (c.studentIds || []).includes(st.id)
                      );

                      return (
                        <div
                          key={st.id}
                          onClick={() => openStudentClassAssignment(st)}
                          className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-black/5 dark:border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-center text-xs font-bold">
                              {getInitials(st.name)}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-neutral-900 dark:text-white">
                                {st.name}
                              </div>
                              <div className="text-[10px] text-neutral-400 font-mono">
                                PIN: {st.pin}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-wrap justify-end max-w-[160px]">
                            {stClasses.length === 0 ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
                                Sınıfsız
                              </span>
                            ) : (
                              stClasses.map(c => (
                                <span
                                  key={c.id}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-[80px]"
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

          {/* VIEW: CREATE OR EDIT CLASSROOM */}
          {(activeView === 'create' || activeView === 'edit') && (
            <form onSubmit={handleSaveClassroom} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  {activeView === 'create' ? 'Yeni Sınıf Oluştur' : 'Sınıfı Düzenle'}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  İptal
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Sınıf / Grup Adı *
                </label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  placeholder="Örn: 12-A Sayısal, TYT Derece Grubu, LGS 8-B"
                  className="w-full p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
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
                    <option value="Özel Etüt Grubu">Özel Etüt Grubu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
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
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Grup Rengi
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

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Açıklama (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Örn: Haftada 400 soru hedefli ilk 10.000 hazırlık grubu"
                  className="w-full p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-xs text-neutral-900 dark:text-white"
                />
              </div>

              {/* Multi-student selection for this class */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Sınıfa Eklenecek Öğrenciler ({selectedStudentIds.length} Seçili)
                  </label>
                  <span className="text-[10px] text-neutral-400">
                    (Bir öğrenci birden fazla sınıfta bulunabilir)
                  </span>
                </div>

                {students.length === 0 ? (
                  <div className="p-3 text-center text-xs text-neutral-400 bg-neutral-50 dark:bg-neutral-900/30 rounded-2xl">
                    Henüz kayıtlı öğrenci yok. Sınıfı oluşturduktan sonra öğrenci ekleyebilirsiniz.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-black/5 dark:border-white/5">
                    {students.map(st => {
                      const isSelected = selectedStudentIds.includes(st.id);
                      return (
                        <div
                          key={st.id}
                          onClick={() => toggleStudentSelection(st.id)}
                          className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                              : 'hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold">
                              {getInitials(st.name)}
                            </div>
                            <span className="text-xs font-bold">{st.name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">PIN: {st.pin}</span>
                          </div>

                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-neutral-300 dark:border-neutral-700'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="px-4 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 font-bold text-xs"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 active:scale-95"
                >
                  {activeView === 'create' ? 'Sınıfı Kaydet' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: MANAGE MULTI-CLASS FOR A SPECIFIC STUDENT */}
          {activeView === 'manage_students' && studentForClassAssignment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    {studentForClassAssignment.name} - Sınıf Üyelikleri
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Öğrenci birden fazla sınıfta aynı anda bulunabilir.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  İptal
                </button>
              </div>

              <div className="space-y-2">
                {classrooms.map(cls => {
                  const isChecked = studentSelectedClassIds.includes(cls.id);
                  return (
                    <div
                      key={cls.id}
                      onClick={() => toggleClassForStudent(cls.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-indigo-500/10 border-indigo-500/30'
                          : 'bg-neutral-50 dark:bg-neutral-900/40 border-black/5 dark:border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: cls.color || '#3B82F6' }}
                        />
                        <div>
                          <div className="font-bold text-xs text-neutral-900 dark:text-white">
                            {cls.name}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {cls.grade} • {cls.branch}
                          </div>
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
                  onClick={() => setActiveView('list')}
                  className="px-4 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSaveStudentClasses}
                  className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 active:scale-95"
                >
                  Sınıf Üyeliklerini Kaydet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
