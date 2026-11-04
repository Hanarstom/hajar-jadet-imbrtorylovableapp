import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

export const chatCode = z.string().regex(/^[0-9]{6}$/, 'أدخل ID من 6 أرقام');
export const chatBody = z.string().trim().min(1, 'اكتب رسالة').max(4000);
export type Friendship = { id: string; requester_id: string; recipient_id: string; status: 'pending' | 'accepted' | 'rejected'; peer_id: string; username: string; display_name: string; avatar_url: string | null; blocked_by_me: boolean; blocked_by_peer: boolean; last_body: string | null; last_message_at: string | null; unread: number; updated_at: string };
export type Peer = { id: string; username: string; display_name: string; avatar_url: string | null };
export async function chatAction(action: string, target?: string, code?: string, body?: string) {
  const { data, error } = await supabase.rpc('chat_action', { _action: action, ...target ? { _target: target } : {}, ...code ? { _code: chatCode.parse(code) } : {}, ...body !== undefined ? { _body: chatBody.parse(body) } : {} });
  if (error) throw new Error(error.message);
  const result = data as { id?: string; code?: string; error?: string } & Peer;
  if (result.error) throw new Error(result.error);
  return result;
}
export async function loadChatState() {
  const { data, error } = await supabase.rpc('chat_state');
  if (error) throw new Error(error.message);
  return (data as unknown as { friendships: Friendship[] }).friendships;
}
export const chatStateOptions = { queryKey: ['private-chat'], queryFn: loadChatState };