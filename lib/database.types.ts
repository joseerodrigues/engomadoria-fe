export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      package_plans: {
        Row: { id: string; name_pt: string; monthly_credits: number; is_active: boolean };
        Insert: { id: string; name_pt: string; monthly_credits: number; is_active?: boolean };
        Update: { id?: string; name_pt?: string; monthly_credits?: number; is_active?: boolean };
        Relationships: [];
      };
      garment_types: {
        Row: { id: string; name_pt: string; singular_pt: string; credits_per_piece: number; icon: string; is_active: boolean };
        Insert: { id: string; name_pt: string; singular_pt: string; credits_per_piece: number; icon: string; is_active?: boolean };
        Update: { id?: string; name_pt?: string; singular_pt?: string; credits_per_piece?: number; icon?: string; is_active?: boolean };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: number;
          occurred_at: string;
          actor_id: string | null;
          subject_customer_id: string | null;
          table_schema: string;
          table_name: string;
          operation: "INSERT" | "UPDATE" | "DELETE";
          record_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
        };
        Insert: {
          id?: number;
          occurred_at?: string;
          actor_id?: string | null;
          subject_customer_id?: string | null;
          table_schema: string;
          table_name: string;
          operation: "INSERT" | "UPDATE" | "DELETE";
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
        };
        Update: {
          id?: number;
          occurred_at?: string;
          actor_id?: string | null;
          subject_customer_id?: string | null;
          table_schema?: string;
          table_name?: string;
          operation?: "INSERT" | "UPDATE" | "DELETE";
          record_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
        };
        Relationships: [];
      };
      customer_packages: {
        Row: { id: string; customer_id: string; plan_id: string; valid_from: string; valid_until: string | null; status: "active" | "ended" };
        Insert: { id?: string; customer_id: string; plan_id: string; valid_from?: string; valid_until?: string | null; status?: "active" | "ended" };
        Update: { id?: string; customer_id?: string; plan_id?: string; valid_from?: string; valid_until?: string | null; status?: "active" | "ended" };
        Relationships: [];
      };
      deliveries: {
        Row: { id: string; customer_id: string; customer_package_id: string; delivered_on: string; created_at: string };
        Insert: { id?: string; customer_id: string; customer_package_id: string; delivered_on?: string; created_at?: string };
        Update: { id?: string; customer_id?: string; customer_package_id?: string; delivered_on?: string; created_at?: string };
        Relationships: [];
      };
      delivery_items: {
        Row: { id: string; delivery_id: string; garment_type_id: string; garment_name_snapshot: string; quantity: number; credits_per_piece_snapshot: number };
        Insert: { id?: string; delivery_id: string; garment_type_id: string; garment_name_snapshot: string; quantity: number; credits_per_piece_snapshot: number };
        Update: { id?: string; delivery_id?: string; garment_type_id?: string; garment_name_snapshot?: string; quantity?: number; credits_per_piece_snapshot?: number };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_delivery: { Args: { p_delivered_on: string; p_items: Json }; Returns: string };
      update_delivery: { Args: { p_delivery_id: string; p_delivered_on: string; p_items: Json }; Returns: undefined };
      delete_delivery: { Args: { p_delivery_id: string }; Returns: undefined };
      switch_customer_plan: { Args: { p_plan_id: string }; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
