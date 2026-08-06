-- Stories
CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
ALTER TABLE public.stories ADD CONSTRAINT stories_profile_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
GRANT SELECT ON public.stories TO anon;
GRANT SELECT, INSERT, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY stories_public_read ON public.stories FOR SELECT USING (true);
CREATE POLICY stories_insert_own ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY stories_delete_own ON public.stories FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX stories_expires_idx ON public.stories (expires_at DESC);

-- Threaded comments
ALTER TABLE public.comments ADD COLUMN parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;
CREATE INDEX comments_parent_idx ON public.comments (parent_id);

-- Reactions
CREATE TYPE public.reaction_type AS ENUM ('like', 'love', 'haha', 'sad');
CREATE TABLE public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.reaction_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT ON public.reactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY reactions_public_read ON public.reactions FOR SELECT USING (true);
CREATE POLICY reactions_insert_own ON public.reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY reactions_update_own ON public.reactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY reactions_delete_own ON public.reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX reactions_post_idx ON public.reactions (post_id);