
// src/pages/Messages.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, Plus, Search, Send, X,
  DollarSign, HeadphonesIcon, User, Trash2, Pencil,
  Check, CheckCheck, MoreVertical, ArrowLeft,
  ShieldCheck, Lock, ChevronRight, ChevronDown, CornerUpLeft, Smile,
} from 'lucide-react';
import messagesApi, { Conversation, Message, SearchUser } from '../services/messagesApi';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

const fmtTime = (iso: string, language: string): string => {
  if (!iso) return '';
  const d    = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  if (days === 0) return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return language === 'ar' ? 'أمس' : 'Yesterday';
  if (days < 7)  return d.toLocaleDateString(locale, { weekday: 'short' });
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
};

const roleColor = (role: string) => {
  switch (role) {
    case 'merchant': return { bg: 'bg-emerald-100', text: 'text-emerald-700', labelEn: 'Merchant', labelAr: 'تاجر' };
    case 'exchange': return { bg: 'bg-violet-100',  text: 'text-violet-700',  labelEn: 'Exchange', labelAr: 'صراف' };
    case 'admin':    return { bg: 'bg-blue-100',    text: 'text-blue-700',    labelEn: 'Support',  labelAr: 'دعم' };
    default:         return { bg: 'bg-gray-100',    text: 'text-gray-600',    labelEn: 'User',     labelAr: 'مستخدم' };
  }
};

const convIcon = (type: string) => {
  switch (type) {
    case 'support':  return <HeadphonesIcon className="w-5 h-5 text-blue-500" />;
    case 'merchant': return <User           className="w-5 h-5 text-emerald-500" />;
    case 'exchange': return <DollarSign     className="w-5 h-5 text-violet-500" />;
    default:         return <User           className="w-5 h-5 text-gray-400" />;
  }
};

const Avatar: React.FC<{
  name: string; src?: string | null; type?: string;
  size?: string; showOnline?: boolean;
}> = ({ name, src, type, size = 'w-11 h-11', showOnline }) => {
  const dot = showOnline !== undefined ? (
    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${showOnline ? 'bg-emerald-400' : 'bg-gray-300'}`} />
  ) : null;
  const wrap = (el: React.ReactNode) => <div className="relative flex-shrink-0">{el}{dot}</div>;
  if (src) return wrap(<img src={src} alt={name} className={`${size} rounded-full object-cover`} />);
  const letter = (name || '?').charAt(0).toUpperCase();
  if (type) {
    const g: Record<string, string> = {
      support: 'from-blue-500 to-indigo-600', merchant: 'from-emerald-500 to-teal-600',
      exchange: 'from-violet-500 to-purple-600', default: 'from-gray-400 to-gray-500',
    };
    return wrap(
      <div className={`${size} rounded-full bg-gradient-to-br ${g[type] ?? g.default} flex items-center justify-center flex-shrink-0`}>
        {convIcon(type)}
      </div>
    );
  }
  const palette = ['from-blue-400 to-indigo-500', 'from-emerald-400 to-teal-500',
    'from-violet-400 to-purple-500', 'from-pink-400 to-rose-500', 'from-amber-400 to-orange-500'];
  return wrap(
    <div className={`${size} rounded-full bg-gradient-to-br ${palette[letter.charCodeAt(0) % palette.length]} flex items-center justify-center flex-shrink-0 text-white font-bold text-sm`}>
      {letter}
    </div>
  );
};

const ReactionPicker: React.FC<{ onPick: (e: string) => void; side: 'left' | 'right' }> = ({ onPick, side }) => (
  <div className={`absolute bottom-8 ${side === 'right' ? 'right-0' : 'left-0'} z-30 flex items-center gap-0.5 bg-white border border-gray-200 rounded-2xl shadow-2xl px-1.5 py-1`}>
    {QUICK_EMOJIS.map(emoji => (
      <button key={emoji} onClick={() => onPick(emoji)}
        className="text-lg hover:scale-125 transition-transform w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-110">
        {emoji}
      </button>
    ))}
  </div>
);

const Bubble: React.FC<{
  msg: Message; isOwn: boolean;
  onDelete: (id: string) => void; onEdit: (id: string, text: string) => void;
  onReply: (m: Message) => void; onReact: (id: string, e: string) => void;
  reactions: string[]; language: string; t: any;
  replyPreview?: { senderName: string; content: string } | null;
}> = ({ msg, isOwn, onDelete, onEdit, onReply, onReact, reactions, language, t, replyPreview }) => {
  const [menu,    setMenu]    = useState(false);
  const [picker,  setPicker]  = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(msg.content);
  const menuRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const canEdit  = Date.now() - new Date(msg.created_at).getTime() < 15 * 60_000;
  const isRtl    = language === 'ar';
  const grouped  = reactions.reduce((acc, e) => { acc[e] = (acc[e] || 0) + 1; return acc; }, {} as Record<string, number>);

  useEffect(() => {
    if (!menu && !picker) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setMenu(false); setPicker(false); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menu, picker]);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const submitEdit = () => {
    const v = draft.trim();
    if (v && v !== msg.content) onEdit(msg.id, v);
    setEditing(false);
  };

  if (msg.is_deleted) return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} my-0.5`}>
      <span className="text-xs italic text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
        {isOwn ? t.messaging.youDeletedMessage : t.messaging.messageDeleted}
      </span>
    </div>
  );

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-1.5 my-0.5 group`}>
      {!isOwn && <Avatar name={msg.sender.full_name} src={msg.sender.profile_image} size="w-7 h-7" />}
      <div ref={menuRef} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} relative`} style={{ maxWidth: 'min(76%, 340px)' }}>
        {!isOwn && <p className="text-[11px] text-gray-500 ml-1 mb-0.5 font-semibold">{msg.sender.full_name}</p>}
        {replyPreview && (
          <div className={`flex items-start gap-1.5 mb-1 px-2.5 py-1.5 rounded-xl max-w-full border-l-4 ${
            isOwn ? 'bg-blue-500/20 border-blue-300 text-blue-50' : 'bg-gray-100 border-gray-300 text-gray-600'
          }`}>
            <CornerUpLeft className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-60" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold truncate">{replyPreview.senderName}</p>
              <p className="text-[11px] truncate opacity-80">{replyPreview.content}</p>
            </div>
          </div>
        )}
        <div className={`flex items-end gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {editing ? (
            <div className="flex flex-col gap-1.5 w-full min-w-[180px]">
              <textarea ref={inputRef} rows={2} value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit(); }
                  if (e.key === 'Escape') setEditing(false);
                }}
                className="px-3 py-2 border-2 border-blue-400 rounded-2xl text-sm focus:outline-none resize-none"
              />
              <div className="flex gap-1.5 justify-end">
                <button onClick={() => setEditing(false)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-medium text-gray-600">
                  {t.messaging.cancel}
                </button>
                <button onClick={submitEdit} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-medium text-white flex items-center gap-1">
                  <Check className="w-3 h-3" />{t.messaging.save}
                </button>
              </div>
            </div>
          ) : (
            <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap cursor-text select-text ${
              isOwn
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md shadow-sm'
                : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
            }`} style={{ wordBreak: 'break-word' }}>
              {msg.content}
            </div>
          )}
          {!editing && (
            <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0 self-end mb-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="relative">
                <button onClick={() => { setPicker(p => !p); setMenu(false); }}
                  className="p-1 rounded-full hover:bg-gray-200 active:bg-gray-300 text-gray-400 hover:text-yellow-500 transition-colors">
                  <Smile className="w-3.5 h-3.5" />
                </button>
                {picker && (
                  <ReactionPicker
                    onPick={e => { onReact(msg.id, e); setPicker(false); }}
                    side={isOwn ? (isRtl ? 'left' : 'right') : (isRtl ? 'right' : 'left')}
                  />
                )}
              </div>
              <button onClick={() => onReply(msg)}
                className="p-1 rounded-full hover:bg-gray-200 active:bg-gray-300 text-gray-400 hover:text-blue-500 transition-colors">
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
              {isOwn && (
                <div className="relative">
                  <button onClick={() => { setMenu(m => !m); setPicker(false); }}
                    className="p-1 rounded-full hover:bg-gray-200 active:bg-gray-300 text-gray-400 transition-colors">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  {menu && (
                    <div className={`absolute bottom-8 ${isRtl ? 'left-0' : 'right-0'} bg-white border border-gray-100 rounded-2xl shadow-2xl z-30 overflow-hidden min-w-[128px]`}>
                      {canEdit && (
                        <button onClick={() => { setEditing(true); setMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">
                          <Pencil className="w-3.5 h-3.5 text-gray-500" />{t.messaging.edit}
                        </button>
                      )}
                      <button onClick={() => { onDelete(msg.id); setMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 text-sm text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />{t.messaging.delete}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {Object.keys(grouped).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(grouped).map(([emoji, count]) => (
              <button key={emoji} onClick={() => onReact(msg.id, emoji)}
                className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-full px-1.5 py-0.5 text-xs shadow-sm hover:bg-gray-50 active:scale-95 transition-all">
                <span className="text-base leading-none">{emoji}</span>
                {count > 1 && <span className="text-gray-500 font-semibold">{count}</span>}
              </button>
            ))}
          </div>
        )}
        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <Lock className="w-2 h-2 text-emerald-400 flex-shrink-0" />
          <span className="text-[10px] text-gray-400">{fmtTime(msg.created_at, language)}</span>
          {msg.is_edited && <span className="text-[10px] text-gray-400 italic">· {t.messaging.edited}</span>}
          {isOwn && <CheckCheck className="w-3 h-3 text-blue-400 flex-shrink-0" />}
        </div>
      </div>
    </div>
  );
};

const ConvItem: React.FC<{
  conv: Conversation; isActive: boolean;
  getTitle: (c: Conversation) => string; onClick: () => void; language: string;
}> = ({ conv, isActive, getTitle, onClick, language }) => {
  const p0    = conv.participants?.[0];
  const title = getTitle(conv);
  const isRtl = language === 'ar';
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 text-left transition-all border-b border-gray-50 last:border-0 ${
        isActive
          ? `bg-blue-50 ${isRtl ? 'border-r-[3px] border-r-blue-500' : 'border-l-[3px] border-l-blue-500'}`
          : 'hover:bg-gray-50 active:bg-gray-100'
      }`}
    >
      <Avatar name={title} src={p0?.profile_image} type={conv.type} size="w-11 h-11 sm:w-12 sm:h-12" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{title}</p>
          {conv.lastMessage && (
            <span className={`text-[10px] flex-shrink-0 whitespace-nowrap ${conv.unreadCount > 0 ? 'text-blue-500 font-bold' : 'text-gray-400'}`}>
              {fmtTime(conv.lastMessage.created_at!, language)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className={`text-xs truncate flex-1 ${conv.unreadCount > 0 ? 'font-medium text-gray-600' : 'text-gray-400'}`}>
            {conv.lastMessage?.content || '· · ·'}
          </p>
          {conv.unreadCount > 0 && (
            <span className="flex-shrink-0 ml-2 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

const NewConvModal: React.FC<{
  onClose: () => void;
  onCreate: (type: string, recipientId: string, title?: string) => void;
}> = ({ onClose, onCreate }) => {
  const { t, language, isRTL } = useLanguage();
  const isRtl = isRTL;
  const [q,       setQ]       = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [busy,    setBusy]    = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const doSearch = (val: string) => {
    setQ(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.trim().length < 2) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await messagesApi.searchUsers(val.trim());
        if (r.success) setResults(r.users);
      } catch { toast.error(t.messaging.searchFailed); }
      finally { setBusy(false); }
    }, 300);
  };

  const pick = (u: SearchUser) => {
    const typeMap: Record<string, string> = { merchant: 'merchant', exchange: 'exchange' };
    onCreate(typeMap[u.role] ?? 'user_to_user', u.id);
    onClose();
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div dir={isRtl ? 'rtl' : 'ltr'}
        className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '88vh' }}
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-3 pb-3 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">{t.messaging.newConversation}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="px-4 pb-3 flex-shrink-0">
          <button onClick={() => { onCreate('support', ''); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-2xl transition-all group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <HeadphonesIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left rtl:text-right">
              <p className="font-semibold text-gray-900 text-sm">{t.messaging.contactSupport}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.messaging.contactSupportDesc}</p>
            </div>
            <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className="flex items-center gap-3 px-5 py-1 flex-shrink-0">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400 font-medium tracking-wide whitespace-nowrap">{t.messaging.orFindUser}</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="px-4 py-3 flex-shrink-0">
          <div className="relative">
            <Search className={`w-4 h-4 absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
            <input autoFocus type="text" value={q} onChange={e => doSearch(e.target.value)}
              placeholder={t.messaging.searchByName}
              className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
          {busy && <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}
          {!busy && q.length >= 2 && results.length === 0 && <p className="text-center text-sm text-gray-400 py-8">{t.messaging.noUsersFound} "{q}"</p>}
          {!busy && q.length < 2 && <p className="text-center text-sm text-gray-400 py-4">{t.messaging.typeToSearch}</p>}
          {!busy && results.length > 0 && (
            <div className="space-y-0.5">
              {results.map(u => {
                const rc    = roleColor(u.role);
                const label = language === 'ar' ? rc.labelAr : rc.labelEn;
                return (
                  <button key={u.id} onClick={() => pick(u)}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 active:bg-gray-100 rounded-2xl transition-all text-left rtl:text-right">
                    <Avatar name={u.full_name} src={u.profile_image} />
                    <p className="flex-1 min-w-0 font-semibold text-gray-900 text-sm truncate">{u.full_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${rc.bg} ${rc.text}`}>{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const Messages: React.FC = () => {
  const { user }        = useAuth();
  const { t, language } = useLanguage();
  const isRtl           = language === 'ar';

  const [convs,    setConvs]    = useState<Conversation[]>([]);
  const [active,   setActive]   = useState<Conversation | null>(null);
  const [msgs,     setMsgs]     = useState<Message[]>([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [modal,    setModal]    = useState(false);
  const [filter,   setFilter]   = useState('');
  const [replyTo,  setReplyTo]  = useState<Message | null>(null);
  const [showDown, setShowDown] = useState(false);

  const [reactions, setReactions] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('staler_msg_reactions');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const bottomRef   = useRef<HTMLDivElement>(null);
  const msgAreaRef  = useRef<HTMLDivElement>(null);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((smooth = true) =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' }), 60)
  , []);

  const handleScroll = () => {
    const el = msgAreaRef.current; if (!el) return;
    setShowDown(el.scrollHeight - el.scrollTop - el.clientHeight > 220);
  };

  const getTitle = useCallback((c: Conversation): string => {
    if (c.type === 'support') return language === 'ar' ? 'الدعم الفني' : 'Support';
    if (c.title) return c.title;
    return c.participants?.[0]?.full_name || (language === 'ar' ? 'غير معروف' : 'Unknown');
  }, [language]);

  const loadConvs = useCallback(async () => {
    try {
      const r = await messagesApi.getConversations();
      if (r.success) setConvs(r.conversations);
    } catch { }
    finally { setLoading(false); }
  }, []);

  const loadMsgs = useCallback(async (convId: string) => {
    try {
      const r = await messagesApi.getMessages(convId);
      if (r.success) { setMsgs(r.messages); scrollToBottom(false); }
    } catch { toast.error(t.messaging.failedToLoad); }
  }, [t, scrollToBottom]);

  useEffect(() => {
    loadConvs();
    pollRef.current = setInterval(() => {
      loadConvs();
      if (activeIdRef.current) loadMsgs(activeIdRef.current);
    }, 5_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadConvs, loadMsgs]);

  const selectConv = useCallback(async (c: Conversation) => {
    setConvs(prev => prev.map(cv => cv.id === c.id ? { ...cv, unreadCount: 0 } : cv));
    setActive(c);
    activeIdRef.current = c.id;
    setMsgs([]);
    setReplyTo(null);
    await loadMsgs(c.id);
    window.dispatchEvent(new CustomEvent('messages:read'));
  }, [loadMsgs]);

  const autoResize = () => {
    const el = textareaRef.current; if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !active || sending) return;
    setSending(true);
    const content = text.trim();
    const reply   = replyTo;
    setText('');
    setReplyTo(null);
    if (textareaRef.current) textareaRef.current.style.height = '44px';
    try {
      const r = await messagesApi.sendMessage(active.id, content);
      if (r.success) { setMsgs(p => [...p, r.message]); scrollToBottom(); loadConvs(); }
      else { setText(content); setReplyTo(reply); toast.error(t.messaging.failedToSend); }
    } catch { setText(content); setReplyTo(reply); toast.error(t.messaging.failedToSend); }
    finally { setSending(false); }
  };

  const handleDelete = async (msgId: string) => {
    try {
      await messagesApi.deleteMessage(msgId);
      setMsgs(p => p.map(m => m.id === msgId ? { ...m, is_deleted: true, content: '' } : m));
    } catch { toast.error(t.messaging.failedToDelete); }
  };

  const handleEdit = async (msgId: string, content: string) => {
    try {
      await messagesApi.editMessage(msgId, content);
      setMsgs(p => p.map(m => m.id === msgId ? { ...m, content, is_edited: true } : m));
    } catch { toast.error(t.messaging.failedToEdit); }
  };

  const handleReact = (msgId: string, emoji: string) => {
    setReactions(prev => {
      const cur  = prev[msgId] || [];
      const next: Record<string, string[]> = {
        ...prev,
        [msgId]: cur.includes(emoji) ? cur.filter(e => e !== emoji) : [...cur, emoji],
      };
      try { localStorage.setItem('staler_msg_reactions', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleCreate = async (type: string, recipientId: string, title?: string) => {
    try {
      const r = await messagesApi.createConversation(type, recipientId, title);
      if (r.success) {
        toast.success(r.existing ? t.messaging.opening : t.messaging.created);
        await loadConvs();
        setTimeout(async () => {
          const r2 = await messagesApi.getConversations();
          if (r2.success) {
            setConvs(r2.conversations);
            const found = r2.conversations.find(c => c.id === r.conversationId);
            if (found) selectConv(found);
          }
        }, 300);
      }
    } catch { toast.error(t.messaging.failedToCreate); }
  };

  const filtered = convs.filter(c => getTitle(c).toLowerCase().includes(filter.toLowerCase()));

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">{t.messaging.pleaseLogin}</p>
      </div>
    </div>
  );

  const chatPanel = active ? (
    <>
      <header className="flex items-center gap-3 px-3 sm:px-5 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
        <button
          onClick={() => { setActive(null); activeIdRef.current = null; }}
          className="sm:hidden flex items-center justify-center w-9 h-9 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl transition-colors flex-shrink-0"
        >
          <ArrowLeft className={`w-5 h-5 text-gray-700 ${isRtl ? 'rotate-180' : ''}`} />
        </button>
        <Avatar name={getTitle(active)} src={active.participants?.[0]?.profile_image} type={active.type} size="w-9 h-9 sm:w-10 sm:h-10" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{getTitle(active)}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Lock className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs text-emerald-600 font-medium">{t.messaging.encrypted}</span>
          </div>
        </div>
      </header>

      <div ref={msgAreaRef} onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-5 py-4 space-y-0.5">
        {msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 border border-gray-100">
              <MessageCircle className="w-8 h-8 text-blue-300" />
            </div>
            <p className="font-semibold text-gray-500 text-sm">{t.messaging.noMessagesYet}</p>
            <p className="text-xs text-gray-400 mt-1">{t.messaging.beFirst}</p>
          </div>
        ) : (
          msgs.map(m => (
            <Bubble key={m.id} msg={m} isOwn={m.sender_id === user.id}
              onDelete={handleDelete} onEdit={handleEdit}
              onReply={setReplyTo} onReact={handleReact}
              reactions={reactions[m.id] || []}
              language={language} t={t} replyPreview={null}
            />
          ))
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {showDown && (
        <button onClick={() => scrollToBottom()}
          className="absolute bottom-20 right-4 w-9 h-9 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-10 border-2 border-white">
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {replyTo && (
        <div className="flex-shrink-0 flex items-center gap-2 px-3 sm:px-5 py-2 bg-blue-50 border-t border-blue-100">
          <CornerUpLeft className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-blue-600">{replyTo.sender.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="flex-shrink-0 p-1 hover:bg-blue-100 active:bg-blue-200 rounded-full">
            <X className="w-3.5 h-3.5 text-blue-400" />
          </button>
        </div>
      )}

      <form onSubmit={handleSend}
        className="flex-shrink-0 flex items-end gap-2 px-3 sm:px-4 py-2.5 bg-white border-t border-gray-100"
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        <div className="flex-1 relative">
          <textarea ref={textareaRef} rows={1} value={text}
            onChange={e => { setText(e.target.value); autoResize(); }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
            disabled={sending} placeholder={t.messaging.typeMessage}
            className={`w-full ${isRtl ? 'pr-3 pl-8' : 'pl-3 pr-8'} py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none overflow-hidden transition-[height]`}
            style={{ minHeight: '44px', maxHeight: '120px' }} dir={isRtl ? 'rtl' : 'ltr'}
          />
          <Lock className={`w-3 h-3 text-emerald-400 absolute ${isRtl ? 'left-2.5' : 'right-2.5'} bottom-3.5 pointer-events-none`} />
        </div>
        <button type="submit" disabled={sending || !text.trim()}
          className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 disabled:opacity-40 rounded-2xl flex items-center justify-center transition-all shadow-md self-end">
          {sending
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Send className={`w-4 h-4 text-white ${isRtl ? 'rotate-180' : ''}`} />
          }
        </button>
      </form>
    </>
  ) : (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md mb-5 border border-blue-100">
        <MessageCircle className="w-10 h-10 text-blue-400" />
      </div>
      <p className="text-xl font-bold text-gray-800 mb-1">{t.messaging.yourMessages}</p>
      <p className="text-sm text-gray-400 mb-7 max-w-[210px]">{t.messaging.selectOrStart}</p>
      <button onClick={() => setModal(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold text-sm transition-all shadow-md active:scale-95">
        <Plus className="w-4 h-4" />{t.messaging.newConversation}
      </button>
      <div className="flex items-center gap-1.5 mt-6 text-xs text-emerald-600">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>{t.messaging.encrypted}</span>
      </div>
    </div>
  );

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="flex bg-white overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

      <aside className={`flex-col border-r border-gray-100 bg-white flex-shrink-0 w-full sm:w-[300px] md:w-[320px] lg:w-[360px] ${active ? 'hidden sm:flex' : 'flex'}`}>
        <div className="flex items-center justify-between px-3 sm:px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            <span className="text-white font-bold text-base sm:text-lg">{t.messaging.title}</span>
          </div>
          <button onClick={() => setModal(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-xl flex items-center justify-center transition-colors">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-emerald-50 border-b border-emerald-100 flex-shrink-0">
          <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 flex-shrink-0" />
          <span className="text-[10px] sm:text-[11px] text-emerald-700 font-medium">{t.messaging.allEncrypted}</span>
        </div>
        <div className="px-3 py-2 sm:py-2.5 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
            <input type="text" value={filter} onChange={e => setFilter(e.target.value)}
              placeholder={t.messaging.searchConversations}
              className={`w-full ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-6 h-6 sm:w-7 sm:h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-6 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-500 text-sm">{t.messaging.noConversations}</p>
              <p className="text-xs text-gray-400 mt-1">{t.messaging.tapToStart}</p>
              <button onClick={() => setModal(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
                <Plus className="w-4 h-4" />{t.messaging.newConversation}
              </button>
            </div>
          ) : (
            filtered.map(c => (
              <ConvItem key={c.id} conv={c} isActive={active?.id === c.id}
                getTitle={getTitle} onClick={() => selectConv(c)} language={language}
              />
            ))
          )}
        </div>
      </aside>

      <main className={`flex-col flex-1 min-w-0 bg-gray-50 overflow-hidden relative ${active ? 'flex' : 'hidden sm:flex'}`}>
        {chatPanel}
      </main>

      {modal && <NewConvModal onClose={() => setModal(false)} onCreate={handleCreate} />}
    </div>
  );
};

export default Messages;





