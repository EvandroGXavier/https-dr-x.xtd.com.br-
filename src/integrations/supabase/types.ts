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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agenda: {
        Row: {
          created_at: string | null
          dados: Json | null
          data_fim: string | null
          data_inicio: string
          empresa_id: string
          filial_id: string
          id: string
          tenant_id: string
          titulo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dados?: Json | null
          data_fim?: string | null
          data_inicio: string
          empresa_id: string
          filial_id: string
          id?: string
          tenant_id: string
          titulo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dados?: Json | null
          data_fim?: string | null
          data_inicio?: string
          empresa_id?: string
          filial_id?: string
          id?: string
          tenant_id?: string
          titulo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agenda_configuracoes: {
        Row: {
          ativo: boolean
          created_at: string | null
          created_by: string | null
          descricao_padrao: string | null
          gatilho: string
          id: string
          modulo_origem: string
          nome_fluxo: string
          participantes_padrao: Json | null
          prazo_padrao_minutos: number | null
          responsavel_padrao: string | null
          tenant_id: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string | null
          created_by?: string | null
          descricao_padrao?: string | null
          gatilho: string
          id?: string
          modulo_origem: string
          nome_fluxo: string
          participantes_padrao?: Json | null
          prazo_padrao_minutos?: number | null
          responsavel_padrao?: string | null
          tenant_id: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string | null
          created_by?: string | null
          descricao_padrao?: string | null
          gatilho?: string
          id?: string
          modulo_origem?: string
          nome_fluxo?: string
          participantes_padrao?: Json | null
          prazo_padrao_minutos?: number | null
          responsavel_padrao?: string | null
          tenant_id?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      agenda_etapas: {
        Row: {
          agenda_id: string
          created_at: string
          descricao: string | null
          id: string
          ordem: number
          prevista_para: string | null
          responsavel_contato_id: string | null
          status: string
          tenant_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          agenda_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          ordem: number
          prevista_para?: string | null
          responsavel_contato_id?: string | null
          status?: string
          tenant_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          agenda_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number
          prevista_para?: string | null
          responsavel_contato_id?: string | null
          status?: string
          tenant_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_etapas_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "agendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_etapas_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_etapas_responsavel_contato_id_fkey"
            columns: ["responsavel_contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_etapas_responsavel_contato_id_fkey"
            columns: ["responsavel_contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "agenda_etapas_responsavel_contato_id_fkey"
            columns: ["responsavel_contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "agenda_etapas_responsavel_contato_id_fkey"
            columns: ["responsavel_contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_etapas_responsavel_contato_id_fkey"
            columns: ["responsavel_contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_etapas_responsavel_contato_id_fkey"
            columns: ["responsavel_contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "agenda_etapas_responsavel_contato_id_fkey"
            columns: ["responsavel_contato_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "fk_agenda_etapas_agenda"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "agendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_etapas_agenda"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_etapas_responsavel"
            columns: ["responsavel_contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_etapas_responsavel"
            columns: ["responsavel_contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "fk_agenda_etapas_responsavel"
            columns: ["responsavel_contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "fk_agenda_etapas_responsavel"
            columns: ["responsavel_contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_etapas_responsavel"
            columns: ["responsavel_contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_etapas_responsavel"
            columns: ["responsavel_contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "fk_agenda_etapas_responsavel"
            columns: ["responsavel_contato_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      agenda_etiquetas: {
        Row: {
          agenda_id: string
          created_at: string
          etiqueta_id: string
          tenant_id: string
          tipo: string | null
        }
        Insert: {
          agenda_id: string
          created_at?: string
          etiqueta_id: string
          tenant_id: string
          tipo?: string | null
        }
        Update: {
          agenda_id?: string
          created_at?: string
          etiqueta_id?: string
          tenant_id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_etiquetas_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "agendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_etiquetas_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_etiquetas_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "etiquetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_etiquetas_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "vw_etiquetas_pt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_etiquetas_agenda"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "agendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_etiquetas_agenda"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_etiquetas_etiqueta"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "etiquetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_etiquetas_etiqueta"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "vw_etiquetas_pt"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_fluxo_etapas: {
        Row: {
          created_at: string
          descricao: string | null
          fluxo_id: string
          id: string
          obrigatoria: boolean | null
          offset_dias: number | null
          ordem: number
          tenant_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          fluxo_id: string
          id?: string
          obrigatoria?: boolean | null
          offset_dias?: number | null
          ordem: number
          tenant_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          fluxo_id?: string
          id?: string
          obrigatoria?: boolean | null
          offset_dias?: number | null
          ordem?: number
          tenant_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_fluxo_etapas_fluxo_id_fkey"
            columns: ["fluxo_id"]
            isOneToOne: false
            referencedRelation: "agenda_fluxos"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_fluxos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      agenda_locais: {
        Row: {
          agenda_id: string
          created_at: string
          endereco: string | null
          id: string
          link: string | null
          modalidade: string
          pasta_arquivos: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          agenda_id: string
          created_at?: string
          endereco?: string | null
          id?: string
          link?: string | null
          modalidade: string
          pasta_arquivos?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          agenda_id?: string
          created_at?: string
          endereco?: string | null
          id?: string
          link?: string | null
          modalidade?: string
          pasta_arquivos?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_locais_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: true
            referencedRelation: "agendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_locais_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: true
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_locais_agenda"
            columns: ["agenda_id"]
            isOneToOne: true
            referencedRelation: "agendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_locais_agenda"
            columns: ["agenda_id"]
            isOneToOne: true
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_partes: {
        Row: {
          agenda_id: string
          contato_id: string
          created_at: string
          id: string
          papel: string
          tenant_id: string
        }
        Insert: {
          agenda_id: string
          contato_id: string
          created_at?: string
          id?: string
          papel: string
          tenant_id: string
        }
        Update: {
          agenda_id?: string
          contato_id?: string
          created_at?: string
          id?: string
          papel?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_partes_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "agendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_partes_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_partes_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_partes_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "agenda_partes_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "agenda_partes_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_partes_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_partes_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "agenda_partes_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "fk_agenda_partes_agenda"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "agendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_partes_agenda"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_partes_contato"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_partes_contato"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "fk_agenda_partes_contato"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "fk_agenda_partes_contato"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_partes_contato"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_partes_contato"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "fk_agenda_partes_contato"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      agendas: {
        Row: {
          atualizado_em: string | null
          compartilhado_com_cliente: boolean | null
          contato_responsavel_id: string
          contato_solicitante_id: string
          criado_em: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          empresa_id: string | null
          filial_id: string | null
          id: string
          lembrete_em: string | null
          observacoes: string | null
          origem_config_id: string | null
          origem_modulo: string | null
          origem_registro_id: string | null
          prioridade: Database["public"]["Enums"]["agenda_prioridade"] | null
          processo_id: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["agenda_status"]
          tenant_id: string
          titulo: string
          todo_concluido_em: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string | null
          compartilhado_com_cliente?: boolean | null
          contato_responsavel_id: string
          contato_solicitante_id: string
          criado_em?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          lembrete_em?: string | null
          observacoes?: string | null
          origem_config_id?: string | null
          origem_modulo?: string | null
          origem_registro_id?: string | null
          prioridade?: Database["public"]["Enums"]["agenda_prioridade"] | null
          processo_id?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["agenda_status"]
          tenant_id: string
          titulo: string
          todo_concluido_em?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          atualizado_em?: string | null
          compartilhado_com_cliente?: boolean | null
          contato_responsavel_id?: string
          contato_solicitante_id?: string
          criado_em?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          lembrete_em?: string | null
          observacoes?: string | null
          origem_config_id?: string | null
          origem_modulo?: string | null
          origem_registro_id?: string | null
          prioridade?: Database["public"]["Enums"]["agenda_prioridade"] | null
          processo_id?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["agenda_status"]
          tenant_id?: string
          titulo?: string
          todo_concluido_em?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendas_origem_config_id_fkey"
            columns: ["origem_config_id"]
            isOneToOne: false
            referencedRelation: "agenda_configuracoes"
            referencedColumns: ["id"]
          },
        ]
      }
      aid_audit: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          job_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          job_id?: string | null
          user_id?: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          job_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aid_audit_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "aid_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      aid_jobs: {
        Row: {
          contato_id: string | null
          created_at: string
          created_by: string
          empresa_id: string | null
          error: string | null
          filial_id: string | null
          finished_at: string | null
          id: string
          meta: Json | null
          mime_type: string | null
          original_filename: string | null
          sha256: string | null
          size_bytes: number | null
          source_module: string
          source_ref_id: string | null
          started_at: string | null
          status: string
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contato_id?: string | null
          created_at?: string
          created_by: string
          empresa_id?: string | null
          error?: string | null
          filial_id?: string | null
          finished_at?: string | null
          id?: string
          meta?: Json | null
          mime_type?: string | null
          original_filename?: string | null
          sha256?: string | null
          size_bytes?: number | null
          source_module: string
          source_ref_id?: string | null
          started_at?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          contato_id?: string | null
          created_at?: string
          created_by?: string
          empresa_id?: string | null
          error?: string | null
          filial_id?: string | null
          finished_at?: string | null
          id?: string
          meta?: Json | null
          mime_type?: string | null
          original_filename?: string | null
          sha256?: string | null
          size_bytes?: number | null
          source_module?: string
          source_ref_id?: string | null
          started_at?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aid_mappings: {
        Row: {
          ativo: boolean | null
          created_at: string
          empresa_id: string | null
          filial_id: string | null
          id: string
          post_actions: Json | null
          target_fields: Json | null
          target_module: string
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          post_actions?: Json | null
          target_fields?: Json | null
          target_module: string
          template_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          post_actions?: Json | null
          target_fields?: Json | null
          target_module?: string
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aid_mappings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "aid_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      aid_results: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          job_id: string
          labels: Json | null
          pages_meta: Json | null
          plain_text: string
          structured: Json | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          job_id: string
          labels?: Json | null
          pages_meta?: Json | null
          plain_text: string
          structured?: Json | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          job_id?: string
          labels?: Json | null
          pages_meta?: Json | null
          plain_text?: string
          structured?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "aid_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "aid_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      aid_templates: {
        Row: {
          ativo: boolean | null
          categoria: string
          config: Json | null
          created_at: string
          descricao: string | null
          empresa_id: string | null
          filial_id: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string
          config?: Json | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          config?: Json | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      andamentos_processuais: {
        Row: {
          codigo_evento: string | null
          created_at: string | null
          dados_brutos: Json | null
          data_evento: string
          descricao: string
          id: string
          lido: boolean | null
          origem: string
          processo_vinculo_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          codigo_evento?: string | null
          created_at?: string | null
          dados_brutos?: Json | null
          data_evento: string
          descricao: string
          id?: string
          lido?: boolean | null
          origem: string
          processo_vinculo_id: string
          tenant_id: string
          user_id?: string
        }
        Update: {
          codigo_evento?: string | null
          created_at?: string | null
          dados_brutos?: Json | null
          data_evento?: string
          descricao?: string
          id?: string
          lido?: boolean | null
          origem?: string
          processo_vinculo_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "andamentos_processuais_processo_vinculo_id_fkey"
            columns: ["processo_vinculo_id"]
            isOneToOne: false
            referencedRelation: "processos_vinculos"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimento_etiquetas: {
        Row: {
          cor: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          nome: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nome: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nome?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atendimento_etiquetas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "saas_empresas"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      atendimento_mensagens: {
        Row: {
          atendimento_id: string
          body: string
          created_at: string | null
          deleted_at: string | null
          from_me: boolean | null
          id: string
          is_deleted: boolean | null
          media_type: string | null
          media_url: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          atendimento_id: string
          body: string
          created_at?: string | null
          deleted_at?: string | null
          from_me?: boolean | null
          id?: string
          is_deleted?: boolean | null
          media_type?: string | null
          media_url?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          atendimento_id?: string
          body?: string
          created_at?: string | null
          deleted_at?: string | null
          from_me?: boolean | null
          id?: string
          is_deleted?: boolean | null
          media_type?: string | null
          media_url?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atendimento_mensagens_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimento_notas: {
        Row: {
          atendimento_id: string
          created_at: string | null
          deleted_at: string | null
          id: string
          nota: string
          tenant_id: string
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          atendimento_id: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nota: string
          tenant_id: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          atendimento_id?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          nota?: string
          tenant_id?: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atendimento_notas_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimentos: {
        Row: {
          contato_id: string | null
          created_at: string | null
          deleted_at: string | null
          fila_id: string | null
          id: string
          is_bot: boolean | null
          nao_lidas: number | null
          origem: string | null
          protocolo: string | null
          status: string | null
          tenant_id: string
          ultimo_mensagem: string | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          contato_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          fila_id?: string | null
          id?: string
          is_bot?: boolean | null
          nao_lidas?: number | null
          origem?: string | null
          protocolo?: string | null
          status?: string | null
          tenant_id: string
          ultimo_mensagem?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          contato_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          fila_id?: string | null
          id?: string
          is_bot?: boolean | null
          nao_lidas?: number | null
          origem?: string | null
          protocolo?: string | null
          status?: string | null
          tenant_id?: string
          ultimo_mensagem?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "atendimentos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "atendimentos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "atendimentos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      atendimentos_x_etiquetas: {
        Row: {
          atendimento_id: string
          etiqueta_id: string
          tenant_id: string
        }
        Insert: {
          atendimento_id: string
          etiqueta_id: string
          tenant_id: string
        }
        Update: {
          atendimento_id?: string
          etiqueta_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_x_etiquetas_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          action: string
          actor_id: string | null
          details: Json | null
          id: string
          ip_address: unknown
          module: string
          target_id: string | null
          tenant_id: string
          timestamp: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          module: string
          target_id?: string | null
          tenant_id: string
          timestamp?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          module?: string
          target_id?: string | null
          tenant_id?: string
          timestamp?: string
        }
        Relationships: []
      }
      auditorias: {
        Row: {
          action: string | null
          actor: string | null
          criado_em: string | null
          id: string
          module: string | null
          payload: Json | null
          target: string | null
          tenant_id: string | null
        }
        Insert: {
          action?: string | null
          actor?: string | null
          criado_em?: string | null
          id?: string
          module?: string | null
          payload?: Json | null
          target?: string | null
          tenant_id?: string | null
        }
        Update: {
          action?: string | null
          actor?: string | null
          criado_em?: string | null
          id?: string
          module?: string | null
          payload?: Json | null
          target?: string | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      backup_history: {
        Row: {
          backup_size: number | null
          backup_type: string
          created_at: string
          file_path: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          backup_size?: number | null
          backup_type: string
          created_at?: string
          file_path: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          backup_size?: number | null
          backup_type?: string
          created_at?: string
          file_path?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      biblioteca_modelos_honorarios: {
        Row: {
          ativo: boolean | null
          created_at: string
          descricao: string | null
          id: string
          modelo_id: string
          nome_perfil: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          modelo_id: string
          nome_perfil: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          modelo_id?: string
          nome_perfil?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      biblioteca_modelos_honorarios_item: {
        Row: {
          created_at: string
          descricao: string
          id: string
          observacoes: string | null
          percentual_exito: number | null
          perfil_honorario_id: string
          referencia_oab: string | null
          tipo: Database["public"]["Enums"]["honorario_tipo"]
          user_id: string
          valor_sugerido: number | null
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          observacoes?: string | null
          percentual_exito?: number | null
          perfil_honorario_id: string
          referencia_oab?: string | null
          tipo: Database["public"]["Enums"]["honorario_tipo"]
          user_id: string
          valor_sugerido?: number | null
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          percentual_exito?: number | null
          perfil_honorario_id?: string
          referencia_oab?: string | null
          tipo?: Database["public"]["Enums"]["honorario_tipo"]
          user_id?: string
          valor_sugerido?: number | null
        }
        Relationships: []
      }
      biblioteca_modelos_honorarios_parcela: {
        Row: {
          created_at: string
          dia_vencimento: number | null
          dias_vencimento: number
          honorario_item_id: string
          id: string
          numero_parcela: number
          observacoes: string | null
          percentual_valor: number
          recorrente: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dia_vencimento?: number | null
          dias_vencimento: number
          honorario_item_id: string
          id?: string
          numero_parcela: number
          observacoes?: string | null
          percentual_valor: number
          recorrente?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          dia_vencimento?: number | null
          dias_vencimento?: number
          honorario_item_id?: string
          id?: string
          numero_parcela?: number
          observacoes?: string | null
          percentual_valor?: number
          recorrente?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      biblioteca_modelos_v2: {
        Row: {
          atualizado_por: string | null
          conteudo_html: string | null
          criado_por: string | null
          data_atualizacao: string
          data_criacao: string
          data_exclusao_logica: string | null
          descricao: string | null
          id: string
          search_vector: unknown
          tenant_id: string
          titulo: string
        }
        Insert: {
          atualizado_por?: string | null
          conteudo_html?: string | null
          criado_por?: string | null
          data_atualizacao?: string
          data_criacao?: string
          data_exclusao_logica?: string | null
          descricao?: string | null
          id?: string
          search_vector?: unknown
          tenant_id: string
          titulo: string
        }
        Update: {
          atualizado_por?: string | null
          conteudo_html?: string | null
          criado_por?: string | null
          data_atualizacao?: string
          data_criacao?: string
          data_exclusao_logica?: string | null
          descricao?: string | null
          id?: string
          search_vector?: unknown
          tenant_id?: string
          titulo?: string
        }
        Relationships: []
      }
      chamadas: {
        Row: {
          contato_id: string | null
          created_at: string | null
          direcao: string
          duracao: number | null
          encerrado_em: string | null
          id: string
          iniciado_em: string
          numero: string
          status: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          contato_id?: string | null
          created_at?: string | null
          direcao: string
          duracao?: number | null
          encerrado_em?: string | null
          id?: string
          iniciado_em?: string
          numero: string
          status?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          contato_id?: string | null
          created_at?: string | null
          direcao?: string
          duracao?: number | null
          encerrado_em?: string | null
          id?: string
          iniciado_em?: string
          numero?: string
          status?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chamadas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamadas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "chamadas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "chamadas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamadas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamadas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "chamadas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      cnpj_consultas_audit: {
        Row: {
          acao: string
          cnpj: string
          created_at: string | null
          id: string
          origem_dados: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          acao: string
          cnpj: string
          created_at?: string | null
          id?: string
          origem_dados?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          acao?: string
          cnpj?: string
          created_at?: string | null
          id?: string
          origem_dados?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      compras: {
        Row: {
          chave_nfe: string | null
          created_at: string | null
          data_emissao: string | null
          data_registro: string
          empresa_id: string | null
          filial_id: string | null
          fornecedor_id: string | null
          hash_arquivo: string | null
          id: string
          numero_nfe: string | null
          observacoes: string | null
          origem_arquivo_tipo: string | null
          origem_arquivo_url: string | null
          status: string | null
          tenant_id: string
          tipo: string | null
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          chave_nfe?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_registro?: string
          empresa_id?: string | null
          filial_id?: string | null
          fornecedor_id?: string | null
          hash_arquivo?: string | null
          id?: string
          numero_nfe?: string | null
          observacoes?: string | null
          origem_arquivo_tipo?: string | null
          origem_arquivo_url?: string | null
          status?: string | null
          tenant_id: string
          tipo?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          chave_nfe?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_registro?: string
          empresa_id?: string | null
          filial_id?: string | null
          fornecedor_id?: string | null
          hash_arquivo?: string | null
          id?: string
          numero_nfe?: string | null
          observacoes?: string | null
          origem_arquivo_tipo?: string | null
          origem_arquivo_url?: string | null
          status?: string | null
          tenant_id?: string
          tipo?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "compras_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "compras_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "compras_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      compras_itens: {
        Row: {
          aliquota_cofins: number | null
          aliquota_icms: number | null
          aliquota_pis: number | null
          cfop: string | null
          codigo_produto: string | null
          compra_id: string | null
          created_at: string | null
          descricao: string
          id: string
          ncm: string | null
          produto_id: string | null
          quantidade: number
          unidade: string | null
          valor_ipi: number | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          aliquota_cofins?: number | null
          aliquota_icms?: number | null
          aliquota_pis?: number | null
          cfop?: string | null
          codigo_produto?: string | null
          compra_id?: string | null
          created_at?: string | null
          descricao: string
          id?: string
          ncm?: string | null
          produto_id?: string | null
          quantidade: number
          unidade?: string | null
          valor_ipi?: number | null
          valor_total: number
          valor_unitario: number
        }
        Update: {
          aliquota_cofins?: number | null
          aliquota_icms?: number | null
          aliquota_pis?: number | null
          cfop?: string | null
          codigo_produto?: string | null
          compra_id?: string | null
          created_at?: string | null
          descricao?: string
          id?: string
          ncm?: string | null
          produto_id?: string | null
          quantidade?: number
          unidade?: string | null
          valor_ipi?: number | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_itens_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "v_produtos_busca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "v_produtos_estoque"
            referencedColumns: ["produto_id"]
          },
        ]
      }
      compras_parcelas: {
        Row: {
          compra_id: string | null
          created_at: string | null
          data_vencimento: string
          id: string
          numero_parcela: number
          transacao_id: string | null
          valor: number
        }
        Insert: {
          compra_id?: string | null
          created_at?: string | null
          data_vencimento: string
          id?: string
          numero_parcela: number
          transacao_id?: string | null
          valor: number
        }
        Update: {
          compra_id?: string | null
          created_at?: string | null
          data_vencimento?: string
          id?: string
          numero_parcela?: number
          transacao_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_parcelas_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_parcelas_transacao_id_fkey"
            columns: ["transacao_id"]
            isOneToOne: false
            referencedRelation: "transacoes_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_parcelas_transacao_id_fkey"
            columns: ["transacao_id"]
            isOneToOne: false
            referencedRelation: "vw_transacoes_financeiras_pt"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string
          id: string
          tenant_id: string
          updated_at: string
          valor: string | null
        }
        Insert: {
          chave: string
          created_at?: string
          id?: string
          tenant_id: string
          updated_at?: string
          valor?: string | null
        }
        Update: {
          chave?: string
          created_at?: string
          id?: string
          tenant_id?: string
          updated_at?: string
          valor?: string | null
        }
        Relationships: []
      }
      contas_financeiras: {
        Row: {
          agencia: string | null
          ativa: boolean | null
          banco: string | null
          conta: string | null
          created_at: string
          empresa_id: string | null
          filial_id: string | null
          id: string
          nome: string
          observacoes: string | null
          pix: string | null
          saldo_atual: number
          saldo_inicial: number | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agencia?: string | null
          ativa?: boolean | null
          banco?: string | null
          conta?: string | null
          created_at?: string
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          pix?: string | null
          saldo_atual?: number
          saldo_inicial?: number | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agencia?: string | null
          ativa?: boolean | null
          banco?: string | null
          conta?: string | null
          created_at?: string
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          pix?: string | null
          saldo_atual?: number
          saldo_inicial?: number | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contato_enderecos: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          contato_id: string
          created_at: string | null
          empresa_id: string | null
          filial_id: string | null
          ibge: string | null
          id: string
          latitude: number | null
          logradouro: string | null
          longitude: number | null
          numero: string | null
          origem_dados: string | null
          principal: boolean | null
          tenant_id: string
          tipo: string | null
          uf: string | null
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          contato_id: string
          created_at?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          ibge?: string | null
          id?: string
          latitude?: number | null
          logradouro?: string | null
          longitude?: number | null
          numero?: string | null
          origem_dados?: string | null
          principal?: boolean | null
          tenant_id: string
          tipo?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          contato_id?: string
          created_at?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          ibge?: string | null
          id?: string
          latitude?: number | null
          logradouro?: string | null
          longitude?: number | null
          numero?: string | null
          origem_dados?: string | null
          principal?: boolean | null
          tenant_id?: string
          tipo?: string | null
          uf?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contato_enderecos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_enderecos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "contato_enderecos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "contato_enderecos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_enderecos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_enderecos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "contato_enderecos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      contato_etiquetas: {
        Row: {
          contato_id: string
          created_at: string
          etiqueta_id: string
          tenant_id: string
        }
        Insert: {
          contato_id: string
          created_at?: string
          etiqueta_id: string
          tenant_id: string
        }
        Update: {
          contato_id?: string
          created_at?: string
          etiqueta_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contato_etiquetas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_etiquetas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "contato_etiquetas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "contato_etiquetas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_etiquetas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_etiquetas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "contato_etiquetas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "contato_etiquetas_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "etiquetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_etiquetas_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "vw_etiquetas_pt"
            referencedColumns: ["id"]
          },
        ]
      }
      contato_financeiro_config: {
        Row: {
          agencia: string | null
          banco: string | null
          conta: string | null
          contato_id: string
          created_at: string | null
          empresa_id: string
          filial_id: string
          forma_pagamento_padrao: string | null
          id: string
          limite_credito: number | null
          observacao: string | null
          pix_chave: string | null
          pix_tipo: string | null
          tenant_id: string
          updated_at: string | null
          validade_limite: string | null
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          conta?: string | null
          contato_id: string
          created_at?: string | null
          empresa_id: string
          filial_id: string
          forma_pagamento_padrao?: string | null
          id?: string
          limite_credito?: number | null
          observacao?: string | null
          pix_chave?: string | null
          pix_tipo?: string | null
          tenant_id: string
          updated_at?: string | null
          validade_limite?: string | null
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          conta?: string | null
          contato_id?: string
          created_at?: string | null
          empresa_id?: string
          filial_id?: string
          forma_pagamento_padrao?: string | null
          id?: string
          limite_credito?: number | null
          observacao?: string | null
          pix_chave?: string | null
          pix_tipo?: string | null
          tenant_id?: string
          updated_at?: string | null
          validade_limite?: string | null
        }
        Relationships: []
      }
      contato_meios_contato: {
        Row: {
          contato_id: string
          created_at: string | null
          empresa_id: string | null
          filial_id: string | null
          id: string
          observacao: string | null
          principal: boolean | null
          tenant_id: string
          tipo: string | null
          updated_at: string | null
          valor: string
        }
        Insert: {
          contato_id: string
          created_at?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          observacao?: string | null
          principal?: boolean | null
          tenant_id: string
          tipo?: string | null
          updated_at?: string | null
          valor: string
        }
        Update: {
          contato_id?: string
          created_at?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          observacao?: string | null
          principal?: boolean | null
          tenant_id?: string
          tipo?: string | null
          updated_at?: string | null
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "contato_meios_contato_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_meios_contato_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "contato_meios_contato_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "contato_meios_contato_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_meios_contato_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_meios_contato_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "contato_meios_contato_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      contato_patrimonios: {
        Row: {
          contato_id: string
          created_at: string
          data_desvinculo: string | null
          data_vinculo: string | null
          descricao: string
          detalhes: Json | null
          empresa_id: string | null
          filial_id: string | null
          id: string
          natureza: Database["public"]["Enums"]["natureza_patrimonio"]
          observacao: string | null
          status: Database["public"]["Enums"]["status_patrimonio"]
          tenant_id: string
          updated_at: string
          user_id: string
          valor_saldo: number | null
        }
        Insert: {
          contato_id: string
          created_at?: string
          data_desvinculo?: string | null
          data_vinculo?: string | null
          descricao: string
          detalhes?: Json | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          natureza?: Database["public"]["Enums"]["natureza_patrimonio"]
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_patrimonio"]
          tenant_id: string
          updated_at?: string
          user_id: string
          valor_saldo?: number | null
        }
        Update: {
          contato_id?: string
          created_at?: string
          data_desvinculo?: string | null
          data_vinculo?: string | null
          descricao?: string
          detalhes?: Json | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          natureza?: Database["public"]["Enums"]["natureza_patrimonio"]
          observacao?: string | null
          status?: Database["public"]["Enums"]["status_patrimonio"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
          valor_saldo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contato_patrimonios_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_patrimonios_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "contato_patrimonios_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "contato_patrimonios_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_patrimonios_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_patrimonios_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "contato_patrimonios_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      contato_pf: {
        Row: {
          cnis: string | null
          contato_id: string
          cpf: string | null
          created_at: string | null
          ctps: string | null
          data_nascimento: string | null
          emprego: string | null
          empresa_id: string | null
          estado_civil: string | null
          filial_id: string | null
          id: string
          nacionalidade: string | null
          naturalidade: string | null
          nome_completo: string | null
          orgao_expedidor: string | null
          pf_obs: string | null
          pis: string | null
          profissao: string | null
          renda: number | null
          rg: string | null
          sexo: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          cnis?: string | null
          contato_id: string
          cpf?: string | null
          created_at?: string | null
          ctps?: string | null
          data_nascimento?: string | null
          emprego?: string | null
          empresa_id?: string | null
          estado_civil?: string | null
          filial_id?: string | null
          id?: string
          nacionalidade?: string | null
          naturalidade?: string | null
          nome_completo?: string | null
          orgao_expedidor?: string | null
          pf_obs?: string | null
          pis?: string | null
          profissao?: string | null
          renda?: number | null
          rg?: string | null
          sexo?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          cnis?: string | null
          contato_id?: string
          cpf?: string | null
          created_at?: string | null
          ctps?: string | null
          data_nascimento?: string | null
          emprego?: string | null
          empresa_id?: string | null
          estado_civil?: string | null
          filial_id?: string | null
          id?: string
          nacionalidade?: string | null
          naturalidade?: string | null
          nome_completo?: string | null
          orgao_expedidor?: string | null
          pf_obs?: string | null
          pis?: string | null
          profissao?: string | null
          renda?: number | null
          rg?: string | null
          sexo?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contato_pf_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: true
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_pf_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: true
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "contato_pf_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: true
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "contato_pf_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: true
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_pf_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: true
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_pf_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: true
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "contato_pf_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: true
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      contato_pj: {
        Row: {
          atividade_principal: string | null
          capital_social: number | null
          cnae_principal: string | null
          cnaes_secundarios: string[] | null
          cnpj: string | null
          contato_id: string
          created_at: string | null
          data_abertura: string | null
          empresa_id: string
          filial_id: string
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          matriz_filial: string | null
          municipio_ibge: string | null
          natureza_juridica: string | null
          nome_fantasia: string | null
          origem_dados: string | null
          porte: string | null
          razao_social: string | null
          regime_tributario: string | null
          situacao_cadastral: string | null
          situacao_data: string | null
          situacao_motivo: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          atividade_principal?: string | null
          capital_social?: number | null
          cnae_principal?: string | null
          cnaes_secundarios?: string[] | null
          cnpj?: string | null
          contato_id: string
          created_at?: string | null
          data_abertura?: string | null
          empresa_id: string
          filial_id: string
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          matriz_filial?: string | null
          municipio_ibge?: string | null
          natureza_juridica?: string | null
          nome_fantasia?: string | null
          origem_dados?: string | null
          porte?: string | null
          razao_social?: string | null
          regime_tributario?: string | null
          situacao_cadastral?: string | null
          situacao_data?: string | null
          situacao_motivo?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          atividade_principal?: string | null
          capital_social?: number | null
          cnae_principal?: string | null
          cnaes_secundarios?: string[] | null
          cnpj?: string | null
          contato_id?: string
          created_at?: string | null
          data_abertura?: string | null
          empresa_id?: string
          filial_id?: string
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          matriz_filial?: string | null
          municipio_ibge?: string | null
          natureza_juridica?: string | null
          nome_fantasia?: string | null
          origem_dados?: string | null
          porte?: string | null
          razao_social?: string | null
          regime_tributario?: string | null
          situacao_cadastral?: string | null
          situacao_data?: string | null
          situacao_motivo?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contato_pj_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: true
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_pj_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: true
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "contato_pj_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: true
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "contato_pj_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: true
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_pj_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: true
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_pj_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: true
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "contato_pj_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: true
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      contato_vinculos: {
        Row: {
          bidirecional: boolean | null
          contato_id: string
          created_at: string | null
          empresa_id: string | null
          filial_id: string | null
          id: string
          observacao: string | null
          tenant_id: string
          tipo_vinculo: string
          updated_at: string | null
          user_id: string
          vinculado_id: string
        }
        Insert: {
          bidirecional?: boolean | null
          contato_id: string
          created_at?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          observacao?: string | null
          tenant_id: string
          tipo_vinculo: string
          updated_at?: string | null
          user_id: string
          vinculado_id: string
        }
        Update: {
          bidirecional?: boolean | null
          contato_id?: string
          created_at?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          observacao?: string | null
          tenant_id?: string
          tipo_vinculo?: string
          updated_at?: string | null
          user_id?: string
          vinculado_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contato_vinculos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_vinculos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "contato_vinculos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "contato_vinculos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_vinculos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_vinculos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "contato_vinculos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "contato_vinculos_vinculado_id_fkey"
            columns: ["vinculado_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_vinculos_vinculado_id_fkey"
            columns: ["vinculado_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "contato_vinculos_vinculado_id_fkey"
            columns: ["vinculado_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "contato_vinculos_vinculado_id_fkey"
            columns: ["vinculado_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_vinculos_vinculado_id_fkey"
            columns: ["vinculado_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_vinculos_vinculado_id_fkey"
            columns: ["vinculado_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "contato_vinculos_vinculado_id_fkey"
            columns: ["vinculado_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      contatos_v2: {
        Row: {
          classificacao: string | null
          cpf_cnpj: string | null
          created_at: string
          empresa_id: string | null
          filial_id: string | null
          id: string
          nome_fantasia: string
          observacao: string | null
          responsavel_id: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          classificacao?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          nome_fantasia: string
          observacao?: string | null
          responsavel_id?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          classificacao?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          nome_fantasia?: string
          observacao?: string | null
          responsavel_id?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credenciais_tribunal: {
        Row: {
          alias: string | null
          created_at: string | null
          homologado: boolean | null
          id: string
          ref_armazenamento: string
          tipo: string
          tribunal_id: string
          updated_at: string | null
          user_id: string
          valido_ate: string | null
        }
        Insert: {
          alias?: string | null
          created_at?: string | null
          homologado?: boolean | null
          id?: string
          ref_armazenamento: string
          tipo: string
          tribunal_id: string
          updated_at?: string | null
          user_id?: string
          valido_ate?: string | null
        }
        Update: {
          alias?: string | null
          created_at?: string | null
          homologado?: boolean | null
          id?: string
          ref_armazenamento?: string
          tipo?: string
          tribunal_id?: string
          updated_at?: string | null
          user_id?: string
          valido_ate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credenciais_tribunal_tribunal_id_fkey"
            columns: ["tribunal_id"]
            isOneToOne: false
            referencedRelation: "tribunais"
            referencedColumns: ["id"]
          },
        ]
      }
      docs: {
        Row: {
          armazenamento_externo: Json | null
          arquivo_nome: string | null
          arquivo_tamanho: number | null
          arquivo_tipo: string | null
          classificacao_ia: string | null
          created_at: string
          entidades_extraidas_ia: Json | null
          id: string
          local_fisico: string | null
          observacoes: string | null
          path_local: string | null
          path_storage: string | null
          resumo_conteudo_ia: string | null
          status: string
          status_analise_ia: string | null
          tenant_id: string
          titulo: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          armazenamento_externo?: Json | null
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          arquivo_tipo?: string | null
          classificacao_ia?: string | null
          created_at?: string
          entidades_extraidas_ia?: Json | null
          id?: string
          local_fisico?: string | null
          observacoes?: string | null
          path_local?: string | null
          path_storage?: string | null
          resumo_conteudo_ia?: string | null
          status?: string
          status_analise_ia?: string | null
          tenant_id: string
          titulo?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          armazenamento_externo?: Json | null
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          arquivo_tipo?: string | null
          classificacao_ia?: string | null
          created_at?: string
          entidades_extraidas_ia?: Json | null
          id?: string
          local_fisico?: string | null
          observacoes?: string | null
          path_local?: string | null
          path_storage?: string | null
          resumo_conteudo_ia?: string | null
          status?: string
          status_analise_ia?: string | null
          tenant_id?: string
          titulo?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      docs_etiquetas: {
        Row: {
          created_at: string
          doc_id: string
          etiqueta_id: string
          id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          doc_id: string
          etiqueta_id: string
          id?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          doc_id?: string
          etiqueta_id?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "docs_etiquetas_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "docs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "docs_etiquetas_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "etiquetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "docs_etiquetas_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "vw_etiquetas_pt"
            referencedColumns: ["id"]
          },
        ]
      }
      docs_vinculos: {
        Row: {
          created_at: string
          doc_id: string
          id: string
          tenant_id: string
          vinculo_id: string
          vinculo_tipo: string
        }
        Insert: {
          created_at?: string
          doc_id: string
          id?: string
          tenant_id: string
          vinculo_id: string
          vinculo_tipo: string
        }
        Update: {
          created_at?: string
          doc_id?: string
          id?: string
          tenant_id?: string
          vinculo_id?: string
          vinculo_tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "docs_vinculos_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "docs"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          conteudo_html: string | null
          created_at: string
          id: string
          modelo_id: string | null
          processo_id: string | null
          status: string
          tenant_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          conteudo_html?: string | null
          created_at?: string
          id?: string
          modelo_id?: string | null
          processo_id?: string | null
          status?: string
          tenant_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          conteudo_html?: string | null
          created_at?: string
          id?: string
          modelo_id?: string | null
          processo_id?: string | null
          status?: string
          tenant_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "biblioteca_modelos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "vw_biblioteca_grid"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      email_contas: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          empresa_id: string | null
          filial_id: string | null
          id: string
          nome: string
          smtp_host: string
          smtp_pass: string
          smtp_port: number
          smtp_user: string
          tls_ssl: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          nome: string
          smtp_host: string
          smtp_pass: string
          smtp_port?: number
          smtp_user: string
          tls_ssl?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          nome?: string
          smtp_host?: string
          smtp_pass?: string
          smtp_port?: number
          smtp_user?: string
          tls_ssl?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          assunto: string
          conta_id: string
          contato_id: string | null
          created_at: string
          destinatario_email: string
          enviado_em: string | null
          id: string
          mensagem_erro: string | null
          payload: Json | null
          status: Database["public"]["Enums"]["email_status"]
          tentativa: number
          trigger_id: string | null
          user_id: string
        }
        Insert: {
          assunto: string
          conta_id: string
          contato_id?: string | null
          created_at?: string
          destinatario_email: string
          enviado_em?: string | null
          id?: string
          mensagem_erro?: string | null
          payload?: Json | null
          status?: Database["public"]["Enums"]["email_status"]
          tentativa?: number
          trigger_id?: string | null
          user_id: string
        }
        Update: {
          assunto?: string
          conta_id?: string
          contato_id?: string | null
          created_at?: string
          destinatario_email?: string
          enviado_em?: string | null
          id?: string
          mensagem_erro?: string | null
          payload?: Json | null
          status?: Database["public"]["Enums"]["email_status"]
          tentativa?: number
          trigger_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_triggers: {
        Row: {
          ativo: boolean
          conta_id: string
          created_at: string
          descricao: string | null
          empresa_id: string | null
          filial_id: string | null
          id: string
          modelo_id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          conta_id: string
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          modelo_id: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          conta_id?: string
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          modelo_id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      estoque_localizacoes: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          empresa_id: string | null
          endereco: string | null
          filial_id: string | null
          id: string
          nome: string
          tenant_id: string
          tipo: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          empresa_id?: string | null
          endereco?: string | null
          filial_id?: string | null
          id?: string
          nome: string
          tenant_id: string
          tipo?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          empresa_id?: string | null
          endereco?: string | null
          filial_id?: string | null
          id?: string
          nome?: string
          tenant_id?: string
          tipo?: string | null
        }
        Relationships: []
      }
      estoque_movimentacoes: {
        Row: {
          chave_nfe: string | null
          created_at: string | null
          data_movimentacao: string | null
          documento_origem: string | null
          id: string
          local_destino_id: string | null
          local_origem_id: string | null
          observacao: string | null
          origem_modulo: string | null
          produto_id: string | null
          quantidade: number
          referencia_id: string | null
          tenant_id: string
          tipo_movimentacao: string | null
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          chave_nfe?: string | null
          created_at?: string | null
          data_movimentacao?: string | null
          documento_origem?: string | null
          id?: string
          local_destino_id?: string | null
          local_origem_id?: string | null
          observacao?: string | null
          origem_modulo?: string | null
          produto_id?: string | null
          quantidade: number
          referencia_id?: string | null
          tenant_id: string
          tipo_movimentacao?: string | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          chave_nfe?: string | null
          created_at?: string | null
          data_movimentacao?: string | null
          documento_origem?: string | null
          id?: string
          local_destino_id?: string | null
          local_origem_id?: string | null
          observacao?: string | null
          origem_modulo?: string | null
          produto_id?: string | null
          quantidade?: number
          referencia_id?: string | null
          tenant_id?: string
          tipo_movimentacao?: string | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_local_destino_id_fkey"
            columns: ["local_destino_id"]
            isOneToOne: false
            referencedRelation: "estoque_localizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_local_origem_id_fkey"
            columns: ["local_origem_id"]
            isOneToOne: false
            referencedRelation: "estoque_localizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "v_produtos_busca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "v_produtos_estoque"
            referencedColumns: ["produto_id"]
          },
        ]
      }
      estoque_saldos: {
        Row: {
          custo_medio: number | null
          localizacao_id: string
          produto_id: string
          quantidade: number | null
          updated_at: string | null
        }
        Insert: {
          custo_medio?: number | null
          localizacao_id: string
          produto_id: string
          quantidade?: number | null
          updated_at?: string | null
        }
        Update: {
          custo_medio?: number | null
          localizacao_id?: string
          produto_id?: string
          quantidade?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_saldos_localizacao_id_fkey"
            columns: ["localizacao_id"]
            isOneToOne: false
            referencedRelation: "estoque_localizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_saldos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_saldos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "v_produtos_busca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_saldos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "v_produtos_estoque"
            referencedColumns: ["produto_id"]
          },
        ]
      }
      etiqueta_vinculos: {
        Row: {
          created_at: string
          empresa_id: string | null
          etiqueta_id: string
          filial_id: string | null
          id: string
          referencia_id: string
          referencia_tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          etiqueta_id: string
          filial_id?: string | null
          id?: string
          referencia_id: string
          referencia_tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          etiqueta_id?: string
          filial_id?: string | null
          id?: string
          referencia_id?: string
          referencia_tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "etiqueta_vinculos_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "etiquetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etiqueta_vinculos_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "vw_etiquetas_pt"
            referencedColumns: ["id"]
          },
        ]
      }
      etiquetas: {
        Row: {
          ativa: boolean
          configuracao: Json | null
          cor: string | null
          created_at: string
          descricao: string | null
          empresa_id: string | null
          escopo_modulos: string[] | null
          filial_id: string | null
          grupo: string | null
          icone: string | null
          id: string
          nome: string
          slug: string
          tipo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativa?: boolean
          configuracao?: Json | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          escopo_modulos?: string[] | null
          filial_id?: string | null
          grupo?: string | null
          icone?: string | null
          id?: string
          nome: string
          slug: string
          tipo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativa?: boolean
          configuracao?: Json | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          escopo_modulos?: string[] | null
          filial_id?: string | null
          grupo?: string | null
          icone?: string | null
          id?: string
          nome?: string
          slug?: string
          tipo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      filas_atendimento: {
        Row: {
          cor: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          mensagem_fora_horario: string | null
          mensagem_saudacao: string | null
          nome: string
          ordem: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          mensagem_fora_horario?: string | null
          mensagem_saudacao?: string | null
          nome: string
          ordem?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          mensagem_fora_horario?: string | null
          mensagem_saudacao?: string | null
          nome?: string
          ordem?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "filas_atendimento_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "saas_empresas"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      financeiro_contas: {
        Row: {
          agencia: string | null
          banco: string | null
          conta: string | null
          created_at: string
          id: number
          nome: string
          observacoes: string | null
          pix: string | null
          saldo_atual: number
          saldo_inicial: number
          tipo: Database["public"]["Enums"]["tipo_conta_financeira"]
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          conta?: string | null
          created_at?: string
          id?: number
          nome: string
          observacoes?: string | null
          pix?: string | null
          saldo_atual?: number
          saldo_inicial?: number
          tipo: Database["public"]["Enums"]["tipo_conta_financeira"]
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          conta?: string | null
          created_at?: string
          id?: number
          nome?: string
          observacoes?: string | null
          pix?: string | null
          saldo_atual?: number
          saldo_inicial?: number
          tipo?: Database["public"]["Enums"]["tipo_conta_financeira"]
          updated_at?: string
        }
        Relationships: []
      }
      honorarios: {
        Row: {
          aprovado_em: string | null
          aprovado_por_user_id: string | null
          created_at: string | null
          dados: Json | null
          descricao: string | null
          empresa_id: string
          filial_id: string
          id: string
          status: string
          tenant_id: string
          titulo: string
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por_user_id?: string | null
          created_at?: string | null
          dados?: Json | null
          descricao?: string | null
          empresa_id: string
          filial_id: string
          id?: string
          status?: string
          tenant_id: string
          titulo: string
          updated_at?: string | null
          user_id: string
          valor?: number
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por_user_id?: string | null
          created_at?: string | null
          dados?: Json | null
          descricao?: string | null
          empresa_id?: string
          filial_id?: string
          id?: string
          status?: string
          tenant_id?: string
          titulo?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      integracao_jobs: {
        Row: {
          agendado_para: string | null
          created_at: string | null
          id: string
          payload: Json
          status: string
          tentativas: number
          tipo: string
          ultimo_erro: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agendado_para?: string | null
          created_at?: string | null
          id?: string
          payload: Json
          status?: string
          tentativas?: number
          tipo: string
          ultimo_erro?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          agendado_para?: string | null
          created_at?: string | null
          id?: string
          payload?: Json
          status?: string
          tentativas?: number
          tipo?: string
          ultimo_erro?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notas_internas: {
        Row: {
          conteudo: Json
          created_at: string | null
          empresa_id: string
          filial_id: string
          id: string
          tenant_id: string
          tipo: string | null
          updated_at: string | null
          user_id: string
          visibilidade: string | null
        }
        Insert: {
          conteudo: Json
          created_at?: string | null
          empresa_id: string
          filial_id: string
          id?: string
          tenant_id: string
          tipo?: string | null
          updated_at?: string | null
          user_id: string
          visibilidade?: string | null
        }
        Update: {
          conteudo?: Json
          created_at?: string | null
          empresa_id?: string
          filial_id?: string
          id?: string
          tenant_id?: string
          tipo?: string | null
          updated_at?: string | null
          user_id?: string
          visibilidade?: string | null
        }
        Relationships: []
      }
      notas_vinculos: {
        Row: {
          created_at: string | null
          id: string
          modulo: string
          nota_id: string
          registro_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          modulo: string
          nota_id: string
          registro_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          modulo?: string
          nota_id?: string
          registro_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_vinculos_nota_id_fkey"
            columns: ["nota_id"]
            isOneToOne: false
            referencedRelation: "notas_internas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          nome: string
          slug: string
        }
        Insert: {
          nome: string
          slug: string
        }
        Update: {
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      processo_contrato_itens: {
        Row: {
          contrato_id: string
          created_at: string
          data_vencimento: string
          descricao: string
          id: string
          observacoes: string | null
          parcela_numero: number | null
          tenant_id: string
          tipo: string
          total_parcelas: number | null
          user_id: string
          valor: number
        }
        Insert: {
          contrato_id: string
          created_at?: string
          data_vencimento: string
          descricao: string
          id?: string
          observacoes?: string | null
          parcela_numero?: number | null
          tenant_id: string
          tipo: string
          total_parcelas?: number | null
          user_id: string
          valor: number
        }
        Update: {
          contrato_id?: string
          created_at?: string
          data_vencimento?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          parcela_numero?: number | null
          tenant_id?: string
          tipo?: string
          total_parcelas?: number | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      processo_contratos: {
        Row: {
          cliente_contrato_id: string
          created_at: string
          data_aprovacao: string | null
          data_assinatura: string | null
          data_envio: string | null
          descricao: string | null
          documento_gerado_url: string | null
          documento_nome: string | null
          id: string
          observacoes: string | null
          processo_id: string
          status: Database["public"]["Enums"]["contrato_status"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["contrato_tipo"]
          titulo: string
          updated_at: string
          user_id: string
          valor_total: number | null
        }
        Insert: {
          cliente_contrato_id: string
          created_at?: string
          data_aprovacao?: string | null
          data_assinatura?: string | null
          data_envio?: string | null
          descricao?: string | null
          documento_gerado_url?: string | null
          documento_nome?: string | null
          id?: string
          observacoes?: string | null
          processo_id: string
          status?: Database["public"]["Enums"]["contrato_status"]
          tenant_id: string
          tipo?: Database["public"]["Enums"]["contrato_tipo"]
          titulo: string
          updated_at?: string
          user_id: string
          valor_total?: number | null
        }
        Update: {
          cliente_contrato_id?: string
          created_at?: string
          data_aprovacao?: string | null
          data_assinatura?: string | null
          data_envio?: string | null
          descricao?: string | null
          documento_gerado_url?: string | null
          documento_nome?: string | null
          id?: string
          observacoes?: string | null
          processo_id?: string
          status?: Database["public"]["Enums"]["contrato_status"]
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["contrato_tipo"]
          titulo?: string
          updated_at?: string
          user_id?: string
          valor_total?: number | null
        }
        Relationships: []
      }
      processo_desdobramentos: {
        Row: {
          comarca: string | null
          created_at: string
          data_distribuicao: string | null
          descricao: string | null
          id: string
          numero_processo: string
          processo_principal_id: string
          tenant_id: string
          tipo: string
          tribunal: string | null
          updated_at: string
          user_id: string
          vara: string | null
        }
        Insert: {
          comarca?: string | null
          created_at?: string
          data_distribuicao?: string | null
          descricao?: string | null
          id?: string
          numero_processo: string
          processo_principal_id: string
          tenant_id: string
          tipo: string
          tribunal?: string | null
          updated_at?: string
          user_id: string
          vara?: string | null
        }
        Update: {
          comarca?: string | null
          created_at?: string
          data_distribuicao?: string | null
          descricao?: string | null
          id?: string
          numero_processo?: string
          processo_principal_id?: string
          tenant_id?: string
          tipo?: string
          tribunal?: string | null
          updated_at?: string
          user_id?: string
          vara?: string | null
        }
        Relationships: []
      }
      processo_etiquetas: {
        Row: {
          created_at: string
          etiqueta_id: string
          processo_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          etiqueta_id: string
          processo_id: string
          tenant_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          etiqueta_id?: string
          processo_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processo_etiquetas_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "etiquetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processo_etiquetas_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "vw_etiquetas_pt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processo_etiquetas_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      processo_honorarios: {
        Row: {
          assinatura_email: string | null
          assinatura_ip: unknown
          assinatura_metodo: string | null
          assinatura_nome: string | null
          cha_documento_id: string | null
          cha_gerado: boolean | null
          created_at: string
          data_aprovacao: string | null
          data_assinatura: string | null
          id: string
          justificativa_diferenca: string | null
          objeto: string
          observacoes: string | null
          processo_id: string
          status: Database["public"]["Enums"]["honorario_status"]
          tenant_id: string
          updated_at: string
          user_id: string
          valor_total_cobrado: number | null
          valor_total_definido: number | null
        }
        Insert: {
          assinatura_email?: string | null
          assinatura_ip?: unknown
          assinatura_metodo?: string | null
          assinatura_nome?: string | null
          cha_documento_id?: string | null
          cha_gerado?: boolean | null
          created_at?: string
          data_aprovacao?: string | null
          data_assinatura?: string | null
          id?: string
          justificativa_diferenca?: string | null
          objeto: string
          observacoes?: string | null
          processo_id: string
          status?: Database["public"]["Enums"]["honorario_status"]
          tenant_id: string
          updated_at?: string
          user_id: string
          valor_total_cobrado?: number | null
          valor_total_definido?: number | null
        }
        Update: {
          assinatura_email?: string | null
          assinatura_ip?: unknown
          assinatura_metodo?: string | null
          assinatura_nome?: string | null
          cha_documento_id?: string | null
          cha_gerado?: boolean | null
          created_at?: string
          data_aprovacao?: string | null
          data_assinatura?: string | null
          id?: string
          justificativa_diferenca?: string | null
          objeto?: string
          observacoes?: string | null
          processo_id?: string
          status?: Database["public"]["Enums"]["honorario_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
          valor_total_cobrado?: number | null
          valor_total_definido?: number | null
        }
        Relationships: []
      }
      processo_honorarios_eventos: {
        Row: {
          created_at: string
          dados_antes: Json | null
          dados_depois: Json | null
          descricao: string
          honorario_id: string
          id: string
          metadata: Json | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["honorario_evento_tipo"]
          user_id: string
        }
        Insert: {
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          descricao: string
          honorario_id: string
          id?: string
          metadata?: Json | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["honorario_evento_tipo"]
          user_id: string
        }
        Update: {
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          descricao?: string
          honorario_id?: string
          id?: string
          metadata?: Json | null
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["honorario_evento_tipo"]
          user_id?: string
        }
        Relationships: []
      }
      processo_honorarios_item: {
        Row: {
          created_at: string
          descricao: string
          honorario_id: string
          id: string
          observacoes: string | null
          percentual_exito: number | null
          referencia_oab: string | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["honorario_tipo"]
          user_id: string
          valor_cobrado: number | null
          valor_definido: number | null
        }
        Insert: {
          created_at?: string
          descricao: string
          honorario_id: string
          id?: string
          observacoes?: string | null
          percentual_exito?: number | null
          referencia_oab?: string | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["honorario_tipo"]
          user_id: string
          valor_cobrado?: number | null
          valor_definido?: number | null
        }
        Update: {
          created_at?: string
          descricao?: string
          honorario_id?: string
          id?: string
          observacoes?: string | null
          percentual_exito?: number | null
          referencia_oab?: string | null
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["honorario_tipo"]
          user_id?: string
          valor_cobrado?: number | null
          valor_definido?: number | null
        }
        Relationships: []
      }
      processo_honorarios_parcela: {
        Row: {
          created_at: string
          data_vencimento: string
          dia_vencimento: number | null
          honorario_item_id: string
          id: string
          numero_parcela: number
          observacoes: string | null
          recorrente: boolean | null
          status: Database["public"]["Enums"]["honorario_parcela_status"]
          tenant_id: string
          transacao_financeira_id: string | null
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_vencimento: string
          dia_vencimento?: number | null
          honorario_item_id: string
          id?: string
          numero_parcela: number
          observacoes?: string | null
          recorrente?: boolean | null
          status?: Database["public"]["Enums"]["honorario_parcela_status"]
          tenant_id: string
          transacao_financeira_id?: string | null
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          data_vencimento?: string
          dia_vencimento?: number | null
          honorario_item_id?: string
          id?: string
          numero_parcela?: number
          observacoes?: string | null
          recorrente?: boolean | null
          status?: Database["public"]["Enums"]["honorario_parcela_status"]
          tenant_id?: string
          transacao_financeira_id?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      processo_movimentacoes: {
        Row: {
          created_at: string
          data_movimentacao: string
          descricao: string | null
          documento_nome: string | null
          documento_url: string | null
          hash_deduplicacao: string | null
          id: string
          id_tribunal: string | null
          metadata: Json | null
          processo_id: string
          tenant_id: string
          tipo: Database["public"]["Enums"]["movimentacao_tipo"]
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_movimentacao: string
          descricao?: string | null
          documento_nome?: string | null
          documento_url?: string | null
          hash_deduplicacao?: string | null
          id?: string
          id_tribunal?: string | null
          metadata?: Json | null
          processo_id: string
          tenant_id: string
          tipo: Database["public"]["Enums"]["movimentacao_tipo"]
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_movimentacao?: string
          descricao?: string | null
          documento_nome?: string | null
          documento_url?: string | null
          hash_deduplicacao?: string | null
          id?: string
          id_tribunal?: string | null
          metadata?: Json | null
          processo_id?: string
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["movimentacao_tipo"]
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      processo_partes: {
        Row: {
          contato_id: string
          created_at: string
          id: string
          observacoes: string | null
          principal: boolean | null
          processo_id: string
          qualificacao: Database["public"]["Enums"]["qualificacao_parte"]
          tenant_id: string
          tipo: string | null
          user_id: string
        }
        Insert: {
          contato_id: string
          created_at?: string
          id?: string
          observacoes?: string | null
          principal?: boolean | null
          processo_id: string
          qualificacao: Database["public"]["Enums"]["qualificacao_parte"]
          tenant_id?: string
          tipo?: string | null
          user_id: string
        }
        Update: {
          contato_id?: string
          created_at?: string
          id?: string
          observacoes?: string | null
          principal?: boolean | null
          processo_id?: string
          qualificacao?: Database["public"]["Enums"]["qualificacao_parte"]
          tenant_id?: string
          tipo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_processo_partes_processo"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      processos: {
        Row: {
          created_at: string
          descricao: string | null
          empresa_id: string | null
          filial_id: string | null
          id: string
          local: string | null
          status: string
          tenant_id: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          local?: string | null
          status?: string
          tenant_id: string
          titulo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          local?: string | null
          status?: string
          tenant_id?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      processos_config: {
        Row: {
          advogado_responsavel_id: string | null
          created_at: string
          empresa_id: string | null
          filial_id: string | null
          id: string
          instancia_padrao: string | null
          status_padrao: string | null
          template_oportunidade: string | null
          tenant_id: string
          tipo_padrao: string | null
          updated_at: string
        }
        Insert: {
          advogado_responsavel_id?: string | null
          created_at?: string
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          instancia_padrao?: string | null
          status_padrao?: string | null
          template_oportunidade?: string | null
          tenant_id: string
          tipo_padrao?: string | null
          updated_at?: string
        }
        Update: {
          advogado_responsavel_id?: string | null
          created_at?: string
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          instancia_padrao?: string | null
          status_padrao?: string | null
          template_oportunidade?: string | null
          tenant_id?: string
          tipo_padrao?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      processos_fase_templates: {
        Row: {
          alerta_dias: number | null
          created_at: string
          etiqueta_auto_id: string | null
          etiqueta_fase_id: string
          id: string
          tarefa_descricao: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          alerta_dias?: number | null
          created_at?: string
          etiqueta_auto_id?: string | null
          etiqueta_fase_id: string
          id?: string
          tarefa_descricao: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          alerta_dias?: number | null
          created_at?: string
          etiqueta_auto_id?: string | null
          etiqueta_fase_id?: string
          id?: string
          tarefa_descricao?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processos_fase_templates_etiqueta_auto_id_fkey"
            columns: ["etiqueta_auto_id"]
            isOneToOne: false
            referencedRelation: "etiquetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_fase_templates_etiqueta_auto_id_fkey"
            columns: ["etiqueta_auto_id"]
            isOneToOne: false
            referencedRelation: "vw_etiquetas_pt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_fase_templates_etiqueta_fase_id_fkey"
            columns: ["etiqueta_fase_id"]
            isOneToOne: false
            referencedRelation: "etiquetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_fase_templates_etiqueta_fase_id_fkey"
            columns: ["etiqueta_fase_id"]
            isOneToOne: false
            referencedRelation: "vw_etiquetas_pt"
            referencedColumns: ["id"]
          },
        ]
      }
      processos_tj: {
        Row: {
          admitida_execucao: boolean | null
          antecipacao_tutela: string | null
          assunto: string | null
          atualizado_em: string | null
          chave_processo: string | null
          classe: string | null
          comarca: string | null
          competencia: string | null
          criado_em: string | null
          crianca_adolescente: boolean | null
          data_autuacao: string | null
          data_ultima_verificacao: string | null
          doenca_grave: boolean | null
          id: string
          instancia: string | null
          juiz_responsavel: string | null
          justica_gratuita: string | null
          link_consulta: string | null
          nivel_sigilo: number | null
          nivel_sigilo_desc: string | null
          numero_cnj: string | null
          numero_oficial: string
          orgao_julgador: string | null
          origem_dados: string | null
          peticao_urgente: boolean | null
          processo_digitalizado: boolean | null
          processo_id: string
          reconvencao: boolean | null
          reu_preso: boolean | null
          senha_acesso: string | null
          sistema_judicial: string | null
          situacao: string | null
          tenant_id: string
          tipo_justica: string | null
          tribunal: string | null
          uf: string | null
          ultimo_status_tj: string | null
          valor_causa: number | null
          vara: string | null
        }
        Insert: {
          admitida_execucao?: boolean | null
          antecipacao_tutela?: string | null
          assunto?: string | null
          atualizado_em?: string | null
          chave_processo?: string | null
          classe?: string | null
          comarca?: string | null
          competencia?: string | null
          criado_em?: string | null
          crianca_adolescente?: boolean | null
          data_autuacao?: string | null
          data_ultima_verificacao?: string | null
          doenca_grave?: boolean | null
          id?: string
          instancia?: string | null
          juiz_responsavel?: string | null
          justica_gratuita?: string | null
          link_consulta?: string | null
          nivel_sigilo?: number | null
          nivel_sigilo_desc?: string | null
          numero_cnj?: string | null
          numero_oficial: string
          orgao_julgador?: string | null
          origem_dados?: string | null
          peticao_urgente?: boolean | null
          processo_digitalizado?: boolean | null
          processo_id: string
          reconvencao?: boolean | null
          reu_preso?: boolean | null
          senha_acesso?: string | null
          sistema_judicial?: string | null
          situacao?: string | null
          tenant_id: string
          tipo_justica?: string | null
          tribunal?: string | null
          uf?: string | null
          ultimo_status_tj?: string | null
          valor_causa?: number | null
          vara?: string | null
        }
        Update: {
          admitida_execucao?: boolean | null
          antecipacao_tutela?: string | null
          assunto?: string | null
          atualizado_em?: string | null
          chave_processo?: string | null
          classe?: string | null
          comarca?: string | null
          competencia?: string | null
          criado_em?: string | null
          crianca_adolescente?: boolean | null
          data_autuacao?: string | null
          data_ultima_verificacao?: string | null
          doenca_grave?: boolean | null
          id?: string
          instancia?: string | null
          juiz_responsavel?: string | null
          justica_gratuita?: string | null
          link_consulta?: string | null
          nivel_sigilo?: number | null
          nivel_sigilo_desc?: string | null
          numero_cnj?: string | null
          numero_oficial?: string
          orgao_julgador?: string | null
          origem_dados?: string | null
          peticao_urgente?: boolean | null
          processo_digitalizado?: boolean | null
          processo_id?: string
          reconvencao?: boolean | null
          reu_preso?: boolean | null
          senha_acesso?: string | null
          sistema_judicial?: string | null
          situacao?: string | null
          tenant_id?: string
          tipo_justica?: string | null
          tribunal?: string | null
          uf?: string | null
          ultimo_status_tj?: string | null
          valor_causa?: number | null
          vara?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processos_tj_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: true
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      processos_vinculos: {
        Row: {
          classe_processual: string | null
          created_at: string | null
          id: string
          numero_cnj: string
          orgao_julgador: string | null
          processo_id: string
          tenant_id: string
          tribunal_id: string
          ultima_sincronizacao_em: string | null
          user_id: string
        }
        Insert: {
          classe_processual?: string | null
          created_at?: string | null
          id?: string
          numero_cnj: string
          orgao_julgador?: string | null
          processo_id: string
          tenant_id: string
          tribunal_id: string
          ultima_sincronizacao_em?: string | null
          user_id?: string
        }
        Update: {
          classe_processual?: string | null
          created_at?: string | null
          id?: string
          numero_cnj?: string
          orgao_julgador?: string | null
          processo_id?: string
          tenant_id?: string
          tribunal_id?: string
          ultima_sincronizacao_em?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processos_vinculos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_vinculos_tribunal_id_fkey"
            columns: ["tribunal_id"]
            isOneToOne: false
            referencedRelation: "tribunais"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          apelido: string | null
          aprovado_em: string | null
          ativo: boolean | null
          atributos: Json | null
          atualizado_por: string | null
          categoria_id: string | null
          cest: string | null
          cfop_padrao: string | null
          codigo_barras: string | null
          codigo_interno: string
          controla_estoque: boolean | null
          created_at: string | null
          criado_por: string | null
          cst: string | null
          custo_medio: number | null
          custo_reposicao: number | null
          descricao: string
          dimensoes: Json | null
          estoque_minimo: number | null
          fator_conversao: number | null
          foto_capa_url: string | null
          id: string
          marca_id: string | null
          ncm: string | null
          nome: string
          origem_fiscal: number | null
          peso_kg: number | null
          preco_base: number | null
          preco_venda: number | null
          sku: string | null
          status: Database["public"]["Enums"]["produto_status"]
          tenant_id: string
          tipo: string | null
          unidade_compra: string | null
          unidade_id: string | null
          unidade_principal: string | null
          updated_at: string | null
        }
        Insert: {
          apelido?: string | null
          aprovado_em?: string | null
          ativo?: boolean | null
          atributos?: Json | null
          atualizado_por?: string | null
          categoria_id?: string | null
          cest?: string | null
          cfop_padrao?: string | null
          codigo_barras?: string | null
          codigo_interno: string
          controla_estoque?: boolean | null
          created_at?: string | null
          criado_por?: string | null
          cst?: string | null
          custo_medio?: number | null
          custo_reposicao?: number | null
          descricao: string
          dimensoes?: Json | null
          estoque_minimo?: number | null
          fator_conversao?: number | null
          foto_capa_url?: string | null
          id?: string
          marca_id?: string | null
          ncm?: string | null
          nome?: string
          origem_fiscal?: number | null
          peso_kg?: number | null
          preco_base?: number | null
          preco_venda?: number | null
          sku?: string | null
          status?: Database["public"]["Enums"]["produto_status"]
          tenant_id: string
          tipo?: string | null
          unidade_compra?: string | null
          unidade_id?: string | null
          unidade_principal?: string | null
          updated_at?: string | null
        }
        Update: {
          apelido?: string | null
          aprovado_em?: string | null
          ativo?: boolean | null
          atributos?: Json | null
          atualizado_por?: string | null
          categoria_id?: string | null
          cest?: string | null
          cfop_padrao?: string | null
          codigo_barras?: string | null
          codigo_interno?: string
          controla_estoque?: boolean | null
          created_at?: string | null
          criado_por?: string | null
          cst?: string | null
          custo_medio?: number | null
          custo_reposicao?: number | null
          descricao?: string
          dimensoes?: Json | null
          estoque_minimo?: number | null
          fator_conversao?: number | null
          foto_capa_url?: string | null
          id?: string
          marca_id?: string | null
          ncm?: string | null
          nome?: string
          origem_fiscal?: number | null
          peso_kg?: number | null
          preco_base?: number | null
          preco_venda?: number | null
          sku?: string | null
          status?: Database["public"]["Enums"]["produto_status"]
          tenant_id?: string
          tipo?: string | null
          unidade_compra?: string | null
          unidade_id?: string | null
          unidade_principal?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "produtos_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "produtos_marcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "produtos_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_categorias: {
        Row: {
          created_at: string
          id: string
          nome: string
          pai_id: string | null
          path: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          pai_id?: string | null
          path?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          pai_id?: string | null
          path?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categorias_pai_id_fkey"
            columns: ["pai_id"]
            isOneToOne: false
            referencedRelation: "produtos_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_codigos_alternativos: {
        Row: {
          codigo: string
          created_at: string | null
          fornecedor_id: string | null
          id: string
          produto_id: string | null
          tipo: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          fornecedor_id?: string | null
          id?: string
          produto_id?: string | null
          tipo?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          fornecedor_id?: string | null
          id?: string
          produto_id?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_codigos_alternativos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_codigos_alternativos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "produtos_codigos_alternativos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "produtos_codigos_alternativos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_codigos_alternativos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_codigos_alternativos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "produtos_codigos_alternativos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "produtos_codigos_alternativos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_codigos_alternativos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "v_produtos_busca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_codigos_alternativos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "v_produtos_estoque"
            referencedColumns: ["produto_id"]
          },
        ]
      }
      produtos_imagens: {
        Row: {
          arquivo_url: string
          created_at: string
          id: string
          posicao: number | null
          produto_id: string
          tenant_id: string
        }
        Insert: {
          arquivo_url: string
          created_at?: string
          id?: string
          posicao?: number | null
          produto_id: string
          tenant_id: string
        }
        Update: {
          arquivo_url?: string
          created_at?: string
          id?: string
          posicao?: number | null
          produto_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_imagens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_imagens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "v_produtos_busca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_imagens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "v_produtos_estoque"
            referencedColumns: ["produto_id"]
          },
        ]
      }
      produtos_marcas: {
        Row: {
          created_at: string
          id: string
          nome: string
          site: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          site?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          site?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      produtos_referencia: {
        Row: {
          codigo_externo: string | null
          contato_id: string
          criado_em: string | null
          descricao_externa: string | null
          fator_conversao: number | null
          id: string
          marca_externa: string | null
          ncm_externo: string | null
          observacoes: string | null
          produto_id: string
          tenant_id: string
          unidade_externa: string | null
        }
        Insert: {
          codigo_externo?: string | null
          contato_id: string
          criado_em?: string | null
          descricao_externa?: string | null
          fator_conversao?: number | null
          id?: string
          marca_externa?: string | null
          ncm_externo?: string | null
          observacoes?: string | null
          produto_id: string
          tenant_id: string
          unidade_externa?: string | null
        }
        Update: {
          codigo_externo?: string | null
          contato_id?: string
          criado_em?: string | null
          descricao_externa?: string | null
          fator_conversao?: number | null
          id?: string
          marca_externa?: string | null
          ncm_externo?: string | null
          observacoes?: string | null
          produto_id?: string
          tenant_id?: string
          unidade_externa?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_referencia_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_referencia_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "v_produtos_busca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_referencia_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "v_produtos_estoque"
            referencedColumns: ["produto_id"]
          },
        ]
      }
      produtos_unidades: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          sigla: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          sigla: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          sigla?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_audit_log: {
        Row: {
          change_reason: string | null
          changed_at: string | null
          changed_by: string
          id: string
          new_role: Database["public"]["Enums"]["app_role"] | null
          old_role: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by: string
          id?: string
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          user_id: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string
          id?: string
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          celular: string | null
          created_at: string
          eh_primeiro_acesso: boolean | null
          email: string
          empresa_id: string | null
          filial_id: string | null
          nome: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
          sip_caller_id: string | null
          sip_host: string | null
          sip_ramal: string | null
          sip_registrar: string | null
          sip_senha: string | null
          sip_status: string | null
          sip_ws_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          celular?: string | null
          created_at?: string
          eh_primeiro_acesso?: boolean | null
          email: string
          empresa_id?: string | null
          filial_id?: string | null
          nome: string
          profile_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          sip_caller_id?: string | null
          sip_host?: string | null
          sip_ramal?: string | null
          sip_registrar?: string | null
          sip_senha?: string | null
          sip_status?: string | null
          sip_ws_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          celular?: string | null
          created_at?: string
          eh_primeiro_acesso?: boolean | null
          email?: string
          empresa_id?: string | null
          filial_id?: string | null
          nome?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          sip_caller_id?: string | null
          sip_host?: string | null
          sip_ramal?: string | null
          sip_registrar?: string | null
          sip_senha?: string | null
          sip_status?: string | null
          sip_ws_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_empresa"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "saas_empresas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fk_profiles_filial"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "saas_filiais"
            referencedColumns: ["filial_id"]
          },
        ]
      }
      saas_assinaturas: {
        Row: {
          assinatura_id: string
          created_at: string
          dia_vencimento: number
          empresa_id: string | null
          empresa_uuid: string | null
          plano_id: string | null
          plano_uuid: string | null
          status: string
          tenant_id: string | null
          trial_until: string | null
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          assinatura_id?: string
          created_at?: string
          dia_vencimento: number
          empresa_id?: string | null
          empresa_uuid?: string | null
          plano_id?: string | null
          plano_uuid?: string | null
          status?: string
          tenant_id?: string | null
          trial_until?: string | null
          updated_at?: string
          valor_mensal: number
        }
        Update: {
          assinatura_id?: string
          created_at?: string
          dia_vencimento?: number
          empresa_id?: string | null
          empresa_uuid?: string | null
          plano_id?: string | null
          plano_uuid?: string | null
          status?: string
          tenant_id?: string | null
          trial_until?: string | null
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_saas_assinaturas_empresa"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "saas_empresas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fk_saas_assinaturas_plano"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "saas_planos"
            referencedColumns: ["plano_id"]
          },
          {
            foreignKeyName: "saas_assinaturas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "saas_empresas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "saas_assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "saas_planos"
            referencedColumns: ["plano_id"]
          },
        ]
      }
      saas_convites: {
        Row: {
          convite_id: string
          created_at: string
          email: string
          empresa_id: string | null
          expires_at: string | null
          filial_id: string | null
          status: string
          token: string
        }
        Insert: {
          convite_id?: string
          created_at?: string
          email: string
          empresa_id?: string | null
          expires_at?: string | null
          filial_id?: string | null
          status?: string
          token: string
        }
        Update: {
          convite_id?: string
          created_at?: string
          email?: string
          empresa_id?: string | null
          expires_at?: string | null
          filial_id?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_saas_convites_empresa"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "saas_empresas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "fk_saas_convites_filial"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "saas_filiais"
            referencedColumns: ["filial_id"]
          },
        ]
      }
      saas_empresas: {
        Row: {
          ativa: boolean | null
          cnpj: string | null
          codigo: string | null
          created_at: string | null
          data_vencimento: string | null
          email: string | null
          empresa_id: string
          endereco: string | null
          nome: string
          plano: string | null
          telefone: string | null
          updated_at: string | null
          valor_plano: number | null
        }
        Insert: {
          ativa?: boolean | null
          cnpj?: string | null
          codigo?: string | null
          created_at?: string | null
          data_vencimento?: string | null
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          nome: string
          plano?: string | null
          telefone?: string | null
          updated_at?: string | null
          valor_plano?: number | null
        }
        Update: {
          ativa?: boolean | null
          cnpj?: string | null
          codigo?: string | null
          created_at?: string | null
          data_vencimento?: string | null
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          nome?: string
          plano?: string | null
          telefone?: string | null
          updated_at?: string | null
          valor_plano?: number | null
        }
        Relationships: []
      }
      saas_filiais: {
        Row: {
          ativa: boolean | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          empresa_id: string
          endereco: string | null
          filial_id: string
          matriz: boolean
          nome: string
          telefone: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          empresa_id: string
          endereco?: string | null
          filial_id?: string
          matriz?: boolean
          nome: string
          telefone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          filial_id?: string
          matriz?: boolean
          nome?: string
          telefone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_saas_filiais_empresa"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "saas_empresas"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "saas_filiais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "saas_empresas"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      saas_planos: {
        Row: {
          created_at: string
          descricao: string | null
          eh_trial: boolean | null
          limite_filiais: number | null
          limite_usuarios: number | null
          nome: string
          plano_id: string
          updated_at: string
          valor_padrao: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          eh_trial?: boolean | null
          limite_filiais?: number | null
          limite_usuarios?: number | null
          nome: string
          plano_id?: string
          updated_at?: string
          valor_padrao?: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          eh_trial?: boolean | null
          limite_filiais?: number | null
          limite_usuarios?: number | null
          nome?: string
          plano_id?: string
          updated_at?: string
          valor_padrao?: number
        }
        Relationships: []
      }
      saas_superadmins: {
        Row: {
          created_at: string
          email: string
          superadmin_id: string
        }
        Insert: {
          created_at?: string
          email: string
          superadmin_id?: string
        }
        Update: {
          created_at?: string
          email?: string
          superadmin_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string | null
          actor: string | null
          created_at: string | null
          event_description: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          module: string | null
          target: string | null
          tenant_id: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          actor?: string | null
          created_at?: string | null
          event_description?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          module?: string | null
          target?: string | null
          tenant_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          actor?: string | null
          created_at?: string | null
          event_description?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          module?: string | null
          target?: string | null
          tenant_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          concluida_em: string | null
          created_at: string | null
          dados: Json | null
          descricao: string | null
          empresa_id: string
          filial_id: string
          id: string
          prazo_final: string | null
          status: string | null
          tenant_id: string
          titulo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          concluida_em?: string | null
          created_at?: string | null
          dados?: Json | null
          descricao?: string | null
          empresa_id: string
          filial_id: string
          id?: string
          prazo_final?: string | null
          status?: string | null
          tenant_id: string
          titulo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          concluida_em?: string | null
          created_at?: string | null
          dados?: Json | null
          descricao?: string | null
          empresa_id?: string
          filial_id?: string
          id?: string
          prazo_final?: string | null
          status?: string | null
          tenant_id?: string
          titulo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transacoes_financeiras: {
        Row: {
          arquivo_nome: string | null
          arquivo_tipo: string | null
          arquivo_url: string | null
          categoria: string
          compra_id: string | null
          conta_financeira_id: string
          contato_id: string | null
          created_at: string
          data_competencia: string | null
          data_emissao: string
          data_liquidacao: string | null
          data_vencimento: string
          data_vencimento_original: string | null
          empresa_id: string | null
          filial_id: string | null
          forma_pagamento: string
          historico: string
          id: string
          numero_banco: string | null
          numero_documento: string
          observacoes: string | null
          origem_id: string | null
          origem_tipo: string | null
          situacao: string
          tipo: string
          updated_at: string
          user_id: string
          valor_documento: number
          valor_recebido: number | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_tipo?: string | null
          arquivo_url?: string | null
          categoria: string
          compra_id?: string | null
          conta_financeira_id: string
          contato_id?: string | null
          created_at?: string
          data_competencia?: string | null
          data_emissao: string
          data_liquidacao?: string | null
          data_vencimento: string
          data_vencimento_original?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          forma_pagamento: string
          historico: string
          id?: string
          numero_banco?: string | null
          numero_documento: string
          observacoes?: string | null
          origem_id?: string | null
          origem_tipo?: string | null
          situacao?: string
          tipo: string
          updated_at?: string
          user_id: string
          valor_documento: number
          valor_recebido?: number | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_tipo?: string | null
          arquivo_url?: string | null
          categoria?: string
          compra_id?: string | null
          conta_financeira_id?: string
          contato_id?: string | null
          created_at?: string
          data_competencia?: string | null
          data_emissao?: string
          data_liquidacao?: string | null
          data_vencimento?: string
          data_vencimento_original?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          forma_pagamento?: string
          historico?: string
          id?: string
          numero_banco?: string | null
          numero_documento?: string
          observacoes?: string | null
          origem_id?: string | null
          origem_tipo?: string | null
          situacao?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          valor_documento?: number
          valor_recebido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_transacoes_conta_financeira"
            columns: ["conta_financeira_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transacoes_conta_financeira"
            columns: ["conta_financeira_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_conta_financeira_id_fkey"
            columns: ["conta_financeira_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_conta_financeira_id_fkey"
            columns: ["conta_financeira_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      transacoes_financeiras_etiquetas: {
        Row: {
          created_at: string
          etiqueta_id: string
          tenant_id: string
          transacao_id: string
        }
        Insert: {
          created_at?: string
          etiqueta_id: string
          tenant_id: string
          transacao_id: string
        }
        Update: {
          created_at?: string
          etiqueta_id?: string
          tenant_id?: string
          transacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_financeiras_etiquetas_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "etiquetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_etiquetas_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "vw_etiquetas_pt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_etiquetas_transacao_id_fkey"
            columns: ["transacao_id"]
            isOneToOne: false
            referencedRelation: "transacoes_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_etiquetas_transacao_id_fkey"
            columns: ["transacao_id"]
            isOneToOne: false
            referencedRelation: "vw_transacoes_financeiras_pt"
            referencedColumns: ["id"]
          },
        ]
      }
      tribunais: {
        Row: {
          ativo: boolean
          created_at: string | null
          id: string
          nome: string
          sigla: string
          sistema: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string | null
          id?: string
          nome: string
          sigla: string
          sistema: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string | null
          id?: string
          nome?: string
          sigla?: string
          sistema?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          empresa_uuid: string | null
          filial_uuid: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_uuid?: string | null
          filial_uuid?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_uuid?: string | null
          filial_uuid?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      usuario_filial_perfis: {
        Row: {
          ativo: boolean
          created_at: string | null
          empresa_id: string | null
          empresa_uuid: string | null
          filial_id: string | null
          filial_uuid: string | null
          id: string
          perfil_slug: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string | null
          empresa_id?: string | null
          empresa_uuid?: string | null
          filial_id?: string | null
          filial_uuid?: string | null
          id?: string
          perfil_slug: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string | null
          empresa_id?: string | null
          empresa_uuid?: string | null
          filial_id?: string | null
          filial_uuid?: string | null
          id?: string
          perfil_slug?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_filial_perfis_perfil_slug_fkey"
            columns: ["perfil_slug"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["slug"]
          },
        ]
      }
      vendas: {
        Row: {
          chave_nfe: string | null
          created_at: string | null
          data_emissao: string | null
          data_registro: string
          data_vencimento: string | null
          empresa_id: string | null
          filial_id: string | null
          fornecedor_id: string | null
          hash_arquivo: string | null
          id: string
          numero_nfe: string | null
          observacoes: string | null
          origem_arquivo_tipo: string | null
          origem_arquivo_url: string | null
          serie: string | null
          status: string
          tenant_id: string
          tipo: string | null
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          chave_nfe?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_registro?: string
          data_vencimento?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          fornecedor_id?: string | null
          hash_arquivo?: string | null
          id?: string
          numero_nfe?: string | null
          observacoes?: string | null
          origem_arquivo_tipo?: string | null
          origem_arquivo_url?: string | null
          serie?: string | null
          status?: string
          tenant_id: string
          tipo?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          chave_nfe?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_registro?: string
          data_vencimento?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          fornecedor_id?: string | null
          hash_arquivo?: string | null
          id?: string
          numero_nfe?: string | null
          observacoes?: string | null
          origem_arquivo_tipo?: string | null
          origem_arquivo_url?: string | null
          serie?: string | null
          status?: string
          tenant_id?: string
          tipo?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      vendas_itens: {
        Row: {
          aliquota_cofins: number | null
          aliquota_icms: number | null
          aliquota_pis: number | null
          cfop: string | null
          codigo_produto: string | null
          created_at: string | null
          descricao: string
          id: string
          ncm: string | null
          produto_id: string | null
          quantidade: number
          unidade: string | null
          valor_ipi: number | null
          valor_total: number
          valor_unitario: number
          venda_id: string
        }
        Insert: {
          aliquota_cofins?: number | null
          aliquota_icms?: number | null
          aliquota_pis?: number | null
          cfop?: string | null
          codigo_produto?: string | null
          created_at?: string | null
          descricao: string
          id?: string
          ncm?: string | null
          produto_id?: string | null
          quantidade?: number
          unidade?: string | null
          valor_ipi?: number | null
          valor_total?: number
          valor_unitario?: number
          venda_id: string
        }
        Update: {
          aliquota_cofins?: number | null
          aliquota_icms?: number | null
          aliquota_pis?: number | null
          cfop?: string | null
          codigo_produto?: string | null
          created_at?: string | null
          descricao?: string
          id?: string
          ncm?: string | null
          produto_id?: string | null
          quantidade?: number
          unidade?: string | null
          valor_ipi?: number | null
          valor_total?: number
          valor_unitario?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_parcelas: {
        Row: {
          created_at: string | null
          data_vencimento: string
          id: string
          numero_parcela: number
          transacao_id: string | null
          valor: number
          venda_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_vencimento: string
          id?: string
          numero_parcela: number
          transacao_id?: string | null
          valor: number
          venda_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_vencimento?: string
          id?: string
          numero_parcela?: number
          transacao_id?: string | null
          valor?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_parcelas_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_atendimentos: {
        Row: {
          account_id: string
          assigned_to: string | null
          created_at: string
          data_resolucao: string | null
          empresa_id: string | null
          filial_id: string | null
          id: string
          last_customer_message_at: string | null
          last_message_at: string | null
          observacoes_internas: string | null
          responsavel_id: string | null
          status: string
          status_atendimento:
            | Database["public"]["Enums"]["status_atendimento"]
            | null
          updated_at: string
          user_id: string
          wa_contact_id: string
          window_expires_at: string | null
        }
        Insert: {
          account_id: string
          assigned_to?: string | null
          created_at?: string
          data_resolucao?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          last_customer_message_at?: string | null
          last_message_at?: string | null
          observacoes_internas?: string | null
          responsavel_id?: string | null
          status?: string
          status_atendimento?:
            | Database["public"]["Enums"]["status_atendimento"]
            | null
          updated_at?: string
          user_id: string
          wa_contact_id: string
          window_expires_at?: string | null
        }
        Update: {
          account_id?: string
          assigned_to?: string | null
          created_at?: string
          data_resolucao?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          last_customer_message_at?: string | null
          last_message_at?: string | null
          observacoes_internas?: string | null
          responsavel_id?: string | null
          status?: string
          status_atendimento?:
            | Database["public"]["Enums"]["status_atendimento"]
            | null
          updated_at?: string
          user_id?: string
          wa_contact_id?: string
          window_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_threads_wa_contact_id_fkey"
            columns: ["wa_contact_id"]
            isOneToOne: false
            referencedRelation: "wa_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_configuracoes: {
        Row: {
          api_endpoint: string
          api_key: string
          created_at: string | null
          ia_api_key: string | null
          ia_enabled: boolean | null
          id: string
          instance_name: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_endpoint: string
          api_key: string
          created_at?: string | null
          ia_api_key?: string | null
          ia_enabled?: boolean | null
          id?: string
          instance_name: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_endpoint?: string
          api_key?: string
          created_at?: string | null
          ia_api_key?: string | null
          ia_enabled?: boolean | null
          id?: string
          instance_name?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wa_contacts: {
        Row: {
          account_id: string
          contato_id: string | null
          created_at: string
          empresa_id: string | null
          filial_id: string | null
          id: string
          last_seen_at: string | null
          opt_in_status: string | null
          profile_name: string | null
          updated_at: string
          user_id: string
          wa_phone_e164: string
          wa_phone_formatted: string | null
        }
        Insert: {
          account_id: string
          contato_id?: string | null
          created_at?: string
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          last_seen_at?: string | null
          opt_in_status?: string | null
          profile_name?: string | null
          updated_at?: string
          user_id: string
          wa_phone_e164: string
          wa_phone_formatted?: string | null
        }
        Update: {
          account_id?: string
          contato_id?: string | null
          created_at?: string
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          last_seen_at?: string | null
          opt_in_status?: string | null
          profile_name?: string | null
          updated_at?: string
          user_id?: string
          wa_phone_e164?: string
          wa_phone_formatted?: string | null
        }
        Relationships: []
      }
      wa_contas: {
        Row: {
          access_token_encrypted: string | null
          created_at: string | null
          display_name: string | null
          empresa_id: string | null
          filial_id: string | null
          id: string
          is_active: boolean | null
          nome_instancia: string
          phone_number: string | null
          phone_number_id: string | null
          status: string
          updated_at: string | null
          user_id: string
          waba_id: string | null
          webhook_url: string | null
          webhook_verify_token: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string | null
          display_name?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          is_active?: boolean | null
          nome_instancia: string
          phone_number?: string | null
          phone_number_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          waba_id?: string | null
          webhook_url?: string | null
          webhook_verify_token?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string | null
          display_name?: string | null
          empresa_id?: string | null
          filial_id?: string | null
          id?: string
          is_active?: boolean | null
          nome_instancia?: string
          phone_number?: string | null
          phone_number_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          waba_id?: string | null
          webhook_url?: string | null
          webhook_verify_token?: string | null
        }
        Relationships: []
      }
      wa_events_log: {
        Row: {
          account_id: string | null
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          webhook_signature: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          webhook_signature?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          webhook_signature?: string | null
        }
        Relationships: []
      }
      wa_messages: {
        Row: {
          contato_id: string | null
          content: Json
          created_at: string
          delivered_at: string | null
          direction: string
          eh_nota_interna: boolean | null
          empresa_id: string | null
          error_code: string | null
          error_message: string | null
          filial_id: string | null
          id: string
          message_type: string
          read_at: string | null
          sent_at: string | null
          status: string
          template_language: string | null
          template_name: string | null
          thread_id: string
          timestamp: string
          user_id: string
          visivel_cliente: boolean | null
          wa_message_id: string | null
        }
        Insert: {
          contato_id?: string | null
          content: Json
          created_at?: string
          delivered_at?: string | null
          direction: string
          eh_nota_interna?: boolean | null
          empresa_id?: string | null
          error_code?: string | null
          error_message?: string | null
          filial_id?: string | null
          id?: string
          message_type: string
          read_at?: string | null
          sent_at?: string | null
          status?: string
          template_language?: string | null
          template_name?: string | null
          thread_id: string
          timestamp?: string
          user_id: string
          visivel_cliente?: boolean | null
          wa_message_id?: string | null
        }
        Update: {
          contato_id?: string | null
          content?: Json
          created_at?: string
          delivered_at?: string | null
          direction?: string
          eh_nota_interna?: boolean | null
          empresa_id?: string | null
          error_code?: string | null
          error_message?: string | null
          filial_id?: string | null
          id?: string
          message_type?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string
          template_language?: string | null
          template_name?: string | null
          thread_id?: string
          timestamp?: string
          user_id?: string
          visivel_cliente?: boolean | null
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_messages_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_messages_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "wa_messages_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "wa_messages_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_messages_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_messages_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "wa_messages_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "wa_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_threads"
            referencedColumns: ["thread_id"]
          },
          {
            foreignKeyName: "wa_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "wa_atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_outbox: {
        Row: {
          account_id: string
          created_at: string
          id: string
          last_attempt_at: string | null
          max_retries: number | null
          message_id: string
          not_before: string | null
          payload: Json
          retry_count: number | null
          status: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          max_retries?: number | null
          message_id: string
          not_before?: string | null
          payload: Json
          retry_count?: number | null
          status?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          max_retries?: number | null
          message_id?: string
          not_before?: string | null
          payload?: Json
          retry_count?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_outbox_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "wa_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_respostas_rapidas: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          message: string
          shortcut: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          message: string
          shortcut: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          message?: string
          shortcut?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wa_tokens: {
        Row: {
          access_token: string
          account_id: string
          app_id: string
          app_secret: string
          created_at: string
          expires_at: string | null
          id: string
          updated_at: string
          user_id: string
          verify_token: string
          webhook_url: string | null
        }
        Insert: {
          access_token: string
          account_id: string
          app_id: string
          app_secret: string
          created_at?: string
          expires_at?: string | null
          id?: string
          updated_at?: string
          user_id: string
          verify_token: string
          webhook_url?: string | null
        }
        Update: {
          access_token?: string
          account_id?: string
          app_id?: string
          app_secret?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          verify_token?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      wa_webhooks: {
        Row: {
          account_id: string
          callback_url: string
          created_at: string
          id: string
          last_verified_at: string | null
          signature_validation: boolean | null
          status: string
          updated_at: string
          user_id: string
          verify_token: string
          webhook_fields: string[] | null
        }
        Insert: {
          account_id: string
          callback_url: string
          created_at?: string
          id?: string
          last_verified_at?: string | null
          signature_validation?: boolean | null
          status?: string
          updated_at?: string
          user_id: string
          verify_token: string
          webhook_fields?: string[] | null
        }
        Update: {
          account_id?: string
          callback_url?: string
          created_at?: string
          id?: string
          last_verified_at?: string | null
          signature_validation?: boolean | null
          status?: string
          updated_at?: string
          user_id?: string
          verify_token?: string
          webhook_fields?: string[] | null
        }
        Relationships: []
      }
      workflow_execucao_passos: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          mensagem_erro: string | null
          resultado: Json | null
          status: string
          tenant_id: string
          workflow_execucao_id: string
          workflow_passo_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          mensagem_erro?: string | null
          resultado?: Json | null
          status?: string
          tenant_id: string
          workflow_execucao_id: string
          workflow_passo_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          mensagem_erro?: string | null
          resultado?: Json | null
          status?: string
          tenant_id?: string
          workflow_execucao_id?: string
          workflow_passo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_execucao_passos_workflow_execucao_id_fkey"
            columns: ["workflow_execucao_id"]
            isOneToOne: false
            referencedRelation: "workflow_execucoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_execucao_passos_workflow_passo_id_fkey"
            columns: ["workflow_passo_id"]
            isOneToOne: false
            referencedRelation: "workflow_passos"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_execucoes: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string | null
          id: string
          mensagem_erro: string | null
          referencia_id: string
          referencia_tipo: string
          status: string
          tenant_id: string
          workflow_modelo_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          mensagem_erro?: string | null
          referencia_id: string
          referencia_tipo: string
          status?: string
          tenant_id: string
          workflow_modelo_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          mensagem_erro?: string | null
          referencia_id?: string
          referencia_tipo?: string
          status?: string
          tenant_id?: string
          workflow_modelo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_execucoes_workflow_modelo_id_fkey"
            columns: ["workflow_modelo_id"]
            isOneToOne: false
            referencedRelation: "workflow_modelos"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_modelos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          codigo: string
          configuracao: Json | null
          criado_em: string
          descricao: string | null
          filtros: Json | null
          gatilho: string
          id: string
          nome: string
          tenant_id: string | null
          tipo_referencia: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          codigo: string
          configuracao?: Json | null
          criado_em?: string
          descricao?: string | null
          filtros?: Json | null
          gatilho?: string
          id?: string
          nome: string
          tenant_id?: string | null
          tipo_referencia?: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          codigo?: string
          configuracao?: Json | null
          criado_em?: string
          descricao?: string | null
          filtros?: Json | null
          gatilho?: string
          id?: string
          nome?: string
          tenant_id?: string | null
          tipo_referencia?: string
        }
        Relationships: []
      }
      workflow_passos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          configuracao: Json
          criado_em: string
          descricao: string | null
          id: string
          ordem: number
          tenant_id: string | null
          tipo_acao: string
          workflow_modelo_id: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          configuracao?: Json
          criado_em?: string
          descricao?: string | null
          id?: string
          ordem?: number
          tenant_id?: string | null
          tipo_acao: string
          workflow_modelo_id: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          configuracao?: Json
          criado_em?: string
          descricao?: string | null
          id?: string
          ordem?: number
          tenant_id?: string | null
          tipo_acao?: string
          workflow_modelo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_passos_workflow_modelo_id_fkey"
            columns: ["workflow_modelo_id"]
            isOneToOne: false
            referencedRelation: "workflow_modelos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      security_status: {
        Row: {
          policy_count: number | null
          rls_enabled: boolean | null
          status: string | null
          tablename: unknown
        }
        Relationships: []
      }
      v_produtos_busca: {
        Row: {
          apelido: string | null
          categoria_id: string | null
          codigo_barras: string | null
          created_at: string | null
          foto_capa_url: string | null
          id: string | null
          marca_id: string | null
          ncm: string | null
          nome: string | null
          preco_base: number | null
          sku: string | null
          status: Database["public"]["Enums"]["produto_status"] | null
          tenant_id: string | null
          termo: string | null
          unidade_id: string | null
          updated_at: string | null
        }
        Insert: {
          apelido?: string | null
          categoria_id?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          foto_capa_url?: string | null
          id?: string | null
          marca_id?: string | null
          ncm?: string | null
          nome?: string | null
          preco_base?: number | null
          sku?: string | null
          status?: Database["public"]["Enums"]["produto_status"] | null
          tenant_id?: string | null
          termo?: never
          unidade_id?: string | null
          updated_at?: string | null
        }
        Update: {
          apelido?: string | null
          categoria_id?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          foto_capa_url?: string | null
          id?: string | null
          marca_id?: string | null
          ncm?: string | null
          nome?: string | null
          preco_base?: number | null
          sku?: string | null
          status?: Database["public"]["Enums"]["produto_status"] | null
          tenant_id?: string | null
          termo?: never
          unidade_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "produtos_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "produtos_marcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "produtos_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      v_produtos_estoque: {
        Row: {
          estoque_atual: number | null
          produto_id: string | null
          tenant_id: string | null
          total_comprado: number | null
          total_vendido: number | null
        }
        Insert: {
          estoque_atual?: never
          produto_id?: string | null
          tenant_id?: string | null
          total_comprado?: never
          total_vendido?: never
        }
        Update: {
          estoque_atual?: never
          produto_id?: string | null
          tenant_id?: string | null
          total_comprado?: never
          total_vendido?: never
        }
        Relationships: []
      }
      vw_agendas_grid: {
        Row: {
          contato_responsavel_id: string | null
          contato_solicitante_id: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          empresa_id: string | null
          filial_id: string | null
          id: string | null
          observacoes: string | null
          origem_config_id: string | null
          origem_modulo: string | null
          origem_registro_id: string | null
          prioridade: Database["public"]["Enums"]["agenda_prioridade"] | null
          processo_id: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          solicitante_id: string | null
          solicitante_nome: string | null
          status: Database["public"]["Enums"]["agenda_status"] | null
          tenant_id: string | null
          titulo: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendas_origem_config_id_fkey"
            columns: ["origem_config_id"]
            isOneToOne: false
            referencedRelation: "agenda_configuracoes"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_atendimento_stats: {
        Row: {
          abertos: number | null
          meus_atendimentos: number | null
          nao_atribuidos: number | null
          pendentes: number | null
          resolvidos: number | null
          tempo_medio_resolucao_horas: number | null
        }
        Relationships: []
      }
      vw_biblioteca_grid: {
        Row: {
          atualizado_por: string | null
          criado_por: string | null
          data_atualizacao: string | null
          data_criacao: string | null
          descricao: string | null
          etiquetas: string | null
          id: string | null
          tenant_id: string | null
          titulo: string | null
        }
        Relationships: []
      }
      vw_contas_compat: {
        Row: {
          agencia: string | null
          banco: string | null
          conta: string | null
          id: string | null
          nome: string | null
          tenant_id: string | null
          tipo: string | null
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          conta?: string | null
          id?: string | null
          nome?: string | null
          tenant_id?: string | null
          tipo?: string | null
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          conta?: string | null
          id?: string | null
          nome?: string | null
          tenant_id?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      vw_contatos_compat: {
        Row: {
          celular: string | null
          classificacao: string | null
          cpf_cnpj: string | null
          created_at: string | null
          email: string | null
          empresa_id: string | null
          filial_id: string | null
          id: string | null
          nome_fantasia: string | null
          observacao: string | null
          responsavel_id: string | null
          telefone: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          celular?: never
          classificacao?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: never
          empresa_id?: string | null
          filial_id?: string | null
          id?: string | null
          nome_fantasia?: string | null
          observacao?: string | null
          responsavel_id?: string | null
          telefone?: never
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          celular?: never
          classificacao?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: never
          empresa_id?: string | null
          filial_id?: string | null
          id?: string | null
          nome_fantasia?: string | null
          observacao?: string | null
          responsavel_id?: string | null
          telefone?: never
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vw_contatos_completo: {
        Row: {
          celular: string | null
          classificacao: string | null
          cnpj: string | null
          cpf: string | null
          cpf_cnpj: string | null
          created_at: string | null
          data_abertura: string | null
          data_nascimento: string | null
          email: string | null
          empresa_id: string | null
          estado_civil: string | null
          filial_id: string | null
          id: string | null
          natureza_juridica: string | null
          nome_fantasia: string | null
          observacao: string | null
          porte: string | null
          profissao: string | null
          razao_social: string | null
          responsavel_id: string | null
          rg: string | null
          sexo: string | null
          telefone: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      vw_contatos_whatsapp: {
        Row: {
          contato_id: string | null
          nome_exibicao: string | null
          numero_whatsapp: string | null
          tenant_id: string | null
        }
        Relationships: []
      }
      vw_etiquetas_pt: {
        Row: {
          ativa: boolean | null
          atualizado_em: string | null
          cor: string | null
          criado_em: string | null
          descricao: string | null
          empresa_id: string | null
          icone: string | null
          id: string | null
          nome: string | null
          slug: string | null
        }
        Insert: {
          ativa?: boolean | null
          atualizado_em?: string | null
          cor?: string | null
          criado_em?: string | null
          descricao?: string | null
          empresa_id?: string | null
          icone?: string | null
          id?: string | null
          nome?: string | null
          slug?: string | null
        }
        Update: {
          ativa?: boolean | null
          atualizado_em?: string | null
          cor?: string | null
          criado_em?: string | null
          descricao?: string | null
          empresa_id?: string | null
          icone?: string | null
          id?: string | null
          nome?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      vw_processo_partes_pt: {
        Row: {
          contato_id: string | null
          criado_em: string | null
          empresa_id: string | null
          id: string | null
          metadados: string | null
          papel: string | null
          principal: boolean | null
          processo_id: string | null
        }
        Insert: {
          contato_id?: string | null
          criado_em?: string | null
          empresa_id?: string | null
          id?: string | null
          metadados?: string | null
          papel?: never
          principal?: boolean | null
          processo_id?: string | null
        }
        Update: {
          contato_id?: string | null
          criado_em?: string | null
          empresa_id?: string | null
          id?: string | null
          metadados?: string | null
          papel?: never
          principal?: boolean | null
          processo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_processo_partes_processo"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_transacoes_financeiras_pt: {
        Row: {
          atualizado_em: string | null
          categoria: string | null
          conta_financeira_id: string | null
          contato_id: string | null
          criado_em: string | null
          data_competencia: string | null
          data_emissao: string | null
          data_liquidacao: string | null
          data_vencimento: string | null
          empresa_id: string | null
          forma_pagamento: string | null
          historico: string | null
          id: string | null
          numero_documento: string | null
          observacoes: string | null
          origem_id: string | null
          origem_tipo: string | null
          status: string | null
          tipo: string | null
          valor_documento: number | null
          valor_recebido: number | null
        }
        Insert: {
          atualizado_em?: string | null
          categoria?: string | null
          conta_financeira_id?: string | null
          contato_id?: string | null
          criado_em?: string | null
          data_competencia?: string | null
          data_emissao?: string | null
          data_liquidacao?: never
          data_vencimento?: string | null
          empresa_id?: string | null
          forma_pagamento?: string | null
          historico?: string | null
          id?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          origem_id?: string | null
          origem_tipo?: string | null
          status?: string | null
          tipo?: string | null
          valor_documento?: number | null
          valor_recebido?: never
        }
        Update: {
          atualizado_em?: string | null
          categoria?: string | null
          conta_financeira_id?: string | null
          contato_id?: string | null
          criado_em?: string | null
          data_competencia?: string | null
          data_emissao?: string | null
          data_liquidacao?: never
          data_vencimento?: string | null
          empresa_id?: string | null
          forma_pagamento?: string | null
          historico?: string | null
          id?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          origem_id?: string | null
          origem_tipo?: string | null
          status?: string | null
          tipo?: string | null
          valor_documento?: number | null
          valor_recebido?: never
        }
        Relationships: [
          {
            foreignKeyName: "fk_transacoes_conta_financeira"
            columns: ["conta_financeira_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transacoes_conta_financeira"
            columns: ["conta_financeira_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_conta_financeira_id_fkey"
            columns: ["conta_financeira_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_conta_financeira_id_fkey"
            columns: ["conta_financeira_id"]
            isOneToOne: false
            referencedRelation: "vw_contas_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["responsavel_id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_agendas_grid"
            referencedColumns: ["solicitante_id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_contatos_whatsapp"
            referencedColumns: ["contato_id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "vw_wa_contatos"
            referencedColumns: ["contato_id"]
          },
        ]
      }
      vw_wa_contatos: {
        Row: {
          contato_id: string | null
          data_vinculo: string | null
          last_seen_at: string | null
          nome_exibicao: string | null
          numero_whatsapp: string | null
          opt_in_status: string | null
          profile_name: string | null
          user_id: string | null
        }
        Relationships: []
      }
      vw_wa_threads: {
        Row: {
          contato_id: string | null
          contato_nome: string | null
          mensagens_nao_lidas: number | null
          responsavel_id: string | null
          status: string | null
          thread_id: string | null
          timestamp_ultima_mensagem: string | null
          total_mensagens: number | null
          ultima_mensagem: string | null
          user_id: string | null
          wa_contact_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_threads_wa_contact_id_fkey"
            columns: ["wa_contact_id"]
            isOneToOne: false
            referencedRelation: "wa_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_data_retention_policies: { Args: never; Returns: undefined }
      aprovar_honorario_v1: {
        Args: { honorario_id: string }
        Returns: undefined
      }
      async_detect_data_breach_patterns: { Args: never; Returns: undefined }
      atualizar_agenda_v1: {
        Args: { dados_complementares: Json; evento_id: string }
        Returns: undefined
      }
      atualizar_etapa_status_v1: {
        Args: { etapa_id: string; novo_status: string }
        Returns: undefined
      }
      atualizar_honorario_v1: {
        Args: { dados_complementares: Json; honorario_id: string }
        Returns: undefined
      }
      atualizar_processo_v1: {
        Args: { dados_complementares: Json; processo_id: string }
        Returns: Json
      }
      atualizar_tarefa_v1: {
        Args: { dados_complementares: Json; tarefa_id: string }
        Returns: undefined
      }
      audit_view_security: {
        Args: never
        Returns: {
          has_security_definer: boolean
          recommendation: string
          view_name: string
          view_schema: string
        }[]
      }
      auditar_evento: {
        Args: {
          p_action: string
          p_details: Json
          p_module: string
          p_target: string
        }
        Returns: undefined
      }
      change_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          reason?: string
          target_user_id: string
        }
        Returns: boolean
      }
      check_email_exists: { Args: { p_email: string }; Returns: boolean }
      clean_cpf_cnpj: { Args: { value: string }; Returns: string }
      cleanup_old_sensitive_data: { Args: never; Returns: undefined }
      consultar_e_gravar_cnpj: {
        Args: {
          p_cnpj: string
          p_contato_id: string
          p_empresa_id: string
          p_filial_id: string
          p_forcar_atualizacao?: boolean
          p_tenant_id: string
        }
        Returns: Json
      }
      create_default_biblioteca_grupos: {
        Args: { new_user_id: string }
        Returns: undefined
      }
      create_default_legal_tags: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      create_empresa_completa: {
        Args: {
          p_cnpj: string
          p_email_admin: string
          p_nome: string
          p_nome_admin: string
        }
        Returns: Json
      }
      create_empresa_completa_com_plano: {
        Args: {
          p_cnpj: string
          p_dia_vencimento?: number
          p_email_admin: string
          p_nome: string
          p_nome_admin: string
          p_plano?: string
          p_trial_dias?: number
          p_valor_mensal?: number
        }
        Returns: Json
      }
      create_first_admin: { Args: { user_email: string }; Returns: boolean }
      criar_agenda_v1: { Args: { dados_complementares: Json }; Returns: string }
      criar_contato_pj_transacional: {
        Args: {
          p_classificacao?: string
          p_contato_id?: string
          p_dados_pj: Json
          p_enderecos?: Json
          p_meios_contato?: Json
          p_nome_fantasia: string
          p_qsa?: Json
        }
        Returns: Json
      }
      criar_contato_transacional: {
        Args: {
          p_classificacao?: string
          p_empresa_id?: string
          p_filial_id?: string
          p_meios_contato?: Json
          p_nome_principal: string
          p_observacao?: string
          p_pessoa_tipo?: string
          p_responsavel_id?: string
          p_tipo_pessoa?: string
        }
        Returns: Json
      }
      criar_honorario_v1: {
        Args: { dados_complementares: Json }
        Returns: string
      }
      criar_nota_v1: {
        Args: {
          conteudo_nota: Json
          dados_extras?: Json
          vinculo_modulo?: string
          vinculo_registro_id?: string
        }
        Returns: string
      }
      criar_processo_v1: {
        Args: { dados_complementares: Json }
        Returns: string
      }
      criar_tarefa_v1: { Args: { dados_complementares: Json }; Returns: string }
      criar_vinculo_bidirecional: {
        Args: {
          contato_a_uuid: string
          contato_b_uuid: string
          observacao?: string
          tipo_vinculo: string
        }
        Returns: Json
      }
      current_tenant_id: { Args: never; Returns: string }
      decrypt_sensitive_data: {
        Args: { encrypted_data: string; key_name?: string }
        Returns: string
      }
      decrypt_whatsapp_session_state: {
        Args: { account_id_param: string; encrypted_state: string }
        Returns: string
      }
      decrypt_whatsapp_token: {
        Args: { account_id: string; encrypted_token: string }
        Returns: string
      }
      definir_endereco_principal: {
        Args: { contato_alvo_id: string; endereco_alvo_id: string }
        Returns: Json
      }
      deletar_agenda_v1: { Args: { evento_id: string }; Returns: undefined }
      deletar_honorario_v1: {
        Args: { honorario_id: string }
        Returns: undefined
      }
      deletar_processo_v1: { Args: { processo_id: string }; Returns: undefined }
      deletar_tarefa_v1: { Args: { tarefa_id: string }; Returns: undefined }
      detect_data_breach_patterns: { Args: never; Returns: undefined }
      detect_suspicious_data_access: { Args: never; Returns: undefined }
      emergency_admin_access: {
        Args: {
          emergency_reason: string
          justification: string
          target_table: string
        }
        Returns: Json
      }
      emergency_lockdown_contacts: { Args: never; Returns: undefined }
      encrypt_sensitive_data: {
        Args: { data: string; key_name?: string }
        Returns: string
      }
      encrypt_whatsapp_session_state: {
        Args: { account_id_param: string; state_data: string }
        Returns: string
      }
      encrypt_whatsapp_token: {
        Args: { account_id: string; token_value: string }
        Returns: string
      }
      enhanced_password_validation: {
        Args: { password: string }
        Returns: Json
      }
      excluir_contato_seguro: { Args: { p_contato_id: string }; Returns: Json }
      fix_missing_search_paths: { Args: never; Returns: string }
      fn_aprovar_compra: { Args: { p_compra_id: string }; Returns: undefined }
      fn_aprovar_venda: { Args: { p_venda_id: string }; Returns: undefined }
      fn_atualizar_contato_completo:
        | {
            Args: {
              p_classificacao?: string
              p_contato_id: string
              p_dados_pf?: Json
              p_dados_pj?: Json
              p_enderecos?: Json
              p_meios_contato?: Json
              p_nome?: string
              p_observacao?: string
              p_responsavel_id?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_contato_id: string
              p_dados_pf?: Json
              p_dados_pj?: Json
              p_empresa_id: number
              p_enderecos?: Json
              p_filial_id: number
              p_meios_contato?: Json
              p_nome: string
              p_observacao?: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_contato_id: string
              p_dados_pf?: string
              p_dados_pj?: string
              p_empresa_id: string
              p_enderecos?: string
              p_filial_id: string
              p_meios_contato?: string
              p_nome?: string
              p_observacao?: string
            }
            Returns: boolean
          }
      fn_contatos_v2_upsert: {
        Args: { p_row: Json }
        Returns: {
          classificacao: string | null
          cpf_cnpj: string | null
          created_at: string
          empresa_id: string | null
          filial_id: string | null
          id: string
          nome_fantasia: string
          observacao: string | null
          responsavel_id: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "contatos_v2"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_criar_contato_completo:
        | {
            Args: {
              p_cpf_cnpj?: string
              p_dados_pf?: Json
              p_dados_pj?: Json
              p_empresa_id: number
              p_enderecos?: Json
              p_filial_id: number
              p_meios_contato?: Json
              p_nome: string
              p_observacao?: string
              p_tipo_pessoa: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_cpf_cnpj?: string
              p_dados_pf?: string
              p_dados_pj?: string
              p_empresa_id: string
              p_enderecos?: string
              p_filial_id: string
              p_meios_contato?: string
              p_nome: string
              p_observacao?: string
              p_tipo_pessoa: string
            }
            Returns: string
          }
        | {
            Args: {
              p_classificacao?: string
              p_cpf_cnpj?: string
              p_dados_pf?: Json
              p_dados_pj?: Json
              p_empresa_id?: string
              p_enderecos?: Json
              p_filial_id?: string
              p_meios_contato?: Json
              p_nome: string
              p_observacao?: string
              p_responsavel_id?: string
            }
            Returns: Json
          }
      fn_excluir_contato_logico:
        | { Args: { p_contato_id: string }; Returns: Json }
        | {
            Args: {
              p_contato_id: string
              p_empresa_id: string
              p_filial_id: string
            }
            Returns: boolean
          }
      fn_ler_contato_completo:
        | { Args: { p_contato_id: string }; Returns: Json }
        | {
            Args: {
              p_contato_id: string
              p_empresa_id: string
              p_filial_id: string
            }
            Returns: Json
          }
      fn_provisionar_nova_empresa: {
        Args: {
          p_admin_email?: string
          p_admin_nome?: string
          p_cnpj: string
          p_nome_empresa: string
        }
        Returns: Json
      }
      fn_register_user_with_cnpj_or_choice: {
        Args: {
          p_choice?: string
          p_cnpj?: string
          p_email: string
          p_nome: string
          p_nome_empresa?: string
          p_user_id: string
        }
        Returns: Json
      }
      generate_etiqueta_slug: { Args: { nome: string }; Returns: string }
      gerar_financeiro_compra: {
        Args: { compra_id_param: string }
        Returns: Json
      }
      gerar_titulos_honorarios: {
        Args: { honorario_id_param: string }
        Returns: Json
      }
      gerar_transacoes_de_contrato: {
        Args: { contrato_id_param: string }
        Returns: Json
      }
      get_agendas_with_contacts:
        | {
            Args: {
              limit_count?: number
              offset_count?: number
              responsavel_filter?: string
              solicitante_filter?: string
              status_filter?: Database["public"]["Enums"]["agenda_status"]
            }
            Returns: {
              created_at: string
              data_fim: string
              data_inicio: string
              descricao: string
              empresa_id: string
              filial_id: string
              id: string
              observacoes: string
              prioridade: Database["public"]["Enums"]["agenda_prioridade"]
              responsavel_email: string
              responsavel_nome: string
              solicitante_email: string
              solicitante_nome: string
              status: Database["public"]["Enums"]["agenda_status"]
              titulo: string
              updated_at: string
              user_id: string
            }[]
          }
        | {
            Args: {
              etiqueta_filter?: string
              limit_count?: number
              offset_count?: number
              responsavel_filter?: string
              solicitante_filter?: string
              status_filter?: Database["public"]["Enums"]["agenda_status"]
            }
            Returns: {
              created_at: string
              data_fim: string
              data_inicio: string
              descricao: string
              id: string
              observacoes: string
              prioridade: string
              responsavel_email: string
              responsavel_nome: string
              solicitante_email: string
              solicitante_nome: string
              status: Database["public"]["Enums"]["agenda_status"]
              titulo: string
              updated_at: string
              user_id: string
            }[]
          }
      get_client_ip: { Args: never; Returns: unknown }
      get_contact_secure_view: {
        Args: { contact_id: string }
        Returns: {
          ativo: boolean
          celular: string
          cpf_cnpj: string
          created_at: string
          email: string
          id: string
          nome_fantasia: string
          observacao: string
          telefone: string
          tipo_pessoa: string
        }[]
      }
      get_contacts_safe: {
        Args: { limit_count?: number; offset_count?: number }
        Returns: {
          ativo: boolean
          celular: string
          cpf_cnpj: string
          created_at: string
          email: string
          empresa_id: string
          filial_id: string
          id: string
          nome_fantasia: string
          observacao: string
          telefone: string
          tipo_pessoa: string
          updated_at: string
          user_id: string
        }[]
      }
      get_contacts_secure_enhanced: {
        Args: {
          export_purpose?: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          ativo: boolean
          celular: string
          cidade: string
          cpf_cnpj: string
          created_at: string
          email: string
          endereco: string
          estado: string
          id: string
          nome: string
          nome_fantasia: string
          observacoes: string
          telefone: string
          user_id: string
        }[]
      }
      get_contacts_ultra_secure: {
        Args: {
          export_purpose?: string
          limit_count?: number
          offset_count?: number
          require_justification?: string
        }
        Returns: {
          ativo: boolean
          bairro: string
          celular: string
          cep: string
          cidade: string
          complemento: string
          cpf_cnpj: string
          created_at: string
          data_nascimento: string
          email: string
          endereco: string
          estado: string
          id: string
          limite_credito: number
          nome: string
          nome_fantasia: string
          nome_mae: string
          numero: string
          observacoes: string
          telefone: string
          updated_at: string
          user_id: string
        }[]
      }
      get_contatos_masked_view: {
        Args: { limit_count?: number; offset_count?: number }
        Returns: {
          ativo: boolean
          bairro: string
          celular_masked: string
          cep: string
          cidade: string
          complemento: string
          cpf_cnpj_masked: string
          created_at: string
          data_nascimento_masked: string
          email_masked: string
          endereco: string
          estado: string
          id: string
          limite_credito_masked: number
          nome: string
          nome_fantasia: string
          nome_mae_masked: string
          numero: string
          observacoes: string
          telefone_masked: string
          updated_at: string
          user_id: string
        }[]
      }
      get_contexto_seguranca: {
        Args: never
        Returns: Database["public"]["CompositeTypes"]["contexto_seguranca"]
        SetofOptions: {
          from: "*"
          to: "contexto_seguranca"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_current_user_email: { Args: never; Returns: string }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_financeiro_saldo_a_realizar: {
        Args: { p_user_id?: string }
        Returns: {
          saldo_a_realizar: number
          total_a_pagar: number
          total_a_receber: number
        }[]
      }
      get_my_tenant_id: { Args: never; Returns: string }
      get_or_create_contato_padrao: {
        Args: { p_tenant_id: string; p_user_id: string }
        Returns: string
      }
      get_processo_anexos_consolidados: {
        Args: { p_processo_id?: string }
        Returns: {
          anexo_id: string
          arquivo_url: string
          contato_id: string
          contato_nome: string
          created_at: string
          origem: Database["public"]["Enums"]["origem_anexo"]
          processo_id: string
          titulo: string
        }[]
      }
      get_processo_with_parties: {
        Args: { processo_id_param: string }
        Returns: {
          partes: Json
          processo_data: Json
        }[]
      }
      get_saldo_conta: { Args: { conta_id: string }; Returns: number }
      get_smtp_credentials: {
        Args: { conta_id_param: string }
        Returns: {
          email: string
          id: string
          nome: string
          smtp_host: string
          smtp_pass_decrypted: string
          smtp_port: number
          smtp_user: string
          tls_ssl: boolean
        }[]
      }
      get_user_empresa_id: { Args: never; Returns: string }
      get_user_tenant_id: { Args: never; Returns: string }
      get_usuarios_sistema: {
        Args: never
        Returns: {
          email: string
          id: string
          nome: string
        }[]
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      has_role_secure:
        | {
            Args: { _role: Database["public"]["Enums"]["app_role"] }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      has_write_role: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_superadmin:
        | { Args: never; Returns: boolean }
        | { Args: { user_email: string }; Returns: boolean }
      listar_notas_registro_v1: {
        Args: { p_modulo: string; p_registro_id: string }
        Returns: {
          autor_nome: string
          conteudo: Json
          created_at: string
          id: string
          user_id: string
        }[]
      }
      log_auth_attempt: {
        Args: {
          email?: string
          error_message?: string
          event_type: string
          ip_addr?: unknown
          success?: boolean
          user_agent_str?: string
        }
        Returns: undefined
      }
      log_enhanced_security_event: {
        Args: {
          event_description: string
          event_type: string
          metadata?: Json
          risk_level?: string
        }
        Returns: undefined
      }
      log_rls_failure: {
        Args: { operation: string; table_name: string; user_id_param?: string }
        Returns: undefined
      }
      log_security_event: {
        Args: { event_description: string; event_type: string; metadata?: Json }
        Returns: undefined
      }
      log_sensitive_data_access: {
        Args: {
          access_type?: string
          accessed_fields: string[]
          record_id: string
          table_name: string
        }
        Returns: undefined
      }
      mask_cpf_cnpj: { Args: { cpf_cnpj: string }; Returns: string }
      mask_email: { Args: { email: string }; Returns: string }
      mask_phone: { Args: { phone: string }; Returns: string }
      migrar_dados_whatsapp: { Args: never; Returns: undefined }
      monitor_bulk_access: {
        Args: {
          operation_type: string
          record_count?: number
          user_id_param: string
        }
        Returns: undefined
      }
      monitor_contact_data_breach: { Args: never; Returns: undefined }
      monitor_data_export: {
        Args: {
          export_type: string
          record_count: number
          table_names: string[]
        }
        Returns: Json
      }
      monitor_whatsapp_token_access: {
        Args: { account_id: string; operation_type: string }
        Returns: undefined
      }
      saas_list_empresas_com_assinatura: {
        Args: never
        Returns: {
          cnpj: string
          dia_vencimento: number
          empresa_uuid: string
          nome_fantasia: string
          plano: string
          razao_social: string
          status: string
          updated_at: string
          valor: number
        }[]
      }
      security_health_check: { Args: never; Returns: Json }
      set_context: {
        Args: { p_empresa: string; p_filial: string }
        Returns: undefined
      }
      set_context_uuid: {
        Args: { p_empresa: string; p_filial: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sp_biblioteca_set_etiquetas: {
        Args: { p_modelo_id: string; p_nomes: string[] }
        Returns: undefined
      }
      trocar_etiqueta_de_grupo: {
        Args: {
          p_etiqueta_adicionar_id: string
          p_grupo: string
          p_item_id: string
          p_modulo: string
        }
        Returns: undefined
      }
      unaccent: { Args: { "": string }; Returns: string }
      upsert_agenda_transacional: { Args: { payload: Json }; Returns: string }
      upsert_contato_v2_transacional: {
        Args: {
          p_contato_id: string
          p_cpf_cnpj: string
          p_dados_pf: Json
          p_dados_pj: Json
          p_enderecos: Json
          p_etiquetas: Json
          p_meios_contato: Json
          p_nome: string
          p_observacao: string
        }
        Returns: Json
      }
      validate_contact_operation: {
        Args: { contact_data?: Json; operation_type: string }
        Returns: Json
      }
      validate_contatos_access: {
        Args: {
          access_type: string
          record_id?: string
          user_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      validate_jwt_role: {
        Args: {
          jwt_user_id: string
          required_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: Json
      }
      validate_password_strength: { Args: { password: string }; Returns: Json }
      validate_processo_by_etiqueta: {
        Args: {
          p_cliente_principal_id: string
          p_etiqueta: Database["public"]["Enums"]["etiqueta_processo"]
          p_numero_processo: string
          p_titulo: string
        }
        Returns: Json
      }
      validate_status_change: {
        Args: {
          atendimento_id: string
          new_responsavel?: string
          new_status: Database["public"]["Enums"]["status_atendimento"]
        }
        Returns: Json
      }
      validate_strong_password: { Args: { password: string }; Returns: Json }
      validate_webhook_signature: {
        Args: { app_secret: string; payload: string; signature: string }
        Returns: boolean
      }
      validate_webhook_signature_enhanced: {
        Args: {
          app_secret: string
          payload: string
          signature: string
          webhook_source?: string
        }
        Returns: Json
      }
    }
    Enums: {
      agenda_prioridade: "baixa" | "media" | "alta" | "urgente"
      agenda_status: "analise" | "a_fazer" | "fazendo" | "feito"
      app_role: "admin" | "user"
      contrato_status:
        | "rascunho"
        | "enviado"
        | "aprovado"
        | "assinado"
        | "cancelado"
      contrato_tipo:
        | "honorarios"
        | "acordo_judicial"
        | "compra_venda"
        | "outros"
      email_status: "pendente" | "enviado" | "erro"
      etiqueta_processo:
        | "interno"
        | "administrativo"
        | "extrajudicial"
        | "judicial"
      honorario_evento_tipo:
        | "criado"
        | "modelo_aplicado"
        | "valor_alterado"
        | "aprovado"
        | "assinado"
        | "titulo_gerado"
        | "exito_recebido"
      honorario_parcela_status: "pendente" | "vencida" | "paga" | "cancelada"
      honorario_status: "rascunho" | "aprovado" | "assinado" | "cancelado"
      honorario_tipo: "inicial" | "mensal" | "exito" | "outros"
      movimentacao_tipo:
        | "decisao"
        | "despacho"
        | "audiencia"
        | "juntada"
        | "peticao"
        | "sentenca"
        | "recurso"
        | "outros"
      natureza_patrimonio: "DIREITO" | "OBRIGACAO"
      origem_anexo: "processo" | "contato"
      papel_parte:
        | "cliente"
        | "parte_contraria"
        | "testemunha"
        | "advogado"
        | "juizo"
        | "outro"
      perfil_role: "admin" | "advogado" | "financeiro" | "cliente"
      produto_status: "rascunho" | "ativo" | "inativo" | "arquivado"
      qualificacao_parte:
        | "autor"
        | "reu"
        | "testemunha"
        | "juizo"
        | "advogado"
        | "ministerio_publico"
        | "terceiro_interessado"
        | "perito"
        | "outros"
        | "cliente"
        | "contrario"
        | "falecido"
      situacao_processo: "em_andamento" | "arquivado" | "encerrado"
      status_atendimento: "aberto" | "pendente" | "resolvido"
      status_patrimonio: "ATIVO" | "INATIVO"
      tipo_conta_financeira:
        | "Conta Corrente"
        | "Conta Poupança"
        | "Caixa Físico"
        | "Investimento"
        | "Outros"
    }
    CompositeTypes: {
      contexto_seguranca: {
        tenant_id: string | null
        empresa_id: string | null
        filial_id: string | null
        user_id: string | null
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
    Enums: {
      agenda_prioridade: ["baixa", "media", "alta", "urgente"],
      agenda_status: ["analise", "a_fazer", "fazendo", "feito"],
      app_role: ["admin", "user"],
      contrato_status: [
        "rascunho",
        "enviado",
        "aprovado",
        "assinado",
        "cancelado",
      ],
      contrato_tipo: [
        "honorarios",
        "acordo_judicial",
        "compra_venda",
        "outros",
      ],
      email_status: ["pendente", "enviado", "erro"],
      etiqueta_processo: [
        "interno",
        "administrativo",
        "extrajudicial",
        "judicial",
      ],
      honorario_evento_tipo: [
        "criado",
        "modelo_aplicado",
        "valor_alterado",
        "aprovado",
        "assinado",
        "titulo_gerado",
        "exito_recebido",
      ],
      honorario_parcela_status: ["pendente", "vencida", "paga", "cancelada"],
      honorario_status: ["rascunho", "aprovado", "assinado", "cancelado"],
      honorario_tipo: ["inicial", "mensal", "exito", "outros"],
      movimentacao_tipo: [
        "decisao",
        "despacho",
        "audiencia",
        "juntada",
        "peticao",
        "sentenca",
        "recurso",
        "outros",
      ],
      natureza_patrimonio: ["DIREITO", "OBRIGACAO"],
      origem_anexo: ["processo", "contato"],
      papel_parte: [
        "cliente",
        "parte_contraria",
        "testemunha",
        "advogado",
        "juizo",
        "outro",
      ],
      perfil_role: ["admin", "advogado", "financeiro", "cliente"],
      produto_status: ["rascunho", "ativo", "inativo", "arquivado"],
      qualificacao_parte: [
        "autor",
        "reu",
        "testemunha",
        "juizo",
        "advogado",
        "ministerio_publico",
        "terceiro_interessado",
        "perito",
        "outros",
        "cliente",
        "contrario",
        "falecido",
      ],
      situacao_processo: ["em_andamento", "arquivado", "encerrado"],
      status_atendimento: ["aberto", "pendente", "resolvido"],
      status_patrimonio: ["ATIVO", "INATIVO"],
      tipo_conta_financeira: [
        "Conta Corrente",
        "Conta Poupança",
        "Caixa Físico",
        "Investimento",
        "Outros",
      ],
    },
  },
} as const
