import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
export function AdminChatIds() {
  const [offset, setOffset] = useState(0);
  const ids = useQuery({ queryKey: ['admin-chat-ids', offset], queryFn: async () => {
    const { data, error } = await supabase.rpc('admin_chat_ids', { _offset: offset });
    if (error) throw new Error(error.message);
    return data ?? [];
  }, retry: false });
  return <section className="space-y-3 border-t border-border pt-4"><h2 className="font-bold">IDs المستخدمين — للإدارة فقط</h2>
    {ids.isError ? <p className="text-sm text-destructive">هذه القائمة متاحة لحساب المديرة فقط</p> : <div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead><tr><th className="p-2">المستخدم</th><th className="p-2">ID</th><th /></tr></thead><tbody>{ids.data?.map(row => <tr key={row.user_id} className="border-b border-border"><td className="p-2 break-words">{row.display_name || row.username}</td><td dir="ltr" className="p-2 font-mono">{row.code}</td><td><Button variant="ghost" size="icon" aria-label={`نسخ ID ${row.display_name || row.username}`} onClick={() => void navigator.clipboard.writeText(row.code).then(() => toast.success('تم نسخ ID')).catch(() => toast.error('تعذر النسخ'))}><Copy className="h-4 w-4" /></Button></td></tr>)}</tbody></table></div>}
    <div className="flex gap-2"><Button variant="outline" size="sm" disabled={!offset} onClick={() => setOffset(v => Math.max(0,v-50))}>السابق</Button><Button variant="outline" size="sm" disabled={ids.data?.length !== 50} onClick={() => setOffset(v => v+50)}>التالي</Button></div>
  </section>;
}