import { useEffect, useRef, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useInfiniteQuery, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { ArrowRight, Search, Send, Check, CheckCheck, Trash2, ShieldBan, Copy, MessageCircle, UserPlus, Eye, X, Pencil, Reply, Eraser } from 'lucide-react';
import { isOnline, leftAgoLabel } from '@/hooks/usePresence';
import { becameOnline } from '@/lib/chat-retention';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/Avatar';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/hooks/useSession';
import { chatAction, chatStateOptions, type Peer } from '@/lib/chat';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/chat')({
  validateSearch: z.object({ conversation: z.string().uuid().optional() }),
  loader: ({ context }) => context.queryClient.ensureQueryData(chatStateOptions),
  head: () => ({ meta: [
    { title: 'المحادثات الخاصة — حجر الجاديت الإمبراطوري' },
    { name: 'description', content: 'المحادثات النصية الخاصة وطلبات الصداقة في منصة حجر الجاديت الإمبراطوري.' },
    { property: 'og:title', content: 'المحادثات الخاصة — حجر الجاديت الإمبراطوري' },
    { property: 'og:description', content: 'رسائلك وطلبات الصداقة الخاصة.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: Chat,
});

function Chat() {
  const { user } = useSession();
  const { conversation } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const state = useSuspenseQuery({ ...chatStateOptions, refetchInterval: 15000 });
  const [tab, setTab] = useState<'accepted' | 'requests' | 'blocked'>('accepted');
  const [code, setCode] = useState('');
  const [ownCode, setOwnCode] = useState<string>();
  const [peer, setPeer] = useState<Peer>();
  const [draft, setDraft] = useState('');
  const [finding, setFinding] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [replyTo, setReplyTo] = useState<string>();
  const [editing, setEditing] = useState<string>();
  const [peerTyping, setPeerTyping] = useState(false);
  const typingChannel = useRef<ReturnType<typeof supabase.channel> | undefined>(undefined);
  const lastTypingSent = useRef(0);
  const pressTimer = useRef<number | undefined>(undefined);
  const wasOnline = useRef<boolean | undefined>(undefined);
  const end = useRef<HTMLDivElement>(null);
  const active = state.data.find(f => f.id === conversation);
  const blocked = active?.blocked_by_me || active?.blocked_by_peer;
  const peerOnline = !!active && !active.presence_hidden && isOnline(active.last_seen_at, active.is_online);
  useEffect(() => { wasOnline.current = undefined; }, [conversation]);
  useEffect(() => {
    if (!active) return;
    if (becameOnline(wasOnline.current, peerOnline)) playTone();
    wasOnline.current = peerOnline;
  }, [peerOnline, active?.id]);
  useEffect(() => {
    if (!conversation || !user) return;
    let hide: number | undefined;
    const ch = supabase.channel(`typing-${conversation}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.user === user.id) return;
        setPeerTyping(true); window.clearTimeout(hide); hide = window.setTimeout(() => setPeerTyping(false), 3500);
      }).subscribe();
    typingChannel.current = ch;
    return () => { window.clearTimeout(hide); setPeerTyping(false); typingChannel.current = undefined; void supabase.removeChannel(ch); };
  }, [conversation, user?.id]);
  const sendTyping = () => {
    const now = Date.now();
    if (now - lastTypingSent.current < 2000 || !typingChannel.current) return;
    lastTypingSent.current = now;
    void typingChannel.current.send({ type: 'broadcast', event: 'typing', payload: { user: user?.id } });
  };
  const extra = async (action: string, message: string, body?: string | null, friendship?: string) => {
    const { error } = await supabase.rpc('chat_message_extra', { _action: action, _message: message, ...(body !== undefined && body !== null ? { _body: body } : {}), ...(friendship ? { _friendship: friendship } : {}) });
    if (error) throw new Error(error.message);
    void qc.invalidateQueries({ queryKey: ['chat-messages'] });
  };
  const clearHistory = async (id: string, both: boolean) => {
    const { error } = await supabase.rpc('clear_chat_history', { _friendship: id, _both: both });
    if (error) { toast.error(error.message); return; }
    toast.success(both ? 'تم حذف المحادثة لدى الطرفين' : 'تم حذف المحادثة');
    void qc.invalidateQueries({ queryKey: ['private-chat'] }); void qc.invalidateQueries({ queryKey: ['chat-messages'] });
    if (id === conversation) open();
  };
  const change = useMutation({
    mutationFn: ({ action, target, body }: { action: string; target?: string; body?: string }) => chatAction(action, target, action === 'request' ? code : undefined, body),
    onSuccess: (_, vars) => {
      if (vars.action === 'send') { setDraft(''); if (replyTo && vars.target) { const rt = replyTo; void extra('reply', rt, undefined, vars.target).catch(() => {}); } setReplyTo(undefined); }
      if (vars.action === 'request') { setPeer(undefined); toast.success('تم إرسال طلب الصداقة'); }
      void qc.invalidateQueries({ queryKey: ['private-chat'] });
      void qc.invalidateQueries({ queryKey: ['chat-messages'] });
    },
    onError: (e) => toast.error(e.message),
  });
  const messages = useInfiniteQuery({
    queryKey: ['chat-messages', conversation], enabled: !!active,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      if (!conversation) return [];
      let query = supabase.from('chat_messages').select('*').eq('friendship_id', conversation).order('created_at', { ascending: false }).limit(40);
      if (pageParam) query = query.lt('created_at', pageParam);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    getNextPageParam: (last) => last.length === 40 ? last[last.length - 1]?.created_at : undefined,
    refetchInterval: 15000,
  });
  const rows = messages.data?.pages.flat().slice().reverse() ?? [];
  const lastId = rows[rows.length - 1]?.id;
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`private-chat-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_friendships' }, () => { void qc.invalidateQueries({ queryKey: ['private-chat'] }); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        void qc.invalidateQueries({ queryKey: ['private-chat'] });
        void qc.invalidateQueries({ queryKey: ['chat-messages'] });
      }).subscribe();
    const clear = () => { qc.removeQueries({ queryKey: ['private-chat'] }); qc.removeQueries({ queryKey: ['chat-messages'] }); };
    const { data: auth } = supabase.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') clear(); });
    return () => { void supabase.removeChannel(channel); auth.subscription.unsubscribe(); clear(); };
  }, [user?.id, qc]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [lastId, conversation]);
  useEffect(() => {
    if (!conversation || !rows.some(m => m.sender_id !== user?.id && !m.read_at && !m.deleted_at)) return;
    const mark = () => { if (document.visibilityState === 'visible') void chatAction('read', conversation).then(() => qc.invalidateQueries({ queryKey: ['chat-messages', conversation] })).catch(() => {}); };
    mark(); document.addEventListener('visibilitychange', mark);
    return () => document.removeEventListener('visibilitychange', mark);
  }, [conversation, rows.filter(m => !m.read_at).map(m => m.id).join(','), user?.id, qc]);
  async function lookup(e: React.FormEvent) {
    e.preventDefault(); setFinding(true); setPeer(undefined);
    try { setPeer(await chatAction('lookup', undefined, code)); } catch (e) { toast.error(e instanceof Error ? e.message : 'تعذر البحث'); } finally { setFinding(false); }
  }
  const open = (id?: string) => { setDraft(''); void navigate({ to: '/chat', search: id ? { conversation: id } : {} }); };
  const list = state.data.filter(f => tab === 'blocked' ? f.blocked_by_me : tab === 'requests' ? f.status !== 'accepted' && !f.blocked_by_me : f.status === 'accepted' && !f.blocked_by_me).sort((a,b) => new Date(b.last_message_at || b.updated_at).getTime() - new Date(a.last_message_at || a.updated_at).getTime());
  return <div dir="rtl" className="flex h-dvh flex-col bg-background text-foreground">
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div className="flex items-center gap-3"><Button asChild variant="ghost" size="icon"><Link to="/" aria-label="العودة للمنصة"><ArrowRight className="h-5 w-5" /></Link></Button><h1 className="text-lg font-bold">المحادثات الخاصة</h1></div>
      <Button variant="outline" size="sm" onClick={async () => { try { if (ownCode) { setOwnCode(undefined); return; } setOwnCode((await chatAction('my_id')).code); } catch { toast.error('تعذر عرض ID'); } }}><Eye className="h-4 w-4" />{ownCode ? 'إخفاء ID' : 'ID الخاص بي'}</Button>
    </header>
    {ownCode && <div className="flex shrink-0 items-center justify-center gap-3 border-b border-border py-2"><span dir="ltr" className="font-mono text-xl">{ownCode}</span><Button size="icon" variant="ghost" aria-label="نسخ ID" onClick={() => void navigator.clipboard.writeText(ownCode).then(() => toast.success('تم نسخ ID'))}><Copy className="h-4 w-4" /></Button></div>}
    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1">
      <aside className={`${conversation ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-e border-border md:w-80`}>
        <form onSubmit={lookup} className="flex gap-2 p-3"><Input aria-label="ID المستخدم" placeholder="ID المستخدم — 6 أرقام" inputMode="numeric" maxLength={6} value={code} onChange={e => { setCode(e.target.value.replace(/\D/g,'')); setPeer(undefined); }} /><Button type="submit" size="icon" disabled={finding || code.length !== 6} aria-label="البحث عن ID"><Search className="h-4 w-4" /></Button></form>
        {peer && <div className="border-b border-border px-3 pb-3"><div className="mb-2 flex items-center gap-2"><Avatar src={peer.avatar_url} name={peer.display_name || peer.username} className="h-10 w-10" /><Link to="/u/$username" params={{ username: peer.username }} className="min-w-0 truncate font-semibold">{peer.display_name || peer.username}</Link></div><Button className="w-full" disabled={change.isPending} onClick={() => change.mutate({ action: 'request' })}><UserPlus className="h-4 w-4" />إرسال طلب صداقة</Button></div>}
        <div className="flex border-b border-border px-2 pb-2" role="tablist" aria-label="أقسام الشات">{(['accepted','requests','blocked'] as const).map(t => <Button key={t} role="tab" aria-selected={tab===t} variant={tab===t?'secondary':'ghost'} size="sm" onClick={() => setTab(t)} className="flex-1">{t==='accepted'?'المحادثات':t==='requests'?'الطلبات':'المحظورون'}</Button>)}</div>
        <div className="min-h-0 flex-1 overflow-y-auto">{list.map(f => <div key={f.id} onContextMenu={e => { e.preventDefault(); if (window.confirm('حذف هذه المحادثة من قائمتك؟')) void clearHistory(f.id, false); }} onTouchStart={() => { pressTimer.current = window.setTimeout(() => { if (window.confirm('حذف هذه المحادثة من قائمتك؟')) void clearHistory(f.id, false); }, 600); }} onTouchEnd={() => window.clearTimeout(pressTimer.current)} onTouchMove={() => window.clearTimeout(pressTimer.current)} className={`select-none border-b border-border p-3 ${f.id===conversation?'bg-secondary':''}`}><Button variant="ghost" className="h-auto w-full justify-start gap-3 px-0 text-right" onClick={() => open(f.id)}><Avatar src={f.avatar_url} name={f.display_name || f.username} className="h-11 w-11 shrink-0" /><span className="min-w-0 flex-1"><span className="block truncate font-bold">{f.display_name || f.username}</span><span className="block truncate text-xs text-muted-foreground">{f.status==='pending' ? f.requester_id===user?.id?'طلب صادر • قيد الانتظار':'طلب وارد' : f.status==='rejected'?'طلب مرفوض':f.last_body || 'لا توجد رسائل'}</span></span>{Number(f.unread)>0 && <span className="text-xs font-bold text-primary">{f.unread}</span>}</Button>{f.status==='pending' && f.recipient_id===user?.id && !f.blocked_by_me && !f.blocked_by_peer && <div className="mt-2 flex gap-2"><Button size="sm" disabled={change.isPending} onClick={() => change.mutate({ action:'accept',target:f.id })}><Check className="h-4 w-4" />قبول</Button><Button size="sm" variant="outline" disabled={change.isPending} onClick={() => change.mutate({ action:'reject',target:f.id })}><X className="h-4 w-4" />رفض</Button></div>}</div>)}{!list.length && <p className="p-6 text-center text-sm text-muted-foreground">{tab==='requests'?'لا توجد طلبات':tab==='blocked'?'لا يوجد مستخدمون محظورون':'لا توجد محادثات بعد'}</p>}</div>
      </aside>
      <section className={`${conversation?'flex':'hidden md:flex'} min-w-0 flex-1 flex-col`}>
      {active ? <>
        <div className="flex shrink-0 items-center gap-3 border-b border-border p-3"><Button variant="ghost" size="icon" aria-label="قائمة المحادثات" onClick={() => open()} className="md:hidden"><ArrowRight className="h-4 w-4" /></Button><Avatar src={active.avatar_url} name={active.display_name || active.username} className="h-10 w-10 shrink-0" /><span className="min-w-0 flex-1"><span className="block truncate font-bold">{active.display_name || active.username}</span><span className={`block truncate text-xs ${peerTyping ? 'text-primary' : peerOnline ? 'text-emerald-500' : 'text-muted-foreground'}`}>{peerTyping ? 'يكتب الآن…' : active.presence_hidden ? '' : peerOnline ? '● متصل الآن' : leftAgoLabel(active.last_seen_at)}</span></span><Button variant="ghost" size="sm" onClick={() => { if (window.confirm('حذف جميع الرسائل لديك ولديه الآن؟')) void clearHistory(active.id, true); }}><Eraser className="h-4 w-4" /><span className="hidden sm:inline">حذف لدى الطرفين</span></Button><Button variant="ghost" size="sm" disabled={change.isPending} onClick={() => { if (active.blocked_by_me || window.confirm('حظر هذا المستخدم ومنع التواصل معه؟')) change.mutate({ action:active.blocked_by_me?'unblock':'block', target:active.id }); }}><ShieldBan className="h-4 w-4" />{active.blocked_by_me?'إلغاء الحظر':'حظر'}</Button></div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-chat px-4 py-5 text-chat-foreground" aria-label="الرسائل" onClick={() => setSelected(undefined)}>
          {messages.hasNextPage && <Button variant="ghost" className="mb-3 w-full" disabled={messages.isFetchingNextPage} onClick={() => void messages.fetchNextPage()}>رسائل أقدم</Button>}
          {messages.isError && <p className="text-destructive">تعذر تحميل الرسائل</p>}
          {rows.map(m => { const mine=m.sender_id===user?.id; const quoted=m.reply_to?rows.find(x=>x.id===m.reply_to):undefined; const reacts=Object.values((m.reactions ?? {}) as Record<string,string>); const myReact=user?((m.reactions ?? {}) as Record<string,string>)[user.id]:undefined; return <div key={m.id} className={`mb-3 flex flex-col ${mine?'items-start':'items-end'}`}><div onClick={e => { e.stopPropagation(); if (!m.deleted_at) setSelected(selected===m.id?undefined:m.id); }} className={`relative max-w-[85%] cursor-pointer rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%] ${mine?'bg-primary text-primary-foreground':'bg-secondary text-secondary-foreground'}`}>{quoted && <div className="mb-1 border-s-2 border-current/60 ps-2 text-xs opacity-80"><span className="line-clamp-2">{quoted.deleted_at?'تم حذف الرسالة':quoted.body}</span></div>}<p className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{m.deleted_at?'تم حذف الرسالة':m.body}</p><div className="mt-1 flex items-center justify-end gap-2 text-[10px]">{m.edited_at && !m.deleted_at && <span>معدّلة</span>}<time dateTime={m.created_at}>{new Date(m.created_at).toLocaleString('ar', { month:'short',day:'numeric',hour:'2-digit',minute:'2-digit' })}</time>{mine && !m.deleted_at && <span title={m.read_at?'مقروءة':'تم الإرسال'} aria-label={m.read_at?'مقروءة':'تم الإرسال'}>{m.read_at?<CheckCheck className="h-3.5 w-3.5" />:<Check className="h-3.5 w-3.5" />}</span>}</div>{reacts.length>0 && <span className="absolute -bottom-3 end-2 rounded-full border border-border bg-background px-1.5 text-xs text-foreground">{[...new Set(reacts)].join('')}{reacts.length>1?` ${reacts.length}`:''}</span>}</div>{selected===m.id && !blocked && <div className="mt-4 flex flex-wrap items-center gap-1 rounded-full border border-border bg-background p-1 text-foreground shadow-md" onClick={e => e.stopPropagation()}>{['👍','❤️','😂','😮','😢','🙏'].map(em => <button key={em} type="button" aria-label={`تفاعل ${em}`} className={`rounded-full px-1.5 text-lg ${myReact===em?'bg-secondary':''}`} onClick={() => { setSelected(undefined); void extra('react', m.id, myReact===em?null:em).catch(e => toast.error(e.message)); }}>{em}</button>)}{active.status==='accepted' && <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="رد" onClick={() => { setReplyTo(m.id); setEditing(undefined); setSelected(undefined); }}><Reply className="h-4 w-4" /></Button>}{mine && <><Button size="icon" variant="ghost" className="h-7 w-7" aria-label="تعديل" onClick={() => { setEditing(m.id); setReplyTo(undefined); setDraft(m.body ?? ''); setSelected(undefined); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="h-7 w-7" aria-label="حذف الرسالة لدى الطرفين" disabled={change.isPending} onClick={() => { setSelected(undefined); if(window.confirm('حذف الرسالة لدى الطرفين؟')) change.mutate({ action:'delete',target:m.id }); }}><Trash2 className="h-4 w-4" /></Button></>}</div>}</div>; })}
          {!rows.length && !messages.isPending && <p className="py-8 text-center text-sm text-muted-foreground">{active.status==='accepted'?'لا توجد رسائل بعد':'بانتظار قبول طلب الصداقة'}</p>}<div ref={end} />
        </div>
        {blocked ? <p className="border-t border-border p-4 text-center text-sm text-muted-foreground">التواصل محظور</p> : active.status==='accepted' ? <form className="relative flex shrink-0 items-end gap-2 border-t border-border bg-background p-3 pb-[max(12px,env(safe-area-inset-bottom))]" onSubmit={e => { e.preventDefault(); if(!draft.trim()) return; if (editing) { const id = editing; void extra('edit', id, draft.trim()).then(() => { setEditing(undefined); setDraft(''); }).catch(err => toast.error(err.message)); return; } change.mutate({ action:'send',target:active.id,body:draft }); }}>{(replyTo || editing) && <div className="absolute inset-x-0 bottom-full flex items-center gap-2 border-t border-border bg-background px-3 py-2 text-xs">{editing ? <Pencil className="h-3.5 w-3.5" /> : <Reply className="h-3.5 w-3.5" />}<span className="min-w-0 flex-1 truncate">{editing ? 'تعديل الرسالة' : `رد على: ${rows.find(x=>x.id===replyTo)?.body ?? ''}`}</span><Button type="button" size="icon" variant="ghost" className="h-6 w-6" aria-label="إلغاء" onClick={() => { if (editing) setDraft(''); setEditing(undefined); setReplyTo(undefined); }}><X className="h-3.5 w-3.5" /></Button></div>}<textarea aria-label="اكتب رسالة" placeholder="اكتب رسالة…" rows={2} maxLength={4000} value={draft} onChange={e => { setDraft(e.target.value); sendTyping(); }} className="max-h-32 min-h-12 flex-1 resize-none rounded-lg border border-input bg-secondary px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /><Button size="icon" type="submit" aria-label="إرسال الرسالة" disabled={!draft.trim() || change.isPending}><Send className="h-5 w-5" /></Button></form> : <div className="border-t border-border p-3 text-center text-sm text-muted-foreground">{active.status==='rejected'?'تم رفض الطلب':active.recipient_id===user?.id?<div className="flex justify-center gap-2"><Button disabled={change.isPending} onClick={() => change.mutate({action:'accept',target:active.id})}>قبول الطلب</Button><Button variant="outline" disabled={change.isPending} onClick={() => change.mutate({action:'reject',target:active.id})}>رفض</Button></div>:'طلبك قيد الانتظار'}</div>}
      </> : <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground"><MessageCircle className="h-12 w-12" /><p>{conversation?'المحادثة غير متاحة':'المحادثات الخاصة'}</p></div>}
      </section>
    </div>
  </div>;
}
function playTone() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx(); const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(880, ctx.currentTime); o.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.36); o.onended = () => void ctx.close();
  } catch { /* audio unavailable */ }
}
