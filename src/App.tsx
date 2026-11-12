import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { TabBar } from './components/layout/TabBar';
import { DynamicIslandTimer } from './components/timer/DynamicIslandTimer';
import { FocusTimerModal } from './components/timer/FocusTimerModal';
import { QuestionEntrySheet } from './components/timer/QuestionEntrySheet';
import { LoginModal } from './components/auth/LoginModal';

// Views
import { ScheduleView } from './components/schedule/ScheduleView';
import { TrialAnalysisView } from './components/analysis/TrialAnalysisView';
import { HomeworkView } from './components/homework/HomeworkView';
import { StreakView } from './components/streak/StreakView';
import { UserManagementPanel } from './components/users/UserManagementPanel';
import { StudentsManagerView } from './components/students/StudentsManagerView';
import { TeacherStudyTrackerView } from './components/students/TeacherStudyTrackerView';
import { StudentProfileView } from './components/profile/StudentProfileView';
import { AnnouncementsView } from './components/announcements/AnnouncementsView';
import { FocusModeView } from './components/focus/FocusModeView';
import { IntroModal } from './components/intro/IntroModal';
import { ClassroomsModal } from './components/classrooms/ClassroomsModal';
import { ClassroomsView } from './components/classrooms/ClassroomsView';
import { AuthScreen } from './components/auth/AuthScreen';
import { AccountSwitchModal } from './components/layout/AccountSwitchModal';
import { ThemeCustomizerModal, BOX_THEMES } from './components/theme/ThemeCustomizerModal';

function MainApp() {
  const { role, hasCompletedIntro, isLoggedIn, isAuthReady, bgTheme, boxTheme } = useApp();
  const [activeTab, setActiveTab] = useState<string>('schedule');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState<boolean>(false);
  const [isClassroomsModalOpen, setIsClassroomsModalOpen] = useState<boolean>(false);
  const [isAccountSwitchOpen, setIsAccountSwitchOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);

  // Sync Box Theme accent variables across the entire document
  React.useEffect(() => {
    const selected = BOX_THEMES.find(b => b.id === boxTheme) || BOX_THEMES[0];
    if (selected) {
      document.documentElement.style.setProperty('--box-accent', selected.accentColor);
      document.documentElement.style.setProperty('--box-accent-bg', `${selected.accentColor}18`);
      document.documentElement.style.setProperty('--box-accent-border', `${selected.accentColor}40`);
      document.documentElement.style.setProperty('--theme-accent', selected.accentColor);
      document.documentElement.style.setProperty('--theme-accent-soft', `${selected.accentColor}18`);
      document.documentElement.style.setProperty('--theme-accent-border', `${selected.accentColor}40`);
      document.documentElement.style.setProperty('--theme-accent-shadow', `${selected.accentColor}35`);
    }
  }, [boxTheme]);

  // Compute background class from user theme selection
  const bgClass = React.useMemo(() => {
    switch (bgTheme) {
      case 'pure_white':
        return 'bg-white text-neutral-900';
      case 'deep_black':
        return 'bg-[#000000] text-white';
      case 'graphite':
        return 'bg-[#18181B] text-neutral-100';
      case 'slate':
        return 'bg-[#0F172A] text-slate-100';
      case 'cream':
        return 'bg-[#FAF8F5] text-neutral-900';
      case 'navy':
        return 'bg-[#0B132B] text-blue-100';
      case 'default':
      default:
        return 'bg-[#F2F2F7] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100';
    }
  }, [bgTheme]);

  // Student role isolation: redirect away from coach-only user & classrooms panel
  React.useEffect(() => {
    if (role === 'student' && (activeTab === 'users' || activeTab === 'students' || activeTab === 'classrooms' || activeTab === 'study_tracker')) {
      setActiveTab('schedule');
    }
  }, [role, activeTab]);

  if (!isAuthReady) {
    return (
      <div className={`min-h-screen ${bgClass} flex flex-col items-center justify-center p-4`}>
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-500/25 animate-pulse">
          A
        </div>
        <p className="mt-4 text-xs font-bold text-neutral-500 dark:text-neutral-400">
          Akademi Takip Portali Yükleniyor...
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AuthScreen />;
  }

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col transition-colors duration-200`}>
      {/* Dynamic Island Floating Header Timer (When running/minimized) */}
      <DynamicIslandTimer />

      {/* Focus Timer Modal (Fullscreen Pomodoro / Stopwatch) */}
      <FocusTimerModal />

      {/* Automatic Question Entry Sheet (Triggered after stopping timer) */}
      <QuestionEntrySheet />

      {/* Login / Student PIN Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Intro / Karşılama Ekranı (İlk Açılışta veya İsteğe Bağlı) */}
      <IntroModal
        isOpen={!hasCompletedIntro || isIntroModalOpen}
        onClose={() => setIsIntroModalOpen(false)}
      />

      {/* Classrooms Manager Modal */}
      <ClassroomsModal
        isOpen={isClassroomsModalOpen}
        onClose={() => setIsClassroomsModalOpen(false)}
      />

      {/* Theme Customizer Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Account Switch Modal (Root Level so fixed inset-0 is centered on window, never clipped) */}
      <AccountSwitchModal
        isOpen={isAccountSwitchOpen}
        onClose={() => setIsAccountSwitchOpen(false)}
        onOpenClassroomsModal={() => setIsClassroomsModalOpen(true)}
        onNavigateTab={tab => setActiveTab(tab)}
      />

      {/* Top Header */}
      <Header
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenAccountSwitch={() => setIsAccountSwitchOpen(true)}
        onOpenThemeCustomizer={() => setIsThemeModalOpen(true)}
        onNavigateTab={tab => setActiveTab(tab)}
        onOpenIntro={() => setIsIntroModalOpen(true)}
        onOpenClassroomsModal={() => setIsClassroomsModalOpen(true)}
      />

      {/* App Body: Sidebar + Main Scrollable Canvas */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-8">
        {/* Desktop Sidebar (Apple Style) */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Main Content Canvas */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'users' && (
            <UserManagementPanel onNavigateTab={tab => setActiveTab(tab)} />
          )}
          {activeTab === 'study_tracker' && <TeacherStudyTrackerView />}
          {activeTab === 'classrooms' && <ClassroomsView />}
          {activeTab === 'schedule' && <ScheduleView onNavigateTab={tab => setActiveTab(tab)} />}
          {activeTab === 'focus' && <FocusModeView />}
          {activeTab === 'analysis' && <TrialAnalysisView />}
          {activeTab === 'homework' && <HomeworkView />}
          {activeTab === 'streak' && <StreakView />}
          {activeTab === 'students' && (
            <UserManagementPanel onNavigateTab={tab => setActiveTab(tab)} />
          )}
          {activeTab === 'profile' && (
            <StudentProfileView onOpenLogin={() => setIsLoginModalOpen(true)} />
          )}
          {activeTab === 'announcements' && <AnnouncementsView />}
        </main>
      </div>

      {/* Mobil Alt Menü (Fixed Bottom) */}
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
