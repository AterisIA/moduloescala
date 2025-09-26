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
      access_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      action_logs: {
        Row: {
          acao: string
          created_at: string | null
          descricao: string | null
          id: string
          id_contato: string
        }
        Insert: {
          acao: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          id_contato: string
        }
        Update: {
          acao?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          id_contato?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_logs_id_contato_fkey"
            columns: ["id_contato"]
            isOneToOne: false
            referencedRelation: "contatos_rh"
            referencedColumns: ["id_contato"]
          },
        ]
      }
      "Análise arquivos": {
        Row: {
          bt_valid: number | null
          id: number
          id_phone: string
          vc_email: string | null
        }
        Insert: {
          bt_valid?: number | null
          id?: number
          id_phone: string
          vc_email?: string | null
        }
        Update: {
          bt_valid?: number | null
          id?: number
          id_phone?: string
          vc_email?: string | null
        }
        Relationships: []
      }
      cadastros_evento: {
        Row: {
          codigo_funcionario: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          codigo_funcionario: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          codigo_funcionario?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      comunicacao_escala: {
        Row: {
          comunicacao: string
          data_offset: string
          flutuanteoufixa: string
          hora: string
          horaflutuante: number | null
          idcomunicacao: number
        }
        Insert: {
          comunicacao: string
          data_offset: string
          flutuanteoufixa: string
          hora: string
          horaflutuante?: number | null
          idcomunicacao?: number
        }
        Update: {
          comunicacao?: string
          data_offset?: string
          flutuanteoufixa?: string
          hora?: string
          horaflutuante?: number | null
          idcomunicacao?: number
        }
        Relationships: []
      }
      contatos_rh: {
        Row: {
          celular: string | null
          created_at: string | null
          data_primeiro_dia: string | null
          email: string
          estagio_contratacao: number | null
          forma: string | null
          horario_primeiro_dia: string | null
          id_contato: string
          nome_completo: string | null
          nome_responsavel: string | null
          updated_at: string | null
        }
        Insert: {
          celular?: string | null
          created_at?: string | null
          data_primeiro_dia?: string | null
          email: string
          estagio_contratacao?: number | null
          forma?: string | null
          horario_primeiro_dia?: string | null
          id_contato?: string
          nome_completo?: string | null
          nome_responsavel?: string | null
          updated_at?: string | null
        }
        Update: {
          celular?: string | null
          created_at?: string | null
          data_primeiro_dia?: string | null
          email?: string
          estagio_contratacao?: number | null
          forma?: string | null
          horario_primeiro_dia?: string | null
          id_contato?: string
          nome_completo?: string | null
          nome_responsavel?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dependentes: {
        Row: {
          comprovante_escolaridade_url: string | null
          comprovante_vacinacao_url: string | null
          created_at: string | null
          data_nascimento: string
          documento_tipo: string
          documento_url: string | null
          id: string
          id_contato: string
          nome_completo: string
        }
        Insert: {
          comprovante_escolaridade_url?: string | null
          comprovante_vacinacao_url?: string | null
          created_at?: string | null
          data_nascimento: string
          documento_tipo: string
          documento_url?: string | null
          id?: string
          id_contato: string
          nome_completo: string
        }
        Update: {
          comprovante_escolaridade_url?: string | null
          comprovante_vacinacao_url?: string | null
          created_at?: string | null
          data_nascimento?: string
          documento_tipo?: string
          documento_url?: string | null
          id?: string
          id_contato?: string
          nome_completo?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependentes_id_contato_fkey"
            columns: ["id_contato"]
            isOneToOne: false
            referencedRelation: "contatos_rh"
            referencedColumns: ["id_contato"]
          },
        ]
      }
      Docs_Contr: {
        Row: {
          bt_blur: string | null
          bt_legible: boolean | null
          bt_right: boolean | null
          bt_valid: boolean | null
          email: string | null
          id: number | null
          id_phone: number | null
          imb_sice: boolean | null
          lmb_document: boolean | null
          type: string | null
          vc_document: boolean | null
          vc_find_document: boolean | null
          vc_return: boolean | null
        }
        Insert: {
          bt_blur?: string | null
          bt_legible?: boolean | null
          bt_right?: boolean | null
          bt_valid?: boolean | null
          email?: string | null
          id?: number | null
          id_phone?: number | null
          imb_sice?: boolean | null
          lmb_document?: boolean | null
          type?: string | null
          vc_document?: boolean | null
          vc_find_document?: boolean | null
          vc_return?: boolean | null
        }
        Update: {
          bt_blur?: string | null
          bt_legible?: boolean | null
          bt_right?: boolean | null
          bt_valid?: boolean | null
          email?: string | null
          id?: number | null
          id_phone?: number | null
          imb_sice?: boolean | null
          lmb_document?: boolean | null
          type?: string | null
          vc_document?: boolean | null
          vc_find_document?: boolean | null
          vc_return?: boolean | null
        }
        Relationships: []
      }
      document_type: {
        Row: {
          code: string
          description: string
        }
        Insert: {
          code: string
          description: string
        }
        Update: {
          code?: string
          description?: string
        }
        Relationships: []
      }
      documentos: {
        Row: {
          created_at: string | null
          dados_json: Json | null
          id: string
          id_contato: string
          nome_arquivo: string
          tipo_documento: string
          updated_at: string | null
          url_arquivo: string
          validado: boolean | null
        }
        Insert: {
          created_at?: string | null
          dados_json?: Json | null
          id?: string
          id_contato: string
          nome_arquivo: string
          tipo_documento: string
          updated_at?: string | null
          url_arquivo: string
          validado?: boolean | null
        }
        Update: {
          created_at?: string | null
          dados_json?: Json | null
          id?: string
          id_contato?: string
          nome_arquivo?: string
          tipo_documento?: string
          updated_at?: string | null
          url_arquivo?: string
          validado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_id_contato_fkey"
            columns: ["id_contato"]
            isOneToOne: false
            referencedRelation: "contatos_rh"
            referencedColumns: ["id_contato"]
          },
        ]
      }
      envio_comunicacao_log: {
        Row: {
          data_hora_comunicacao: string | null
          id: number
          idcomunicacao: number
          idescala: number
          last_error: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          try_count: number
        }
        Insert: {
          data_hora_comunicacao?: string | null
          id?: number
          idcomunicacao: number
          idescala: number
          last_error?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          try_count?: number
        }
        Update: {
          data_hora_comunicacao?: string | null
          id?: number
          idcomunicacao?: number
          idescala?: number
          last_error?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          try_count?: number
        }
        Relationships: []
      }
      escala: {
        Row: {
          dataescala: string
          finalescala: string | null
          idescala: number
          nomepessoaescala: string
          telefone: string | null
        }
        Insert: {
          dataescala: string
          finalescala?: string | null
          idescala?: number
          nomepessoaescala: string
          telefone?: string | null
        }
        Update: {
          dataescala?: string
          finalescala?: string | null
          idescala?: number
          nomepessoaescala?: string
          telefone?: string | null
        }
        Relationships: []
      }
      file_upload: {
        Row: {
          bt_legible: boolean | null
          bt_valid: boolean | null
          created_at: string | null
          h_blur: boolean | null
          h_right: boolean | null
          id: string
          id_phone: string | null
          link_document: string
          link_size_bytes: number | null
          updated_at: string | null
          vc_document: string | null
          vc_email: string | null
          vc_find_document: string | null
          vc_return: string | null
        }
        Insert: {
          bt_legible?: boolean | null
          bt_valid?: boolean | null
          created_at?: string | null
          h_blur?: boolean | null
          h_right?: boolean | null
          id?: string
          id_phone?: string | null
          link_document: string
          link_size_bytes?: number | null
          updated_at?: string | null
          vc_document?: string | null
          vc_email?: string | null
          vc_find_document?: string | null
          vc_return?: string | null
        }
        Update: {
          bt_legible?: boolean | null
          bt_valid?: boolean | null
          created_at?: string | null
          h_blur?: boolean | null
          h_right?: boolean | null
          id?: string
          id_phone?: string | null
          link_document?: string
          link_size_bytes?: number | null
          updated_at?: string | null
          vc_document?: string | null
          vc_email?: string | null
          vc_find_document?: string | null
          vc_return?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_upload_vc_find_document_fkey"
            columns: ["vc_find_document"]
            isOneToOne: false
            referencedRelation: "document_type"
            referencedColumns: ["code"]
          },
        ]
      }
      menu_items: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          menu_key: string
          name: string
          order_index: number | null
          parent_key: string | null
          section_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          menu_key: string
          name: string
          order_index?: number | null
          parent_key?: string | null
          section_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          menu_key?: string
          name?: string
          order_index?: number | null
          parent_key?: string | null
          section_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      permission_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          created_at: string
          id: string
          pergunta1_resposta: string
          pergunta2_resposta: string
        }
        Insert: {
          created_at?: string
          id?: string
          pergunta1_resposta: string
          pergunta2_resposta: string
        }
        Update: {
          created_at?: string
          id?: string
          pergunta1_resposta?: string
          pergunta2_resposta?: string
        }
        Relationships: []
      }
      recepcao_evento: {
        Row: {
          consentimento_foto: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          consentimento_foto: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          consentimento_foto?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      resposta_comunicacao: {
        Row: {
          dtcomunicacao: string | null
          dtresposta: string | null
          horaresposta: string | null
          idcomunicacao: number
          idescala: number
          idresposta: number
          status: string | null
        }
        Insert: {
          dtcomunicacao?: string | null
          dtresposta?: string | null
          horaresposta?: string | null
          idcomunicacao: number
          idescala: number
          idresposta?: number
          status?: string | null
        }
        Update: {
          dtcomunicacao?: string | null
          dtresposta?: string | null
          horaresposta?: string | null
          idcomunicacao?: number
          idescala?: number
          idresposta?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resposta_comunicacao_idcomunicacao_fkey"
            columns: ["idcomunicacao"]
            isOneToOne: false
            referencedRelation: "comunicacao_escala"
            referencedColumns: ["idcomunicacao"]
          },
          {
            foreignKeyName: "resposta_comunicacao_idescala_fkey"
            columns: ["idescala"]
            isOneToOne: false
            referencedRelation: "escala"
            referencedColumns: ["idescala"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string | null
          granted_by: string | null
          id: string
          menu_item_id: string
          permission_type_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          menu_item_id: string
          permission_type_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          menu_item_id?: string
          permission_type_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_permission_type_id_fkey"
            columns: ["permission_type_id"]
            isOneToOne: false
            referencedRelation: "permission_types"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_control: {
        Row: {
          ativo: number | null
          id: number
          updated_at: string | null
        }
        Insert: {
          ativo?: number | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          ativo?: number | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          id: number
          payload: Json | null
          response: Json | null
          status_code: number | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          payload?: Json | null
          response?: Json | null
          status_code?: number | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: number
          payload?: Json | null
          response?: Json | null
          status_code?: number | null
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      associate_user_to_contact: {
        Args: { p_contact_id: string; p_user_id: string }
        Returns: string
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      call_n8n_webhook: {
        Args: { payload?: Json; webhook_url: string }
        Returns: Json
      }
      call_webhook: {
        Args: { payload: Json; url: string }
        Returns: {
          body: string
          status: number
        }[]
      }
      comunicacoes_devidas: {
        Args: { window_minutes?: number }
        Returns: {
          idcomunicacao: number
          idescala: number
          scheduled_at: string
          telefone: string
        }[]
      }
      create_audit_log: {
        Args: {
          description: string
          event_source: string
          new_data?: Json
          old_data?: Json
          user_id?: string
        }
        Returns: string
      }
      create_contact: {
        Args: {
          contact_name: string
          contact_type_id?: string
          email?: string
          is_blocked?: boolean
          phone_number: string
        }
        Returns: string
      }
      create_contact_permission: {
        Args: {
          contact_id: string
          feature_id?: string
          module_id: string
          permission_id: string
        }
        Returns: string
      }
      create_contact_type: {
        Args: { type_name: string }
        Returns: string
      }
      create_module: {
        Args: { module_description?: string; module_name: string }
        Returns: string
      }
      delete_contact: {
        Args: { contact_id: string }
        Returns: boolean
      }
      delete_contact_permission: {
        Args: { permission_id: string }
        Returns: boolean
      }
      delete_contact_type: {
        Args: { type_id: string }
        Returns: boolean
      }
      delete_module: {
        Args: { module_id: string }
        Returns: boolean
      }
      dispatch_comunicacoes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      dispatch_ping_due_communications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_access_token: {
        Args: { user_email: string }
        Returns: string
      }
      get_all_users_with_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          menu_key: string
          menu_name: string
          permission_id: string
          permission_type: string
          section_id: string
          user_email: string
          user_id: string
        }[]
      }
      get_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: {
          dt_created_at: string
          dt_event: string
          id_log: string
          js_new_data: Json
          js_old_data: Json
          vc_description: string
          vc_event_source: string
          vc_system_user: string
        }[]
      }
      get_contact_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          contact_name: string
          dt_created_at: string
          id_contact: string
          id_contact_permission: string
          id_module: string
          id_permission: string
          module_name: string
          permission_name: string
        }[]
      }
      get_contact_types: {
        Args: Record<PropertyKey, never>
        Returns: {
          dt_created_at: string
          id_contact_type: string
          vc_name: string
        }[]
      }
      get_contacts: {
        Args: Record<PropertyKey, never>
        Returns: {
          bo_is_blocked: boolean
          contact_type_name: string
          dt_created_at: string
          dt_updated_at: string
          id_contact: string
          id_contact_type: string
          id_created_by: string
          id_updated_by: string
          vc_email: string
          vc_name: string
          vc_phone_number: string
        }[]
      }
      get_contacts_for_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          id_contact: string
          vc_name: string
        }[]
      }
      get_features_for_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          id_feature: string
          id_module: string
          vc_description: string
          vc_name: string
        }[]
      }
      get_modules: {
        Args: Record<PropertyKey, never>
        Returns: {
          dt_created_at: string
          dt_updated_at: string
          id_module: string
          vc_description: string
          vc_name: string
        }[]
      }
      get_modules_for_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          id_module: string
          vc_name: string
        }[]
      }
      get_permissions_for_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          id_permission: string
          vc_name: string
        }[]
      }
      get_user_menu_permissions: {
        Args: { p_user_id: string }
        Returns: {
          menu_key: string
          permissions: string[]
          section_id: string
        }[]
      }
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          module_name: string
          permission_name: string
          section_id: string
        }[]
      }
      grant_user_permission: {
        Args: {
          p_menu_key: string
          p_permission_type: string
          p_user_id: string
        }
        Returns: string
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { data: Json; uri: string } | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { data: Json; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      match_documents: {
        Args:
          | { filter: Json; match_count: number; query_embedding: string }
          | { filter: Json; match_count: number; query_embedding: string }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      revoke_user_permission: {
        Args: {
          p_menu_key: string
          p_permission_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      update_contact: {
        Args: {
          contact_id: string
          contact_name: string
          contact_type_id?: string
          email?: string
          is_blocked?: boolean
          phone_number: string
        }
        Returns: boolean
      }
      update_contact_permission: {
        Args: {
          contact_id: string
          feature_id?: string
          module_id: string
          permission_id: string
          permission_type_id: string
        }
        Returns: boolean
      }
      update_contact_type: {
        Args: { type_id: string; type_name: string }
        Returns: boolean
      }
      update_module: {
        Args: {
          module_description?: string
          module_id: string
          module_name: string
        }
        Returns: boolean
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      validate_access_token: {
        Args: { input_token: string; user_email: string }
        Returns: {
          estagiocontratacao: number
          idcontato: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
