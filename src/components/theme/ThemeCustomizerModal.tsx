import React from 'react';
import { X, Check, Palette, Sparkles, Layout, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BackgroundTheme, BoxColorTheme } from '../../types';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BG_THEMES: { id: BackgroundTheme; name: string; previewClass: string; desc: string; textClass: string }[] = [
  { id: 'default', name: 'Standart Sistem', previewClass: 'bg-[#F2F2F7] dark:bg-[#000000]', desc: 'Sistem açık/koyu dengeli tema', textClass: 'text-neutral-800 dark:text-neutral-200' },
  { id: 'pure_white', name: 'Saf Beyaz', previewClass: 'bg-[#FFFFFF] text-black border border-neutral-200', desc: 'Tam aydınlık, yüksek netlik', textClass: 'text-neutral-900' },
  { id: 'deep_black', name: 'Derin Siyah', previewClass: 'bg-[#000000] text-white border border-neutral-800', desc: 'OLED siyah, sıfır göz yorgunluğu', textClass: 'text-neutral-100' },
  { id: 'graphite', name: 'Grafit / Kömür', previewClass: 'bg-[#18181B] text-neutral-100', desc: 'Modern karanlık çalışma alanı', textClass: 'text-neutral-100' },
  { id: 'slate', name: 'Slate / Füme', previewClass: 'bg-[#0F172A] text-slate-100', desc: 'Derin lacivert-füme zemin', textClass: 'text-slate-100' },
  { id: 'cream', name: 'Krem / Kağıt', previewClass: 'bg-[#FAF8F5] text-neutral-900 border border-amber-200/50', desc: 'Doğal kağıt tonu, yumuşak okuma', textClass: 'text-neutral-900' },
  { id: 'navy', name: 'Gece Mavisi', previewClass: 'bg-[#0B132B] text-blue-100', desc: 'Odaklanmayı artıran koyu mavi', textClass: 'text-blue-100' },
];

export const BOX_THEMES: { id: BoxColorTheme; name: string; accentColor: string; bgClass: string; borderClass: string; badgeText: string }[] = [
  { id: 'blue', name: 'Klasik Mavi', accentColor: '#3B82F6', bgClass: 'bg-blue-500/10 hover:bg-blue-500/15', borderClass: 'border-blue-500/30 hover:border-blue-500/60', badgeText: 'text-blue-600 dark:text-blue-400' },
  { id: 'sky', name: 'Gökyüzü Mavisi', accentColor: '#0EA5E9', bgClass: 'bg-sky-500/10 hover:bg-sky-500/15', borderClass: 'border-sky-500/30 hover:border-sky-500/60', badgeText: 'text-sky-600 dark:text-sky-400' },
  { id: 'cyan', name: 'Okyanus Cyan', accentColor: '#06B6D4', bgClass: 'bg-cyan-500/10 hover:bg-cyan-500/15', borderClass: 'border-cyan-500/30 hover:border-cyan-500/60', badgeText: 'text-cyan-600 dark:text-cyan-400' },
  { id: 'teal', name: 'Turkuaz', accentColor: '#14B8A6', bgClass: 'bg-teal-500/10 hover:bg-teal-500/15', borderClass: 'border-teal-500/30 hover:border-teal-500/60', badgeText: 'text-teal-600 dark:text-teal-400' },
  { id: 'emerald', name: 'Zümrüt Yeşili', accentColor: '#10B981', bgClass: 'bg-emerald-500/10 hover:bg-emerald-500/15', borderClass: 'border-emerald-500/30 hover:border-emerald-500/60', badgeText: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'green', name: 'Çimen Yeşili', accentColor: '#22C55E', bgClass: 'bg-green-500/10 hover:bg-green-500/15', borderClass: 'border-green-500/30 hover:border-green-500/60', badgeText: 'text-green-600 dark:text-green-400' },
  { id: 'lime', name: 'Limon Yeşili', accentColor: '#84CC16', bgClass: 'bg-lime-500/10 hover:bg-lime-500/15', borderClass: 'border-lime-500/30 hover:border-lime-500/60', badgeText: 'text-lime-600 dark:text-lime-400' },
  { id: 'yellow', name: 'Güneş Sarısı', accentColor: '#EAB308', bgClass: 'bg-yellow-500/10 hover:bg-yellow-500/15', borderClass: 'border-yellow-500/30 hover:border-yellow-500/60', badgeText: 'text-yellow-600 dark:text-yellow-400' },
  { id: 'amber', name: 'Sıcak Amber', accentColor: '#F59E0B', bgClass: 'bg-amber-500/10 hover:bg-amber-500/15', borderClass: 'border-amber-500/30 hover:border-amber-500/60', badgeText: 'text-amber-600 dark:text-amber-400' },
  { id: 'orange', name: 'Enerjik Turuncu', accentColor: '#F97316', bgClass: 'bg-orange-500/10 hover:bg-orange-500/15', borderClass: 'border-orange-500/30 hover:border-orange-500/60', badgeText: 'text-orange-600 dark:text-orange-400' },
  { id: 'coral', name: 'Mercan', accentColor: '#FF6B4A', bgClass: 'bg-orange-500/10 hover:bg-orange-500/15', borderClass: 'border-orange-500/30 hover:border-orange-500/60', badgeText: 'text-orange-600 dark:text-orange-400' },
  { id: 'red', name: 'Kızıl Kırmızı', accentColor: '#EF4444', bgClass: 'bg-red-500/10 hover:bg-red-500/15', borderClass: 'border-red-500/30 hover:border-red-500/60', badgeText: 'text-red-600 dark:text-red-400' },
  { id: 'rose', name: 'Gül / Rose', accentColor: '#F43F5E', bgClass: 'bg-rose-500/10 hover:bg-rose-500/15', borderClass: 'border-rose-500/30 hover:border-rose-500/60', badgeText: 'text-rose-600 dark:text-rose-400' },
  { id: 'pink', name: 'Şeker Pembe', accentColor: '#EC4899', bgClass: 'bg-pink-500/10 hover:bg-pink-500/15', borderClass: 'border-pink-500/30 hover:border-pink-500/60', badgeText: 'text-pink-600 dark:text-pink-400' },
  { id: 'fuchsia', name: 'Canlı Fuşya', accentColor: '#D946EF', bgClass: 'bg-fuchsia-500/10 hover:bg-fuchsia-500/15', borderClass: 'border-fuchsia-500/30 hover:border-fuchsia-500/60', badgeText: 'text-fuchsia-600 dark:text-fuchsia-400' },
  { id: 'purple', name: 'Asil Mor', accentColor: '#A855F7', bgClass: 'bg-purple-500/10 hover:bg-purple-500/15', borderClass: 'border-purple-500/30 hover:border-purple-500/60', badgeText: 'text-purple-600 dark:text-purple-400' },
  { id: 'violet', name: 'Menekşe', accentColor: '#8B5CF6', bgClass: 'bg-violet-500/10 hover:bg-violet-500/15', borderClass: 'border-violet-500/30 hover:border-violet-500/60', badgeText: 'text-violet-600 dark:text-violet-400' },
  { id: 'indigo', name: 'Derin İndigo', accentColor: '#6366F1', bgClass: 'bg-indigo-500/10 hover:bg-indigo-500/15', borderClass: 'border-indigo-500/30 hover:border-indigo-500/60', badgeText: 'text-indigo-600 dark:text-indigo-400' },
  { id: 'navy', name: 'Kraliyet Laciverti', accentColor: '#2563EB', bgClass: 'bg-blue-600/10 hover:bg-blue-600/15', borderClass: 'border-blue-600/30 hover:border-blue-600/60', badgeText: 'text-blue-700 dark:text-blue-300' },
  { id: 'lavender', name: 'Lavanta', accentColor: '#C084FC', bgClass: 'bg-purple-400/10 hover:bg-purple-400/15', borderClass: 'border-purple-400/30 hover:border-purple-400/60', badgeText: 'text-purple-500 dark:text-purple-300' },
  { id: 'brown', name: 'Bronz / Kahve', accentColor: '#B45309', bgClass: 'bg-amber-700/10 hover:bg-amber-700/15', borderClass: 'border-amber-700/30 hover:border-amber-700/60', badgeText: 'text-amber-700 dark:text-amber-400' },
  { id: 'copper', name: 'Bakır', accentColor: '#EA580C', bgClass: 'bg-orange-600/10 hover:bg-orange-600/15', borderClass: 'border-orange-600/30 hover:border-orange-600/60', badgeText: 'text-orange-700 dark:text-orange-400' },
  { id: 'slate', name: 'Arduvaz / Füme', accentColor: '#64748B', bgClass: 'bg-slate-500/10 hover:bg-slate-500/15', borderClass: 'border-slate-500/30 hover:border-slate-500/60', badgeText: 'text-slate-600 dark:text-slate-400' },
  { id: 'charcoal', name: 'Antrasit', accentColor: '#475569', bgClass: 'bg-slate-600/10 hover:bg-slate-600/15', borderClass: 'border-slate-600/30 hover:border-slate-600/60', badgeText: 'text-slate-700 dark:text-slate-300' },
];

export const getActiveBoxTheme = (boxTheme: BoxColorTheme) => {
  const found = BOX_THEMES.find(
    b => b.id === boxTheme || b.accentColor.toLowerCase() === String(boxTheme || '').toLowerCase()
  );
  if (found) return found;
  if (typeof boxTheme === 'string' && /^#[0-9A-Fa-f]{6}$/.test(boxTheme.trim())) {
    const hex = boxTheme.trim().toUpperCase();
    return {
      id: hex,
      name: `Özel Renk (${hex})`,
      accentColor: hex,
      bgClass: 'bg-neutral-500/10 hover:bg-neutral-500/15',
      borderClass: 'border-neutral-500/30 hover:border-neutral-500/60',
      badgeText: 'text-neutral-700 dark:text-neutral-300',
    };
  }
  return BOX_THEMES[0];
};

export const getThemeStyles = (boxTheme: BoxColorTheme) => {
  const active = getActiveBoxTheme(boxTheme);
  const color = active.accentColor;
  return {
    accentColor: color,
    primaryBtn: {
      backgroundColor: color,
      color: '#FFFFFF',
      boxShadow: `0 4px 14px 0 ${color}40`,
    },
    subtleBadge: {
      backgroundColor: `${color}18`,
      color: color,
      borderColor: `${color}35`,
    },
    activeNav: {
      backgroundColor: color,
      color: '#FFFFFF',
      boxShadow: `0 4px 14px 0 ${color}40`,
    },
    activeText: {
      color: color,
    },
    activeDot: {
      backgroundColor: color,
    },
    selectedCard: {
      borderColor: color,
      backgroundColor: `${color}0D`,
    },
  };
};

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({ isOpen, onClose }) => {
  const { bgTheme, setBgTheme, boxTheme, setBoxTheme, isDarkMode, toggleDarkMode } = useApp();
  const themeStyles = getThemeStyles(boxTheme);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/25">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                Tema & Görünüm Özelleştirme
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Arka plan rengini ve kutucuk/kart vurgularını dilediğiniz gibi belirleyin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hızlı Açık / Koyu Mod Değiştirici */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-700 flex items-center justify-center shadow-2xs">
              {isDarkMode ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <div>
              <div className="font-bold text-xs text-neutral-900 dark:text-white">
                {isDarkMode ? 'Karanlık Mod (Koyu)' : 'Aydınlık Mod (Açık)'}
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Göz yormayan karanlık veya aydınlık sistem görünümü
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleDarkMode}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isDarkMode
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-900 text-white'
            }`}
          >
            {isDarkMode ? 'Açık Moda Geç' : 'Koyu Moda Geç'}
          </button>
        </div>

        {/* SECTION 1: ARKA PLAN RENKLERİ (Beyaz, Siyah, Grafit, Slate, Krem...) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-blue-500" />
              <span>Arka Plan Rengi</span>
            </label>
            <span className="text-[11px] font-semibold text-neutral-400">
              {BG_THEMES.find(t => t.id === bgTheme)?.name}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {BG_THEMES.map(theme => {
              const isSelected = bgTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setBgTheme(theme.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between h-20 ${
                    theme.previewClass
                  } ${
                    isSelected
                      ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]'
                      : 'hover:scale-[1.01] hover:border-blue-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-xs ${theme.textClass}`}>{theme.name}</span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] opacity-75 line-clamp-1 ${theme.textClass}`}>
                    {theme.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: KUTUCUK VE KART RENKLERİ (Mavi, Turuncu, Zümrüt, Mor...) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Kutucuk & Vurgu Rengi</span>
            </label>
            <span className="text-[11px] font-semibold text-neutral-400">
              {BOX_THEMES.find(b => b.id === boxTheme)?.name}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {BOX_THEMES.map(b => {
              const isSelected = boxTheme === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setBoxTheme(b.id)}
                  className={`p-3 rounded-2xl border transition-all text-left cursor-pointer flex flex-col gap-1.5 ${
                    b.bgClass
                  } ${b.borderClass} ${
                    isSelected ? 'ring-2 ring-offset-2 ring-black dark:ring-white dark:ring-offset-neutral-900 shadow-sm scale-[1.02]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="w-4 h-4 rounded-full shadow-xs"
                      style={{ backgroundColor: b.accentColor }}
                    />
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-neutral-900 dark:text-white">{b.name}</div>
                    <div className={`text-[10px] font-semibold ${b.badgeText}`}>Örnek Oturum Kutusu</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: CANLI ÖNİZLEME */}
        <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 border border-black/5 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
            <span>Canlı Görünüm ve Menü Vurgusu Önizlemesi:</span>
            <span style={{ color: themeStyles.accentColor }} className="font-extrabold">
              Aktif Renk: {getActiveBoxTheme(boxTheme).name}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className={`p-2.5 rounded-xl border ${BOX_THEMES.find(b => b.id === boxTheme)?.bgClass} ${BOX_THEMES.find(b => b.id === boxTheme)?.borderClass} text-center`}>
              <div className="text-[10px] font-bold text-neutral-500">1. Oturum</div>
              <div className="text-xs font-black text-neutral-900 dark:text-white">Matematik</div>
              <div className="text-[9px] text-neutral-400">40 Soru</div>
            </div>
            <div className={`p-2.5 rounded-xl border ${BOX_THEMES.find(b => b.id === boxTheme)?.bgClass} ${BOX_THEMES.find(b => b.id === boxTheme)?.borderClass} text-center`}>
              <div className="text-[10px] font-bold text-neutral-500">2. Oturum</div>
              <div className="text-xs font-black text-neutral-900 dark:text-white">Fizik</div>
              <div className="text-[9px] text-neutral-400">50 Dk</div>
            </div>
            <div className={`p-2.5 rounded-xl border ${BOX_THEMES.find(b => b.id === boxTheme)?.bgClass} ${BOX_THEMES.find(b => b.id === boxTheme)?.borderClass} text-center`}>
              <div className="text-[10px] font-bold text-neutral-500">3. Oturum</div>
              <div className="text-xs font-black text-neutral-900 dark:text-white">Kimya</div>
              <div className="text-[9px] text-neutral-400">35 Soru</div>
            </div>
          </div>

          {/* Menü Seçim Butonu Önizlemesi */}
          <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
            <div className="text-[11px] text-neutral-500 font-medium">Menüde Seçili Sekme Vurgusu:</div>
            <div
              style={themeStyles.activeNav}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Ders Programı (Seçili)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
          <button
            onClick={() => {
              setBgTheme('default');
              setBoxTheme('blue');
            }}
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            Varsayılana Sıfırla
          </button>
          <button
            onClick={onClose}
            style={themeStyles.primaryBtn}
            className="px-6 py-2.5 rounded-2xl text-white font-bold text-xs active:scale-95 transition-all cursor-pointer"
          >
            Tamam / Değişiklikleri Uygula
          </button>
        </div>
      </div>
    </div>
  );
};
