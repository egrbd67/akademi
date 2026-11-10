import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Calendar,
  AlertCircle,
  Trash2,
  CheckCircle2,
  Eye,
  Users,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getThemeStyles } from '../theme/ThemeCustomizerModal';

export const AnnouncementsView: React.FC = () => {
  const {
    role,
    announcements,
    addAnnouncement,
    deleteAnnouncement,
    toggleAnnouncementRead,
    students,
    currentStudentId,
    currentTeacher,
    firebaseUser,
    boxTheme
  } = useApp();
  const themeStyles = getThemeStyles(boxTheme);

  const activeTeacherName = currentTeacher?.name || firebaseUser?.displayName || 'Öğretmen';

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorNameInput, setAuthorNameInput] = useState(activeTeacherName);
  const [isUrgent, setIsUrgent] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingReadListAnnId, setViewingReadListAnnId] = useState<string | null>(null);

  React.useEffect(() => {
    if (activeTeacherName) {
      setAuthorNameInput(activeTeacherName);
    }
  }, [activeTeacherName]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    await addAnnouncement({
      title: title.trim(),
      content: content.trim(),
      date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      authorName: authorNameInput.trim() || activeTeacherName,
      urgent: isUrgent,
      readBy: []
    });

    setIsAddModalOpen(false);
    setTitle('');
    setContent('');
    setIsUrgent(false);
  };

  const activeViewingAnnouncement = announcements.find(a => a.id === viewingReadListAnnId);

  return (
    <div className="space-y-5 max-w-4xl mx-auto select-none">
      {/* Başlık */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-black/5 dark:border-white/5">
        <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
          Duyurular
        </h1>

        {role === 'teacher' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={themeStyles.primaryBtn}
            className="px-3.5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Duyuru Ekle</span>
          </button>
        )}
      </div>

      {/* Liste */}
      <div className="space-y-3.5">
        {announcements.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-white dark:bg-[#1C1C1E] border border-dashed border-black/10 dark:border-white/10 space-y-1.5">
            <Megaphone className="w-8 h-8 text-neutral-400 mx-auto" />
            <p className="text-xs text-neutral-500">Henüz duyuru yok.</p>
          </div>
        ) : (
          announcements.map(ann => {
            const readStudentIds = ann.readBy || [];
            const readCount = readStudentIds.length;
            const isReadByMe = currentStudentId ? readStudentIds.includes(currentStudentId) : false;

            return (
              <div
                key={ann.id}
                className={`p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border space-y-2.5 ${
                  ann.urgent
                    ? 'border-amber-500/30'
                    : 'border-black/5 dark:border-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {ann.urgent && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Önemli</span>
                      </span>
                    )}
                    <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{ann.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {role === 'teacher' && (
                      <button
                        onClick={() => setViewingReadListAnnId(ann.id)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                        <span>Okuyanlar ({readCount}/{students.length})</span>
                      </button>
                    )}

                    {role === 'teacher' && (
                      <div>
                        {deletingId === ann.id ? (
                          <div className="flex items-center gap-1 bg-rose-500/10 p-1 rounded-lg">
                            <button
                              onClick={() => {
                                deleteAnnouncement(ann.id);
                                setDeletingId(null);
                              }}
                              className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-xs cursor-pointer"
                            >
                              Sil
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs cursor-pointer"
                            >
                              İptal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(ann.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-neutral-400 hover:text-rose-600 cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  {ann.title}
                </h3>

                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>

                <div className="pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-3 text-[11px] text-neutral-400">
                  <span>{ann.authorName}</span>

                  {role === 'student' && currentStudentId && (
                    <button
                      onClick={() => toggleAnnouncementRead(ann.id, currentStudentId)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer ${
                        isReadByMe
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isReadByMe ? 'Okundu' : 'Okundu İşaretle'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Yeni Duyuru Modalı */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5 mb-4">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Yeni Duyuru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Başlık
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Duyuru başlığı"
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Paylaşan
                </label>
                <input
                  type="text"
                  value={authorNameInput}
                  onChange={e => setAuthorNameInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  İçerik
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Duyuru metni..."
                  rows={4}
                  className="w-full p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 text-neutral-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={isUrgent}
                  onChange={e => setIsUrgent(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                />
                <label htmlFor="urgent" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Önemli duyuru
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-500 font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  style={themeStyles.primaryBtn}
                  className="px-5 py-2 rounded-xl text-white font-bold cursor-pointer"
                >
                  Paylaş
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Okuyanlar Modalı */}
      {viewingReadListAnnId && activeViewingAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 shadow-2xl p-5 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Okuyanlar ({(activeViewingAnnouncement.readBy || []).length}/{students.length})
                </h3>
              </div>
              <button
                onClick={() => setViewingReadListAnnId(null)}
                className="p-1 rounded-lg text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-1.5 flex-1 my-3 pr-1">
              {students.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-400">
                  Öğrenci yok.
                </div>
              ) : (
                students.map(st => {
                  const hasRead = (activeViewingAnnouncement.readBy || []).includes(st.id);
                  return (
                    <div
                      key={st.id}
                      className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-neutral-900 dark:text-white">{st.name}</span>
                      {hasRead ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Okudu</span>
                      ) : (
                        <span className="text-neutral-400">Okumadı</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
