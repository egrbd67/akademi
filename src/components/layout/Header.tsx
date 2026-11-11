import React, { useState } from 'react';
import {
  Flame,
  Snowflake,
  AlertTriangle,
  Bell,
  Users,
  UserCheck,
  RotateCcw,
  Sparkles,
  Calendar,
  X,
  CheckCircle2,
  Sliders,
  LogOut,
  Palette,
  Plus,
  Trash2,
  Clock,
  Target
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AccountSwitchModal } from './AccountSwitchModal';
import { ThemeCustomizerModal, getThemeStyles } from '../theme/ThemeCustomizerModal';

interface HeaderProps {
  onOpenLoginModal: () => void;
  onOpenAccountSwitch?: () => void;
  onOpenThemeCustomizer?: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenIntro?: () => void;
  onOpenClassroomsModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLoginModal,
  onOpenAccountSwitch,
  onOpenThemeCustomizer,
  onNavigateTab,
  onOpenClassroomsModal,
}) => {
  const {
    role,
    setRole,
    currentStudent,
    currentTeacher,
    firebaseUser,
    logout,
    students,
    setCurrentStudentId,
    isDarkMode,
    toggleDarkMode,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    simulateDayPass,
    resetAllData,
    targetDaysLeft,
    boxTheme,
    assignedExams,
    upcomingExam,
    addAssignedExam,
    deleteAssignedExam,
    activeTimer,
    showTimerPopup
  } = useApp();

  const themeStyles = getThemeStyles(boxTheme);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAccountSwitchOpen, setIsAccountSwitchOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);

  // New exam assignment form state
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examType, setExamType] = useState<'TYT' | 'AYT' | 'LGS' | 'MSÜ' | 'Genel'>('TYT');
  const [examNotes, setExamNotes] = useState('');
  const [examSuccessMsg, setExamSuccessMsg] = useState<string | null>(null);

  const unreadNotifs = notifications.filter(n => !n.read);

  const handleCreateAssignedExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examDate) return;

    try {
      await addAssignedExam({
        title: examTitle.trim(),
        examDate: examDate,
        examType: examType,
        notes: examNotes.trim() || undefined,
        targetType: 'all'
      });
      setExamTitle('');
      setExamDate('');
      setExamNotes('');
      setExamSuccessMsg('Sınav ve sayaç başarıyla atandı!');
      setTimeout(() => setExamSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Streak status badge (Hidden for teachers!)
  const renderStreakBadge = () => {
    if (role === 'teacher' || !currentStudent) return null;
    const { count, status } = currentStudent.streak;

    if (status === 'active') {
      return (
        <button
          onClick={() => onNavigateTab('streak')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-all font-medium text-xs sm:text-sm active:scale-95 cursor-pointer shadow-sm"
          title="Günlük Soru Çözme Serisi"
        >
          <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
          <span className="font-bold">{count} Gün</span>
          <span className="hidden sm:inline text-xs opacity-80">Seri</span>
        </button>
      );
    }

    if (status === 'frozen') {
      return (
        <button
          onClick={() => onNavigateTab('streak')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/25 transition-all font-medium text-xs sm:text-sm active:scale-95 cursor-pointer"
          title="Dün soru çözülmediği için seriniz donduruldu! Detaylar için tıklayın"
        >
          <Snowflake className="w-4 h-4 text-cyan-500 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="font-bold">{count}G (Donduruldu)</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        </button>
      );
    }

    if (status === 'pending_recovery') {
      return (
        <button
          onClick={() => onNavigateTab('streak')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 transition-all font-medium text-xs sm:text-sm active:scale-95 cursor-pointer"
          title="3 Gün çözülmediği için seri askıya alındı. Hoca onayı bekleniyor!"
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span className="font-bold">Hoca Onayı Bekliyor</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => onNavigateTab('streak')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-500/10 text-gray-500 dark:text-gray-400 border border-gray-500/20 transition-all font-medium text-xs sm:text-sm active:scale-95"
      >
        <Flame className="w-4 h-4 text-gray-400" />
        <span>0 Gün</span>
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/[0.06] dark:border-white/[0.08] glass-card transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Branding & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-extrabold text-lg">
              A
            </div>
            <div className="hidden xs:block">
              <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-white">
                Akademi<span style={{ color: themeStyles.accentColor }}>Takip</span>
              </span>
              <span
                style={{
                  backgroundColor: `${themeStyles.accentColor}18`,
                  color: themeStyles.accentColor
                }}
                className="hidden md:inline-block ml-1.5 text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md"
              >
                Koçluk Portali
              </span>
            </div>
          </div>

          {/* Dedicated User Switch Panel Button (Opens Registered Accounts Modal) */}
          <button
            onClick={() => onOpenAccountSwitch ? onOpenAccountSwitch() : setIsAccountSwitchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-200/70 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300/80 dark:hover:bg-neutral-700 transition-all border border-black/5 dark:border-white/5 active:scale-95 cursor-pointer shadow-2xs"
            title="Kayıtlı Hesaplar ve Hızlı Geçiş"
          >
            {role === 'teacher' ? (
              <>
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[110px] sm:max-w-[140px]">
                  {currentTeacher?.name || firebaseUser?.displayName || 'Öğretmen Paneli'}
                </span>
              </>
            ) : currentStudent ? (
              <>
                <UserCheck className="w-3.5 h-3.5" style={{ color: themeStyles.accentColor }} />
                <span className="font-bold truncate max-w-[100px] sm:max-w-[130px]">{currentStudent.name}</span>
              </>
            ) : (
              <>
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold text-amber-600 dark:text-amber-400">Kayıtlı Hesaplar</span>
              </>
            )}
            <span className="text-[10px] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-full ml-0.5">
              Değiştir
            </span>
          </button>
        </div>

        {/* Center: Assigned Exam Countdown Widget (Teacher can assign, students see days left) */}
        <div className="flex items-center">
          {upcomingExam ? (
            <button
              onClick={() => setIsExamModalOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-neutral-100/90 dark:bg-neutral-800/70 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70 border border-black/5 dark:border-white/5 text-xs transition-all cursor-pointer shadow-2xs"
              title="Atanan Sınav ve Sayaç Detayı (Tıklayın)"
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: themeStyles.accentColor }} />
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[140px] sm:max-w-[200px]">
                {upcomingExam.title}:
              </span>
              <span
                style={{
                  backgroundColor: `${themeStyles.accentColor}20`,
                  color: themeStyles.accentColor
                }}
                className="font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap"
              >
                {targetDaysLeft > 0
                  ? `${targetDaysLeft} Gün Kaldı`
                  : targetDaysLeft === 0
                  ? 'Bugün Sınav Günü! 🎯'
                  : 'Sınav Tamamlandı'}
              </span>
            </button>
          ) : role === 'teacher' ? (
            <button
              onClick={() => setIsExamModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold transition-all cursor-pointer"
              title="Öğrencilere Geri Sayım Sayacı ile Sınav Ata"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Sınav Sayacı Ata</span>
            </button>
          ) : null}
        </div>

        {/* Right: Background Timer Indicator, Streak Badge, Notifications, Theme, Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Background Focus Timer Badge (Visible when timer is active, restores floating popup on click) */}
          {activeTimer && (
            <button
              onClick={showTimerPopup}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all text-xs font-bold active:scale-95 cursor-pointer shadow-xs"
              title="Odak Sayacı Arka Planda Çalışıyor • Pop-up'ı Göster"
            >
              <span className="relative flex h-2 w-2">
                {activeTimer.isRunning && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${activeTimer.isRunning ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono">
                {(() => {
                  const isPom = activeTimer.mode === 'pomodoro';
                  const targetSec = (activeTimer.initialDurationMinutes || 25) * 60;
                  const sec = isPom ? Math.max(0, targetSec - activeTimer.elapsedSeconds) : activeTimer.elapsedSeconds;
                  const m = Math.floor(sec / 60).toString().padStart(2, '0');
                  const s = (sec % 60).toString().padStart(2, '0');
                  return `${m}:${s}`;
                })()}
              </span>
              {activeTimer.isPopupHidden && (
                <span className="hidden md:inline text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                  Pop-up Aç
                </span>
              )}
            </button>
          )}

          {/* Streak Badge (Only visible for students) */}
          {renderStreakBadge()}

          {/* Notifications Bell with Prominent Red Badge */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors border border-black/5 dark:border-white/5 active:scale-95 cursor-pointer"
              title="Bildirimler"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 shadow-sm animate-pulse">
                  {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-2xl border border-black/10 dark:border-white/10 p-3 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5 mb-2 font-bold text-neutral-900 dark:text-white">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-blue-500" />
                    <span>Bildirimler ({unreadNotifs.length} yeni)</span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      Temizle
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-neutral-400">
                      Yeni bildiriminiz bulunmuyor
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          if (notif.id.startsWith('notif_ann_')) {
                            onNavigateTab('announcements');
                            setIsNotifOpen(false);
                          }
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          notif.read
                            ? 'bg-neutral-50 dark:bg-neutral-900/40 border-black/5 dark:border-white/5 opacity-70'
                            : 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold text-neutral-900 dark:text-white mb-0.5">
                          <span>{notif.title}</span>
                          <span className="text-[10px] text-neutral-400 font-normal">{notif.date}</span>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-300 text-[11px] leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tema ve Renk Özelleştir Butonu (Sadece Simge, Yazı Yok) */}
          <button
            onClick={() => onOpenThemeCustomizer ? onOpenThemeCustomizer() : setIsThemeModalOpen(true)}
            className="p-2 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors border border-black/5 dark:border-white/5 active:scale-95 cursor-pointer shadow-2xs"
            title="Tema ve Renk Özelleştirme"
          >
            <Palette className="w-4 h-4 text-pink-500" />
          </button>

          {/* Çıkış Yap (Log Out) Butonu */}
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Hesaptan Güvenli Çıkış Yap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </div>

      {/* MODAL: ATANAN SINAVLAR VE SAYAÇ YÖNETİMİ */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in select-none">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-6 min-w-0 break-words space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                    Atanan Sınavlar ve Geri Sayım Sayacı
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Üst menüde gösterilen geri sayım sayacı ve yaklaşan sınavlar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="p-1 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {examSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{examSuccessMsg}</span>
              </div>
            )}

            {/* Teacher: Assign New Exam Form */}
            {role === 'teacher' && (
              <form onSubmit={handleCreateAssignedExam} className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-black/5 dark:border-white/5 space-y-3">
                <div className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-blue-500" />
                  <span>Yeni Sınav ve Sayaç Ata</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Sınav Adı / Başlığı
                  </label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={e => setExamTitle(e.target.value)}
                    placeholder="Örn: 28 Kasım TYT Genel Deneme"
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs text-neutral-900 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Sınav Tarihi
                    </label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={e => setExamDate(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs text-neutral-900 dark:text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Sınav Türü
                    </label>
                    <select
                      value={examType}
                      onChange={e => setExamType(e.target.value as any)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs text-neutral-900 dark:text-white"
                    >
                      <option value="TYT">TYT</option>
                      <option value="AYT">AYT</option>
                      <option value="LGS">LGS</option>
                      <option value="MSÜ">MSÜ</option>
                      <option value="Genel">Genel Deneme</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    Öğretmen Notu <span className="font-normal text-neutral-400">(İsteğe Bağlı)</span>
                  </label>
                  <input
                    type="text"
                    value={examNotes}
                    onChange={e => setExamNotes(e.target.value)}
                    placeholder="Örn: Sınav salonunda en geç 09:45'te hazır bulununuz"
                    className="w-full p-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 text-xs text-neutral-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Sınavı Ata ve Sayacı Başlat</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of Assigned Exams */}
            <div className="space-y-2">
              <div className="font-bold text-xs text-neutral-700 dark:text-neutral-300">
                Kayıtlı Sınavlar ({assignedExams.length})
              </div>

              {assignedExams.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-400 border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
                  Henüz tanımlanmış bir sınav bulunmuyor.
                </div>
              ) : (
                assignedExams.map(ex => {
                  const days = Math.ceil((new Date(ex.examDate + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
                  return (
                    <div
                      key={ex.id}
                      className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-black/5 dark:border-white/5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-white">
                          {ex.title}
                        </div>
                        <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                          <span>Tarih: {ex.examDate}</span>
                          <span>•</span>
                          <span className="font-semibold text-blue-500">{ex.examType}</span>
                          {ex.notes && <span>• {ex.notes}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-1 rounded-full font-bold text-[10px] ${
                          days > 0
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : days === 0
                            ? 'bg-amber-500/15 text-amber-600'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                        }`}>
                          {days > 0 ? `${days} Gün Kaldı` : days === 0 ? 'Bugün!' : 'Tamamlandı'}
                        </span>

                        {role === 'teacher' && (
                          <button
                            onClick={() => deleteAssignedExam(ex.id)}
                            className="p-1 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                            title="Sınavı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Theme Customizer Modal (Fallback if not rendered at root) */}
      {!onOpenThemeCustomizer && (
        <ThemeCustomizerModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
        />
      )}

      {/* Registered Accounts Popover/Modal (Fallback if not rendered at root) */}
      {!onOpenAccountSwitch && (
        <AccountSwitchModal
          isOpen={isAccountSwitchOpen}
          onClose={() => setIsAccountSwitchOpen(false)}
          onOpenClassroomsModal={onOpenClassroomsModal}
          onNavigateTab={onNavigateTab}
        />
      )}
    </header>
  );
};
