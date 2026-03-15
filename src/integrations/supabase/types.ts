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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          admin_username: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_id: string
          admin_username: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          admin_username?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      blockchain_events: {
        Row: {
          amount: number
          block_number: number | null
          confirmed: boolean | null
          created_at: string
          from_address: string
          id: string
          matched_at: string | null
          matched_request_type: string | null
          network: string
          offramp_request_id: string | null
          processed: boolean
          to_address: string
          token_address: string
          token_symbol: string
          transaction_hash: string
          webhook_source: string | null
        }
        Insert: {
          amount: number
          block_number?: number | null
          confirmed?: boolean | null
          created_at?: string
          from_address: string
          id?: string
          matched_at?: string | null
          matched_request_type?: string | null
          network?: string
          offramp_request_id?: string | null
          processed?: boolean
          to_address: string
          token_address: string
          token_symbol: string
          transaction_hash: string
          webhook_source?: string | null
        }
        Update: {
          amount?: number
          block_number?: number | null
          confirmed?: boolean | null
          created_at?: string
          from_address?: string
          id?: string
          matched_at?: string | null
          matched_request_type?: string | null
          network?: string
          offramp_request_id?: string | null
          processed?: boolean
          to_address?: string
          token_address?: string
          token_symbol?: string
          transaction_hash?: string
          webhook_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_events_offramp_request_id_fkey"
            columns: ["offramp_request_id"]
            isOneToOne: false
            referencedRelation: "offramp_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      blockchain_scan_state: {
        Row: {
          created_at: string
          error_count: number
          id: string
          is_scanning: boolean
          last_error: string | null
          last_scan_at: string | null
          last_scanned_block: number
          network: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_count?: number
          id?: string
          is_scanning?: boolean
          last_error?: string | null
          last_scan_at?: string | null
          last_scanned_block?: number
          network: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_count?: number
          id?: string
          is_scanning?: boolean
          last_error?: string | null
          last_scan_at?: string | null
          last_scanned_block?: number
          network?: string
          updated_at?: string
        }
        Relationships: []
      }
      blockchain_visibility: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          network_id: string
          network_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          network_id: string
          network_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          network_id?: string
          network_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          created_at: string
          flag_emoji: string | null
          id: string
          name: string
          phone_prefix: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          name: string
          phone_prefix: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          name?: string
          phone_prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      country_visibility: {
        Row: {
          country_code: string
          country_id: string
          country_name: string
          created_at: string
          id: string
          is_visible: boolean
          updated_at: string
        }
        Insert: {
          country_code: string
          country_id: string
          country_name: string
          created_at?: string
          id?: string
          is_visible?: boolean
          updated_at?: string
        }
        Update: {
          country_code?: string
          country_id?: string
          country_name?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "country_visibility_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: true
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          last_updated: string
          margin: number
          rate: number
          target_currency: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          id?: string
          last_updated?: string
          margin?: number
          rate: number
          target_currency?: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          last_updated?: string
          margin?: number
          rate?: number
          target_currency?: string
        }
        Relationships: []
      }
      mobile_operators: {
        Row: {
          country_id: string
          created_at: string
          deposit_number: string | null
          id: string
          name: string
          number_patterns: string[]
          updated_at: string
        }
        Insert: {
          country_id: string
          created_at?: string
          deposit_number?: string | null
          id?: string
          name: string
          number_patterns: string[]
          updated_at?: string
        }
        Update: {
          country_id?: string
          created_at?: string
          deposit_number?: string | null
          id?: string
          name?: string
          number_patterns?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobile_operators_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      offramp_requests: {
        Row: {
          amount: number
          bsc_address: string
          country_id: string | null
          created_at: string
          exchange_rate: number
          id: string
          link_expires_at: string | null
          momo_number: string
          momo_provider: string | null
          notes: string | null
          paid_via_link: boolean | null
          payment_link_token: string | null
          reference_id: string
          request_ip: string | null
          requester_info: Json | null
          requester_name: string | null
          status: string
          token: string
          transaction_hash: string | null
          updated_at: string
          usd_amount: number
          xof_amount: number
        }
        Insert: {
          amount: number
          bsc_address?: string
          country_id?: string | null
          created_at?: string
          exchange_rate: number
          id?: string
          link_expires_at?: string | null
          momo_number: string
          momo_provider?: string | null
          notes?: string | null
          paid_via_link?: boolean | null
          payment_link_token?: string | null
          reference_id: string
          request_ip?: string | null
          requester_info?: Json | null
          requester_name?: string | null
          status?: string
          token: string
          transaction_hash?: string | null
          updated_at?: string
          usd_amount: number
          xof_amount: number
        }
        Update: {
          amount?: number
          bsc_address?: string
          country_id?: string | null
          created_at?: string
          exchange_rate?: number
          id?: string
          link_expires_at?: string | null
          momo_number?: string
          momo_provider?: string | null
          notes?: string | null
          paid_via_link?: boolean | null
          payment_link_token?: string | null
          reference_id?: string
          request_ip?: string | null
          requester_info?: Json | null
          requester_name?: string | null
          status?: string
          token?: string
          transaction_hash?: string | null
          updated_at?: string
          usd_amount?: number
          xof_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "offramp_requests_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      onramp_requests: {
        Row: {
          country_id: string | null
          created_at: string
          crypto_amount: number
          exchange_rate: number
          id: string
          link_expires_at: string | null
          momo_number: string
          momo_provider: string | null
          notes: string | null
          paid_via_link: boolean | null
          payment_link_token: string | null
          recipient_address: string
          reference_id: string
          request_ip: string | null
          requester_info: Json | null
          requester_name: string | null
          status: string
          token: string
          transaction_hash: string | null
          updated_at: string
          usd_amount: number
          xof_amount: number
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          crypto_amount: number
          exchange_rate: number
          id?: string
          link_expires_at?: string | null
          momo_number: string
          momo_provider?: string | null
          notes?: string | null
          paid_via_link?: boolean | null
          payment_link_token?: string | null
          recipient_address: string
          reference_id: string
          request_ip?: string | null
          requester_info?: Json | null
          requester_name?: string | null
          status?: string
          token: string
          transaction_hash?: string | null
          updated_at?: string
          usd_amount: number
          xof_amount: number
        }
        Update: {
          country_id?: string | null
          created_at?: string
          crypto_amount?: number
          exchange_rate?: number
          id?: string
          link_expires_at?: string | null
          momo_number?: string
          momo_provider?: string | null
          notes?: string | null
          paid_via_link?: boolean | null
          payment_link_token?: string | null
          recipient_address?: string
          reference_id?: string
          request_ip?: string | null
          requester_info?: Json | null
          requester_name?: string | null
          status?: string
          token?: string
          transaction_hash?: string | null
          updated_at?: string
          usd_amount?: number
          xof_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "onramp_requests_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_admin_jwt: {
        Args: { p_admin_id: string; p_username: string }
        Returns: string
      }
      generate_transaction_reference: {
        Args: { prefix?: string }
        Returns: string
      }
      get_request_stats: { Args: never; Returns: Json }
      is_admin_user: { Args: never; Returns: boolean }
      reminder_configure_otp_expiry: { Args: never; Returns: undefined }
      validate_admin_jwt: { Args: { p_token: string }; Returns: boolean }
      verify_admin_credentials: {
        Args: { p_password: string; p_username: string }
        Returns: boolean
      }
      verify_admin_password: {
        Args: { p_password: string; p_username: string }
        Returns: boolean
      }
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
