export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      chat_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_friendships: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_friendships_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_history_clears: {
        Row: {
          cleared_at: string
          friendship_id: string
          user_id: string
        }
        Insert: {
          cleared_at?: string
          friendship_id: string
          user_id: string
        }
        Update: {
          cleared_at?: string
          friendship_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_history_clears_friendship_id_fkey"
            columns: ["friendship_id"]
            isOneToOne: false
            referencedRelation: "chat_friendships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_history_clears_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_ids: {
        Row: {
          code: string
          user_id: string
        }
        Insert: {
          code: string
          user_id: string
        }
        Update: {
          code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_ids_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_lookup_limits: {
        Row: {
          attempts: number
          user_id: string
          window_start: string
        }
        Insert: {
          attempts?: number
          user_id: string
          window_start?: string
        }
        Update: {
          attempts?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          body: string | null
          created_at: string
          deleted_at: string | null
          friendship_id: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          friendship_id: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          friendship_id?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_friendship_id_fkey"
            columns: ["friendship_id"]
            isOneToOne: false
            referencedRelation: "chat_friendships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_preferences: {
        Row: {
          hide_presence: boolean
          sound_enabled: boolean
          user_id: string
        }
        Insert: {
          hide_presence?: boolean
          sound_enabled?: boolean
          user_id: string
        }
        Update: {
          hide_presence?: boolean
          sound_enabled?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_profile_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_activity: {
        Row: {
          day: string
          reels_posted: number
          user_id: string
          watch_seconds: number
        }
        Insert: {
          day?: string
          reels_posted?: number
          user_id: string
          watch_seconds?: number
        }
        Update: {
          day?: string
          reels_posted?: number
          user_id?: string
          watch_seconds?: number
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          chat_id: string | null
          created_at: string
          id: string
          is_read: boolean
          meta: string | null
          post_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          chat_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          meta?: string | null
          post_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          chat_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          meta?: string | null
          post_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_ads: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_active: boolean
          link_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          link_url?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          link_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_views: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          hashtags: string | null
          id: string
          platform: string
          user_id: string
          video_url: string | null
          views_count: number
        }
        Insert: {
          content?: string
          created_at?: string
          hashtags?: string | null
          id?: string
          platform?: string
          user_id: string
          video_url?: string | null
          views_count?: number
        }
        Update: {
          content?: string
          created_at?: string
          hashtags?: string | null
          id?: string
          platform?: string
          user_id?: string
          video_url?: string | null
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_profile_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country_code: string | null
          created_at: string
          display_name: string
          gender: string | null
          id: string
          is_online: boolean
          is_verified: boolean
          last_seen_at: string
          profile_views: number
          reels_watched: number
          referral_code: string | null
          referred_by: string | null
          total_views: number
          username: string
          verification_status: string
          watch_hours: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string
          gender?: string | null
          id: string
          is_online?: boolean
          is_verified?: boolean
          last_seen_at?: string
          profile_views?: number
          reels_watched?: number
          referral_code?: string | null
          referred_by?: string | null
          total_views?: number
          username: string
          verification_status?: string
          watch_hours?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string
          gender?: string | null
          id?: string
          is_online?: boolean
          is_verified?: boolean
          last_seen_at?: string
          profile_views?: number
          reels_watched?: number
          referral_code?: string | null
          referred_by?: string | null
          total_views?: number
          username?: string
          verification_status?: string
          watch_hours?: number
        }
        Relationships: []
      }
      push_deliveries: {
        Row: {
          attempts: number
          event_id: string
          lease_until: string | null
          response_status: number | null
          status: string
          subscription_id: string
        }
        Insert: {
          attempts?: number
          event_id: string
          lease_until?: string | null
          response_status?: number | null
          status?: string
          subscription_id: string
        }
        Update: {
          attempts?: number
          event_id?: string
          lease_until?: string | null
          response_status?: number | null
          status?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_deliveries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "push_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_deliveries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      push_events: {
        Row: {
          actor_id: string
          chat_id: string | null
          created_at: string
          id: string
          kind: string
          notification_id: string | null
          post_id: string | null
          recipient_id: string | null
          secret: string
        }
        Insert: {
          actor_id: string
          chat_id?: string | null
          created_at?: string
          id?: string
          kind: string
          notification_id?: string | null
          post_id?: string | null
          recipient_id?: string | null
          secret?: string
        }
        Update: {
          actor_id?: string
          chat_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          notification_id?: string | null
          post_id?: string | null
          recipient_id?: string | null
          secret?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          type: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          type: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          type?: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_watches: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_watches_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          activity_reward_paid: boolean
          created_at: string
          device_fingerprint: string | null
          id: string
          invited_id: string
          inviter_id: string
          signup_reward_paid: boolean
          status: string
        }
        Insert: {
          activity_reward_paid?: boolean
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          invited_id: string
          inviter_id: string
          signup_reward_paid?: boolean
          status?: string
        }
        Update: {
          activity_reward_paid?: boolean
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          invited_id?: string
          inviter_id?: string
          signup_reward_paid?: boolean
          status?: string
        }
        Relationships: []
      }
      saves: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          body: string
          created_at: string
          expires_at: string
          id: string
          image_url: string | null
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_profile_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_balances: {
        Row: {
          balance: number
          user_id: string
        }
        Insert: {
          balance?: number
          user_id: string
        }
        Update: {
          balance?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      verifications: {
        Row: {
          created_at: string
          gender: string
          photo_path: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gender: string
          photo_path: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gender?: string
          photo_path?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          note: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          binance_id: string
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          binance_id: string
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          binance_id?: string
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_chat_ids: {
        Args: { _offset?: number }
        Returns: {
          code: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      chat_action: {
        Args: {
          _action: string
          _body?: string
          _code?: string
          _target?: string
        }
        Returns: Json
      }
      chat_state: { Args: never; Returns: Json }
      claim_push_deliveries: {
        Args: { _event: string }
        Returns: {
          attempts: number
          event_id: string
          lease_until: string | null
          response_status: number | null
          status: string
          subscription_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "push_deliveries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      clear_chat_history: {
        Args: { _both?: boolean; _friendship: string }
        Returns: undefined
      }
      evaluate_referral_activity: {
        Args: { _user: string }
        Returns: undefined
      }
      has_chat_admin_role: { Args: never; Returns: boolean }
      leaderboard_24h: {
        Args: never
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          score: number
          username: string
        }[]
      }
      notify_followers: {
        Args: { _meta: string; _post_id: string; _type: string }
        Returns: undefined
      }
      purge_expired_chat: { Args: never; Returns: undefined }
      record_watch_time: { Args: { _seconds: number }; Returns: undefined }
      register_post_view: { Args: { _post_id: string }; Returns: undefined }
      register_profile_view: {
        Args: { _profile_id: string }
        Returns: undefined
      }
      register_reel_watch: { Args: { _post_id: string }; Returns: undefined }
      request_withdrawal: {
        Args: { _amount: number; _binance_id: string }
        Returns: string
      }
      submit_verification: {
        Args: { _gender: string; _photo_path: string }
        Returns: string
      }
      touch_presence: { Args: never; Returns: undefined }
    }
    Enums: {
      reaction_type: "like" | "love" | "haha" | "sad"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      reaction_type: ["like", "love", "haha", "sad"],
    },
  },
} as const
