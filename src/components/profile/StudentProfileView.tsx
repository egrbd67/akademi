import React from 'react';
import {
  User,
  Key,
  Flame,
  Snowflake,
  AlertTriangle,
  Target,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  Sparkles,
  Phone
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LeaderboardCard } from '../leaderboard/LeaderboardCard';

export const StudentProfileView: React.FC<{ onOpenLogin: () => void }> = ({ onOpenLogin }) => {
  const { currentStudent, schedules, homeworks, trialExams, targetDaysLeft } = useApp();

  if (!currentStudent) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 text-center max-w-md mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3 font-bold">
          <User className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">
          Seçili Öğrenci Bulunamadı
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">
          Profil görüntülemek için öğrenci kodunuz (PIN) ile giriş yapın veya Kullanıcı Paneli'nden bir öğrenci seçin.
        </p>
        <button
          onClick={onOpenLogin}
          className="px-5 py-2.5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-blue-500/25"
        >
          <Key className="w-4 h-4" />
          <span>Giriş Yap / PIN Gir</span>
        </button>
      </div>
    );
  }

  // Calculate student statistics
  const studentSchedules = schedules.filter(s => s.studentId === currentStudent.id);
  const totalQuestions = studentSchedules.reduce((acc, curr) => {
    if (curr.solvedQuestions) {
      return acc + curr.solvedQuestions.correct + curr.solvedQuestions.wrong + curr.solvedQuestions.blank;
    }
    return acc;
  }, 0);

  const totalMinutes = studentSchedules.reduce((acc, curr) => acc + (curr.actualDurationMinutes || 0), 0);
  const studentExams = trialExams.filter(e => e.studentId === currentStudent.id);
  const studentHws = homeworks.filter(h => h.studentId === currentStudent.id);

  const initials = currentStudent.name.split(/\s+/).map(p => p[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Monogram Badge (NO PHOTO) */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-neutral-800 to-neutral-950 text-white dark:from-neutral-700 dark:to-neutral-900 flex items-center justify-center font-bold text-2xl tracking-wider ring-4 ring-blue-500/20 shadow-md shrink-0">
            {initials}
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                  {currentStudent.name}
                </h1>
                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                  {currentStudent.targetExam}
                </div>
              </div>

              {/* 5-Digit Number & 4-Digit Password badges */}
              <div className="flex items-center gap-2 self-center sm:self-auto">
                <div className="px-3 py-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-left">
                  <div className="text-[10px] text-neutral-400 uppercase font-bold">Öğrenci No</div>
                  <div className="font-mono font-extrabold text-sm tracking-wider text-neutral-900 dark:text-white">
                    {currentStudent.studentNumber || currentStudent.pin.substring(0, 5)}
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-left">
                  <div className="text-[10px] text-neutral-400 uppercase font-bold">Şifre</div>
                  <div className="font-mono font-extrabold text-sm tracking-wider text-neutral-900 dark:text-white">
                    {currentStudent.password || currentStudent.pin.substring(currentStudent.pin.length - 4)}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed">
              {currentStudent.notes}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-neutral-700 dark:text-neutral-300">
                <Target className="w-3.5 h-3.5 text-rose-500" />
                <span>Günlük Hedef: {currentStudent.dailyQuestionTarget ? `${currentStudent.dailyQuestionTarget} Soru` : '100 Soru'}</span>
              </span>
              <span className="text-neutral-300">•</span>
              <span className="flex items-center gap-1.5 text-neutral-500">
                <Phone className="w-3.5 h-3.5" />
                <span>{currentStudent.phone}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <div className="text-xs font-semibold text-neutral-400 mb-1">Soru Çözme Serisi</div>
          <div className="text-2xl font-extrabold text-amber-500 font-mono flex items-center gap-1.5">
            <Flame className="w-5 h-5 fill-amber-500" />
            <span>{currentStudent.streak.count} Gün</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 capitalize">
            Durum: {currentStudent.streak.status}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <div className="text-xs font-semibold text-neutral-400 mb-1">Sınava Kalan Süre</div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
            {targetDaysLeft} <span className="text-xs font-normal text-neutral-400">Gün</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Geri Sayım Sayacı
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <div className="text-xs font-semibold text-neutral-400 mb-1">Programda Çözülen</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {totalQuestions} <span className="text-xs font-normal text-neutral-400">Soru</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Sayaçla Doğrulanmış
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <div className="text-xs font-semibold text-neutral-400 mb-1">Çalışılan Süre</div>
          <div className="text-2xl font-extrabold text-indigo-500 font-mono">
            {Math.floor(totalMinutes / 60)}s {totalMinutes % 60}d
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Entegre Sayaç Süresi
          </div>
        </div>
      </div>

      {/* Canlı Liderlik Tablosu (Günlük / Haftalık Soru Şampiyonları) */}
      <LeaderboardCard />

      {/* Switch PIN or Logout Button */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs flex items-center justify-between">
        <div>
          <div className="font-bold text-sm text-neutral-900 dark:text-white">
            Farklı Bir Öğrenci Kodu (PIN) ile Giriş Yap
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Kendi 6 haneli öğrenci kodunuzu girerek kendi programınıza geçin.
          </div>
        </div>
        <button
          onClick={onOpenLogin}
          className="px-4 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
        >
          PIN Değiştir / Çıkış
        </button>
      </div>
    </div>
  );
};
