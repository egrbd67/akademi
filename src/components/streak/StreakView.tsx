import React, { useState, useMemo } from 'react';
import {
  Flame,
  CheckCircle2,
  Grid,
  List,
  BookOpen,
  Plus,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StreakView: React.FC = () => {
  const {
    role,
    currentStudent,
    students,
    activities,
    addTeacherDailyStreak,
    updateStudentStreakCount
  } = useApp();

  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [activityViewMode, setActivityViewMode] = useState<'cards' | 'list'>('cards');
  const [activityStudentFilter, setActivityStudentFilter] = useState<string>('all');

  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingCount, setEditingCount] = useState<number>(0);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleAddDailyStreak = async (studentId: string, studentName: string) => {
    try {
      const added = await addTeacherDailyStreak(studentId);
      if (added) {
        setActionNotice(`${studentName}: +1 seri eklendi.`);
      } else {
        setActionNotice(`${studentName} için bugün zaten seri eklenmiş.`);
      }
      setTimeout(() => setActionNotice(null), 3000);
    } catch {
      setActionNotice('İşlem başarısız.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleSaveStreakCount = async (studentId: string, studentName: string) => {
    try {
      const cleanCount = Math.max(0, Math.floor(Number(editingCount) || 0));
      await updateStudentStreakCount(studentId, cleanCount);
      setEditingStudentId(null);
      setActionNotice(`${studentName} serisi ${cleanCount} gün olarak güncellendi.`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch {
      setActionNotice('Güncelleme başarısız.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const dailyActivities = useMemo(() => {
    if (role === 'student') {
      if (!currentStudent?.id) return [];
      return activities.filter(a => a.studentId === currentStudent.id);
    }
    const ownStudentIds = new Set(students.map(s => s.id));
    const teacherActivities = activities.filter(a => ownStudentIds.has(a.studentId));
    if (activityStudentFilter !== 'all') {
      return teacherActivities.filter(a => a.studentId === activityStudentFilter);
    }
    return teacherActivities;
  }, [activities, activityStudentFilter, role, currentStudent?.id, students]);

  const teacherStats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.streak.status === 'active' && s.streak.count > 0).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [students]);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {actionNotice && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* ÜST ÖZET */}
      {role === 'teacher' ? (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
              Seri Yönetimi
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Günde en fazla 1 seri eklenebilir. Seri gün sayısını doğrudan düzenleyebilirsiniz.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Aktif: {teacherStats.active}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold">
              Serisi Yok: {teacherStats.inactive}
            </div>
          </div>
        </div>
      ) : currentStudent ? (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              currentStudent.streak.count > 0
                ? 'bg-amber-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
            }`}>
              <Flame className="w-7 h-7 fill-current" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white font-mono">
                {currentStudent.streak.count} Gün
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                {currentStudent.streak.lastActiveDate === todayStr && currentStudent.streak.count > 0
                  ? 'Bugünkü seri tamamlandı'
                  : '5 dk odaklanma = +1 gün seri (Günde 1 kez)'}
              </div>
            </div>
          </div>

          <div className="text-xs text-neutral-500 font-mono">
            Son Aktif: <strong className="text-neutral-900 dark:text-white">{currentStudent.streak.lastActiveDate || '-'}</strong>
          </div>
        </div>
      ) : null}

      {/* ÖĞRENCİ SERİ LİSTESİ (ÖĞRETMEN) */}
      {role === 'teacher' && (
        <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 overflow-hidden">
          <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Öğrenci Serileri ({students.length})
            </h3>
          </div>

          {students.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              Öğrenci bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 border-b border-black/5 dark:border-white/5 font-semibold">
                    <th className="p-3 pl-4">Öğrenci</th>
                    <th className="p-3">No</th>
                    <th className="p-3">Seri Günü</th>
                    <th className="p-3">Son Aktif</th>
                    <th className="p-3 pr-4 text-right">Günlük Seri</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {students.map(st => {
                    const stCount = st.streak?.count || 0;
                    const stLastActive = st.streak?.lastActiveDate || '-';
                    const stdNo = st.studentNumber || st.pin.substring(0, 5);
                    const isAddedToday = st.streak?.lastActiveDate === todayStr && stCount > 0;
                    const isEditing = editingStudentId === st.id;

                    return (
                      <tr key={st.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-neutral-800 dark:bg-neutral-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                              {st.name.split(/\s+/).map(p => p[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-neutral-900 dark:text-white">{st.name}</span>
                          </div>
                        </td>

                        <td className="p-3 font-mono text-neutral-500">
                          {stdNo}
                        </td>

                        <td className="p-3">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={9999}
                                value={editingCount}
                                onChange={e => setEditingCount(Math.max(0, Number(e.target.value)))}
                                className="w-16 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-black/10 dark:border-white/15 font-mono font-bold text-center text-neutral-900 dark:text-white"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveStreakCount(st.id, st.name)}
                                className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
                                title="Kaydet"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingStudentId(null)}
                                className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                                title="İptal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 font-mono font-bold ${
                                stCount > 0 ? 'text-amber-500' : 'text-neutral-400'
                              }`}>
                                <Flame className={`w-3.5 h-3.5 ${stCount > 0 ? 'fill-amber-500' : ''}`} />
                                <span>{stCount} Gün</span>
                              </span>
                              <button
                                onClick={() => {
                                  setEditingStudentId(st.id);
                                  setEditingCount(stCount);
                                }}
                                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                title="Seri gününü düzenle"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="p-3 text-neutral-500 font-mono">
                          {stLastActive}
                        </td>

                        <td className="p-3 pr-4 text-right">
                          {isAddedToday ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 font-semibold text-[11px]">
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>Bugün Eklendi</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddDailyStreak(st.id, st.name)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+1 Seri</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GÜNLÜK AKTİVİTELER */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Günlük Aktiviteler
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {role === 'teacher' && students.length > 0 && (
              <select
                value={activityStudentFilter}
                onChange={e => setActivityStudentFilter(e.target.value)}
                className="p-1.5 px-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold border border-black/5 dark:border-white/5"
              >
                <option value="all">Tüm Öğrenciler</option>
                {students.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            )}

            <div className="flex p-0.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5">
              <button
                onClick={() => setActivityViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer ${
                  activityViewMode === 'cards'
                    ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Kart</span>
              </button>
              <button
                onClick={() => setActivityViewMode('list')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer ${
                  activityViewMode === 'list'
                    ? 'bg-white dark:bg-[#2C2C2E] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Liste</span>
              </button>
            </div>
          </div>
        </div>

        {dailyActivities.length === 0 ? (
          <div className="py-10 text-center text-xs text-neutral-400">
            Henüz aktivite kaydı yok.
          </div>
        ) : activityViewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dailyActivities.map(act => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-black/5 dark:border-white/5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {act.studentName}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {new Date(act.timestamp).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
                <div className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">
                  {act.title}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {act.detail}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 border-b border-black/5 dark:border-white/5 font-semibold">
                  <th className="p-2.5 pl-3">Saat</th>
                  <th className="p-2.5">Öğrenci</th>
                  <th className="p-2.5">Başlık</th>
                  <th className="p-2.5 pr-3">Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {dailyActivities.map(act => (
                  <tr key={act.id}>
                    <td className="p-2.5 pl-3 text-neutral-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(act.timestamp).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="p-2.5 font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                      {act.studentName}
                    </td>
                    <td className="p-2.5 font-semibold text-neutral-800 dark:text-neutral-200">
                      {act.title}
                    </td>
                    <td className="p-2.5 pr-3 text-neutral-500 dark:text-neutral-400">
                      {act.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
