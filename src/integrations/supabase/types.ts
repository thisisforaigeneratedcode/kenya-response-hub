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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          id: string
          incident_id: string
          recipient: string | null
          sent_at: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          incident_id: string
          recipient?: string | null
          sent_at?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          incident_id?: string
          recipient?: string | null
          sent_at?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assigned_at: string
          id: string
          incident_id: string
          notes: string | null
          responder_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          incident_id: string
          notes?: string | null
          responder_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          incident_id?: string
          notes?: string | null
          responder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          ai_affected_count: number | null
          ai_flood_type: string | null
          ai_reasoning: string | null
          ai_safety_guide: string | null
          ai_score: number | null
          ai_severity: number | null
          county: string
          created_at: string
          description: string
          id: string
          incident_type: string
          lat: number | null
          lng: number | null
          photo_url: string | null
          reporter_id: string
          safety_tips: Json | null
          severity_self: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_affected_count?: number | null
          ai_flood_type?: string | null
          ai_reasoning?: string | null
          ai_safety_guide?: string | null
          ai_score?: number | null
          ai_severity?: number | null
          county: string
          created_at?: string
          description: string
          id?: string
          incident_type: string
          lat?: number | null
          lng?: number | null
          photo_url?: string | null
          reporter_id: string
          safety_tips?: Json | null
          severity_self?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_affected_count?: number | null
          ai_flood_type?: string | null
          ai_reasoning?: string | null
          ai_safety_guide?: string | null
          ai_score?: number | null
          ai_severity?: number | null
          county?: string
          created_at?: string
          description?: string
          id?: string
          incident_type?: string
          lat?: number | null
          lng?: number | null
          photo_url?: string | null
          reporter_id?: string
          safety_tips?: Json | null
          severity_self?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          incident_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          incident_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          incident_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          county: string
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: string
          user_id: string
        }
        Insert: {
          county: string
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          role?: string
          user_id: string
        }
        Update: {
          county?: string
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      shelters: {
        Row: {
          capacity: number | null
          contact: string | null
          county: string
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          type: string | null
        }
        Insert: {
          capacity?: number | null
          contact?: string | null
          county: string
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
          type?: string | null
        }
        Update: {
          capacity?: number | null
          contact?: string | null
          county?: string
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
