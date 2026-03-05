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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          liked_id: string
          liker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked_id: string
          liker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked_id?: string
          liker_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          flag_reason: string | null
          id: string
          is_flagged: boolean | null
          is_read: boolean
          match_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_read?: boolean
          match_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_read?: boolean
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_verifications: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          credits_month_key: string | null
          credits_purchased_cents_month: number | null
          date_of_birth: string | null
          dating_mode: string | null
          dealbreakers: string[] | null
          email: string | null
          favorite_artists: string[] | null
          favorite_genres: string[] | null
          favorite_song: string | null
          first_name: string | null
          gender: string | null
          hobbies: string[] | null
          id: string
          is_verified: boolean | null
          last_initial: string | null
          latitude: number | null
          lifestyle_badges: string[] | null
          longitude: number | null
          love_language: string | null
          message_credits: number
          music_taste: string | null
          personality_badges: string[] | null
          phone: string | null
          photos: string[] | null
          preferred_age_max: number | null
          preferred_age_min: number | null
          prompt_answers: Json | null
          stripe_customer_id: string | null
          subscription_end: string | null
          subscription_tier: string | null
          todays_note: string | null
          updated_at: string
          user_id: string
          verification_session_id: string | null
          verification_status: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          credits_month_key?: string | null
          credits_purchased_cents_month?: number | null
          date_of_birth?: string | null
          dating_mode?: string | null
          dealbreakers?: string[] | null
          email?: string | null
          favorite_artists?: string[] | null
          favorite_genres?: string[] | null
          favorite_song?: string | null
          first_name?: string | null
          gender?: string | null
          hobbies?: string[] | null
          id?: string
          is_verified?: boolean | null
          last_initial?: string | null
          latitude?: number | null
          lifestyle_badges?: string[] | null
          longitude?: number | null
          love_language?: string | null
          message_credits?: number
          music_taste?: string | null
          personality_badges?: string[] | null
          phone?: string | null
          photos?: string[] | null
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          prompt_answers?: Json | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_tier?: string | null
          todays_note?: string | null
          updated_at?: string
          user_id: string
          verification_session_id?: string | null
          verification_status?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          credits_month_key?: string | null
          credits_purchased_cents_month?: number | null
          date_of_birth?: string | null
          dating_mode?: string | null
          dealbreakers?: string[] | null
          email?: string | null
          favorite_artists?: string[] | null
          favorite_genres?: string[] | null
          favorite_song?: string | null
          first_name?: string | null
          gender?: string | null
          hobbies?: string[] | null
          id?: string
          is_verified?: boolean | null
          last_initial?: string | null
          latitude?: number | null
          lifestyle_badges?: string[] | null
          longitude?: number | null
          love_language?: string | null
          message_credits?: number
          music_taste?: string | null
          personality_badges?: string[] | null
          phone?: string | null
          photos?: string[] | null
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          prompt_answers?: Json | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_tier?: string | null
          todays_note?: string | null
          updated_at?: string
          user_id?: string
          verification_session_id?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          context: string | null
          created_at: string
          id: string
          message_id: string | null
          reason: string
          reported_id: string
          reporter_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          reason: string
          reported_id: string
          reporter_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          reason?: string
          reported_id?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_gifts_sent: {
        Row: {
          created_at: string
          gift_emoji: string
          gift_id: string
          gift_name: string
          gift_price: number
          id: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          gift_emoji: string
          gift_id: string
          gift_name: string
          gift_price: number
          id?: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          gift_emoji?: string
          gift_id?: string
          gift_name?: string
          gift_price?: number
          id?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
