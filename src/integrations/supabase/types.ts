export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      cameras: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          lat: number | null;
          lng: number | null;
          location: string;
          status: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          location: string;
          status?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          location?: string;
          status?: string;
        };
        Relationships: [];
      };
      citations: {
        Row: {
          amount: number;
          citation_number: string;
          id: string;
          issued_at: string;
          offense: string;
          officer_name: string | null;
          plate_number: string;
          status: string;
          vehicle_model: string | null;
          violation_id: string | null;
        };
        Insert: {
          amount?: number;
          citation_number: string;
          id?: string;
          issued_at?: string;
          offense: string;
          officer_name?: string | null;
          plate_number: string;
          status?: string;
          vehicle_model?: string | null;
          violation_id?: string | null;
        };
        Update: {
          amount?: number;
          citation_number?: string;
          id?: string;
          issued_at?: string;
          offense?: string;
          officer_name?: string | null;
          plate_number?: string;
          status?: string;
          vehicle_model?: string | null;
          violation_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "citations_violation_id_fkey";
            columns: ["violation_id"];
            isOneToOne: false;
            referencedRelation: "violations";
            referencedColumns: ["id"];
          },
        ];
      };
      dispatches: {
        Row: {
          acknowledged_at: string | null;
          badge_number: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          instructions: string | null;
          location: string;
          officer_id: string | null;
          officer_name: string | null;
          priority: string;
          reference: string;
          resolved_at: string | null;
          status: string;
          updated_at: string;
          violation_id: string | null;
        };
        Insert: {
          acknowledged_at?: string | null;
          badge_number?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          instructions?: string | null;
          location: string;
          officer_id?: string | null;
          officer_name?: string | null;
          priority?: string;
          reference?: string;
          resolved_at?: string | null;
          status?: string;
          updated_at?: string;
          violation_id?: string | null;
        };
        Update: {
          acknowledged_at?: string | null;
          badge_number?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          instructions?: string | null;
          location?: string;
          officer_id?: string | null;
          officer_name?: string | null;
          priority?: string;
          reference?: string;
          resolved_at?: string | null;
          status?: string;
          updated_at?: string;
          violation_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dispatches_officer_id_fkey";
            columns: ["officer_id"];
            isOneToOne: false;
            referencedRelation: "officers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dispatches_violation_id_fkey";
            columns: ["violation_id"];
            isOneToOne: false;
            referencedRelation: "violations";
            referencedColumns: ["id"];
          },
        ];
      };
      officers: {
        Row: {
          badge_number: string;
          citations_issued: number;
          contact_number: string | null;
          created_at: string;
          district: string;
          full_name: string;
          id: string;
          on_duty: boolean;
          rank: string;
          status: string;
          unit: string;
          updated_at: string;
        };
        Insert: {
          badge_number: string;
          citations_issued?: number;
          contact_number?: string | null;
          created_at?: string;
          district?: string;
          full_name: string;
          id?: string;
          on_duty?: boolean;
          rank?: string;
          status?: string;
          unit?: string;
          updated_at?: string;
        };
        Update: {
          badge_number?: string;
          citations_issued?: number;
          contact_number?: string | null;
          created_at?: string;
          district?: string;
          full_name?: string;
          id?: string;
          on_duty?: boolean;
          rank?: string;
          status?: string;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      violations: {
        Row: {
          ai_detected: boolean;
          camera_code: string | null;
          confidence: number;
          created_at: string;
          detected_at: string;
          evidence_url: string | null;
          id: string;
          location: string;
          plate_number: string;
          status: string;
          violation_type: string;
        };
        Insert: {
          ai_detected?: boolean;
          camera_code?: string | null;
          confidence?: number;
          created_at?: string;
          detected_at?: string;
          evidence_url?: string | null;
          id?: string;
          location: string;
          plate_number: string;
          status?: string;
          violation_type: string;
        };
        Update: {
          ai_detected?: boolean;
          camera_code?: string | null;
          confidence?: number;
          created_at?: string;
          detected_at?: string;
          evidence_url?: string | null;
          id?: string;
          location?: string;
          plate_number?: string;
          status?: string;
          violation_type?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
