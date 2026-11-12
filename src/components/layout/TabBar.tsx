import {
  CalendarDays,
  BarChart3,
  CheckSquare,
  Flame,
  Users,
  Megaphone,
  Zap,
  Layers,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getThemeStyles } from '../theme/ThemeCustomizerModal';

interface TabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, setActiveTab }) => {
  const { role, currentStudent, boxTheme } = useApp();
  const themeStyles = getThemeStyles(boxTheme);

  const tabs = [
    ...(role === 'teacher'
      ? [
          {
            id: 'users',
            label: 'Öğrenciler',
            icon: Users,
          },
          {
            id: 'study_tracker',
            label: 'Takip',
            icon: Clock,
          },
          {
            id: 'classrooms',
            label: 'Sınıflar',
            icon: Layers,
          },
        ]
      : []),
    {
      id: 'schedule',
      label: 'Program',
      icon: CalendarDays,
    },
    {
      id: 'focus',
      label: 'Odak Modu',
      icon: Zap,
    },
    {
      id: 'analysis',
      label: 'Analiz',
      icon: BarChart3,
    },
    {
      id: 'homework',
      label: 'Ödevler',
      icon: CheckSquare,
    },
    {
      id: 'streak',
      label: 'Seri',
      icon: Flame,
      badge: currentStudent?.streak.status === 'frozen' ? '❄️' : currentStudent?.streak.status === 'pending_recovery' ? '⚠️' : undefined,
    },
    {
      id: 'announcements',
      label: 'Duyuru',
      icon: Megaphone,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-card border-t border-black/10 dark:border-white/10 pb-[env(safe-area-inset-bottom)] select-none">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-1 relative transition-all active:scale-95"
            >
              <div className="relative">
                <Icon
                  style={isActive ? themeStyles.activeText : undefined}
                  className={`w-5 h-5 transition-transform ${
                    isActive
                      ? 'scale-110'
                      : 'text-neutral-400 dark:text-neutral-500'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 text-[10px]">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                style={isActive ? themeStyles.activeText : undefined}
                className={`text-[10px] mt-1 transition-colors ${
                  isActive
                    ? 'font-bold'
                    : 'font-medium text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <div
                  style={themeStyles.activeDot}
                  className="w-1.5 h-1.5 rounded-full mt-0.5"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
