import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Calendar,
  Sparkles,
  TrendingUp,
  Clock,
  CheckSquare,
  Users,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { getThemeStyles } from '../theme/ThemeCustomizerModal';

export const LeaderboardCard: React.FC = () => {
  const { students, activities, focusSessions, schedules, role, currentStudentId, boxTheme } = useApp();
  const themeStyles = getThemeStyles(boxTheme);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'allTime'>('daily');

  // Compute start timestamp based on timeframe
  const cutoffDate = useMemo(() => {
    const now = new Date();
    if (timeframe === 'daily') {
      // Start of today (00:00:00 local)
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      return startOfDay.getTime();
    }
    if (timeframe === 'weekly') {
      // Start of the week (Pazartesi 00:00:00)
      const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
      const diffToMonday = (currentDay === 0 ? 6 : currentDay - 1);
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0);
      return startOfWeek.getTime();
    }
    return 0; // allTime
  }, [timeframe]);

  // Compute question counts for each student in the selected timeframe
  const studentRankings = useMemo(() => {
    return students.map(st => {
      // 1. From Focus Sessions within timeframe
      const studentSessions = focusSessions.filter(f => {
        if (f.studentId !== st.id) return false;
        if (!f.completedAt) return true;
        const time = new Date(f.completedAt).getTime();
        return time >= cutoffDate;
      });

      const sessionQuestions = studentSessions.reduce((acc, sess) => {
        if (sess.solvedQuestions) {
          return acc + (sess.solvedQuestions.correct + sess.solvedQuestions.wrong + sess.solvedQuestions.blank);
        }
        return acc;
      }, 0);

      const focusMinutes = studentSessions.reduce((acc, sess) => acc + (sess.durationMinutes || 0), 0);

      // 2. From real-time Activities within timeframe
      const studentActivities = activities.filter(a => {
        if (a.studentId !== st.id || a.type !== 'question_solved') return false;
        if (!a.timestamp) return true;
        const time = new Date(a.timestamp).getTime();
        return time >= cutoffDate;
      });

      const activityQuestions = studentActivities.reduce((acc, a) => {
        const match = a.detail.match(/(\d+)\s+soru/);
        return acc + (match ? parseInt(match[1], 10) : 0);
      }, 0);

      // 3. Fallback from schedules if completed within timeframe
      const studentSchedules = schedules.filter(s => {
        if (s.studentId !== st.id || s.status !== 'completed' || !s.solvedQuestions) return false;
        if (!s.updatedAt) return timeframe === 'allTime';
        const time = new Date(s.updatedAt).getTime();
        return time >= cutoffDate;
      });

      const scheduleQuestions = studentSchedules.reduce((acc, s) => {
        if (s.solvedQuestions) {
          return acc + (s.solvedQuestions.correct + s.solvedQuestions.wrong + s.solvedQuestions.blank);
        }
        return acc;
      }, 0);

      // Take maximum or aggregated count to be resilient
      const solvedQuestionsCount = Math.max(sessionQuestions, activityQuestions, scheduleQuestions);

      return {
        student: st,
        solvedQuestionsCount,
        focusMinutes,
        streakCount: st.streak.count || 0,
      };
    }).sort((a, b) => {
      if (b.solvedQuestionsCount !== a.solvedQuestionsCount) {
        return b.solvedQuestionsCount - a.solvedQuestionsCount;
      }
      if (b.focusMinutes !== a.focusMinutes) {
        return b.focusMinutes - a.focusMinutes;
      }
      return b.streakCount - a.streakCount;
    });
  }, [students, focusSessions, activities, schedules, cutoffDate, timeframe]);

  const topStudent = studentRankings[0];

  const getInitials = (name: string) => {
    return name.split(/\s+/).map(p => p[0]).join('').substring(0, 2).toUpperCase();
  };

  if (students.length === 0) return null;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs space-y-4">
      {/* Header with Title and Timeframe Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black shadow-xs">
            <Trophy className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-1.5">
              <span>Soru Çözme Liderlik Tablosu</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                Canlı Sıralama
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              {timeframe === 'daily'
                ? 'Bugün (00:00 - Şu An) en çok soru çözen öğrenciler'
                : timeframe === 'weekly'
                ? 'Bu Hafta (Pazartesi - Pazar) en çok soru çözen öğrenciler'
                : 'Tüm zamanların soru çözüm sıralaması'}
            </p>
          </div>
        </div>

        {/* Timeframe Switcher (Günlük / Haftalık / Genel) */}
        <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setTimeframe('daily')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              timeframe === 'daily'
                ? 'bg-white dark:bg-[#2C2C2E] text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Günlük</span>
          </button>
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              timeframe === 'weekly'
                ? 'bg-white dark:bg-[#2C2C2E] text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>Haftalık</span>
          </button>
          <button
            onClick={() => setTimeframe('allTime')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              timeframe === 'allTime'
                ? 'bg-white dark:bg-[#2C2C2E] text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>Tüm Zamanlar</span>
          </button>
        </div>
      </div>

      {/* Podium Banner: 1st Place Champion Spotlight */}
      {topStudent && (
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-yellow-500/15 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/30">
                {getInitials(topStudent.student.name)}
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                👑
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-600 dark:text-amber-400">
                  {timeframe === 'daily' ? 'Günün Soru Şampiyonu' : timeframe === 'weekly' ? 'Haftanın Soru Şampiyonu' : 'Genel Lider'}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                  <Flame className="w-3 h-3 fill-amber-500" />
                  <span>{topStudent.streakCount} Gün Seri</span>
                </span>
              </div>
              <div className="font-extrabold text-base text-neutral-900 dark:text-white">
                {topStudent.student.name}
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                {topStudent.student.targetExam || 'YKS'} {topStudent.student.dailyQuestionTarget ? `• Hedef: ${topStudent.student.dailyQuestionTarget} Soru` : ''}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase font-bold text-neutral-400">
              {timeframe === 'daily' ? 'Bugün Çözülen' : timeframe === 'weekly' ? 'Bu Hafta Çözülen' : 'Toplam Çözülen'}
            </div>
            <div className="font-mono text-2xl font-black text-amber-600 dark:text-amber-400">
              {topStudent.solvedQuestionsCount} <span className="text-xs font-normal">Soru</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">
              {topStudent.focusMinutes} dk odak
            </div>
          </div>
        </div>
      )}

      {/* Top 5 Rankings List */}
      <div className="space-y-1.5">
        {studentRankings.slice(0, 5).map((item, idx) => {
          const isCurrent = item.student.id === currentStudentId;
          const medals = ['🥇', '🥈', '🥉'];

          return (
            <div
              key={item.student.id}
              style={isCurrent ? { backgroundColor: `${themeStyles.accentColor}18`, borderColor: `${themeStyles.accentColor}40` } : undefined}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isCurrent
                  ? ''
                  : 'bg-neutral-50/60 dark:bg-neutral-900/40 border-black/5 dark:border-white/5 hover:border-black/10'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-center text-sm font-black font-mono shrink-0">
                  {idx < 3 ? medals[idx] : <span className="text-neutral-400 text-xs">#{idx + 1}</span>}
                </span>

                <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-center font-bold text-xs shrink-0">
                  {getInitials(item.student.name)}
                </div>

                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate flex items-center gap-1.5">
                    <span>{item.student.name}</span>
                    {isCurrent && (
                      <span
                        style={{ backgroundColor: themeStyles.accentColor }}
                        className="text-[10px] font-bold px-1.5 py-0.2 rounded-md text-white"
                      >
                        Sen
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-medium truncate">
                    No: {item.student.studentNumber || item.student.pin.substring(0, 5)} • {item.student.targetExam}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 text-right">
                <div className="hidden xs:block text-[11px] text-neutral-400 font-mono">
                  {item.focusMinutes} Dk Odak
                </div>
                <div>
                  <div className="font-mono font-black text-sm sm:text-base text-neutral-900 dark:text-white">
                    {item.solvedQuestionsCount} <span className="text-[11px] font-normal text-neutral-400">Soru</span>
                  </div>
                  <div className="text-[10px] font-bold text-amber-500 flex items-center justify-end gap-0.5">
                    <Flame className="w-2.5 h-2.5 fill-amber-500" />
                    <span>{item.streakCount}G Seri</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
