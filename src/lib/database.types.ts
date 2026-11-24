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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          color: string
          created_at: string
          id: string
          kind: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          kind: string
          name: string
          user_id?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          kind?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_items: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          day_of_month: number
          default_amount: number
          id: string
          kind: string
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          day_of_month?: number
          default_amount: number
          id?: string
          kind: string
          name: string
          user_id?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          day_of_month?: number
          default_amount?: number
          id?: string
          kind?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          due_date: string | null
          id: string
          is_fixed: boolean
          kind: string
          month: string
          name: string
          note: string | null
          paid_at: string | null
          recurring_id: string | null
          status: string
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_fixed?: boolean
          kind: string
          month: string
          name: string
          note?: string | null
          paid_at?: string | null
          recurring_id?: string | null
          status?: string
          user_id?: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_fixed?: boolean
          kind?: string
          month?: string
          name?: string
          note?: string | null
          paid_at?: string | null
          recurring_id?: string | null
          status?: string
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_snapshots: {
        Row: {
          balance: number
          day: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          balance: number
          day: string
          user_id?: string
          wallet_id: string
        }
        Update: {
          balance?: number
          day?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_snapshots_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          archived: boolean
          balance: number
          created_at: string
          id: string
          last_pnl: number | null
          last_synced_at: string | null
          name: string
          sheet_balance_cell: string
          sheet_csv_url: string | null
          sheet_pnl_cell: string
          source: string
          type: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          balance?: number
          created_at?: string
          id?: string
          last_pnl?: number | null
          last_synced_at?: string | null
          name: string
          sheet_balance_cell?: string
          sheet_csv_url?: string | null
          sheet_pnl_cell?: string
          source?: string
          type: string
          user_id?: string
        }
        Update: {
          archived?: boolean
          balance?: number
          created_at?: string
          id?: string
          last_pnl?: number | null
          last_synced_at?: string | null
          name?: string
          sheet_balance_cell?: string
          sheet_csv_url?: string | null
          sheet_pnl_cell?: string
          source?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_category_totals: {
        Row: {
          category: string | null
          category_id: string | null
          color: string | null
          kind: string | null
          month: string | null
          paid: number | null
          total: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      v_month_totals: {
        Row: {
          expense: number | null
          income: number | null
          month: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_month: { Args: { p_month: string }; Returns: number }
      get_dashboard: {
        Args: { p_month: string }
        Returns: {
          available: number
          pending_expenses: number
          pending_income: number
          poker_pnl: number
          total_balance: number
        }[]
      }
      get_net_worth_history: {
        Args: { p_months?: number }
        Returns: {
          month: string
          total: number
        }[]
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
