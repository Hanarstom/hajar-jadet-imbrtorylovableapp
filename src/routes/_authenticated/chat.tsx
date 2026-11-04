import { useEffect, useRef, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useInfiniteQuery, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { ArrowRight, Search, Send, Check, CheckCheck, Trash2, ShieldBan, Copy, MessageCircle, UserPlus, Eye, X } from 'lucide-react';
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
  const end = useRef<HTMLDivElement>(null);
  const active = state.data.find(f => f.id === conversation);
  const blocked = active?.blocked_by_me || active?.blocked_by_peer;
  const change = useMutation({
    mutationFn: ({ action, target, body }: { action: string; target?: string; body?: string }) => chatAction(action, target, action === 'request' ? code : undefined, body),
    onSuccess: (_, vars) => {
      if (vars.action === 'send') setDraft('');
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
        <div className="min-h-0 flex-1 overflow-y-auto">{list.map(f => <div key={f.id} className={`border-b border-border p-3 ${f.id===conversation?'bg-secondary':''}`}><Button variant="ghost" className="h-auto w-full justify-start gap-3 px-0 text-right" onClick={() => open(f.id)}><Avatar src={f.avatar_url} name={f.display_name || f.username} className="h-11 w-11 shrink-0" /><span className="min-w-0 flex-1"><span className="block truncate font-bold">{f.display_name || f.username}</span><span className="block truncate text-xs text-muted-foreground">{f.status==='pending' ? f.requester_id===user?.id?'طلب صادر • قيد الانتظار':'طلب وارد' : f.status==='rejected'?'طلب مرفوض':f.last_body || 'لا توجد رسائل'}</span></span>{Number(f.unread)>0 && <span className="text-xs font-bold text-primary">{f.unread}</span>}</Button>{f.status==='pending' && f.recipient_id===user?.id && !f.blocked_by_me && !f.blocked_by_peer && <div className="mt-2 flex gap-2"><Button size="sm" disabled={change.isPending} onClick={() => change.mutate({ action:'accept',target:f.id })}><Check className="h-4 w-4" />قبول</Button><Button size="sm" variant="outline" disabled={change.isPending} onClick={() => change.mutate({ action:'reject',target:f.id })}><X className="h-4 w-4" />رفض</Button></div>}</div>)}{!list.length && <p className="p-6 text-center text-sm text-muted-foreground">{tab==='requests'?'لا توجد طلبات':tab==='blocked'?'لا يوجد مستخدمون محظورون':'لا توجد محادثات بعد'}</p>}</div>
      </aside>
      <section className={`${conversation?'flex':'hidden md:flex'} min-w-0 flex-1 flex-col`}>
      {active ? <>
        <div className="flex shrink-0 items-center gap-3 border-b border-border p-3"><Button variant="ghost" size="icon" aria-label="قائمة المحادثات" onClick={() => open()} className="md:hidden"><ArrowRight className="h-4 w-4" /></Button><Avatar src={active.avatar_url} name={active.display_name || active.username} className="h-10 w-10 shrink-0" /><span className="min-w-0 flex-1 truncate font-bold">{active.display_name || active.username}</span><Button variant="ghost" size="sm" disabled={change.isPending} onClick={() => { if (active.blocked_by_me || window.confirm('حظر هذا المستخدم ومنع التواصل معه؟')) change.mutate({ action:active.blocked_by_me?'unblock':'block', target:active.id }); }}><ShieldBan className="h-4 w-4" />{active.blocked_by_me?'إلغاء الحظر':'حظر'}</Button></div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5" aria-label="الرسائل">
          {messages.hasNextPage && <Button variant="ghost" className="mb-3 w-full" disabled={messages.isFetchingNextPage} onClick={() => void messages.fetchNextPage()}>رسائل أقدم</Button>}
          {messages.isError && <p className="text-destructive">تعذر تحميل الرسائل</p>}
          {rows.map(m => { const mine=m.sender_id===user?.id; return <div key={m.id} className={`mb-3 flex ${mine?'justify-start':'justify-end'}`}><div className={`max-w-[85%] rounded-lg px-3 py-2 sm:max-w-[70%] ${mine?'bg-primary text-primary-foreground':'bg-secondary text-secondary-foreground'}`}><p className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{m.deleted_at?'تم حذف الرسالة':m.body}</p><div className="mt-1 flex items-center justify-end gap-2 text-[10px]"><time dateTime={m.created_at}>{new Date(m.created_at).toLocaleString('ar', { month:'short',day:'numeric',hour:'2-digit',minute:'2-digit' })}</time>{mine && !m.deleted_at && <><span title={m.read_at?'مقروءة':'تم الإرسال'} aria-label={m.read_at?'مقروءة':'تم الإرسال'}>{m.read_at?<CheckCheck className="h-3.5 w-3.5" />:<Check className="h-3.5 w-3.5" />}</span><Button variant="ghost" size="icon" className="h-6 w-6 text-inherit" aria-label="حذف الرسالة لدى الطرفين" disabled={change.isPending} onClick={() => { if(window.confirm('حذف الرسالة لدى الطرفين؟')) change.mutate({ action:'delete',target:m.id }); }}><Trash2 className="h-3 w-3" /></Button></>}</div></div></div>; })}
          {!rows.length && !messages.isPending && <p className="py-8 text-center text-sm text-muted-foreground">{active.status==='accepted'?'لا توجد رسائل بعد':'بانتظار قبول طلب الصداقة'}</p>}<div ref={end} />
        </div>
        {blocked ? <p className="border-t border-border p-4 text-center text-sm text-muted-foreground">التواصل محظور</p> : active.status==='accepted' ? <form className="flex shrink-0 items-end gap-2 border-t border-border bg-background p-3 pb-[max(12px,env(safe-area-inset-bottom))]" onSubmit={e => { e.preventDefault(); if(draft.trim()) change.mutate({ action:'send',target:active.id,body:draft }); }}><textarea aria-label="اكتب رسالة" placeholder="اكتب رسالة…" rows={2} maxLength={4000} value={draft} onChange={e => setDraft(e.target.value)} className="max-h-32 min-h-12 flex-1 resize-none rounded-lg border border-input bg-secondary px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /><Button size="icon" type="submit" aria-label="إرسال الرسالة" disabled={!draft.trim() || change.isPending}><Send className="h-5 w-5" /></Button></form> : <div className="border-t border-border p-3 text-center text-sm text-muted-foreground">{active.status==='rejected'?'تم رفض الطلب':active.recipient_id===user?.id?<div className="flex justify-center gap-2"><Button disabled={change.isPending} onClick={() => change.mutate({action:'accept',target:active.id})}>قبول الطلب</Button><Button variant="outline" disabled={change.isPending} onClick={() => change.mutate({action:'reject',target:active.id})}>رفض</Button></div>:'طلبك قيد الانتظار'}</div>}
      </> : <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground"><MessageCircle className="h-12 w-12" /><p>{conversation?'المحادثة غير متاحة':'المحادثات الخاصة'}</p></div>}
      </section>
    </div>
  </div>;
}