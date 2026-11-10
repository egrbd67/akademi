import {
  CalendarDays,
  BarChart3,
  CheckSquare,
  Flame,
  Users,
  User,
  Megaphone,
  Clock,
  Sparkles,
  Zap,
  Layers,
  LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getThemeStyles } from '../theme/ThemeCustomizerModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const {
    role,
    currentStudent,
    currentTeacher,
    firebaseUser,
    logout,
    students,
    classrooms,
    activeTimer,
    expandTimer,
    boxTheme
  } = useApp();

  const themeStyles = getThemeStyles(boxTheme);

  const navItems = [
    ...(role === 'teacher'
      ? [
          {
            id: 'users',
            label: 'Öğrenci Yönetimi',
            icon: Users,
            badge: `${students.length}`,
          },
          {
            id: 'classrooms',
            label: 'Sınıflar & Öğretmenler',
            icon: Layers,
            badge: `${classrooms.length}`,
          },
        ]
      : []),
    {
      id: 'schedule',
      label: 'Haftalık Program',
      icon: CalendarDays,
      badge: undefined,
    },
    {
      id: 'focus',
      label: 'Odak Modu & Sayaç',
      icon: Zap,
      badge: 'Sayaç',
    },
    {
      id: 'analysis',
      label: 'Deneme & Analiz',
      icon: BarChart3,
      badge: undefined,
    },
    {
      id: 'homework',
      label: 'Ödev Takibi',
      icon: CheckSquare,
      badge: undefined,
    },
    {
      id: 'streak',
      label: 'Seri & Kurtarma',
      icon: Flame,
      badge: currentStudent?.streak.status === 'frozen' ? '❄️ 1G' : currentStudent?.streak.status === 'pending_recovery' ? '⚠️ Onay' : (currentStudent?.streak.count ? `${currentStudent.streak.count}G` : undefined),
    },
    {
      id: 'announcements',
      label: 'Duyuru Panosu',
      icon: Megaphone,
      badge: undefined,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-black/[0.06] dark:border-white/[0.08] min-h-[calc(100vh-3.5rem)] p-4 select-none shrink-0">
      {/* Student/Role Mini Card (NO PHOTO) */}
      {currentStudent && (
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white dark:bg-neutral-800 flex items-center justify-center font-bold text-xs tracking-wider shrink-0">
              {currentStudent.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                {currentStudent.name}
              </div>
              <div
                style={{ color: themeStyles.accentColor }}
                className="text-xs font-semibold truncate"
              >
                {currentStudent.targetExam}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
            <span>Öğrenci Kodu:</span>
            <span className="font-mono font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-800 dark:text-neutral-200">
              {currentStudent.pin}
            </span>
          </div>
        </div>
      )}

      {/* Active Timer Quick Widget in Sidebar if running */}
      {activeTimer && (
        <div
          onClick={expandTimer}
          className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-blue-500/10 to-transparent border border-emerald-500/30 cursor-pointer hover:border-emerald-500/50 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Çalışma Devam Ediyor</span>
            </div>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 truncate">
            {activeTimer.subject} • {activeTimer.topic}
          </div>
          <div className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 mt-1">
            {Math.floor(activeTimer.elapsedSeconds / 60)}:
            {(activeTimer.elapsedSeconds % 60).toString().padStart(2, '0')}
            <span className="text-[10px] font-normal ml-1 text-neutral-400">(Tıkla & Odaklan)</span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="space-y-1.5 flex-1">
        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Menü
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={isActive ? themeStyles.activeNav : undefined}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all text-left ${
                isActive
                  ? 'font-bold'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Account & Logout in Sidebar */}
      <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2 mb-2">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/60">
          <div className="min-w-0">
            <div className="font-bold text-xs text-neutral-900 dark:text-white truncate">
              {role === 'teacher'
                ? currentTeacher?.name || 'Rehberlik & Koç'
                : currentStudent?.name || 'Öğrenci'}
            </div>
            <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
              {role === 'teacher'
                ? firebaseUser?.email || 'Öğretmen Hesabı'
                : `No: ${currentStudent?.studentNumber || currentStudent?.pin.substring(0, 5) || '-'}`}
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Çıkış Yap"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* App Info Footer in Sidebar */}
      <div className="pt-2 text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Akademi Takip</span>
        </div>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-1.5 py-0.5 rounded">
          Firebase Canlı
        </span>
      </div>
    </aside>
  );
};
