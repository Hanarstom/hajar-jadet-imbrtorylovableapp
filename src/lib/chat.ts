import { supabase } from '@/integrations/supabase/client';
import { chatCode, chatBody } from './chat-schema';
export { chatCode, chatBody } from './chat-schema';
export type Friendship = { id: string; requester_id: string; recipient_id: string; status: 'pending' | 'accepted' | 'rejected'; peer_id: string; username: string; display_name: string; avatar_url: string | null; blocked_by_me: boolean; blocked_by_peer: boolean; last_body: string | null; last_message_at: string | null; unread: number; updated_at: string; last_seen_at: string | null; is_online: boolean; presence_hidden: boolean };
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