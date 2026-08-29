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
      disputes: {
        Row: {
          admin_notes: string | null;
          citation_id: string;
          created_at: string;
          id: string;
          reason: string;
          resolved_at: string | null;
          resolved_by: string | null;
          status: string;
        };
        Insert: {
          admin_notes?: string | null;
          citation_id: string;
          created_at?: string;
          id?: string;
          reason: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
        };
        Update: {
          admin_notes?: string | null;
          citation_id?: string;
          created_at?: string;
          id?: string;
          reason?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "disputes_citation_id_fkey";
            columns: ["citation_id"];
            isOneToOne: false;
            referencedRelation: "citations";
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
      vehicles: {
        Row: {
          chassis_number: string | null;
          color: string | null;
          contact_number: string | null;
          created_at: string;
          engine_number: string | null;
          id: string;
          lto_alarm_tagged: boolean;
          make_model: string;
          plate_number: string;
          registered_owner: string;
          registration_status: string;
          risk_level: string;
          updated_at: string;
          year: number | null;
        };
        Insert: {
          chassis_number?: string | null;
          color?: string | null;
          contact_number?: string | null;
          created_at?: string;
          engine_number?: string | null;
          id?: string;
          lto_alarm_tagged?: boolean;
          make_model: string;
          plate_number: string;
          registered_owner: string;
          registration_status?: string;
          risk_level?: string;
          updated_at?: string;
          year?: number | null;
        };
        Update: {
          chassis_number?: string | null;
          color?: string | null;
          contact_number?: string | null;
          created_at?: string;
          engine_number?: string | null;
          id?: string;
          lto_alarm_tagged?: boolean;
          make_model?: string;
          plate_number?: string;
          registered_owner?: string;
          registration_status?: string;
          risk_level?: string;
          updated_at?: string;
          year?: number | null;
        };
        Relationships: [];
      };
      hazard_reports: {
        Row: {
          category: string;
          contact_number: string | null;
          created_at: string;
          description: string;
          id: string;
          image_url: string | null;
          location: string;
          reporter_name: string;
          resolved_at: string | null;
          status: string;
        };
        Insert: {
          category: string;
          contact_number?: string | null;
          created_at?: string;
          description: string;
          id?: string;
          image_url?: string | null;
          location: string;
          reporter_name: string;
          resolved_at?: string | null;
          status?: string;
        };
        Update: {
          category?: string;
          contact_number?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          location?: string;
          reporter_name?: string;
          resolved_at?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      email_logs: {
        Row: {
          citation_number: string | null;
          error_message: string | null;
          id: string;
          recipient_email: string;
          recipient_name: string;
          sent_at: string;
          status: string;
          subject: string;
          template_name: string;
        };
        Insert: {
          citation_number?: string | null;
          error_message?: string | null;
          id?: string;
          recipient_email: string;
          recipient_name: string;
          sent_at?: string;
          status?: string;
          subject: string;
          template_name: string;
        };
        Update: {
          citation_number?: string | null;
          error_message?: string | null;
          id?: string;
          recipient_email?: string;
          recipient_name?: string;
          sent_at?: string;
          status?: string;
          subject?: string;
          template_name?: string;
        };
        Relationships: [];
      };
      traffic_advisories: {
        Row: {
          affected_corridor: string;
          created_at: string;
          id: string;
          is_active: boolean;
          message: string;
          severity: string;
          title: string;
        };
        Insert: {
          affected_corridor: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          message: string;
          severity?: string;
          title: string;
        };
        Update: {
          affected_corridor?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          message?: string;
          severity?: string;
          title?: string;
        };
        Relationships: [];
      };
      infrastructure_assets: {
        Row: {
          asset_type: string;
          created_at: string;
          id: string;
          last_inspected: string;
          location: string;
          name: string;
          next_maintenance: string | null;
          notes: string | null;
          status: string;
        };
        Insert: {
          asset_type: string;
          created_at?: string;
          id?: string;
          last_inspected?: string;
          location: string;
          name: string;
          next_maintenance?: string | null;
          notes?: string | null;
          status?: string;
        };
        Update: {
          asset_type?: string;
          created_at?: string;
          id?: string;
          last_inspected?: string;
          location?: string;
          name?: string;
          next_maintenance?: string | null;
          notes?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_name: string;
          actor_role: string;
          created_at: string;
          details: string | null;
          id: string;
          target_id: string | null;
          target_resource: string;
        };
        Insert: {
          action: string;
          actor_name: string;
          actor_role?: string;
          created_at?: string;
          details?: string | null;
          id?: string;
          target_id?: string | null;
          target_resource: string;
        };
        Update: {
          action?: string;
          actor_name?: string;
          actor_role?: string;
          created_at?: string;
          details?: string | null;
          id?: string;
          target_id?: string | null;
          target_resource?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          citation_id: string;
          created_at: string;
          id: string;
          method: string;
          payer_name: string | null;
          plate_number: string;
          proof_url: string | null;
          reference_number: string;
          status: string;
          submitted_date: string;
        };
        Insert: {
          amount: number;
          citation_id: string;
          created_at?: string;
          id?: string;
          method: string;
          payer_name?: string | null;
          plate_number: string;
          proof_url?: string | null;
          reference_number: string;
          status?: string;
          submitted_date?: string;
        };
        Update: {
          amount?: number;
          citation_id?: string;
          created_at?: string;
          id?: string;
          method?: string;
          payer_name?: string | null;
          plate_number?: string;
          proof_url?: string | null;
          reference_number?: string;
          status?: string;
          submitted_date?: string;
        };
        Relationships: [];
      };
      refunds: {
        Row: {
          amount: number;
          approved_date: string | null;
          citation_id: string;
          claimant: string;
          created_at: string;
          id: string;
          plate_number: string;
          reason: string;
          status: string;
        };
        Insert: {
          amount: number;
          approved_date?: string | null;
          citation_id: string;
          claimant: string;
          created_at?: string;
          id?: string;
          plate_number: string;
          reason: string;
          status?: string;
        };
        Update: {
          amount?: number;
          approved_date?: string | null;
          citation_id?: string;
          claimant?: string;
          created_at?: string;
          id?: string;
          plate_number?: string;
          reason?: string;
          status?: string;
        };
        Relationships: [];
      };
      revenue_reports: {
        Row: {
          citations: number;
          created_at: string;
          ev_charging: number;
          id: string;
          month: string;
          towing: number;
        };
        Insert: {
          citations?: number;
          created_at?: string;
          ev_charging?: number;
          id?: string;
          month: string;
          towing?: number;
        };
        Update: {
          citations?: number;
          created_at?: string;
          ev_charging?: number;
          id?: string;
          month?: string;
          towing?: number;
        };
        Relationships: [];
      };
      budget_allocations: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          id: string;
        };
        Insert: {
          amount: number;
          category: string;
          created_at?: string;
          id?: string;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          id?: string;
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
