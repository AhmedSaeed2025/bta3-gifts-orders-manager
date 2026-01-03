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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_order_items: {
        Row: {
          created_at: string
          id: string
          item_discount: number | null
          order_id: string
          product_name: string
          product_size: string
          profit: number
          quantity: number
          total_price: number
          unit_cost: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_discount?: number | null
          order_id: string
          product_name: string
          product_size: string
          profit: number
          quantity: number
          total_price: number
          unit_cost: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          item_discount?: number | null
          order_id?: string
          product_name?: string
          product_size?: string
          profit?: number
          quantity?: number
          total_price?: number
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "admin_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_orders: {
        Row: {
          attached_image_url: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_method: string
          deposit: number | null
          discount: number | null
          governorate: string | null
          id: string
          notes: string | null
          order_date: string
          payment_method: string
          payments_received: number | null
          profit: number | null
          remaining_amount: number | null
          serial: string
          shipping_address: string | null
          shipping_cost: number | null
          shipping_status: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attached_image_url?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_method: string
          deposit?: number | null
          discount?: number | null
          governorate?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          payment_method: string
          payments_received?: number | null
          profit?: number | null
          remaining_amount?: number | null
          serial: string
          shipping_address?: string | null
          shipping_cost?: number | null
          shipping_status?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attached_image_url?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_method?: string
          deposit?: number | null
          discount?: number | null
          governorate?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          payment_method?: string
          payments_received?: number | null
          profit?: number | null
          remaining_amount?: number | null
          serial?: string
          shipping_address?: string | null
          shipping_cost?: number | null
          shipping_status?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          price: number
          product_id: string
          quantity: number
          size: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          price: number
          product_id: string
          quantity?: number
          size: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          price?: number
          product_id?: string
          quantity?: number
          size?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_payments: {
        Row: {
          amount: number
          created_at: string | null
          customer_name: string
          id: string
          notes: string | null
          order_id: string
          payment_date: string
          payment_method: string
          payment_status: string
          reference_number: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_name: string
          id?: string
          notes?: string | null
          order_id: string
          payment_date?: string
          payment_method: string
          payment_status?: string
          reference_number?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_name?: string
          id?: string
          notes?: string | null
          order_id?: string
          payment_date?: string
          payment_method?: string
          payment_status?: string
          reference_number?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_financial_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "customer_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_reviews: {
        Row: {
          created_at: string | null
          customer_name: string | null
          id: string
          image_url: string
          is_active: boolean | null
          rating: number | null
          review_text: string | null
          sort_order: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          rating?: number | null
          review_text?: string | null
          sort_order?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          rating?: number | null
          review_text?: string | null
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          cost: number
          id: string
          item_discount: number | null
          order_id: string
          price: number
          product_type: string
          profit: number
          quantity: number
          size: string
        }
        Insert: {
          cost: number
          id?: string
          item_discount?: number | null
          order_id: string
          price: number
          product_type: string
          profit: number
          quantity: number
          size: string
        }
        Update: {
          cost?: number
          id?: string
          item_discount?: number | null
          order_id?: string
          price?: number
          product_type?: string
          profit?: number
          quantity?: number
          size?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_financial_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          attached_image_url: string | null
          client_name: string
          date_created: string
          delivery_method: string
          deposit: number | null
          discount: number | null
          email: string | null
          governorate: string | null
          id: string
          notes: string | null
          payment_method: string
          payments_received: number | null
          phone: string
          profit: number
          remaining_amount: number | null
          serial: string
          shipping_cost: number | null
          status: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          attached_image_url?: string | null
          client_name: string
          date_created?: string
          delivery_method: string
          deposit?: number | null
          discount?: number | null
          email?: string | null
          governorate?: string | null
          id?: string
          notes?: string | null
          payment_method: string
          payments_received?: number | null
          phone: string
          profit: number
          remaining_amount?: number | null
          serial: string
          shipping_cost?: number | null
          status?: string
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          attached_image_url?: string | null
          client_name?: string
          date_created?: string
          delivery_method?: string
          deposit?: number | null
          discount?: number | null
          email?: string | null
          governorate?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          payments_received?: number | null
          phone?: string
          profit?: number
          remaining_amount?: number | null
          serial?: string
          shipping_cost?: number | null
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          is_primary: boolean
          product_id: string
          sort_order: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean
          product_id: string
          sort_order?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sizes: {
        Row: {
          cost: number
          id: string
          price: number
          product_id: string
          size: string
        }
        Insert: {
          cost: number
          id?: string
          price: number
          product_id: string
          size: string
        }
        Update: {
          cost?: number
          id?: string
          price?: number
          product_id?: string
          size?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sizes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          discount_percentage: number | null
          featured: boolean
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          sort_order: number | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          featured?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          sort_order?: number | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          featured?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          sort_order?: number | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      proposed_prices: {
        Row: {
          cost: number
          created_at: string
          id: string
          price: number
          product_type: string
          size: string
          user_id: string
        }
        Insert: {
          cost: number
          created_at?: string
          id?: string
          price: number
          product_type: string
          size: string
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          price?: number
          product_type?: string
          size?: string
          user_id?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          about_us: string | null
          accent_color: string | null
          account_holder: string | null
          account_number: string | null
          address: string | null
          bank_name: string | null
          bank_transfer: boolean | null
          cash_on_delivery: boolean | null
          contact_email: string | null
          contact_phone: string | null
          contact_phone_2: string | null
          cookie_policy: string | null
          created_at: string
          credit_cards: boolean | null
          customer_review_images: string[] | null
          customer_reviews_enabled: boolean | null
          default_language: string | null
          default_shipping_cost: number | null
          enable_banners: boolean | null
          enable_dark_mode: boolean | null
          estimated_delivery_time: string | null
          etisalat_flex: string | null
          facebook_url: string | null
          favicon_url: string | null
          footer_banner_link: string | null
          footer_banner_url: string | null
          free_shipping_enabled: boolean | null
          free_shipping_threshold: number | null
          hero_banner_link: string | null
          hero_banner_url: string | null
          iban: string | null
          id: string
          instagram_url: string | null
          is_active: boolean
          linkedin_url: string | null
          logo_url: string | null
          main_text: string | null
          mobile_wallets: boolean | null
          orange_money: string | null
          payment_instructions: string | null
          primary_color: string | null
          privacy_policy: string | null
          promo_banner_1_link: string | null
          promo_banner_1_url: string | null
          promo_banner_2_link: string | null
          promo_banner_2_url: string | null
          return_policy: string | null
          rtl_enabled: boolean | null
          secondary_color: string | null
          shipping_policy: string | null
          show_back_to_top: boolean | null
          show_out_of_stock: boolean | null
          show_prices: boolean | null
          show_product_prices: boolean | null
          show_product_sizes: boolean | null
          side_banner_1_link: string | null
          side_banner_1_url: string | null
          side_banner_2_link: string | null
          side_banner_2_url: string | null
          snapchat_url: string | null
          store_description: string | null
          store_name: string
          store_tagline: string | null
          telegram_url: string | null
          terms_conditions: string | null
          text_color: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          vodafone_cash: string | null
          whatsapp_catalog_url: string | null
          whatsapp_chat_url: string | null
          whatsapp_number: string | null
          youtube_url: string | null
        }
        Insert: {
          about_us?: string | null
          accent_color?: string | null
          account_holder?: string | null
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          bank_transfer?: boolean | null
          cash_on_delivery?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_phone_2?: string | null
          cookie_policy?: string | null
          created_at?: string
          credit_cards?: boolean | null
          customer_review_images?: string[] | null
          customer_reviews_enabled?: boolean | null
          default_language?: string | null
          default_shipping_cost?: number | null
          enable_banners?: boolean | null
          enable_dark_mode?: boolean | null
          estimated_delivery_time?: string | null
          etisalat_flex?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          footer_banner_link?: string | null
          footer_banner_url?: string | null
          free_shipping_enabled?: boolean | null
          free_shipping_threshold?: number | null
          hero_banner_link?: string | null
          hero_banner_url?: string | null
          iban?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          linkedin_url?: string | null
          logo_url?: string | null
          main_text?: string | null
          mobile_wallets?: boolean | null
          orange_money?: string | null
          payment_instructions?: string | null
          primary_color?: string | null
          privacy_policy?: string | null
          promo_banner_1_link?: string | null
          promo_banner_1_url?: string | null
          promo_banner_2_link?: string | null
          promo_banner_2_url?: string | null
          return_policy?: string | null
          rtl_enabled?: boolean | null
          secondary_color?: string | null
          shipping_policy?: string | null
          show_back_to_top?: boolean | null
          show_out_of_stock?: boolean | null
          show_prices?: boolean | null
          show_product_prices?: boolean | null
          show_product_sizes?: boolean | null
          side_banner_1_link?: string | null
          side_banner_1_url?: string | null
          side_banner_2_link?: string | null
          side_banner_2_url?: string | null
          snapchat_url?: string | null
          store_description?: string | null
          store_name?: string
          store_tagline?: string | null
          telegram_url?: string | null
          terms_conditions?: string | null
          text_color?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          vodafone_cash?: string | null
          whatsapp_catalog_url?: string | null
          whatsapp_chat_url?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Update: {
          about_us?: string | null
          accent_color?: string | null
          account_holder?: string | null
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          bank_transfer?: boolean | null
          cash_on_delivery?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_phone_2?: string | null
          cookie_policy?: string | null
          created_at?: string
          credit_cards?: boolean | null
          customer_review_images?: string[] | null
          customer_reviews_enabled?: boolean | null
          default_language?: string | null
          default_shipping_cost?: number | null
          enable_banners?: boolean | null
          enable_dark_mode?: boolean | null
          estimated_delivery_time?: string | null
          etisalat_flex?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          footer_banner_link?: string | null
          footer_banner_url?: string | null
          free_shipping_enabled?: boolean | null
          free_shipping_threshold?: number | null
          hero_banner_link?: string | null
          hero_banner_url?: string | null
          iban?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          linkedin_url?: string | null
          logo_url?: string | null
          main_text?: string | null
          mobile_wallets?: boolean | null
          orange_money?: string | null
          payment_instructions?: string | null
          primary_color?: string | null
          privacy_policy?: string | null
          promo_banner_1_link?: string | null
          promo_banner_1_url?: string | null
          promo_banner_2_link?: string | null
          promo_banner_2_url?: string | null
          return_policy?: string | null
          rtl_enabled?: boolean | null
          secondary_color?: string | null
          shipping_policy?: string | null
          show_back_to_top?: boolean | null
          show_out_of_stock?: boolean | null
          show_prices?: boolean | null
          show_product_prices?: boolean | null
          show_product_sizes?: boolean | null
          side_banner_1_link?: string | null
          side_banner_1_url?: string | null
          side_banner_2_link?: string | null
          side_banner_2_url?: string | null
          snapchat_url?: string | null
          store_description?: string | null
          store_name?: string
          store_tagline?: string | null
          telegram_url?: string | null
          terms_conditions?: string | null
          text_color?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          vodafone_cash?: string | null
          whatsapp_catalog_url?: string | null
          whatsapp_chat_url?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          order_serial: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          order_serial: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          order_serial?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_configs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
          webhook_key: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
          webhook_key?: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
          webhook_key?: string
          webhook_url?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          id: string
          order_serial: string | null
          request_data: Json
          response_message: string | null
          response_status: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_serial?: string | null
          request_data: Json
          response_message?: string | null
          response_status: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_serial?: string | null
          request_data?: Json
          response_message?: string | null
          response_status?: number
          user_id?: string
        }
        Relationships: []
      }
      workshop_payments: {
        Row: {
          actual_payment_date: string | null
          cost_amount: number
          created_at: string | null
          expected_payment_date: string | null
          id: string
          notes: string | null
          order_id: string
          payment_status: string
          product_name: string
          size_or_variant: string | null
          user_id: string
          workshop_name: string
        }
        Insert: {
          actual_payment_date?: string | null
          cost_amount: number
          created_at?: string | null
          expected_payment_date?: string | null
          id?: string
          notes?: string | null
          order_id: string
          payment_status?: string
          product_name: string
          size_or_variant?: string | null
          user_id: string
          workshop_name: string
        }
        Update: {
          actual_payment_date?: string | null
          cost_amount?: number
          created_at?: string | null
          expected_payment_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          payment_status?: string
          product_name?: string
          size_or_variant?: string | null
          user_id?: string
          workshop_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_financial_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "workshop_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      order_financial_view: {
        Row: {
          cash_flow_status: string | null
          client_name: string | null
          date_created: string | null
          financial_status: string | null
          net_profit_loss: number | null
          order_id: string | null
          order_status: string | null
          paid_workshop_cost: number | null
          selling_price: number | null
          serial: string | null
          total_customer_paid: number | null
          total_workshop_cost: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_serial_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "customer"
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
    Enums: {
      user_role: ["admin", "customer"],
    },
  },
} as const
