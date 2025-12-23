# CHANGELOG

## [2.11.0] - 2025-11-14

### 🔒 Contatos V2 – Hardening de Produção

#### ✅ Correções Aplicadas

**1. Multi-Tenant e Isolamento**
- ✅ Padronização `tenant_id = empresa_id` em toda a tabela `contatos_v2`
- ✅ Remoção de constraint incorreta `contatos_v2_tenant_id_fkey`
- ✅ RLS por empresa (tenant) em vez de por usuário
- ✅ Policies granulares (SELECT/INSERT/UPDATE/DELETE separadas)
- ✅ RLS alinhado em TODAS as tabelas relacionadas:
  - `contato_enderecos`
  - `contato_meios_contato` (CRÍTICO para telefonia)
  - `contato_pf`
  - `contato_pj`
  - `contato_financeiro_config`
  - `contato_patrimonios`

**2. Segurança e Auditoria**
- ✅ Nova função RPC `excluir_contato_seguro()`:
  - Valida permissões de tenant
  - Registra auditoria em `security_audit_log` ANTES da exclusão
  - Exclui registros relacionados (cascade manual)
  - Impede vazamento de dados entre tenants
- ✅ Todos os deletes agora usam RPC (nenhum DELETE direto no front)
- ✅ Hooks refatorados para respeitar isolamento

**3. Hooks - Refatoração Completa**
- ✅ **`useContatos.tsx` DEPRECADO**:
  - Marcado como deprecado com warnings
  - Mantido apenas para leitura (compatibilidade)
  - `createContact/updateContact/deleteContact` lançam erro
  - Documentação clara para migrar para `useContatosV2`
  
- ✅ **`useContatosV2.tsx` HARDENED**:
  - `updateContact()`: Filtra campos sensíveis (`tenant_id`, `empresa_id`, `user_id`)
  - `deleteContact()`: Usa RPC `excluir_contato_seguro` (com auditoria)
  - `createContactTransactional()`: Já usava RPC (mantido)

- ✅ **`useContatoCompleto.tsx` e `useContatoPjTransacional.tsx`**:
  - Validados como CORRETOS (usam `setServerContext` + RPCs)
  - Nenhuma alteração necessária

**4. Páginas e Componentes**
- ✅ **`src/pages/Contatos.tsx`**:
  - `handleContactDelete()` substituído por RPC seguro
  - Estatísticas carregadas de `vw_contatos_compat` (somente leitura)
  
- ✅ **`src/components/contatos/ContatosGrid.tsx`**:
  - Já estava correto (usa `contatos_v2` com joins)
  - Nenhuma alteração necessária

- ✅ **Edge Function `telefonia-buscar-contato`**:
  - Validada como segura (usa `SUPABASE_ANON_KEY` + RLS)
  - RLS em `contato_meios_contato` garante isolamento por tenant

**5. Documentação**
- ✅ Comentários SQL em tabelas e colunas explicando o modelo
- ✅ TSDoc em hooks deprecados
- ✅ Atualização de `SYSTEM_STATE.md`
- ✅ Este `CHANGELOG.md`

#### 📦 Arquivos Modificados
- **SQL**: `supabase/migrations/[timestamp]_contatos_v2_hardening.sql`
- **Hooks**: 
  - `src/hooks/useContatos.tsx` (DEPRECADO)
  - `src/hooks/useContatosV2.tsx` (HARDENED)
- **Páginas**: `src/pages/Contatos.tsx`
- **Docs**: `Docs/SYSTEM_STATE.md`, `Docs/CHANGELOG.md`

#### 🎯 Checklist de Segurança

- [x] RLS por `tenant_id` / `empresa_id` em todas as tabelas de contatos
- [x] RBAC por papel (Admin/Advogado/Cliente) alinhado com o resto do sistema
- [x] Auditoria de criação/edição/exclusão de contatos e dados relacionados
- [x] Nenhuma referência a colunas inexistentes (`atualizado_em`, `data_atualizacao`) nos scripts ativos
- [x] Fluxo de telefonia respeita tenant e não vaza dados
- [x] UI de contatos consistente, em PT-BR, com validações adequadas
- [x] Hooks legados deprecados, novos hooks seguros implementados
- [x] Nenhum INSERT/UPDATE/DELETE direto em `contatos_v2` no frontend
- [x] Todas as mutações passam por RPCs com validação de tenant

#### 🔄 Compatibilidade
- ✅ `useContatos.tsx` mantido para compatibilidade de leitura
- ✅ Views `vw_contatos_compat` e `vw_contatos_completo` inalteradas
- ✅ Fluxos de criação/edição via `useContatoCompleto` não afetados
- ✅ Componentes de UI (`ContatosTabs`, `ContatoHeader`, etc.) não precisam mudanças

#### ⚠️ Breaking Changes
- ❌ **Nenhum breaking change** - mudanças internas apenas
- ⚠️ `useContatos.createContact/updateContact/deleteContact` agora lançam erro (já deviam usar `useContatosV2`)

#### 📚 Modelo Final

```
┌─────────────────────────────────────────────┐
│ Modelo Multi-Tenant de Contatos            │
├─────────────────────────────────────────────┤
│                                             │
│  tenant_id = empresa_id (isolamento)        │
│  user_id = criador (auditoria)              │
│                                             │
│  RLS Policies:                              │
│  ├─ SELECT: tenant IN profiles.empresa_id   │
│  ├─ INSERT: tenant IN profiles.empresa_id   │
│  │           AND user_id = auth.uid()       │
│  ├─ UPDATE: tenant IN profiles.empresa_id   │
│  └─ DELETE: tenant IN profiles.empresa_id   │
│                                             │
│  Fluxos Seguros:                            │
│  ├─ Criar: useContatosV2.                   │
│  │          createContactTransactional()    │
│  ├─ Editar: useContatosV2.updateContact()   │
│  │           (filtra campos sensíveis)      │
│  └─ Excluir: useContatosV2.deleteContact()  │
│              (RPC + auditoria)              │
│                                             │
└─────────────────────────────────────────────┘
```

---

## [2.10.1] - 2025-11-11

### 🎨 Biblioteca Jurídica V2 - Editor Enhanced com Tiptap

#### ✅ Funcionalidades Implementadas

1. **Editor Rico Tiptap**
   - ✅ Substituição do contenteditable básico por Tiptap
   - ✅ Toolbar ampliada: negrito, itálico, sublinhado, títulos H1-H4
   - ✅ Alinhamento de texto (esquerda, centro, direita)
   - ✅ Listas ordenadas e não-ordenadas
   - ✅ Linha horizontal para separação de seções

2. **Tabelas Complexas**
   - ✅ Inserção de tabelas 3x3 com cabeçalho
   - ✅ Adicionar/remover colunas e linhas dinamicamente
   - ✅ Tabelas redimensionáveis
   - ✅ Estilo visual consistente com design system

3. **Recursos Avançados**
   - ✅ Sumário automático gerado a partir dos títulos
   - ✅ Links internos para navegação rápida no documento
   - ✅ Geração e inserção de QRCode (data URL)
   - ✅ Exportação para PDF (html2canvas + jsPDF)
   - ✅ Exportação para DOCX (html-to-docx)

4. **Visual Law**
   - ✅ Presets de tema: oficial, humanizado, simplificado
   - ✅ Cabeçalho/rodapé personalizáveis
   - ✅ Impressão profissional com numeração de páginas
   - ✅ CSS dedicado para Visual Law

#### 📦 Arquivos Criados/Modificados
- **NOVO**: `src/components/biblioteca/EditorCoreTiptap.tsx` - Editor Tiptap completo
- **NOVO**: `src/styles/visual-law.css` - Estilos Visual Law e tabelas
- **Atualizado**: `src/components/biblioteca/EditorModeloV2.tsx` - Integração com Tiptap
- **Atualizado**: `src/main.tsx` - Import do CSS Visual Law
- **Atualizado**: `src/config/features.ts` - Flag FEATURE_BIBLIOTECA_V2_ENHANCED
- **Atualizado**: `Docs/BIBLIOTECA_V2.md` - Documentação completa
- **Atualizado**: `Docs/CHANGELOG.md` - Este changelog

#### 📚 Dependências Adicionadas
```
@tiptap/react @tiptap/starter-kit @tiptap/extension-underline 
@tiptap/extension-text-align @tiptap/extension-heading @tiptap/extension-link 
@tiptap/extension-image @tiptap/extension-table @tiptap/extension-table-row 
@tiptap/extension-table-cell @tiptap/extension-table-header 
@tiptap/extension-placeholder @tiptap/extension-horizontal-rule 
@tiptap/extension-character-count html-to-docx jspdf html2canvas qrcode
```

#### 🔄 Compatibilidade
- ✅ API `html/setHtml` preservada (100% retrocompatível)
- ✅ Sem mudanças no banco de dados
- ✅ RLS e auditoria mantidos intactos
- ✅ Drop-in replacement do editor anterior

#### 🎯 Impacto
| Funcionalidade | Antes | Depois |
|---------------|-------|--------|
| **Editor** | contenteditable básico | Tiptap rico com extensões |
| **Tabelas** | ❌ Não suportado | ✅ Tabelas dinâmicas |
| **Exportação** | ❌ Não disponível | ✅ PDF + DOCX nativos |
| **QRCode** | ❌ Não disponível | ✅ Geração e inserção |
| **Sumário** | ❌ Manual | ✅ Automático |
| **Visual Law** | ❌ Não disponível | ✅ 3 presets profissionais |

---

## [2.10.0] - 2025-11-10

### 🎯 Biblioteca Jurídica V2 - Refatoração Completa

#### ✅ Funcionalidades Implementadas

1. **Nova Arquitetura de Modelos**
   - ✅ Tabela `biblioteca_modelos_v2` com estrutura simplificada
   - ✅ Taxonomia 100% via sistema de Etiquetas (sem campos categoria/tipo/status)
   - ✅ Soft delete via `data_exclusao_logica`
   - ✅ RLS por `tenant_id` em todas as operações
   - ✅ Busca full-text em português (pg_trgm + unaccent)
   - ✅ Índices otimizados para performance

2. **Editor Avançado**
   - ✅ Editor contenteditable com HTML
   - ✅ Barra de ferramentas: negrito, itálico, sublinhado, listas, alinhamento
   - ✅ Gerenciamento de etiquetas inline
   - ✅ Validação de entrada (título obrigatório)
   - ✅ Interface estável e compatível com Tailwind + shadcn

3. **Sistema de Busca e Filtros**
   - ✅ Busca por título, descrição e conteúdo HTML
   - ✅ Filtro por etiquetas (client-side)
   - ✅ VIEW `vw_biblioteca_grid` com etiquetas agregadas
   - ✅ Performance otimizada com índices GIN

4. **RPC e Automações**
   - ✅ `sp_biblioteca_set_etiquetas()` para gerenciar vínculos
   - ✅ Criação automática de etiquetas inexistentes
   - ✅ Trigger de auditoria completa (`fn_audit_biblioteca_v2`)
   - ✅ Trigger de busca automática (`fn_biblioteca_v2_update_search_vector`)

5. **Frontend e Rotas**
   - ✅ Hook `useBibliotecaV2` com métodos CRUD
   - ✅ Componente `EditorModeloV2` para criar/editar
   - ✅ Componente `ModelosGrid` para listagem
   - ✅ Rotas aninhadas: `/biblioteca/*` (novo, editar, visualizar)
   - ✅ Feature flag `BIBLIOTECA_V2` habilitada

#### ⚠️ Breaking Changes
- ❌ Tabelas antigas removidas: `biblioteca_modelos`, `biblioteca_grupos`
- ❌ Hook legado `useBiblioteca` mantido mas deprecado (com @ts-nocheck)
- ❌ Sem migração de dados antigos (decisão do cliente)

#### 📦 Arquivos Criados/Modificados
- `src/hooks/useBibliotecaV2.ts` (novo)
- `src/components/biblioteca/EditorModeloV2.tsx` (novo)
- `src/components/biblioteca/ModelosGrid.tsx` (novo)
- `src/pages/Biblioteca.tsx` (refatorado com rotas aninhadas)
- `src/hooks/useAjuda.tsx` (atualizado para V2)
- `src/config/features.ts` (flag BIBLIOTECA_V2)
- `src/App.tsx` (rotas simplificadas)

#### 🔒 Segurança
- ✅ RLS por `tenant_id` em SELECT/INSERT/UPDATE/DELETE
- ✅ Auditoria automática via `security_audit_log`
- ✅ Soft delete (não remove fisicamente)
- ✅ Validação de entrada client-side

---

## [2.9.0] - 2025-10-25

### 🚀 Refatoração do Provisionamento SaaS V1 - Trial 30 Dias + Login CNPJ

#### ✅ Funcionalidades Implementadas

1. **Provisionamento Simplificado de Empresas**
   - ✅ Formulário reduzido para apenas 2 campos: Nome da Empresa + CNPJ
   - ✅ Criação automática de Trial de 30 dias (sem necessidade de configuração manual)
   - ✅ Função RPC `fn_provisionar_nova_empresa` com transação atômica
   - ✅ Validação de Super Admin antes de provisionar
   - ✅ Criação automática de filial matriz para RLS
   - ✅ Auditoria completa de todas as operações

2. **Fluxo de Primeiro Acesso**
   - ✅ Usuários admin criados com credenciais baseadas no CNPJ (email/senha)
   - ✅ Redirecionamento automático para `/configuracao-inicial` no primeiro login
   - ✅ Tela de configuração obrigatória: Nome completo + Nova senha
   - ✅ Flag `eh_primeiro_acesso` em `profiles` para controle
   - ✅ Prevenção de acesso ao sistema até conclusão da configuração

3. **Marcação de Plano Trial**
   - ✅ Nova coluna `eh_trial` na tabela `saas_planos`
   - ✅ Campo visual no formulário de planos (Switch "Plano Trial")
   - ✅ Validação automática: RPC busca plano Trial antes de provisionar
   - ✅ Mensagem de erro clara se plano Trial não estiver configurado

4. **Segurança e Validação**
   - ✅ Validação de CNPJ no frontend e backend
   - ✅ Verificação de duplicidade (CNPJ já cadastrado)
   - ✅ Permissões: Apenas Super Admins podem provisionar empresas
   - ✅ Credenciais temporárias exibidas ao admin após provisionamento

#### 📁 Arquivos Criados/Modificados

**NOVO**:
- `src/pages/ConfiguracaoInicial.tsx` - Tela de primeiro acesso
- `supabase/migrations/YYYYMMDDHHMMSS_refatoracao_provisionamento_saas_v1.sql` - Schema + RPC

**Atualizado**:
- `src/components/admin/saas/forms/EmpresasForm.tsx` - Formulário simplificado
- `src/components/admin/saas/forms/PlanoForm.tsx` - Campo `eh_trial`
- `src/hooks/useAuth.tsx` - Lógica de redirecionamento primeiro acesso
- `src/App.tsx` - Rota `/configuracao-inicial`
- `Docs/CHANGELOG.md` - Documentação da versão
- `Docs/SYSTEM_STATE.md` - Atualização de status

#### 🔄 Fluxo Completo

1. **Super Admin cria empresa**:
   - Acessa `/admin/saas/empresas`
   - Preenche nome e CNPJ
   - Sistema cria: Empresa → Filial → Assinatura Trial → Credenciais

2. **Admin da empresa faz primeiro login**:
   - Login: `<CNPJ>@cnpj.local` / Senha: `<CNPJ>`
   - Sistema detecta `eh_primeiro_acesso = TRUE`
   - Redireciona automaticamente para `/configuracao-inicial`
   - Define nome e nova senha
   - Sistema marca `eh_primeiro_acesso = FALSE`
   - Acesso liberado ao sistema

3. **Logins subsequentes**:
   - Login com email/senha definidos
   - Acesso direto ao dashboard

#### 🔐 Validações de Segurança

- Apenas Super Admins podem provisionar empresas (validação RPC)
- CNPJ único por empresa (validação de duplicidade)
- Plano Trial obrigatoriamente configurado (erro se não existir)
- Primeiro acesso obrigatório antes de usar o sistema
- Senhas temporárias devem ser trocadas imediatamente

#### 📊 Impacto

| Métrica | Antes | Depois |
|---------|-------|--------|
| **Campos no formulário** | 10+ campos | 2 campos |
| **Tempo de provisionamento** | ~5 min | ~30 seg |
| **Plano Trial** | Manual | Automático (30 dias) |
| **Primeiro acesso** | ❌ Sem controle | ✅ Obrigatório |
| **Segurança credenciais** | Padrão fixo | ✅ Troca obrigatória |

---

## [2.8.0] - 2025-10-13

### 🎯 Refatoração do Módulo Agenda V2 - Centralização de Participantes

#### ✅ Problema Resolvido
- **Redundância de UI**: Campos "Responsável" e "Solicitante" removidos da aba "Agenda"
- **Bug de Persistência**: Corrigida inconsistência na consulta de "Partes" após salvamento
- **Fonte Única da Verdade**: Aba "Partes" agora é o único local para gerenciar participantes

#### 🔧 Mudanças Técnicas

1. **Backend (`useAgendaV2.ts`)**
   - Query de `loadAgenda` alinhada com formato de dados esperado
   - Consulta direta à tabela `contatos_v2` com campos necessários
   - Eliminada inconsistência de estrutura de dados

2. **Frontend (`AgendaTab.tsx`)**
   - Removidos campos `contato_responsavel_id` e `contato_solicitante_id` do schema
   - Limpeza de imports não utilizados (`User`, `useContatos`, `TagSelector`)
   - Interface simplificada e mais clara

#### 📊 Impacto
- ✅ UI mais limpa e objetiva
- ✅ Dados de partes persistem corretamente após salvamento
- ✅ Recarregamento de formulário exibe partes salvas
- ✅ Alinhamento total entre banco de dados e estado local

#### 📁 Arquivos Modificados
- `src/hooks/useAgendaV2.ts` - Harmonização de queries
- `src/components/agenda/v2/tabs/AgendaTab.tsx` - Remoção de campos redundantes
- `Docs/CHANGELOG.md` - Documentação da mudança
- `Docs/SYSTEM_STATE.md` - Atualização de status do módulo

---

## [2.7.0] - 2025-10-06

### 🎯 Sistema Completo de Edição de Compras + Correção de Data Local

#### ✅ Funcionalidades Implementadas

1. **Editor Completo de Compras (`CompraEditor`)**
   - ✅ Edição total antes da aprovação (tipo, data, valor, observações)
   - ✅ Bloqueio automático pós-aprovação com validação de status
   - ✅ Interface visual clara indicando liberação/bloqueio
   - ✅ Botões contextuais: Salvar e Aprovar (apenas quando pendente)
   - ✅ Validação de permissões em tempo real

2. **Correção de Data/Hora Local (Fuso Horário Brasil)**
   - ✅ Backend (`processar-nfe`) corrigido para timezone `America/Sao_Paulo`
   - ✅ `created_at` e `updated_at` com horário local correto
   - ✅ Exibição formatada: "06/10/2025 às 14:12"
   - ✅ Fim da defasagem UTC (não mais registra ontem)

3. **Gestão de Status com Feedback Visual**
   - ✅ Badge indicador de status: 🕓 Pendente (Edição liberada) / 🔒 Aprovada (Bloqueada)
   - ✅ Aviso amarelo quando compra está bloqueada
   - ✅ Data/hora de aprovação registrada e exibida
   - ✅ Botão "Aprovar Compra" integrado ao componente de edição

4. **Interface Otimizada**
   - ✅ Componente reutilizável `CompraEditor` com card dedicado
   - ✅ Exibição de "Registrada em:" com data local
   - ✅ Layout responsivo e organizado
   - ✅ Toasts informativos para cada ação

#### 📁 Arquivos Modificados/Criados

- **NOVO**: `src/components/compras/CompraEditor.tsx` - Componente de edição e aprovação
- **Atualizado**: `supabase/functions/processar-nfe/index.ts` - Correção de timezone
- **Atualizado**: `src/pages/CompraDetalhes.tsx` - Integração do editor
- **Atualizado**: `Docs/CHANGELOG.md` - Documentação completa

#### 🔄 Resultado Final

| Funcionalidade | Antes | Depois |
|---------------|-------|--------|
| **Data de registro** | UTC-3 defasado (ontem) | Local correto (ex: 06/10/2025 14:12) |
| **Edição pendente** | ❌ Bloqueada | ✅ Totalmente liberada |
| **Aprovação** | 🧩 Parcial | ✅ Bloqueia + data/hora registrada |
| **Validação visual** | ❌ Ausente | ✅ Status claro + avisos |
| **Auditoria** | Parcial | ✅ Sincronizada com timezone local |

---

## [2.6.1] - 2025-10-07

### 📦 Relatório de Estoque Dedicado

#### ✨ Nova Rota `/relatorios/estoque`
- Página dedicada ao relatório de estoque atual
- Visualização consolidada por produto e localização
- Exibição de quantidade, custo médio e valor total
- Cálculo automático do valor total do estoque
- Botão de exportação CSV para análises externas
- Integração completa com dados fiscais (NCM, CFOP)

#### 🔄 Melhorias de Navegação
- Novo botão "Relatório de Estoque" na página de compras
- Separação clara entre relatórios de estoque e outros relatórios
- Acesso direto via menu e páginas relacionadas

#### 📊 Funcionalidades
- Exportação CSV com data no nome do arquivo
- Ordenação por nome do produto
- Exibição de código interno, descrição e localização
- Valores formatados em moeda brasileira (R$)
- Loading states e mensagens de erro apropriadas

---

## [2.5.1] - 2025-10-06

### 🚀 Complemento: Importação IA/OCR + Aprovação + Relatórios

#### 🧠 Importação Automática de NF-e
- Edge function `processar-nfe` para leitura de XML/PDF
- Extração automática de fornecedor, produtos, totais e parcelas
- Componente `ImportarNfeDialog` com barra de progresso
- Validação e criação automática de fornecedor se não existir
- Log de auditoria completo da importação

#### ✅ Fluxo de Aprovação
- Página de detalhes de compra (`/compras/[id]`)
- Botão "Aprovar Compra" com confirmação
- Bloqueio de edição pós-aprovação
- Geração automática de transações financeiras
- Atualização de estoque e custo médio

#### 📊 Relatórios Fiscais
- Nova página `/relatorios/compras`
- Relatório de estoque atual por produto
- Relatório de movimentações de estoque
- Análise de compras por fornecedor
- Identificação de divergências fiscais (NCM/CFOP)

#### 🔐 Auditoria Visual
- Tab de auditoria na página de detalhes
- Visualização de logs de ações
- Rastreamento completo de alterações

---

## [2.5.0] - 2025-10-06

### ✨ Novo Módulo: Compras + Estoque + Fiscal

#### 🗄️ Banco de Dados
- Criadas 8 novas tabelas:
  - `produtos` - Catálogo de produtos e serviços com controle fiscal
  - `produtos_codigos_alternativos` - Códigos de fornecedores e fabricantes
  - `estoque_localizacoes` - Locais de armazenamento
  - `estoque_movimentacoes` - Entradas, saídas e transferências
  - `estoque_saldos` - Saldos consolidados por produto/local
  - `compras` - Notas fiscais de entrada
  - `compras_itens` - Itens das notas fiscais
  - `compras_parcelas` - Duplicatas e contas a pagar

#### 🔐 Segurança e Integridade
- RLS implementado em todas as tabelas com isolamento por tenant
- Trigger de auditoria para todas as operações de compra
- Trigger automático de atualização de estoque com custo médio ponderado (CMP)
- Função `gerar_financeiro_compra()` para integração automática com contas a pagar

#### 🎨 Interface Frontend
- **Nova página /compras**: Listagem de notas fiscais com filtros e aprovação
- **Nova página /produtos**: Catálogo de produtos com cadastro rápido
- **Nova página /estoque**: Visualização de saldos e movimentações
- 3 novos hooks customizados: `useCompras`, `useProdutos`, `useEstoque`
- Novos itens no menu lateral: Compras, Produtos e Estoque

#### 🔗 Integrações
- Link automático entre Compras e Financeiro (contas a pagar)
- Vínculo com Contatos (fornecedores)
- Controle fiscal: NCM, CFOP, CST, ICMS, PIS, COFINS, IPI

#### 📊 Recursos Implementados
- Custo médio ponderado automático
- Rastreabilidade de movimentações por documento/origem
- Suporte a múltiplas localizações de estoque
- Status de compra: pendente, aprovada, cancelada
- Geração automática de títulos financeiros após aprovação

---
