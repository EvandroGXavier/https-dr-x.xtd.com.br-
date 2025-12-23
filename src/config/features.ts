export const FEATURES = {
  PROCESSOS_V1: true,
  HONORARIOS_V1: true,
  AGENDA_V1: true,
  AGENDA_V2: true, // Nova Agenda V2 com fluxos e abas
  TAREFAS_V1: true,
  NOTAS_V1: true,
  SAAS_V1: true, // Feature SaaS habilitada
  CONTATOS_V2: true, // Nova arquitetura mestre-detalhe para contatos
  CONTATOS_V2_MIGRATION: true, // Migração compatível com VIEW contatos
  CONTATOS_V2_FIX: true, // Correções críticas para o módulo de contatos
  SAAS_CORE_V1: true, // SaaS Core multi-tenant/multi-branch
  SAAS_CONTEXT_V1: true, // Context switching entre empresas/filiais
  LINK_AGENDA_EM_CONTATOS: true, // Links para navegar do Contato para a Agenda
  LINK_PROCESSOS_EM_CONTATOS: true, // Links para navegar do Contato para Processos
  LINK_FINANCEIRO_EM_CONTATOS: true, // Links para navegar do Contato para Financeiro
  INTEGRACAO_JUDICIAL_V1: true, // Módulo de integração judiciária (consulta DataJud)
  PETICIONAMENTO_MNI_V1: false, // Peticionamento eletrônico (futuro)
  WHATSAPP_V2: true, // Módulo de atendimento WhatsApp (Sistema Novo)
  PROCESSO_FUNIL_V1: true, // Funil de atendimento com etiquetas de grupo
  COMPRAS_ENHANCED_V1: true, // Compras com validação hash, bloqueio pós-aprovação e auditoria
  VENDAS_V1: true, // Módulo de vendas completo
  DEBUG_PANEL: false, // Painel de debug (oculto por padrão)
  BIBLIOTECA_V2: true, // Biblioteca Jurídica V2 habilitada
  FEATURE_BIBLIOTECA_V2_ENHANCED: true, // Editor Tiptap com tabelas, QRCode, PDF/DOCX
} as const;