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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      community_donations: {
        Row: {
          condition: string
          contact: string | null
          created_at: string
          food_name: string
          id: string
          location: string | null
          message: string | null
          notify_nearby: boolean
          quantity: string
          unit: string | null
          user_id: string
        }
        Insert: {
          condition?: string
          contact?: string | null
          created_at?: string
          food_name: string
          id?: string
          location?: string | null
          message?: string | null
          notify_nearby?: boolean
          quantity: string
          unit?: string | null
          user_id: string
        }
        Update: {
          condition?: string
          contact?: string | null
          created_at?: string
          food_name?: string
          id?: string
          location?: string | null
          message?: string | null
          notify_nearby?: boolean
          quantity?: string
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_recipe_ratings: {
        Row: {
          created_at: string
          id: string
          note: string | null
          recipe_id: string
          stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          recipe_id: string
          stars: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          recipe_id?: string
          stars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "community_recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      community_recipes: {
        Row: {
          author_id: string
          author_name: string | null
          created_at: string
          id: string
          is_public: boolean
          lang: string
          likes: number
          moderation: string
          rating_avg: number
          rating_count: number
          recipe: Json
          remix_count: number
          remixed_from: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          lang?: string
          likes?: number
          moderation?: string
          rating_avg?: number
          rating_count?: number
          recipe: Json
          remix_count?: number
          remixed_from?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          lang?: string
          likes?: number
          moderation?: string
          rating_avg?: number
          rating_count?: number
          recipe?: Json
          remix_count?: number
          remixed_from?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_recipes_remixed_from_fkey"
            columns: ["remixed_from"]
            isOneToOne: false
            referencedRelation: "community_recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      community_requests: {
        Row: {
          contact: string | null
          created_at: string
          food_needed: string
          id: string
          location: string | null
          quantity: string
          unit: string | null
          urgency: string
          user_id: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          food_needed: string
          id?: string
          location?: string | null
          quantity: string
          unit?: string | null
          urgency?: string
          user_id: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          food_needed?: string
          id?: string
          location?: string | null
          quantity?: string
          unit?: string | null
          urgency?: string
          user_id?: string
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_user_id: string | null
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_user_id?: string | null
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      migration_probe: {
        Row: {
          id: number
        }
        Insert: {
          id: number
        }
        Update: {
          id?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      pantry_items: {
        Row: {
          category: string
          created_at: string
          expires_on: string | null
          freshness: string
          id: string
          name: string
          quantity: string | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          expires_on?: string | null
          freshness?: string
          id?: string
          name: string
          quantity?: string | null
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          expires_on?: string | null
          freshness?: string
          id?: string
          name?: string
          quantity?: string | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pantry_purchase: {
        Row: {
          created_at: string
          expected_expiry_date: string
          expected_usage: string | null
          id: string
          item_name: string
          purchase_date: string
          purchase_price: number
          quantity: number
          storage_type: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expected_expiry_date: string
          expected_usage?: string | null
          id?: string
          item_name: string
          purchase_date?: string
          purchase_price: number
          quantity: number
          storage_type: string
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expected_expiry_date?: string
          expected_usage?: string | null
          id?: string
          item_name?: string
          purchase_date?: string
          purchase_price?: number
          quantity?: number
          storage_type?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cook_time: string | null
          country: string | null
          created_at: string
          diet: string[]
          display_name: string | null
          id: string
          lang: string
          onboarded: boolean
          salt: string | null
          spice: string | null
          updated_at: string
        }
        Insert: {
          cook_time?: string | null
          country?: string | null
          created_at?: string
          diet?: string[]
          display_name?: string | null
          id: string
          lang?: string
          onboarded?: boolean
          salt?: string | null
          spice?: string | null
          updated_at?: string
        }
        Update: {
          cook_time?: string | null
          country?: string | null
          created_at?: string
          diet?: string[]
          display_name?: string | null
          id?: string
          lang?: string
          onboarded?: boolean
          salt?: string | null
          spice?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recipe_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          recipe_key: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          recipe_key: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          recipe_key?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_library: {
        Row: {
          created_at: string
          cuisine: string
          id: string
          ingredients: string | null
          method: string | null
          name: string
          name_key: string
          source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cuisine?: string
          id?: string
          ingredients?: string | null
          method?: string | null
          name: string
          name_key: string
          source?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cuisine?: string
          id?: string
          ingredients?: string | null
          method?: string | null
          name?: string
          name_key?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_recipes: {
        Row: {
          created_at: string
          id: string
          is_favourite: boolean
          recipe: Json
          servings: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_favourite?: boolean
          recipe: Json
          servings?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_favourite?: boolean
          recipe?: Json
          servings?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sharing_groups: {
        Row: {
          created_at: string
          created_by: string | null
          group_link: string
          group_name: string
          id: string
          last_activity: string
          member_count: number
          platform_type: string
          region: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          group_link: string
          group_name: string
          id?: string
          last_activity?: string
          member_count?: number
          platform_type?: string
          region?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          group_link?: string
          group_name?: string
          id?: string
          last_activity?: string
          member_count?: number
          platform_type?: string
          region?: string | null
        }
        Relationships: []
      }
      user_blocks: {
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
      user_preferences: {
        Row: {
          allergies: string | null
          appliances: string[]
          budget: string | null
          completed: boolean
          cook_time: string | null
          country: string | null
          created_at: string
          cuisines: string[]
          diet: string[]
          frequency: string | null
          healthy: string | null
          household_size: number | null
          living: string | null
          salt_level: number | null
          skill: string | null
          spice_level: number | null
          storage: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string | null
          appliances?: string[]
          budget?: string | null
          completed?: boolean
          cook_time?: string | null
          country?: string | null
          created_at?: string
          cuisines?: string[]
          diet?: string[]
          frequency?: string | null
          healthy?: string | null
          household_size?: number | null
          living?: string | null
          salt_level?: number | null
          skill?: string | null
          spice_level?: number | null
          storage?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string | null
          appliances?: string[]
          budget?: string | null
          completed?: boolean
          cook_time?: string | null
          country?: string | null
          created_at?: string
          cuisines?: string[]
          diet?: string[]
          frequency?: string | null
          healthy?: string | null
          household_size?: number | null
          living?: string | null
          salt_level?: number | null
          skill?: string | null
          spice_level?: number | null
          storage?: string | null
          updated_at?: string
          user_id?: string
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
    Enums: {},
  },
} as const
