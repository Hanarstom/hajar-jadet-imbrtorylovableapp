ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL, ADD COLUMN IF NOT EXISTS edited_at timestamptz, ADD COLUMN IF NOT EXISTS reactions jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE OR REPLACE FUNCTION public.chat_message_extra(_action text,_message uuid,_body text DEFAULT NULL,_friendship uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); m public.chat_messages; f public.chat_friendships; peer uuid;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'يجب تسجيل الدخول'; END IF;
 IF _action='reply' THEN
  SELECT * INTO f FROM public.chat_friendships WHERE id=_friendship AND u IN(requester_id,recipient_id);
  IF f.id IS NULL OR NOT EXISTS(SELECT 1 FROM public.chat_messages WHERE id=_message AND friendship_id=f.id) THEN RAISE EXCEPTION 'الرسالة غير متاحة'; END IF;
  UPDATE public.chat_messages SET reply_to=_message WHERE id=(SELECT id FROM public.chat_messages WHERE friendship_id=f.id AND sender_id=u AND reply_to IS NULL AND created_at>now()-interval '30 seconds' ORDER BY created_at DESC LIMIT 1);
  RETURN;
 END IF;
 SELECT * INTO m FROM public.chat_messages WHERE id=_message;
 SELECT * INTO f FROM public.chat_friendships WHERE id=m.friendship_id AND u IN(requester_id,recipient_id);
 IF m.id IS NULL OR f.id IS NULL OR m.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'الرسالة غير متاحة'; END IF;
 peer:=CASE WHEN f.requester_id=u THEN f.recipient_id ELSE f.requester_id END;
 IF EXISTS(SELECT 1 FROM public.chat_blocks WHERE (blocker_id=u AND blocked_id=peer) OR (blocker_id=peer AND blocked_id=u)) THEN RAISE EXCEPTION 'التواصل محظور'; END IF;
 IF _action='edit' THEN
  IF m.sender_id<>u THEN RAISE EXCEPTION 'يمكنك تعديل رسائلك فقط'; END IF;
  IF _body IS NULL OR length(btrim(_body)) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'الرسالة بين 1 و4000 حرف'; END IF;
  UPDATE public.chat_messages SET body=btrim(_body),edited_at=now() WHERE id=m.id;
 ELSIF _action='react' THEN
  IF _body IS NULL THEN UPDATE public.chat_messages SET reactions=reactions-u::text WHERE id=m.id;
  ELSIF _body IN('👍','❤️','😂','😮','😢','🙏') THEN UPDATE public.chat_messages SET reactions=reactions||jsonb_build_object(u::text,_body) WHERE id=m.id;
  ELSE RAISE EXCEPTION 'تفاعل غير صالح'; END IF;
 ELSE RAISE EXCEPTION 'إجراء غير صالح'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.chat_message_extra(text,uuid,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.chat_message_extra(text,uuid,text,uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.clear_chat_history(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.clear_chat_history(uuid,boolean) TO authenticated;